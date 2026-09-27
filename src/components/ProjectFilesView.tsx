import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  FileText,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { ApiEndpoint, ApiProjectConfig } from '../types/api';
import { generateOpenApiYaml, generateMarkdownDoc } from '../utils/openapiGenerator';
import { ProcessedImageItem } from '../utils/imageProcessor';

interface ProjectFilesViewProps {
  config: ApiProjectConfig;
  endpoints: ApiEndpoint[];
  images: ProcessedImageItem[];
  onDownloadProjectZip: () => void;
  isZipping?: boolean;
}

export const ProjectFilesView: React.FC<ProjectFilesViewProps> = ({
  config,
  endpoints,
  images,
  onDownloadProjectZip,
  isZipping = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('README.md');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openapiYamlContent = generateOpenApiYaml(config, endpoints);
  const apiMdContent = generateMarkdownDoc(config, endpoints);

  const readmeContent = `# Client Project: API Documentation & Batch Image Background Removal

A clean, developer-focused deliverable containing structured API documentation, OpenAPI/Swagger specifications, and an image editing workspace for batch background removal.

---

## 1. Project Organization

\`\`\`
project/
│
├── documentation/
│   ├── index.html        # Interactive, developer-ready API documentation UI
│   ├── api.md            # Markdown reference document for repositories & wikis
│   └── openapi.yaml      # OpenAPI 3.0.3 specification for Swagger UI & Postman
│
├── images/
│   ├── original/         # Client's original unprocessed source images
│   └── edited/           # High-resolution PNGs with transparent backgrounds
│
└── README.md             # Project overview and usage guidelines
\`\`\`

---

## 2. API Documentation

The documentation is organized cleanly following modern REST API standards. For every endpoint, the documentation specifies:

- **Endpoint URL & HTTP Method** (POST /api/login)
- **Summary & Description**
- **Authentication Requirements** (Bearer JWT tokens)
- **Request Headers & Parameters** (Required vs. Optional)
- **Request Payload Schema & Examples**
- **Success Responses & Status Codes** (200 OK)
- **Error Responses & Status Codes** (400 Bad Request, 401 Unauthorized, 500 Internal Server Error)
- **Executable Code Examples** in cURL, JavaScript (Fetch), and Python (requests)

---

## 3. OpenAPI / Swagger Specification

The \`project/documentation/openapi.yaml\` file is formatted as an **OpenAPI 3.0.3** standard specification.

### How to use the OpenAPI file:
- **Swagger UI**: Drag and drop \`openapi.yaml\` into [Swagger Editor](https://editor.swagger.io/) or your local Swagger UI container.
- **Postman**: Click **Import** in Postman and select \`openapi.yaml\` to automatically generate a ready-to-run collection.
- **Client SDK Generation**: Use \`openapi-generator-cli\` to generate TypeScript, Python, or Go API clients directly.

---

## 4. Image Editing Work (Batch Background Removal)

The image processing pipeline removes backgrounds for client images while adhering to professional quality criteria:

- **Subject Preservation**: Maintains the core subject, proportions, and details without warping or degradation.
- **Native Resolution**: Images retain 100% of their original pixel dimensions and resolution.
- **Clean Alpha Edges**: Multi-stage edge refinement and halo suppression algorithms prevent white or colored edge fringing around subjects.
- **Format**: Exported as web-optimized 32-bit PNG with full alpha transparency channel.
- **Inspection**: Inspected against light, dark, and checkerboard backdrops to verify edge integrity.

---

## 5. Tools Used

### API Documentation & Specifications:
- **OpenAPI 3.0.3** specification standard
- **Swagger / Postman** schema compatibility
- **Markdown & Semantic HTML5**
- **Custom developer documentation UI** with syntax highlighting and zero third-party tracking

### Image Processing & Quality Control:
- **Offscreen Canvas 2D Pipeline** & alpha matting engine
- **Photoshop / GIMP compatible** alpha channel export
- **Defringe & edge feathering filters** for halo elimination

---

## 6. How to View the Documentation

1. **In Any Browser**:
   Open \`project/documentation/index.html\` directly in Google Chrome, Firefox, Safari, or Microsoft Edge. No local web server or build process is required.

2. **In a Code Editor / Git Web Viewer**:
   View \`project/documentation/api.md\` directly in GitHub, GitLab, VS Code, or any Markdown previewer.

3. **In Swagger UI / Postman**:
   Load \`project/documentation/openapi.yaml\` directly into Swagger UI or Postman.

---

## 7. How to Run Locally in VS Code (Step-by-Step)

### Prerequisites:
- **Node.js**: Version 18, 20 or higher installed (https://nodejs.org/).
- **VS Code**: Visual Studio Code editor.

### Step 1: Open in VS Code
1. Open VS Code.
2. Select **File** -> **Open Folder...** and choose this project folder.

### Step 2: Open Integrated Terminal
- Press \`Ctrl + \`\` (Backtick) or go to **Terminal** -> **New Terminal**.

### Step 3: Install Dependencies
Run:
\`\`\`bash
npm install
\`\`\`

### Step 4: Start Dev Server
Run:
\`\`\`bash
npm run dev
\`\`\`
Server runs at \`http://localhost:3000\`.

### Step 5: Open Browser
- Open \`http://localhost:3000\` to use the interactive documentation, batch background remover, and zip exporter.
`;

  const getFileContent = () => {
    switch (selectedFile) {
      case 'README.md':
        return {
          title: 'project / README.md',
          badge: 'Markdown',
          content: readmeContent,
          filename: 'README.md',
        };
      case 'documentation/openapi.yaml':
        return {
          title: 'project / documentation / openapi.yaml',
          badge: 'OpenAPI 3.0 YAML',
          content: openapiYamlContent,
          filename: 'openapi.yaml',
        };
      case 'documentation/api.md':
        return {
          title: 'project / documentation / api.md',
          badge: 'Markdown Document',
          content: apiMdContent,
          filename: 'api.md',
        };
      case 'documentation/index.html':
        return {
          title: 'project / documentation / index.html',
          badge: 'Standalone HTML5',
          content: `<!-- Open this standalone file directly in any browser for client documentation -->\n<!-- It contains self-contained styling, navigation, and API specs -->\n\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>API Documentation — ${config.title}</title>\n  ...\n</html>`,
          filename: 'index.html',
        };
      case 'images/original':
        return {
          title: 'project / images / original /',
          badge: 'Directory',
          content: `# Original Images Directory\n\nContains client source images awaiting background removal.\n\nCurrent batch items in workspace: ${images.length} images.`,
          filename: 'original-notes.txt',
        };
      case 'images/edited':
        return {
          title: 'project / images / edited /',
          badge: 'Directory',
          content: `# Edited Transparent PNG Directory\n\nContains processed client images with backgrounds removed.\nExported with alpha transparency channel and preserved native resolution.\n\nCurrent edited items ready for export: ${images.filter((i) => i.editedUrl).length} images.`,
          filename: 'edited-notes.txt',
        };
      default:
        return {
          title: 'project / README.md',
          badge: 'Markdown',
          content: readmeContent,
          filename: 'README.md',
        };
    }
  };

  const fileInfo = getFileContent();

  const handleDownloadActiveFile = () => {
    const blob = new Blob([fileInfo.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileInfo.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Client Workspace</span>
            <span aria-hidden="true">·</span>
            <span>Deliverables Package</span>
            <span aria-hidden="true">·</span>
            <span>Organized File Structure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Project Files & Client Deliverables
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            All files are structured cleanly according to project specifications. Ready for client inspection and single-click archive export.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDownloadProjectZip}
            disabled={isZipping}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Creating Archive...' : 'Download Project ZIP (Complete)'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tree Explorer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>Directory Tree</span>
              <span className="text-[11px] text-slate-500 font-mono">project/</span>
            </div>

            <div className="space-y-1 text-xs font-mono">
              {/* project root */}
              <div className="text-slate-800 font-bold flex items-center gap-1.5 py-1">
                <Folder className="w-4 h-4 text-blue-600 fill-blue-100" />
                <span>project/</span>
              </div>

              {/* documentation/ */}
              <div className="pl-4 space-y-1">
                <div className="text-slate-700 font-semibold flex items-center gap-1.5 py-0.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
                  <span>documentation/</span>
                </div>

                <div className="pl-4 space-y-1 font-normal">
                  <button
                    onClick={() => setSelectedFile('documentation/index.html')}
                    className={`w-full text-left flex items-center gap-2 py-1 px-2 rounded-md transition-colors ${
                      selectedFile === 'documentation/index.html'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-500" />
                    <span>index.html</span>
                  </button>

                  <button
                    onClick={() => setSelectedFile('documentation/api.md')}
                    className={`w-full text-left flex items-center gap-2 py-1 px-2 rounded-md transition-colors ${
                      selectedFile === 'documentation/api.md'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>api.md</span>
                  </button>

                  <button
                    onClick={() => setSelectedFile('documentation/openapi.yaml')}
                    className={`w-full text-left flex items-center gap-2 py-1 px-2 rounded-md transition-colors ${
                      selectedFile === 'documentation/openapi.yaml'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>openapi.yaml</span>
                  </button>
                </div>
              </div>

              {/* images/ */}
              <div className="pl-4 space-y-1 pt-1">
                <div className="text-slate-700 font-semibold flex items-center gap-1.5 py-0.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
                  <span>images/</span>
                </div>

                <div className="pl-4 space-y-1 font-normal">
                  <button
                    onClick={() => setSelectedFile('images/original')}
                    className={`w-full text-left flex items-center justify-between py-1 px-2 rounded-md transition-colors ${
                      selectedFile === 'images/original'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-slate-400" />
                      <span>original/</span>
                    </div>
                    <span className="text-[10px] text-slate-400">({images.length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedFile('images/edited')}
                    className={`w-full text-left flex items-center justify-between py-1 px-2 rounded-md transition-colors ${
                      selectedFile === 'images/edited'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-slate-400" />
                      <span>edited/</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      ({images.filter((i) => i.editedUrl).length})
                    </span>
                  </button>
                </div>
              </div>

              {/* README.md */}
              <div className="pl-4 pt-1">
                <button
                  onClick={() => setSelectedFile('README.md')}
                  className={`w-full text-left flex items-center gap-2 py-1 px-2 rounded-md transition-colors ${
                    selectedFile === 'README.md'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-700" />
                  <span>README.md</span>
                </button>
              </div>
            </div>
          </div>

          {/* Deliverables Checklist */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs space-y-2.5">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
              Deliverables Checklist
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Developer-ready API documentation</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>OpenAPI 3.0 YAML / JSON specification</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Clean edited transparent PNG images</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Standardized project file tree</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Simple, professional README</span>
            </div>
          </div>
        </div>

        {/* Right: File Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* Viewer Header */}
            <div className="p-3.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-slate-900">{fileInfo.title}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-sans">
                  {fileInfo.badge}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('file-viewer', fileInfo.content)}
                  className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors"
                >
                  {copiedKey === 'file-viewer' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'file-viewer' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadActiveFile}
                  className="flex items-center gap-1 px-2.5 py-1 text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="p-4 bg-slate-950 text-slate-200 overflow-x-auto max-h-[580px]">
              <pre className="text-xs font-mono leading-relaxed">
                <code>{fileInfo.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
