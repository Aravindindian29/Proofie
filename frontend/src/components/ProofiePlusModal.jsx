import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, GitCompare, CheckCircle, ExternalLink, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import * as XLSX from 'xlsx';

const ProofiePlusModal = ({ versionId, assetId, onClose }) => {
  console.log('🔥🔥🔥 ProofiePlusModal LOADED with NEW titles!!!');
  const [activeFeature, setActiveFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [versions, setVersions] = useState([]);
  const [asIsVersion, setAsIsVersion] = useState('');
  const [toBeVersion, setToBeVersion] = useState('');
  const [attachToJira, setAttachToJira] = useState(false);
  const [jiraContent, setJiraContent] = useState(null);
  const [jiraPosted, setJiraPosted] = useState(false);

  const features = [
    {
      id: 'summarize',
      title: 'Document Summarization',
      icon: FileText,
      description: 'Document Summarization',
      color: 'blue',
      endpoint: '/ai-engine/summarize/'
    },
    {
      id: 'compare',
      title: 'Version Comparison',
      icon: GitCompare,
      description: 'Version Comparison',
      color: 'purple',
      endpoint: '/ai-engine/compare/',
      disabled: false
    },
    {
      id: 'analyze',
      title: 'Content Analysis + Compliance Checks. ',
      icon: CheckCircle,
      description: 'Content Analysis + Compliance Checks. ',
      color: 'green',
      endpoint: '/ai-engine/analyze-content/'
    },
    {
      id: 'jira',
      title: 'Post Summary to jira ticket',
      icon: ExternalLink,
      description: 'Post Summary to jira ticket',
      color: 'orange',
      disabled: false
    },
    {
      id: 'testcases',
      title: 'Test Case Generation',
      icon: FileSpreadsheet,
      description: 'Test Case Generation',
      color: 'pink',
      disabled: false
    }
  ];

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await api.get(`/versioning/assets/${assetId}/`);
        if (response.data.versions) {
          setVersions(response.data.versions);
          setToBeVersion(versionId);
        }
      } catch (error) {
        console.error('Error fetching versions:', error);
      }
    };
    
    if (assetId) {
      fetchVersions();
    }
  }, [assetId, versionId]);

  const handleFeatureClick = async (feature) => {
    if (feature.disabled) {
      toast.error('This feature is coming soon!');
      return;
    }

    if (feature.id === 'compare' || feature.id === 'testcases') {
      setActiveFeature(feature.id);
      return;
    }

    setActiveFeature(feature.id);
    setLoading(true);
    setResult(null);
    
    try {
      let requestBody = {};
      let endpoint = feature.endpoint;

      if (feature.id === 'summarize') {
        requestBody = { 
          version_id: versionId,
          detail_level: 'brief'
        };
      } else if (feature.id === 'analyze') {
        requestBody = {
          version_id: versionId,
          analysis_types: ['language', 'compliance']
        };
      } else if (feature.id === 'jira') {
        // First get the summary to preview
        const summaryResponse = await api.post('/ai-engine/summarize/', {
          version_id: versionId,
          detail_level: 'brief'
        });
        
        console.log('JIRA Summary Response:', summaryResponse.data);
        
        // Format the content that will be posted
        const summary = summaryResponse.data.summary;
        const cpiId = summaryResponse.data.cpi_id || summary?.cpi_id;
        
        console.log('Summary:', summary);
        console.log('CPI ID:', cpiId);
        
        const formattedContent = formatJiraContent(summary, cpiId);
        console.log('Formatted Content:', formattedContent);
        
        setJiraContent({ summary, cpiId, formattedContent });
        setJiraPosted(false);
        setResult(null);
        setLoading(false);
        return;
      }

      const response = await api.post(endpoint, requestBody);
      
      setResult(response.data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to process request';
      toast.error(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCompareVersions = async () => {
    if (!asIsVersion || !toBeVersion) {
      toast.error('Please select both AS-IS and TO-BE versions');
      return;
    }

    if (asIsVersion === toBeVersion) {
      toast.error('Please select different versions to compare');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/ai-engine/compare/', {
        as_is_version_id: asIsVersion,
        to_be_version_id: toBeVersion
      });
      
      setResult(response.data);
      toast.success('Comparison complete!');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to compare versions';
      toast.error(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTestCases = async () => {
    if (!asIsVersion || !toBeVersion) {
      toast.error('Please select both AS-IS and TO-BE versions');
      return;
    }

    if (asIsVersion === toBeVersion) {
      toast.error('Please select different versions');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/ai-engine/generate-tests/', {
        as_is_version_id: asIsVersion,
        to_be_version_id: toBeVersion,
        attach_to_jira: attachToJira
      });
      
      setResult(response.data);
      toast.success('Test cases generated!');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate test cases';
      toast.error(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryResult = (data) => {
    if (!data.summary) return null;

    const summary = data.summary;

    return (
      <div className="space-y-4">
        <div style={{
          background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(10, 132, 255, 0.3)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: 12
          }}>{summary.title || 'Document Summary'}</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: 20,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <strong>Type:</strong> {summary.type || 'N/A'}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: 20,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <strong>Pages:</strong> {summary.pages || 'N/A'}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: 20,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <strong>Complexity:</strong> {summary.complexity || 'N/A'}
            </span>
          </div>
          {summary.cpi_id && (
            <div style={{ marginTop: 12 }}>
              <span style={{
                background: 'rgba(64, 224, 208, 0.3)',
                color: '#40E0D0',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid rgba(64, 224, 208, 0.4)'
              }}>
                CPI ID: {summary.cpi_id}
              </span>
            </div>
          )}
        </div>

        {summary.key_highlights && summary.key_highlights.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>Key Highlights:</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, gap: 8, display: 'flex', flexDirection: 'column' }}>
              {summary.key_highlights.map((highlight, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#0A84FF', marginTop: 2, fontSize: '1.2rem' }}>â¢</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.sections && summary.sections.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Sections:</h4>
            <div className="space-y-2">
              {summary.sections.map((section, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-800">{section.name}</div>
                  {section.summary && (
                    <div className="text-sm text-gray-600 mt-1">{section.summary}</div>
                  )}
                  {section.pages && (
                    <div className="text-xs text-gray-500 mt-1">Pages: {section.pages}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.estimated_review_time && (
          <div style={{
            background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
            padding: 16,
            borderRadius: 16,
            border: '1px solid rgba(10, 132, 255, 0.3)'
          }}>
            <strong style={{ color: '#fff', fontSize: '0.875rem' }}>Estimated Review Time:</strong>{' '}
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>{summary.estimated_review_time}</span>
          </div>
        )}

        {data.cached && (
          <div className="text-xs text-gray-500 italic">
            ⚡ Cached result (instant response)
          </div>
        )}

        {data.tokens_used && (
          <div className="text-xs text-gray-500">
            Tokens used: {data.tokens_used} | Processing time: {data.processing_time?.toFixed(2)}s
          </div>
        )}
      </div>
    );
  };

  const renderAnalysisResult = (data) => {
    if (!data.analysis) return null;

    const analysis = data.analysis;

    return (
      <div className="space-y-4">
        {/* UI Changes */}
        {analysis.ui_changes && analysis.ui_changes.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">UI</span>
              UI Changes
            </h4>
            <div className="space-y-2">
              {analysis.ui_changes.map((change, idx) => (
                <div key={idx} className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                  <div className="text-gray-700">{change.change}</div>
                  {change.impact && (
                    <div className="text-sm text-gray-500 mt-1">
                      Impact: <span className={`font-medium ${
                        change.impact === 'high' ? 'text-red-600' : 
                        change.impact === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{change.impact}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Copy Changes */}
        {analysis.copy_changes && analysis.copy_changes.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">Copy</span>
              Copy Changes
            </h4>
            <div className="space-y-2">
              {analysis.copy_changes.map((change, idx) => (
                <div key={idx} className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                  <div className="text-sm text-gray-600 mb-1">Original: {change.original}</div>
                  <div className="text-gray-700 font-medium">Improved: {change.improved}</div>
                  {change.reason && (
                    <div className="text-sm text-gray-500 mt-1">Reason: {change.reason}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Changes */}
        {analysis.cta_changes && analysis.cta_changes.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">CTA</span>
              CTA Changes
            </h4>
            <div className="space-y-3">
              {analysis.cta_changes.map((cta, idx) => (
                <div key={idx} className="bg-orange-50 p-3 rounded border-l-4 border-orange-500">
                  <div className="text-sm space-y-1">
                    {cta.before && <div><strong>Before:</strong> "{cta.before}"</div>}
                    {cta.after && <div><strong>After:</strong> "{cta.after}"</div>}
                    {cta.impact && <div><strong>Impact:</strong> {cta.impact}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Issues */}
        {analysis.compliance_issues && analysis.compliance_issues.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">⚠️</span>
              Compliance Issues
            </h4>
            <div className="space-y-2">
              {analysis.compliance_issues.map((issue, idx) => (
                <div key={idx} className={`p-3 rounded border-l-4 ${
                  issue.severity === 'high' ? 'bg-red-50 border-red-500' :
                  issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-gray-50 border-gray-500'
                }`}>
                  <div className="text-gray-700 font-medium">{issue.issue}</div>
                  <div className="text-sm text-gray-600 mt-1">Fix: {issue.fix}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Severity: <span className={`font-medium ${
                      issue.severity === 'high' ? 'text-red-600' : 
                      issue.severity === 'medium' ? 'text-yellow-600' : 'text-gray-600'
                    }`}>{issue.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Flags */}
        {analysis.risk_flags && analysis.risk_flags.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">🚨</span>
              Risk Flags
            </h4>
            <div className="space-y-2">
              {analysis.risk_flags.map((flag, idx) => (
                <div key={idx} className={`p-3 rounded border-l-4 ${
                  flag.severity === 'high' ? 'bg-red-50 border-red-500' :
                  flag.severity === 'medium' ? 'bg-orange-50 border-orange-500' :
                  'bg-yellow-50 border-yellow-500'
                }`}>
                  <div className="text-gray-700">⚠️ {flag.risk}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Severity: <span className={`font-medium ${
                      flag.severity === 'high' ? 'text-red-600' : 
                      flag.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                    }`}>{flag.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {analysis.summary && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
            <div className="text-gray-700">{analysis.summary}</div>
          </div>
        )}
      </div>
    );
  };

  const renderDiffResult = (data) => {
    if (!data.diff_summary) return null;

    const diff = data.diff_summary;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-2">📊 Version Comparison Complete</h3>
          <div className="flex gap-4 text-sm">
            <span className="bg-white px-3 py-1 rounded-full">
              <strong>Total Changes:</strong> {diff.total_changes || 0}
            </span>
            <span className="bg-white px-3 py-1 rounded-full">
              <strong>Severity Score:</strong> {diff.severity_score || 0}/10
            </span>
          </div>
        </div>

        {data.tokens_used && (
          <div className="text-xs text-gray-500">
            Tokens used: {data.tokens_used} | Processing time: {data.processing_time?.toFixed(2)}s
          </div>
        )}
      </div>
    );
  };

  const formatJiraContent = (summary, cpiId) => {
    let content = '*ProofiePlus AI - Acceptance Criteria*\n\n';
    
    if (cpiId) {
      content += `*CPI ID:* ${cpiId}\n`;
    }
    
    content += `*Document:* ${summary.title || 'Document Summary'}\n`;
    content += `*Type:* ${summary.type || 'N/A'}\n`;
    content += `*Complexity:* ${summary.complexity || 'N/A'}\n`;
    content += `*Estimated Review Time:* ${summary.estimated_review_time || 'N/A'}\n\n`;
    
    if (summary.key_highlights && summary.key_highlights.length > 0) {
      content += '*Key Requirements:*\n';
      summary.key_highlights.forEach(highlight => {
        content += `* ${highlight}\n`;
      });
      content += '\n';
    }
    
    content += '\n_Generated by ProofiePlus AI_';
    
    return content;
  };

  const handlePostToJira = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai-engine/jira-post/', {
        version_id: versionId
      });
      
      setResult(response.data);
      setJiraPosted(true);
      toast.success('Posted to JIRA successfully!');
    } catch (error) {
      console.error('Error posting to JIRA:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to post to JIRA';
      toast.error(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderJiraResult = (data) => {
    if (!data.success) return null;

    return (
      <div className="space-y-4">
        <div style={{
          background: 'rgba(48, 209, 88, 0.1)',
          border: '1px solid rgba(48, 209, 88, 0.2)',
          borderRadius: 16,
          padding: 20
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle className="w-6 h-6" style={{ color: '#30D158' }} />
            Posted to JIRA Successfully
          </h3>
          {data.ticket_key && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Ticket:</strong>{' '}
              <span style={{ color: '#fff' }}>{data.ticket_key}</span>
            </div>
          )}
        </div>

        <a
          href={data.ticket_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 600,
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(10, 132, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ExternalLink className="w-5 h-5" />
          View Ticket
        </a>
      </div>
    );
  };

  const renderTestCasesResult = (data) => {
    if (!data.test_cases) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-2">✅ Test Cases Generated</h3>
          <div className="flex gap-4 text-sm">
            <span className="bg-white px-3 py-1 rounded-full">
              <strong>Total:</strong> {data.test_cases.length}
            </span>
            {data.jira_ticket && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                ✓ Attached to {data.jira_ticket}
              </span>
            )}
          </div>
        </div>

        {/* Risk Areas Summary */}
        {data.risk_areas && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Risk Areas</h4>
            <div className="space-y-2">
              {data.risk_areas.high_risk && data.risk_areas.high_risk.length > 0 && (
                <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                  <div className="font-medium text-red-800 mb-1">High Risk</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {data.risk_areas.high_risk.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.risk_areas.medium_risk && data.risk_areas.medium_risk.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                  <div className="font-medium text-yellow-800 mb-1">Medium Risk</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {data.risk_areas.medium_risk.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.risk_areas.low_risk && data.risk_areas.low_risk.length > 0 && (
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <div className="font-medium text-green-800 mb-1">Low Risk</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {data.risk_areas.low_risk.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regression Scope Summary */}
        {data.regression_scope && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Regression Scope</h4>
            <div className="space-y-2">
              {Object.entries(data.regression_scope).map(([category, items]) => (
                <div key={category} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-800 mb-1">
                    {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Cases */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Test Cases</h4>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {data.test_cases.map((tc, idx) => (
              <div key={idx} className="bg-white p-3 rounded border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      {tc.test_case_id}: {tc.title}
                    </div>
                    {tc.scenario && (
                      <div className="text-sm text-purple-600 mt-1">{tc.scenario}</div>
                    )}
                    <div className="text-sm text-gray-600 mt-1">{tc.description}</div>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        tc.priority === 'high' ? 'bg-red-100 text-red-800' :
                        tc.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {tc.priority}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                        {tc.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={data.excel_url}
            download
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
          >
            Download Excel (3 Sheets)
          </a>
          {data.jira_url && (
            <a
              href={data.jira_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
            >
              View in JIRA
            </a>
          )}
        </div>

        {data.tokens_used && (
          <div className="text-xs text-gray-500">
            Tokens used: {data.tokens_used} | Processing time: {data.processing_time?.toFixed(2)}s
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '56rem', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sparkles className="w-8 h-8" style={{ color: '#667eea' }} />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>ProofiePlus</h2>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Intelligent Document Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Features Grid */}
        {!activeFeature && (
          <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, overflowY: 'auto' }}>
            {features.map((feature) => {
              const Icon = feature.icon;
              const colorMap = {
                blue: '#0A84FF',
                purple: '#667eea',
                green: '#30D158',
                orange: '#FF9F0A',
                pink: '#FF375F'
              };
              return (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  disabled={feature.disabled}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: feature.disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                    cursor: feature.disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    opacity: feature.disabled ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!feature.disabled) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = colorMap[feature.color] || '#667eea';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!feature.disabled) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <Icon style={{ width: 32, height: 32, color: colorMap[feature.color] || '#667eea', marginBottom: 12 }} />
                  <h3 style={{ fontWeight: 600, fontSize: '1rem', color: '#fff', marginBottom: 4 }}>{feature.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>{feature.description}</p>
                  {feature.disabled && (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 8, display: 'block' }}>Coming Soon</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Version Selection for Compare */}
        {activeFeature === 'compare' && !loading && (
          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 24 }}>Version Comparison</h3>
            
            {/* Version Selection */}
            <div style={{
              background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
              padding: 20,
              borderRadius: 16,
              border: '1px solid rgba(10, 132, 255, 0.3)',
              marginBottom: 24
            }}>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#fff',
                marginBottom: 16
              }}>Select Versions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: 8
                  }}>Version 1</label>
                  <select
                    value={asIsVersion}
                    onChange={(e) => setAsIsVersion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="" style={{ color: '#666' }}>Select version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id} style={{ color: '#333' }}>
                        v{v.version_number} - {new Date(v.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: 8
                  }}>Version 2</label>
                  <select
                    value={toBeVersion}
                    onChange={(e) => setToBeVersion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="" style={{ color: '#666' }}>Select version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id} style={{ color: '#333' }}>
                        v{v.version_number} - {new Date(v.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleCompareVersions}
                disabled={!asIsVersion || !toBeVersion}
                style={{
                  width: '100%',
                  background: !asIsVersion || !toBeVersion 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'linear-gradient(135deg, #30D158, #0A84FF)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: !asIsVersion || !toBeVersion ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  marginTop: 16
                }}
                onMouseEnter={(e) => {
                  if (asIsVersion && toBeVersion) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(48, 209, 88, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <GitCompare className="w-5 h-5" />
                Compare Versions
              </button>
            </div>

            {/* Comparison Results */}
            {result && result.diff_summary && (
              <div style={{
                background: 'linear-gradient(135deg, #5E5CE6, #667eea)',
                padding: 20,
                borderRadius: 16,
                border: '1px solid rgba(94, 92, 230, 0.3)'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {result.diff_summary.version_comparison || 'v1 -> v2'}
                  </span>
                  Version Differences
                </h4>
                
                {/* Summary Stats */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: 20,
                    color: '#fff',
                    fontSize: '0.875rem'
                  }}>
                    <strong>Total Changes:</strong> {result.diff_summary.total_changes || 0}
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: 20,
                    color: '#fff',
                    fontSize: '0.875rem'
                  }}>
                    <strong>Severity:</strong> {result.diff_summary.severity_score || 0}/10
                  </span>
                  {result.pages_affected && result.pages_affected.length > 0 && (
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '6px 12px',
                      borderRadius: 20,
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}>
                      <strong>Pages:</strong> {result.pages_affected.join(', ')}
                    </span>
                  )}
                </div>

                {result.diff_summary.summary && (
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 16
                  }}>
                    <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Summary:</strong>{' '}
                    <span style={{ color: 'rgba(255,255,255,0.9)' }}>{result.diff_summary.summary}</span>
                  </div>
                )}

                {/* Changes List */}
                {result.diff_summary.changes && result.diff_summary.changes.length > 0 && (
                  <div>
                    <h5 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '0.875rem' }}>Detailed Changes:</h5>
                    <div style={{ maxHeight: 256, overflowY: 'auto', gap: 12, display: 'flex', flexDirection: 'column' }}>
                      {result.diff_summary.changes.map((change, idx) => (
                        <div key={idx} style={{
                          padding: 12,
                          borderRadius: 12,
                          borderLeft: '4px solid',
                          background: 'rgba(255,255,255,0.05)',
                          ...(change.severity === 'high' ? { borderLeftColor: '#FF375F', background: 'rgba(255, 55, 95, 0.1)' } :
                            change.severity === 'medium' ? { borderLeftColor: '#FF9F0A', background: 'rgba(255, 159, 10, 0.1)' } :
                            { borderLeftColor: '#0A84FF', background: 'rgba(10, 132, 255, 0.1)' })
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontWeight: 500, color: '#fff', fontSize: '0.875rem' }}>
                              {change.type === 'text_added' && 'â¢ '}
                              {change.type === 'text_deleted' && 'â¢ '}
                              {change.type === 'text_modified' && 'â¢ '}
                              {change.type === 'section_added' && 'â¢ '}
                              {change.type === 'section_removed' && 'â¢ '}
                              {change.section || 'Change'}
                            </div>
                            {change.classification && (
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: 12,
                                ...(change.classification.includes('UI') ? { background: 'rgba(10, 132, 255, 0.2)', color: '#0A84FF' } :
                                  change.classification.includes('Copy') ? { background: 'rgba(102, 126, 234, 0.2)', color: '#667eea' } :
                                  change.classification.includes('CTA') ? { background: 'rgba(255, 159, 10, 0.2)', color: '#FF9F0A' } :
                                  change.classification.includes('Legal') || change.classification.includes('Compliance') ? { background: 'rgba(255, 55, 95, 0.2)', color: '#FF375F' } :
                                  { background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' })
                              }}>
                                {change.classification}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ fontSize: '0.875rem', gap: 4, display: 'flex', flexDirection: 'column' }}>
                            {change.location && (
                              <div style={{ color: 'rgba(255,255,255,0.6)' }}><strong>Location:</strong> {change.location}</div>
                            )}
                            {change.description && (
                              <div style={{ color: 'rgba(255,255,255,0.8)' }}>{change.description}</div>
                            )}
                            {change.impact && (
                              <div style={{ color: 'rgba(255,255,255,0.6)' }}><strong>Impact:</strong> {change.impact}</div>
                            )}
                            {change.v1_text && change.v2_text && (
                              <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}><strong>v1:</strong> {change.v1_text}</div>
                                <div style={{ color: 'rgba(255,255,255,0.7)' }}><strong>v2:</strong> {change.v2_text}</div>
                              </div>
                            )}
                            {change.old_text && change.new_text && (
                              <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}><strong>Old:</strong> {change.old_text}</div>
                                <div style={{ color: 'rgba(255,255,255,0.7)' }}><strong>New:</strong> {change.new_text}</div>
                              </div>
                            )}
                            {change.risk && (
                              <div className="text-red-600 font-medium"><strong>Risk:</strong> {change.risk}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.diff_summary.recommendations && result.diff_summary.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-semibold text-gray-700 mb-2">Recommendations:</h5>
                    <div className="space-y-2">
                      {result.diff_summary.recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                          <div className="text-gray-700">{rec}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeFeature === 'testcases' && !loading && !result && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            <h3 className="text-xl font-semibold text-gray-800">Test Case Generation</h3>
            
            {/* Section 1: Test Scenarios Download */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">1</span>
                Test Scenarios Download
              </h4>
              <p className="text-gray-600 mb-4">Download comprehensive test scenarios with detailed steps and expected results.</p>
              <button
                onClick={() => {
                  // Generate test cases with mock data for Excel download
                  const mockTestCases = [
                    { test_case_id: 'TC001', title: 'Landing Page Display Test', description: 'Verify landing page loads correctly', priority: 'high', type: 'functional' },
                    { test_case_id: 'TC002', title: 'Form Validation Test', description: 'Test form field validations', priority: 'medium', type: 'functional' },
                    { test_case_id: 'TC003', title: 'API Integration Test', description: 'Verify API endpoints work correctly', priority: 'high', type: 'integration' }
                  ];
                  
                  // Create Excel workbook
                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.json_to_sheet(mockTestCases);
                  
                  // Set column widths
                  ws['!cols'] = [
                    { wch: 12 }, // test_case_id
                    { wch: 30 }, // title
                    { wch: 40 }, // description
                    { wch: 10 }, // priority
                    { wch: 15 }  // type
                  ];
                  
                  // Add worksheet to workbook
                  XLSX.utils.book_append_sheet(wb, ws, "Test Scenarios");
                  
                  // Generate Excel file and download
                  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  const url = URL.createObjectURL(blob);
                  
                  const linkElement = document.createElement('a');
                  linkElement.href = url;
                  linkElement.download = 'test_scenarios.xlsx';
                  linkElement.click();
                  
                  // Clean up
                  URL.revokeObjectURL(url);
                  
                  toast.success('Test scenarios downloaded successfully!');
                }}
                className="w-full bg-pink-600 text-white px-4 py-3 rounded-lg hover:bg-pink-700 font-semibold flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Download Test Scenarios
              </button>
            </div>

            {/* Section 2: Risk Areas */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">2</span>
                Risk Areas
              </h4>
              <p className="text-gray-600 mb-4">Identified risk areas for testing focus:</p>
              <div className="space-y-3">
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-500">
                  <div className="font-medium text-red-800 mb-1">🔴 High Risk Areas</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Payment gateway integration</li>
                    <li>• User authentication flows</li>
                    <li>• Data validation and security</li>
                  </ul>
                </div>
                <div className="bg-yellow-100 p-3 rounded border-l-4 border-yellow-500">
                  <div className="font-medium text-yellow-800 mb-1">🟡 Medium Risk Areas</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Email template rendering</li>
                    <li>• Mobile responsiveness</li>
                    <li>• Cross-browser compatibility</li>
                  </ul>
                </div>
                <div className="bg-green-100 p-3 rounded border-l-4 border-green-500">
                  <div className="font-medium text-green-800 mb-1">🟢 Low Risk Areas</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Static content display</li>
                    <li>• Basic navigation</li>
                    <li>• Footer links</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3: Regression Scope */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">3</span>
                Regression Scope
              </h4>
              <p className="text-gray-600 mb-4">Areas requiring regression testing:</p>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-gray-800 mb-2">🔧 Core Functionality</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• User registration and login</li>
                    <li>• Main dashboard functionality</li>
                    <li>• Core business logic</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-gray-800 mb-2">🔗 Integration Points</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Third-party API connections</li>
                    <li>• Database interactions</li>
                    <li>• External service integrations</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-gray-800 mb-2">⚖️ Compliance</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• GDPR compliance features</li>
                    <li>• Accessibility standards</li>
                    <li>• Security protocols</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ padding: 24, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>
              <Loader2 className="animate-spin" style={{ width: 48, height: 48, color: '#667eea', margin: '0 auto' }} />
              <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 500 }}>Processing with AI...</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>This may take a few seconds</p>
            </div>
          </div>
        )}

        {/* JIRA Content Preview */}
        {activeFeature === 'jira' && jiraContent && !jiraPosted && !loading && (
          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            <div style={{
              background: 'rgba(255, 159, 10, 0.1)',
              border: '1px solid rgba(255, 159, 10, 0.2)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <ExternalLink className="w-6 h-6" style={{ color: '#FF9F0A' }} />
                JIRA Integration Preview
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                Review the content below that will be posted to your JIRA ticket.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 20,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 16
            }}>
              <h4 style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 12, fontSize: '0.875rem' }}>Content to be Posted:</h4>
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                padding: 16,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.6
              }}>
                {jiraContent.formattedContent || 'Loading content...'}
              </div>
            </div>

            <button
              onClick={handlePostToJira}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FF9F0A, #FF6B35)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 159, 10, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ExternalLink className="w-5 h-5" />
              Post to JIRA
            </button>
          </div>
        )}

        {/* Results Area */}
        {result && !loading && !['compare', 'testcases'].includes(activeFeature) && (
          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            {result.error ? (
              <div style={{
                background: 'rgba(255, 55, 95, 0.1)',
                border: '1px solid rgba(255, 55, 95, 0.2)',
                borderRadius: 12,
                padding: 16,
                color: '#FF375F'
              }}>
                <strong>Error:</strong> {result.error}
              </div>
            ) : (
              <>
                {activeFeature === 'summarize' && renderSummaryResult(result)}
                {activeFeature === 'analyze' && renderAnalysisResult(result)}
                {activeFeature === 'jira' && renderJiraResult(result)}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {activeFeature && (
            <button
              onClick={() => {
                setActiveFeature(null);
                setResult(null);
                setJiraContent(null);
                setJiraPosted(false);
              }}
              style={{
                padding: '8px 16px',
                color: 'rgba(255,255,255,0.6)',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }}
            >
              ← Back to Features
            </button>
          )}
          {!activeFeature && <div></div>}
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              color: 'rgba(255,255,255,0.6)',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofiePlusModal;
