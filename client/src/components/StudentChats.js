import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Messaging from './Messaging';
import ConfirmModal from './ConfirmModal.jsx';

function StudentChats() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, onConfirm: null, title: '', message: '' });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/api/appointments/my-appointments-student');
        const data = res.data || [];
        setAppointments(data);
        setFiltered(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load your appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    setFiltered(
      !q ? appointments : appointments.filter(a => (a.psychiatristId?.username || '').toLowerCase().includes(q))
    );
  }, [query, appointments]);

  const doCloseAppointment = async (id) => {
    try {
      await api.post(`/api/appointments/${id}/close`);
      setAppointments(prev => prev.filter(a => a._id !== id));
      setSelected(s => (s && s._id === id ? null : s));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close appointment');
    }
  };

  const closeAppointment = (id) => {
    setConfirm({
      open: true,
      title: 'Close appointment?',
      message: 'Are you sure you want to close this appointment? You will no longer be able to message this psychiatrist in this thread.',
      onConfirm: async () => { setConfirm(c => ({ ...c, open: false })); await doCloseAppointment(id); },
    });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">Your Psychiatrists</h2>
        <div className="input-group" style={{maxWidth:'320px'}}>
          <span className="input-group-text"><i className="bi bi-search"></i></span>
          <input className="form-control" placeholder="Search psychiatrists" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="row g-3">
        <div className="col-md-4">
          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted">No appointments yet. Go to Contact Psychiatrist to request one.</div>
          ) : (
            <div className="list-group shadow-sm rounded overflow-auto" style={{maxHeight:'70vh'}}>
              {filtered.map((app) => (
                <div key={app._id} className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${selected?._id===app._id?'active':''}`} onClick={() => setSelected(app)}>
                  <div>
                    <div className="fw-semibold">Dr. {app.psychiatristId?.username || 'Psychiatrist'}</div>
                    <small className="opacity-75">{new Date(app.date).toLocaleDateString()} • {app.status}</small>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-sm btn-outline-secondary" onClick={(e)=>{e.stopPropagation(); closeAppointment(app._id);}} title="Close appointment"><i className="bi bi-x-circle"></i></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-md-8">
          {selected ? (
            <Messaging appointmentId={selected._id} />
          ) : (
            <div className="text-muted p-4 border rounded bg-light">Select a psychiatrist on the left to start messaging.</div>
          )}
        </div>
      </div>
      <ConfirmModal 
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText="Yes, close"
        cancelText="Go back"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
}

export default StudentChats;
