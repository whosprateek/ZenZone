import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import '../zenzone-branding.css';
import './ContactPsychiatrist.css';

function ContactPsychiatrist() {
  // Helper to normalize college names for robust comparison
  const normalizeCollege = (val) => {
    if (val === undefined || val === null) return '';
    const str = String(val).trim().toLowerCase();
    // Treat literal strings like 'undefined' or 'null' as missing
    if (str === 'undefined' || str === 'null') return '';
    return str.replace(/\s+/g, ' ');
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [psychiatrists, setPsychiatrists] = useState([]);
  const [filteredPsychiatrists, setFilteredPsychiatrists] = useState([]);
  const [userCollege, setUserCollege] = useState('');
  const [formData, setFormData] = useState({ psychiatristId: '', date: '', message: '' });
  const [selectedPsychiatrist, setSelectedPsychiatrist] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Psychiatrist, 2: Schedule Appointment
  
  // Get assessment report from navigation state
  const assessmentReport = location.state?.assessmentReport;
  const userProfile = location.state?.userProfile;
  const fromAssessment = location.state?.fromAssessment;
  

  useEffect(() => {
    const fetchUserAndPsychiatrists = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch current user's profile to get their college
        const userResponse = await api.get('/api/auth/me');
        
        console.log('User Response:', userResponse.data); // Debug log
        
        // Handle different possible response structures
        let rawCollege = userResponse.data.college || userResponse.data.user?.college || null;
        // Fallback to localStorage if API didn't include it (covers legacy users)
        if (!rawCollege) {
          const lsCollege = localStorage.getItem('college');
          if (lsCollege) rawCollege = lsCollege;
        }
        // Final fallback: decode from JWT payload if present
        if (!rawCollege && token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload?.college) rawCollege = payload.college;
          } catch (e) {
            console.warn('Unable to decode JWT for college:', e);
          }
        }
        const currentUserCollege = normalizeCollege(rawCollege);
        console.log('Current User College (raw):', rawCollege); // Debug log
        console.log('Current User College (normalized):', currentUserCollege); // Debug log
        // Keep a human-friendly label for UI
        setUserCollege(rawCollege || '');
        
        // Fetch all psychiatrists
        const response = await api.get('/api/auth/psychiatrists');
        
        const allPsychiatrists = response.data;
        console.log('All Psychiatrists:', allPsychiatrists); // Debug log
        setPsychiatrists(allPsychiatrists);
        
        // Handle null/undefined college cases after all fallbacks attempted
        if (!currentUserCollege) {
          setError('Your college information is missing. Please update your profile or contact support.');
          setFilteredPsychiatrists([]);
          return;
        }
        
        // Filter psychiatrists by same college as the student (case-insensitive)
        const sameColgePsychiatrists = allPsychiatrists.filter(
          psychiatrist => {
            const psychiatristCollege = normalizeCollege(psychiatrist.college);
            console.log(`Comparing: Student \"${currentUserCollege}\" vs Psychiatrist \"${psychiatristCollege}\"`); // Debug log
            return psychiatristCollege && psychiatristCollege === currentUserCollege;
          }
        );
        
        // Only exact normalized match allowed
        const finalList = sameColgePsychiatrists;
        console.log('Filtered Psychiatrists (final - exact match only):', finalList); // Debug log
        setFilteredPsychiatrists(finalList);
        
        if (finalList.length === 0) {
          const availableColleges = [...new Set(allPsychiatrists.filter(p => p.college).map(p => p.college))];
          setError(`No psychiatrists available from your college${(rawCollege && rawCollege !== 'undefined') ? ` (${rawCollege})` : ''}. Please contact your college administration.`);
        } else {
          setError('');
        }
        
      } catch (err) {
        setError('Failed to load psychiatrists: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndPsychiatrists();
  }, []);
  
  // Auto-populate message when coming from assessment
  useEffect(() => {
    if (fromAssessment && assessmentReport && !formData.message) {
      const autoMessage = `Hi Dr., \n\nI just completed my ZenZone wellness assessment and received my personalized report (Overall Score: ${assessmentReport.overall_score}/100, Risk Level: ${assessmentReport.risk_level}). \n\nBased on my assessment results, I would like to schedule an appointment to discuss my mental health and explore treatment options. My assessment report has been automatically attached to this request for your review.\n\nThank you for your time.`;
      
      setFormData(prev => ({
        ...prev,
        message: autoMessage
      }));
    }
  }, [fromAssessment, assessmentReport, formData.message]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const selectPsychiatrist = (psychiatrist) => {
    setSelectedPsychiatrist(psychiatrist);
    setFormData({ ...formData, psychiatristId: psychiatrist._id });
    setStep(2);
  };

  const validateForm = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!formData.psychiatristId) {
      setError('Please select a psychiatrist');
      return false;
    }
    
    if (!formData.date) {
      setError('Please select a date for your appointment');
      return false;
    }
    
    if (formData.date < today) {
      setError('Please select a future date');
      return false;
    }
    
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setError('Please provide a detailed message (at least 10 characters)');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare appointment data with assessment report if available
      const appointmentData = {
        ...formData,
        assessmentReport: assessmentReport || null,
        fromAssessment: fromAssessment || false,
        userProfile: userProfile || null
      };
      
      await api.post('/api/appointments', appointmentData);
      
      setSuccess('Appointment request submitted successfully! You will receive a confirmation once the psychiatrist reviews your request.');
      
      // Reset form after success and navigate back to home within ZenZone
      setTimeout(() => {
        navigate('/'); // Stay within the app
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setSelectedPsychiatrist(null);
    setFormData({ psychiatristId: '', date: '', message: '' });
  };

  return (
    <div className="appointment-booking-container">
      {/* Header */}
      <div className="appointment-header">
        <div className="appointment-header-content">
          <div className="zen-assessment-brand">
            <i className="bi bi-yin-yang zen-assess-icon"></i>
            <div>
              <h2>ZenZone Appointment Booking</h2>
              <p>Connect with our qualified psychiatrists for professional mental health support</p>
              <div className="assessment-badges">
                <span className="assess-badge">
                  <i className="bi bi-shield-check"></i> Secure & Confidential
                </span>
                <span className="assess-badge">
                  <i className="bi bi-person-hearts"></i> Licensed Professionals
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span className="step-label">Choose Psychiatrist</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span className="step-label">Schedule & Message</span>
          </div>
        </div>
      </div>

      {/* Assessment Completion Notice */}
      {fromAssessment && assessmentReport && (
        <div className="alert alert-info appointment-alert" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>Assessment Complete!</strong> Your personalized wellness report will be automatically shared with your chosen psychiatrist to provide the best care possible.
        </div>
      )}
      
      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-danger appointment-alert" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success appointment-alert" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </div>
      )}

      {/* Step 1: Select Psychiatrist */}
      {step === 1 && (
        <div className="appointment-step">
          <div className="step-header">
            <h3>Select a Psychiatrist from {userCollege}</h3>
            <p>Choose from qualified mental health professionals at your college</p>
            {userCollege && (
              <div className="college-info">
                <i className="bi bi-building"></i>
                <span>Showing psychiatrists from: <strong>{userCollege}</strong></span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="psychiatrists-loading">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="psychiatrist-card-skeleton">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-info">
                    <div className="skeleton-name"></div>
                    <div className="skeleton-specialty"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPsychiatrists.length === 0 ? (
            <div className="no-psychiatrists">
              <div className="no-psychiatrists-icon">
                <i className="bi bi-person-x"></i>
              </div>
              <h4>No Psychiatrists Available from Your College</h4>
              <p>No psychiatrists from {userCollege} are currently available. Please contact your college administration.</p>
            </div>
          ) : (
            <div className="psychiatrists-grid">
              {filteredPsychiatrists.map((psychiatrist) => (
                <div key={psychiatrist._id} className="psychiatrist-card" onClick={() => selectPsychiatrist(psychiatrist)}>
                  <div className="psychiatrist-avatar">
                    <i className="bi bi-person-hearts"></i>
                  </div>
                  <div className="psychiatrist-info">
                    <h4 className="psychiatrist-name">Dr. {psychiatrist.username}</h4>
                    <div className="psychiatrist-details">
                      <div className="detail-item">
                        <i className="bi bi-building"></i>
                        <span>{psychiatrist.college || 'Medical Professional'}</span>
                      </div>
                      <div className="detail-item">
                        <i className="bi bi-star-fill"></i>
                        <span>Verified Psychiatrist</span>
                      </div>
                    </div>
                    <div className="availability-status">
                      <span className="status-indicator available"></span>
                      <span>Available for appointments</span>
                    </div>
                  </div>
                  <div className="select-button">
                    <i className="bi bi-arrow-right"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Schedule Appointment */}
      {step === 2 && selectedPsychiatrist && (
        <div className="appointment-step">
          <div className="step-header">
            <button className="btn-back" onClick={goBack}>
              <i className="bi bi-arrow-left"></i>
              <span>Back to Selection</span>
            </button>
            <div className="selected-psychiatrist-info">
              <div className="selected-psychiatrist-avatar">
                <i className="bi bi-person-hearts"></i>
              </div>
              <div>
                <h3>Schedule with Dr. {selectedPsychiatrist.username}</h3>
                <p>Fill in the details below to request your appointment</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-calendar3"></i>
                  Preferred Date
                </label>
                <input 
                  type="date" 
                  className="form-control"
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange} 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  disabled={submitting}
                />
                <small className="form-text">Select your preferred appointment date</small>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <i className="bi bi-chat-dots"></i>
                Message for Dr. {selectedPsychiatrist.username}
              </label>
              <textarea 
                className="form-control message-textarea"
                name="message" 
                value={formData.message} 
                onChange={handleChange} 
                required 
                placeholder="Please describe your concerns, symptoms, or what you'd like to discuss during the appointment. This helps the psychiatrist prepare for your session."
                rows="5"
                disabled={submitting}
                minLength="10"
              />
              <small className="form-text">
                Minimum 10 characters. Current: {formData.message.length} characters
              </small>
            </div>
            
            <div className="appointment-summary">
              <h4>Appointment Summary</h4>
              <div className="summary-details">
                <div className="summary-item">
                  <i className="bi bi-person-hearts"></i>
                  <div>
                    <strong>Psychiatrist</strong>
                    <span>Dr. {selectedPsychiatrist.username}</span>
                  </div>
                </div>
                {formData.date && (
                  <div className="summary-item">
                    <i className="bi bi-calendar3"></i>
                    <div>
                      <strong>Date</strong>
                      <span>{new Date(formData.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                )}
                <div className="summary-item">
                  <i className="bi bi-clock"></i>
                  <div>
                    <strong>Status</strong>
                    <span>Pending approval</span>
                  </div>
                </div>
                {assessmentReport && (
                  <div className="summary-item" style={{backgroundColor: '#d1f2eb', padding: '0.75rem', borderRadius: '8px', border: '2px solid #27ae60'}}>
                    <i className="bi bi-file-earmark-medical text-success" style={{fontSize: '1.2rem'}}></i>
                    <div>
                      <strong style={{color: '#27ae60'}}>📊 ZenZone Assessment Report Attached</strong>
                      <br/>
                      <span style={{color: '#2c5f40'}}>Wellness Score: {assessmentReport.overall_score}/100 | Risk Level: {assessmentReport.risk_level}</span>
                      <br/>
                      <small style={{color: '#2c5f40'}}>✅ Report will be automatically shared with your psychiatrist</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={goBack}
                disabled={submitting}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Change Psychiatrist
              </button>
              
              <button 
                type="submit" 
                className={`btn btn-primary btn-submit ${submitting ? 'loading' : ''}`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Submit Appointment Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ContactPsychiatrist;