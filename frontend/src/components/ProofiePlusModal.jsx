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
      description: 'High level summary of the proof',
      color: 'blue',
      endpoint: '/ai-engine/summarize/'
    },
    {
      id: 'compare',
      title: 'Version Comparison',
      icon: GitCompare,
      description: 'Compares 2 different versions of the same proof',
      color: 'purple',
      endpoint: '/ai-engine/compare/',
      disabled: true
    },
    {
      id: 'analyze',
      title: 'Content Analysis + Smart UX Change Detection',
      icon: CheckCircle,
      description: 'Helps with suggestions in content improvements',
      color: 'green',
      endpoint: '/ai-engine/analyze-content/'
    },
    {
      id: 'jira',
      title: 'Jira Integration',
      icon: ExternalLink,
      description: 'Post Acceptance Criteria to Jira',
      color: 'orange',
      disabled: false
    },
    {
      id: 'testcases',
      title: 'Test Case Generation',
      icon: FileSpreadsheet,
      description: 'Helps in QA validation with basic test coverage',
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
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/ai-engine/generate-tests-single/', {
        version_id: versionId
      });
      
      setResult(response.data);
      
      // Automatically trigger Excel download
      if (response.data.excel_url) {
        const link = document.createElement('a');
        link.href = response.data.excel_url;
        link.download = response.data.excel_filename || 'test_cases.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Test cases downloaded successfully!');
        
        // Return to ProofiePlus features after download
        setTimeout(() => {
          setActiveFeature(null);
          setResult(null);
        }, 1500); // Wait 1.5 seconds for user to see the success message
      }
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
        {/* Header with high-level summary */}
        <div style={{
          background: 'transparent',
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(10, 132, 255, 0.3)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: 12
          }}>Document Summary</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span style={{
              background: 'transparent',
              padding: '6px 12px',
              borderRadius: 20,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <strong>Pages:</strong> {summary.pages || 'N/A'}
            </span>
            <span style={{
              background: 'transparent',
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
                background: 'transparent',
                color: '#40E0D0',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid rgba(64, 224, 208, 0.4)'
              }}>
                {summary.cpi_id}
              </span>
            </div>
          )}
        </div>

        {/* High-level summary */}
        {summary.high_level_summary && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>High-Level Summary:</h4>
            <div style={{
              background: 'transparent',
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.6
            }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, gap: 8, display: 'flex', flexDirection: 'column' }}>
                {(() => {
                  const text = summary.high_level_summary;
                  // Split by common separators and create meaningful bullet points
                  const points = text.split(/,?\s*(?:by|and|to|for|with|in)\s+/).filter(point => point.trim().length > 0);
                  
                  // If the split doesn't work well, fallback to sentence splitting
                  const finalPoints = points.length > 1 ? points : text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
                  
                  return finalPoints.map((point, idx) => {
                    const cleanPoint = point.trim().replace(/^[,\s]+|[,\s]+$/g, '');
                    const formattedPoint = cleanPoint.charAt(0).toUpperCase() + cleanPoint.slice(1) + (cleanPoint.endsWith('.') ? '' : '.');
                    return (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: '#0A84FF', marginTop: 2, fontSize: '1.2rem' }}>&bull;</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                          {formattedPoint}
                        </span>
                      </li>
                    );
                  });
                })()}
              </ul>
            </div>
          </div>
        )}

        {/* Changes included */}
        {summary.changes_included && summary.changes_included.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>Changes Included:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {summary.changes_included.map((change, idx) => (
                <div key={idx} style={{
                  background: 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>{change.description}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {change.affected_channels && change.affected_channels.map((channel, channelIdx) => (
                      <span key={channelIdx} style={{
                        background: 'transparent',
                        color: '#0A84FF',
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>
                        {channel}
                      </span>
                    ))}
                    <span style={{
                      background: change.impact_level === 'high' ? 'rgba(255, 59, 48, 0.2)' : 
                                 change.impact_level === 'medium' ? 'rgba(255, 149, 0, 0.2)' : 
                                 'rgba(52, 199, 89, 0.2)',
                      color: change.impact_level === 'high' ? '#FF3B30' : 
                             change.impact_level === 'medium' ? '#FF9500' : 
                             '#34C759',
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {change.impact_level} impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Application pages with changes */}
        {summary.application_pages_with_changes && summary.application_pages_with_changes.filter(page => page && (page.page_name || page.description || page.change_type)).length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>Application Pages with Changes:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {summary.application_pages_with_changes.filter(page => page && (page.page_name || page.description || page.change_type)).map((page, idx) => (
                <div key={idx} style={{
                  background: 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {page.page_name && (
                    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>{page.page_name}</div>
                  )}
                  {page.change_type && (
                    <div style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      fontSize: '0.875rem', 
                      marginBottom: 8 
                    }}>
                      Type: {page.change_type}
                    </div>
                  )}
                  {page.description && (
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                      {page.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* A/B Testing */}
        {summary.ab_testing_included && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>A/B Testing:</h4>
            <div style={{
              background: 'transparent',
              padding: 16,
              borderRadius: 12,
              border: summary.ab_testing_included.has_ab_testing ? '1px solid rgba(52, 199, 89, 0.3)' : '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                color: summary.ab_testing_included.has_ab_testing ? '#34C759' : 'rgba(255,255,255,0.6)',
                fontWeight: 600,
                marginBottom: 8
              }}>
                {summary.ab_testing_included.has_ab_testing ? 'â A/B Testing Included' : 'â No A/B Testing'}
              </div>
              {summary.ab_testing_included.test_details && (
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                  {summary.ab_testing_included.test_details}
                </div>
              )}
            </div>
          </div>
        )}

        
        {/* Disclosures */}
        {summary.disclosures && summary.disclosures.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>Disclosures:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {summary.disclosures.map((disclosure, idx) => (
                <div key={idx} style={{
                  background: 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  border: disclosure.importance === 'high' ? '1px solid rgba(255, 59, 48, 0.3)' : 
                           disclosure.importance === 'medium' ? '1px solid rgba(255, 149, 0, 0.3)' : 
                           '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 8 
                  }}>
                    <span style={{
                      background: disclosure.type === 'new' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                      color: disclosure.type === 'new' ? '#34C759' : '#FF9500',
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {disclosure.type.toUpperCase()}
                    </span>
                    <span style={{
                      background: disclosure.importance === 'high' ? 'rgba(255, 59, 48, 0.2)' : 
                                 disclosure.importance === 'medium' ? 'rgba(255, 149, 0, 0.2)' : 
                                 'rgba(52, 199, 89, 0.2)',
                      color: disclosure.importance === 'high' ? '#FF3B30' : 
                             disclosure.importance === 'medium' ? '#FF9500' : 
                             '#34C759',
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {disclosure.importance} importance
                    </span>
                  </div>
                  <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                    {disclosure.location}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                    {disclosure.disclosure_text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional highlights (fallback for old structure) */}
        {summary.key_highlights && summary.key_highlights.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>Key Highlights:</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, gap: 8, display: 'flex', flexDirection: 'column' }}>
              {summary.key_highlights.map((highlight, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#0A84FF', marginTop: 2, fontSize: '1.2rem' }}>&bull;</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        
        {/* Sections (fallback for old structure) */}
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


        {data.cached && (
          <div className="text-xs text-gray-500 italic">
            â¡ Cached result (instant response)
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
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }} className="flex items-center gap-2">
              <span style={{
                background: 'transparent',
                color: '#0A84FF',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid rgba(10, 132, 255, 0.3)'
              }}>UI</span>
              UI Changes
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.ui_changes.map((change, idx) => (
                <div key={idx} style={{
                  background: 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(10, 132, 255, 0.3)'
                }}>
                  <div style={{ color: '#fff' }}>{change.change}</div>
                  {change.details && (
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: 4 }}>
                      {change.details}
                    </div>
                  )}
                  {change.impact && (
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginTop: 8 }}>
                      Impact: <span style={{
                        fontWeight: 500,
                        color: change.impact === 'high' ? '#FF3B30' : 
                               change.impact === 'medium' ? '#FF9500' : '#34C759'
                      }}>{change.impact}</span>
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
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }} className="flex items-center gap-2">
              <span style={{
                background: 'transparent',
                color: '#667eea',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid rgba(102, 126, 234, 0.3)'
              }}>Copy</span>
              Copy Changes
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.copy_changes.map((change, idx) => (
                <div key={idx} style={{
                  background: 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(102, 126, 234, 0.3)'
                }}>
                  {change.area && (
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: 4 }}>
                      Area: {change.area}
                    </div>
                  )}
                  {change.original && (
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 4 }}>
                      Original: {change.original}
                    </div>
                  )}
                  <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                    Improved: {change.improved}
                  </div>
                  {change.reason && (
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginTop: 4 }}>
                      Reason: {change.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Changes */}
        {analysis.cta_changes && analysis.cta_changes.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }} className="flex items-center gap-2">
              <span style={{
                background: 'transparent',
                color: '#FF9F0A',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid rgba(255, 159, 10, 0.3)'
              }}>CTA</span>
              CTA Changes
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.cta_changes.map((cta, idx) => (
                <div key={idx} style={{
                  background: 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(255, 159, 10, 0.3)'
                }}>
                  <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>
                    {cta.cta_name}
                  </div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {cta.before && (
                      <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                        <strong>Before:</strong> "{cta.before}"
                      </div>
                    )}
                    {cta.after && (
                      <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                        <strong>After:</strong> "{cta.after}"
                      </div>
                    )}
                    {cta.impact && (
                      <div style={{ color: 'rgba(255,255,255,0.6)' }}>
                        <strong>Impact:</strong> {cta.impact}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Issues */}
        {analysis.compliance_issues && analysis.compliance_issues.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }} className="flex items-center gap-2">
              <span style={{
                background: 'transparent',
                color: '#FF375F',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid rgba(255, 55, 95, 0.3)'
              }}>⚠️</span>
              Compliance Issues
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.compliance_issues.map((issue, idx) => (
                <div key={idx} style={{
                  background: 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  border: issue.severity === 'high' ? '1px solid rgba(255, 55, 95, 0.3)' :
                         issue.severity === 'medium' ? '1px solid rgba(255, 149, 0, 0.3)' :
                         '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>{issue.issue}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 8 }}>Fix: {issue.fix}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    Severity: <span style={{
                      fontWeight: 500,
                      color: issue.severity === 'high' ? '#FF375F' : 
                             issue.severity === 'medium' ? '#FF9500' : '#fff'
                    }}>{issue.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Flags */}
        {analysis.risk_flags && analysis.risk_flags.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }} className="flex items-center gap-2">
              <span style={{
                background: 'transparent',
                color: '#FF375F',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid rgba(255, 55, 95, 0.3)'
              }}>🚨</span>
              Risk Flags
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.risk_flags.map((flag, idx) => (
                <div key={idx} style={{
                  background: 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  border: flag.severity === 'high' ? '1px solid rgba(255, 55, 95, 0.3)' :
                         flag.severity === 'medium' ? '1px solid rgba(255, 159, 10, 0.3)' :
                         '1px solid rgba(255, 149, 0, 0.3)'
                }}>
                  <div style={{ color: '#fff', marginBottom: 8 }}>⚠️ {flag.risk}</div>
                  {flag.mitigation && (
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 8 }}>
                      Mitigation: {flag.mitigation}
                    </div>
                  )}
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    Severity: <span style={{
                      fontWeight: 500,
                      color: flag.severity === 'high' ? '#FF375F' : 
                             flag.severity === 'medium' ? '#FF9500' : '#FF9F0A'
                    }}>{flag.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {analysis.summary && (
          <div style={{
            background: 'transparent',
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>Summary</h4>
            <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{analysis.summary}</div>
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
    
    // Determine document type based on content analysis
    let docType = 'Technical Specification';
    if (summary.new_email_templates && summary.new_email_templates.length > 0) {
      docType = 'Email Templates Specification';
    } else if (summary.ab_testing_included && summary.ab_testing_included.has_ab_testing) {
      docType = 'A/B Testing Specification';
    } else if (summary.application_pages_with_changes && summary.application_pages_with_changes.length > 0) {
      docType = 'Application Flow Changes';
    } else if (summary.high_level_summary && (summary.high_level_summary.toLowerCase().includes('ux') || summary.high_level_summary.toLowerCase().includes('ui'))) {
      docType = 'UX Specification';
    }
    
    content += `*Type:* ${docType}\n`;
    content += `*Complexity:* ${summary.complexity || 'N/A'}\n\n`;
    
    // Add high-level summary as bullet points
    if (summary.high_level_summary) {
      content += '*Summary:*\n';
      // Split summary by common separators to create meaningful bullet points
      let points = [];
      const text = summary.high_level_summary;
      
      // Try splitting by "through", "by", "via", "including", commas followed by "and"
      const splitPatterns = [
        /\s+through\s+/i,
        /\s+by\s+/i,
        /\s+via\s+/i,
        /,\s*and\s+/i,
        /\s+including\s+/i
      ];
      
      // Split the text into parts
      let parts = [text];
      splitPatterns.forEach(pattern => {
        let newParts = [];
        parts.forEach(part => {
          const split = part.split(pattern);
          newParts.push(...split);
        });
        parts = newParts;
      });
      
      // Clean and format each part as a bullet point
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed && trimmed.length > 10) { // Only add meaningful points
          // Capitalize first letter and ensure proper formatting
          let formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          // Remove trailing periods or commas
          formatted = formatted.replace(/[,.]$/, '');
          content += `* ${formatted}\n`;
        }
      });
      content += '\n';
    }
    
    // Add changes included
    if (summary.changes_included && summary.changes_included.length > 0) {
      content += '*Changes Included:*\n';
      summary.changes_included.forEach(change => {
        content += `* ${change.description}`;
        if (change.affected_channels && change.affected_channels.length > 0) {
          content += ` (Channels: ${change.affected_channels.join(', ')})`;
        }
        content += '\n';
      });
      content += '\n';
    }
    
    // Add application pages with changes (filter out empty entries)
    const validPages = summary.application_pages_with_changes?.filter(page => page && (page.page_name || page.description || page.change_type)) || [];
    if (validPages.length > 0) {
      content += '*Application Pages with Changes:*\n';
      validPages.forEach(page => {
        if (page.page_name && page.description) {
          content += `* ${page.page_name}: ${page.description}\n`;
        } else if (page.page_name) {
          content += `* ${page.page_name}\n`;
        }
      });
      content += '\n';
    }
    
    // Add A/B testing info
    if (summary.ab_testing_included && summary.ab_testing_included.has_ab_testing) {
      content += '*A/B Testing:*\n';
      content += `* ${summary.ab_testing_included.test_details || 'A/B testing is included'}\n\n`;
    }
    
    // Fallback to key_highlights if present (for backward compatibility)
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
        version_id: versionId,
        formatted_content: jiraContent?.formattedContent || ''
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
          background: 'transparent',
          border: '1px solid rgba(48, 209, 88, 0.3)',
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
              background: 'transparent',
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
        <div style={{
          background: 'transparent',
          border: '1px solid rgba(255, 55, 95, 0.3)',
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
            <FileSpreadsheet className="w-6 h-6" style={{ color: '#FF375F' }} />
            Test Cases Generated
          </h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span style={{
              background: 'transparent',
              padding: '6px 12px',
              borderRadius: 20,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <strong>Total:</strong> {data.test_cases.length}
            </span>
            {data.jira_ticket && (
              <span style={{
                background: 'transparent',
                padding: '6px 12px',
                borderRadius: 20,
                color: '#34C759',
                border: '1px solid rgba(52, 199, 89, 0.3)'
              }}>
                ✓ Attached to {data.jira_ticket}
              </span>
            )}
          </div>
        </div>

        {/* QA Validation Scope */}
        {data.qa_validation_scope && data.qa_validation_scope.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>QA Validation Scope</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.qa_validation_scope.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#0A84FF', marginTop: 2, fontSize: '1.2rem' }}>&bull;</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Cases */}
        <div>
          <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '1rem' }}>Test Cases</h4>
          <div style={{ maxHeight: '24rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.test_cases.map((tc, idx) => (
              <div key={idx} style={{
                background: 'transparent',
                padding: 16,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                      {tc.test_case_id}: {tc.title}
                    </div>
                    {tc.scenario && (
                      <div style={{ color: '#667eea', fontSize: '0.875rem', marginBottom: 4 }}>{tc.scenario}</div>
                    )}
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 8 }}>{tc.description}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontWeight: 500,
                        ...(tc.priority === 'high' ? { background: 'transparent', color: '#FF375F', border: '1px solid rgba(255, 55, 95, 0.3)' } :
                         tc.priority === 'medium' ? { background: 'transparent', color: '#FF9500', border: '1px solid rgba(255, 149, 0, 0.3)' } :
                         { background: 'transparent', color: '#0A84FF', border: '1px solid rgba(10, 132, 255, 0.3)' })
                      }}>
                        {tc.priority}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontWeight: 500,
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
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
          <button
            onClick={() => {
              if (data.excel_url) {
                const link = document.createElement('a');
                link.href = data.excel_url;
                link.download = data.excel_filename || 'test_cases.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Excel file downloaded!');
              }
            }}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center font-semibold flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Download Excel File
          </button>
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
            {features.filter(f => !f.disabled).map((feature) => {
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
          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            <div style={{
              background: 'rgba(255, 55, 95, 0.1)',
              border: '1px solid rgba(255, 55, 95, 0.2)',
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
                <FileSpreadsheet className="w-6 h-6" style={{ color: '#FF375F' }} />
                Test Case Generation
              </h3>
            </div>

            <div style={{
              background: 'transparent',
              padding: 20,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20, fontSize: '0.875rem' }}>
                Click the button below to generate comprehensive test cases based on the PDF content
              </p>
              
              <button
                onClick={handleGenerateTestCases}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #FF375F, #FF9F0A)',
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 55, 95, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FileSpreadsheet style={{ width: 20, height: 20 }} />
                Generate Test Cases
              </button>
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
              background: 'transparent',
              border: '1px solid rgba(255, 159, 10, 0.3)',
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
              background: 'transparent',
              padding: 20,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 16
            }}>
              <h4 style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 12, fontSize: '0.875rem' }}>Content to be Posted:</h4>
              <div style={{
                background: 'transparent',
                padding: 16,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.6
              }}
              dangerouslySetInnerHTML={{ 
                __html: jiraContent.formattedContent?.replace(/\n/g, '<br>') || 'Loading content...' 
              }} />
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
                {activeFeature === 'testcases' && renderTestCasesResult(result)}
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
