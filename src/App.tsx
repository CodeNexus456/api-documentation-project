import React, { useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { BatchImageStudio } from './components/BatchImageStudio';
import { ProcessedImageItem, generateStudioTestImage } from './utils/imageProcessor';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'studio'>('home');
  const [items, setItems] = useState<ProcessedImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

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

        // Automatically switch to studio view so user sees their images immediately
        setActiveTab('studio');
      };
    });
  };

  const handleLoadSample = async () => {
    const { url, file } = await generateStudioTestImage();
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const item: ProcessedImageItem = {
        id: `sample-test-${Date.now()}`,
        name: 'studio-product-sample.jpg',
        originalUrl: url,
        originalSize: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
        status: 'idle',
      };
      setItems((prev) => [...prev, item]);
      setSelectedId(item.id);
      setActiveTab('studio');
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Hidden Global File Input for Navbar action */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Modern Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => fileInputRef.current?.click()}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {activeTab === 'home' ? (
          <HomePage
            onOpenStudio={() => setActiveTab('studio')}
            onUploadSample={handleLoadSample}
            onFileSelect={handleFileUpload}
          />
        ) : (
          <BatchImageStudio
            items={items}
            setItems={setItems}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            onFileUpload={handleFileUpload}
            onLoadSample={handleLoadSample}
          />
        )}
      </main>
    </div>
  );
}
