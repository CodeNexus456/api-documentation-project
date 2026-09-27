import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Maximize,
  Download,
  Layers,
  CheckCircle2,
  Sliders,
  Eye,
  Lock,
} from 'lucide-react';

interface HomePageProps {
  onOpenStudio: () => void;
  onUploadSample: () => void;
  onFileSelect: (files: FileList | null) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenStudio,
  onUploadSample,
  onFileSelect,
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeBackdrop, setActiveBackdrop] = useState<'checker' | 'dark' | 'white' | 'green'>('dark');
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const getBackdropBg = () => {
    switch (activeBackdrop) {
      case 'dark':
        return 'bg-slate-950';
      case 'white':
        return 'bg-white border border-slate-200';
      case 'green':
        return 'bg-[#00ff00]';
      case 'checker':
        return 'bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-slate-100';
      default:
        return 'bg-slate-950';
    }
  };

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Zero-Fringe Engine · Batch Image Background Removal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Studio-Grade Background Removal for Batches of Images
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Eliminates white edge halos and color fringing, preserves 100% native resolution,
            and processes your whole image catalog entirely in your browser with zero data leaks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenStudio}
              className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
            >
              <span>Launch Batch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs"
            >
              Upload Your Images
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => onFileSelect(e.target.files)}
            />
          </div>

          {/* Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Anti-Fringe Halo Elimination
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100% Original Resolution Kept
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Single & Batch ZIP Export
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100% Client-Side Privacy
            </span>
          </div>
        </div>

        {/* Hero Interactive Split-Comparison Showcase */}
        <div className="mt-14 max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden">
            {/* Showcase Header Controls */}
            <div className="p-3.5 sm:px-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Interactive Edge Inspection</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-mono text-[11px]">Drag slider to compare</span>
              </div>

              {/* Backdrop test controls */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Backdrop Check:</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setActiveBackdrop('dark')}
                    title="Dark Slate (Catch White Fringing)"
                    className={`w-5 h-5 rounded bg-slate-950 ${
                      activeBackdrop === 'dark' ? 'ring-2 ring-blue-500' : ''
                    }`}
                  />
                  <button
                    onClick={() => setActiveBackdrop('checker')}
                    title="Transparency Checkerboard"
                    className={`w-5 h-5 rounded bg-[size:4px_4px] bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-slate-100 ${
                      activeBackdrop === 'checker' ? 'ring-2 ring-blue-500' : ''
                    }`}
                  />
                  <button
                    onClick={() => setActiveBackdrop('white')}
                    title="Pure White"
                    className={`w-5 h-5 rounded bg-white border border-slate-300 ${
                      activeBackdrop === 'white' ? 'ring-2 ring-blue-500' : ''
                    }`}
                  />
                  <button
                    onClick={() => setActiveBackdrop('green')}
                    title="Chroma Neon Green"
                    className={`w-5 h-5 rounded bg-[#00ff00] ${
                      activeBackdrop === 'green' ? 'ring-2 ring-blue-500' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Split Comparison Viewport */}
            <div
              ref={sliderRef}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              className={`relative h-[380px] sm:h-[460px] overflow-hidden select-none flex items-center justify-center transition-colors ${getBackdropBg()}`}
            >
              {/* Product SVG Graphic - Transparent edited version */}
              <div className="relative w-[360px] sm:w-[420px] h-[300px] sm:h-[340px] pointer-events-none">
                {/* Clean Transparent Cutout */}
                <svg
                  viewBox="0 0 400 320"
                  className="w-full h-full drop-shadow-2xl"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Camera Body */}
                  <rect x="50" y="80" width="300" height="200" rx="20" fill="#0f172a" />
                  <rect x="70" y="100" width="70" height="160" rx="10" fill="#1e293b" />
                  {/* Dial & shutter */}
                  <rect x="80" y="55" width="50" height="25" rx="4" fill="#475569" />
                  <rect x="270" y="65" width="40" height="15" rx="4" fill="#3b82f6" />
                  {/* Lens Barrel */}
                  <circle cx="230" cy="180" r="85" fill="#1e293b" stroke="#334155" strokeWidth="6" />
                  <circle cx="230" cy="180" r="68" fill="#0f172a" />
                  {/* Glass reflection */}
                  <circle cx="230" cy="180" r="54" fill="url(#lensGradHero)" />
                  <ellipse cx="205" cy="155" rx="24" ry="12" transform="rotate(-30 205 155)" fill="rgba(255,255,255,0.7)" />
                  {/* Viewfinder */}
                  <rect x="250" y="95" width="45" height="25" rx="3" fill="#020617" stroke="#475569" strokeWidth="2" />
                  {/* Badge */}
                  <text x="75" y="245" fill="#94a3b8" fontSize="11" fontWeight="600" fontFamily="sans-serif">
                    PRO-50MM
                  </text>
                  <defs>
                    <linearGradient id="lensGradHero" x1="180" y1="130" x2="280" y2="230" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38bdf8" />
                      <stop offset="0.5" stopColor="#6366f1" stopOpacity="0.8" />
                      <stop offset="1" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Original side clipped on top with white background and floor shadow */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <div className="w-[360px] sm:w-[420px] h-[300px] sm:h-[340px] bg-white relative">
                    {/* Shadow on white */}
                    <svg
                      viewBox="0 0 400 320"
                      className="w-full h-full"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Floor shadow */}
                      <ellipse cx="200" cy="275" rx="160" ry="24" fill="rgba(0,0,0,0.12)" />
                      {/* Camera Body */}
                      <rect x="50" y="80" width="300" height="200" rx="20" fill="#0f172a" />
                      <rect x="70" y="100" width="70" height="160" rx="10" fill="#1e293b" />
                      {/* Dial & shutter */}
                      <rect x="80" y="55" width="50" height="25" rx="4" fill="#475569" />
                      <rect x="270" y="65" width="40" height="15" rx="4" fill="#3b82f6" />
                      {/* Lens Barrel */}
                      <circle cx="230" cy="180" r="85" fill="#1e293b" stroke="#334155" strokeWidth="6" />
                      <circle cx="230" cy="180" r="68" fill="#0f172a" />
                      {/* Glass reflection */}
                      <circle cx="230" cy="180" r="54" fill="url(#lensGradHero2)" />
                      <ellipse cx="205" cy="155" rx="24" ry="12" transform="rotate(-30 205 155)" fill="rgba(255,255,255,0.7)" />
                      {/* Viewfinder */}
                      <rect x="250" y="95" width="45" height="25" rx="3" fill="#020617" stroke="#475569" strokeWidth="2" />
                      {/* Badge */}
                      <text x="75" y="245" fill="#94a3b8" fontSize="11" fontWeight="600" fontFamily="sans-serif">
                        PRO-50MM
                      </text>
                      <defs>
                        <linearGradient id="lensGradHero2" x1="180" y1="130" x2="280" y2="230" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#38bdf8" />
                          <stop offset="0.5" stopColor="#6366f1" stopOpacity="0.8" />
                          <stop offset="1" stopColor="#0f172a" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Slider divider */}
                <div
                  onMouseDown={() => setIsDragging(true)}
                  className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-xl"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-800">
                    ↔
                  </div>
                </div>
              </div>

              {/* Floating tags */}
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md font-mono">
                Original (Solid Backdrop)
              </div>
              <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md font-mono">
                Clean Cutout (Zero White Halo)
              </div>
            </div>

            {/* Showcase Footer */}
            <div className="p-3.5 sm:px-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-600">
                Notice how dark silhouettes have <strong>zero white fringing</strong> even against pure black backgrounds.
              </span>
              <button
                onClick={onOpenStudio}
                className="px-4 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Try with your images in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Built for Professional Product & E-Commerce Workflows
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Standard AI removers compromise image quality, introduce jagged edges, and leave annoying white halos. Here is how our pipeline is different:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Anti-Fringe Halo Elimination</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Decontaminates background pixel bleed along subject perimeters, eliminating the common white outlines that ruin dark-mode website graphics.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Maximize className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">100% Native Resolution</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Preserves 100% of original pixel dimensions. If you upload a 4K 3840×2160 product photo, you receive a crisp 3840×2160 transparent PNG.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Batch Processing & ZIP Archive</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Process dozens of catalog images in parallel and download all edited cutouts in a single structured ZIP archive ready for production.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">4-Backdrop Quality Inspector</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Inspect cutouts against transparency checkerboard, dark slate, studio white, and neon chroma green to catch any edge anomalies.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Granular Edge Tuning</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Fine-tune color tolerance, edge smoothing feathering, and defringing power with live real-time slider controls.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">100% Client-Side Privacy</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              All pixel calculations happen locally inside your browser using Offscreen Canvas 2D. Your confidential photos never get uploaded to any external server.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-slate-600">
            Three simple steps to clean transparent product assets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-3 relative">
            <div className="text-3xl font-mono font-bold text-blue-600">01</div>
            <h3 className="text-base font-bold text-slate-900">Drop Your Image Batch</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Upload multiple JPEG, PNG, or WEBP photos into the Studio. Original resolution and file names are preserved.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-3 relative">
            <div className="text-3xl font-mono font-bold text-blue-600">02</div>
            <h3 className="text-base font-bold text-slate-900">Auto Edge Cut & Defringe</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The engine detects subject contours, suppresses background halos, and applies sub-pixel feathering.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-3 relative">
            <div className="text-3xl font-mono font-bold text-blue-600">03</div>
            <h3 className="text-base font-bold text-slate-900">One-Click Batch Export</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Download individual transparent PNGs or click "Download Batch (ZIP)" to receive all edited files organized in one archive.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to Clean Up Your Product Photos?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              No account required, no file size limits, and no third-party cloud uploads.
              Get started with our high-precision studio now.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenStudio}
              className="px-6 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span>Open Batch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onUploadSample}
              className="px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition-all border border-slate-700"
            >
              Load Sample Test Canvas
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center text-xs text-slate-500 space-y-2">
        <p>
          Batch Image Background Remover Studio · 100% Client-Side Processing · Preserved Native Resolution
        </p>
        <p className="text-slate-400">
          All processing runs in-browser via Offscreen Canvas. No images leave your computer.
        </p>
      </footer>
    </div>
  );
};
