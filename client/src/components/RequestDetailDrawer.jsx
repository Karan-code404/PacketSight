import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRequestById } from '../services/api';
import JsonTree from './JsonTree';
import { getResponseSummary, analyzeStructure } from '../utils/jsonAnalyzer';
import { formatBytes } from '../utils/formatters';

const RequestDetailDrawer = ({ requestId, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        setRequest(null);
        try {
          const res = await getRequestById(requestId);
          setRequest(res.data);
          setActiveTab('overview');
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to fetch request details.');
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isOpen, requestId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!request?.responseBody) return;
    navigator.clipboard.writeText(request.responseBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReRun = () => {
    if (!request) return;

    const formattedHeaders = Object.entries(request.requestHeaders || {}).map(([key, value]) => ({
      id: Math.random().toString(),
      key,
      value
    }));

    onClose();
    navigate('/', { 
      state: { 
        prefill: { 
          url: request.url, 
          method: request.method, 
          headers: formattedHeaders 
        } 
      } 
    });
  };

  const getStatusColorClass = (status) => {
    if (status >= 200 && status < 300) return 'text-success bg-success/10 border-success/30';
    if (status >= 300 && status < 400) return 'text-info bg-info/10 border-info/30';
    if (status >= 400 && status < 500) return 'text-warning bg-warning/10 border-warning/30';
    return 'text-danger bg-danger/10 border-danger/30';
  };

  const getMethodBadgeColorClass = (method) => {
    const m = method?.toUpperCase();
    if (m === 'GET') return 'bg-accent/10 text-accent border border-accent/20';
    if (m === 'POST') return 'bg-success/10 text-success border border-success/20';
    if (m === 'PUT') return 'bg-warning/10 text-warning border border-warning/20';
    if (m === 'PATCH') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    return 'bg-danger/10 text-danger border border-danger/20';
  };

  let isValidJson = false;
  let parsedJson = null;
  let totalKeys = 0;
  let formattedBody = '';

  if (request?.responseBody) {
    try {
      parsedJson = JSON.parse(request.responseBody);
      isValidJson = true;
      formattedBody = JSON.stringify(parsedJson, null, 2);
      totalKeys = Object.keys(parsedJson).length;
    } catch (e) {
      formattedBody = request.responseBody;
    }
  }

  // Insight calculations
  const getInsights = (res) => {
    if (!res) return [];
    const list = [];
    const { responseTime, payloadSize, protocol, securityScore, status, responseHeaders } = res;
    
    const resHeaders = responseHeaders || {};
    const hasHeader = (name) => Object.keys(resHeaders).some(k => k.toLowerCase() === name.toLowerCase());

    if (responseTime > 3000) {
      list.push({
        type: 'critical',
        title: 'Critical Response Latency',
        message: 'API response is critically slow. This would cause poor user experience in production.'
      });
    } else if (responseTime > 1000) {
      list.push({
        type: 'warning',
        title: 'High Response Latency',
        message: 'API response time is unusually slow. Consider optimizing server-side processing or enabling caching.'
      });
    }

    if (payloadSize > 1000000) {
      list.push({
        type: 'warning',
        title: 'Large Payload size',
        message: 'Large response payload detected. Consider pagination or compression.'
      });
    }

    if (protocol === 'HTTP' || protocol === 'http') {
      list.push({
        type: 'critical',
        title: 'Insecure Connection',
        message: 'API is using insecure HTTP. All data is transmitted in plaintext.'
      });
    }

    if (!hasHeader('content-security-policy')) {
      list.push({
        type: 'warning',
        title: 'Missing Content-Security-Policy',
        message: 'Missing CSP header. Your API responses are vulnerable to cross-site scripting.'
      });
    }

    if (!hasHeader('strict-transport-security')) {
      list.push({
        type: 'warning',
        title: 'Missing Strict-Transport-Security',
        message: 'Missing HSTS header. Browsers may not enforce HTTPS for future requests.'
      });
    }

    if (status >= 500) {
      list.push({
        type: 'critical',
        title: 'Server Error Response',
        message: 'Server returned an error response (5xx). Investigate backend logs.'
      });
    } else if (status >= 400) {
      list.push({
        type: 'warning',
        title: 'Client Error Response',
        message: 'Client error response (4xx). Check request URL, method, or authentication headers.'
      });
    }

    if (list.length === 0) {
      list.push({
        type: 'info',
        title: 'API Secure & Healthy',
        message: 'No major issues detected. API appears healthy and well-configured.'
      });
    }

    return list;
  };

  const getSecurityHeaderChecklist = (res) => {
    if (!res) return {};
    const resHeaders = res.responseHeaders || {};
    const hasHeader = (name) => Object.keys(resHeaders).some(k => k.toLowerCase() === name.toLowerCase());
    return {
      'content-security-policy': hasHeader('content-security-policy'),
      'strict-transport-security': hasHeader('strict-transport-security'),
      'x-frame-options': hasHeader('x-frame-options'),
      'x-content-type-options': hasHeader('x-content-type-options'),
      'referrer-policy': hasHeader('referrer-policy')
    };
  };

  const securityChecklist = [
    { key: 'content-security-policy', name: 'Content-Security-Policy', desc: 'Prevents XSS attacks by controlling resource loading.' },
    { key: 'strict-transport-security', name: 'Strict-Transport-Security', desc: 'Forces HTTPS connections for future requests.' },
    { key: 'x-frame-options', name: 'X-Frame-Options', desc: 'Prevents clickjacking by blocking iframe embedding.' },
    { key: 'x-content-type-options', name: 'X-Content-Type-Options', desc: 'Stops MIME-type sniffing attacks.' },
    { key: 'referrer-policy', name: 'Referrer-Policy', desc: 'Controls referrer information sent with requests.' }
  ];

  const secHeaders = getSecurityHeaderChecklist(request);
  const insightsList = getInsights(request);

  const summaryStats = isValidJson ? getResponseSummary(parsedJson) : null;
  const deepStats = isValidJson ? analyzeStructure(parsedJson) : null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Semi-transparent Overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Slide-over container */}
      <div className="relative w-full max-w-[520px] h-full bg-panel border-l border-border flex flex-col shadow-2xl z-10">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-border flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getMethodBadgeColorClass(request?.method)}`}>
                {request?.method}
              </span>
              <h2 className="text-sm font-semibold text-primary truncate font-mono" title={request?.url}>
                {request?.url}
              </h2>
            </div>
            <p className="text-secondary text-[11px] font-mono">ID: {requestId}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-primary text-xs font-semibold px-2 py-1 rounded hover:bg-bg transition-colors shrink-0"
          >
            [Close]
          </button>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-xs text-secondary font-mono animate-pulse">Loading details...</span>
          </div>
        )}

        {error && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold text-danger">[ERROR]</span>
            <p className="text-secondary text-xs mt-1">{error}</p>
          </div>
        )}

        {/* Main Tabs Panel */}
        {request && !loading && (
          <>
            {/* Tabs List */}
            <div className="flex border-b border-border px-3 overflow-x-auto shrink-0 bg-bg/25">
              {['overview', 'response', 'headers', 'security', 'insights', 'structure'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-3 text-[10px] font-bold border-b-2 uppercase tracking-wider whitespace-nowrap transition-colors ${
                    activeTab === tab 
                      ? 'border-accent text-accent' 
                      : 'border-transparent text-secondary hover:text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-bg/40 p-3.5 border border-border rounded-btn">
                      <div className="text-[9px] text-secondary font-bold uppercase tracking-wider font-mono">Status</div>
                      <div className="mt-2 flex">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getStatusColorClass(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    <div className="bg-bg/40 p-3.5 border border-border rounded-btn">
                      <div className="text-[9px] text-secondary font-bold uppercase tracking-wider font-mono">Response Time</div>
                      <div className={`text-base font-bold mt-1.5 ${request.responseTime > 1000 ? 'text-danger' : 'text-primary'}`}>
                        {request.responseTime} ms
                      </div>
                    </div>
                    <div className="bg-bg/40 p-3.5 border border-border rounded-btn">
                      <div className="text-[9px] text-secondary font-bold uppercase tracking-wider font-mono">Payload Size</div>
                      <div className="text-base font-bold text-primary mt-1.5">
                        {formatBytes(request.payloadSize)}
                      </div>
                    </div>
                    <div className="bg-bg/40 p-3.5 border border-border rounded-btn">
                      <div className="text-[9px] text-secondary font-bold uppercase tracking-wider font-mono">Protocol</div>
                      <div className="mt-1.5 flex items-center">
                        {request.protocol === 'HTTPS' ? (
                          <span className="text-success bg-success/5 border border-success/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            [HTTPS SECURED]
                          </span>
                        ) : (
                          <span className="text-danger bg-danger/5 border border-danger/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            [INSECURE HTTP]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Protocol Intelligence Section */}
                  {request.protocolIntelligence && (
                    <div className="border border-border rounded-btn overflow-hidden">
                      <div className="bg-[#131620] border-b border-border p-3">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Protocol Intelligence</h3>
                      </div>
                      <div className="p-3 divide-y divide-border/40 space-y-2.5 text-xs">
                        {[
                          { label: 'Protocol Version', value: request.protocolIntelligence.protocolVersion },
                          { label: 'Scheme', value: request.protocolIntelligence.scheme, isScheme: true },
                          { label: 'Host', value: request.protocolIntelligence.host, isMono: true },
                          { label: 'Port', value: request.protocolIntelligence.port },
                          { label: 'Connection Type', value: request.protocolIntelligence.connectionType },
                          { label: 'Content Encoding', value: request.protocolIntelligence.contentEncoding },
                          { label: 'Transfer Encoding', value: request.protocolIntelligence.transferEncoding },
                          { label: 'Server', value: request.protocolIntelligence.server },
                          { label: 'Cache Control', value: request.protocolIntelligence.cacheControl },
                          { label: 'Content Type', value: request.protocolIntelligence.contentType, isMono: true }
                        ].map((row, index) => (
                          <div key={index} className={`flex justify-between items-center py-2 ${index > 0 ? 'border-t' : ''}`}>
                            <span className="text-secondary font-medium">{row.label}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-primary font-semibold ${row.isMono ? 'font-mono text-[11px] truncate max-w-[200px]' : ''}`}>
                                {row.value || '—'}
                              </span>
                              {row.isScheme && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  row.value === 'HTTPS'
                                    ? 'bg-success/5 text-success border-success/20'
                                    : 'bg-danger/5 text-danger border-danger/20'
                                }`}>
                                  {row.value === 'HTTPS' ? 'Secure' : 'Insecure'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: RESPONSE */}
              {activeTab === 'response' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {isValidJson ? (
                      <div className="flex gap-2">
                        <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded border border-success/25">
                          [Valid JSON]
                        </span>
                        <span className="bg-accent/15 text-accent text-[10px] font-bold px-2 py-0.5 rounded border border-accent/25">
                          Keys: {totalKeys}
                        </span>
                      </div>
                    ) : (
                      <span className="bg-secondary/15 text-secondary text-[10px] font-bold px-2 py-0.5 rounded border border-border">
                        [Raw String]
                      </span>
                    )}
                    <button
                      onClick={handleCopy}
                      className="bg-bg border border-border hover:border-accent text-secondary hover:text-primary px-2.5 py-1.5 rounded-btn flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-[#0F1117] border border-border rounded-btn p-4 overflow-auto max-h-[380px]">
                    <pre className="font-mono text-xs text-primary leading-relaxed whitespace-pre-wrap break-all">
                      {formattedBody || '—'}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB: HEADERS */}
              {activeTab === 'headers' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Request Headers</h4>
                    <div className="border border-border rounded-btn overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <tbody>
                          {Object.entries(request.requestHeaders || {}).map(([k, v], idx) => (
                            <tr key={idx} className={`border-b border-border/20 ${idx % 2 === 0 ? 'bg-[#1A1D27]' : 'bg-[#141720]'}`}>
                              <td className="p-2.5 font-semibold text-primary border-r border-border/20 w-[40%]">{k}</td>
                              <td className="p-2.5 text-secondary break-all">{String(v)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Response Headers</h4>
                    <div className="border border-border rounded-btn overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <tbody>
                          {Object.entries(request.responseHeaders || {}).map(([k, v], idx) => {
                            const isSecurity = [
                              'content-security-policy',
                              'strict-transport-security',
                              'x-frame-options',
                              'x-content-type-options',
                              'referrer-policy'
                            ].includes(k.toLowerCase());

                            return (
                              <tr key={idx} className={`border-b border-border/20 ${idx % 2 === 0 ? 'bg-[#1A1D27]' : 'bg-[#141720]'}`}>
                                <td className="p-2.5 font-semibold text-primary border-r border-border/20 w-[40%] flex items-center gap-1.5">
                                  {k}
                                  {isSecurity && <span className="bg-accent/15 text-accent text-[9px] px-1 py-0.2 rounded border border-accent/20 font-bold font-mono">[SEC]</span>}
                                </td>
                                <td className="p-2.5 text-secondary break-all">{String(v)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-bg/40 border border-border rounded-btn">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">HTTPS Status</span>
                    {request.protocol === 'HTTPS' ? (
                      <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded border border-success/20">
                        [Secure HTTPS]
                      </span>
                    ) : (
                      <span className="bg-danger/10 text-danger text-[10px] font-bold px-2 py-0.5 rounded border border-danger/20">
                        [Insecure HTTP]
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-bg/40 border border-border rounded-btn space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Security Score</span>
                      <span className="text-sm font-bold font-mono" style={{ color: request.securityScore >= 80 ? '#22C55E' : request.securityScore >= 50 ? '#EAB308' : '#EF4444' }}>
                        {request.securityScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-[#1A1D27] h-1.5 rounded-full overflow-hidden border border-border">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${request.securityScore}%`,
                          backgroundColor: request.securityScore >= 80 ? '#22C55E' : request.securityScore >= 50 ? '#EAB308' : '#EF4444'
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Security Headers Audit</h4>
                    <div className="space-y-2">
                      {securityChecklist.map((item) => {
                        const isPresent = secHeaders[item.key];
                        return (
                          <div key={item.key} className="flex gap-3 p-3 bg-bg/25 border border-border rounded-btn">
                            <div className="mt-0.5">
                              <span className="text-[10px] font-bold font-mono">
                                {isPresent ? '[Present]' : '[Missing]'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-primary">{item.name}</span>
                              </div>
                              <p className="text-[10px] text-secondary mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: INSIGHTS */}
              {activeTab === 'insights' && (
                <div className="space-y-3">
                  {insightsList.map((insight, idx) => {
                    let bgBorderClass, badgeClass, label;
                    if (insight.type === 'critical') {
                      bgBorderClass = 'bg-danger/5 border-danger/20 text-danger';
                      badgeClass = 'bg-danger/15 text-danger border-danger/30';
                      label = '[Critical]';
                    } else if (insight.type === 'warning') {
                      bgBorderClass = 'bg-warning/5 border-warning/20 text-warning';
                      badgeClass = 'bg-warning/15 text-warning border-warning/30';
                      label = '[Warning]';
                    } else {
                      bgBorderClass = 'bg-success/5 border-success/20 text-success';
                      badgeClass = 'bg-success/15 text-success border-success/30';
                      label = '[Info]';
                    }

                    return (
                      <div key={idx} className={`flex flex-col gap-1 p-3.5 border rounded-btn ${bgBorderClass}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-bold px-1 py-0.2 rounded border uppercase font-mono ${badgeClass}`}>{label}</span>
                          <h4 className="text-xs font-bold text-primary">{insight.title}</h4>
                        </div>
                        <p className="text-[11px] text-secondary/90 leading-relaxed mt-1">{insight.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB: STRUCTURE */}
              {activeTab === 'structure' && (
                <div className="space-y-4">
                  {!isValidJson ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-bg/20 border border-border border-dashed rounded-btn">
                      <h4 className="text-sm font-semibold text-primary">[Analysis Unavailable]</h4>
                      <p className="text-xs text-secondary max-w-xs mt-1">
                        Response Structure analysis is only available for JSON responses.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Section A: Badges */}
                      <div className="flex gap-2">
                        <span className="flex-1 bg-bg border border-border p-2 rounded-btn text-center">
                          <span className="block text-[8px] text-secondary font-bold uppercase">Root Type</span>
                          <span className="text-xs font-bold text-accent mt-0.5 block">{summaryStats.type}</span>
                        </span>
                        <span className="flex-1 bg-bg border border-border p-2 rounded-btn text-center">
                          <span className="block text-[8px] text-secondary font-bold uppercase">Top Keys</span>
                          <span className="text-xs font-bold text-primary mt-0.5 block">{summaryStats.topLevelKeyCount} keys</span>
                        </span>
                        <span className="flex-1 bg-bg border border-border p-2 rounded-btn text-center">
                          <span className="block text-[8px] text-secondary font-bold uppercase">Array Length</span>
                          <span className="text-xs font-bold text-primary mt-0.5 block">{summaryStats.arrayLength}</span>
                        </span>
                      </div>

                      {/* Section B: Explorer */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Key Explorer</h4>
                        <JsonTree data={parsedJson} />
                      </div>

                      {/* Section C: Nested Structure Detection */}
                      <div className="space-y-1.5 border-t border-border pt-4">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">Detected Structures</h4>
                        <div className="space-y-3 text-xs">
                          {/* Nested Objects */}
                          <div className="bg-bg/25 border border-border p-2.5 rounded-btn">
                            <span className="font-semibold block text-primary font-mono">[Nested Objects]</span>
                            <p className="text-secondary text-[11px] mt-1 leading-relaxed">
                              {deepStats.nestedObjects.length > 0 
                                ? deepStats.nestedObjects.join(', ') 
                                : 'Flat structure. No nested objects detected.'}
                            </p>
                          </div>

                          {/* Arrays */}
                          <div className="bg-bg/25 border border-border p-2.5 rounded-btn">
                            <span className="font-semibold block text-primary font-mono">[Arrays]</span>
                            <p className="text-secondary text-[11px] mt-1 leading-relaxed">
                              {deepStats.arrays.length > 0 
                                ? deepStats.arrays.join(', ') 
                                : 'No nested arrays detected.'}
                            </p>
                          </div>

                          {/* Depth and count */}
                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="bg-bg/25 border border-border p-2.5 rounded-btn">
                              <span className="font-semibold block text-primary text-[10px] font-mono">[Max Depth]</span>
                              <span className="text-secondary text-xs font-bold block mt-0.5">{deepStats.maxDepth} levels</span>
                            </div>
                            <div className="bg-bg/25 border border-border p-2.5 rounded-btn">
                              <span className="font-semibold block text-primary text-[10px] font-mono">[Total Keys]</span>
                              <span className="text-secondary text-xs font-bold block mt-0.5">{deepStats.totalKeys} keys</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Re-run Request Footer */}
            <div className="p-4 border-t border-border shrink-0 bg-bg/40 flex justify-end">
              <button
                onClick={handleReRun}
                className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 px-4 rounded-btn transition-colors shadow-sm"
              >
                Re-run Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestDetailDrawer;
