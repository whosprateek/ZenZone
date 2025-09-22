import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Messaging from './Messaging';
import ConfirmModal from './ConfirmModal.jsx';
import { generateDeterministicDisplayName } from '../utils/anonymity';

function PsychiatristChats() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: 'Confirm', onConfirm: null });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get('/api/appointments/my-appointments');
        const approved = response.data.filter(app => app.status === 'approved');
        // Anonymize display names for psychiatrists (deterministic by userId)
        const anonymized = approved.map(app => {
          const seed = app.userId?._id || app.userId;
          const alias = generateDeterministicDisplayName(seed || 'student');
          return {
            ...app,
            userId: app.userId ? { ...app.userId, username: alias, displayName: alias } : app.userId,
            isAnonymousView: true,
          };
        });
        setAppointments(anonymized);
        setFiltered(anonymized);
      } catch (err) {
        setError('Failed to load appointments: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    setFiltered(
      !q ? appointments : appointments.filter(a => (a.userId?.username || '').toLowerCase().includes(q))
    );
  }, [query, appointments]);

  const doCloseAppointment = async (id) => {
    try {
      await api.post(`/api/appointments/${id}/close`);
      setAppointments(prev => prev.filter(a => a._id !== id));
      setSelectedAppointment(s => (s && s._id === id ? null : s));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close appointment');
    }
  };

  const closeAppointment = (id) => {
    setConfirm({
      open: true,
      title: 'Close appointment?',
      message: 'Are you sure you want to close this appointment? You and the student will no longer be able to message in this thread.',
      confirmText: 'Yes, close',
      onConfirm: async () => { setConfirm(c => ({ ...c, open: false })); await doCloseAppointment(id); },
    });
  };

  const doBlockStudent = async (studentId) => {
    try {
      await api.post(`/api/auth/block/${studentId}`);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to block user');
    }
  };

  const blockStudent = (studentId) => {
    setConfirm({
      open: true,
      title: 'Block student?',
      message: 'Are you sure you want to block this student? They will no longer be able to contact you.',
      confirmText: 'Yes, block',
      onConfirm: async () => { setConfirm(c => ({ ...c, open: false })); await doBlockStudent(studentId); },
    });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">Chats</h2>
        <div className="input-group" style={{maxWidth:'320px'}}>
          <span className="input-group-text"><i className="bi bi-search"></i></span>
          <input className="form-control" placeholder="Search students" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="row g-3">
        <div className="col-md-4">
          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted">No approved appointments.</div>
          ) : (
            <div className="list-group shadow-sm rounded overflow-auto" style={{maxHeight:'70vh'}}>
              {filtered.map((app) => (
                <div key={app._id} className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${selectedAppointment?._id===app._id?'active':''}`} onClick={() => setSelectedAppointment(app)}>
                  <div>
                    <div className="fw-semibold">{app.userId?.username || 'Student'}</div>
                    <small className="opacity-75">{new Date(app.date).toLocaleDateString()}</small>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-sm btn-outline-secondary" onClick={(e)=>{e.stopPropagation(); closeAppointment(app._id);}} title="Close appointment"><i className="bi bi-x-circle"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={(e)=>{e.stopPropagation(); blockStudent(app.userId);}} title="Block student"><i className="bi bi-slash-circle"></i></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-md-8">
          {selectedAppointment ? (
            <Messaging appointmentId={selectedAppointment._id} />
          ) : (
            <div className="text-muted p-4 border rounded bg-light">Select a student on the left to start messaging.</div>
          )}
        </div>
      </div>
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText || 'Confirm'}
        cancelText="Go back"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
}

export default PsychiatristChats;
