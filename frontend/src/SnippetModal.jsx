import React, { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

// Safe highlight helper — returns null if language not supported (falls back to plain text)
function highlight(code, language) {
  try {
    const grammar = Prism.languages[language] || Prism.languages[language?.toLowerCase()];
    if (!grammar) return null;
    return Prism.highlight(code, grammar, language);
  } catch (_) {
    return null;
  }
}
import {
  X,
  Save,
  Copy,
  Check,
  History,
  Code,
  Sparkles,
  Lightbulb,
  Wrench,
  RotateCcw,
  Tag,
  AlignLeft,
  Camera,
  Layers,
  FileCode2
} from 'lucide-react';

const COMMON_LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'cpp',
  'c',
  'java',
  'html',
  'css',
  'sql',
  'go',
  'rust',
  'bash',
  'php',
  'ruby',
  'json'
];

export default function SnippetModal({
  isOpen,
  onClose,
  snippet = null, // if null, creating new snippet; if object, editing/viewing
  onSaved,
  onOpenAi
}) {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'history'
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('python');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const gutterRef = useRef(null);

  const isEditing = Boolean(snippet && snippet.id);
  const getAuthToken = () => localStorage.getItem('vault_token');

  // Load snippet data into state when opened
  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title || '');
      setLanguage(snippet.language || 'python');
      setTags(snippet.tags || '');
      setDescription(snippet.description || '');
      setCode(snippet.code || '');
      if (isEditing) {
        fetchVersions(snippet.id);
      }
    } else {
      // Defaults for new snippet
      setTitle('');
      setLanguage('python');
      setTags('');
      setDescription('');
      setCode('def example():\n    print("Hello, Snippet Vault!")\n');
      setVersions([]);
    }
    setActiveTab('editor');
    setError('');
    setSelectedVersion(null);
  }, [snippet, isOpen]);

  // Fetch version history for snippet
  const fetchVersions = async (snippetId) => {
    try {
      const res = await fetch(`/api/snippets/${snippetId}/versions`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error('Failed to load version history', err);
    }
  };

  if (!isOpen) return null;

  // Handle Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the snippet.');
      return;
    }
    if (!code.trim()) {
      setError('Please provide code for the snippet.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      title: title.trim(),
      language: language.toLowerCase().trim(),
      tags: tags.trim(),
      description: description.trim(),
      code: code
    };

    try {
      const url = isEditing
        ? `/api/snippets/${snippet.id}`
        : '/api/snippets';

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to save snippet.');

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Rollback
  const handleRollback = async (versionId) => {
    if (!window.confirm('Are you sure you want to restore this version?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/snippets/${snippet.id}/rollback/${versionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Rollback failed.');

      // Update local state with restored code
      setCode(data.code);
      setLanguage(data.language);
      fetchVersions(snippet.id);
      setActiveTab('editor');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Line numbers calculation
  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbersText = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  return (
    <div className="modal-overlay">
      <div className="modal-content editor-modal fade-in">
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="header-icon-badge">
              <FileCode2 size={20} />
            </div>
            <div>
              <h3 className="modal-title-heading">
                {isEditing ? 'Edit Snippet' : 'Create New Snippet'}
              </h3>
              <p className="modal-subtitle">
                {isEditing ? `Managing "${title || 'Untitled'}"` : 'Add your code to your personal vault'}
              </p>
            </div>
          </div>
          <button className="btn-icon header-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="tab-list">
          <button
            className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <Code size={16} /> Code Editor
          </button>
          {isEditing && (
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} /> Version History ({versions.length})
            </button>
          )}
        </div>

        {/* Main Body */}
        <div className="modal-body">
          {error && (
            <div className="modal-error-banner">
              {error}
            </div>
          )}

          {activeTab === 'editor' && (
            <form id="snippet-form" className="snippet-form" onSubmit={handleSave}>
              
              {/* Row 1: Title & Language */}
              <div className="form-grid-row row-2col">
                <div className="input-group">
                  <label className="input-label">Snippet Title *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Quick Sort Algorithm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Language</label>
                  <select
                    className="select-field"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {COMMON_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Tags & Description */}
              <div className="form-grid-row row-equal">
                <div className="input-group">
                  <label className="input-label">
                    <Tag size={14} /> Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. DSA, Sorting, College"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <AlignLeft size={14} /> Description / Notes
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Optional notes or context..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Code Editor Section */}
              <div className="editor-section">
                <div className="editor-toolbar">
                  <label className="input-label editor-label">
                    Code *
                  </label>

                  {/* Action Toolbar */}
                  <div className="editor-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => onOpenAi('photo', code, language, (newCode, newLang) => {
                        setCode(newCode);
                        if (newLang) setLanguage(newLang);
                      })}
                    >
                      <Camera size={14} /> Photo to Code
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-ai"
                      onClick={() => onOpenAi('fix', code, language, (newCode) => setCode(newCode))}
                    >
                      <Wrench size={14} /> Smart Fix
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-ai"
                      onClick={() => onOpenAi('explain', code, language)}
                    >
                      <Lightbulb size={14} /> Hinglish Explain
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleCopyCode}
                    >
                      {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Editor Container with Gutter & Textarea */}
                <div className="editor-wrapper">
                  <div className="editor-gutter" ref={gutterRef}>
                    {lineNumbersText}
                  </div>
                  <textarea
                    className="editor-textarea"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onScroll={(e) => {
                      if (gutterRef.current) {
                        gutterRef.current.scrollTop = e.target.scrollTop;
                      }
                    }}
                    placeholder="// Paste or write your code here..."
                    spellCheck="false"
                  />
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: VERSION HISTORY */}
          {activeTab === 'history' && (
            <div className="history-container">
              <p className="history-subtitle">
                Previous versions are automatically saved every time you edit your code. You can inspect old code and rollback anytime.
              </p>

              <div className="history-grid">
                {/* Versions List */}
                <div className="history-list">
                  {versions.map((ver) => (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersion(ver)}
                      className={`history-item ${selectedVersion?.id === ver.id ? 'active' : ''}`}
                    >
                      <div className="history-item-header">
                        <span className="history-version-title">
                          Version {ver.version_number}
                        </span>
                        <span className="lang-badge">{ver.language}</span>
                      </div>
                      <div className="history-item-date">
                        {new Date(ver.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Version Preview */}
                <div className="history-preview-box">
                  {selectedVersion ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="history-preview-header">
                        <div>
                          <span className="history-preview-title">
                            Version {selectedVersion.version_number}
                          </span>
                          <span className="history-preview-date">
                            ({new Date(selectedVersion.created_at).toLocaleString()})
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleRollback(selectedVersion.id)}
                          disabled={loading}
                        >
                          <RotateCcw size={14} /> Restore Version
                        </button>
                      </div>
                      <pre className={`code-preview flex-1 language-${selectedVersion.language}`}>
                        {(() => {
                          const html = highlight(selectedVersion.code, selectedVersion.language);
                          return html
                            ? <code className={`language-${selectedVersion.language}`} dangerouslySetInnerHTML={{ __html: html }} />
                            : <code>{selectedVersion.code}</code>;
                        })()}
                      </pre>
                    </div>
                  ) : (
                    <div className="history-empty-state">
                      Select a version from the left panel to preview its code and rollback.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Fixed Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          {activeTab === 'editor' && (
            <button
              type="submit"
              form="snippet-form"
              className="btn btn-primary"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Snippet')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
