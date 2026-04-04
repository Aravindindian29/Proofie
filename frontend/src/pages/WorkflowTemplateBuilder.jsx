import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Copy, Lock, ArrowLeft, Save, X, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const WorkflowTemplateBuilder = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchTemplates();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/accounts/users/me/');
      setCurrentUser(response.data);
      
      // Check if user is admin
      if (response.data.profile?.role !== 'admin') {
        toast.error('Only admins can access this page');
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      navigate('/');
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workflows/templates/');
      setTemplates(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneTemplate = async (template) => {
    try {
      const clonedTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        is_active: true
      };
      
      const response = await api.post('/workflows/templates/', clonedTemplate);
      const newTemplateId = response.data.id;
      
      // Clone stages
      for (const stage of template.stages) {
        await api.post(`/workflows/templates/${newTemplateId}/stages/`, {
          name: stage.name,
          description: stage.description,
          order: stage.order,
          requires_approval: stage.requires_approval,
          can_reject: stage.can_reject,
          can_request_changes: stage.can_request_changes
        });
      }
      
      toast.success('Template cloned successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to clone template:', error);
      toast.error('Failed to clone template');
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (template.is_default) {
      toast.error('Cannot delete default templates');
      return;
    }
    
    if (!confirm(`Delete template "${template.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/workflows/templates/${template.id}/`);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
                <p className="text-sm text-gray-600">Manage approval workflow templates</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => setEditingTemplate(template)}
              onClone={() => handleCloneTemplate(template)}
              onDelete={() => handleDeleteTemplate(template)}
            />
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-4">Create your first workflow template to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Create Template
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateEditorModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
};

const TemplateCard = ({ template, onEdit, onClone, onDelete }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            {template.is_default && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                <Lock size={12} />
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{template.description || 'No description'}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span className="font-medium">Stages</span>
          <span className="text-blue-600 font-semibold">{template.stages?.length || 0}</span>
        </div>
        <div className="space-y-1">
          {template.stages?.slice(0, 3).map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium">
                {index + 1}
              </span>
              <span className="truncate">{stage.name}</span>
            </div>
          ))}
          {template.stages?.length > 3 && (
            <div className="text-xs text-gray-500 pl-8">
              +{template.stages.length - 3} more stages
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button
          onClick={onClone}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Copy size={14} />
          Clone
        </button>
        {!template.is_default && (
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

const TemplateEditorModal = ({ template, onClose, onSave }) => {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [stages, setStages] = useState(template?.stages || []);
  const [saving, setSaving] = useState(false);

  const addStage = () => {
    setStages([
      ...stages,
      {
        name: `Stage ${stages.length + 1}`,
        description: '',
        order: stages.length + 1,
        requires_approval: true,
        can_reject: true,
        can_request_changes: true
      }
    ]);
  };

  const removeStage = (index) => {
    const newStages = stages.filter((_, i) => i !== index);
    // Reorder remaining stages
    newStages.forEach((stage, i) => {
      stage.order = i + 1;
    });
    setStages(newStages);
  };

  const updateStage = (index, field, value) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const moveStage = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === stages.length - 1)
    ) {
      return;
    }

    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    
    // Update order
    newStages.forEach((stage, i) => {
      stage.order = i + 1;
    });
    
    setStages(newStages);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (stages.length === 0) {
      toast.error('At least one stage is required');
      return;
    }

    try {
      setSaving(true);

      if (template) {
        // Update existing template
        await api.patch(`/workflows/templates/${template.id}/`, {
          name,
          description
        });

        // Update stages (simplified - in production, handle adds/updates/deletes properly)
        for (const stage of stages) {
          if (stage.id) {
            await api.patch(`/workflows/stages/${stage.id}/`, stage);
          } else {
            await api.post(`/workflows/templates/${template.id}/stages/`, stage);
          }
        }
      } else {
        // Create new template
        const response = await api.post('/workflows/templates/', {
          name,
          description,
          is_active: true
        });

        const templateId = response.data.id;

        // Create stages
        for (const stage of stages) {
          await api.post(`/workflows/templates/${templateId}/stages/`, stage);
        }
      }

      toast.success(template ? 'Template updated successfully' : 'Template created successfully');
      onSave();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Standard Approval Workflow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the purpose of this workflow template"
            />
          </div>

          {/* Stages */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Workflow Stages *
              </label>
              <button
                onClick={addStage}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Stage
              </button>
            </div>

            <div className="space-y-3">
              {stages.map((stage, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 pt-2">
                      <button
                        onClick={() => moveStage(index, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${
                          index === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <MoveUp size={16} />
                      </button>
                      <button
                        onClick={() => moveStage(index, 'down')}
                        disabled={index === stages.length - 1}
                        className={`p-1 rounded ${
                          index === stages.length - 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <MoveDown size={16} />
                      </button>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => updateStage(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Stage name"
                        />
                      </div>
                      <input
                        type="text"
                        value={stage.description}
                        onChange={(e) => updateStage(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Stage description (optional)"
                      />
                    </div>

                    <button
                      onClick={() => removeStage(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {stages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No stages added yet</p>
                  <button
                    onClick={addStage}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add your first stage
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTemplateBuilder;
