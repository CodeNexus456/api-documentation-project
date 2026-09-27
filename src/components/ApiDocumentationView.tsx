import React, { useState } from 'react';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { ApiEndpoint, ApiProjectConfig } from '../types/api';
import { generateOpenApiYaml } from '../utils/openapiGenerator';

interface ApiDocumentationViewProps {
  config: ApiProjectConfig;
  endpoints: ApiEndpoint[];
}

export const ApiDocumentationView: React.FC<ApiDocumentationViewProps> = ({
  config,
  endpoints,
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'js' | 'python'>('curl');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadYaml = () => {
    const yamlStr = generateOpenApiYaml(config, endpoints);
    const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCodeSnippet = (ep: ApiEndpoint, lang: 'curl' | 'js' | 'python') => {
    const fullUrl = `${config.baseUrls.production}${ep.path}`;
    const payloadStr = ep.requestBodyExample ? JSON.stringify(ep.requestBodyExample, null, 2) : '';

    if (lang === 'curl') {
      let code = `curl -X ${ep.method} ${fullUrl} \\\n  -H "Content-Type: application/json"`;
      if (ep.requiresAuth) {
        code += ` \\\n  -H "Authorization: Bearer <your_token>"`;
      }
      if (payloadStr) {
        code += ` \\\n  -d '${JSON.stringify(ep.requestBodyExample)}'`;
      }
      return code;
    }

    if (lang === 'js') {
      return `const response = await fetch('${fullUrl}', {
  method: '${ep.method}',
  headers: {
    'Content-Type': 'application/json'${ep.requiresAuth ? `,\n    'Authorization': 'Bearer ' + token` : ''}
  }${payloadStr ? `,\n  body: JSON.stringify(${JSON.stringify(ep.requestBodyExample, null, 2)})` : ''}
});

const data = await response.json();
console.log(data);`;
    }

    if (lang === 'python') {
      return `import requests

url = "${fullUrl}"
headers = {
    "Content-Type": "application/json"${ep.requiresAuth ? `,\n    "Authorization": "Bearer " + token` : ''}
}
${payloadStr ? `payload = ${JSON.stringify(ep.requestBodyExample, null, 4)}\n\nresponse = requests.${ep.method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.${ep.method.toLowerCase()}(url, headers=headers)`}

print(response.status_code)
print(response.json())`;
    }

    return '';
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-white">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-slate-50 border-r border-slate-200 p-5 shrink-0">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Table of Contents
        </div>
        <nav className="space-y-1 text-xs">
          <button
            onClick={() => {
              setActiveSection('overview');
              document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
              activeSection === 'overview'
                ? 'bg-slate-200 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveSection('authentication');
              document.getElementById('authentication')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
              activeSection === 'authentication'
                ? 'bg-slate-200 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Authentication
          </button>
          <button
            onClick={() => {
              setActiveSection('status-codes');
              document.getElementById('status-codes')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
              activeSection === 'status-codes'
                ? 'bg-slate-200 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            HTTP Status Codes
          </button>

          <div className="pt-4 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            API Endpoints
          </div>
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              onClick={() => {
                setActiveSection(ep.id);
                document.getElementById(ep.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2 transition-colors ${
                activeSection === ep.id
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono truncate">{ep.path}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                {ep.method}
              </span>
            </button>
          ))}

          <div className="pt-4 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            OpenAPI Spec
          </div>
          <button
            onClick={() => {
              setActiveSection('openapi');
              document.getElementById('openapi')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
              activeSection === 'openapi'
                ? 'bg-slate-200 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            openapi.yaml
          </button>
        </nav>

        <div className="pt-6 mt-6 border-t border-slate-200">
          <button
            onClick={handleDownloadYaml}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download openapi.yaml</span>
          </button>
        </div>
      </aside>

      {/* Main Documentation Content */}
      <main className="flex-1 p-6 lg:p-10 max-w-4xl space-y-10">
        {/* Title & Introduction */}
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {config.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {config.description}
          </p>
        </header>

        {/* Section: Overview */}
        <section id="overview" className="scroll-mt-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Overview</h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
            This API uses REST conventions and standard HTTP methods. All requests and responses use JSON formatted bodies.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-semibold">Environment</th>
                  <th className="py-2 px-3 font-semibold">Base URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Production</td>
                  <td className="py-2.5 px-3 text-slate-700">{config.baseUrls.production}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800">Staging</td>
                  <td className="py-2.5 px-3 text-slate-700">{config.baseUrls.staging}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Authentication */}
        <section id="authentication" className="scroll-mt-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Authentication</h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
            {config.authDescription}
          </p>
          <div className="bg-slate-900 text-slate-100 p-3 rounded-lg flex items-center justify-between font-mono text-xs">
            <code>{config.authHeader}</code>
            <button
              onClick={() => handleCopy('auth-header', config.authHeader)}
              className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
            >
              {copiedId === 'auth-header' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'auth-header' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </section>

        {/* Section: HTTP Status Codes */}
        <section id="status-codes" className="scroll-mt-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">HTTP Status Codes & Error Handling</h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
            Standard HTTP status codes are used to communicate success or error states:
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-semibold">Status Code</th>
                  <th className="py-2 px-3 font-semibold">Meaning</th>
                  <th className="py-2 px-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-600">200 OK</td>
                  <td className="py-2 px-3 text-slate-700">Success</td>
                  <td className="py-2 px-3 text-slate-600">The request was successful and response payload is returned.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-amber-600">400 Bad Request</td>
                  <td className="py-2 px-3 text-slate-700">Client Error</td>
                  <td className="py-2 px-3 text-slate-600">Required fields are missing or request body JSON is invalid.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-rose-600">401 Unauthorized</td>
                  <td className="py-2 px-3 text-slate-700">Auth Error</td>
                  <td className="py-2 px-3 text-slate-600">Invalid credentials or missing/expired Bearer token.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-rose-600">500 Server Error</td>
                  <td className="py-2 px-3 text-slate-700">Server Error</td>
                  <td className="py-2 px-3 text-slate-600">An unexpected error occurred on the server.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: API Endpoints */}
        <div className="space-y-8">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
            API Endpoints
          </h2>

          {endpoints.map((ep) => (
            <article
              key={ep.id}
              id={ep.id}
              className="border border-slate-200 rounded-xl overflow-hidden shadow-xs scroll-mt-6"
            >
              {/* Header: Method + Path */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900">
                    {ep.path}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{ep.category}</span>
              </div>

              <div className="p-5 space-y-5 text-xs sm:text-sm">
                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Description
                  </h3>
                  <p className="text-slate-700">{ep.description}</p>
                </div>

                {/* Request Headers */}
                {ep.headers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Request Headers
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-1.5 px-3 font-semibold">Header</th>
                            <th className="py-1.5 px-3 font-semibold">Type</th>
                            <th className="py-1.5 px-3 font-semibold">Required</th>
                            <th className="py-1.5 px-3 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ep.headers.map((h, i) => (
                            <tr key={i}>
                              <td className="py-1.5 px-3 font-mono font-medium text-slate-800">{h.name}</td>
                              <td className="py-1.5 px-3 text-slate-500">{h.type}</td>
                              <td className="py-1.5 px-3 font-semibold text-rose-600">{h.required ? 'Yes' : 'No'}</td>
                              <td className="py-1.5 px-3 text-slate-600">{h.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Required & Optional Parameters */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Parameters
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-1.5 px-3 font-semibold">Parameter</th>
                          <th className="py-1.5 px-3 font-semibold">Type</th>
                          <th className="py-1.5 px-3 font-semibold">Required</th>
                          <th className="py-1.5 px-3 font-semibold">Description</th>
                          <th className="py-1.5 px-3 font-semibold">Example</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ep.parameters.map((p, i) => (
                          <tr key={i}>
                            <td className="py-1.5 px-3 font-mono font-medium text-slate-800">{p.name}</td>
                            <td className="py-1.5 px-3 text-slate-500">{p.type}</td>
                            <td className="py-1.5 px-3 font-semibold text-rose-600">{p.required ? 'Yes' : 'No'}</td>
                            <td className="py-1.5 px-3 text-slate-600">{p.description}</td>
                            <td className="py-1.5 px-3 font-mono text-slate-500">{p.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Example Request & Responses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Left: Request Body & Code */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Request Body
                      </h3>
                      <button
                        onClick={() => handleCopy(`req-${ep.id}`, JSON.stringify(ep.requestBodyExample, null, 2))}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {copiedId === `req-${ep.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === `req-${ep.id}` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
                      <code>{JSON.stringify(ep.requestBodyExample, null, 2)}</code>
                    </pre>

                    {/* Code snippet tabs */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {(['curl', 'js', 'python'] as const).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setSelectedLanguage(lang)}
                              className={`px-2 py-0.5 text-[11px] font-semibold rounded uppercase ${
                                selectedLanguage === lang
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleCopy(`code-${ep.id}`, getCodeSnippet(ep, selectedLanguage))}
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          {copiedId === `code-${ep.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === `code-${ep.id}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
                        <code>{getCodeSnippet(ep, selectedLanguage)}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Right: Responses */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Responses
                    </h3>

                    {/* Success 200 */}
                    <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          200 OK (Success Response)
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              `res-200-${ep.id}`,
                              JSON.stringify(ep.responses.find((r) => r.statusCode === 200)?.body, null, 2)
                            )
                          }
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          {copiedId === `res-200-${ep.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === `res-200-${ep.id}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-slate-950 text-slate-200 rounded text-xs font-mono overflow-x-auto">
                        <code>
                          {JSON.stringify(ep.responses.find((r) => r.statusCode === 200)?.body, null, 2)}
                        </code>
                      </pre>
                    </div>

                    {/* Error 401 */}
                    <div className="border border-rose-200 rounded-lg p-3 bg-rose-50/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-rose-700">
                          401 Unauthorized (Error Response)
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              `res-401-${ep.id}`,
                              JSON.stringify(ep.responses.find((r) => r.statusCode === 401)?.body, null, 2)
                            )
                          }
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          {copiedId === `res-401-${ep.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === `res-401-${ep.id}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-slate-950 text-slate-200 rounded text-xs font-mono overflow-x-auto">
                        <code>
                          {JSON.stringify(ep.responses.find((r) => r.statusCode === 401)?.body, null, 2)}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Section: OpenAPI YAML Spec Preview */}
        <section id="openapi" className="scroll-mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">OpenAPI 3.0.3 Specification</h2>
              <p className="text-xs text-slate-500">Standard YAML specification ready for Swagger UI or Postman.</p>
            </div>
            <button
              onClick={handleDownloadYaml}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download openapi.yaml</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
            <code>{generateOpenApiYaml(config, endpoints)}</code>
          </pre>
        </section>
      </main>
    </div>
  );
};
