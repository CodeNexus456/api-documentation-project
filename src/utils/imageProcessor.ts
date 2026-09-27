export interface ImageProcessOptions {
  tolerance: number; // 5 to 80
  feather: number; // 0 to 10
  defringe: number; // 0 to 100
  sampleBg?: { r: number; g: number; b: number };
}

export interface ProcessedImageItem {
  id: string;
  name: string;
  originalUrl: string;
  originalSize: number;
  width: number;
  height: number;
  editedUrl?: string;
  editedBlob?: Blob;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

/**
 * Samples the 4 corners and borders of an image to automatically detect background color.
 */
export function detectBackgroundColor(ctx: CanvasRenderingContext2D, width: number, height: number): { r: number; g: number; b: number } {
  const samplePoints = [
    { x: 2, y: 2 },
    { x: width - 3, y: 2 },
    { x: 2, y: height - 3 },
    { x: width - 3, y: height - 3 },
    { x: Math.floor(width / 2), y: 2 },
    { x: 2, y: Math.floor(height / 2) },
    { x: width - 3, y: Math.floor(height / 2) },
    { x: Math.floor(width / 2), y: height - 3 },
  ];

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  samplePoints.forEach((pt) => {
    if (pt.x >= 0 && pt.x < width && pt.y >= 0 && pt.y < height) {
      const pixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
      rSum += pixel[0];
      gSum += pixel[1];
      bSum += pixel[2];
      count++;
    }
  });

  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
}

/**
 * High-performance offscreen canvas background removal with anti-fringing halo suppression
 */
export async function removeBackgroundFromImage(
  imageElement: HTMLImageElement,
  options: ImageProcessOptions = { tolerance: 30, feather: 2, defringe: 65 }
): Promise<{ url: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    try {
      const width = imageElement.naturalWidth || imageElement.width;
      const height = imageElement.naturalHeight || imageElement.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Canvas 2D context not supported');
      }

      ctx.drawImage(imageElement, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Sample or use provided background color
      const bg = options.sampleBg || detectBackgroundColor(ctx, width, height);
      const targetR = bg.r;
      const targetG = bg.g;
      const targetB = bg.b;

      const tolerance = Math.max(2, options.tolerance);
      const feather = Math.max(0.5, options.feather);
      const defringeFactor = (options.defringe || 65) / 100;

      // Color distance threshold (Euclidean RGB scaled)
      const tolSq = (tolerance * 2.5) ** 2;
      const featherSq = ((tolerance + feather * 3) * 2.5) ** 2;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        // Euclidean color distance in RGB
        const dr = r - targetR;
        const dg = g - targetG;
        const db = b - targetB;
        const distSq = dr * dr + dg * dg + db * db;

        if (distSq <= tolSq) {
          // Pure background: fully transparent
          data[i + 3] = 0;
        } else if (distSq < featherSq) {
          // Transition / edge pixel
          const t = Math.sqrt(distSq) / (Math.sqrt(featherSq) || 1);
          // Smoothstep
          const alphaRatio = Math.max(0, Math.min(1, (t - Math.sqrt(tolSq) / Math.sqrt(featherSq)) / (1 - Math.sqrt(tolSq) / Math.sqrt(featherSq))));
          const newAlpha = Math.round(alphaRatio * 255);

          data[i + 3] = newAlpha;

          // Halo suppression & defringing:
          // Un-blend the background color that was mixed into the edge pixel
          if (newAlpha > 0 && defringeFactor > 0) {
            const alphaFrac = Math.max(0.08, newAlpha / 255);
            const blendOut = (1 - alphaFrac) * defringeFactor;

            const newR = (r - blendOut * targetR) / Math.max(0.2, 1 - blendOut);
            const newG = (g - blendOut * targetG) / Math.max(0.2, 1 - blendOut);
            const newB = (b - blendOut * targetB) / Math.max(0.2, 1 - blendOut);

            data[i] = Math.max(0, Math.min(255, Math.round(newR)));
            data[i + 1] = Math.max(0, Math.min(255, Math.round(newG)));
            data[i + 2] = Math.max(0, Math.min(255, Math.round(newB)));
          }
        } else {
          // Subject body:
          // Subtle defringing for pixels immediately on the inside perimeter that still carry background contamination
          if (defringeFactor > 0.4 && distSq < featherSq * 1.5) {
            const edgeBleed = Math.max(0, 1 - Math.sqrt(distSq) / Math.sqrt(featherSq * 1.5)) * 0.3 * defringeFactor;
            if (edgeBleed > 0.02) {
              data[i] = Math.max(0, Math.min(255, Math.round((r - edgeBleed * targetR) / (1 - edgeBleed))));
              data[i + 1] = Math.max(0, Math.min(255, Math.round((g - edgeBleed * targetG) / (1 - edgeBleed))));
              data[i + 2] = Math.max(0, Math.min(255, Math.round((b - edgeBleed * targetB) / (1 - edgeBleed))));
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG blob from canvas'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ url, blob });
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates a clean test sample canvas with a crisp product object on solid studio backdrop
 * allowing the client to test edge precision immediately without inventing fictional photos.
 */
export function generateStudioTestImage(): Promise<{ url: string; file: File }> {
  return new Promise((resolve) => {
    const width = 800;
    const height = 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Pure clean studio white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle studio floor shadow (soft gray)
    const shadowGrad = ctx.createRadialGradient(400, 620, 20, 400, 620, 260);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.06)');
    shadowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(400, 620, 240, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subject: Sleek modern metallic camera / device product
    // Body
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(240, 300, 320, 220, 18);
    ctx.fill();

    // Accent grip
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(255, 320, 60, 180, 10);
    ctx.fill();

    // Top dial
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(270, 275, 45, 25, 4);
    ctx.fill();

    // Shutter button
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(470, 285, 40, 15, 4);
    ctx.fill();

    // Large lens barrel outer
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(420, 410, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    // Inner lens glass ring
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(420, 410, 68, 0, Math.PI * 2);
    ctx.fill();

    // Optical element reflection gradient
    const lensGrad = ctx.createLinearGradient(370, 360, 470, 460);
    lensGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    lensGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.4)');
    lensGrad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(420, 410, 52, 0, Math.PI * 2);
    ctx.fill();

    // Sharp lens flare highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(395, 385, 24, 10, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Viewfinder
    ctx.fillStyle = '#020617';
    ctx.fillRect(450, 315, 45, 25);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(450, 315, 45, 25);

    // Product brand badge
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('STUDIO-50MM', 260, 490);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'client-sample-product.jpg', { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      resolve({ url, file });
    }, 'image/jpeg', 0.95);
  });
}
