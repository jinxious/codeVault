import React, { useState } from 'react';
import { Code2, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }

      // Store auth token in browser storage
      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user_email', data.email);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '2.5rem', boxShadow: 'var(--shadow)' }} className="fade-in">
        
        {/* Logo and title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '10px', background: '#D6A64F', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0D1014', marginBottom: '1rem' }}>
            <Code2 size={30} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Code Snippet Vault</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back! Log in to access your snippets.</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', padding: 0 }}
          >
            Create one here
          </button>
        </div>

      </div>
    </div>
  );
}
