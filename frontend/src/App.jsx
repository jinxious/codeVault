import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('vault_token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('vault_user_email') || '');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    const savedToken = localStorage.getItem('vault_token');
    const savedEmail = localStorage.getItem('vault_user_email');
    if (savedToken) {
      setToken(savedToken);
      setUserEmail(savedEmail || 'Student User');
    }
  }, []);

  const handleLoginSuccess = (data) => {
    setToken(data.token);
    setUserEmail(data.email);
  };

  const handleRegisterSuccess = (data) => {
    setToken(data.token);
    setUserEmail(data.email);
  };

  const handleLogout = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user_email');
    setToken('');
    setUserEmail('');
    setAuthView('login');
  };

  // If user is logged in, show Dashboard
  if (token) {
    return (
      <Dashboard
        userEmail={userEmail}
        onLogout={handleLogout}
      />
    );
  }

  // Otherwise, show Login or Register
  if (authView === 'register') {
    return (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => setAuthView('login')}
      />
    );
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onSwitchToRegister={() => setAuthView('register')}
    />
  );
}
