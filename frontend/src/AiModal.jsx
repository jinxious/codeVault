import React, { useState, useEffect } from 'react';
import { Camera, Wrench, Lightbulb, X, Copy, Check, Upload, ArrowRight, Clock, Box, AlertCircle, Sparkles } from 'lucide-react';

export default function AiModal({
  isOpen,
  onClose,
  initialTab = 'explain', // 'photo', 'fix', 'explain'
  activeSnippetCode = '',
  activeSnippetLanguage = 'python',
  onApplyCode
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Photo to Code states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedCode, setExtractedCode] = useState('');
  const [extractedLang, setExtractedLang] = useState('python');

  // Smart Fix states
  const [fixResult, setFixResult] = useState(null);

  // Explanation states
  const [explainResult, setExplainResult] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setError('');
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const getAuthToken = () => localStorage.getItem('vault_token');

  // 1. Photo to Code Handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleExtractPhoto = async () => {
    if (!selectedImage) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      const res = await fetch('/api/ai/photo-to-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to extract code from photo.');

      setExtractedCode(data.extracted_code || '');
      setExtractedLang(data.language || 'python');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Smart Fix Handler
  const handleSmartFix = async () => {
    if (!activeSnippetCode) {
      setError('No code provided to fix.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/smart-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          code: activeSnippetCode,
          language: activeSnippetLanguage
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Smart fix failed.');
      setFixResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Hinglish Explain Handler
  const handleExplainCode = async () => {
    if (!activeSnippetCode) {
      setError('No code provided to explain.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          code: activeSnippetCode,
          language: activeSnippetLanguage
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to get explanation.');
      setExplainResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#D6A64F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D1014' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>AI Assistant Tools</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Student helper tools for coding & understanding</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="tab-list">
          <button
            className={`tab-btn ${activeTab === 'photo' ? 'active' : ''}`}
            onClick={() => { setActiveTab('photo'); setError(''); }}
          >
            <Camera size={16} /> Photo to Code
          </button>
          <button
            className={`tab-btn ${activeTab === 'fix' ? 'active' : ''}`}
            onClick={() => { setActiveTab('fix'); setError(''); }}
          >
            <Wrench size={16} /> Smart Fix
          </button>
          <button
            className={`tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
            onClick={() => { setActiveTab('explain'); setError(''); }}
          >
            <Lightbulb size={16} /> Hinglish Explanation
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* TAB 1: PHOTO TO CODE */}
          {activeTab === 'photo' && (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Upload or take a picture/screenshot of code from a textbook, slide, or screen. AI will extract it into clean editable text.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                {/* Upload Box */}
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', background: '#090d16' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="photo-upload"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <label htmlFor="photo-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1f293d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Upload size={24} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {selectedImage ? selectedImage.name : 'Click to select code image'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports PNG, JPG, JPEG, WEBP</span>
                  </label>

                  {imagePreview && (
                    <div style={{ marginTop: '1rem', maxHeight: '180px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}

                  <button
                    className="btn btn-ai"
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={handleExtractPhoto}
                    disabled={loading || !selectedImage}
                  >
                    {loading ? 'AI Extracting Code...' : 'Extract Code with AI'}
                  </button>
                </div>

                {/* Extracted Code View */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="lang-badge">{extractedLang}</span>
                    {extractedCode && (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleCopy(extractedCode)}>
                        {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <textarea
                    className="code-textarea"
                    style={{ width: '100%', minHeight: '260px' }}
                    value={extractedCode}
                    onChange={(e) => setExtractedCode(e.target.value)}
                    placeholder="// Extracted code will appear here..."
                  />

                  {extractedCode && onApplyCode && (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '0.75rem' }}
                      onClick={() => {
                        onApplyCode(extractedCode, extractedLang);
                        onClose();
                      }}
                    >
                      Use in Snippet Editor <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART FIX */}
          {activeTab === 'fix' && (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                AI analyzes your code for syntax mistakes, logical bugs, and missing edge cases without touching your original code until you approve.
              </p>

              {!fixResult && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#090d16', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Ready to inspect <strong>{activeSnippetLanguage.toUpperCase()}</strong> code snippet.
                  </p>
                  <button className="btn btn-ai" onClick={handleSmartFix} disabled={loading}>
                    {loading ? 'AI Analyzing Code...' : 'Run Smart Fix'}
                  </button>
                </div>
              )}

              {fixResult && (
                <div className="fade-in">
                  {/* Issues list */}
                  <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#c7d2fe', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={16} /> Issues Detected:
                    </h4>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#e0e7ff', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {fixResult.issues && fixResult.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Fixed Code Output */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#34d399' }}>Suggested Fixed Code:</span>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleCopy(fixResult.fixed_code)}>
                        {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="code-preview" style={{ maxHeight: '240px' }}>
                      <code>{fixResult.fixed_code}</code>
                    </pre>
                  </div>

                  {fixResult.explanation && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      <strong>Fix Summary:</strong> {fixResult.explanation}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setFixResult(null)}>
                      Re-run Analysis
                    </button>
                    {onApplyCode && (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          onApplyCode(fixResult.fixed_code, activeSnippetLanguage);
                          onClose();
                        }}
                      >
                        Apply Fixed Code to Editor
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HINGLISH EXPLANATION */}
          {activeTab === 'explain' && (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Clear, student-friendly explanation in <strong>Hinglish</strong> like a teacher explaining the code line-by-line.
              </p>

              {!explainResult && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#090d16', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Ready to explain your <strong>{activeSnippetLanguage.toUpperCase()}</strong> code snippet.
                  </p>
                  <button className="btn btn-ai" onClick={handleExplainCode} disabled={loading}>
                    {loading ? 'AI Teacher Explaining...' : 'Explain Code in Hinglish'}
                  </button>
                </div>
              )}

              {explainResult && (
                <div className="fade-in">
                  {/* Complexity Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: '#172554', border: '1px solid #1e40af', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Clock size={22} color="#60a5fa" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#93c5fd' }}>Time Complexity</div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          {explainResult.time_complexity || 'O(n)'}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#064e3b', border: '1px solid #065f46', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Box size={22} color="#34d399" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Space Complexity</div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          {explainResult.space_complexity || 'O(1)'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hinglish Explanation Box */}
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 'var(--radius-sm)', padding: '1.25rem', whiteSpace: 'pre-line', lineHeight: '1.7', fontSize: '0.92rem', color: '#f1f5f9' }}>
                    {explainResult.explanation}
                  </div>

                  <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
                    <button className="btn btn-secondary" onClick={() => setExplainResult(null)}>
                      Explain Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}
