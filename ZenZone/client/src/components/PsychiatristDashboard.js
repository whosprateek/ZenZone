import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Messaging from './Messaging';
import DashboardAnalytics from './DashboardAnalytics.jsx';
import './PsychiatristDashboard.css';
import { 
  anonymizeStudentData, 
  anonymizeAppointmentData, 
  generateDeterministicDisplayName,
  getAnonymousAvatarColor,
  shouldRemainAnonymous 
} from '../utils/anonymity';

function PsychiatristDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0
  });

  // Get current user info
  const [userInfo, setUserInfo] = useState(null);
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(response.data);
      } catch (err) {
        console.log('Could not fetch user info:', err.message);
      }
    };
    fetchUserInfo();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Calculate stats whenever appointments change
  useEffect(() => {
    calculateStats();
  }, [appointments]);

  const appointmentsForAnalytics = Array.isArray(appointments) ? appointments : [];

  // Filter appointments based on status and search
  useEffect(() => {
    filterAppointments();
  }, [appointments, filterStatus, searchTerm]);

  // Anonymize appointment data for psychiatrist view
  const getAnonymousAppointmentData = (appointment) => {
    if (!appointment.userId || !shouldRemainAnonymous('student', 'psychiatrist')) {
      return appointment;
    }

    // Generate consistent anonymous name based on user ID seed
    const seed = appointment.userId?._id || appointment.userId;
    const anonymousName = generateDeterministicDisplayName(seed);
    const anonymousId = `Anonymous_${String(seed).slice(-6) || 'user'}`;

    return {
      ...appointment,
      userId: {
        ...appointment.userId,
        username: anonymousName,
        displayName: anonymousName,
        email: 'anonymous@student.zenzone.com',
        isAnonymous: true
      },
      anonymousPatientId: anonymousId,
      studentDisplayName: anonymousName,
      isAnonymousView: true
    };
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/appointments/my-appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Anonymize appointment data for psychiatrist view
      const anonymizedAppointments = (response.data || []).map(appointment => 
        getAnonymousAppointmentData(appointment)
      );
      
      setAppointments(anonymizedAppointments);
      setError('');
    } catch (err) {
      setError('Failed to load appointments: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const today = new Date().toDateString();
    const newStats = {
      total: appointments.length,
      pending: appointments.filter(app => app.status === 'pending').length,
      approved: appointments.filter(app => app.status === 'approved').length,
      rejected: appointments.filter(app => app.status === 'rejected').length,
      today: appointments.filter(app => new Date(app.date).toDateString() === today).length
    };
    setStats(newStats);
  };

  const filterAppointments = () => {
    let filtered = appointments;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        const studentName = app.userId?.username?.toLowerCase() || '';
        const message = app.message?.toLowerCase() || '';
        return studentName.includes(search) || message.includes(search);
      });
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    
    setFilteredAppointments(filtered);
  };

  const handleApprove = async (appointmentId) => {
    setProcessingIds(prev => new Set([...prev, appointmentId]));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/appointments/${appointmentId}`, { status: 'approved' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setAppointments(prev => prev.map(app => 
        app._id === appointmentId ? { ...app, status: 'approved' } : app
      ));
      
      setSuccess('Appointment approved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError('Failed to approve appointment: ' + (err.response?.data?.error || err.message));
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleReject = async (appointmentId) => {
    setProcessingIds(prev => new Set([...prev, appointmentId]));
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/appointments/${appointmentId}`, { status: 'rejected' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setAppointments(prev => prev.map(app => 
        app._id === appointmentId ? { ...app, status: 'rejected' } : app
      ));
      
      setSuccess('Appointment rejected.');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError('Failed to reject appointment: ' + (err.response?.data?.error || err.message));
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const openMessaging = (appointment) => {
    try { localStorage.setItem('openAppointmentId', appointment._id); } catch {}
    window.location.href = '/psychiatrist-chats';
  };

  const closeMessaging = () => {
    setShowMessaging(false);
    setSelectedAppointment(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show messaging overlay
  if (showMessaging && selectedAppointment) {
    return (
      <div className="messaging-overlay">
        <div className="messaging-overlay-header">
          <button className="btn-close-messaging" onClick={closeMessaging}>
            <i className="bi bi-arrow-left"></i>
            <span>Back to Dashboard</span>
          </button>
          <div className="messaging-patient-info">
            <div className="patient-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <div>
              <h3>{selectedAppointment.userId?.username || 'Student'}</h3>
              <p>Appointment: {formatDate(selectedAppointment.date)}</p>
            </div>
          </div>
        </div>
        <div className="messaging-content">
          <Messaging appointmentId={selectedAppointment._id} inOverlay={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="psychiatrist-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="doctor-info">
            <div className="doctor-avatar">
              <i className="bi bi-person-hearts"></i>
            </div>
            <div className="doctor-details">
              <h1>Welcome back, Dr. {userInfo?.username || 'Psychiatrist'}</h1>
              <p>Here's your patient management dashboard</p>
            </div>
          </div>
          
          <div className="dashboard-date">
            <div className="current-date">
              <i className="bi bi-calendar3"></i>
              <span>{new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <button className="btn-refresh" onClick={fetchAppointments} disabled={loading}>
              <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`}></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="dashboard-alert alert-danger">
          <i className="bi bi-exclamation-circle"></i>
          <span>{error}</span>
          <button className="btn-close-alert" onClick={() => setError('')}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}
      
      {success && (
        <div className="dashboard-alert alert-success">
          <i className="bi bi-check-circle"></i>
          <span>{success}</span>
          <button className="btn-close-alert" onClick={() => setSuccess('')}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="dashboard-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="bi bi-calendar2-check"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>
        
        <div className="stat-card approved">
          <div className="stat-icon">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
        </div>
        
        <div className="stat-card today">
          <div className="stat-icon">
            <i className="bi bi-calendar-day"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.today}</div>
            <div className="stat-label">Today's Appointments</div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <DashboardAnalytics appointments={appointmentsForAnalytics} />

      {/* Appointments Management */}
      <div className="appointments-management">
        <div className="management-header">
          <h2>Patient Appointments</h2>
          
          <div className="management-controls">
            {/* Search */}
            <div className="search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Search by patient name or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="btn-clear-search" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
            
            {/* Status Filter */}
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All ({stats.total})
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pending ({stats.pending})
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'approved' ? 'active' : ''}`}
                onClick={() => setFilterStatus('approved')}
              >
                Approved ({stats.approved})
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="appointments-container">
          {loading ? (
            <div className="appointments-loading">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="appointment-card-skeleton">
                  <div className="skeleton-header">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-info">
                      <div className="skeleton-name"></div>
                      <div className="skeleton-date"></div>
                    </div>
                  </div>
                  <div className="skeleton-message"></div>
                  <div className="skeleton-actions"></div>
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="no-appointments">
              <div className="no-appointments-icon">
                <i className="bi bi-calendar-x"></i>
              </div>
              <h3>{searchTerm ? 'No matching appointments' : 'No appointments found'}</h3>
              <p>
                {searchTerm 
                  ? `No appointments match your search for "${searchTerm}"`
                  : filterStatus === 'all' 
                    ? 'You don\'t have any appointments yet. New appointment requests will appear here.'
                    : `No ${filterStatus} appointments found.`
                }
              </p>
              {searchTerm && (
                <button className="btn btn-outline-primary" onClick={() => setSearchTerm('')}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="appointments-grid">
              {filteredAppointments.map((appointment) => {
                const isProcessing = processingIds.has(appointment._id);
                
                return (
                  <div key={appointment._id} className={`appointment-card ${appointment.status}`}>
                    {/* Patient Info */}
                    <div className="appointment-header">
                      <div className="patient-info">
                        <div 
                          className="patient-avatar"
                          style={{
                            backgroundColor: appointment.isAnonymousView 
                              ? getAnonymousAvatarColor(appointment.userId?.username || 'default')
                              : '#6366f1',
                            color: 'white',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {appointment.isAnonymousView ? (
                            <i className="bi bi-incognito"></i>
                          ) : (
                            <i className="bi bi-person-circle"></i>
                          )}
                        </div>
                        <div className="patient-details">
                          <h4 className="patient-name">
                            {appointment.isAnonymousView ? (
                              <>
                                <i className="bi bi-shield-lock me-2" style={{color: '#6366f1', fontSize: '0.9rem'}}></i>
                                {appointment.userId?.username || 'Anonymous Student'}
                              </>
                            ) : (
                              appointment.userId?.username || 'Unknown Student'
                            )}
                          </h4>
                          <div className="appointment-meta">
                            <span className="appointment-date">
                              <i className="bi bi-calendar3"></i>
                              {formatDate(appointment.date)}
                            </span>
                            <span className="appointment-time">
                              <i className="bi bi-clock"></i>
                              {formatTime(appointment.createdAt || appointment.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`status-badge ${appointment.status}`}>
                        {appointment.status === 'pending' && <i className="bi bi-clock-history"></i>}
                        {appointment.status === 'approved' && <i className="bi bi-check-circle"></i>}
                        {appointment.status === 'rejected' && <i className="bi bi-x-circle"></i>}
                        <span>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="appointment-message">
                      <h5>Patient's Message:</h5>
                      <p>{appointment.message || 'No message provided'}</p>
                    </div>

                    {/* Actions */}
                    <div className="appointment-actions">
                      {appointment.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-success"
                            onClick={() => handleApprove(appointment._id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Approving...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check-lg me-2"></i>
                                Approve Appointment
                              </>
                            )}
                          </button>
                          
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => handleReject(appointment._id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-x-lg me-2"></i>
                                Reject
                              </>
                            )}
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'approved' && (
                        <button 
                          className="btn btn-primary btn-chat"
                          onClick={() => openMessaging(appointment)}
                        >
                          <i className="bi bi-chat-dots me-2"></i>
                          Start Consultation
                        </button>
                      )}
                      
                      {appointment.status === 'rejected' && (
                        <div className="rejected-info">
                          <i className="bi bi-info-circle me-2"></i>
                          This appointment was declined
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PsychiatristDashboard;