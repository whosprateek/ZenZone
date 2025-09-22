import React, { useState } from 'react';
import './PrivacyNotice.css';

const PrivacyNotice = ({ isOpen, onAccept, onDecline, userRole }) => {
  const [selectedTab, setSelectedTab] = useState('anonymity');

  if (!isOpen) return null;

  const privacyFeatures = {
    anonymity: {
      title: 'Complete Anonymity',
      icon: 'bi-shield-lock',
      features: [
        'Your real name is never shared with psychiatrists',
        'Anonymous usernames like "BlueOcean47" protect your identity',
        'All conversations use encrypted anonymous IDs',
        'No personal information is stored or shared',
        'Your college affiliation helps match you with appropriate care'
      ]
    },
    messaging: {
      title: 'Secure Messaging',
      icon: 'bi-chat-dots-fill',
      features: [
        'End-to-end encryption for all conversations',
        'Messages are automatically anonymized',
        'No message history stored on external servers',
        'Psychiatrists see you as anonymous patient',
        'Private journaling with optional sharing'
      ]
    },
    data: {
      title: 'Data Protection',
      icon: 'bi-database-lock',
      features: [
        'Minimal data collection - only what\'s necessary for care',
        'Anonymous analytics help improve the app',
        'No selling or sharing of your data',
        'Right to delete all your data anytime',
        'HIPAA-compliant privacy standards'
      ]
    }
  };

  return (
    <div className="privacy-notice-overlay">
      <div className="privacy-notice-modal">
        {/* Header */}
        <div className="privacy-header">
          <div className="privacy-logo">
            <i className="bi bi-shield-check privacy-shield"></i>
            <h3>Your Privacy Matters</h3>
          </div>
          <p className="privacy-subtitle">
            ZenZone is designed with complete anonymity to protect your mental health privacy.
          </p>
        </div>

        {/* Privacy Tabs */}
        <div className="privacy-tabs">
          {Object.entries(privacyFeatures).map(([key, feature]) => (
            <button
              key={key}
              className={`privacy-tab ${selectedTab === key ? 'active' : ''}`}
              onClick={() => setSelectedTab(key)}
            >
              <i className={feature.icon}></i>
              <span>{feature.title}</span>
            </button>
          ))}
        </div>

        {/* Privacy Content */}
        <div className="privacy-content">
          <div className="privacy-feature">
            <div className="feature-header">
              <i className={privacyFeatures[selectedTab].icon}></i>
              <h4>{privacyFeatures[selectedTab].title}</h4>
            </div>
            
            <ul className="feature-list">
              {privacyFeatures[selectedTab].features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <i className="bi bi-check-circle feature-check"></i>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Student-specific anonymity notice */}
        {userRole === 'student' && (
          <div className="student-anonymity-notice">
            <div className="anonymity-card">
              <div className="anonymity-icon">
                <i className="bi bi-incognito"></i>
              </div>
              <div className="anonymity-content">
                <h5>You Are Completely Anonymous</h5>
                <p>
                  Psychiatrists will see you as <strong className="anonymous-example">"GentleButterfly247"</strong> 
                  or similar anonymous names. Your real identity is never revealed.
                </p>
                <div className="anonymity-benefits">
                  <span className="benefit-badge">
                    <i className="bi bi-shield"></i>
                    Safe to Share
                  </span>
                  <span className="benefit-badge">
                    <i className="bi bi-chat-heart"></i>
                    Open Communication
                  </span>
                  <span className="benefit-badge">
                    <i className="bi bi-lock"></i>
                    Private & Secure
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Psychiatrist notice */}
        {userRole === 'psychiatrist' && (
          <div className="psychiatrist-notice">
            <div className="professional-card">
              <div className="professional-icon">
                <i className="bi bi-person-badge"></i>
              </div>
              <div className="professional-content">
                <h5>Professional Privacy Standards</h5>
                <p>
                  All students appear with anonymous identities to protect their privacy. 
                  Focus on providing quality care while respecting their anonymity.
                </p>
                <div className="professional-guidelines">
                  <div className="guideline-item">
                    <i className="bi bi-check2"></i>
                    <span>Students appear as anonymous usernames</span>
                  </div>
                  <div className="guideline-item">
                    <i className="bi bi-check2"></i>
                    <span>No personal information is shared</span>
                  </div>
                  <div className="guideline-item">
                    <i className="bi bi-check2"></i>
                    <span>Focus on symptoms and support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Commitment */}
        <div className="privacy-commitment">
          <h5>
            <i className="bi bi-heart-fill commitment-heart"></i>
            Our Commitment to You
          </h5>
          <p>
            Mental health support should never compromise your privacy. ZenZone uses advanced 
            anonymization to ensure you can seek help without fear of judgment or exposure.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="privacy-actions">
          <button 
            className="btn btn-outline-secondary privacy-decline"
            onClick={onDecline}
          >
            <i className="bi bi-x-circle me-2"></i>
            I Don't Accept
          </button>
          <button 
            className="btn btn-primary privacy-accept"
            onClick={onAccept}
          >
            <i className="bi bi-shield-check me-2"></i>
            I Understand & Accept
          </button>
        </div>

        {/* Footer note */}
        <div className="privacy-footer">
          <p>
            <i className="bi bi-info-circle me-1"></i>
            You can review these privacy settings anytime in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyNotice;