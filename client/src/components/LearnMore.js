import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIChatbotSupport from './AIChatbotSupport';
import './LearnMore.css';

const LearnMore = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [showChatbot, setShowChatbot] = useState(false);
  const navigate = useNavigate();

  const openSupport = () => setShowChatbot(true);
  const goAssessment = () => navigate('/personalized-assessment');
  const goAppointment = () => {
    const role = localStorage.getItem('userRole');
    if (role === 'psychiatrist') navigate('/psychiatrist-dashboard');
    else navigate('/contact-psychiatrist');
  };

  const sections = {
    overview: {
      title: 'Mental Health Overview',
      icon: 'bi-heart-pulse',
      content: (
        <div className="section-content">
          <h3>Understanding Mental Health</h3>
          <p>Mental health includes our emotional, psychological, and social well-being. It affects how we think, feel, and act. It also helps determine how we handle stress, relate to others, and make choices.</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">1 in 4</div>
              <div className="stat-label">People experience mental health issues</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">75%</div>
              <div className="stat-label">Of mental health conditions begin by age 24</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">90%</div>
              <div className="stat-label">Recovery rate with proper treatment</div>
            </div>
          </div>

          <div className="info-cards">
            <div className="info-card">
              <div className="card-icon">
                <i className="bi bi-brain"></i>
              </div>
              <h4>What is Mental Health?</h4>
              <p>Mental health is just as important as physical health. It's about having the resilience to cope with life's challenges and the ability to enjoy life.</p>
            </div>
            
            <div className="info-card">
              <div className="card-icon">
                <i className="bi bi-people"></i>
              </div>
              <h4>It's Common</h4>
              <p>Mental health issues are more common than you might think. You're not alone, and seeking help is a sign of strength, not weakness.</p>
            </div>
            
            <div className="info-card">
              <div className="card-icon">
                <i className="bi bi-arrow-up-circle"></i>
              </div>
              <h4>Recovery is Possible</h4>
              <p>With the right support and treatment, people can and do recover from mental health conditions and go on to live fulfilling lives.</p>
            </div>
          </div>
        </div>
      )
    },
    conditions: {
      title: 'Common Conditions',
      icon: 'bi-clipboard2-pulse',
      content: (
        <div className="section-content">
          <h3>Understanding Mental Health Conditions</h3>
          <p>Mental health conditions are medical conditions that affect mood, thinking, and behavior. Here are some common ones:</p>
          
          <div className="conditions-grid">
            <div className="condition-card">
              <div className="condition-header">
                <h4>Anxiety Disorders</h4>
                <span className="prevalence">18% of adults</span>
              </div>
              <p>Characterized by excessive worry, fear, or nervousness that interferes with daily activities.</p>
              <div className="symptoms">
                <strong>Symptoms:</strong>
                <ul>
                  <li>Persistent worry or fear</li>
                  <li>Physical symptoms (racing heart, sweating)</li>
                  <li>Avoidance of certain situations</li>
                  <li>Sleep difficulties</li>
                </ul>
              </div>
            </div>

            <div className="condition-card">
              <div className="condition-header">
                <h4>Depression</h4>
                <span className="prevalence">8% of adults</span>
              </div>
              <p>A mood disorder causing persistent feelings of sadness and loss of interest in activities.</p>
              <div className="symptoms">
                <strong>Symptoms:</strong>
                <ul>
                  <li>Persistent sadness or emptiness</li>
                  <li>Loss of interest in activities</li>
                  <li>Changes in appetite or sleep</li>
                  <li>Fatigue or low energy</li>
                </ul>
              </div>
            </div>

            <div className="condition-card">
              <div className="condition-header">
                <h4>Bipolar Disorder</h4>
                <span className="prevalence">2.8% of adults</span>
              </div>
              <p>Involves extreme mood swings including emotional highs (mania) and lows (depression).</p>
              <div className="symptoms">
                <strong>Symptoms:</strong>
                <ul>
                  <li>Mood swings from manic to depressive</li>
                  <li>Changes in energy and activity levels</li>
                  <li>Difficulty concentrating</li>
                  <li>Risky behavior during manic episodes</li>
                </ul>
              </div>
            </div>

            <div className="condition-card">
              <div className="condition-header">
                <h4>PTSD</h4>
                <span className="prevalence">3.5% of adults</span>
              </div>
              <p>Develops after experiencing or witnessing a traumatic event.</p>
              <div className="symptoms">
                <strong>Symptoms:</strong>
                <ul>
                  <li>Flashbacks or nightmares</li>
                  <li>Severe anxiety when reminded of trauma</li>
                  <li>Avoidance of trauma-related triggers</li>
                  <li>Changes in mood and thinking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    treatments: {
      title: 'Treatment Options',
      icon: 'bi-heart-pulse-fill',
      content: (
        <div className="section-content">
          <h3>Effective Treatment Approaches</h3>
          <p>Mental health conditions are treatable. Here are the main types of evidence-based treatments:</p>
          
          <div className="treatment-types">
            <div className="treatment-category">
              <h4><i className="bi bi-chat-dots"></i> Therapy & Counseling</h4>
              <div className="treatment-options">
                <div className="treatment-option">
                  <h5>Cognitive Behavioral Therapy (CBT)</h5>
                  <p>Helps identify and change negative thought patterns and behaviors. Highly effective for anxiety and depression.</p>
                </div>
                <div className="treatment-option">
                  <h5>Dialectical Behavior Therapy (DBT)</h5>
                  <p>Focuses on mindfulness and emotional regulation skills. Effective for borderline personality disorder and self-harm behaviors.</p>
                </div>
                <div className="treatment-option">
                  <h5>EMDR Therapy</h5>
                  <p>Eye Movement Desensitization and Reprocessing. Particularly effective for trauma and PTSD.</p>
                </div>
              </div>
            </div>

            <div className="treatment-category">
              <h4><i className="bi bi-capsule"></i> Medication</h4>
              <div className="treatment-options">
                <div className="treatment-option">
                  <h5>Antidepressants</h5>
                  <p>Help regulate mood by affecting neurotransmitters in the brain. Include SSRIs, SNRIs, and others.</p>
                </div>
                <div className="treatment-option">
                  <h5>Anti-anxiety Medications</h5>
                  <p>Provide short-term relief from severe anxiety symptoms. Usually used alongside therapy.</p>
                </div>
                <div className="treatment-option">
                  <h5>Mood Stabilizers</h5>
                  <p>Help manage mood swings in conditions like bipolar disorder.</p>
                </div>
              </div>
            </div>

            <div className="treatment-category">
              <h4><i className="bi bi-heart"></i> Lifestyle & Self-Care</h4>
              <div className="treatment-options">
                <div className="treatment-option">
                  <h5>Regular Exercise</h5>
                  <p>Physical activity releases endorphins and can be as effective as medication for mild to moderate depression.</p>
                </div>
                <div className="treatment-option">
                  <h5>Mindfulness & Meditation</h5>
                  <p>Helps manage stress, reduce anxiety, and improve emotional regulation.</p>
                </div>
                <div className="treatment-option">
                  <h5>Social Support</h5>
                  <p>Connecting with friends, family, and support groups is crucial for recovery.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="treatment-note">
            <i className="bi bi-info-circle"></i>
            <p><strong>Remember:</strong> Treatment is highly individual. What works best varies from person to person. A mental health professional can help determine the right approach for you.</p>
          </div>
        </div>
      )
    },
    resources: {
      title: 'Resources & Support',
      icon: 'bi-lifering',
      content: (
        <div className="section-content">
          <h3>Get Help and Support</h3>
          <p>There are many resources available to help you or someone you care about. You don't have to face mental health challenges alone.</p>
          
          <div className="crisis-section">
            <div className="crisis-banner">
              <i className="bi bi-exclamation-triangle"></i>
              <div>
                <h4>In Crisis? Get Help Now</h4>
                <p>If you're having thoughts of suicide or are in immediate danger, don't wait.</p>
              </div>
            </div>
            <div className="crisis-contacts">
              <div className="crisis-contact">
                <strong>988 Suicide & Crisis Lifeline</strong>
                <p>Call or text 988 - Available 24/7</p>
              </div>
              <div className="crisis-contact">
                <strong>Crisis Text Line</strong>
                <p>Text HOME to 741741</p>
              </div>
              <div className="crisis-contact">
                <strong>Emergency Services</strong>
                <p>Call 911 for immediate emergency help</p>
              </div>
            </div>
          </div>

          <div className="resources-grid">
            <div className="resource-category">
              <h4><i className="bi bi-telephone"></i> Helplines</h4>
              <div className="resource-list">
                <div className="resource-item">
                  <strong>NAMI Helpline:</strong> 1-800-950-NAMI (6264)
                  <p>Information, referrals, and support</p>
                </div>
                <div className="resource-item">
                  <strong>SAMHSA Helpline:</strong> 1-800-662-4357
                  <p>Treatment referral service</p>
                </div>
                <div className="resource-item">
                  <strong>Crisis Text Line:</strong> Text HOME to 741741
                  <p>Free, 24/7 crisis support via text</p>
                </div>
              </div>
            </div>

            <div className="resource-category">
              <h4><i className="bi bi-globe"></i> Online Resources</h4>
              <div className="resource-list">
                <div className="resource-item">
                  <strong>Mental Health America:</strong> mhanational.org
                  <p>Screening tools and educational resources</p>
                </div>
                <div className="resource-item">
                  <strong>NAMI (National Alliance on Mental Illness):</strong> nami.org
                  <p>Support groups and educational programs</p>
                </div>
                <div className="resource-item">
                  <strong>Psychology Today:</strong> psychologytoday.com
                  <p>Find therapists and support groups near you</p>
                </div>
              </div>
            </div>

            <div className="resource-category">
              <h4><i className="bi bi-people"></i> Support Groups</h4>
              <div className="resource-list">
                <div className="resource-item">
                  <strong>NAMI Support Groups</strong>
                  <p>Peer-led groups for individuals and families</p>
                </div>
                <div className="resource-item">
                  <strong>Depression and Bipolar Support Alliance</strong>
                  <p>Online and in-person support groups</p>
                </div>
                <div className="resource-item">
                  <strong>Anxiety and Depression Association of America</strong>
                  <p>Support groups and online resources</p>
                </div>
              </div>
            </div>

            <div className="resource-category">
              <h4><i className="bi bi-book"></i> Educational Materials</h4>
              <div className="resource-list">
                <div className="resource-item">
                  <strong>NIMH (National Institute of Mental Health)</strong>
                  <p>Research-based information on mental health conditions</p>
                </div>
                <div className="resource-item">
                  <strong>Mental Health First Aid</strong>
                  <p>Learn how to help someone experiencing a mental health crisis</p>
                </div>
                <div className="resource-item">
                  <strong>Heads Up by Headspace</strong>
                  <p>Mental health resources for young adults</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    selfcare: {
      title: 'Self-Care Tips',
      icon: 'bi-heart-fill',
      content: (
        <div className="section-content">
          <h3>Daily Mental Health Self-Care</h3>
          <p>Small daily actions can make a big difference in your mental health. Here are evidence-based self-care strategies:</p>
          
          <div className="selfcare-categories">
            <div className="selfcare-category">
              <div className="category-header">
                <i className="bi bi-moon-stars"></i>
                <h4>Sleep & Rest</h4>
              </div>
              <ul>
                <li>Aim for 7-9 hours of sleep per night</li>
                <li>Keep a consistent sleep schedule</li>
                <li>Create a relaxing bedtime routine</li>
                <li>Limit screen time before bed</li>
                <li>Take short naps (10-20 minutes) if needed</li>
              </ul>
            </div>

            <div className="selfcare-category">
              <div className="category-header">
                <i className="bi bi-activity"></i>
                <h4>Physical Activity</h4>
              </div>
              <ul>
                <li>Take a 10-minute walk daily</li>
                <li>Try yoga or stretching exercises</li>
                <li>Dance to your favorite music</li>
                <li>Use stairs instead of elevators</li>
                <li>Find activities you enjoy</li>
              </ul>
            </div>

            <div className="selfcare-category">
              <div className="category-header">
                <i className="bi bi-cup-hot"></i>
                <h4>Nutrition & Hydration</h4>
              </div>
              <ul>
                <li>Eat regular, balanced meals</li>
                <li>Stay hydrated throughout the day</li>
                <li>Limit alcohol and caffeine</li>
                <li>Include omega-3 rich foods</li>
                <li>Practice mindful eating</li>
              </ul>
            </div>

            <div className="selfcare-category">
              <div className="category-header">
                <i className="bi bi-people-fill"></i>
                <h4>Social Connection</h4>
              </div>
              <ul>
                <li>Reach out to friends and family</li>
                <li>Join clubs or community groups</li>
                <li>Volunteer for causes you care about</li>
                <li>Practice active listening</li>
                <li>Set healthy boundaries</li>
              </ul>
            </div>

            <div className="selfcare-category">
              <div className="category-header">
                <i className="bi bi-zen"></i>
                <h4>Stress Management</h4>
              </div>
              <ul>
                <li>Practice deep breathing exercises</li>
                <li>Try meditation or mindfulness</li>
                <li>Keep a gratitude journal</li>
                <li>Engage in hobbies you enjoy</li>
                <li>Learn to say "no" when needed</li>
              </ul>
            </div>

            <div className="selfcare-category">
              <div className="category-header">
                <i className="bi bi-lightbulb"></i>
                <h4>Mental Stimulation</h4>
              </div>
              <ul>
                <li>Read books or articles</li>
                <li>Learn a new skill or hobby</li>
                <li>Do puzzles or brain games</li>
                <li>Practice creative activities</li>
                <li>Limit negative news consumption</li>
              </ul>
            </div>
          </div>

          <div className="selfcare-reminder">
            <div className="reminder-content">
              <i className="bi bi-heart-pulse"></i>
              <div>
                <h4>Remember: Self-Care is Not Selfish</h4>
                <p>Taking care of your mental health is essential, not optional. Start small and be patient with yourself as you build healthy habits.</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="learn-more-container">
      {/* Header Section */}
      <div className="learn-more-header">
        <div className="header-content">
          <h1>Mental Health Education & Resources</h1>
          <p>Comprehensive information to help you understand mental health, recognize symptoms, and find the support you need.</p>
        </div>
        <div className="header-visual">
          <i className="bi bi-lightbulb"></i>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="learn-more-nav">
        <div className="nav-tabs">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              className={`nav-tab ${activeSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <i className={section.icon}></i>
              <span>{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="learn-more-content">
        {sections[activeSection].content}
      </div>

      {/* Call to Action */}
      <div className="learn-more-cta">
        <div className="cta-content">
          <h3>Ready to Take the Next Step?</h3>
          <p>If you're struggling with mental health challenges, remember that help is available and recovery is possible.</p>
          <div className="cta-buttons">
            <button className="btn-primary" onClick={openSupport}>
              <i className="bi bi-chat-dots"></i>
              Get 24/7 Support
            </button>
            <button className="btn-secondary" onClick={goAssessment}>
              <i className="bi bi-clipboard2-check"></i>
              Take Assessment
            </button>
            <button className="btn-outline" onClick={goAppointment}>
              <i className="bi bi-calendar-check"></i>
              Book Appointment
            </button>
          </div>
        </div>
      </div>
      <AIChatbotSupport isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  );
};

export default LearnMore;