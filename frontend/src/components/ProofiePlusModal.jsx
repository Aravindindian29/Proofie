import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, GitCompare, CheckCircle, ExternalLink, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ProofiePlusModal = ({ versionId, assetId, onClose }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [versions, setVersions] = useState([]);
  const [asIsVersion, setAsIsVersion] = useState('');
  const [toBeVersion, setToBeVersion] = useState('');
  const [attachToJira, setAttachToJira] = useState(false);

  const features = [
    {
      id: 'summarize',
      title: '✨ UPDATED: Document Summarization',
      icon: FileText,
      description: 'Gen AI powered summary of document content',
      color: 'blue',
      endpoint: '/ai-engine/summarize/'
    },
    {
      id: 'compare',
      title: 'Version Comparison',
      icon: GitCompare,
      description: 'Analyse Difference between AS-Is and TO-BE',
      color: 'purple',
      endpoint: '/ai-engine/compare/',
      disabled: false
    },
    {
      id: 'analyze',
      title: 'Content Analysis + Compliance Checks',
      icon: CheckCircle,
      description: 'Language Improvements and Compliance checks',
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
      description: 'Create test cases and attach to Jira',
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
        endpoint = '/ai-engine/jira-post/';
        requestBody = {
          version_id: versionId
        };
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{summary.title || 'Document Summary'}</h3>
          <div className="flex gap-4 text-sm">
            <span className="bg-white px-3 py-1 rounded-full">
              <strong>Type:</strong> {summary.type || 'N/A'}
            </span>
            <span className="bg-white px-3 py-1 rounded-full">
              <strong>Pages:</strong> {summary.pages || 'N/A'}
            </span>
            <span className="bg-white px-3 py-1 rounded-full">
              <strong>Complexity:</strong> {summary.complexity || 'N/A'}
            </span>
          </div>
          {summary.cpi_id && (
            <div className="mt-2">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                CPI ID: {summary.cpi_id}
              </span>
            </div>
          )}
        </div>

        {summary.key_highlights && summary.key_highlights.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Key Highlights:</h4>
            <ul className="space-y-2">
              {summary.key_highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700">{highlight}</span>
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
          <div className="bg-blue-50 p-3 rounded">
            <strong>Estimated Review Time:</strong> {summary.estimated_review_time}
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
                  <div className="text-gray-700">{change}</div>
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
                  <div className="text-gray-700">{change}</div>
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
                    <div><strong>Old:</strong> "{cta.old}"</div>
                    <div><strong>New:</strong> "{cta.new}"</div>
                    <div><strong>Classification:</strong> {cta.classification}</div>
                    <div><strong>Impact:</strong> {cta.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal/Compliance Changes */}
        {analysis.legal_compliance_changes && analysis.legal_compliance_changes.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">Legal</span>
              Legal/Compliance Changes
            </h4>
            <div className="space-y-2">
              {analysis.legal_compliance_changes.map((change, idx) => (
                <div key={idx} className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                  <div className="text-gray-700">{change}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Risks */}
        {analysis.compliance_risks && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Compliance Risks</h4>
            
            {/* High Severity */}
            {analysis.compliance_risks.high_severity && analysis.compliance_risks.high_severity.length > 0 && (
              <div className="mb-4">
                <h5 className="text-red-700 font-medium mb-2 flex items-center gap-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">High</span>
                  High Priority Risks
                </h5>
                <div className="space-y-2">
                  {analysis.compliance_risks.high_severity.map((risk, idx) => (
                    <div key={idx} className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                      <div className="font-medium text-gray-800 mb-1">{risk.issue}</div>
                      <div className="text-sm text-gray-700"><strong>Risk:</strong> {risk.risk}</div>
                      <div className="text-sm text-gray-700"><strong>Action:</strong> {risk.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medium Severity */}
            {analysis.compliance_risks.medium_severity && analysis.compliance_risks.medium_severity.length > 0 && (
              <div className="mb-4">
                <h5 className="text-yellow-700 font-medium mb-2 flex items-center gap-2">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Medium</span>
                  Medium Priority Risks
                </h5>
                <div className="space-y-2">
                  {analysis.compliance_risks.medium_severity.map((risk, idx) => (
                    <div key={idx} className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                      <div className="font-medium text-gray-800 mb-1">{risk.issue}</div>
                      {risk.examples && (
                        <div className="text-sm text-gray-600 mb-1">
                          <strong>Examples:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {risk.examples.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="text-sm text-gray-700"><strong>Risk:</strong> {risk.risk}</div>
                      <div className="text-sm text-gray-700"><strong>Action:</strong> {risk.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Severity */}
            {analysis.compliance_risks.low_severity && analysis.compliance_risks.low_severity.length > 0 && (
              <div>
                <h5 className="text-green-700 font-medium mb-2 flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Low</span>
                  Low Priority Risks
                </h5>
                <div className="space-y-2">
                  {analysis.compliance_risks.low_severity.map((risk, idx) => (
                    <div key={idx} className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                      <div className="font-medium text-gray-800 mb-1">{risk.issue}</div>
                      <div className="text-sm text-gray-700"><strong>Example:</strong> {risk.example}</div>
                      <div className="text-sm text-gray-700"><strong>Action:</strong> {risk.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Missing Risk Checks */}
        {analysis.missing_risky_checks && analysis.missing_risky_checks.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Risk Checks Status</h4>
            <div className="space-y-2">
              {analysis.missing_risky_checks.map((check, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    check.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></span>
                  <span className="text-gray-700">{check.item}</span>
                </div>
              ))}
            </div>
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

  const renderDiffResult = (data) => {
    if (!data.diff_summary) return null;

    const diff = data.diff_summary;

    return (
      <div className="space-y-4">
        {/* Version Comparison Header */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
              {diff.version_comparison || 'Version Comparison'}
            </span>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="bg-white px-3 py-1 rounded-full">
              <strong>Total Changes:</strong> {diff.total_changes || 0}
            </span>
            <span className="bg-white px-3 py-1 rounded-full">
              <strong>Severity:</strong> {diff.severity_score || 0}/10
            </span>
            {data.pages_affected && data.pages_affected.length > 0 && (
              <span className="bg-white px-3 py-1 rounded-full">
                <strong>Pages:</strong> {data.pages_affected.join(', ')}
              </span>
            )}
          </div>
        </div>

        {diff.summary && (
          <div className="bg-blue-50 p-3 rounded">
            <strong>Summary:</strong> {diff.summary}
          </div>
        )}

        {/* Changes with Classification */}
        {diff.changes && diff.changes.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Changes:</h4>
            <div className="space-y-3">
              {diff.changes.map((change, idx) => (
                <div key={idx} className={`p-3 rounded border-l-4 ${
                  change.severity === 'high' ? 'border-red-500 bg-red-50' :
                  change.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-800">
                      {change.type === 'text_added' && '➕ '}
                      {change.type === 'text_deleted' && '➖ '}
                      {change.type === 'text_modified' && '✏️ '}
                      {change.type === 'section_added' && '📄 '}
                      {change.type === 'section_removed' && '🗑️ '}
                      {change.section || 'Change'}
                    </div>
                    {change.classification && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        change.classification.includes('UI') ? 'bg-blue-100 text-blue-800' :
                        change.classification.includes('Copy') ? 'bg-purple-100 text-purple-800' :
                        change.classification.includes('CTA') ? 'bg-orange-100 text-orange-800' :
                        change.classification.includes('Legal') || change.classification.includes('Compliance') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {change.classification}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {change.location && (
                      <div className="text-gray-600"><strong>Location:</strong> {change.location}</div>
                    )}
                    {change.description && (
                      <div className="text-gray-700">{change.description}</div>
                    )}
                    {change.impact && (
                      <div className="text-gray-600"><strong>Impact:</strong> {change.impact}</div>
                    )}
                    {change.v1_text && change.v2_text && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <div><strong>v1:</strong> {change.v1_text}</div>
                        <div><strong>v2:</strong> {change.v2_text}</div>
                      </div>
                    )}
                    {change.old_text && change.new_text && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <div><strong>Old:</strong> {change.old_text}</div>
                        <div><strong>New:</strong> {change.new_text}</div>
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
        {diff.recommendations && diff.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Recommendations:</h4>
            <div className="space-y-2">
              {diff.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                  <div className="text-gray-700">{rec}</div>
                </div>
              ))}
            </div>
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

  const renderJiraResult = (data) => {
    if (!data.success) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-2">✅ Posted to JIRA</h3>
          <div className="space-y-2">
            <div className="bg-white px-3 py-2 rounded">
              <strong>Ticket:</strong> {data.ticket_key}
            </div>
            <div className="bg-white px-3 py-2 rounded">
              <strong>CPI ID:</strong> {data.cpi_id}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={data.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
          >
            View Ticket
          </a>
          <a
            href={data.comment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
          >
            View Comment
          </a>
        </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">🚀 ProofiePlus AI - UPDATED</h2>
              <p className="text-purple-100">Intelligent Document Analysis - New Features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Features Grid */}
        {!activeFeature && (
          <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  disabled={feature.disabled}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    feature.disabled
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-purple-500 hover:shadow-lg'
                  }`}
                >
                  <Icon className={`w-8 h-8 text-${feature.color}-500 mb-2`} />
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                  {feature.disabled && (
                    <span className="text-xs text-gray-500 mt-2 block">Coming Soon</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Version Selection for Compare and Test Cases */}
        {activeFeature === 'compare' && !loading && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            <h3 className="text-xl font-semibold text-gray-800">Version Comparison</h3>
            
            {/* Version Selection */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Select Versions to Compare</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AS-IS Version</label>
                  <select
                    value={asIsVersion}
                    onChange={(e) => setAsIsVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select AS-IS version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version_number} - {new Date(v.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TO-BE Version</label>
                  <select
                    value={toBeVersion}
                    onChange={(e) => setToBeVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select TO-BE version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version_number} - {new Date(v.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleCompareVersions}
                disabled={!asIsVersion || !toBeVersion}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold mt-4"
              >
                Compare Versions
              </button>
            </div>

            {/* Comparison Results */}
            {result && result.diff_summary && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {result.diff_summary.version_comparison || 'v1 → v2'}
                  </span>
                  Version Differences
                </h4>
                
                {/* Summary Stats */}
                <div className="flex gap-4 mb-4">
                  <span className="bg-white px-3 py-1 rounded-full text-sm">
                    <strong>Total Changes:</strong> {result.diff_summary.total_changes || 0}
                  </span>
                  <span className="bg-white px-3 py-1 rounded-full text-sm">
                    <strong>Severity:</strong> {result.diff_summary.severity_score || 0}/10
                  </span>
                  {result.pages_affected && result.pages_affected.length > 0 && (
                    <span className="bg-white px-3 py-1 rounded-full text-sm">
                      <strong>Pages:</strong> {result.pages_affected.join(', ')}
                    </span>
                  )}
                </div>

                {result.diff_summary.summary && (
                  <div className="bg-blue-50 p-3 rounded mb-4">
                    <strong>Summary:</strong> {result.diff_summary.summary}
                  </div>
                )}

                {/* Changes List */}
                {result.diff_summary.changes && result.diff_summary.changes.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-3">Detailed Changes:</h5>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {result.diff_summary.changes.map((change, idx) => (
                        <div key={idx} className={`p-3 rounded border-l-4 ${
                          change.severity === 'high' ? 'border-red-500 bg-red-50' :
                          change.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                          'border-blue-500 bg-blue-50'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-gray-800">
                              {change.type === 'text_added' && '➕ '}
                              {change.type === 'text_deleted' && '➖ '}
                              {change.type === 'text_modified' && '✏️ '}
                              {change.type === 'section_added' && '📄 '}
                              {change.type === 'section_removed' && '🗑️ '}
                              {change.section || 'Change'}
                            </div>
                            {change.classification && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                change.classification.includes('UI') ? 'bg-blue-100 text-blue-800' :
                                change.classification.includes('Copy') ? 'bg-purple-100 text-purple-800' :
                                change.classification.includes('CTA') ? 'bg-orange-100 text-orange-800' :
                                change.classification.includes('Legal') || change.classification.includes('Compliance') ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {change.classification}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm space-y-1">
                            {change.location && (
                              <div className="text-gray-600"><strong>Location:</strong> {change.location}</div>
                            )}
                            {change.description && (
                              <div className="text-gray-700">{change.description}</div>
                            )}
                            {change.impact && (
                              <div className="text-gray-600"><strong>Impact:</strong> {change.impact}</div>
                            )}
                            {change.v1_text && change.v2_text && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <div><strong>v1:</strong> {change.v1_text}</div>
                                <div><strong>v2:</strong> {change.v2_text}</div>
                              </div>
                            )}
                            {change.old_text && change.new_text && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <div><strong>Old:</strong> {change.old_text}</div>
                                <div><strong>New:</strong> {change.new_text}</div>
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
                  // Generate test cases with mock data for download
                  const mockTestCases = [
                    { test_case_id: 'TC001', title: 'Landing Page Display Test', description: 'Verify landing page loads correctly', priority: 'high', type: 'functional' },
                    { test_case_id: 'TC002', title: 'Form Validation Test', description: 'Test form field validations', priority: 'medium', type: 'functional' },
                    { test_case_id: 'TC003', title: 'API Integration Test', description: 'Verify API endpoints work correctly', priority: 'high', type: 'integration' }
                  ];
                  
                  // Create download link
                  const dataStr = JSON.stringify(mockTestCases, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  
                  const exportFileDefaultName = 'test_scenarios.json';
                  
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                  
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
          <div className="p-6 text-center flex-1 flex items-center justify-center">
            <div>
              <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
              <p className="mt-4 text-gray-600">Processing with AI...</p>
              <p className="text-sm text-gray-500">This may take a few seconds</p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {result && !loading && !['compare', 'testcases'].includes(activeFeature) && (
          <div className="p-6 bg-gray-50 overflow-y-auto flex-1">
            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
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
        <div className="p-4 border-t flex justify-between items-center bg-white">
          {activeFeature && (
            <button
              onClick={() => {
                setActiveFeature(null);
                setResult(null);
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-2"
            >
              ← Back to Features
            </button>
          )}
          {!activeFeature && <div></div>}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofiePlusModal;
