import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Messaging from './Messaging';
import ConfirmModal from './ConfirmModal.jsx';
import './ChatLayout.css';

function StudentChats() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState({});
  const [previews, setPreviews] = useState({});
  const [pinned, setPinned] = useState({});
  const [muted, setMuted] = useState({});
  const [archived, setArchived] = useState({});
  const [showArchived, setShowArchived] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, onConfirm: null, title: '', message: '' });

  useEffect(() => {
    const loadMaps = () => {
      try { setPinned(JSON.parse(localStorage.getItem('chat.pinned') || '{}')); } catch {}
      try { setMuted(JSON.parse(localStorage.getItem('chat.muted') || '{}')); } catch {}
      try { setArchived(JSON.parse(localStorage.getItem('chat.archived') || '{}')); } catch {}
    };
    // initial read
    loadMaps();
    // listen for changes from other components
    const onPrefs = () => loadMaps();
    window.addEventListener('chatPrefsChanged', onPrefs);

    const fetchAppointments = async () => {
      try {
        const res = await api.get('/api/appointments/my-appointments-student');
        const data = res.data || [];
        setAppointments(data);
        setFiltered(data);
        if (data.length && !selected) setSelected(data[0]);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load your appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
    // poll for status/updates so new approvals open without manual refresh
    const id = setInterval(fetchAppointments, 5000);
    return () => {
      clearInterval(id);
      window.removeEventListener('chatPrefsChanged', onPrefs);
    };
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    let list = !q ? appointments : appointments.filter(a => (a.psychiatristId?.username || '').toLowerCase().includes(q));
    list = list.filter(a => showArchived ? archived[a._id] : !archived[a._id]);
    list = [...list].sort((a, b) => {
      const pa = !!pinned[a._id];
      const pb = !!pinned[b._id];
      if (pa !== pb) return pa ? -1 : 1;
      const ta = Date.parse(localStorage.getItem(`chat.last.${a._id}`) ? JSON.parse(localStorage.getItem(`chat.last.${a._id}`)).timestamp : a.date);
      const tb = Date.parse(localStorage.getItem(`chat.last.${b._id}`) ? JSON.parse(localStorage.getItem(`chat.last.${b._id}`)).timestamp : b.date);
      return (tb || 0) - (ta || 0);
    });
    setFiltered(list);
  }, [query, appointments, pinned, archived, showArchived]);

  // Poll unread counts for badges
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
    <div className="chat-app">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <div className="sidebar-actions">
            <button className="icon-btn" title={showArchived ? 'Hide archived' : 'Show archived'} onClick={()=>setShowArchived(v=>!v)}>
              <i className={`bi ${showArchived ? 'bi-archive-fill' : 'bi-archive'}`}></i>
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
            <div className="text-muted px-3 py-2">No appointments yet. Go to Contact Psychiatrist to request one.</div>
          ) : (
            filtered.map((app) => (
              <div 
                key={app._id} 
                className={`chat-contact ${selected?._id===app._id?'active':''} ${muted[app._id] ? 'muted' : ''}`}
                onClick={() => { setSelected(app); try{ localStorage.setItem(`chat.unread.${app._id}`, '0'); } catch {}; setUnread(u => ({ ...u, [app._id]: 0 })); }}
              >
                <div className="avatar"><i className="bi bi-person-hearts"></i></div>
                <div className="contact-main">
                  <div className="line-1">
                    <span className="name">
                      {unread[app._id] > 0 && <span className="new-dot" aria-label="New messages"></span>}
                      Dr. {app.psychiatristId?.username || 'Psychiatrist'}
                    </span>
                    <span className="time">{(previews[app._id]?.timestamp ? new Date(previews[app._id].timestamp) : new Date(app.date)).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="line-2">
                    <span className="preview">{(previews[app._id]?.content || app.message || 'Appointment created').slice(0,48)}</span>
                    <span className={`status ${app.status}`}>{app.status}</span>
                    {unread[app._id] > 0 && (
                      <span className="unread-badge" title={`${unread[app._id]} unread`}>{unread[app._id]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="chat-main">
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {selected ? (
          <Messaging appointmentId={selected._id} canSend={selected.status === 'approved'} />
        ) : (
          <div className="empty-main">Select a psychiatrist on the left to start messaging.</div>
        )}
      </main>

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
