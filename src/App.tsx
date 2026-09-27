import React, { useState } from 'react';
import JSZip from 'jszip';
import { Navbar } from './components/Navbar';
import { ApiDocumentationView } from './components/ApiDocumentationView';
import { BatchImageStudio } from './components/BatchImageStudio';
import { ProjectFilesView } from './components/ProjectFilesView';
import { defaultEndpoints, defaultProjectConfig } from './data/defaultApi';
import { ApiEndpoint, ApiProjectConfig } from './types/api';
import { ProcessedImageItem } from './utils/imageProcessor';
import {
  generateOpenApiYaml,
  generateMarkdownDoc,
  generateStandaloneHtml,
} from './utils/openapiGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'docs' | 'images' | 'project'>('docs');
  const [config] = useState<ApiProjectConfig>(defaultProjectConfig);
  const [endpoints] = useState<ApiEndpoint[]>(defaultEndpoints);
  const [images, setImages] = useState<ProcessedImageItem[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadProjectZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const projectFolder = zip.folder('project');
      if (!projectFolder) return;

      const docFolder = projectFolder.folder('documentation');
      const imagesFolder = projectFolder.folder('images');
      const originalFolder = imagesFolder?.folder('original');
      const editedFolder = imagesFolder?.folder('edited');

      // 1. Documentation files
      if (docFolder) {
        docFolder.file('index.html', generateStandaloneHtml(config, endpoints));
        docFolder.file('api.md', generateMarkdownDoc(config, endpoints));
        docFolder.file('openapi.yaml', generateOpenApiYaml(config, endpoints));
      }

      // 2. README.md
      const readmeText = `# Client Project: API Documentation & Batch Image Background Removal

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
- **Swagger UI**: Drag and drop \`openapi.yaml\` into https://editor.swagger.io/ or your local Swagger UI container.
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
      projectFolder.file('README.md', readmeText);

      // 3. Images and Notes
      if (originalFolder) {
        originalFolder.file(
          'README.txt',
          'Place unprocessed client source images here.\nSupports JPEG, PNG, WEBP with 100% preserved native resolution.'
        );
      }
      if (editedFolder) {
        editedFolder.file(
          'README.txt',
          'Stores processed client images with backgrounds removed.\nExported as 32-bit PNG with alpha transparency channel and defringed edges.'
        );
      }

      // Add real processed images into editedFolder and originalFolder
      for (const imgItem of images) {
        const baseName = imgItem.name.replace(/\.[^/.]+$/, '');
        if (imgItem.editedBlob && editedFolder) {
          editedFolder.file(`${baseName}-transparent.png`, imgItem.editedBlob);
        }
        if (originalFolder && imgItem.originalUrl) {
          try {
            const resp = await fetch(imgItem.originalUrl);
            const blob = await resp.blob();
            originalFolder.file(imgItem.name, blob);
          } catch {
            // ignore
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'project.zip';
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadProjectZip={handleDownloadProjectZip}
        isZipping={isZipping}
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

        {activeTab === 'project' && (
          <ProjectFilesView
            config={config}
            endpoints={endpoints}
            images={images}
            onDownloadProjectZip={handleDownloadProjectZip}
            isZipping={isZipping}
          />
        )}
      </div>
    </div>
  );
}
