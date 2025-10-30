import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import './PersonalizedAssessment.css';
import '../zenzone-branding.css';

const PersonalizedAssessment = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [report, setReport] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [assessmentSize, setAssessmentSize] = useState('medium'); // small, medium, large
  const questionRef = useRef(null);

  // Mental Health Assessment Questions
  const assessmentQuestions = [
    {
      id: 'mood_general',
      category: 'General Mood',
      question: 'How would you describe your overall mood over the past two weeks?',
      type: 'scale',
      scale: {
        min: 1,
        max: 10,
        labels: {
          1: 'Very Poor',
          5: 'Neutral',
          10: 'Excellent'
        }
      },
      followUp: {
        condition: 'value <= 4',
        question: 'Can you tell us more about what has been contributing to these difficult feelings?'
      }
    },
    {
      id: 'anxiety_levels',
      category: 'Anxiety & Stress',
      question: 'Over the past two weeks, how often have you been bothered by feeling nervous, anxious, or on edge?',
      type: 'multiple_choice',
      options: [
        { value: 0, text: 'Not at all', severity: 'minimal' },
        { value: 1, text: 'Several days', severity: 'mild' },
        { value: 2, text: 'More than half the days', severity: 'moderate' },
        { value: 3, text: 'Nearly every day', severity: 'severe' }
      ]
    },
    {
      id: 'sleep_patterns',
      category: 'Sleep & Energy',
      question: 'How has your sleep been recently?',
      type: 'multiple_choice',
      options: [
        { value: 0, text: 'Sleeping well, feeling rested', severity: 'good' },
        { value: 1, text: 'Some difficulty falling asleep or staying asleep', severity: 'mild' },
        { value: 2, text: 'Frequent sleep problems affecting my day', severity: 'moderate' },
        { value: 3, text: 'Severe sleep issues, barely sleeping', severity: 'severe' }
      ]
    },
    {
      id: 'social_connection',
      category: 'Social & Relationships',
      question: 'How connected do you feel to friends, family, or your community?',
      type: 'scale',
      scale: {
        min: 1,
        max: 10,
        labels: {
          1: 'Very Isolated',
          5: 'Somewhat Connected',
          10: 'Very Connected'
        }
      }
    },
    {
      id: 'daily_functioning',
      category: 'Daily Life',
      question: 'How well are you able to manage your daily responsibilities (work, school, home)?',
      type: 'multiple_choice',
      options: [
        { value: 0, text: 'Managing everything well', severity: 'good' },
        { value: 1, text: 'Some challenges but getting by', severity: 'mild' },
        { value: 2, text: 'Struggling with several areas', severity: 'moderate' },
        { value: 3, text: 'Unable to manage most responsibilities', severity: 'severe' }
      ]
    },
    {
      id: 'coping_strategies',
      category: 'Coping & Support',
      question: 'What strategies do you currently use to cope with stress or difficult emotions?',
      type: 'text',
      placeholder: 'Please describe any coping methods, support systems, or activities that help you...'
    },
    {
      id: 'professional_help',
      category: 'Support History',
      question: 'Have you previously received professional mental health support?',
      type: 'multiple_choice',
      options: [
        { value: 'never', text: 'No, never' },
        { value: 'past', text: 'Yes, in the past' },
        { value: 'currently', text: 'Yes, I\'m currently receiving support' },
        { value: 'considering', text: 'No, but I\'m considering it' }
      ]
    },
    {
      id: 'goals_hopes',
      category: 'Goals & Aspirations',
      question: 'What are your main goals or hopes for your mental wellness journey?',
      type: 'text',
      placeholder: 'Share what you hope to achieve or improve in your mental health...'
    },
    {
      id: 'crisis_safety',
      category: 'Safety Assessment',
      question: 'In the past month, have you had thoughts of hurting yourself or ending your life?',
      type: 'multiple_choice',
      critical: true,
      options: [
        { value: 'never', text: 'Not at all', severity: 'safe' },
        { value: 'fleeting', text: 'Brief thoughts, but I would never act on them', severity: 'mild_concern' },
        { value: 'frequent', text: 'Yes, frequently', severity: 'moderate_concern' },
        { value: 'plans', text: 'Yes, and I have made plans', severity: 'high_risk' }
      ]
    }
  ];

  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  // Check if scrolling is needed
  useEffect(() => {
    const checkScrollable = () => {
      if (questionRef.current) {
        const isScrollable = questionRef.current.scrollHeight > questionRef.current.clientHeight;
        if (isScrollable) {
          questionRef.current.classList.add('scrollable');
        } else {
          questionRef.current.classList.remove('scrollable');
        }
      }
    };
    
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => window.removeEventListener('resize', checkScrollable);
  }, [currentStep, assessmentSize]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserProfile(response.data);
      }
    } catch (err) {
      console.log('Could not fetch user profile:', err.message);
    }
  };

  const handleResponse = (questionId, value, additionalData = {}) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        value,
        timestamp: new Date(),
        ...additionalData
      }
    }));
  };

  const handleNext = () => {
    const currentQuestion = assessmentQuestions[currentStep];
    
    // Check for crisis response
    if (currentQuestion.critical && responses[currentQuestion.id]?.value === 'plans') {
      // Immediate crisis intervention
      alert('Thank you for your honesty. Your safety is our priority. Please contact emergency services (911) or the Crisis Text Line (text HOME to 741741) immediately.');
      return;
    }

    if (currentStep < assessmentQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeAssessment = async () => {
    setLoading(true);
    try {
      // Generate AI-powered personalized report
      const reportData = await generatePersonalizedReport();
      setReport(reportData);
      setAssessmentComplete(true);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedReport = async () => {
    // Analyze responses and generate insights
    const analysisData = analyzeResponses();
    
    // This would typically make an AI API call for detailed analysis
    // For now, we'll use local analysis with structured insights
    return {
      timestamp: new Date(),
      overall_score: analysisData.overallScore,
      risk_level: analysisData.riskLevel,
      key_areas: analysisData.keyAreas,
      strengths: analysisData.strengths,
      recommendations: analysisData.recommendations,
      resources: analysisData.resources,
      follow_up_suggested: analysisData.followUpSuggested
    };
  };

  const analyzeResponses = () => {
    let totalScore = 0;
    let maxScore = 0;
    let riskFactors = [];
    let strengths = [];
    let keyAreas = [];

    // Analyze each response
    Object.entries(responses).forEach(([questionId, response]) => {
      const question = assessmentQuestions.find(q => q.id === questionId);
      
      if (question.type === 'scale') {
        totalScore += response.value;
        maxScore += 10;
        
        if (response.value <= 4) {
          keyAreas.push(question.category);
        } else if (response.value >= 7) {
          strengths.push(question.category);
        }
      } else if (question.type === 'multiple_choice' && question.options) {
        const selectedOption = question.options.find(opt => opt.value === response.value);
        if (selectedOption) {
          if (selectedOption.severity === 'severe' || selectedOption.severity === 'high_risk') {
            riskFactors.push(question.category);
            keyAreas.push(question.category);
          } else if (selectedOption.severity === 'good') {
            strengths.push(question.category);
          }
        }
      }
    });

    const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 50;
    
    let riskLevel = 'low';
    if (riskFactors.length > 2 || overallScore < 40) {
      riskLevel = 'high';
    } else if (riskFactors.length > 0 || overallScore < 60) {
      riskLevel = 'moderate';
    }

    return {
      overallScore,
      riskLevel,
      keyAreas: [...new Set(keyAreas)],
      strengths: [...new Set(strengths)],
      riskFactors,
      recommendations: generateRecommendations(riskLevel, keyAreas, strengths),
      resources: generateResources(riskLevel, keyAreas),
      followUpSuggested: riskLevel !== 'low'
    };
  };

  const generateRecommendations = (riskLevel, keyAreas, strengths) => {
    const recommendations = [];

    if (keyAreas.includes('General Mood')) {
      recommendations.push({
        category: 'Mood Support',
        suggestion: 'Consider mood tracking apps and daily mindfulness practices',
        priority: 'high'
      });
    }

    if (keyAreas.includes('Anxiety & Stress')) {
      recommendations.push({
        category: 'Anxiety Management',
        suggestion: 'Practice breathing exercises and progressive muscle relaxation',
        priority: 'high'
      });
    }

    if (keyAreas.includes('Sleep & Energy')) {
      recommendations.push({
        category: 'Sleep Hygiene',
        suggestion: 'Establish a consistent sleep schedule and bedtime routine',
        priority: 'medium'
      });
    }

    if (riskLevel === 'high') {
      recommendations.unshift({
        category: 'Professional Support',
        suggestion: 'We strongly recommend connecting with a mental health professional',
        priority: 'critical'
      });
    }

    return recommendations;
  };

  const generateResources = (riskLevel, keyAreas) => {
    const resources = [
      {
        title: 'Crisis Text Line',
        description: 'Free, 24/7 support for those in crisis',
        contact: 'Text HOME to 741741',
        type: 'crisis'
      },
      {
        title: 'National Suicide Prevention Lifeline',
        description: 'Free and confidential emotional support',
        contact: '988',
        type: 'crisis'
      }
    ];

    if (keyAreas.includes('Anxiety & Stress')) {
      resources.push({
        title: 'Anxiety and Depression Association of America',
        description: 'Resources and support for anxiety management',
        contact: 'adaa.org',
        type: 'educational'
      });
    }

    return resources;
  };

  const currentQuestion = assessmentQuestions[currentStep];
  const progress = ((currentStep + 1) / assessmentQuestions.length) * 100;

  if (!isOpen) return null;

  if (assessmentComplete && report) {
    return <AssessmentReport report={report} userProfile={userProfile} onClose={onClose} />;
  }

  return (
    <div className="assessment-overlay">
      <div className={`assessment-container ${assessmentSize}`}>
        {/* Header */}
        <div className="assessment-header">
          <div className="assessment-info">
            <div className="zen-assessment-brand">
              <i className="bi bi-yin-yang zen-assess-icon"></i>
              <div>
                <h2>ZenZone Wellness Assessment</h2>
                <div className="assessment-badges">
                  <span className="assess-badge">
                    <i className="bi bi-shield-check"></i> Confidential
                  </span>
                  <span className="assess-badge">
                    <i className="bi bi-heart-pulse"></i> Personalized
                  </span>
                </div>
              </div>
            </div>
            <p>This confidential assessment helps us understand your current wellbeing and provide personalized recommendations for your ZenZone journey.</p>
          </div>
          <div className="header-controls">
            <div className="size-controls">
              <button 
                className={`size-btn ${assessmentSize === 'small' ? 'active' : ''}`}
                onClick={() => setAssessmentSize('small')}
                title="Small View"
              >
                <i className="bi bi-dash-square"></i>
              </button>
              <button 
                className={`size-btn ${assessmentSize === 'medium' ? 'active' : ''}`}
                onClick={() => setAssessmentSize('medium')}
                title="Medium View"
              >
                <i className="bi bi-square"></i>
              </button>
              <button 
                className={`size-btn ${assessmentSize === 'large' ? 'active' : ''}`}
                onClick={() => setAssessmentSize('large')}
                title="Large View"
              >
                <i className="bi bi-plus-square"></i>
              </button>
            </div>
            <button className="btn-close-assessment" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="assessment-progress">
          <div className="progress-info">
            <span>Question {currentStep + 1} of {assessmentQuestions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question */}
        <div className="assessment-question" ref={questionRef}>
          <div className="question-category">{currentQuestion.category}</div>
          <h3 className="question-text">{currentQuestion.question}</h3>

          {/* Scale Input */}
          {currentQuestion.type === 'scale' && (
            <div className="scale-input">
              <div className="scale-labels">
                <span>{currentQuestion.scale.labels[currentQuestion.scale.min]}</span>
                <span>{currentQuestion.scale.labels[Math.round((currentQuestion.scale.min + currentQuestion.scale.max) / 2)]}</span>
                <span>{currentQuestion.scale.labels[currentQuestion.scale.max]}</span>
              </div>
              <div className="scale-slider">
                <input
                  type="range"
                  min={currentQuestion.scale.min}
                  max={currentQuestion.scale.max}
                  value={responses[currentQuestion.id]?.value || 5}
                  onChange={(e) => handleResponse(currentQuestion.id, parseInt(e.target.value))}
                  className="slider"
                />
                <div className="scale-value">
                  {responses[currentQuestion.id]?.value || 5}
                </div>
              </div>
            </div>
          )}

          {/* Multiple Choice */}
          {currentQuestion.type === 'multiple_choice' && (
            <div className="multiple-choice">
              {currentQuestion.options.map((option) => (
                <label key={option.value} className="choice-option">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={responses[currentQuestion.id]?.value === option.value}
                    onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                  />
                  <span className="choice-text">{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* Text Input */}
          {currentQuestion.type === 'text' && (
            <div className="text-input">
              <textarea
                placeholder={currentQuestion.placeholder}
                value={responses[currentQuestion.id]?.value || ''}
                onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                rows="4"
                className="text-response"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="assessment-navigation">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!responses[currentQuestion.id]}
            className="btn btn-primary"
          >
            {currentStep === assessmentQuestions.length - 1 ? (
              loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Generating Report...
                </>
              ) : (
                <>
                  Complete Assessment
                  <i className="bi bi-check-lg ms-2"></i>
                </>
              )
            ) : (
              <>
                Next
                <i className="bi bi-arrow-right ms-2"></i>
              </>
            )}
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <i className="bi bi-shield-check"></i>
          <span>Your responses are confidential and used only to provide personalized recommendations.</span>
        </div>
      </div>
    </div>
  );
};

// Assessment Report Component
const AssessmentReport = ({ report, userProfile, onClose }) => {
  const navigate = useNavigate();
  const [reportSize, setReportSize] = useState('medium'); // small, medium, large
  
  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'danger';
      default: return 'secondary';
    }
  };

  const getRiskLevelText = (level) => {
    switch (level) {
      case 'low': return 'Good Mental Wellness';
      case 'moderate': return 'Some Areas Need Attention';
      case 'high': return 'Professional Support Recommended';
      default: return 'Assessment Complete';
    }
  };
  
  const downloadReport = () => {
    // Generate PDF report
    const reportData = {
      timestamp: report.timestamp,
      user: userProfile?.name || 'Anonymous User',
      overall_score: report.overall_score,
      risk_level: report.risk_level,
      key_areas: report.key_areas,
      strengths: report.strengths,
      recommendations: report.recommendations,
      resources: report.resources
    };
    
    // Create a formatted text version for download
    const reportText = `
ZENZONE WELLNESS ASSESSMENT REPORT
Generated: ${new Date(report.timestamp).toLocaleDateString()}

=================================
OVERALL WELLNESS SCORE: ${report.overall_score}/100
RISK LEVEL: ${getRiskLevelText(report.risk_level)}
=================================

${report.key_areas.length > 0 ? `AREAS FOR FOCUS:
${report.key_areas.map(area => `• ${area}`).join('\n')}\n\n` : ''}${report.strengths.length > 0 ? `YOUR STRENGTHS:
${report.strengths.map(strength => `• ${strength}`).join('\n')}\n\n` : ''}PERSONALIZED RECOMMENDATIONS:
${report.recommendations.map(rec => `• ${rec.category}: ${rec.suggestion} (Priority: ${rec.priority})`).join('\n')}\n\nHELPFUL RESOURCES:
${report.resources.map(res => `• ${res.title}: ${res.contact}\n  ${res.description}`).join('\n\n')}\n\nDISCLAIMER:
This report is for informational purposes only and does not replace professional medical advice.
If you're experiencing a mental health crisis, please contact emergency services immediately.

Crisis Resources:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: 911
    `;
    
    // Create and download the file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zenzone-wellness-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const scheduleAppointment = () => {
    // Direct navigation with report data attached
    onClose(); // Close the assessment modal first
    navigate('/contact-psychiatrist', {
      state: {
        assessmentReport: report,
        userProfile: userProfile,
        fromAssessment: true
      }
    });
  };
  

  return (
    <>
      <div className="assessment-overlay">
        <div className={`report-container ${reportSize}`}>
          {/* Report Header */}
          <div className="report-header">
            <div className="report-info">
              <h2>Your Personalized ZenZone Wellness Report</h2>
              <p>Based on your responses, here are your personalized insights and recommendations.</p>
            </div>
            <div className="header-controls">
              <div className="size-controls">
                <button 
                  className={`size-btn ${reportSize === 'small' ? 'active' : ''}`}
                  onClick={() => setReportSize('small')}
                  title="Small View"
                >
                  <i className="bi bi-dash-square"></i>
                </button>
                <button 
                  className={`size-btn ${reportSize === 'medium' ? 'active' : ''}`}
                  onClick={() => setReportSize('medium')}
                  title="Medium View"
                >
                  <i className="bi bi-square"></i>
                </button>
                <button 
                  className={`size-btn ${reportSize === 'large' ? 'active' : ''}`}
                  onClick={() => setReportSize('large')}
                  title="Large View"
                >
                  <i className="bi bi-plus-square"></i>
                </button>
              </div>
              <button className="btn-close-report" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

        {/* Overall Score */}
        <div className="overall-score">
          <div className="score-circle">
            <div className="score-value">{report.overall_score}</div>
            <div className="score-label">Overall Wellness Score</div>
          </div>
          <div className="risk-assessment">
            <div className={`risk-badge ${getRiskLevelColor(report.risk_level)}`}>
              {getRiskLevelText(report.risk_level)}
            </div>
          </div>
        </div>

        {/* Key Areas */}
        {report.key_areas.length > 0 && (
          <div className="report-section">
            <h3>Areas for Focus</h3>
            <div className="areas-grid">
              {report.key_areas.map((area, index) => (
                <div key={index} className="area-card focus">
                  <i className="bi bi-target"></i>
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {report.strengths.length > 0 && (
          <div className="report-section">
            <h3>Your Strengths</h3>
            <div className="areas-grid">
              {report.strengths.map((strength, index) => (
                <div key={index} className="area-card strength">
                  <i className="bi bi-star-fill"></i>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="report-section">
          <h3>Personalized Recommendations</h3>
          <div className="recommendations-list">
            {report.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card ${rec.priority}`}>
                <div className="rec-header">
                  <h4>{rec.category}</h4>
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                  </span>
                </div>
                <p>{rec.suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="report-section">
          <h3>Helpful Resources</h3>
          <div className="resources-list">
            {report.resources.map((resource, index) => (
              <div key={index} className={`resource-card ${resource.type}`}>
                <h4>{resource.title}</h4>
                <p>{resource.description}</p>
                <div className="resource-contact">
                  <strong>Contact: </strong>{resource.contact}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="report-actions">
          <button className="btn btn-outline-primary" onClick={downloadReport}>
            <i className="bi bi-download me-2"></i>
            Download Report
          </button>
          <button 
            className="btn btn-primary btn-lg" 
            onClick={scheduleAppointment}
            style={{fontSize: '1.1rem', fontWeight: '600'}}
          >
            <i className="bi bi-calendar-plus me-2"></i>
            📅 Schedule ZenZone Appointment
          </button>
        </div>

        {/* Follow-up Notice */}
        {report.follow_up_suggested && (
          <div className="follow-up-notice">
            <i className="bi bi-info-circle"></i>
            <span>Based on your responses, we recommend following up with a mental health professional.</span>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default PersonalizedAssessment;

>>>>>>> 51afcdf4 (fix(client): prevent localhost API base leaking in prod; use shared api client in PersonalizedAssessment to avoid ERR_CONNECTION_REFUSED on psychiatrist dashboard):client/src/components/PersonalizedAssessment.js
export default PersonalizedAssessment;