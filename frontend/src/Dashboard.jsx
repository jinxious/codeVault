import React, { useState, useEffect } from 'react';
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

// Safe highlight helper — falls back to plain text if language isn't supported
function highlight(code, language) {
  try {
    const grammar = Prism.languages[language] || Prism.languages[language?.toLowerCase()];
    if (!grammar) return null; // signal: render as plain text
    return Prism.highlight(code, grammar, language);
  } catch (_) {
    return null;
  }
}
import {
  Code2,
  Plus,
  Search,
  Star,
  Trash2,
  Edit3,
  Copy,
  Check,
  History,
  Lightbulb,
  Wrench,
  Camera,
  LogOut,
  LayoutGrid,
  List,
  Filter,
  Tag,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import SnippetModal from './SnippetModal';
import AiModal from './AiModal';

export default function Dashboard({ userEmail, onLogout }) {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Snippet Modal state
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);

  // AI Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInitialTab, setAiInitialTab] = useState('explain');
  const [aiActiveCode, setAiActiveCode] = useState('');
  const [aiActiveLang, setAiActiveLang] = useState('python');
  const [aiApplyCallback, setAiApplyCallback] = useState(null);

  // Quick feedback
  const [copiedId, setCopiedId] = useState(null);

  const getAuthToken = () => localStorage.getItem('vault_token');

  // Fetch snippets from backend API
  const fetchSnippets = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query string
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (selectedTag) params.append('tag', selectedTag);
      if (onlyFavorites) params.append('favorite', 'true');

      const res = await fetch(`http://localhost:8000/api/snippets?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });

      if (res.status === 401) {
        onLogout();
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load snippets');
      }

      const data = await res.json();
      setSnippets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, [searchTerm, selectedLanguage, selectedTag, onlyFavorites]);

  // Toggle favorite
  const handleToggleFavorite = async (e, snippetId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/api/snippets/${snippetId}/favorite`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSnippets(prev =>
          prev.map(s => s.id === snippetId ? { ...s, is_favorite: data.is_favorite } : s)
        );
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Delete snippet with simple confirmation
  const handleDeleteSnippet = async (e, snippetId, snippetTitle) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${snippetTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/snippets/${snippetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        setSnippets(prev => prev.filter(s => s.id !== snippetId));
      }
    } catch (err) {
      alert('Failed to delete snippet: ' + err.message);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (e, snippetId, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(snippetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Snippet Modal
  const handleOpenCreate = () => {
    setEditingSnippet(null);
    setIsSnippetModalOpen(true);
  };

  const handleOpenEdit = (snippet) => {
    setEditingSnippet(snippet);
    setIsSnippetModalOpen(true);
  };

  // Open AI Modal
  const handleOpenAi = (tab, code = '', lang = 'python', applyCb = null) => {
    setAiInitialTab(tab);
    setAiActiveCode(code);
    setAiActiveLang(lang);
    setAiApplyCallback(() => applyCb);
    setIsAiModalOpen(true);
  };

  // Get distinct languages and tags for quick filter chips
  const allLanguages = Array.from(new Set(snippets.map(s => s.language).filter(Boolean)));
  const allTags = Array.from(
    new Set(
      snippets.flatMap(s => (s.tags ? s.tags.split(',').map(t => t.trim()) : []))
    )
  ).filter(Boolean);

  return (
    <div className="app-container">
      
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo-brand">
          <div className="logo-icon">
            <Code2 size={22} />
          </div>
          <div>
            <span>Code Snippet Vault</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ai"
            onClick={() => handleOpenAi('photo', '', 'python', (extractedCode, lang) => {
              setEditingSnippet({ title: 'Extracted Snippet', code: extractedCode, language: lang, tags: 'AI, Photo' });
              setIsSnippetModalOpen(true);
            })}
          >
            <Camera size={16} /> Photo to Code
          </button>

          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> New Snippet
          </button>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)', margin: '0 0.25rem' }}></div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {userEmail}
          </span>

          <button className="btn btn-icon" title="Logout" onClick={onLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* SEARCH AND FILTER TOOLBAR */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search snippets by title, code, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Favorite Toggle Button */}
          <button
            className={`btn ${onlyFavorites ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Star size={16} fill={onlyFavorites ? '#0D1014' : 'none'} color={onlyFavorites ? '#0D1014' : '#D6A64F'} />
            Favorites
          </button>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#10151B', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              className="btn-icon"
              style={{ background: viewMode === 'grid' ? '#1B2129' : 'transparent', color: viewMode === 'grid' ? '#D6A64F' : 'var(--text-muted)' }}
              onClick={() => setViewMode('grid')}
              title="Grid / Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className="btn-icon"
              style={{ background: viewMode === 'list' ? '#1B2129' : 'transparent', color: viewMode === 'list' ? '#D6A64F' : 'var(--text-muted)' }}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>

        </div>

        {/* Filter Chips: Languages & Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Filter size={14} /> Languages:
          </span>
          <button
            className="tag-badge"
            style={{ cursor: 'pointer', background: selectedLanguage === '' ? '#C99A45' : '#151A20', color: selectedLanguage === '' ? '#0D1014' : 'var(--text-secondary)', borderColor: selectedLanguage === '' ? '#C99A45' : 'var(--border-color)', fontWeight: selectedLanguage === '' ? '600' : '500' }}
            onClick={() => setSelectedLanguage('')}
          >
            All
          </button>
          {allLanguages.map((lang) => (
            <button
              key={lang}
              className="tag-badge"
              style={{ cursor: 'pointer', background: selectedLanguage === lang ? '#C99A45' : '#151A20', color: selectedLanguage === lang ? '#0D1014' : 'var(--text-secondary)', borderColor: selectedLanguage === lang ? '#C99A45' : 'var(--border-color)', fontWeight: selectedLanguage === lang ? '600' : '500' }}
              onClick={() => setSelectedLanguage(selectedLanguage === lang ? '' : lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}

          {allTags.length > 0 && (
            <>
              <div style={{ height: '16px', width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Tag size={14} /> Tags:
              </span>
              {allTags.map((t) => (
                <button
                  key={t}
                  className="tag-badge"
                  style={{ cursor: 'pointer', background: selectedTag === t ? '#C99A45' : '#171D23', color: selectedTag === t ? '#0D1014' : '#D6A64F', borderColor: selectedTag === t ? '#C99A45' : '#4A3B22', fontWeight: selectedTag === t ? '600' : '500' }}
                  onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                >
                  #{t}
                </button>
              ))}
            </>
          )}

          {(selectedLanguage || selectedTag || onlyFavorites || searchTerm) && (
            <button
              className="btn btn-sm btn-outline"
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                setSelectedLanguage('');
                setSelectedTag('');
                setOnlyFavorites(false);
                setSearchTerm('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={{ background: 'var(--danger-light)', border: '1px solid rgba(214, 107, 107, 0.3)', color: '#D66B6B', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* SNIPPETS LISTING */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          Loading your snippet vault...
        </div>
      ) : snippets.length === 0 ? (
        (() => {
          const hasFilters = !!(searchTerm || selectedLanguage || selectedTag || onlyFavorites);
          return (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              background: 'var(--bg-card)',
              border: '1px solid #29313B',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#1B2129',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D6A64F',
                marginBottom: '1rem',
              }}>
                <Code2 size={22} />
              </div>
              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: '700',
                color: '#E7E5DF',
                marginBottom: '0.4rem',
              }}>
                {hasFilters ? 'No matching snippets' : 'No snippets yet'}
              </h3>
              <p style={{
                color: '#929AA5',
                maxWidth: '340px',
                margin: '0 auto 1.5rem auto',
                fontSize: '0.875rem',
                lineHeight: '1.5',
              }}>
                {hasFilters
                  ? 'Try changing your search or filters.'
                  : 'Create your first snippet or extract code from a photo.'}
              </p>
              {hasFilters ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedLanguage('');
                    setSelectedTag('');
                    setOnlyFavorites(false);
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ background: '#D6A64F', color: '#0D1014' }}
                  onClick={handleOpenCreate}
                >
                  <Plus size={16} /> Create New Snippet
                </button>
              )}
            </div>
          );
        })()
      ) : viewMode === 'grid' ? (
        /* GRID / CARD VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {snippets.map((snip) => (
            <div
              key={snip.id}
              onClick={() => handleOpenEdit(snip)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D6A64F';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Card Top */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="lang-badge">{snip.language}</span>
                    <span className="version-badge">
                      <History size={11} /> v{snip.version_count}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <button
                      className="btn-icon"
                      title={snip.is_favorite ? 'Remove Favorite' : 'Mark Favorite'}
                      onClick={(e) => handleToggleFavorite(e, snip.id)}
                    >
                      <Star
                        size={18}
                        fill={snip.is_favorite ? '#D6A64F' : 'none'}
                        color={snip.is_favorite ? '#D6A64F' : 'var(--text-muted)'}
                      />
                    </button>
                    <button
                      className="btn-icon"
                      title="Copy Code"
                      onClick={(e) => handleCopyCode(e, snip.id, snip.code)}
                    >
                      {copiedId === snip.id ? <Check size={16} color="#5FB286" /> : <Copy size={16} />}
                    </button>
                    <button
                      className="btn-icon"
                      title="Delete Snippet"
                      style={{ color: '#D66B6B' }}
                      onClick={(e) => handleDeleteSnippet(e, snip.id, snip.title)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                  {snip.title}
                </h4>

                {snip.description && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {snip.description}
                  </p>
                )}

                {/* Code snippet preview */}
                <pre className={`code-preview language-${snip.language}`} style={{ maxHeight: '140px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                  {(() => {
                    const html = highlight(snip.code, snip.language);
                    return html
                      ? <code className={`language-${snip.language}`} dangerouslySetInnerHTML={{ __html: html }} />
                      : <code>{snip.code}</code>;
                  })()}
                </pre>
              </div>

              {/* Card Footer: Tags & AI quick actions */}
              <div>
                {snip.tags && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {snip.tags.split(',').map((t, idx) => (
                      <span key={idx} className="tag-badge">#{t.trim()}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(snip.updated_at).toLocaleDateString()}
                  </span>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAi('explain', snip.code, snip.language);
                      }}
                      title="Explain in Hinglish"
                    >
                      <Lightbulb size={13} /> Explain
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAi('fix', snip.code, snip.language);
                      }}
                      title="Smart Fix"
                    >
                      <Wrench size={13} /> Fix
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {snippets.map((snip, index) => (
            <div
              key={snip.id}
              onClick={() => handleOpenEdit(snip)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderBottom: index < snippets.length - 1 ? '1px solid var(--border-color)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0, marginRight: '1rem' }}>
                <button
                  className="btn-icon"
                  onClick={(e) => handleToggleFavorite(e, snip.id)}
                  title="Favorite"
                >
                  <Star
                    size={18}
                    fill={snip.is_favorite ? '#D6A64F' : 'none'}
                    color={snip.is_favorite ? '#D6A64F' : 'var(--text-muted)'}
                  />
                </button>

                <span className="lang-badge" style={{ minWidth: '70px', textAlign: 'center' }}>
                  {snip.language}
                </span>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {snip.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span>v{snip.version_count}</span>
                    <span>•</span>
                    <span>{new Date(snip.updated_at).toLocaleDateString()}</span>
                    {snip.tags && (
                      <>
                        <span>•</span>
                        <span>{snip.tags}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAi('explain', snip.code, snip.language);
                  }}
                >
                  <Lightbulb size={13} /> Explain
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAi('fix', snip.code, snip.language);
                  }}
                >
                  <Wrench size={13} /> Fix
                </button>
                <button
                  className="btn-icon"
                  onClick={(e) => handleCopyCode(e, snip.id, snip.code)}
                >
                  {copiedId === snip.id ? <Check size={16} color="#5FB286" /> : <Copy size={16} />}
                </button>
                <button
                  className="btn-icon"
                  style={{ color: '#D66B6B' }}
                  onClick={(e) => handleDeleteSnippet(e, snip.id, snip.title)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SNIPPET MODAL (CREATE / EDIT / VIEW / ROLLBACK) */}
      <SnippetModal
        isOpen={isSnippetModalOpen}
        onClose={() => setIsSnippetModalOpen(false)}
        snippet={editingSnippet}
        onSaved={fetchSnippets}
        onOpenAi={handleOpenAi}
      />

      {/* AI ASSISTANT MODAL (PHOTO-TO-CODE / SMART FIX / HINGLISH EXPLAIN) */}
      <AiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialTab={aiInitialTab}
        activeSnippetCode={aiActiveCode}
        activeSnippetLanguage={aiActiveLang}
        onApplyCode={aiApplyCallback}
      />

    </div>
  );
}
