import { dump } from 'js-yaml';
import { ApiEndpoint, ApiProjectConfig } from '../types/api';

export function buildOpenApiSpec(config: ApiProjectConfig, endpoints: ApiEndpoint[]) {
  const pathsObj: Record<string, any> = {};

  endpoints.forEach((ep) => {
    if (!pathsObj[ep.path]) {
      pathsObj[ep.path] = {};
    }

    const methodLower = ep.method.toLowerCase();
    const responsesObj: Record<string, any> = {};

    ep.responses.forEach((res) => {
      responsesObj[res.statusCode.toString()] = {
        description: res.description,
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
            example: typeof res.body === 'string' ? JSON.parse(res.body || '{}') : res.body,
          },
        },
      };
    });

    const operationObj: any = {
      summary: ep.summary,
      description: ep.description,
      operationId: `${methodLower}_${ep.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      tags: [ep.category || 'General'],
      responses: responsesObj,
    };

    if (ep.requiresAuth) {
      operationObj.security = [{ bearerAuth: [] }];
    }

    if (ep.requestBodyExample && ['post', 'put', 'patch'].includes(methodLower)) {
      const properties: Record<string, any> = {};
      const requiredList: string[] = [];

      ep.parameters.forEach((param) => {
        properties[param.name] = {
          type: param.type || 'string',
          description: param.description,
          example: param.example,
        };
        if (param.required) {
          requiredList.push(param.name);
        }
      });

      operationObj.requestBody = {
        required: true,
        description: `${ep.summary} request payload`,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: requiredList.length > 0 ? requiredList : undefined,
              properties: Object.keys(properties).length > 0 ? properties : undefined,
            },
            example: ep.requestBodyExample,
          },
        },
      };
    }

    pathsObj[ep.path][methodLower] = operationObj;
  });

  return {
    openapi: '3.0.3',
    info: {
      title: config.title,
      version: config.version,
      description: config.description,
    },
    servers: [
      {
        url: config.baseUrls.production,
        description: 'Production Server',
      },
      {
        url: config.baseUrls.staging,
        description: 'Staging Server',
      },
    ],
    paths: pathsObj,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Authenticate by entering the Bearer JWT token received from /api/login.',
        },
      },
    },
  };
}

export function generateOpenApiYaml(config: ApiProjectConfig, endpoints: ApiEndpoint[]): string {
  const spec = buildOpenApiSpec(config, endpoints);
  return dump(spec, { indent: 2, lineWidth: -1 });
}

export function generateOpenApiJson(config: ApiProjectConfig, endpoints: ApiEndpoint[]): string {
  const spec = buildOpenApiSpec(config, endpoints);
  return JSON.stringify(spec, null, 2);
}

export function generateMarkdownDoc(config: ApiProjectConfig, endpoints: ApiEndpoint[]): string {
  let md = `# ${config.title}\n\n`;
  md += `${config.description}\n\n`;
  md += `---\n\n## Table of Contents\n\n`;
  md += `- [Overview](#overview)\n- [Base URLs](#base-urls)\n- [Authentication](#authentication)\n- [Status & Error Codes](#status--error-codes)\n- [API Endpoints](#api-endpoints)\n`;

  endpoints.forEach((ep) => {
    const slug = `${ep.method.toLowerCase()}-${ep.path.replace(/[^a-zA-Z0-9]/g, '')}`;
    md += `  - [${ep.method} ${ep.path}](#${slug})\n`;
  });

  md += `\n---\n\n## Overview\n\nAll endpoints accept and return \`application/json\` unless documented otherwise.\n\n`;
  md += `### Base URLs\n\n| Environment | URL |\n| :--- | :--- |\n| **Production** | \`${config.baseUrls.production}\` |\n| **Staging** | \`${config.baseUrls.staging}\` |\n\n`;
  md += `## Authentication\n\n${config.authDescription}\n\n`;
  md += `\`\`\`http\n${config.authHeader}\n\`\`\`\n\n`;

  md += `## Status & Error Codes\n\n`;
  md += `| Code | Meaning | Description |\n| :--- | :--- | :--- |\n`;
  md += `| \`200 OK\` | Success | Request succeeded. |\n`;
  md += `| \`400 Bad Request\` | Client Error | Invalid syntax or missing required fields. |\n`;
  md += `| \`401 Unauthorized\` | Authentication Error | Missing or invalid auth token. |\n`;
  md += `| \`403 Forbidden\` | Access Denied | Insufficient permissions. |\n`;
  md += `| \`404 Not Found\` | Resource Not Found | Target endpoint or resource does not exist. |\n`;
  md += `| \`500 Server Error\` | Internal Server Error | Unexpected server error occurred. |\n\n`;

  md += `## API Endpoints\n\n`;

  endpoints.forEach((ep) => {
    md += `### ${ep.method} ${ep.path}\n\n`;
    md += `${ep.description}\n\n`;
    md += `- **Method**: \`${ep.method}\`\n`;
    md += `- **Requires Auth**: ${ep.requiresAuth ? 'Yes (Bearer Token)' : 'No (Public)'}\n\n`;

    if (ep.headers.length > 0) {
      md += `#### Headers\n\n| Header | Type | Required | Description |\n| :--- | :--- | :--- | :--- |\n`;
      ep.headers.forEach((h) => {
        md += `| \`${h.name}\` | ${h.type} | ${h.required ? '**Yes**' : 'No'} | ${h.description} |\n`;
      });
      md += `\n`;
    }

    if (ep.parameters.length > 0) {
      md += `#### Parameters\n\n| Parameter | Type | Required | Description | Example |\n| :--- | :--- | :--- | :--- | :--- |\n`;
      ep.parameters.forEach((p) => {
        md += `| \`${p.name}\` | ${p.type} | ${p.required ? '**Yes**' : 'No'} | ${p.description} | \`${p.example || ''}\` |\n`;
      });
      md += `\n`;
    }

    if (ep.requestBodyExample) {
      md += `#### Request Example\n\n\`\`\`json\n${JSON.stringify(ep.requestBodyExample, null, 2)}\n\`\`\`\n\n`;
    }

    md += `#### Responses\n\n`;
    ep.responses.forEach((res) => {
      md += `##### ${res.statusCode} ${res.statusText} — ${res.description}\n\n`;
      md += `\`\`\`json\n${typeof res.body === 'string' ? res.body : JSON.stringify(res.body, null, 2)}\n\`\`\`\n\n`;
    });

    md += `---\n\n`;
  });

  return md;
}

export function generateStandaloneHtml(config: ApiProjectConfig, endpoints: ApiEndpoint[]): string {
  const yamlContent = generateOpenApiYaml(config, endpoints);

  let navItemsHtml = '';
  let endpointsHtml = '';

  endpoints.forEach((ep) => {
    const methodLower = ep.method.toLowerCase();
    const badgeClass =
      methodLower === 'get'
        ? 'badge-get'
        : methodLower === 'post'
        ? 'badge-post'
        : 'badge-other';

    navItemsHtml += `
      <a href="#${ep.id}" class="nav-item">
        <span class="nav-badge ${badgeClass}">${ep.method}</span>
        ${ep.path}
      </a>
    `;

    let headersTable = '';
    if (ep.headers.length > 0) {
      headersTable = `
        <h3 style="font-size: 0.95rem; margin: 18px 0 8px;">Request Headers</h3>
        <table>
          <thead>
            <tr>
              <th>Header</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${ep.headers
              .map(
                (h) => `
              <tr>
                <td><code>${h.name}</code></td>
                <td>${h.type}</td>
                <td><span class="${h.required ? 'required' : 'optional'}">${h.required ? 'Yes' : 'Optional'}</span></td>
                <td>${h.description}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    let paramsTable = '';
    if (ep.parameters.length > 0) {
      paramsTable = `
        <h3 style="font-size: 0.95rem; margin: 18px 0 8px;">Request Body Parameters</h3>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            ${ep.parameters
              .map(
                (p) => `
              <tr>
                <td><code>${p.name}</code></td>
                <td>${p.type}</td>
                <td><span class="${p.required ? 'required' : 'optional'}">${p.required ? 'Yes' : 'Optional'}</span></td>
                <td>${p.description}</td>
                <td><code>${p.example || ''}</code></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    const reqPayloadStr = ep.requestBodyExample ? JSON.stringify(ep.requestBodyExample, null, 2) : '';

    let curlStr = `curl -X ${ep.method} ${config.baseUrls.production}${ep.path} \\\n  -H "Content-Type: application/json"`;
    if (ep.requiresAuth) {
      curlStr += ` \\\n  -H "Authorization: Bearer <your_token>"`;
    }
    if (reqPayloadStr) {
      curlStr += ` \\\n  -d '${JSON.stringify(ep.requestBodyExample)}'`;
    }

    let responsesHtml = '';
    ep.responses.forEach((res) => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      responsesHtml += `
        <h3 style="font-size: 0.95rem; margin: 18px 0 8px;">
          ${res.statusCode} ${res.statusText} — 
          <span style="color: ${isSuccess ? '#34d399' : '#f87171'}; font-size: 0.8rem; font-weight: normal;">
            ${res.description}
          </span>
        </h3>
        <div class="code-container">
          <div class="code-header">
            <span>application/json</span>
          </div>
          <pre><code>${typeof res.body === 'string' ? res.body : JSON.stringify(res.body, null, 2)}</code></pre>
        </div>
      `;
    });

    endpointsHtml += `
      <section id="${ep.id}">
        <h2>${ep.summary}</h2>
        <div class="endpoint-card">
          <div class="endpoint-header">
            <div class="endpoint-title-lockup">
              <span class="method method-${methodLower}">${ep.method}</span>
              <span class="endpoint-path">${ep.path}</span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-dim);">${ep.requiresAuth ? 'Requires Auth' : 'Public'}</span>
          </div>

          <div class="endpoint-body">
            <p><strong>Description:</strong> ${ep.description}</p>
            ${headersTable}
            ${paramsTable}

            <div class="spec-grid">
              <div>
                ${
                  reqPayloadStr
                    ? `
                  <h3 style="font-size: 0.95rem; margin-bottom: 8px;">Request Payload</h3>
                  <div class="code-container">
                    <div class="code-header"><span>application/json</span></div>
                    <pre><code>${reqPayloadStr}</code></pre>
                  </div>
                `
                    : ''
                }

                <h3 style="font-size: 0.95rem; margin: 18px 0 8px;">Example cURL</h3>
                <div class="code-container">
                  <div class="code-header"><span>cURL</span></div>
                  <pre><code>${curlStr}</code></pre>
                </div>
              </div>

              <div>
                ${responsesHtml}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation — ${config.title}</title>
  <meta name="description" content="${config.description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #111827;
      --surface-elevated: #1f2937;
      --border: #374151;
      --text: #f9fafb;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --code-bg: #080c14;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 280px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      padding: 24px 16px;
      flex-shrink: 0;
    }
    .brand { font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .brand-tag { font-size: 0.75rem; font-weight: 500; color: var(--accent); background: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 4px; }
    .sidebar-desc { font-size: 0.8rem; color: var(--text-dim); margin-bottom: 24px; line-height: 1.4; }
    .nav-group-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); font-weight: 700; margin: 16px 0 8px 8px; }
    .nav-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; color: var(--text-muted); text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.15s ease; margin-bottom: 2px; }
    .nav-item:hover { background: var(--surface-elevated); color: var(--text); }
    .nav-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; font-weight: 700; padding: 2px 5px; border-radius: 3px; }
    .badge-post { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-get { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-other { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .main { flex: 1; max-width: 1040px; padding: 40px 48px 100px; overflow-y: auto; }
    .header-bar { border-bottom: 1px solid var(--border); padding-bottom: 28px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
    h1 { font-size: 1.85rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    .lead { color: var(--text-muted); font-size: 1rem; max-width: 650px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--surface-elevated); border: 1px solid var(--border); color: var(--text); text-decoration: none; font-size: 0.85rem; font-weight: 600; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: var(--accent); border-color: var(--accent); }
    section { margin-bottom: 56px; scroll-margin-top: 24px; }
    h2 { font-size: 1.35rem; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    p { color: var(--text-muted); margin-bottom: 16px; font-size: 0.95rem; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 0.875rem; }
    th { text-align: left; padding: 10px 14px; background: var(--surface); color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
    td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); color: var(--text); }
    code { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; color: #93c5fd; }
    .required { color: #f87171; font-weight: 600; }
    .optional { color: var(--text-dim); }
    .endpoint-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-top: 24px; }
    .endpoint-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255,255,255,0.015); }
    .endpoint-title-lockup { display: flex; align-items: center; gap: 12px; }
    .method { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; }
    .method-post { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .method-get { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .method-put, .method-patch { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .method-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .endpoint-path { font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 600; color: var(--text); }
    .endpoint-body { padding: 24px 20px; }
    .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
    @media (max-width: 900px) {
      body { flex-direction: column; }
      .sidebar { width: 100%; height: auto; position: static; }
      .main { padding: 24px; }
      .spec-grid { grid-template-columns: 1fr; }
    }
    .code-container { background: var(--code-bg); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin: 12px 0; }
    .code-header { padding: 8px 12px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
    pre { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; padding: 14px 16px; overflow-x: auto; color: #e2e8f0; line-height: 1.5; }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="brand">
      ${config.title}
      <span class="brand-tag">v${config.version}</span>
    </div>
    <p class="sidebar-desc">Developer API Reference Documentation.</p>

    <div class="nav-group-title">Getting Started</div>
    <a href="#overview" class="nav-item">Overview & Base URLs</a>
    <a href="#authentication" class="nav-item">Authentication</a>
    <a href="#status-codes" class="nav-item">Status Codes & Errors</a>

    <div class="nav-group-title">Endpoints</div>
    ${navItemsHtml}

    <div class="nav-group-title">Resources</div>
    <a href="./openapi.yaml" download="openapi.yaml" class="nav-item">Download openapi.yaml</a>
    <a href="./api.md" target="_blank" class="nav-item">View api.md</a>
  </aside>

  <main class="main">
    <div class="header-bar">
      <div>
        <h1>${config.title}</h1>
        <p class="lead">${config.description}</p>
      </div>
      <div>
        <a href="./openapi.yaml" download="openapi.yaml" class="btn btn-primary">
          Export OpenAPI YAML
        </a>
      </div>
    </div>

    <section id="overview">
      <h2>Overview & Base URLs</h2>
      <p>All endpoints accept and return <code>application/json</code> unless otherwise noted.</p>
      <table>
        <thead>
          <tr><th>Environment</th><th>Base URL</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Production</strong></td><td><code>${config.baseUrls.production}</code></td></tr>
          <tr><td><strong>Staging</strong></td><td><code>${config.baseUrls.staging}</code></td></tr>
        </tbody>
      </table>
    </section>

    <section id="authentication">
      <h2>Authentication</h2>
      <p>${config.authDescription}</p>
      <div class="code-container">
        <div class="code-header"><span>HTTP Header</span></div>
        <pre><code>${config.authHeader}</code></pre>
      </div>
    </section>

    <section id="status-codes">
      <h2>HTTP Status Codes & Error Handling</h2>
      <table>
        <thead>
          <tr><th>Code</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>200 OK</code></td><td>Success</td><td>Request completed successfully.</td></tr>
          <tr><td><code>400 Bad Request</code></td><td>Client Error</td><td>Invalid syntax or missing required parameters.</td></tr>
          <tr><td><code>401 Unauthorized</code></td><td>Auth Error</td><td>Authentication token missing, expired, or invalid.</td></tr>
          <tr><td><code>403 Forbidden</code></td><td>Permission</td><td>User does not have access permissions.</td></tr>
          <tr><td><code>404 Not Found</code></td><td>Missing</td><td>Requested resource does not exist.</td></tr>
          <tr><td><code>500 Server Error</code></td><td>Server</td><td>Unexpected server processing error.</td></tr>
        </tbody>
      </table>
    </section>

    ${endpointsHtml}
  </main>
</body>
</html>`;
}
