import React, { useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
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
      
      // Get user role and profile info
      const userRes = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${res.data.token}` },
      });
      localStorage.setItem('userRole', userRes.data.role);
      // Persist college for reliable client-side filtering
      const college = userRes.data.college || userRes.data.user?.college || '';
      localStorage.setItem('college', college);
      
      setSuccess('Login successful! Redirecting...');
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <i className="bi bi-person-circle"></i>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to continue to MindCare</p>
        </div>
        
        <div className="auth-body">
          {error && (
            <div className="alert alert-danger fade-in" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success fade-in" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="bi bi-person"></i>
                </span>
                <input 
                  type="text" 
                  className={`form-control ${error && error.includes('Username') ? 'is-invalid' : ''}`}
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="bi bi-lock"></i>
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className={`form-control ${error && error.includes('Password') ? 'is-invalid' : ''}`}
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary btn-auth ${loading ? 'loading' : ''}`}
              disabled={loading}
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
  );
}

export default Login;