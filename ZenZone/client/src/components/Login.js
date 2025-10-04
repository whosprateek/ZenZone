import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Prefill username if the user chose "Remember me" previously
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberUsername');
    if (savedUsername) {
      setFormData((prev) => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);

      if (rememberMe) {
        localStorage.setItem('rememberUsername', formData.username);
      } else {
        localStorage.removeItem('rememberUsername');
      }

      const userRes = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${res.data.token}` },
      });
      localStorage.setItem('userRole', userRes.data.role);
      const college = userRes.data.college || userRes.data.user?.college || '';
      localStorage.setItem('college', college);

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const usernameInvalid = Boolean(error && error.includes('Username'));
  const passwordInvalid = Boolean(error && error.includes('Password'));

  return (
    <div className="auth-container page-auth">
      <div className="auth-grid">
        <aside className="auth-side" aria-hidden="false">
          <div className="auth-side-content">
            <h1 className="auth-side-title">Welcome back</h1>
            <p className="auth-side-subtitle">Sign in to continue to ZenZone</p>
            <ul className="auth-benefits">
              <li><i className="bi bi-shield-lock me-2" aria-hidden="true"></i>Private & secure</li>
              <li><i className="bi bi-bar-chart me-2" aria-hidden="true"></i>Personalized insights</li>
              <li><i className="bi bi-people me-2" aria-hidden="true"></i>Connect with psychiatrists</li>
            </ul>
          </div>
        </aside>

        <div className="auth-card auth-card--wide">
          <div className="auth-header slim">
            <div className="auth-icon">
              <i className="bi bi-person-circle"></i>
            </div>
            <h2>Sign in</h2>
            <p>Use your credentials to access your dashboard</p>
          </div>

          <div className="auth-body">
            {error && (
              <div className="alert alert-danger fade-in" role="alert" aria-live="assertive">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success fade-in" role="status" aria-live="polite">
                <i className="bi bi-check-circle me-2"></i>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" aria-busy={loading}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-username">Username</label>
                <div className="auth-field">
                  <i className="bi bi-person field-icon" aria-hidden="true"></i>
                  <input
                    id="login-username"
                    type="text"
                    className={`auth-input ${usernameInvalid ? 'is-invalid' : ''}`}
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Enter your username"
                    disabled={loading}
                    autoComplete="username"
                    inputMode="text"
                    aria-invalid={usernameInvalid}
                    aria-describedby="login-username-help"
                    autoFocus
                  />
                </div>
                <small id="login-username-help" className="form-text text-muted">At least 3 characters</small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="auth-field">
                  <i className="bi bi-lock field-icon" aria-hidden="true"></i>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-input ${passwordInvalid ? 'is-invalid' : ''}`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                    aria-invalid={passwordInvalid}
                    aria-describedby="login-password-help"
                  />
                  <button
                    type="button"
                    className="field-action"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                <small id="login-password-help" className="form-text text-muted">At least 6 characters</small>
              </div>

              <div className="auth-actions-row">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-auth ${loading ? 'loading' : ''}`}
                disabled={loading}
                aria-label={loading ? 'Signing in' : 'Sign in'}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?
              <Link to="/register" className="auth-link">Create one here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
