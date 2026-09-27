import React from 'react';
import { Code2, Image as ImageIcon, Download, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'docs' | 'images';
  setActiveTab: (tab: 'docs' | 'images') => void;
  onDownloadOpenApiYaml?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onDownloadOpenApiYaml,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single modern brand wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base tracking-tight text-slate-900">
              DevStudio
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-medium">
              v1.0
            </span>
          </div>
        </div>

        {/* Zone 2: Modern segmented navigation tabs */}
        <nav className="flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/60 text-xs">
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 font-medium rounded-md transition-all ${
              activeTab === 'docs'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>API Documentation</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-3.5 py-1.5 font-medium rounded-md transition-all ${
              activeTab === 'images'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Batch Image Removal</span>
          </button>
        </nav>

        {/* Zone 3: Primary quick action */}
        <div className="flex items-center gap-2">
          {activeTab === 'docs' && onDownloadOpenApiYaml && (
            <button
              onClick={onDownloadOpenApiYaml}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/60"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>openapi.yaml</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
