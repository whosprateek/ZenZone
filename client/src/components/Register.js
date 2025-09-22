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
    'Jawaharlal Nehru University (JNU)',
    'Indian Institute of Technology Delhi (IIT Delhi)',
    'All India Institute of Medical Sciences (AIIMS Delhi)',
    'Indraprastha Institute of Information Technology (IIIT Delhi)',
    'Delhi Technological University (DTU)',
    'Netaji Subhas University of Technology (NSUT)',
    'Jamia Millia Islamia',
    'Guru Gobind Singh Indraprastha University (GGSIPU)',
    'Ambedkar University Delhi (AUD)',
    'National Law University Delhi (NLUD)',
    'Lady Shri Ram College for Women (LSR)',
    'St. Stephen\'s College',
    'Hindu College',
    'Hansraj College',
    'Ramjas College',
    'Sri Venkateswara College',
    'Gargi College',
    'Jesus and Mary College',
    'Miranda House',
    'Shri Ram College of Commerce (SRCC)',
    'Shaheed Sukhdev College of Business Studies',
    'Bharati College',
    'Daulat Ram College',
    'Kirori Mal College',
    'Zakir Husain Delhi College',
    'Deshbandhu College',
    'Keshav Mahavidyalaya',
    'Maharaja Agrasen College',
    'Motilal Nehru College',
    'P.G.D.A.V. College',
    'Rajdhani College',
    'Satyawati College',
    'Swami Shraddhanand College',
    'Vivekananda College',
    'Amity University Delhi',
    'Lovely Professional University Delhi Campus',
    'Bharati Vidyapeeth University Delhi',
    'Sharda University',
    'Bennett University',
    'O.P. Jindal Global University',
    'The Northcap University',
    'Lingaya\'s Vidyapeeth',
    'Manav Rachna University',
    'Other Delhi College/University'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (error) setError('');
    
    // Check password strength
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
    
    Object.values(checks).forEach(check => {
      if (check) strength++;
    });
    
    if (strength < 3) {
      setPasswordStrength('weak');
    } else if (strength < 5) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
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
      // Remove confirmPassword from the data sent to the server
      const { confirmPassword, ...submitData } = formData;
      await api.post('/api/auth/register', submitData);
      
      setSuccess('Registration successful! Redirecting to login...');
      
      // Redirect after a short delay to show success message
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <h2>Join ZenZone</h2>
          <p>Create your account to get started</p>
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
                  placeholder="Choose a username"
                  disabled={loading}
                  minLength="3"
                />
              </div>
              <small className="form-text text-muted">At least 3 characters</small>
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
                  placeholder="Create a strong password"
                  disabled={loading}
                  minLength="6"
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
              {passwordStrength && (
                <div className={`password-strength text-${getPasswordStrengthColor()}`}>
                  <small>
                    <i className={`bi bi-shield-${passwordStrength === 'strong' ? 'check' : passwordStrength === 'medium' ? 'exclamation' : 'x'} me-1`}></i>
                    Password strength: <strong>{passwordStrength}</strong>
                  </small>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className={`form-control ${error && error.includes('match') ? 'is-invalid' : ''}`}
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Role</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="bi bi-briefcase"></i>
                </span>
                <select 
                  className="form-control" 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange} 
                  required 
                  disabled={loading}
                >
                  <option value="student">Student</option>
                  <option value="psychiatrist">Psychiatrist</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">College/Institution</label>
              <div className="input-group">
                <span className="input-icon">
                  <i className="bi bi-building"></i>
                </span>
                <select 
                  className={`form-control ${error && error.includes('college') ? 'is-invalid' : ''}`}
                  name="college" 
                  value={formData.college} 
                  onChange={handleChange} 
                  required 
                  disabled={loading}
                >
                  <option value="">Select your college or institution</option>
                  {delhiColleges.map((college, index) => (
                    <option key={index} value={college}>{college}</option>
                  ))}
                </select>
              </div>
              <small className="form-text text-muted">Choose your Delhi college or university</small>
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary btn-auth ${loading ? 'loading' : ''}`}
              disabled={loading}
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
  );
}

export default Register;