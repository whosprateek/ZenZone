import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIChatbotSupport.css';

const AIChatbotSupport = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userEmotion, setUserEmotion] = useState('neutral');
  const [conversationContext, setConversationContext] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [quickReplies, setQuickReplies] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [lastTopics, setLastTopics] = useState([]);
  const [responseCount, setResponseCount] = useState(0);
  const [showBookingOption, setShowBookingOption] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [chatSize, setChatSize] = useState('medium'); // small, medium, large
  const [isResizing, setIsResizing] = useState(false);
  const [stats, setStats] = useState({ sentiments: {}, intents: {}, emotions: {} });
  const [sentimentTimeline, setSentimentTimeline] = useState([]);
  const [aiEngine, setAiEngine] = useState({ provider: 'unknown', model: null });
  const messagesEndRef = useRef(null);

  // Initialize chatbot when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  // Prime AI engine info from server health when opened
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { data } = await api.get('/api/ai-chat/health');
        const provider = data?.ok ? 'huggingface' : 'local';
        const model = data?.model || null;
        setAiEngine({ provider, model });
      } catch (_) {
        setAiEngine({ provider: 'local', model: null });
      }
    })();
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: `Hello! I'm ZenZone AI, your 24/7 mental wellness companion. 🧘‍♀️ I'm here to listen, provide resources, and help you find your inner peace on your mental health journey.

✨ **Welcome to your personal ZenZone:**
• Safe, confidential conversations
• Personalized wellness support  
• Crisis intervention when needed
• 24/7 availability

How are you feeling today? Remember, this is your sanctuary - everything we discuss is completely private and secure.`,
      timestamp: new Date(),
      sentiment: 'neutral',
      supportive: true
    };

    setMessages([welcomeMessage]);
  };

// AI API call for generating responses via backend (protects your API key)
  const callAI = async (userMessage) => {
    try {
      const payload = {
        message: userMessage,
        history: messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }))
      };
      const { data } = await api.post('/api/ai-chat', payload);
      const text = data?.response || getFallbackResponse(userMessage);
      const provider = data?.provider || 'local';
      const model = data?.model || null;
      setAiEngine({ provider, model });
      return { text, provider, model };
    } catch (error) {
      console.error('AI API Error:', error);
      const text = getFallbackResponse(userMessage);
      setAiEngine({ provider: 'local', model: null });
      return { text, provider: 'local', model: null };
    }
  };

  // Sentiment analysis
  const analyzeSentiment = async (text) => {
    try {
      const { data } = await api.post('/api/sentiment', { text });
      return data;
    } catch (err) {
      console.warn('Sentiment API failed, using fallback:', err?.message || err);
      const message = text.toLowerCase();
      const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm', 'overdose'];
      const emergencyDetected = crisisKeywords.some(keyword => message.includes(keyword));
      const negativeKeywords = ['depressed', 'anxious', 'sad', 'hopeless', 'worthless', 'alone'];
      const negativeDetected = negativeKeywords.some(keyword => message.includes(keyword));
      const positiveKeywords = ['happy', 'good', 'better', 'grateful', 'excited', 'hopeful'];
      const positiveDetected = positiveKeywords.some(keyword => message.includes(keyword));
      return {
        sentiment: emergencyDetected ? 'concerning' : negativeDetected ? 'negative' : positiveDetected ? 'positive' : 'neutral',
        crisis_level: emergencyDetected ? 'emergency' : negativeDetected ? 'medium' : 'low',
        emergency_keywords_detected: emergencyDetected,
        supportive_response_needed: negativeDetected || emergencyDetected
      };
    }
  };

  // Advanced Natural Language Processing for better understanding
  const analyzeUserIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(/\W+/).filter(word => word.length > 0);
    
    // Enhanced keyword analysis with synonyms and context
    const intentCategories = {
      crisis: {
        keywords: ['suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm', 'overdose', 'dying', 'death', 'cannot go on', 'give up', 'hopeless'],
        weight: 10
      },
      anxiety: {
        keywords: ['anxious', 'anxiety', 'worry', 'worried', 'panic', 'nervous', 'fear', 'afraid', 'scared', 'overwhelm', 'racing thoughts', 'restless', 'on edge', 'tense', 'butterflies'],
        weight: 8
      },
      depression: {
        keywords: ['depressed', 'depression', 'sad', 'sadness', 'down', 'low', 'empty', 'numb', 'hopeless', 'worthless', 'useless', 'dark', 'heavy', 'crying', 'tearful', 'miserable'],
        weight: 8
      },
      stress: {
        keywords: ['stress', 'stressed', 'pressure', 'overwhelmed', 'burden', 'too much', 'breaking point', 'exhausted', 'burned out', 'cant handle', 'struggling'],
        weight: 7
      },
      sleep: {
        keywords: ['sleep', 'sleeping', 'insomnia', 'tired', 'exhausted', 'fatigue', 'cant sleep', 'nightmares', 'restless', 'waking up', 'sleep problems'],
        weight: 6
      },
      relationships: {
        keywords: ['relationship', 'partner', 'family', 'friends', 'lonely', 'isolation', 'breakup', 'conflict', 'argument', 'social', 'connection', 'dating', 'marriage', 'divorce'],
        weight: 6
      },
      academic: {
        keywords: ['school', 'college', 'university', 'work', 'job', 'exam', 'test', 'study', 'grade', 'assignment', 'deadline', 'performance', 'career', 'boss', 'colleague'],
        weight: 5
      },
      positive: {
        keywords: ['better', 'good', 'great', 'thank', 'thanks', 'helpful', 'appreciate', 'grateful', 'improving', 'progress', 'working', 'successful'],
        weight: 3
      },
      greeting: {
        keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'whats up'],
        weight: 2
      },
      help: {
        keywords: ['help', 'support', 'advice', 'guidance', 'assistance', 'what should i do', 'need help', 'can you help'],
        weight: 4
      }
    };
    
    // Calculate intent scores
    let intentScores = {};
    
    Object.keys(intentCategories).forEach(intent => {
      let score = 0;
      intentCategories[intent].keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
          score += intentCategories[intent].weight;
          // Boost score if keyword appears multiple times or in phrases
          const occurrences = (lowerMessage.match(new RegExp(keyword, 'g')) || []).length;
          score += (occurrences - 1) * 2;
        }
      });
      if (score > 0) {
        intentScores[intent] = score;
      }
    });
    
    return intentScores;
  };
  
  // Enhanced emotional context detection
  const detectEmotionalContext = (message, history) => {
    const emotionalMarkers = {
      intensity: {
        high: ['very', 'extremely', 'incredibly', 'really', 'so', 'too', 'completely', 'totally', 'absolutely'],
        moderate: ['somewhat', 'fairly', 'pretty', 'quite', 'rather'],
        low: ['a little', 'slightly', 'kind of', 'sort of']
      },
      urgency: {
        immediate: ['right now', 'immediately', 'urgent', 'emergency', 'crisis', 'help me'],
        soon: ['today', 'tonight', 'this week', 'need to'],
        general: ['sometimes', 'often', 'usually', 'lately']
      },
      duration: {
        chronic: ['months', 'years', 'long time', 'always', 'forever', 'since'],
        recent: ['today', 'yesterday', 'this week', 'recently', 'lately', 'just started'],
        episodic: ['sometimes', 'occasionally', 'comes and goes', 'episodes']
      }
    };
    
    let context = {
      intensity: 'moderate',
      urgency: 'general',
      duration: 'recent',
      recurring: false
    };
    
    const lowerMessage = message.toLowerCase();
    
    // Check for intensity markers
    if (emotionalMarkers.intensity.high.some(marker => lowerMessage.includes(marker))) {
      context.intensity = 'high';
    } else if (emotionalMarkers.intensity.low.some(marker => lowerMessage.includes(marker))) {
      context.intensity = 'low';
    }
    
    // Check for urgency markers
    if (emotionalMarkers.urgency.immediate.some(marker => lowerMessage.includes(marker))) {
      context.urgency = 'immediate';
    } else if (emotionalMarkers.urgency.soon.some(marker => lowerMessage.includes(marker))) {
      context.urgency = 'soon';
    }
    
    // Check for duration markers
    if (emotionalMarkers.duration.chronic.some(marker => lowerMessage.includes(marker))) {
      context.duration = 'chronic';
    } else if (emotionalMarkers.duration.episodic.some(marker => lowerMessage.includes(marker))) {
      context.duration = 'episodic';
    }
    
    // Check for recurring issues in history
    if (history && history.length > 0) {
      const historyText = history.join(' ').toLowerCase();
      const currentTopics = Object.keys(analyzeUserIntent(message));
      context.recurring = currentTopics.some(topic => historyText.includes(topic));
    }
    
    return context;
  };
  
  // Intelligent conversation engine with context awareness
  const getFallbackResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    const messageHistory = conversationHistory.map(h => h.content.toLowerCase()).join(' ');
    
    // Update conversation history
    setConversationHistory(prev => [
      ...prev.slice(-4), // Keep last 4 messages for context
      { role: 'user', content: userMessage, timestamp: Date.now() }
    ]);
    
    // Increment response count and show booking option after 3+ exchanges
    setResponseCount(prev => prev + 1);
    if (responseCount >= 2) {
      setShowBookingOption(true);
    }
    
    // Advanced intent analysis
    const intentScores = analyzeUserIntent(userMessage);
    const emotionalContext = detectEmotionalContext(userMessage, conversationHistory.map(h => h.content));
    const topIntent = Object.keys(intentScores).reduce((a, b) => intentScores[a] > intentScores[b] ? a : b, '');

    // Update stats for intents
    if (topIntent) {
      setStats(prev => ({
        ...prev,
        intents: { ...prev.intents, [topIntent]: (prev.intents[topIntent] || 0) + 1 }
      }));
    }
    
    // Crisis responses (highest priority)
    if (intentScores.crisis && intentScores.crisis > 0) {
      return getCrisisResponse();
    }
    
    // Route to appropriate response based on top intent and emotional context
    switch (topIntent) {
      case 'greeting':
        return getGreetingResponse();
      case 'anxiety':
        return getAnxietyResponse(userMessage, messageHistory, emotionalContext);
      case 'depression':
        return getDepressionResponse(userMessage, messageHistory, emotionalContext);
      case 'stress':
        return getStressResponse(userMessage, emotionalContext);
      case 'sleep':
        return getSleepResponse(userMessage, emotionalContext);
      case 'relationships':
        return getRelationshipResponse(userMessage, emotionalContext);
      case 'academic':
        return getAcademicResponse(userMessage, emotionalContext);
      case 'positive':
        return getPositiveResponse(userMessage, emotionalContext);
      case 'help':
        return getHelpResponse(userMessage, messageHistory, emotionalContext);
      default:
        return getContextualResponse(userMessage, messageHistory, emotionalContext, intentScores);
    }
  };
  
  const isGreeting = (message) => {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
  };
  
  const getCrisisResponse = () => {
    return `I'm very concerned about what you've shared with me. Your life has value and there are people who want to help you right now.

🚨 **Immediate Help Available:**
• **Crisis Text Line:** Text HOME to 741741
• **National Suicide Prevention Lifeline:** 988
• **Emergency Services:** 911

Please reach out to one of these resources immediately. You don't have to go through this alone.`;
  };
  
  const getGreetingResponse = () => {
    const responses = [
      "Hello! I'm glad you reached out today. How are you feeling right now?",
      "Hi there! It's good to see you. What's been on your mind lately?",
      "Hey! I'm here and ready to listen. What would you like to talk about?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  const getAnxietyResponse = (message, history) => {
    if (history.includes('anxiety') || history.includes('anxious')) {
      return `I can see anxiety has been a recurring challenge for you. Let's try a different approach this time:

🎯 **Progressive Muscle Relaxation:**
1. Tense your shoulders for 5 seconds, then release
2. Tense your arms for 5 seconds, then release
3. Notice the difference between tension and relaxation

This can help break the physical cycle of anxiety. How does your body feel right now when you think about what's worrying you?`;
    }
    
    return `I understand you're feeling anxious. Anxiety can feel overwhelming, but there are techniques that can help:

🌟 **Try this breathing technique:**
• Breathe in slowly for 4 counts
• Hold your breath for 7 counts
• Exhale slowly for 8 counts
• Repeat 3-4 times

What specific situation or thought is triggering your anxiety right now?`;
  };
  
  const getDepressionResponse = (message, history) => {
    if (history.includes('depressed') || history.includes('sad')) {
      return `I hear that you're still struggling with these heavy feelings. That takes a lot of strength to keep sharing with me.

💪 **Small victories matter:**
• You reached out again today - that's huge
• You're being honest about your feelings - that's brave
• You're looking for ways to feel better - that's hopeful

What's one tiny thing that felt even slightly okay today? It could be as simple as a warm drink or a moment of quiet.`;
    }
    
    return `Thank you for trusting me with how you're feeling. Depression can make everything feel heavy and difficult, but your feelings are completely valid.

🌱 **Gentle steps that might help:**
• Step outside for just 2 minutes if possible
• Name one thing you're grateful for, however small
• Be kind to yourself - treat yourself like a good friend would

What has your day been like today? I'm here to listen without any judgment.`;
  };
  
  const getStressResponse = (message) => {
    return `Feeling overwhelmed and stressed is exhausting. Let's break this down into smaller, manageable pieces.

⚡ **Quick stress relief:**
1. **5-4-3-2-1 Grounding:** Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste
2. **Release tension:** Shake your hands and arms for 10 seconds
3. **Reset breath:** Take 3 deep, slow breaths

What's the biggest source of stress for you right now? Sometimes naming it helps reduce its power.`;
  };
  
  const getSleepResponse = (message) => {
    return `Sleep troubles can make everything else feel harder. You're not alone in struggling with this.

🌙 **Sleep hygiene tips:**
• No screens 1 hour before bed
• Keep your room cool and dark
• Try the '4-7-8' breathing technique in bed
• If you can't sleep after 20 minutes, get up and do a quiet activity

What's your typical bedtime routine like? Are there specific thoughts that keep you awake?`;
  };
  
  const getRelationshipResponse = (message) => {
    return `Relationships can be one of our greatest sources of joy and also our greatest challenges. It sounds like you're dealing with something difficult.

💝 **Remember:**
• Healthy relationships involve mutual respect and understanding
• It's okay to set boundaries to protect your wellbeing
• You deserve to be treated with kindness
• Sometimes relationships change, and that's okay

What's been happening in your relationships that's been weighing on you?`;
  };
  
  const getAcademicResponse = (message) => {
    return `Academic and work pressure can feel overwhelming, especially when it feels like so much depends on your performance.

📚 **Managing academic stress:**
• Break large tasks into smaller, specific steps
• Set realistic daily goals rather than trying to do everything
• Remember that grades don't define your worth as a person
• Take regular breaks - your brain needs rest to function well

What specific academic challenges are you facing right now? Let's problem-solve together.`;
  };
  
  const getPositiveResponse = (message) => {
    return `I'm so glad to hear that you're feeling a bit better! That's wonderful progress, and you should be proud of yourself.

✨ **Building on positive moments:**
• What specifically helped you feel better?
• How can we do more of what's working?
• Remember this feeling for the next difficult moment

Progress isn't always linear, so be patient and kind with yourself. What's been the most helpful part of our conversation so far?`;
  };
  
  const getHelpResponse = (message, history) => {
    if (history.includes('help')) {
      return `I can see you're actively looking for help and support - that shows real strength and wisdom.

🎯 **Let's get specific:**
• What type of help do you feel you need most right now?
• Have you considered talking to a counselor or therapist?
• Are there trusted friends or family members you could reach out to?
• What barriers are preventing you from getting the help you need?

I'm here to support you in finding the right resources for your situation.`;
    }
    
    return `I'm glad you're reaching out for help - that takes real courage and shows you care about your wellbeing.

🤝 **Ways I can support you:**
• Listen without judgment to whatever you're going through
• Share coping strategies and mental health techniques
• Help you identify when professional support might be beneficial
• Provide crisis resources if you're in immediate danger

What kind of help feels most important to you right now?`;
  };
  
  const getContextualResponse = (message, history) => {
    const responses = [
      `I hear you, and I want you to understand that whatever you're going through, your feelings are completely valid. 

Sometimes it helps to talk about what's been the hardest part of your day today. What's been weighing on your mind the most?`,
      
      `Thank you for sharing with me. I can sense that you're dealing with something challenging right now.

Every person's experience is unique, and I'm here to listen to yours without any judgment. What's been going through your mind that brought you here today?`,
      
      `I appreciate you taking the time to reach out. It shows strength to look for support when you need it.

What's been the most difficult thing for you lately? Sometimes putting our struggles into words can help us understand them better.`,
      
      `I'm here with you right now, and I want you to know that you're not alone in whatever you're facing.

Would it help to talk about what's been causing you stress or worry recently? I'm listening and I care about what you're going through.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Analyze sentiment (server-side)
      const sentimentAnalysis = await analyzeSentiment(inputMessage);
      
      // Check for emergency
      if (sentimentAnalysis.emergency_keywords_detected) {
        setEmergencyDetected(true);
      }

      // Get AI response
      const { text: aiText } = await callAI(inputMessage);

      // Add bot response
        const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: aiText,
        timestamp: new Date(),
        sentiment: sentimentAnalysis.sentiment,
        crisis_level: sentimentAnalysis.crisis_level,
        supportive: sentimentAnalysis.supportive_response_needed,
        emotions: sentimentAnalysis.emotions || {},
        top_emotions: sentimentAnalysis.top_emotions || []
      };

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, botMessage]);
        // Update sentiment stats and timeline using botMessage.sentiment (which reflects the user's message sentiment)
        setStats(prev => ({
          ...prev,
          sentiments: { ...prev.sentiments, [botMessage.sentiment]: (prev.sentiments[botMessage.sentiment] || 0) + 1 },
          emotions: (botMessage.top_emotions || []).reduce((acc, e) => ({
            ...acc,
            [e]: (prev.emotions?.[e] || 0) + 1,
          }), prev.emotions || {})
        }));
        setSentimentTimeline(prev => [...prev, botMessage.sentiment]);
      }, 1500);

    } catch (error) {
      console.error('Error in chat:', error);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          content: 'I apologize, but I\'m having trouble responding right now. Please know that your feelings are valid and if you\'re in crisis, please reach out to emergency services (911) or the Crisis Text Line (text HOME to 741741).',
          timestamp: new Date(),
          sentiment: 'neutral'
        }]);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chatbot-overlay">
      <div className={`ai-chatbot-container ${chatSize}`}>
        {/* Header */}
        <div className="ai-chatbot-header">
          <div className="ai-bot-info">
            <div className="ai-bot-avatar">
              <i className="bi bi-robot"></i>
            </div>
            <div className="ai-bot-details">
              <div className="zen-branding">
                <h3>ZenZone AI</h3>
                <span className="zen-badge">
                  <i className="bi bi-yin-yang"></i>
                  Wellness Assistant
                </span>
              </div>
              <div className="ai-status">
                <span className="status-indicator online"></span>
                <span>Available 24/7</span>
              </div>
            </div>
          </div>
          <div className="header-controls">
            <div className="size-controls">
              <button 
                className={`size-btn ${chatSize === 'small' ? 'active' : ''}`}
                onClick={() => setChatSize('small')}
                title="Small"
              >
                <i className="bi bi-dash-square"></i>
              </button>
              <button 
                className={`size-btn ${chatSize === 'medium' ? 'active' : ''}`}
                onClick={() => setChatSize('medium')}
                title="Medium"
              >
                <i className="bi bi-square"></i>
              </button>
              <button 
                className={`size-btn ${chatSize === 'large' ? 'active' : ''}`}
                onClick={() => setChatSize('large')}
                title="Large"
              >
                <i className="bi bi-plus-square"></i>
              </button>
            </div>
            <button className="btn-close-chatbot" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Emergency Alert */}
        {emergencyDetected && (
          <div className="emergency-alert">
            <div className="emergency-content">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <div>
                <strong>Crisis Support Available</strong>
                <p>If you're in immediate danger, call 911 or go to your nearest emergency room.</p>
                <div className="crisis-resources">
                  <a href="tel:988" className="crisis-link">
                    <i className="bi bi-telephone-fill"></i>
                    988 - Suicide & Crisis Lifeline
                  </a>
                  <span className="crisis-text">Text HOME to 741741 - Crisis Text Line</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {/* Engine banner */}
        {aiEngine.provider === 'local' && (
          <div className="ai-engine-banner" style={{background:'#fff3cd', border:'1px solid #ffeeba', color:'#856404', padding:'8px 12px', fontSize:12}}>
            Using local supportive replies (model provider unavailable). Your message is still received.
          </div>
        )}

        <div className="ai-chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`ai-message ${message.type}`}>
              {message.type === 'bot' && (
                <div className="ai-message-avatar">
                  <i className="bi bi-robot"></i>
                </div>
              )}
              <div className="ai-message-content">
                <div className={`ai-message-bubble ${message.crisis_level === 'emergency' ? 'crisis' : ''}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
                <div className="ai-message-time">
                  {formatTime(message.timestamp)}
                  {message.type === 'bot' && message.sentiment && (
                    <span className={`sentiment-indicator ${message.sentiment}`}>
                      {message.sentiment === 'concerning' && <i className="bi bi-exclamation-circle"></i>}
                      {message.sentiment === 'negative' && <i className="bi bi-emoji-frown"></i>}
                      {message.sentiment === 'positive' && <i className="bi bi-emoji-smile"></i>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="ai-message bot">
              <div className="ai-message-avatar">
                <i className="bi bi-robot"></i>
              </div>
              <div className="ai-message-content">
                <div className="ai-typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">ZenZone AI is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Appointment Booking Option */}
        {showBookingOption && (
          <div className="appointment-suggestion">
            <div className="appointment-content">
              <div className="appointment-icon">
                <i className="bi bi-calendar-plus"></i>
              </div>
              <div className="appointment-text">
                <h4>Would you like to speak with a professional?</h4>
                <p>Based on our conversation, speaking with a licensed therapist might be helpful for you.</p>
              </div>
              <div className="appointment-actions">
                <button 
                  className="btn btn-primary appointment-btn"
                  onClick={() => {
                    // In a real app, this would open a booking system
                    setMessages(prev => [...prev, {
                      id: Date.now(),
                      type: 'bot',
                      content: `Great! Here are some options for professional support:

🏥 **Local Resources:**
• University Counseling Center: (555) 123-4567
• Community Mental Health: (555) 234-5678
• Crisis Counseling Services: (555) 345-6789

💻 **Online Therapy Platforms:**
• BetterHelp: betterhelp.com
• Talkspace: talkspace.com
• Psychology Today: psychologytoday.com/us

📱 **Insurance Coverage:**
Check with your insurance provider for covered mental health services in your area.

Would you like help finding resources specific to your location or insurance?`,
                      timestamp: new Date(),
                      sentiment: 'positive'
                    }]);
                    setShowBookingOption(false);
                  }}
                >
                  Find a Therapist
                </button>
                <button 
                  className="btn btn-outline-secondary appointment-dismiss"
                  onClick={() => setShowBookingOption(false)}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Toggle */}
        <div className="quick-actions-toggle">
          <button 
            className="toggle-quick-actions"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <i className={`bi ${showQuickActions ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
            <span>Support Tools</span>
            <span className="badge">{showQuickActions ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* Quick Action Buttons */}
        {showQuickActions && (
          <div className="quick-actions">
            <button
            className="quick-action-btn breathing"
            onClick={() => {
              setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                content: `Let's do a quick breathing exercise together:

🫁 **4-7-8 Breathing Technique:**
1. Breathe in through your nose for 4 counts
2. Hold your breath for 7 counts  
3. Exhale completely through your mouth for 8 counts
4. Repeat 3-4 times

Ready? Let's start:
• Inhale... 1, 2, 3, 4
• Hold... 1, 2, 3, 4, 5, 6, 7
• Exhale... 1, 2, 3, 4, 5, 6, 7, 8

How do you feel after trying that?`,
                timestamp: new Date(),
                sentiment: 'neutral'
              }]);
            }}
          >
            <i className="bi bi-lungs"></i>
            <span>Breathing Exercise</span>
          </button>
          <button 
            className="quick-action-btn grounding"
            onClick={() => {
              setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                content: `Let's try a grounding exercise to help you feel more centered:

🌍 **5-4-3-2-1 Grounding Technique:**
Look around you and name:

• **5 things you can SEE** (colors, objects, textures)
• **4 things you can TOUCH** (your chair, clothing, a surface)
• **3 things you can HEAR** (sounds around you right now)
• **2 things you can SMELL** (air freshener, coffee, etc.)
• **1 thing you can TASTE** (gum, drink, or just your mouth)

Take your time with each step. This helps bring your mind back to the present moment.

How did that feel for you?`,
                timestamp: new Date(),
                sentiment: 'neutral'
              }]);
            }}
          >
            <i className="bi bi-globe"></i>
            <span>Grounding</span>
          </button>
          <button 
            className="quick-action-btn resources"
            onClick={() => {
              setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                content: `Here are some helpful mental health resources:

🆘 **Crisis Support:**
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: 911

💬 **Talk to Someone:**
• SAMHSA National Helpline: 1-800-662-4357
• Crisis Chat: suicidepreventionlifeline.org/chat
• Teen Line: 1-800-852-8336

🧠 **Mental Health Apps:**
• Headspace (meditation)
• Calm (relaxation)
• Sanvello (mood tracking)
• Youper (AI mood tracking)

Would you like more specific resources for your situation?`,
                timestamp: new Date(),
                sentiment: 'neutral'
              }]);
            }}
          >
            <i className="bi bi-heart-pulse"></i>
            <span>Resources</span>
          </button>
          </div>
        )}

        {/* Input */}
        <div className="ai-chat-input">
          <div className="ai-input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind... I'm here to listen and help."
              className="ai-message-input"
              rows="1"
              disabled={isLoading}
              style={{ resize: 'none' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="ai-send-button"
            >
              {isLoading ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <i className="bi bi-send-fill"></i>
              )}
            </button>
          </div>
          <div className="ai-chat-disclaimer">
            <i className="bi bi-info-circle"></i>
            <span>This AI provides support but isn't a replacement for professional therapy. In emergencies, contact 911.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbotSupport;