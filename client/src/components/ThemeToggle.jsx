import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);

    // Listen for system theme changes only if user hasn't chosen explicitly
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (dark) => {
    const root = document.documentElement;
    root.classList.toggle('dark-theme', dark);

    // Smoothen variable transition
    root.classList.add('theme-transitioning');
    setTimeout(() => root.classList.remove('theme-transitioning'), 300);
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <button
      className={`theme-toggle ${className} ${isDark ? 'dark' : 'light'}`}
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          <i className={`bi ${isDark ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
        </div>
        <div className="theme-toggle-icons">
          <i className="bi bi-sun-fill light-icon"></i>
          <i className="bi bi-moon-stars-fill dark-icon"></i>
        </div>
      </div>
      <span className="theme-toggle-label">{isDark ? 'Dark' : 'Light'} Mode</span>
    </button>
  );
};

export default ThemeToggle;
