import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Trash2,
  Sliders,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layers,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  ProcessedImageItem,
  ImageProcessOptions,
  removeBackgroundFromImage,
  generateStudioTestImage,
} from '../utils/imageProcessor';

interface BatchImageStudioProps {
  onImagesUpdated?: (images: ProcessedImageItem[]) => void;
}

export const BatchImageStudio: React.FC<BatchImageStudioProps> = ({ onImagesUpdated }) => {
  const [items, setItems] = useState<ProcessedImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Studio inspection controls
  const [previewBg, setPreviewBg] = useState<'checker' | 'dark' | 'white' | 'green'>('checker');
  const [compareMode, setCompareMode] = useState<'split' | 'side' | 'edited'>('split');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Algorithm refinement options
  const [options, setOptions] = useState<ImageProcessOptions>({
    tolerance: 32,
    feather: 2,
    defringe: 70,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedId) || items[0] || null;

  // Sync to parent if needed
  useEffect(() => {
    if (onImagesUpdated) {
      onImagesUpdated(items);
    }
  }, [items, onImagesUpdated]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: ProcessedImageItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const item: ProcessedImageItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          originalUrl: url,
          originalSize: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          status: 'idle',
        };

        setItems((prev) => {
          const next = [...prev, item];
          if (!selectedId) setSelectedId(item.id);
          return next;
        });
      };
    });
  };

  const handleLoadSampleCanvas = async () => {
    const { url, file } = await generateStudioTestImage();
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const item: ProcessedImageItem = {
        id: `sample-test-${Date.now()}`,
        name: 'client-sample-product.jpg',
        originalUrl: url,
        originalSize: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
        status: 'idle',
      };
      setItems((prev) => [...prev, item]);
      setSelectedId(item.id);
    };
  };

  const processSingleItem = async (item: ProcessedImageItem): Promise<ProcessedImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.originalUrl;
      img.onload = async () => {
        try {
          const { url, blob } = await removeBackgroundFromImage(img, options);
          resolve({
            ...item,
            editedUrl: url,
            editedBlob: blob,
            status: 'done',
          });
        } catch (err: any) {
          resolve({
            ...item,
            status: 'error',
            errorMessage: err?.message || 'Processing failed',
          });
        }
      };
      img.onerror = () => {
        resolve({
          ...item,
          status: 'error',
          errorMessage: 'Failed to load source image',
        });
      };
    });
  };

  const handleProcessSelected = async () => {
    if (!selectedItem) return;

    setItems((prev) =>
      prev.map((i) => (i.id === selectedItem.id ? { ...i, status: 'processing' } : i))
    );

    const updated = await processSingleItem(selectedItem);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleProcessAllBatch = async () => {
    if (items.length === 0) return;
    setIsProcessingBatch(true);

    // Set all to processing
    setItems((prev) => prev.map((i) => ({ ...i, status: 'processing' })));

    const processedList: ProcessedImageItem[] = [];
    for (const item of items) {
      const result = await processSingleItem(item);
      processedList.push(result);
      setItems((prev) => prev.map((i) => (i.id === result.id ? result : i)));
    }

    setIsProcessingBatch(false);
  };

  const handleDownloadSingle = (item: ProcessedImageItem) => {
    if (!item.editedUrl) return;
    const a = document.createElement('a');
    a.href = item.editedUrl;
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}-transparent.png`;
    a.click();
  };

  const handleDownloadBatchZip = async () => {
    const readyItems = items.filter((i) => i.editedBlob);
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const editedFolder = zip.folder('edited');
      const originalFolder = zip.folder('original');

      for (const item of readyItems) {
        const baseName = item.name.replace(/\.[^/.]+$/, '');
        if (item.editedBlob && editedFolder) {
          editedFolder.file(`${baseName}-transparent.png`, item.editedBlob);
        }

        // Fetch original blob
        if (originalFolder) {
          try {
            const res = await fetch(item.originalUrl);
            const blob = await res.blob();
            originalFolder.file(item.name, blob);
          } catch {
            // ignore
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'client-edited-images-batch.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleClearAll = () => {
    setItems([]);
    setSelectedId(null);
  };

  // Split slider drag handling
  const handleSliderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSlider || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  const getBackdropClass = () => {
    switch (previewBg) {
      case 'checker':
        return 'bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-slate-100';
      case 'dark':
        return 'bg-slate-900';
      case 'white':
        return 'bg-white';
      case 'green':
        return 'bg-[#00ff00]';
      default:
        return 'bg-slate-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header & Requirements Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Client Workspace</span>
            <span aria-hidden="true">·</span>
            <span>Batch Background Removal</span>
            <span aria-hidden="true">·</span>
            <span>Edge Defringing Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Batch Image Background Removal Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Preserves 100% native resolution, retains subject integrity, and enforces anti-fringing halo suppression to eliminate white edge halos on web backdrops.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLoadSampleCanvas}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Load Test Canvas</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Client Batch</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Main Workspace Layout */}
      {items.length === 0 ? (
        /* Empty State Dropzone */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors"
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-white border border-slate-200 shadow-xs rounded-xl flex items-center justify-center mx-auto text-blue-600">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Your Batch of Images</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Drag and drop your batch here or select files from your computer. PNG, JPEG, WEBP supported.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Browse Image Files
              </button>
              <button
                onClick={handleLoadSampleCanvas}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Load Studio Test Canvas
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Populated Studio */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Queue & Batch Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Batch Queue ({items.length})
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] text-slate-500 hover:text-rose-600 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      selectedItem?.id === item.id
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.editedUrl || item.originalUrl}
                        alt={item.name}
                        className="w-10 h-10 object-contain rounded bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{item.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <span>{item.width}×{item.height}px</span>
                          <span>·</span>
                          <span>{(item.originalSize / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'done' && (
                        <span className="text-emerald-600" title="Completed">
                          <CheckCircle className="w-4 h-4" />
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-blue-600 animate-spin" title="Processing">
                          <RefreshCw className="w-4 h-4" />
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-rose-600" title={item.errorMessage || 'Error'}>
                          <AlertCircle className="w-4 h-4" />
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch Actions Bar */}
              <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
                <button
                  onClick={handleProcessAllBatch}
                  disabled={isProcessingBatch}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-60"
                >
                  {isProcessingBatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Batch...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Process All Images</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadBatchZip}
                  disabled={isZipping || !items.some((i) => i.editedBlob)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isZipping ? 'Archiving ZIP...' : 'Download Edited Batch (ZIP)'}</span>
                </button>
              </div>
            </div>

            {/* Quality & Defringe Controls */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Algorithm Parameters
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Defringe Halo Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Anti-Fringe (Halo Suppression)</label>
                    <span className="font-mono text-slate-500">{options.defringe}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={options.defringe}
                    onChange={(e) => setOptions({ ...options, defringe: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Eliminates the bright white border around subject silhouettes.
                  </p>
                </div>

                {/* Tolerance Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Background Color Tolerance</label>
                    <span className="font-mono text-slate-500">{options.tolerance}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={75}
                    value={options.tolerance}
                    onChange={(e) => setOptions({ ...options, tolerance: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Feather Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Edge Feather & Smoothing</label>
                    <span className="font-mono text-slate-500">{options.feather}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={0.5}
                    value={options.feather}
                    onChange={(e) => setOptions({ ...options, feather: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              <button
                onClick={handleProcessSelected}
                disabled={!selectedItem || selectedItem.status === 'processing'}
                className="w-full py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Apply Parameters & Re-Process
              </button>
            </div>
          </div>

          {/* Right Column: Viewport & Inspection Stage (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedItem && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {/* Viewport Toolbar */}
                <div className="p-3 sm:px-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* View mode toggle */}
                  <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-md">
                    <button
                      onClick={() => setCompareMode('split')}
                      className={`px-2.5 py-1 rounded font-medium ${
                        compareMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Split Slider
                    </button>
                    <button
                      onClick={() => setCompareMode('side')}
                      className={`px-2.5 py-1 rounded font-medium ${
                        compareMode === 'side' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Side by Side
                    </button>
                    <button
                      onClick={() => setCompareMode('edited')}
                      className={`px-2.5 py-1 rounded font-medium ${
                        compareMode === 'edited' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Edited Result
                    </button>
                  </div>

                  {/* Backdrop Selector for Fringing Inspection */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Backdrop Check:</span>
                    <button
                      onClick={() => setPreviewBg('checker')}
                      title="Checkerboard (Alpha Transparency)"
                      className={`w-6 h-6 rounded border ${
                        previewBg === 'checker' ? 'ring-2 ring-blue-500 border-white' : 'border-slate-300'
                      } bg-[size:6px_6px] bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-slate-100`}
                    />
                    <button
                      onClick={() => setPreviewBg('dark')}
                      title="Dark Slate (Catch White Halos / Fringing)"
                      className={`w-6 h-6 rounded border bg-slate-900 ${
                        previewBg === 'dark' ? 'ring-2 ring-blue-500 border-white' : 'border-slate-300'
                      }`}
                    />
                    <button
                      onClick={() => setPreviewBg('white')}
                      title="Pure White"
                      className={`w-6 h-6 rounded border bg-white ${
                        previewBg === 'white' ? 'ring-2 ring-blue-500 border-slate-400' : 'border-slate-300'
                      }`}
                    />
                    <button
                      onClick={() => setPreviewBg('green')}
                      title="Neon Green (Chroma Edge Inspection)"
                      className={`w-6 h-6 rounded border bg-[#00ff00] ${
                        previewBg === 'green' ? 'ring-2 ring-blue-500 border-white' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-200"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px] text-slate-600 w-10 text-center">
                      {(zoomLevel * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-200"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-200 ml-1"
                      title="Reset 100%"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inspection Viewport */}
                <div
                  ref={splitContainerRef}
                  onMouseMove={handleSliderMouseMove}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onMouseLeave={() => setIsDraggingSlider(false)}
                  className={`relative w-full h-[460px] overflow-hidden select-none flex items-center justify-center ${getBackdropClass()}`}
                >
                  {compareMode === 'split' ? (
                    /* Interactive Split Before/After Slider */
                    <div
                      className="relative max-w-full max-h-full"
                      style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                    >
                      {/* Underlying Edited Image */}
                      <img
                        src={selectedItem.editedUrl || selectedItem.originalUrl}
                        alt="Edited"
                        className="max-h-[420px] max-w-full object-contain pointer-events-none"
                      />

                      {/* Overlaid Original Image Clipped */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={selectedItem.originalUrl}
                          alt="Original"
                          className="max-h-[420px] max-w-none object-contain pointer-events-none"
                          style={{
                            width: splitContainerRef.current?.clientWidth || '100%',
                            height: '100%',
                          }}
                        />
                      </div>

                      {/* Split Divider Handle */}
                      <div
                        onMouseDown={() => setIsDraggingSlider(true)}
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-md"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          ↔
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-2 z-10 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                        Original
                      </div>
                      <div className="absolute bottom-2 right-2 z-10 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                        Background Removed
                      </div>
                    </div>
                  ) : compareMode === 'side' ? (
                    /* Side by side layout */
                    <div className="grid grid-cols-2 gap-4 p-4 w-full h-full items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="text-[11px] text-slate-500 font-mono mb-1">Original</div>
                        <img
                          src={selectedItem.originalUrl}
                          alt="Original"
                          className="max-h-[360px] object-contain rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-[11px] text-slate-500 font-mono mb-1">Edited PNG</div>
                        <img
                          src={selectedItem.editedUrl || selectedItem.originalUrl}
                          alt="Edited"
                          className="max-h-[360px] object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Full Edited view */
                    <div
                      style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                    >
                      <img
                        src={selectedItem.editedUrl || selectedItem.originalUrl}
                        alt="Edited"
                        className="max-h-[420px] max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Viewport Footer Bar */}
                <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{selectedItem.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-mono">
                      Native Resolution: {selectedItem.width} × {selectedItem.height} px (100% preserved)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleProcessSelected}
                      disabled={selectedItem.status === 'processing'}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      {selectedItem.status === 'processing' ? 'Processing...' : 'Re-Process Subject'}
                    </button>
                    <button
                      onClick={() => handleDownloadSingle(selectedItem)}
                      disabled={!selectedItem.editedUrl}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
