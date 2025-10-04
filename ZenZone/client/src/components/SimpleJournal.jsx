import React, { useState, useEffect } from 'react';
import './SimpleJournal.css';

const SimpleJournal = ({ className = '' }) => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const moodOptions = [
    { value: 1, emoji: '😢', label: 'Very Sad', color: '#ef4444' },
    { value: 2, emoji: '😟', label: 'Sad', color: '#f97316' },
    { value: 3, emoji: '😔', label: 'Down', color: '#f59e0b' },
    { value: 4, emoji: '😐', label: 'Neutral', color: '#6b7280' },
    { value: 5, emoji: '🙂', label: 'Okay', color: '#84cc16' },
    { value: 6, emoji: '😊', label: 'Good', color: '#22c55e' },
    { value: 7, emoji: '😃', label: 'Happy', color: '#16a34a' },
    { value: 8, emoji: '😄', label: 'Very Happy', color: '#15803d' },
    { value: 9, emoji: '🤗', label: 'Joyful', color: '#166534' },
    { value: 10, emoji: '🥳', label: 'Ecstatic', color: '#14532d' }
  ];

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    // Mock data - replace with actual API call
    const mockEntries = [
      {
        id: 1,
        content: "Today was a challenging day with exams, but I managed to stay calm using the breathing exercises.",
        mood: 6,
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        sentiment: 'mixed',
        wordCount: 18
      },
      {
        id: 2,
        content: "Had a great therapy session today. Feeling more optimistic about handling stress.",
        mood: 8,
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        sentiment: 'positive',
        wordCount: 14
      }
    ];
    setEntries(mockEntries);
  };

  const handleSubmit = async () => {
    if (!newEntry.trim()) return;
    
    setIsSubmitting(true);
    try {
      const entry = {
        id: Date.now(),
        content: newEntry,
        mood: selectedMood,
        date: new Date().toISOString(),
        sentiment: analyzeSentiment(newEntry),
        wordCount: newEntry.trim().split(/\s+/).length
      };
      
      setEntries(prev => [entry, ...prev]);
      setNewEntry('');
      setSelectedMood(5);
      
      // Show success message
      setTimeout(() => {
        alert('Journal entry saved! 📝');
      }, 100);
      
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const analyzeSentiment = (text) => {
    const positiveWords = ['happy', 'good', 'great', 'amazing', 'wonderful', 'excellent', 'fantastic', 'love', 'joy', 'excited'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated', 'worried', 'anxious'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'mixed': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className={`simple-journal ${className}`}>
      {/* Header */}
      <div className="journal-header">
        <h3 className="journal-title">
          <i className="bi bi-journal-plus me-2"></i>
          Personal Journal
        </h3>
        <div className="journal-actions">
          <button 
            className={`btn btn-outline-primary btn-sm ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            <i className="bi bi-clock-history me-1"></i>
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
      </div>

      {/* New Entry Section */}
      <div className="journal-new-entry">
        <h5 className="entry-prompt">
          <i className="bi bi-pencil-square me-2"></i>
          How are you feeling? What's on your mind?
        </h5>
        
        {/* Mood Selector */}
        <div className="mood-selector">
          <label className="mood-label">Current Mood:</label>
          <div className="mood-options">
            {moodOptions.map((mood) => (
              <button
                key={mood.value}
                className={`mood-option ${selectedMood === mood.value ? 'selected' : ''}`}
                onClick={() => setSelectedMood(mood.value)}
                title={mood.label}
                style={{
                  borderColor: selectedMood === mood.value ? mood.color : 'transparent',
                  backgroundColor: selectedMood === mood.value ? `${mood.color}15` : 'transparent'
                }}
              >
                <span className="mood-emoji">{mood.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="entry-input-section">
          <textarea
            className="form-control entry-textarea"
            rows="6"
            placeholder="Write about your thoughts, feelings, experiences, or anything that's important to you today. This is your private space..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            maxLength={2000}
          />
          <div className="entry-meta">
            <span className="character-count">
              {newEntry.length}/2000 characters
            </span>
            <span className="word-count">
              {newEntry.trim() ? newEntry.trim().split(/\s+/).length : 0} words
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="entry-submit">
          <button
            className="btn btn-primary journal-submit-btn"
            onClick={handleSubmit}
            disabled={!newEntry.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Save Entry
              </>
            )}
          </button>
        </div>
      </div>

      {/* Journal History */}
      {showHistory && (
        <div className="journal-history">
          <div className="history-header">
            <h5>
              <i className="bi bi-journal-text me-2"></i>
              Your Journal Entries ({entries.length})
            </h5>
          </div>
          
          {entries.length === 0 ? (
            <div className="no-entries">
              <div className="no-entries-icon">
                <i className="bi bi-journal"></i>
              </div>
              <h6>No entries yet</h6>
              <p>Start journaling to track your thoughts and mood over time.</p>
            </div>
          ) : (
            <div className="entries-list">
              {entries.map((entry) => {
                const mood = moodOptions.find(m => m.value === entry.mood);
                return (
                  <div key={entry.id} className="journal-entry">
                    <div className="entry-header">
                      <div className="entry-date-mood">
                        <span className="entry-date">
                          <i className="bi bi-calendar3 me-1"></i>
                          {formatDate(entry.date)}
                        </span>
                        <span className="entry-mood">
                          <span className="mood-emoji">{mood.emoji}</span>
                          <span className="mood-label">{mood.label}</span>
                        </span>
                      </div>
                      <div 
                        className="sentiment-indicator"
                        style={{ backgroundColor: getSentimentColor(entry.sentiment) }}
                        title={`Sentiment: ${entry.sentiment}`}
                      ></div>
                    </div>
                    
                    <div className="entry-content">
                      <p>{entry.content}</p>
                    </div>
                    
                    <div className="entry-footer">
                      <span className="word-count">
                        <i className="bi bi-chat-square-text me-1"></i>
                        {entry.wordCount} words
                      </span>
                      <span className="sentiment-text">
                        <i className="bi bi-heart-pulse me-1"></i>
                        {entry.sentiment} tone
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Journal Tips */}
      <div className="journal-tips">
        <h6>
          <i className="bi bi-lightbulb me-2"></i>
          Journaling Benefits
        </h6>
        <div className="tips-list">
          <div className="tip-item">
            <i className="bi bi-check-circle"></i>
            <span>Reduces stress and anxiety</span>
          </div>
          <div className="tip-item">
            <i className="bi bi-check-circle"></i>
            <span>Improves mood and emotional awareness</span>
          </div>
          <div className="tip-item">
            <i className="bi bi-check-circle"></i>
            <span>Helps process thoughts and experiences</span>
          </div>
          <div className="tip-item">
            <i className="bi bi-check-circle"></i>
            <span>Tracks personal growth over time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleJournal;