import React, { useState } from 'react';
import './ResourceLibrary.css';
import ExerciseModal from './ExerciseModal.jsx';

const ResourceLibrary = ({ className = '' }) => {
  const [activeCategory, setActiveCategory] = useState('articles');
  const [searchTerm, setSearchTerm] = useState('');
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const resources = {
    articles: [
      {
        id: 1,
        title: "Understanding Anxiety: A Student's Guide",
        description: "Learn about anxiety symptoms, triggers, and coping strategies specifically for college students.",
        category: "Anxiety",
        readTime: "5 min read",
        difficulty: "Beginner",
        tags: ["anxiety", "coping", "students"],
        url: "https://adaa.org/understanding-anxiety", // ADAA
        featured: true
      },
      {
        id: 2,
        title: "Building Resilience in Challenging Times",
        description: "Practical techniques to develop emotional resilience and bounce back from setbacks.",
        category: "Resilience",
        readTime: "8 min read",
        difficulty: "Intermediate",
        tags: ["resilience", "emotional-health", "growth"],
        url: "https://www.apa.org/topics/resilience" // APA
      },
      {
        id: 3,
        title: "Managing Academic Stress and Pressure",
        description: "Evidence-based strategies for handling academic deadlines, exam anxiety, and performance pressure.",
        category: "Stress",
        readTime: "6 min read",
        difficulty: "Beginner",
        tags: ["stress", "academic", "time-management"],
        url: "https://www.mhanational.org/managing-stress" // MHA
      }
    ],
    exercises: [
      {
        id: 4,
        title: "4-7-8 Breathing Technique",
        description: "A simple breathing exercise to reduce anxiety and promote relaxation in just minutes.",
        category: "Breathing",
        duration: "3-5 minutes",
        difficulty: "Beginner",
        tags: ["breathing", "anxiety-relief", "quick"],
        type: "Breathing Exercise"
      },
      {
        id: 5,
        title: "Progressive Muscle Relaxation",
        description: "Learn to systematically relax your body by tensing and releasing muscle groups.",
        category: "Relaxation",
        duration: "10-15 minutes",
        difficulty: "Beginner",
        tags: ["relaxation", "body-awareness", "stress-relief"],
        type: "Body Exercise"
      },
      {
        id: 6,
        title: "Mindfulness Meditation for Students",
        description: "A guided mindfulness practice designed specifically for busy students and young adults.",
        category: "Mindfulness",
        duration: "8-12 minutes",
        difficulty: "Intermediate",
        tags: ["mindfulness", "meditation", "focus"],
        type: "Meditation"
      }
    ],
    crisis: [
      {
        id: 7,
        title: "Crisis Text Line",
        description: "Free, 24/7 support via text message. Text HOME to 741741.",
        contact: "Text HOME to 741741",
        available: "24/7",
        tags: ["crisis", "text", "immediate-help"],
        type: "Text Support"
      },
      {
        id: 8,
        title: "National Suicide Prevention Lifeline",
        description: "Free and confidential emotional support for people in suicidal crisis or emotional distress.",
        contact: "988",
        available: "24/7",
        tags: ["crisis", "phone", "suicide-prevention"],
        type: "Phone Support"
      },
      {
        id: 9,
        title: "Campus Counseling Services",
        description: "Most colleges offer free or low-cost mental health services to students.",
        contact: "Contact your student services",
        available: "Varies by campus",
        tags: ["counseling", "campus", "professional-help"],
        type: "Professional Support"
      }
    ]
  };

  const categories = [
    { key: 'articles', label: 'Articles & Guides', icon: 'bi-journal-text', count: resources.articles.length },
    { key: 'exercises', label: 'Wellness Exercises', icon: 'bi-heart-pulse', count: resources.exercises.length },
    { key: 'crisis', label: 'Crisis Resources', icon: 'bi-telephone', count: resources.crisis.length }
  ];

  const filteredResources = resources[activeCategory]?.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className={`resource-library ${className}`}>
      {/* Header */}
      <div className="resource-library-header">
        <div className="header-content">
          <div className="header-info">
            <h3 className="resource-library-title">
              <i className="bi bi-book-half me-2"></i>
              Mental Health Resource Library
            </h3>
            <p className="resource-library-subtitle">
              Evidence-based resources, exercises, and crisis support tools to support your wellbeing journey.
            </p>
          </div>
          
          {/* Search */}
          <div className="resource-search">
            <div className="search-input-group">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search resources, topics, or techniques..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="btn-clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="resource-categories">
        {categories.map((category) => (
          <button
            key={category.key}
            className={`category-tab ${activeCategory === category.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.key)}
          >
            <i className={`${category.icon} me-2`}></i>
            <span className="category-label">{category.label}</span>
            <span className="category-count">{category.count}</span>
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="resources-container">
        {filteredResources.length === 0 ? (
          <div className="no-resources">
            <div className="no-resources-icon">
              <i className="bi bi-search"></i>
            </div>
            <h4>No resources found</h4>
            <p>
              {searchTerm 
                ? `No resources match your search for "${searchTerm}"`
                : "No resources available in this category"
              }
            </p>
            {searchTerm && (
              <button 
                className="btn btn-outline-primary"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="resources-grid">
            {filteredResources.map((resource) => (
              <div key={resource.id} className={`resource-card ${resource.featured ? 'featured' : ''}`}>
                {resource.featured && (
                  <div className="featured-badge">
                    <i className="bi bi-star-fill"></i>
                    Featured
                  </div>
                )}
                
                <div className="resource-header">
                  <div className="resource-category-badge">
                    {resource.category || resource.type}
                  </div>
                  
                  {resource.difficulty && (
                    <span className={`badge bg-${getDifficultyColor(resource.difficulty)}`}>
                      {resource.difficulty}
                    </span>
                  )}
                </div>

                <div className="resource-content">
                  <h5 className="resource-title">{resource.title}</h5>
                  <p className="resource-description">{resource.description}</p>
                  
                  <div className="resource-meta">
                    {resource.readTime && (
                      <span className="meta-item">
                        <i className="bi bi-clock me-1"></i>
                        {resource.readTime}
                      </span>
                    )}
                    {resource.duration && (
                      <span className="meta-item">
                        <i className="bi bi-stopwatch me-1"></i>
                        {resource.duration}
                      </span>
                    )}
                    {resource.available && (
                      <span className="meta-item">
                        <i className="bi bi-calendar-check me-1"></i>
                        {resource.available}
                      </span>
                    )}
                  </div>
                  
                  {resource.contact && (
                    <div className="resource-contact">
                      <strong>Contact: </strong>
                      <span className="contact-info">{resource.contact}</span>
                    </div>
                  )}

                  <div className="resource-tags">
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="resource-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="resource-actions">
{activeCategory === 'articles' && resource.url && (
                    <a
                      className="btn btn-primary resource-action-btn"
                      href={resource.url}
                      target={/^https?:\/\//i.test(resource.url) ? '_blank' : undefined}
                      rel={/^https?:\/\//i.test(resource.url) ? 'noopener noreferrer' : undefined}
                    >
                      <i className="bi bi-journal-arrow-up me-2"></i>
                      Read Article
                    </a>
                  )}
                  
                  {activeCategory === 'exercises' && (
                    <button
                      className="btn btn-success resource-action-btn"
                      onClick={() => { setSelectedExercise(resource); setExerciseOpen(true); }}
                    >
                      <i className="bi bi-play-circle me-2"></i>
                      Start Exercise
                    </button>
                  )}
                  
{activeCategory === 'crisis' && (
                    <a
                      className="btn btn-danger resource-action-btn"
                      href="/learn-more"
                    >
                      <i className="bi bi-telephone me-2"></i>
                      Get Help Now
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="resource-tips">
        <div className="tips-header">
          <h5>
            <i className="bi bi-lightbulb me-2"></i>
            Quick Mental Health Tips
          </h5>
        </div>
        
        <div className="tips-grid">
          <div className="tip-card">
            <i className="bi bi-sun"></i>
            <div>
              <strong>Start your day mindfully</strong>
              <p>Take 5 minutes each morning for deep breathing or meditation.</p>
            </div>
          </div>
          
          <div className="tip-card">
            <i className="bi bi-people"></i>
            <div>
              <strong>Stay connected</strong>
              <p>Reach out to friends, family, or counselors when you need support.</p>
            </div>
          </div>
          
          <div className="tip-card">
            <i className="bi bi-battery-charging"></i>
            <div>
              <strong>Practice self-care</strong>
              <p>Prioritize sleep, nutrition, exercise, and activities you enjoy.</p>
            </div>
          </div>
          
          <div className="tip-card">
            <i className="bi bi-shield-check"></i>
            <div>
              <strong>Seek help when needed</strong>
              <p>Professional support is available and seeking help is a sign of strength.</p>
            </div>
          </div>
        </div>
      </div>

      <ExerciseModal
        open={exerciseOpen}
        exercise={selectedExercise}
        onClose={() => setExerciseOpen(false)}
      />
    </div>
  );
};

export default ResourceLibrary;