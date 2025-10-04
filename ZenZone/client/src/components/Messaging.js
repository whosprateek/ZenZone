import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, socketBaseURL } from '../lib/api';
import { io } from 'socket.io-client';
import EmojiPicker from './EmojiPicker';
import ConfirmModal from './ConfirmModal.jsx';
import './Messaging.css';
import { generateDeterministicDisplayName } from '../utils/anonymity';
import ChatSettingsDrawer from './ChatSettingsDrawer.jsx';

function Messaging({ appointmentId, inOverlay = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [participants, setParticipants] = useState({ studentId: null, psychiatristId: null });
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastSeen, setLastSeen] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
const [chatSize, setChatSize] = useState(inOverlay ? 'large' : 'medium'); // small, medium, large
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [settings, setSettings] = useState({
    darkMode: null,
    desktopNotifications: false,
    readReceipts: false,
    lastSeen: true,
    autoDownloadMedia: false,
    enterToSend: true,
  });

  // Debug chat size changes
  useEffect(() => {
    console.log('Chat size changed to:', chatSize);
  }, [chatSize]);
  // Ensure overlay starts large for full-height look
  useEffect(() => { if (inOverlay) setChatSize('large'); }, [inOverlay]);
  const userIdLS = localStorage.getItem('userId');
  const [myId, setMyId] = useState(userIdLS || '');
  const socketRef = useRef();
  const userRole = localStorage.getItem('userRole');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeAppointmentId, setActiveAppointmentId] = useState(appointmentId || null);
  const [firstUnreadIndex, setFirstUnreadIndex] = useState(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
    setUnreadCount(0);
    setFirstUnreadIndex(null);
    const apptId = activeAppointmentId || appointmentId;
    if (apptId) {
      try { localStorage.setItem(`chat.unread.${apptId}`, '0'); } catch {}
    }
  };

  const checkIsAtBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 40;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setUnreadCount(0);
      setFirstUnreadIndex(null);
      const apptId = activeAppointmentId || appointmentId;
      if (apptId) {
        try { localStorage.setItem(`chat.unread.${apptId}`, '0'); } catch {}
      }
    }
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view messages.');
        setLoading(false);
        return;
      }

      let response;
      let recipientData = null;

      if (appointmentId) {
        // Always prefer per-appointment view when an appointment is selected (new appointment = new chat)
        response = await api.get(`/api/messages/by-appointment/${appointmentId}`);
        setActiveAppointmentId(appointmentId);

        // Fetch appointment details to determine recipient info
        const appointmentResponse = await api.get(`/api/appointments/${appointmentId}`);
        const studentIdAppt = appointmentResponse.data?.userId?._id || appointmentResponse.data?.userId || null;
        const psychiatristIdAppt = appointmentResponse.data?.psychiatristId?._id || appointmentResponse.data?.psychiatristId || null;
        setParticipants({ studentId: studentIdAppt, psychiatristId: psychiatristIdAppt });
        if (userRole === 'psychiatrist') {
          const seed = studentIdAppt;
          const anonName = generateDeterministicDisplayName(seed || 'student');
          recipientData = {
            name: anonName,
            role: 'Student',
            id: studentIdAppt
          };
        } else {
          // student
          const doc = appointmentResponse.data?.psychiatristId;
          recipientData = {
            name: (doc?.username ? `Dr. ${doc.username}` : 'Dr. Psychiatrist'),
            role: 'Psychiatrist',
            id: psychiatristIdAppt
          };
        }
      } else {
        // Fallback legacy view
        if (userRole === 'psychiatrist') {
          setError('Please select an appointment to view messages.');
          setLoading(false);
          return;
        } else {
          response = await api.get('/api/messages');
          try {
            const appointmentResponse = await api.get('/api/appointments/my-appointment');
            if (appointmentResponse.data?.psychiatristId) {
              const studentIdAppt = appointmentResponse.data?.userId?._id || appointmentResponse.data?.userId || null;
              const psychiatristIdAppt = appointmentResponse.data?.psychiatristId?._id || appointmentResponse.data?.psychiatristId || null;
              setParticipants({ studentId: studentIdAppt, psychiatristId: psychiatristIdAppt });
              recipientData = {
                name: appointmentResponse.data.psychiatristId.username ? `Dr. ${appointmentResponse.data.psychiatristId.username}` : 'Dr. Psychiatrist',
                role: 'Psychiatrist',
                id: psychiatristIdAppt
              };
              setActiveAppointmentId(appointmentResponse.data?._id || null);
            }
          } catch (err) {
            console.log('Could not fetch psychiatrist info:', err.message);
          }
        }
      }

      if (response) {
        setMessages(response.data);
        setRecipientInfo(recipientData);
        setTimeout(scrollToBottom, 100);
      }

      setError('');
    } catch (err) {
      setError('Failed to load messages: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [appointmentId, userRole]);

  // Socket connection and event handlers
  useEffect(() => {
    fetchMessages();
    
    // Initialize socket connection
    socketRef.current = io(socketBaseURL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
      withCredentials: false,
      path: '/socket.io'
    });

    // Connection status handlers
    socketRef.current.on('connect', () => {
      setConnectionStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    // Join room for real-time messaging
    const joinUserId = myId || userIdLS || '';
    if (appointmentId && joinUserId) {
      socketRef.current.emit('joinRoom', { appointmentId, userId: joinUserId });
    }

    // Message handlers
    socketRef.current.on('receiveMessage', (message) => {
      const indexBefore = messages.length;
      setMessages((prevMessages) => [...prevMessages, message]);
      try {
        const apptId = activeAppointmentId || appointmentId;
        if (apptId) localStorage.setItem(`chat.last.${apptId}`, JSON.stringify({ content: message.content || '', timestamp: message.timestamp || Date.now() }));
      } catch {}

      // Play sound for incoming messages from other user if enabled
      const senderIdVal = typeof message.senderId === 'string' ? message.senderId : (message.senderId?._id || message.senderId);
      const me = myId || userIdLS;
      let fromOtherForSound = String(senderIdVal) !== String(me);
      if (fromOtherForSound) {
        if (userRole === 'psychiatrist' && participants.psychiatristId) {
          fromOtherForSound = String(senderIdVal) !== String(participants.psychiatristId);
        } else if (userRole === 'student' && participants.studentId) {
          fromOtherForSound = String(senderIdVal) !== String(participants.studentId);
        }
      }
      if (fromOtherForSound && settings.messageSounds) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 880;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
          o.start();
          o.stop(ctx.currentTime + 0.12);
        } catch {}
      }

      // Desktop notifications
      let fromOtherForNotify = String(senderIdVal) !== String(me);
      if (fromOtherForNotify) {
        if (userRole === 'psychiatrist' && participants.psychiatristId) {
          fromOtherForNotify = String(senderIdVal) !== String(participants.psychiatristId);
        } else if (userRole === 'student' && participants.studentId) {
          fromOtherForNotify = String(senderIdVal) !== String(participants.studentId);
        }
      }
      if (fromOtherForNotify && settings.desktopNotifications && document.hidden && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          const name = recipientInfo?.name || 'New message';
          new Notification(name, { body: message.content || 'New message', silent: !settings.messageSounds });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }

      setTimeout(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const threshold = 40;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
        const apptId = activeAppointmentId || appointmentId;
        let fromOther = String(senderIdVal) !== String(me);
        if (fromOther) {
          if (userRole === 'psychiatrist' && participants.psychiatristId) {
            fromOther = String(senderIdVal) !== String(participants.psychiatristId);
          } else if (userRole === 'student' && participants.studentId) {
            fromOther = String(senderIdVal) !== String(participants.studentId);
          }
        }
        if (atBottom) {
          scrollToBottom();
        }
        if (fromOther) {
          // Update last seen to now when receiving from the other user
          setLastSeen(new Date());
        }
        if (!atBottom && fromOther) {
          setUnreadCount((c) => c + 1);
          setFirstUnreadIndex((idx) => (idx == null ? indexBefore : idx));
          if (apptId) {
            try {
              const key = `chat.unread.${apptId}`;
              const curr = parseInt(localStorage.getItem(key) || '0', 10) || 0;
              localStorage.setItem(key, String(curr + 1));
            } catch {}
          }
        }
      }, 100);
    });

    // Typing indicators
    socketRef.current.on('userTyping', ({ userId: typingUserIdRemote, isTyping: typing }) => {
      const me = myId || userIdLS;
      if (typingUserIdRemote !== me) {
        setIsTyping(typing);
      }
    });

    // Last seen updates
    socketRef.current.on('userLastSeen', ({ userId: seenUserId, timestamp }) => {
      const me = myId || userIdLS;
      if (seenUserId !== me) {
        setLastSeen(new Date(timestamp));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchMessages, appointmentId, myId, userIdLS]);

  // Scroll to bottom when messages change (only if user is at bottom)
useEffect(() => {
  if (isAtBottom) {
    setTimeout(scrollToBottom, 50);
  }
}, [messages, isAtBottom]);

// Load existing unread count for this appointment on mount/change
useEffect(() => {
  const apptId = activeAppointmentId || appointmentId;
  if (!apptId) return;
  try {
    const val = parseInt(localStorage.getItem(`chat.unread.${apptId}`) || '0', 10) || 0;
    setUnreadCount(val);
  } catch {}
}, [activeAppointmentId, appointmentId]);

// Fetch my account id for reliable own-message detection
useEffect(() => {
  (async () => {
    try {
      const me = await api.get('/api/auth/me');
      const id = me.data?._id || me.data?.user?._id;
      if (id) setMyId(String(id));
      const name = me.data?.username || me.data?.user?.username;
      if (name) localStorage.setItem('username', name);
    } catch {}
  })();
}, []);

// Load stored chat settings
useEffect(() => {
  try {
    const stored = JSON.parse(localStorage.getItem('chat.settings') || '{}');
    setSettings((s) => ({ ...s, ...stored }));
  } catch {}
}, []);

// Apply dark mode if toggled (optional)
useEffect(() => {
  if (settings.darkMode === true) {
    document.documentElement.classList.add('dark-theme');
  } else if (settings.darkMode === false) {
    document.documentElement.classList.remove('dark-theme');
  }
}, [settings.darkMode]);
  

  // Handle typing indicator
  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (socketRef.current && appointmentId) {
      const me = myId || userIdLS;
      socketRef.current.emit('typing', { appointmentId, userId: me, isTyping: value.length > 0 });
      
      // Clear typing indicator after user stops typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        const me = myId || userIdLS;
        socketRef.current.emit('typing', { appointmentId, userId: me, isTyping: false });
      }, 1000);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle file attachment
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    
    files.forEach(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not allowed.`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Upload file to server
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.fileUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const actuallySend = async (moderatedText) => {
    setSending(true);
    setError('');
    setUploading(attachments.length > 0);

    try {
      let messageData = {
        content: moderatedText.trim(),
        senderId: myId || userIdLS,
        appointmentId: appointmentId || '',
        attachments: []
      };

      // Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            const fileUrl = await uploadFile(file);
            messageData.attachments.push({
              name: file.name,
              url: fileUrl,
              type: file.type,
              size: file.size
            });
          } catch (uploadError) {
            console.error('Failed to upload file:', file.name, uploadError);
            // Continue with other files
          }
        }
      }

      if (!appointmentId) {
        if (userRole === 'psychiatrist') {
          const appointments = await api.get('/api/appointments/my-appointments');
          const activeAppointment = appointments.data.find(a => a.userId.toString() === recipientId && a.status === 'approved');
          messageData.appointmentId = activeAppointment ? activeAppointment._id : '';
        } else if (userRole === 'student') {
          const appointmentResponse = await api.get('/api/appointments/my-appointment');
          messageData.appointmentId = appointmentResponse.data?._id || '';
          messageData.recipientId = appointmentResponse.data?.psychiatristId?._id || appointmentResponse.data?.psychiatristId || recipientId;
        }
      }

      if (userRole === 'psychiatrist' && appointmentId) {
        const appointmentResponse = await api.get(`/api/appointments/${appointmentId}`);
        messageData.recipientId = appointmentResponse.data.userId?._id || appointmentResponse.data.userId;
      } else if (userRole === 'student' && appointmentId) {
        const appointmentResponse = await api.get(`/api/appointments/${appointmentId}`);
        messageData.recipientId = appointmentResponse.data.psychiatristId?._id || appointmentResponse.data.psychiatristId;
      } else if (!messageData.recipientId) {
        messageData.recipientId = recipientId;
      }

      if (!messageData.appointmentId) {
        setError('No valid appointment found. Please ensure an approved appointment exists.');
        return;
      }

      // Clear typing indicator
      if (socketRef.current) {
        const me = myId || userIdLS;
        socketRef.current.emit('typing', { appointmentId, userId: me, isTyping: false });
      }

      const response = await api.post('/api/messages', messageData);

      const message = response.data;
      setMessages((prevMessages) => [...prevMessages, message]);
      try {
        const apptId = activeAppointmentId || appointmentId || message.appointmentId;
        if (apptId) localStorage.setItem(`chat.last.${apptId}`, JSON.stringify({ content: message.content || '', timestamp: message.timestamp || Date.now() }));
      } catch {}

      if (socketRef.current) {
        socketRef.current.emit('sendMessage', message);
      }

      setNewMessage('');
      setAttachments([]); // Clear attachments after sending
    } catch (err) {
      setError('Failed to send message: ' + (err.response?.data?.error || err.message));
      console.error('Error details:', err.response?.data);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Client-side moderation (basic masking)
    const banned = ['fuck','shit','bitch','asshole'];
    const mask = (txt) => txt.replace(new RegExp(banned.join('|'),'gi'), (m)=>'*'.repeat(m.length));
    const moderated = mask(newMessage || '');

    if (!moderated.trim() && attachments.length === 0) return;

    if (!recipientId && userRole === 'student' && !appointmentId) {
      setError('Please ensure an appointment is active.');
      return;
    }

    await actuallySend(moderated.trim());
  };

  useEffect(() => {
    const fetchRecipient = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await api.get('/api/appointments/my-appointment');
        console.log('Fetch recipient response:', response.data);
        if (response.data) {
          setRecipientId(response.data.psychiatristId?._id || response.data.psychiatristId);
          setError(''); // Clear error if successful
        } else {
          setError('No active appointment found.');
        }
      } catch (err) {
        setError('Failed to fetch appointment: ' + (err.response?.data?.error || err.message));
      }
    };
    if (userRole === 'student' && !appointmentId) fetchRecipient();
  }, [userRole, appointmentId]);

  // Format timestamp for messages
  const formatMessageTime = (timestamp) => {
    const now = new Date();
    const msgTime = new Date(timestamp);
    const diffMs = now - msgTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return msgTime.toLocaleDateString();
  };

  const formatExactTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };


  const notify = (message, type='info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  };

  const handleGoHome = () => {
    // Navigate to appropriate home based on user role
    if (userRole === 'psychiatrist') {
      window.location.href = '/psychiatrist-dashboard';
    } else {
      window.location.href = '/';
    }
  };

const doClearChat = () => {
    setMessages([]);
    localStorage.removeItem(`chat-messages-${appointmentId || 'default'}`);
  };

  const handleClearChat = () => {
    setConfirm({
      open: true,
      title: 'Clear chat history?',
      message: 'Are you sure you want to clear all messages? This action cannot be undone.',
      onConfirm: () => { setConfirm(c => ({ ...c, open: false })); doClearChat(); },
    });
  };

  const handleExportChat = () => {
    const me = myId || userIdLS;
    const chatData = messages.map(msg => {
      const senderIdVal = typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId?._id || msg.senderId);
      return ({
        sender: String(senderIdVal) === String(me) ? 'You' : (recipientInfo?.name || 'Other'),
        content: msg.content,
        timestamp: formatMessageTime(msg.timestamp)
      });
    });
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCloseChat = () => {
    if (window.confirm('Are you sure you want to close this chat?')) {
      // Navigate to appropriate dashboard based on user role
      if (userRole === 'psychiatrist') {
        window.location.href = '/psychiatrist-chats';
      } else {
        window.location.href = '/contact-psychiatrist';
      }
    }
  };

  return (
    <div className={`modern-chat-container ${chatSize}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="recipient-avatar">
            <i className={`bi bi-person-${recipientInfo?.role === 'Psychiatrist' ? 'hearts' : 'circle'}`}></i>
          </div>
          <div className="recipient-details">
            <h3 className="recipient-name">
              {recipientInfo?.name || 'Loading...'}
              {/* Inline indicators for pinned/muted */}
              {(() => { try { const id = activeAppointmentId || appointmentId; const pinned = JSON.parse(localStorage.getItem('chat.pinned')||'{}')[id]; const muted = JSON.parse(localStorage.getItem('chat.muted')||'{}')[id]; return (
                <>
                  {pinned ? <i className="bi bi-pin-angle-fill ms-2" title="Pinned"></i> : null}
                  {muted ? <i className="bi bi-bell-slash-fill ms-1" title="Muted"></i> : null}
                </>
              ); } catch { return null; } })()}
            </h3>
            <div className="recipient-status">
              {connectionStatus === 'connected' ? (
                <>
                  <span className={`status-indicator ${connectionStatus}`}></span>
                  <span className="status-text">
                    {lastSeen ? `Last seen ${formatMessageTime(lastSeen)}` : 'Online'}
                  </span>
                </>
              ) : (
                <>
                  <span className="status-indicator disconnected"></span>
                  <span className="status-text">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className={`chat-actions ${showActions ? 'actions-open' : ''}`}>
          <button
            className={`btn-icon actions-toggle ${showActions ? 'open' : ''}`}
            title={showActions ? 'Hide actions' : 'Show actions'}
            onClick={() => setShowActions(v => !v)}
          >
            <i className={`bi ${showActions ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
          </button>

          <div className="actions-group">
            {/* Size controls (overlay) */}
            {inOverlay && (
              <div className="size-controls" role="group" aria-label="Chat size controls">
                <button
                  type="button"
                  className={`size-btn ${chatSize === 'small' ? 'active' : ''}`}
                  title="Compact height"
                  onClick={() => setChatSize('small')}
                >
                  S
                </button>
                <button
                  type="button"
                  className={`size-btn ${chatSize === 'medium' ? 'active' : ''}`}
                  title="Comfortable height"
                  onClick={() => setChatSize('medium')}
                >
                  M
                </button>
                <button
                  type="button"
                  className={`size-btn ${chatSize === 'large' ? 'active' : ''}`}
                  title="Expanded height"
                  onClick={() => setChatSize('large')}
                >
                  L
                </button>
              </div>
            )}

            {/* Settings */}
            <button
              className="btn-icon"
              title="Chat settings"
              onClick={() => setSettingsOpen(true)}
            >
              <i className="bi bi-gear"></i>
            </button>

            {/* Header actions (inline, now toggled) */}
            {(() => {
              const apptId = activeAppointmentId || appointmentId;
              const readMap = (k)=>{ try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch{return {}} };
              const writeMap = (k,map)=>{ try{ localStorage.setItem(k, JSON.stringify(map)); }catch{} };
              const isPinned = !!readMap('chat.pinned')[apptId];
              const isMuted = !!readMap('chat.muted')[apptId];
              const isArchived = !!readMap('chat.archived')[apptId];
              return (
                <>
                  <button className="btn-icon" title="Mark all as read" onClick={() => {
                    setUnreadCount(0);
                    setFirstUnreadIndex(null);
                    try { if (apptId) localStorage.setItem(`chat.unread.${apptId}`, '0'); } catch {}
                    notify('Marked as read');
                  }}>
                    <i className="bi bi-check2-all"></i>
                  </button>

                  <button className="btn-icon" title={isPinned ? 'Unpin conversation' : 'Pin conversation'} onClick={() => {
                    const map = readMap('chat.pinned'); map[apptId] = !isPinned; writeMap('chat.pinned', map); try { window.dispatchEvent(new Event('chatPrefsChanged')); } catch {} ; notify(isPinned ? 'Unpinned' : 'Pinned');
                  }}>
                    <i className={`bi ${isPinned? 'bi-pin-angle-fill':'bi-pin-angle'}`}></i>
                  </button>

                  <button className="btn-icon" title={isMuted ? 'Unmute conversation' : 'Mute conversation'} onClick={() => {
                    const map = readMap('chat.muted'); map[apptId] = !isMuted; writeMap('chat.muted', map); try { window.dispatchEvent(new Event('chatPrefsChanged')); } catch {} ; notify(isMuted ? 'Unmuted' : 'Muted');
                  }}>
                    <i className={`bi ${isMuted? 'bi-bell-slash-fill':'bi-bell-slash'}`}></i>
                  </button>

                  <button className="btn-icon" title={isArchived ? 'Unarchive' : 'Archive'} onClick={() => {
                    const map = readMap('chat.archived'); map[apptId] = !isArchived; writeMap('chat.archived', map); try { window.dispatchEvent(new Event('chatPrefsChanged')); } catch {}; notify(isArchived ? 'Unarchived' : 'Archived');
                  }}>
                    <i className={`bi ${isArchived? 'bi-archive-fill':'bi-archive'}`}></i>
                  </button>

                  {userRole === 'psychiatrist' && participants.studentId && (
                    <button className="btn-icon" title="Block student" onClick={() => {
                      setConfirm({
                        open: true,
                        title: 'Block student?',
                        message: 'They will no longer be able to contact you in any chat.',
                        onConfirm: async () => {
                          setConfirm(c => ({ ...c, open:false }));
                          try { await api.post(`/api/auth/block/${participants.studentId}`); notify('Student blocked','success'); } catch(err){ notify(err.response?.data?.error || 'Failed to block','error'); }
                        }
                      });
                    }}>
                      <i className="bi bi-slash-circle"></i>
                    </button>
                  )}

                  <button className="btn-icon" title="Close appointment" onClick={() => {
                    const id = activeAppointmentId || appointmentId;
                    if (!id) return;
                    setConfirm({
                      open: true,
                      title: 'Close appointment?',
                      message: 'You will no longer be able to send messages in this thread.',
                      onConfirm: async () => {
                        setConfirm(c => ({ ...c, open:false }));
                        try { await api.post(`/api/appointments/${id}/close`); notify('Appointment closed','success'); } catch(err){ notify(err.response?.data?.error || 'Failed to close','error'); }
                      }
                    });
                  }}>
                    <i className="bi bi-door-closed"></i>
                  </button>

                  <button className="btn-icon" title="Clear chat" onClick={handleClearChat}>
                    <i className="bi bi-trash"></i>
                  </button>

                  <button className="btn-icon" title="Export chat" onClick={handleExportChat}>
                    <i className="bi bi-download"></i>
                  </button>

                  <button className="btn-icon" title="Go Home" onClick={handleGoHome}>
                    <i className="bi bi-house"></i>
                  </button>

                  <button className="btn-icon" title="Close chat view" onClick={handleCloseChat}>
                    <i className="bi bi-x-circle"></i>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="chat-error">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Messages Container */}
      <div 
        className="chat-messages" 
        id="messages-container"
        ref={messagesContainerRef}
        onScroll={checkIsAtBottom}
      >
        {loading ? (
          <div className="chat-loading">
            <div className="loading-skeleton">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-message">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">
              <i className="bi bi-chat-dots"></i>
            </div>
            <h4>Start the conversation</h4>
            <p>Send a message to begin your secure conversation with {recipientInfo?.name || 'your psychiatrist'}.</p>
          </div>
        ) : (
          <div className="messages-list" role="list">
            {messages.map((msg, index) => {
              const senderIdVal = typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId?._id || msg.senderId);
              const meId = myId || userIdLS || '';
              let isOwnMessage = String(senderIdVal) === String(meId);
              if (!isOwnMessage) {
                // Fallback to participant IDs if sender equals appointment participant
                if (userRole === 'psychiatrist' && participants.psychiatristId) {
                  isOwnMessage = String(senderIdVal) === String(participants.psychiatristId);
                } else if (userRole === 'student' && participants.studentId) {
                  isOwnMessage = String(senderIdVal) === String(participants.studentId);
                }
              }
              const senderRole = isOwnMessage ? (userRole === 'student' ? 'student' : 'psychiatrist')
                                              : (userRole === 'student' ? 'psychiatrist' : 'student');
              const prevSenderIdVal = index > 0 ? (typeof messages[index - 1].senderId === 'string' ? messages[index - 1].senderId : (messages[index - 1].senderId?._id || messages[index - 1].senderId)) : null;
              const showAvatar = index === 0 || String(prevSenderIdVal) !== String(senderIdVal);

              const prevDate = index > 0 ? new Date(messages[index - 1].timestamp) : null;
              const currDate = new Date(msg.timestamp);
              const changedDay = !prevDate || prevDate.toDateString() !== currDate.toDateString();
              const isToday = new Date().toDateString() === currDate.toDateString();
              const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
              const isYesterday = yesterday.toDateString() === currDate.toDateString();
              const dayLabel = isToday ? 'Today' : (isYesterday ? 'Yesterday' : currDate.toLocaleDateString(undefined, { weekday: 'short', month:'short', day:'numeric' }));

              const localUsername = localStorage.getItem('username') || '';
              const displayName = isOwnMessage
                ? (userRole === 'psychiatrist' ? (localUsername ? `Dr. ${localUsername}` : 'Dr. Psychiatrist') : (localUsername || 'You'))
                : (userRole === 'student' ? (recipientInfo?.name || 'Dr. Psychiatrist') : (recipientInfo?.name || 'Student'));

              return (
                <React.Fragment key={msg._id}>
                  {changedDay && (
                    <div className="date-separator">
                      <span>{dayLabel}</span>
                    </div>
                  )}
                  {firstUnreadIndex !== null && index === firstUnreadIndex && (
                    <div className="new-message-divider">
                      <span>New messages</span>
                    </div>
                  )}
                  <div className={`message-wrapper ${isOwnMessage ? 'own' : 'other'}`}>
                    {showAvatar && !isOwnMessage && (
                      <div className="message-avatar">
                        <i className={`bi bi-person-${senderRole === 'psychiatrist' ? 'hearts' : 'circle'}`}></i>
                      </div>
                    )}
                    <div className={`message-bubble role-${senderRole}`} title={formatExactTime(msg.timestamp)}>
                      <div className="message-content">
                        {msg.content}

                        {/* Show attachments if present */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="message-attachments">
                            {msg.attachments.map((attachment, attIndex) => (
                              <div key={attIndex} className="message-attachment">
                                {attachment.type?.startsWith('image/') ? (
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="attachment-preview"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  />
                                ) : (
                                  <div className="attachment-icon">
                                    <i className={`bi bi-${
                                      attachment.type?.includes('pdf') ? 'file-pdf' :
                                      attachment.type?.includes('word') ? 'file-word' :
                                      'file-text'
                                    }`}></i>
                                  </div>
                                )}
                                <div className="attachment-info-msg">
                                  <div className="attachment-name-msg">{attachment.name}</div>
                                  <div className="attachment-size-msg">
                                    {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'File'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="bubble-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {settings.readReceipts && isOwnMessage && (
                        <span className="bubble-check" aria-label="Delivered">✓✓</span>
                      )}
                    </div>
                    {showAvatar && isOwnMessage && (
                      <div className="message-avatar own">
                        <i className="bi bi-person-circle"></i>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="message-wrapper other">
                <div className="message-avatar">
                  <i className={`bi bi-person-${recipientInfo?.role === 'Psychiatrist' ? 'hearts' : 'circle'}`}></i>
                </div>
                <div className="typing-indicator">
                  <div className="typing-text">
                    {(recipientInfo?.name || 'User')} is typing...
                  </div>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />

            {/* Jump to latest button when scrolled up */}
            {!isAtBottom && (
              <button 
                type="button"
                className="jump-to-latest"
                onClick={scrollToBottom}
                title="Jump to latest"
              >
                {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Jump to latest'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="attachments-preview">
          <div className="attachments-header">
            <span>Attachments ({attachments.length})</span>
          </div>
          <div className="attachments-list">
            {attachments.map((file, index) => (
              <div key={index} className="attachment-item">
                <div className="attachment-info">
                  <i className={`bi bi-${
                    file.type.startsWith('image/') ? 'image' :
                    file.type.includes('pdf') ? 'file-pdf' :
                    file.type.includes('word') ? 'file-word' :
                    'file-text'
                  }`}></i>
                  <div className="attachment-details">
                    <span className="attachment-name">{file.name}</span>
                    <span className="attachment-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-attachment"
                  onClick={() => removeAttachment(index)}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="chat-input-container">
        {uploading && (
          <div className="upload-progress">
            <div className="upload-indicator">
              <div className="spinner-border spinner-border-sm me-2"></div>
              <span>Uploading files...</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <div className="input-wrapper">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
            />
            <button 
              type="button" 
              className="btn-attachment" 
              title="Attach file"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="bi bi-paperclip"></i>
            </button>
            
            <div className="message-input-wrapper">
              <textarea
                className="message-input"
                placeholder={`Message ${recipientInfo?.name || ''}...`}
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => {
                  if (settings.enterToSend) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  } else {
                    // Enter inserts newline; Ctrl/Cmd+Enter sends
                    if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }
                }}
                disabled={sending || uploading}
                rows="1"
                style={{ resize: 'none', overflow: 'hidden' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            
            <button 
              type="button" 
              className="btn-emoji" 
              title="Add emoji"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <i className="bi bi-emoji-smile"></i>
            </button>
            
            <button 
              type="submit" 
              className={`btn-send ${(newMessage.trim() || attachments.length > 0) ? 'active' : ''}`}
              disabled={(!newMessage.trim() && attachments.length === 0) || sending || uploading}
              title="Send message"
            >
              {sending || uploading ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">
                    {uploading ? 'Uploading...' : 'Sending...'}
                  </span>
                </div>
              ) : (
                <i className="bi bi-send-fill"></i>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Emoji Picker */}
      <EmojiPicker 
        isOpen={showEmojiPicker} 
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
      />

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText="Yes, clear"
        cancelText="Go back"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />

      <ChatSettingsDrawer 
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={(updated)=>{
          setSettings(updated);
          localStorage.setItem('chat.settings', JSON.stringify(updated));
        }}
      />

      {toast && (
        <div className={`toast-notice ${toast.type || 'info'}`}>
          {toast.message}
        </div>
      )}

    </div>
  );
}

export default Messaging;
