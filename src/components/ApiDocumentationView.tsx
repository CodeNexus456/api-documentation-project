import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Search,
  Code2,
  Play,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Globe,
  Terminal,
  FileCode,
} from 'lucide-react';
import { ApiEndpoint, ApiProjectConfig } from '../types/api';
import { generateOpenApiYaml, generateOpenApiJson } from '../utils/openapiGenerator';

interface ApiDocumentationViewProps {
  config: ApiProjectConfig;
  endpoints: ApiEndpoint[];
}

export const ApiDocumentationView: React.FC<ApiDocumentationViewProps> = ({
  config,
  endpoints,
}) => {
  const [activeEndpointId, setActiveEndpointId] = useState<string>(endpoints[0]?.id || 'post-login');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'js' | 'python' | 'go'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'docs' | 'spec'>('docs');

  // Interactive tester state
  const currentEndpoint = endpoints.find((e) => e.id === activeEndpointId) || endpoints[0];
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(currentEndpoint?.requestBodyExample || {}, null, 2)
  );
  const [testResponse, setTestResponse] = useState<{
    status: number;
    statusText: string;
    data: any;
    timeMs: number;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Sync test payload when switching endpoint
  React.useEffect(() => {
    if (currentEndpoint) {
      setTestPayload(JSON.stringify(currentEndpoint.requestBodyExample || {}, null, 2));
      setTestResponse(null);
    }
  }, [activeEndpointId, currentEndpoint]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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

  const handleDownloadJson = () => {
    const jsonStr = generateOpenApiJson(config, endpoints);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendTest = async () => {
    setIsSending(true);
    const startTime = performance.now();
    await new Promise((r) => setTimeout(r, 380));
    const elapsed = Math.round(performance.now() - startTime);

    try {
      const parsed = JSON.parse(testPayload);
      if (currentEndpoint.path === '/api/login') {
        if (!parsed.email || !parsed.password) {
          setTestResponse({
            status: 400,
            statusText: 'Bad Request',
            data: { success: false, message: 'Email and password are required' },
            timeMs: elapsed,
          });
        } else if (parsed.email === 'user@example.com' && parsed.password === 'password') {
          setTestResponse({
            status: 200,
            statusText: 'OK',
            data: {
              success: true,
              token:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            },
            timeMs: elapsed,
          });
        } else {
          setTestResponse({
            status: 401,
            statusText: 'Unauthorized',
            data: { success: false, message: 'Invalid credentials' },
            timeMs: elapsed,
          });
        }
      } else {
        const successRes = currentEndpoint.responses.find((r) => r.statusCode === 200) || currentEndpoint.responses[0];
        setTestResponse({
          status: successRes ? successRes.statusCode : 200,
          statusText: successRes ? successRes.statusText : 'OK',
          data: successRes ? successRes.body : { success: true },
          timeMs: elapsed,
        });
      }
    } catch {
      setTestResponse({
        status: 400,
        statusText: 'Bad Request',
        data: { success: false, message: 'Invalid JSON payload syntax' },
        timeMs: elapsed,
      });
    } finally {
      setIsSending(false);
    }
  };

  const getCodeSnippet = (ep: ApiEndpoint, lang: 'curl' | 'js' | 'python' | 'go') => {
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
${
  payloadStr
    ? `payload = ${JSON.stringify(ep.requestBodyExample, null, 4)}\n\nresponse = requests.${ep.method.toLowerCase()}(url, json=payload, headers=headers)`
    : `response = requests.${ep.method.toLowerCase()}(url, headers=headers)`
}

print(response.status_code)
print(response.json())`;
    }

    if (lang === 'go') {
      return `package main

import (
    "bytes"
    "fmt"
    "net/http"
    "io"
)

func main() {
    url := "${fullUrl}"
    ${payloadStr ? `payload := []byte(\`${JSON.stringify(ep.requestBodyExample)}\`)` : `payload := []byte("")`}
    
    req, _ := http.NewRequest("${ep.method}", url, bytes.NewBuffer(payload))
    req.Header.Set("Content-Type", "application/json")
    ${ep.requiresAuth ? `req.Header.Set("Authorization", "Bearer <token>")` : ''}

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;
    }

    return '';
  };

  const filteredEndpoints = endpoints.filter(
    (ep) =>
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Modern Left Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200/80 p-5 shrink-0 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs border border-slate-200/60">
            <button
              onClick={() => setActiveViewTab('docs')}
              className={`flex-1 py-1.5 font-medium rounded-md transition-all text-center ${
                activeViewTab === 'docs'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Endpoint Explorer
            </button>
            <button
              onClick={() => setActiveViewTab('spec')}
              className={`flex-1 py-1.5 font-medium rounded-md transition-all text-center ${
                activeViewTab === 'spec'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OpenAPI 3.0
            </button>
          </div>

          {/* Navigation group */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Authentication & Endpoints
              </div>
              <div className="space-y-1">
                {filteredEndpoints.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setActiveViewTab('docs');
                      setActiveEndpointId(ep.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between gap-2 ${
                      activeEndpointId === ep.id && activeViewTab === 'docs'
                        ? 'bg-slate-900 text-white font-medium shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="font-mono truncate">{ep.path}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                        activeEndpointId === ep.id && activeViewTab === 'docs'
                          ? 'bg-slate-800 text-blue-300'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Server Environments
              </div>
              <div className="space-y-1.5 text-xs px-2">
                <div className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
                  <span>Production</span>
                  <span className="text-emerald-600 font-medium">Live</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-md font-mono text-[11px] text-slate-700 break-all">
                  {config.baseUrls.production}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OpenAPI Export buttons */}
        <div className="pt-6 border-t border-slate-200/80 space-y-2">
          <button
            onClick={handleDownloadYaml}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/60"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download openapi.yaml</span>
          </button>
          <button
            onClick={handleDownloadJson}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span>Download JSON Spec</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {activeViewTab === 'spec' ? (
          /* OpenAPI Specification Preview */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
              <div>
                <h1 className="text-xl font-bold text-slate-900">OpenAPI 3.0.3 Specification</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Standard OpenAPI definition ready for Swagger UI, Postman, or client code generation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('spec-yaml', generateOpenApiYaml(config, endpoints))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copiedKey === 'spec-yaml' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'spec-yaml' ? 'Copied' : 'Copy YAML'}</span>
                </button>
                <button
                  onClick={handleDownloadYaml}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Spec</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed max-h-[680px]">
              <code>{generateOpenApiYaml(config, endpoints)}</code>
            </div>
          </div>
        ) : (
          /* Modern Interactive Endpoint Explorer */
          <div className="space-y-8">
            {/* Endpoint Hero Lockup */}
            <div className="space-y-3 pb-6 border-b border-slate-200/80">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{config.title}</span>
                <span aria-hidden="true">·</span>
                <span>{currentEndpoint.category}</span>
                <span aria-hidden="true">·</span>
                <span>REST API</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-blue-600 text-white">
                    {currentEndpoint.method}
                  </span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-slate-900 tracking-tight">
                    {currentEndpoint.path}
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleCopy('path-copy', `${config.baseUrls.production}${currentEndpoint.path}`)
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200/60"
                >
                  {copiedKey === 'path-copy' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'path-copy' ? 'Copied' : 'Copy Full URL'}</span>
                </button>
              </div>

              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                {currentEndpoint.description}
              </p>
            </div>

            {/* Two-Column Modern Grid (Left: Specs, Right: Code Playground) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Documentation Specs (7 cols) */}
              <div className="xl:col-span-7 space-y-6">
                {/* Authentication Banner */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Authentication</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentEndpoint.requiresAuth
                      ? 'This endpoint requires an active Bearer JWT token in the Authorization request header.'
                      : 'Public endpoint. No authentication token required to request this resource.'}
                  </p>
                  <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                </div>

                {/* Headers Table */}
                {currentEndpoint.headers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Request Headers
                    </h3>
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Header</th>
                            <th className="py-2 px-3 font-semibold">Type</th>
                            <th className="py-2 px-3 font-semibold">Required</th>
                            <th className="py-2 px-3 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentEndpoint.headers.map((h, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{h.name}</td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono">{h.type}</td>
                              <td className="py-2.5 px-3">
                                {h.required ? (
                                  <span className="text-rose-600 font-semibold">Required</span>
                                ) : (
                                  <span className="text-slate-400">Optional</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{h.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Body Parameters Table */}
                {currentEndpoint.parameters.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Body Parameters
                    </h3>
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Field</th>
                            <th className="py-2 px-3 font-semibold">Type</th>
                            <th className="py-2 px-3 font-semibold">Required</th>
                            <th className="py-2 px-3 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentEndpoint.parameters.map((p, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{p.name}</td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono">{p.type}</td>
                              <td className="py-2.5 px-3">
                                {p.required ? (
                                  <span className="text-rose-600 font-semibold">Required</span>
                                ) : (
                                  <span className="text-slate-400">Optional</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Responses List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Expected Responses
                  </h3>

                  <div className="space-y-3">
                    {currentEndpoint.responses.map((res, idx) => {
                      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
                      return (
                        <div
                          key={idx}
                          className="border border-slate-200/80 rounded-xl overflow-hidden"
                        >
                          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span className="font-mono font-bold text-slate-800">
                                {res.statusCode} {res.statusText}
                              </span>
                              <span className="text-slate-500">·</span>
                              <span className="text-slate-600">{res.description}</span>
                            </div>

                            <button
                              onClick={() =>
                                handleCopy(
                                  `res-${idx}`,
                                  typeof res.body === 'string'
                                    ? res.body
                                    : JSON.stringify(res.body, null, 2)
                                )
                              }
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedKey === `res-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="p-3 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto">
                            <code>
                              {typeof res.body === 'string'
                                ? res.body
                                : JSON.stringify(res.body, null, 2)}
                            </code>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Code Snippet & Interactive Tester (5 cols) */}
              <div className="xl:col-span-5 space-y-4 sticky top-20">
                {/* Code Terminal Box */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {(['curl', 'js', 'python', 'go'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase transition-colors ${
                            selectedLanguage === lang
                              ? 'bg-slate-800 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        handleCopy('code-snippet', getCodeSnippet(currentEndpoint, selectedLanguage))
                      }
                      className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'code-snippet' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'code-snippet' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[300px]">
                    <code>{getCodeSnippet(currentEndpoint, selectedLanguage)}</code>
                  </div>
                </div>

                {/* Interactive Playground / Tester */}
                <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
                  <div className="p-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">Live Request Playground</span>
                    </div>

                    <button
                      onClick={handleSendTest}
                      disabled={isSending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isSending ? 'Sending...' : 'Send Request'}</span>
                    </button>
                  </div>

                  <div className="p-3.5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                        <span>Request Body (JSON)</span>
                        <button
                          onClick={() =>
                            setTestPayload(
                              JSON.stringify(currentEndpoint.requestBodyExample || {}, null, 2)
                            )
                          }
                          className="text-slate-400 hover:text-slate-700 flex items-center gap-1 font-normal"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={testPayload}
                        onChange={(e) => setTestPayload(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {testResponse && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                testResponse.status >= 200 && testResponse.status < 300
                                  ? 'bg-emerald-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span className="font-mono font-bold text-slate-800">
                              {testResponse.status} {testResponse.statusText}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {testResponse.timeMs}ms
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
                          <code>{JSON.stringify(testResponse.data, null, 2)}</code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
