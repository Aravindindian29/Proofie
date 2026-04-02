import React, { useState } from 'react';
import { Sparkles, FileText, GitCompare, CheckCircle, ExternalLink, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ProofiePlusModal = ({ versionId, assetId, onClose }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const features = [
    {
      id: 'summarize',
      title: 'Summarize Document',
      icon: FileText,
      description: 'Get AI-powered summary of document content',
      color: 'blue',
      endpoint: '/ai-engine/summarize/'
    },
    {
      id: 'compare',
      title: 'Compare Versions',
      icon: GitCompare,
      description: 'Analyze differences between AS-IS and TO-BE',
      color: 'purple',
      endpoint: '/ai-engine/compare/',
      disabled: true // Will enable when we have version selection
    },
    {
      id: 'analyze',
      title: 'Content Analysis',
      icon: CheckCircle,
      description: 'Language improvements & compliance checks',
      color: 'green',
      endpoint: '/ai-engine/analyze-content/'
    },
    {
      id: 'jira',
      title: 'JIRA Integration',
      icon: ExternalLink,
      description: 'Post summary to JIRA ticket',
      color: 'orange',
      disabled: true // Will enable in Phase 6
    },
    {
      id: 'testcases',
      title: 'Generate Test Cases',
      icon: FileSpreadsheet,
      description: 'Create test cases and attach to JIRA',
      color: 'pink',
      disabled: true // Will enable in Phase 7
    }
  ];

  const handleFeatureClick = async (feature) => {
    if (feature.disabled) {
      toast.error('This feature is coming soon!');
      return;
    }

    setActiveFeature(feature.id);
    setLoading(true);
    setResult(null);
    
    try {
      let requestBody = {};

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
      }

      const response = await api.post(feature.endpoint, requestBody);
      
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
        {analysis.language_suggestions && analysis.language_suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Language Suggestions:</h4>
            <div className="space-y-3">
              {analysis.language_suggestions.map((suggestion, idx) => (
                <div key={idx} className={`p-3 rounded border-l-4 ${
                  suggestion.severity === 'high' ? 'border-red-500 bg-red-50' :
                  suggestion.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="font-medium text-gray-800 mb-1">
                    {suggestion.severity === 'high' && '🔴 '}
                    {suggestion.severity === 'medium' && '🟡 '}
                    {suggestion.severity === 'low' && '🔵 '}
                    Suggestion
                  </div>
                  <div className="text-sm space-y-1">
                    <div><strong>Current:</strong> "{suggestion.current}"</div>
                    <div><strong>Suggested:</strong> "{suggestion.suggested}"</div>
                    <div className="text-gray-600 italic">{suggestion.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.compliance_issues && analysis.compliance_issues.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Compliance Issues:</h4>
            <div className="space-y-3">
              {analysis.compliance_issues.map((issue, idx) => (
                <div key={idx} className={`p-3 rounded border-l-4 ${
                  issue.severity === 'high' ? 'border-red-500 bg-red-50' :
                  issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-green-500 bg-green-50'
                }`}>
                  <div className="font-medium text-gray-800 mb-1">
                    {issue.severity === 'high' && '⚠️ '}
                    {issue.issue}
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Action:</strong> {issue.suggested_action}
                  </div>
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">ProofiePlus AI</h2>
              <p className="text-purple-100">Intelligent Document Analysis</p>
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
        {result && !loading && (
          <div className="p-6 bg-gray-50 overflow-y-auto flex-1">
            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                <strong>Error:</strong> {result.error}
              </div>
            ) : (
              <>
                {activeFeature === 'summarize' && renderSummaryResult(result)}
                {activeFeature === 'analyze' && renderAnalysisResult(result)}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center bg-white">
          {activeFeature && !loading && (
            <button
              onClick={() => {
                setActiveFeature(null);
                setResult(null);
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              ← Back to Features
            </button>
          )}
          <div className="flex-1"></div>
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
