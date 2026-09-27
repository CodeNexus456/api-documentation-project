import React from 'react';
import { Download } from 'lucide-react';

interface NavbarProps {
  activeTab: 'docs' | 'images' | 'project';
  setActiveTab: (tab: 'docs' | 'images' | 'project') => void;
  onDownloadProjectZip: () => void;
  isZipping?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onDownloadProjectZip,
  isZipping = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('docs')}
          className="text-left font-bold text-lg tracking-tight text-slate-900 hover:text-slate-700 transition-colors"
        >
          Client Project Portal
        </button>

        {/* Zone 2: Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'docs'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            API Documentation
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'images'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Batch Image Removal
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'project'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Project Files & README
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadProjectZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Generating ZIP...' : 'Export Project ZIP'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
