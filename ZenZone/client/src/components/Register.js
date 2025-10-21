import React, { useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', role: 'student', college: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  
  // Delhi Colleges and Universities
  const delhiColleges = [
    'Delhi University (DU)',
    'Indian Institute of Technology Delhi (IIT Delhi)',
    'Delhi Technological University (DTU)',
    'Netaji Subhas University of Technology (NSUT)',
    'Guru Gobind Singh Indraprastha University (GGSIPU)',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (error) setError('');

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    Object.values(checks).forEach(check => { if (check) strength++; });
    if (strength < 3) setPasswordStrength('weak');
    else if (strength < 5) setPasswordStrength('medium');
    else setPasswordStrength('strong');
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
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.college.length < 2) {
      setError('Please enter a valid college name');
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
      const { confirmPassword, ...submitData } = formData;
      await api.post('/api/auth/register', submitData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'danger';
      case 'medium': return 'warning';
      case 'strong': return 'success';
      default: return 'secondary';
    }
  };

  const usernameInvalid = Boolean(error && error.includes('Username'));
  const passwordInvalid = Boolean(error && error.includes('Password'));
  const confirmInvalid = Boolean(error && error.includes('match'));
  const collegeInvalid = Boolean(error && error.toLowerCase().includes('college'));

  return (
    <div className="auth-container page-auth">
      <div className="auth-grid">
        <aside className="auth-side" aria-hidden="false">
          <div className="auth-side-content">
            <h1 className="auth-side-title">Create your account</h1>
            <p className="auth-side-subtitle">Join ZenZone to access personalized tools</p>
            <ul className="auth-benefits">
              <li><i className="bi bi-clipboard2-check me-2" aria-hidden="true"></i>Guided assessments</li>
              <li><i className="bi bi-chat-dots me-2" aria-hidden="true"></i>Direct messaging</li>
              <li><i className="bi bi-heart me-2" aria-hidden="true"></i>Progress tracking</li>
            </ul>
          </div>
        </aside>

        <div className="auth-card auth-card--wide">
          <div className="auth-header slim">
            <div className="auth-icon">
              <i className="bi bi-person-plus-fill"></i>
            </div>
            <h2>Sign up</h2>
            <p>Create your account to get started</p>
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
                <label className="form-label" htmlFor="register-username">Username</label>
                <div className="auth-field">
                  <i className="bi bi-person field-icon" aria-hidden="true"></i>
                  <input
                    id="register-username"
                    type="text"
                    className={`auth-input ${usernameInvalid ? 'is-invalid' : ''}`}
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Choose a username"
                    disabled={loading}
                    minLength="3"
                    autoComplete="username"
                    inputMode="text"
                    aria-invalid={usernameInvalid}
                    aria-describedby="register-username-help"
                    autoFocus
                  />
                </div>
                <small id="register-username-help" className="form-text text-muted">At least 3 characters</small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-password">Password</label>
                <div className="auth-field">
                  <i className="bi bi-lock field-icon" aria-hidden="true"></i>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-input ${passwordInvalid ? 'is-invalid' : ''}`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create a strong password"
                    disabled={loading}
                    minLength="6"
                    autoComplete="new-password"
                    aria-invalid={passwordInvalid}
                    aria-describedby="register-password-help register-password-strength"
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
                <small id="register-password-help" className="form-text text-muted">Use 8+ characters with a mix of letters, numbers, and symbols</small>
                {passwordStrength && (
                  <div className={`password-strength text-${getPasswordStrengthColor()}`} id="register-password-strength">
                    <div className={`password-meter ${passwordStrength}`} aria-hidden="true">
                      <div
                        className={`bar ${passwordStrength}`}
                        style={{ width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' }}
                      />
                    </div>
                    <small>
                      <i className={`bi bi-shield-${passwordStrength === 'strong' ? 'check' : passwordStrength === 'medium' ? 'exclamation' : 'x'} me-1`}></i>
                      Password strength: <strong>{passwordStrength}</strong>
                    </small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-confirm-password">Confirm Password</label>
                <div className="auth-field">
                  <i className="bi bi-lock-fill field-icon" aria-hidden="true"></i>
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`auth-input ${confirmInvalid ? 'is-invalid' : ''}`}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                    disabled={loading}
                    autoComplete="new-password"
                    aria-invalid={confirmInvalid}
                  />
                  <button
                    type="button"
                    className="field-action"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                  >
                    <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-role">Role</label>
                <div className="auth-field">
                  <i className="bi bi-briefcase field-icon" aria-hidden="true"></i>
                  <select
                    id="register-role"
                    className="auth-input"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="student">Student</option>
                 
                  </select>
                  <span className="field-caret bi bi-chevron-down" aria-hidden="true"></span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-college">College/Institution</label>
                <div className="auth-field">
                  <i className="bi bi-building field-icon" aria-hidden="true"></i>
                  <select
                    id="register-college"
                    className={`auth-input ${collegeInvalid ? 'is-invalid' : ''}`}
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    aria-invalid={collegeInvalid}
                    aria-describedby="register-college-help"
                  >
                    <option value="">Select your college or institution</option>
                    {delhiColleges.map((college, index) => (
                      <option key={index} value={college}>{college}</option>
                    ))}
                  </select>
                  <span className="field-caret bi bi-chevron-down" aria-hidden="true"></span>
                </div>
                <small id="register-college-help" className="form-text text-muted">Choose your Delhi college or university</small>
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-auth ${loading ? 'loading' : ''}`}
                disabled={loading}
                aria-label={loading ? 'Creating account' : 'Create account'}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>

          <div className="auth-footer">
            <p>
              Already have an account?
              <Link to="/login" className="auth-link">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

