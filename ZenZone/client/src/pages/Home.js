import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AIChatbotSupport from '../components/AIChatbotSupport';
import MoodTracker from '../components/MoodTracker';
import ResourceLibrary from '../components/ResourceLibrary';

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    
    setIsAuthenticated(!!token);
    setUserRole(role || 'guest');
    setUserName(username || 'User');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUserRole('guest');
    setUserName('');
    window.location.href = '/login';
  };

  const handleLearnMore = () => {
    navigate('/learn-more');
  };

  const handleGetHelp = () => {
    setShowChatbot(true);
  };

  const handlePersonalizedCare = () => {
    navigate('/personalized-assessment');
  };

  const features = [
    {
      icon: '💬',
      title: 'Secure Messaging',
      description: 'Connect privately with mental health professionals through our encrypted messaging system.',
      link: userRole === 'psychiatrist' ? '/psychiatrist-chats' : '/messaging',
      buttonText: 'Start Messaging',
      available: isAuthenticated
    },
    {
      icon: '📅',
      title: userRole === 'psychiatrist' ? 'Manage Appointments' : 'Contact Psychiatrist',
      description: userRole === 'psychiatrist' 
        ? 'View and manage your appointment requests from students.' 
        : 'Schedule an appointment with your college psychiatrist.',
      link: userRole === 'psychiatrist' ? '/psychiatrist-dashboard' : '/contact-psychiatrist',
      buttonText: userRole === 'psychiatrist' ? 'Manage Now' : 'Contact Now',
      available: userRole !== 'psychiatrist' || isAuthenticated
    },
    {
      icon: '🤝',
      title: 'Join the Community',
      description: 'Register to access our supportive community and share experiences anonymously.',
      link: '/register',
      buttonText: 'Get Started',
      available: !isAuthenticated
    },
    {
      icon: '📘',
      title: 'Learn More',
      description: 'How ZenZone protects your privacy, how AI support works, and where to find trusted resources.',
      handler: handleLearnMore,
      buttonText: 'Learn More',
      available: true,
      isClickable: true
    },
    {
      icon: '⚡',
      title: '24/7 Support',
      description: 'Access mental health resources and crisis support whenever you need it.',
      handler: handleGetHelp,
      buttonText: 'Get Help',
      available: userRole !== 'psychiatrist', // Hide from psychiatrists
      isClickable: true
    },
    {
      icon: '🎯',
      title: 'Personalized Care',
      description: 'Receive tailored mental health support based on your specific needs and goals.',
      handler: handlePersonalizedCare,
      buttonText: 'Explore',
      available: userRole !== 'psychiatrist', // Hide from psychiatrists
      isClickable: true
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6">
              <div className="hero-content">
                {isAuthenticated ? (
                  <div className="welcome-back">
                    <p className="welcome-text">Welcome back,</p>
                    <h1 className="hero-title text-gradient">
                      {userName}! 👋
                    </h1>
                    <p className="hero-subtitle">
                      {userRole === 'psychiatrist' 
                        ? 'Ready to help students on their mental health journey?' 
                        : 'How are you feeling today? We\'re here to support you.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="brand-header mb-4">
                      <div className="zen-logo-home">
                        <div className="zen-icon-wrapper">
                          <i className="bi bi-yin-yang zen-icon"></i>
                        </div>
                        <h1 className="brand-name-home">ZenZone</h1>
                      </div>
                      <div className="brand-badges">
                        <span className="badge badge-premium">
                          <i className="bi bi-star-fill"></i> Premium Wellness
                        </span>
                        <span className="badge badge-ai">
                          <i className="bi bi-robot"></i> AI-Powered
                        </span>
                        <span className="badge badge-24-7">
                          <i className="bi bi-clock"></i> 24/7 Support
                        </span>
                      </div>
                    </div>
                    <h2 className="hero-title">
                      Your Wellness <span className="text-gradient">Sanctuary</span>
                    </h2>
                    <p className="hero-subtitle">
                      A safe, confidential space for college students to connect with mental health professionals, 
                      find resources, and build a supportive community in your personal ZenZone.
                    </p>
                  </div>
                )}
                
                <div className="hero-buttons">
                  {!isAuthenticated ? (
                    <>
                      <Link to="/register" className="btn btn-primary btn-lg me-3">
                        Get Started Today
                      </Link>
                      <Link to="/login" className="btn btn-outline-primary btn-lg">
                        Sign In
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to={userRole === 'psychiatrist' ? '/psychiatrist-dashboard' : '/messaging'} 
                        className="btn btn-primary btn-lg me-3"
                      >
                        {userRole === 'psychiatrist' ? 'View Dashboard' : 'Start Messaging'}
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="btn btn-outline-danger btn-lg"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-illustration">
                <div className="illustration-card glass-card">
                  <div className="illustration-content">
                    <div className="stat-item">
                      <span className="stat-number">24/7</span>
                      <span className="stat-label">Support Available</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">100%</span>
                      <span className="stat-label">Confidential</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">∞</span>
                      <span className="stat-label">Compassion</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title">
              {isAuthenticated ? 'Your ZenZone Wellness Journey' : 'How We Support You'}
            </h2>
            <p className="section-subtitle">
              {isAuthenticated 
                ? 'Access all the tools and resources you need for your wellbeing.'
                : 'Discover the comprehensive support system designed specifically for students.'}
            </p>
          </div>
          
          <div className="row">
            {features.filter(feature => feature.available).map((feature, index) => (
              <div key={index} className="col-lg-4 col-md-6 mb-4">
                <div className="feature-card card h-100">
                  <div className="card-body text-center">
                    <div className="feature-icon">
                      {feature.icon}
                    </div>
                    <h5 className="card-title">{feature.title}</h5>
                    <p className="card-text">{feature.description}</p>
                    {feature.link && (
                      <Link to={feature.link} className="btn btn-outline-primary">
                        {feature.buttonText}
                      </Link>
                    )}
                    {feature.handler && feature.isClickable && (
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={feature.handler}
                      >
                        {feature.buttonText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mood Tracker for Authenticated Users */}
      {isAuthenticated && userRole === 'student' && (
        <section className="mood-tracker-section py-5">
          <div className="container">
            <MoodTracker />
          </div>
        </section>
      )}

      {/* Resource Library for All Users */}
      <section className="resource-library-section py-5">
        <div className="container">
          <ResourceLibrary />
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section py-5">
          <div className="container">
            <div className="cta-card glass-card text-center">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <h3 className="cta-title text-white">Ready to prioritize your mental health?</h3>
                  <p className="cta-text text-white opacity-90">
                    Join thousands of students who have found support, guidance, and healing through our platform.
                  </p>
                </div>
                <div className="col-lg-4">
                  <Link to="/register" className="btn btn-light btn-lg">
                    Start Your Journey
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AI Chatbot */}
      <AIChatbotSupport 
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
      />
    </div>
  );
}

export default Home;
