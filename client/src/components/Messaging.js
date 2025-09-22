import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, socketBaseURL } from '../lib/api';
import { io } from 'socket.io-client';
import EmojiPicker from './EmojiPicker';
import ConfirmModal from './ConfirmModal.jsx';
import './Messaging.css';
import { generateDeterministicDisplayName } from '../utils/anonymity';

function Messaging({ appointmentId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastSeen, setLastSeen] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
const [chatSize, setChatSize] = useState('medium'); // small, medium, large
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Debug chat size changes
  useEffect(() => {
    console.log('Chat size changed to:', chatSize);
  }, [chatSize]);
  const userId = localStorage.getItem('userId');
  const socketRef = useRef();
  const userRole = localStorage.getItem('userRole');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      
      if (userRole === 'psychiatrist' && appointmentId) {
        // Fetch messages for specific appointment
        response = await api.get(`/api/messages/by-appointment/${appointmentId}`);
        
        // Fetch appointment details to get recipient info
        const appointmentResponse = await api.get(`/api/appointments/${appointmentId}`);
        const seed = appointmentResponse.data?.userId?._id || appointmentResponse.data?.userId;
        const anonName = generateDeterministicDisplayName(seed || 'student');
        recipientData = {
          name: anonName,
          role: 'Student',
          id: appointmentResponse.data.userId?._id || appointmentResponse.data.userId
        };
        
      } else if (userRole === 'student') {
        // Fetch messages for student
        response = await api.get('/api/messages');
        
        // Fetch psychiatrist info
        try {
          const appointmentResponse = await api.get('/api/appointments/my-appointment');
          if (appointmentResponse.data?.psychiatristId) {
            recipientData = {
              name: appointmentResponse.data.psychiatristId.username || 'Dr. Psychiatrist',
              role: 'Psychiatrist',
              id: appointmentResponse.data.psychiatristId._id || appointmentResponse.data.psychiatristId
            };
          }
        } catch (err) {
          console.log('Could not fetch psychiatrist info:', err.message);
        }
      }
      
      if (response) {
        setMessages(response.data);
        setRecipientInfo(recipientData);
        setTimeout(scrollToBottom, 100); // Scroll to bottom after messages load
      }
      
      setError(''); // Clear any previous errors
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
    });

    // Connection status handlers
    socketRef.current.on('connect', () => {
      setConnectionStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    // Join room for real-time messaging
    if (appointmentId && userId) {
      socketRef.current.emit('joinRoom', { appointmentId, userId });
    }

    // Message handlers
    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      setTimeout(scrollToBottom, 100);
    });

    // Typing indicators
    socketRef.current.on('userTyping', ({ userId: typingUserId, isTyping: typing }) => {
      if (typingUserId !== userId) {
        setIsTyping(typing);
      }
    });

    // Last seen updates
    socketRef.current.on('userLastSeen', ({ userId: seenUserId, timestamp }) => {
      if (seenUserId !== userId) {
        setLastSeen(new Date(timestamp));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchMessages, appointmentId, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdownMenu && !event.target.closest('.dropdown-menu-container')) {
        setShowDropdownMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdownMenu]);

  // Handle typing indicator
  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (socketRef.current && appointmentId) {
      socketRef.current.emit('typing', { appointmentId, userId, isTyping: value.length > 0 });
      
      // Clear typing indicator after user stops typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', { appointmentId, userId, isTyping: false });
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
        senderId: userId,
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
        messageData.recipientId = appointmentResponse.data.userId;
      } else if (!messageData.recipientId) {
        messageData.recipientId = recipientId;
      }

      if (!messageData.appointmentId) {
        setError('No valid appointment found. Please ensure an approved appointment exists.');
        return;
      }

      // Clear typing indicator
      if (socketRef.current) {
        socketRef.current.emit('typing', { appointmentId, userId, isTyping: false });
      }

      const response = await api.post('/api/messages', messageData);

      const message = response.data;
      setMessages((prevMessages) => [...prevMessages, message]);

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

  // Dropdown menu handlers
  useEffect(() => {
    // Close menu when clicking anywhere else
    const close = () => setShowDropdownMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleGoHome = () => {
    // Navigate to appropriate home based on user role
    if (userRole === 'psychiatrist') {
      window.location.href = '/psychiatrist-dashboard';
    } else {
      window.location.href = '/';
    }
    setShowDropdownMenu(false);
  };

const doClearChat = () => {
    setMessages([]);
    localStorage.removeItem(`chat-messages-${appointmentId || 'default'}`);
    setShowDropdownMenu(false);
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
    const chatData = messages.map(msg => ({
      sender: msg.senderId === userId ? 'You' : (recipientInfo?.name || 'Other'),
      content: msg.content,
      timestamp: formatMessageTime(msg.timestamp)
    }));
    
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
    setShowDropdownMenu(false);
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
    setShowDropdownMenu(false);
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
        <div className="chat-actions">
          {/* Size Controls */}
          <div className="size-controls">
            <button 
              className={`size-btn ${chatSize === 'small' ? 'active' : ''}`}
              onClick={() => setChatSize('small')}
              title="Small View"
            >
              <i className="bi bi-dash-square"></i>
            </button>
            <button 
              className={`size-btn ${chatSize === 'medium' ? 'active' : ''}`}
              onClick={() => setChatSize('medium')}
              title="Medium View"
            >
              <i className="bi bi-square"></i>
            </button>
            <button 
              className={`size-btn ${chatSize === 'large' ? 'active' : ''}`}
              onClick={() => setChatSize('large')}
              title="Large View"
            >
              <i className="bi bi-plus-square"></i>
            </button>
          </div>
          
          {/* Dropdown removed as requested */}
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
      <div className="chat-messages" id="messages-container">
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
          <div className="messages-list">
            {messages.map((msg, index) => {
              const isOwnMessage = msg.senderId === userId;
              const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
              const showTime = index === messages.length - 1 || 
                               messages[index + 1].senderId !== msg.senderId ||
                               (new Date(messages[index + 1].timestamp) - new Date(msg.timestamp)) > 300000; // 5 minutes
              
              return (
                <div key={msg._id} className={`message-wrapper ${isOwnMessage ? 'own' : 'other'}`}>
                  {showAvatar && !isOwnMessage && (
                    <div className="message-avatar">
                      <i className={`bi bi-person-${recipientInfo?.role === 'Psychiatrist' ? 'hearts' : 'circle'}`}></i>
                    </div>
                  )}
                  <div className="message-bubble">
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
                    {showTime && (
                      <div className="message-time">
                        {formatMessageTime(msg.timestamp)}
                      </div>
                    )}
                  </div>
                  {showAvatar && isOwnMessage && (
                    <div className="message-avatar own">
                      <i className="bi bi-person-circle"></i>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="message-wrapper other">
                <div className="message-avatar">
                  <i className={`bi bi-person-${recipientInfo?.role === 'Psychiatrist' ? 'hearts' : 'circle'}`}></i>
                </div>
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
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
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
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

    </div>
  );
}

export default Messaging;
