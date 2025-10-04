import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Messaging from './Messaging';
import ConfirmModal from './ConfirmModal.jsx';
import { generateDeterministicDisplayName } from '../utils/anonymity';
import './ChatLayout.css';

function PsychiatristChats() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pinned, setPinned] = useState({});
  const [muted, setMuted] = useState({});
const [archived, setArchived] = useState({});
  const [archExpanded, setArchExpanded] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState({});
  const [previews, setPreviews] = useState({});
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: 'Confirm', onConfirm: null });

  useEffect(() => {
    const loadMaps = () => {
      try { setPinned(JSON.parse(localStorage.getItem('chat.pinned') || '{}')); } catch {}
      try { setMuted(JSON.parse(localStorage.getItem('chat.muted') || '{}')); } catch {}
      try { setArchived(JSON.parse(localStorage.getItem('chat.archived') || '{}')); } catch {}
    };
    loadMaps();
    const onPrefs = () => loadMaps();
    window.addEventListener('chatPrefsChanged', onPrefs);

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
        try {
          const openId = localStorage.getItem('openAppointmentId');
          if (anonymized.length) {
            const match = openId ? anonymized.find(a => a._id === openId) : null;
            setSelectedAppointment(match || anonymized[0]);
            if (openId) localStorage.removeItem('openAppointmentId');
          }
        } catch {
          if (anonymized.length && !selectedAppointment) setSelectedAppointment(anonymized[0]);
        }
      } catch (err) {
        setError('Failed to load appointments: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
    return () => window.removeEventListener('chatPrefsChanged', onPrefs);
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    let list = !q ? appointments : appointments.filter(a => (a.userId?.username || '').toLowerCase().includes(q));
    // Sort pinned first, then by preview timestamp or date desc
    list = [...list].sort((a, b) => {
      const pa = !!pinned[a._id];
      const pb = !!pinned[b._id];
      if (pa !== pb) return pa ? -1 : 1;
      const ta = Date.parse(localStorage.getItem(`chat.last.${a._id}`) ? JSON.parse(localStorage.getItem(`chat.last.${a._id}`)).timestamp : a.date);
      const tb = Date.parse(localStorage.getItem(`chat.last.${b._id}`) ? JSON.parse(localStorage.getItem(`chat.last.${b._id}`)).timestamp : b.date);
      return (tb || 0) - (ta || 0);
    });
    setFiltered(list);
  }, [query, appointments, pinned]);

  // Poll unread counts from localStorage for badges
  useEffect(() => {
    const update = () => {
      const unreadMap = {};
      const prevMap = {};
      appointments.forEach(app => {
        try {
          const n = parseInt(localStorage.getItem(`chat.unread.${app._id}`) || '0', 10) || 0;
          unreadMap[app._id] = n;
        } catch { unreadMap[app._id] = 0; }
        try {
          const p = JSON.parse(localStorage.getItem(`chat.last.${app._id}`) || 'null');
          if (p) prevMap[app._id] = p;
        } catch {}
      });
      setUnread(unreadMap);
      setPreviews(prev => ({ ...prev, ...prevMap }));
    };
    update();
    const id = setInterval(update, 1200);
    return () => clearInterval(id);
  }, [appointments]);

  // Lazy fetch last message previews when missing (initial load)
  useEffect(() => {
    const fetchMissing = async () => {
      const missing = appointments.filter(a => !previews[a._id]);
      if (missing.length === 0) return;
      try {
        const results = await Promise.all(
          missing.slice(0, 10).map(a => api.get(`/api/messages/last/${a._id}`).then(r => ({ id: a._id, data: r.data })).catch(() => ({ id: a._id, data: null })))
        );
        const map = {};
        results.forEach(({ id, data }) => { if (data) map[id] = { content: data.content || '', timestamp: data.timestamp }; });
        if (Object.keys(map).length) setPreviews(prev => ({ ...prev, ...map }));
      } catch {}
    };
    fetchMissing();
  }, [appointments, previews]);

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
    <div className="chat-app">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <div className="sidebar-actions">
            <button className="icon-btn" title="Mark all as read" onClick={() => {
              try { (filtered || []).forEach(a => localStorage.setItem(`chat.unread.${a._id}`, '0')); } catch {}
              setUnread({});
            }}>
              <i className="bi bi-check2-all"></i>
            </button>
            <button className="icon-btn" title={archExpanded ? 'Hide archived' : 'Show archived'} onClick={()=>setArchExpanded(v=>!v)}>
              <i className={`bi ${archExpanded ? 'bi-folder2-open' : 'bi-archive'}`}></i>
            </button>
          </div>
        </div>
        <div className="sidebar-search">
          <i className="bi bi-search"></i>
          <input 
            placeholder="Search contacts..."
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
        </div>
        <div className="sidebar-list">
          {loading ? (
            <div className="text-muted px-3 py-2">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted px-3 py-2">No approved appointments.</div>
          ) : (
            <>
            {filtered.filter(a => !archived[a._id]).map((app) => (
              <div 
                key={app._id} 
                className={`chat-contact ${selectedAppointment?._id===app._id?'active':''} ${muted[app._id] ? 'muted' : ''}`}
                onClick={() => { setSelectedAppointment(app); try{ localStorage.setItem(`chat.unread.${app._id}`, '0'); } catch {}; setUnread(u => ({ ...u, [app._id]: 0 })); }}
              >
                <div className="avatar"><i className="bi bi-person-circle"></i></div>
                <div className="contact-main">
                  <div className="line-1">
                    <span className="name">
                      {unread[app._id] > 0 && <span className="new-dot" aria-label="New messages"></span>}
                      {app.userId?.username || 'Student'}
                    </span>
                    <span className="time">{(previews[app._id]?.timestamp ? new Date(previews[app._id].timestamp) : new Date(app.date)).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="line-2">
                    <span className="preview">{(previews[app._id]?.content || 'Appointment created').slice(0,48)}</span>
                    <span className={`status ${app.status}`}>{app.status}</span>
                    {unread[app._id] > 0 && (
                      <span className="unread-badge" title={`${unread[app._id]} unread`}>{unread[app._id]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Archived section */}
            <div className="archived-section">
              <div className="archived-header" onClick={()=>setArchExpanded(v=>!v)}>
                <i className="bi bi-archive"></i>
                <span>Archived ({filtered.filter(a => archived[a._id]).length})</span>
                <i className={`bi ${archExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </div>
              {archExpanded && (
                <>
                  {filtered.filter(a => archived[a._id]).map((app) => (
                    <div 
                      key={app._id} 
                      className={`chat-contact ${selectedAppointment?._id===app._id?'active':''} ${muted[app._id] ? 'muted' : ''}`}
                      onClick={() => { setSelectedAppointment(app); try{ localStorage.setItem(`chat.unread.${app._id}`, '0'); } catch {}; setUnread(u => ({ ...u, [app._id]: 0 })); }}
                    >
                      <div className="avatar"><i className="bi bi-person-circle"></i></div>
                      <div className="contact-main">
                        <div className="line-1">
                          <span className="name">
                            {unread[app._id] > 0 && <span className="new-dot" aria-label="New"></span>}
                            {app.userId?.username || 'Student'}
                          </span>
                          <span className="time">{(previews[app._id]?.timestamp ? new Date(previews[app._id].timestamp) : new Date(app.date)).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="line-2">
                          <span className="preview">{(previews[app._id]?.content || 'Appointment created').slice(0,48)}</span>
                          <span className={`status ${app.status}`}>{app.status}</span>
                          {unread[app._id] > 0 && (
                            <span className="unread-badge" title={`${unread[app._id]} unread`}>{unread[app._id]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="chat-main">
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {selectedAppointment ? (
          <Messaging appointmentId={selectedAppointment._id} />
        ) : (
          <div className="empty-main">Select a student on the left to start messaging.</div>
        )}
      </main>

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
