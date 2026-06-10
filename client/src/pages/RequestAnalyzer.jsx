import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { analyzeRequest } from '../services/api';
import JsonTree from '../components/JsonTree';
import { getResponseSummary, analyzeStructure } from '../utils/jsonAnalyzer';

const securityChecklist = [
  { key: 'content-security-policy', name: 'Content-Security-Policy', desc: 'Prevents XSS attacks by controlling resource loading.' },
  { key: 'strict-transport-security', name: 'Strict-Transport-Security', desc: 'Forces HTTPS connections for future requests.' },
  { key: 'x-frame-options', name: 'X-Frame-Options', desc: 'Prevents clickjacking by blocking iframe embedding.' },
  { key: 'x-content-type-options', name: 'X-Content-Type-Options', desc: 'Stops MIME-type sniffing attacks.' },
  { key: 'referrer-policy', name: 'Referrer-Policy', desc: 'Controls referrer information sent with requests.' }
];

const RequestAnalyzer = () => {
  const location = useLocation();

  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState([
    { id: '1', key: 'Content-Type', value: 'application/json' }
  ]);
  const [requestBody, setRequestBody] = useState('');
  const [headersExpanded, setHeadersExpanded] = useState(true);
  const [bodyExpanded, setBodyExpanded] = useState(true);

  // Output states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  // Method Button definitions
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  // Check Router Prefills on mount
  useEffect(() => {
    if (location.state?.prefill) {
      const { url, method, headers } = location.state.prefill;
      setUrl(url || '');
      setMethod(method || 'GET');
      setHeaders(headers || [{ id: '1', key: 'Content-Type', value: 'application/json' }]);
      toast.info('Prefilled request details from history.');
    }
  }, [location.state]);

  // Header dynamic actions
  const addHeader = () => {
    setHeaders([...headers, { id: Date.now().toString(), key: '', value: '' }]);
  };

  const updateHeader = (id, field, val) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: val } : h));
  };

  const deleteHeader = (id) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  // Submit action
  const handleSend = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);
    const toastId = toast.loading(`Sending ${method} request to ${url}...`);

    try {
      const formattedHeaders = {};
      headers.forEach(h => {
        if (h.key.trim()) {
          formattedHeaders[h.key.trim()] = h.value;
        }
      });

      const data = await analyzeRequest({
        url,
        method,
        headers: formattedHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? requestBody : ''
      });

      setResult(data);
      setActiveTab('overview');
      toast.success('API Request finished successfully!', { id: toastId });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'An unexpected error occurred.';
      setError(errMsg);
      toast.error(`Unable to execute request: ${errMsg}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Copy body to clipboard
  const handleCopy = () => {
    if (!result?.responseBody) return;
    navigator.clipboard.writeText(result.responseBody);
    setCopied(true);
    toast.success('Response copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper: Byte size formatter
  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper: Status code color (Simplified to plain styles)
  const getStatusColorClass = (status) => {
    return 'text-primary bg-bg border-border';
  };

  // Helper: JSON parser & key counter
  let isValidJson = false;
  let parsedJson = null;
  let totalKeys = 0;
  let formattedBody = '';

  if (result?.responseBody) {
    try {
      parsedJson = JSON.parse(result.responseBody);
      isValidJson = true;
      formattedBody = JSON.stringify(parsedJson, null, 2);
      totalKeys = Object.keys(parsedJson).length;
    } catch (e) {
      formattedBody = result.responseBody;
    }
  }

  // Response summary and structure stats
  const summaryStats = isValidJson ? getResponseSummary(parsedJson) : null;
  const deepStats = isValidJson ? analyzeStructure(parsedJson) : null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-primary">Request Analyzer</h1>
        <p className="text-secondary text-sm mt-1">Execute, test, and analyze REST API performance and security headers.</p>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Panel: Request Builder (40% width on Desktop) */}
        <div className="w-full lg:w-[40%] flex flex-col gap-6 bg-panel p-5 rounded-card border border-border shadow-card self-start">
          <div>
            <h2 className="text-xl font-semibold text-primary">Request Builder</h2>
          </div>

          <form onSubmit={handleSend} className="space-y-5">
            {/* API Endpoint URL */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
                API Endpoint URL
              </label>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint"
                className="w-full bg-bg border border-border rounded-btn px-3.5 py-2.5 text-sm text-primary placeholder-secondary/50 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
                Method
              </label>
              <div className="flex bg-bg p-1 rounded-btn border border-border">
                {methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-btn transition-colors ${
                      method === m 
                        ? 'bg-accent text-white shadow-sm' 
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Headers Section */}
            <div className="border border-border rounded-btn p-3 bg-bg/50">
              <button
                type="button"
                onClick={() => setHeadersExpanded(!headersExpanded)}
                className="w-full flex items-center justify-between font-semibold text-xs text-secondary uppercase tracking-wider"
              >
                <span>Request Headers ({headers.length})</span>
                <span className="text-xs font-mono">{headersExpanded ? '[-]' : '[+]'}</span>
              </button>

              {headersExpanded && (
                <div className="mt-3 space-y-2.5">
                  {headers.map((header) => (
                    <div key={header.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Key"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                        className="flex-1 bg-bg border border-border rounded-btn px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                        className="flex-1 bg-bg border border-border rounded-btn px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => deleteHeader(header.id)}
                        className="text-secondary/60 hover:text-danger text-[10px] font-semibold px-2 py-1 border border-border hover:border-danger rounded transition-colors"
                      >
                        [Delete]
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addHeader}
                    className="text-xs font-semibold text-accent hover:text-accent-hover mt-1 transition-colors"
                  >
                    + Add Header
                  </button>
                </div>
              )}
            </div>

            {/* Request Body (only for body-supporting methods) */}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="border border-border rounded-btn p-3 bg-bg/50">
                <button
                  type="button"
                  onClick={() => setBodyExpanded(!bodyExpanded)}
                  className="w-full flex items-center justify-between font-semibold text-xs text-secondary uppercase tracking-wider"
                >
                  <span>Request Body</span>
                  <span className="text-xs font-mono">{bodyExpanded ? '[-]' : '[+]'}</span>
                </button>

                {bodyExpanded && (
                  <div className="mt-3">
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{ "key": "value" }'
                      rows={8}
                      className="w-full bg-bg border border-border rounded-btn p-3 text-xs font-mono text-primary placeholder-secondary/50 focus:outline-none focus:border-accent resize-y"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !url}
              className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2.5 px-4 rounded-btn flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-accent transition-colors shadow-sm"
            >
              {loading ? 'Sending Request...' : 'Send Request'}
            </button>
          </form>

          {/* Direct Error Display */}
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-btn text-xs text-danger flex items-start gap-2">
              <span className="font-bold shrink-0">[Error]</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Panel: Results Panel (60% width on Desktop) */}
        <div className="w-full lg:w-[60%] flex flex-col bg-panel p-5 rounded-card border border-border shadow-card min-h-[500px]">
          
          {/* Empty State */}
          {!result && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <h3 className="text-lg font-semibold text-primary mb-1">Awaiting Execution</h3>
              <p className="text-secondary text-sm max-w-xs">
                Fill in the URL, configure methods, and click "Send Request" to analyze network attributes.
              </p>
            </div>
          )}

          {/* Results Render */}
          {result && (
            <div className="flex flex-col h-full flex-1">
              
              {/* Tabs Navigation (Added Tab 6: Structure) */}
              <div className="flex border-b border-border mb-5 overflow-x-auto">
                {['overview', 'response', 'headers', 'security', 'insights', 'structure'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 uppercase tracking-wider capitalize whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab 
                        ? 'border-accent text-accent' 
                        : 'border-transparent text-secondary hover:text-primary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1">
                
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stat Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Status Code */}
                      <div className="bg-bg/40 p-4 border border-border rounded-btn shadow-sm">
                        <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Status Code</div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className={`text-base font-semibold px-2 py-0.5 rounded border text-primary bg-bg border-border`}>
                            {result.status} {result.statusText}
                          </span>
                        </div>
                      </div>

                      {/* Response Time */}
                      <div className="bg-bg/40 p-4 border border-border rounded-btn shadow-sm">
                        <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Response Time</div>
                        <div className="text-xl font-bold mt-2 text-primary">
                          {result.responseTime} ms
                        </div>
                      </div>

                      {/* Payload Size */}
                      <div className="bg-bg/40 p-4 border border-border rounded-btn shadow-sm">
                        <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Payload Size</div>
                        <div className="text-xl font-bold text-primary mt-2">
                          {formatBytes(result.payloadSize)}
                        </div>
                      </div>

                      {/* Protocol */}
                      <div className="bg-bg/40 p-4 border border-border rounded-btn shadow-sm">
                        <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Protocol</div>
                        <div className="mt-2 flex items-center gap-2">
                          {result.protocol === 'HTTPS' ? (
                            <span className="text-primary bg-bg border border-border px-2 py-0.5 rounded text-xs font-semibold">
                              HTTPS
                            </span>
                          ) : (
                            <span className="text-primary bg-bg border border-border px-2 py-0.5 rounded text-xs font-semibold">
                              HTTP
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Standard Info Card */}
                    <div className="bg-bg/25 border border-border rounded-btn p-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-secondary font-medium uppercase tracking-wider text-[10px]">Host</span>
                        <span className="text-primary font-semibold mt-1 block font-mono truncate">{result.host}</span>
                      </div>
                      <div>
                        <span className="block text-secondary font-medium uppercase tracking-wider text-[10px]">Port</span>
                        <span className="text-primary font-semibold mt-1 block font-mono">{result.port}</span>
                      </div>
                      <div>
                        <span className="block text-secondary font-medium uppercase tracking-wider text-[10px]">Connection</span>
                        <span className="text-primary font-semibold mt-1 block font-mono">{result.connectionType}</span>
                      </div>
                      <div>
                        <span className="block text-secondary font-medium uppercase tracking-wider text-[10px]">Content-Type</span>
                        <span className="text-primary font-semibold mt-1 block font-mono truncate" title={result.contentType}>{result.contentType}</span>
                      </div>
                    </div>

                    {/* Module 3: Protocol Intelligence Grid */}
                    {result.protocolIntelligence && (
                      <div className="border border-border rounded-btn overflow-hidden">
                        <div className="bg-[#131620] border-b border-border p-3">
                          <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Protocol Intelligence</h3>
                        </div>
                        <div className="p-4 divide-y divide-border/40 space-y-2.5 text-xs bg-bg/20">
                          {[
                            { label: 'Protocol Version', value: result.protocolIntelligence.protocolVersion },
                            { label: 'Scheme', value: result.protocolIntelligence.scheme, isScheme: true },
                            { label: 'Host', value: result.protocolIntelligence.host, isMono: true },
                            { label: 'Port', value: result.protocolIntelligence.port },
                            { label: 'Connection Type', value: result.protocolIntelligence.connectionType },
                            { label: 'Content Encoding', value: result.protocolIntelligence.contentEncoding },
                            { label: 'Transfer Encoding', value: result.protocolIntelligence.transferEncoding },
                            { label: 'Server', value: result.protocolIntelligence.server },
                            { label: 'Cache Control', value: result.protocolIntelligence.cacheControl },
                            { label: 'Content Type', value: result.protocolIntelligence.contentType, isMono: true }
                          ].map((row, index) => (
                            <div key={index} className={`flex justify-between items-center py-2 ${index > 0 ? 'border-t' : ''}`}>
                              <span className="text-secondary font-medium">{row.label}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-primary font-semibold ${row.isMono ? 'font-mono text-[11px] truncate max-w-[220px]' : ''}`}>
                                  {row.value || '—'}
                                </span>
                                {row.isScheme && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-bg border-border text-primary">
                                    {row.value === 'HTTPS' ? 'Secure' : 'Insecure'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance Benchmarks */}
                    {result.performance && result.performance.totalRequests >= 2 && (
                      <div className="border-t border-border pt-5 space-y-3">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Performance Benchmarks</h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-bg/60 p-3 rounded-btn border border-border text-center">
                            <span className="block text-[9px] text-secondary font-semibold uppercase tracking-wider">Avg Latency</span>
                            <span className="text-base font-bold text-primary mt-1 block font-mono">{result.performance.averageResponseTime} ms</span>
                          </div>
                          <div className="bg-bg/60 p-3 rounded-btn border border-border text-center">
                            <span className="block text-[9px] text-secondary font-semibold uppercase tracking-wider">Fastest</span>
                            <span className="text-base font-bold text-primary mt-1 block font-mono">{result.performance.fastestResponseTime} ms</span>
                          </div>
                          <div className="bg-bg/60 p-3 rounded-btn border border-border text-center">
                            <span className="block text-[9px] text-secondary font-semibold uppercase tracking-wider">Slowest</span>
                            <span className="text-base font-bold text-primary mt-1 block font-mono">{result.performance.slowestResponseTime} ms</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-secondary/65 text-right font-mono italic">
                          Based on {result.performance.totalRequests} requests to this host
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: RESPONSE */}
                {activeTab === 'response' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {isValidJson ? (
                        <div className="flex gap-2">
                          <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded border border-success/25">
                            ✓ Valid JSON
                          </span>
                          <span className="bg-accent/15 text-accent text-[10px] font-bold px-2 py-0.5 rounded border border-accent/25">
                            Keys: {totalKeys}
                          </span>
                        </div>
                      ) : (
                        <span className="bg-secondary/15 text-secondary text-[10px] font-bold px-2 py-0.5 rounded border border-border">
                          Raw String Output
                        </span>
                      )}

                      <button
                        onClick={handleCopy}
                        className="bg-bg border border-border hover:border-accent text-secondary hover:text-primary px-3 py-1.5 rounded-btn text-xs font-semibold transition-colors"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="bg-[#0F1117] border border-border rounded-btn p-4 overflow-auto max-h-[420px]">
                      <pre className="font-mono text-xs text-primary leading-relaxed whitespace-pre-wrap break-all">
                        {formattedBody}
                      </pre>
                    </div>
                  </div>
                )}

                {/* TAB 3: HEADERS */}
                {activeTab === 'headers' && (
                  <div className="space-y-5">
                    
                    {/* Request Headers */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Request Headers</h3>
                      <div className="border border-border rounded-btn overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="bg-[#131620] border-b border-border text-secondary font-semibold uppercase tracking-wider text-[10px]">
                              <th className="p-2.5">Header Name</th>
                              <th className="p-2.5">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(result.requestHeaders || {}).map(([key, val], idx) => (
                              <tr 
                                key={key} 
                                className={`border-b border-border/20 ${idx % 2 === 0 ? 'bg-[#1A1D27]' : 'bg-[#141720]'}`}
                              >
                                <td className="p-2.5 font-semibold text-primary">{key}</td>
                                <td className="p-2.5 text-secondary break-all">{String(val)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Response Headers */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Response Headers</h3>
                      <div className="border border-border rounded-btn overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="bg-[#131620] border-b border-border text-secondary font-semibold uppercase tracking-wider text-[10px]">
                              <th className="p-2.5">Header Name</th>
                              <th className="p-2.5">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(result.responseHeaders || {}).map(([key, val], idx) => {
                              const isSecurity = [
                                'content-security-policy',
                                'strict-transport-security',
                                'x-frame-options',
                                'x-content-type-options',
                                'referrer-policy'
                              ].includes(key.toLowerCase());

                              return (
                                <tr 
                                  key={key} 
                                  className={`border-b border-border/20 ${idx % 2 === 0 ? 'bg-[#1A1D27]' : 'bg-[#141720]'}`}
                                >
                                  <td className="p-2.5 font-semibold text-primary flex items-center gap-1.5">
                                    {key}
                                    {isSecurity && (
                                      <span className="bg-bg text-secondary text-[9px] font-bold px-1 py-0.2 rounded border border-border">
                                        [SEC]
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-secondary break-all">{String(val)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 4: SECURITY */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    {/* HTTPS Status Card */}
                    <div className="flex items-center justify-between p-4 bg-bg/40 border border-border rounded-btn">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">HTTPS Status</span>
                      {result.protocol === 'HTTPS' ? (
                        <span className="bg-bg text-primary text-xs font-semibold px-3 py-1 rounded-btn border border-border">
                          [HTTPS SECURED]
                        </span>
                      ) : (
                        <span className="bg-bg text-primary text-xs font-semibold px-3 py-1 rounded-btn border border-border">
                          [INSECURE HTTP]
                        </span>
                      )}
                    </div>

                    {/* Security Score Widget */}
                    <div className="p-4 bg-bg/40 border border-border rounded-btn space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Security Score</span>
                        <span className="text-lg font-bold font-mono text-primary">
                          {result.securityScore} / 100
                        </span>
                      </div>
                      <div className="w-full bg-[#1A1D27] h-2 rounded-full overflow-hidden border border-border">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${result.securityScore}%`,
                            backgroundColor: result.securityScore >= 80 ? '#22C55E' : result.securityScore >= 50 ? '#EAB308' : '#EF4444'
                          }}
                        />
                      </div>
                    </div>

                    {/* Security Headers Checklist */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Security Headers Audit</h3>
                      <div className="space-y-2.5">
                        {securityChecklist.map((item) => {
                          const isPresent = result.securityHeaders?.[item.key];
                          return (
                            <div key={item.key} className="flex items-start gap-3 p-3 bg-bg/20 border border-border rounded-btn">
                              <div className="mt-0.5 shrink-0">
                                {isPresent ? (
                                  <span className="text-[10px] font-bold font-mono text-primary">
                                    [Present]
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold font-mono text-secondary">
                                    [Missing]
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-primary">{item.name}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-bg border-border text-primary">
                                    {isPresent ? 'PRESENT' : 'MISSING'}
                                  </span>
                                </div>
                                <p className="text-xs text-secondary/80 font-normal">{item.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: SMART INSIGHTS */}
                {activeTab === 'insights' && (
                  <div className="space-y-3.5">
                    {result.insights && result.insights.map((insight, idx) => {
                      let label, cardStyle;
                      if (insight.type === 'critical') {
                        label = '[CRITICAL]';
                        cardStyle = 'border-l-4 border-danger bg-[#1A1D27] text-primary';
                      } else if (insight.type === 'warning') {
                        label = '[WARNING]';
                        cardStyle = 'border-l-4 border-warning bg-[#1A1D27] text-primary';
                      } else {
                        label = '[INFO]';
                        cardStyle = 'border-l-4 border-success bg-[#1A1D27] text-primary';
                      }

                      return (
                        <div key={idx} className={`flex gap-3.5 p-4 rounded-btn ${cardStyle} border border-border/40 transition-all duration-150`}>
                          <div className="mt-0.5 shrink-0 text-xs font-mono font-bold select-none">{label}</div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2.5">
                              <h4 className="text-sm font-bold leading-tight text-primary">{insight.category} Recommendation</h4>
                            </div>
                            <p className="text-xs text-secondary leading-relaxed font-medium">{insight.message}</p>
                          </div>
                        </div>
                      );
                    })}
                    {(!result.insights || result.insights.length === 0) && (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-secondary bg-bg/20 border border-border border-dashed rounded-btn">
                        <span className="text-xs font-semibold text-primary">No issues flagged. API meets optimal configuration.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: RESPONSE STRUCTURE */}
                {activeTab === 'structure' && (
                  <div className="space-y-4">
                    {!isValidJson ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-bg/20 border border-border border-dashed rounded-btn">
                        <h4 className="text-sm font-semibold text-primary">JSON analysis unavailable</h4>
                        <p className="text-xs text-secondary mt-1 max-w-xs">
                          Response Structure analysis is only available for JSON responses.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Section A: Badges */}
                        <div className="flex gap-2">
                          <span className="flex-1 bg-bg border border-border p-2 rounded-btn text-center">
                            <span className="block text-[8px] text-secondary font-bold uppercase tracking-wider">Root Type</span>
                            <span className="text-xs font-bold text-accent mt-0.5 block">{summaryStats.type}</span>
                          </span>
                          <span className="flex-1 bg-bg border border-border p-2 rounded-btn text-center">
                            <span className="block text-[8px] text-secondary font-bold uppercase tracking-wider">Top Keys</span>
                            <span className="text-xs font-bold text-primary mt-0.5 block">{summaryStats.topLevelKeyCount} keys</span>
                          </span>
                          <span className="flex-1 bg-bg border border-border p-2 rounded-btn text-center">
                            <span className="block text-[8px] text-secondary font-bold uppercase tracking-wider">Array Length</span>
                            <span className="text-xs font-bold text-primary mt-0.5 block">{summaryStats.arrayLength}</span>
                          </span>
                        </div>

                        {/* Section B: Tree Explorer */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Key Explorer</h4>
                          <JsonTree data={parsedJson} />
                        </div>

                        {/* Section C: Nested Structure Detection */}
                        <div className="space-y-1.5 border-t border-border pt-4">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Detected Structures</h4>
                          <div className="space-y-3.5 text-xs">
                            {/* Nested Objects */}
                            <div className="flex items-start gap-2.5 bg-bg/20 border border-border p-3 rounded-btn">
                              <div>
                                <span className="font-semibold text-primary font-mono">[Nested Objects]</span>
                                <p className="text-secondary text-[11px] mt-0.5 leading-relaxed">
                                  {deepStats.nestedObjects.length > 0 
                                    ? deepStats.nestedObjects.join(', ') 
                                    : 'Flat structure. No nested objects detected.'}
                                </p>
                              </div>
                            </div>

                            {/* Arrays */}
                            <div className="flex items-start gap-2.5 bg-bg/20 border border-border p-3 rounded-btn">
                              <div>
                                <span className="font-semibold text-primary font-mono">[Arrays]</span>
                                <p className="text-secondary text-[11px] mt-0.5 leading-relaxed">
                                  {deepStats.arrays.length > 0 
                                    ? deepStats.arrays.join(', ') 
                                    : 'No nested arrays detected.'}
                                </p>
                              </div>
                            </div>

                            {/* Nesting depth and count */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2.5 bg-bg/20 border border-border p-3 rounded-btn">
                                <div>
                                  <span className="font-semibold text-primary block text-[11px] font-mono">[Max Depth]</span>
                                  <span className="text-secondary text-xs font-bold block mt-0.5">{deepStats.maxDepth} levels</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5 bg-bg/20 border border-border p-3 rounded-btn">
                                <div>
                                  <span className="font-semibold text-primary block text-[11px] font-mono">[Total Keys]</span>
                                  <span className="text-secondary text-xs font-bold block mt-0.5">{deepStats.totalKeys} keys (deep)</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RequestAnalyzer;
