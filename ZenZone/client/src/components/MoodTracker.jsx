import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { api } from '../lib/api';
import './MoodTracker.css';

const MoodTracker = ({ className = '' }) => {
  const [currentMood, setCurrentMood] = useState(5);
  const [moodNote, setMoodNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('😐');

  // Mood options with emojis and descriptions
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
    loadMoodHistory();
    // Update selected emoji when mood changes
    const selected = moodOptions.find(option => option.value === currentMood);
    if (selected) {
      setSelectedEmoji(selected.emoji);
    }
  }, [currentMood]);

  const loadMoodHistory = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockHistory = generateMockHistory();
      setMoodHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load mood history:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      history.push({
        id: i,
        mood: Math.floor(Math.random() * 10) + 1,
        note: i % 3 === 0 ? 'Feeling good after therapy session' : '',
        date: date.toISOString(),
        timestamp: date.getTime()
      });
    }
    
    return history;
  };

  const handleMoodSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      // Mock API call - replace with actual endpoint
      const newEntry = {
        id: Date.now(),
        mood: currentMood,
        note: moodNote,
        date: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      // Add to history
      setMoodHistory(prev => [...prev, newEntry]);
      
      // Reset form
      setMoodNote('');
      setCurrentMood(5);
      
      // Show success message
      setTimeout(() => {
        alert('Mood logged successfully! 🌟');
      }, 100);
      
    } catch (error) {
      console.error('Failed to submit mood:', error);
      alert('Failed to log mood. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMoodStats = () => {
    if (moodHistory.length === 0) return null;
    
    const last7Days = moodHistory.slice(-7);
    const last30Days = moodHistory.slice(-30);
    
    const average7 = last7Days.reduce((sum, entry) => sum + entry.mood, 0) / last7Days.length;
    const average30 = last30Days.reduce((sum, entry) => sum + entry.mood, 0) / last30Days.length;
    
    const trend = average7 > average30 ? 'improving' : average7 < average30 ? 'declining' : 'stable';
    
    return {
      average7: average7.toFixed(1),
      average30: average30.toFixed(1),
      trend,
      total: moodHistory.length
    };
  };

  const getChartData = () => {
    const last14Days = moodHistory.slice(-14);
    
    return {
      labels: last14Days.map(entry => 
        new Date(entry.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      ),
      datasets: [
        {
          label: 'Daily Mood',
          data: last14Days.map(entry => entry.mood),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: last14Days.map(entry => {
            const moodOption = moodOptions.find(opt => opt.value === entry.mood);
            return moodOption ? moodOption.color : '#6b7280';
          }),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const mood = context.raw;
            const moodOption = moodOptions.find(opt => opt.value === mood);
            return `${moodOption.emoji} ${moodOption.label} (${mood}/10)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
          callback: (value) => {
            const moodOption = moodOptions.find(opt => opt.value === value);
            return moodOption ? moodOption.emoji : value;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      }
    }
  };

  const stats = getMoodStats();

  return (
    <div className={`mood-tracker ${className}`}>
      {/* Header */}
      <div className="mood-tracker-header">
        <h3 className="mood-tracker-title">
          <i className="bi bi-emoji-smile me-2"></i>
          Daily Mood Check-in
        </h3>
        <div className="mood-tracker-actions">
          <button 
            className={`btn btn-outline-primary btn-sm ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            <i className="bi bi-graph-up me-1"></i>
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
      </div>

      {/* Today's Mood Input */}
      <div className="mood-input-section">
        <div className="mood-question">
          <h4>How are you feeling today?</h4>
          <p>Your mental wellbeing matters. Take a moment to check in with yourself.</p>
        </div>

        {/* Mood Scale */}
        <div className="mood-scale">
          <div className="mood-scale-header">
            <span className="selected-mood-display">
              <span className="selected-emoji">{selectedEmoji}</span>
              <span className="selected-label">
                {moodOptions.find(opt => opt.value === currentMood)?.label || 'Neutral'}
              </span>
            </span>
            <span className="mood-value">{currentMood}/10</span>
          </div>
          
          <div className="mood-slider-container">
            <input
              type="range"
              min="1"
              max="10"
              value={currentMood}
              onChange={(e) => setCurrentMood(parseInt(e.target.value))}
              className="mood-slider"
              style={{
                background: `linear-gradient(to right, ${moodOptions.find(opt => opt.value === currentMood)?.color || '#6b7280'} 0%, ${moodOptions.find(opt => opt.value === currentMood)?.color || '#6b7280'} ${(currentMood / 10) * 100}%, #e5e7eb ${(currentMood / 10) * 100}%, #e5e7eb 100%)`
              }}
            />
            
            <div className="mood-scale-labels">
              <span className="scale-label">😢 Very Sad</span>
              <span className="scale-label">😐 Neutral</span>
              <span className="scale-label">🥳 Ecstatic</span>
            </div>
          </div>
        </div>

        {/* Note Input */}
        <div className="mood-note-section">
          <label htmlFor="mood-note" className="form-label">
            <i className="bi bi-journal-text me-2"></i>
            Add a note (optional)
          </label>
          <textarea
            id="mood-note"
            className="form-control mood-note-input"
            rows="3"
            placeholder="What's influencing your mood today? Any thoughts or events you'd like to remember..."
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            maxLength={500}
          />
          <div className="character-count">
            {moodNote.length}/500 characters
          </div>
        </div>

        {/* Submit Button */}
        <div className="mood-submit-section">
          <button
            className="btn btn-primary mood-submit-btn"
            onClick={handleMoodSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Logging Mood...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Log My Mood
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mood Statistics */}
      {stats && (
        <div className="mood-stats-section">
          <h5 className="mood-stats-title">
            <i className="bi bi-bar-chart me-2"></i>
            Your Mood Insights
          </h5>
          
          <div className="mood-stats-grid">
            <div className="mood-stat-card">
              <div className="stat-icon">
                <i className="bi bi-calendar-week"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.average7}</div>
                <div className="stat-label">7-Day Average</div>
              </div>
            </div>
            
            <div className="mood-stat-card">
              <div className="stat-icon">
                <i className="bi bi-calendar-month"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.average30}</div>
                <div className="stat-label">30-Day Average</div>
              </div>
            </div>
            
            <div className="mood-stat-card">
              <div className="stat-icon">
                <i className={`bi ${stats.trend === 'improving' ? 'bi-trending-up' : stats.trend === 'declining' ? 'bi-trending-down' : 'bi-dash'}`}></i>
              </div>
              <div className="stat-info">
                <div className={`stat-value trend-${stats.trend}`}>
                  {stats.trend === 'improving' ? '📈' : stats.trend === 'declining' ? '📉' : '➡️'}
                </div>
                <div className="stat-label">Trend</div>
              </div>
            </div>
            
            <div className="mood-stat-card">
              <div className="stat-icon">
                <i className="bi bi-journal-check"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Entries</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood History Chart */}
      {showHistory && moodHistory.length > 0 && (
        <div className="mood-history-section">
          <div className="mood-history-header">
            <h5 className="mood-history-title">
              <i className="bi bi-graph-up-arrow me-2"></i>
              14-Day Mood Trend
            </h5>
          </div>
          
          <div className="mood-chart-container">
            {loading ? (
              <div className="mood-chart-loading">
                <div className="spinner-border text-primary"></div>
                <p>Loading mood history...</p>
              </div>
            ) : (
              <Line data={getChartData()} options={chartOptions} />
            )}
          </div>
          
          <div className="mood-history-tips">
            <div className="tip-card">
              <i className="bi bi-lightbulb-fill"></i>
              <div>
                <strong>Tip:</strong> Track your mood daily to identify patterns and triggers.
                Regular check-ins help you understand your emotional wellbeing better.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;