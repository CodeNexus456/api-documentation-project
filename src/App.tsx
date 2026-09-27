import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ApiDocumentationView } from './components/ApiDocumentationView';
import { BatchImageStudio } from './components/BatchImageStudio';
import { defaultEndpoints, defaultProjectConfig } from './data/defaultApi';
import { ApiEndpoint, ApiProjectConfig } from './types/api';
import { ProcessedImageItem } from './utils/imageProcessor';
import { generateOpenApiYaml } from './utils/openapiGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'docs' | 'images'>('docs');
  const [config] = useState<ApiProjectConfig>(defaultProjectConfig);
  const [endpoints] = useState<ApiEndpoint[]>(defaultEndpoints);
  const [, setImages] = useState<ProcessedImageItem[]>([]);

  const handleDownloadOpenApiYaml = () => {
    const yamlStr = generateOpenApiYaml(config, endpoints);
    const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Modern Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadOpenApiYaml={handleDownloadOpenApiYaml}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === 'docs' && (
          <ApiDocumentationView
            config={config}
            endpoints={endpoints}
          />
        )}

        {activeTab === 'images' && (
          <BatchImageStudio onImagesUpdated={setImages} />
        )}
      </div>
    </div>
  );
}
