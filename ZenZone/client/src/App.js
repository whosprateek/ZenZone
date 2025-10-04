import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Messaging from './components/Messaging';
import ContactPsychiatrist from './components/ContactPsychiatrist';
import PsychiatristDashboard from './components/PsychiatristDashboard';
import PsychiatristChats from './components/PsychiatristChats';
import StudentChats from './components/StudentChats';
import LearnMore from './components/LearnMore';
import PersonalizedAssessmentPage from './pages/PersonalizedAssessmentPage';
import Home from './pages/Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles.css';
import ZenZoneLogo from './components/ZenZoneLogo.jsx';
import FloatingChatLauncher from './components/FloatingChatLauncher.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

function App() {
  useEffect(() => {
    try { require('bootstrap/dist/js/bootstrap.bundle.min.js'); } catch {}
  }, []);

  const isAuthenticated = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole') || 'guest';

  return (
    <Router>
      <AppInner />
    </Router>
  );
}

function AppInner() {
  const location = useLocation();
  useEffect(() => {
    try { require('bootstrap/dist/js/bootstrap.bundle.min.js'); } catch {}
  }, []);

  const isAuthenticated = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole') || 'guest';
  const path = location.pathname || '';
  const hideFloating = /messaging|chat|psychiatrist-dashboard/i.test(path);
  const fullBleed = /student-chats|psychiatrist-chats/i.test(path);

  return (
    <>
      <nav className="navbar navbar-expand-lg shadow-sm">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2" href="/" style={{ textDecoration: 'none' }}>
            <ZenZoneLogo size={28} withWordmark={true} />
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item"><a className="nav-link" href="/">Home</a></li>
              {!isAuthenticated && (
                <>
                  <li className="nav-item"><a className="nav-link" href="/register">Register</a></li>
                  <li className="nav-item"><a className="nav-link" href="/login">Login</a></li>
                </>
              )}
              {isAuthenticated && userRole === 'student' && (
                <>
                  <li className="nav-item"><a className="nav-link" href="/student-chats">Chats</a></li>
                  <li className="nav-item"><a className="nav-link" href="/contact-psychiatrist">Contact Psychiatrist</a></li>
                </>
              )}
              {isAuthenticated && userRole === 'psychiatrist' && (
                <>
                  <li className="nav-item"><a className="nav-link" href="/psychiatrist-dashboard">Dashboard</a></li>
                  <li className="nav-item"><a className="nav-link" href="/psychiatrist-chats">Chats</a></li>
                </>
              )}
              <li className="nav-item ms-2"><ThemeToggle className="compact" /></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className={fullBleed ? 'page-bleed' : 'container mt-4'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/personalized-assessment" element={<PersonalizedAssessmentPage />} />
          <Route path="/contact-psychiatrist" element={isAuthenticated && userRole === 'student' ? <ContactPsychiatrist /> : <Navigate to={isAuthenticated ? '/' : '/login'} />} />
          <Route path="/student-chats" element={isAuthenticated && userRole === 'student' ? <StudentChats /> : <Navigate to={isAuthenticated ? '/' : '/login'} />} />
          <Route path="/psychiatrist-dashboard" element={isAuthenticated && userRole === 'psychiatrist' ? <PsychiatristDashboard /> : <Navigate to={isAuthenticated ? '/' : '/login'} />} />
          <Route path="/psychiatrist-chats" element={isAuthenticated && userRole === 'psychiatrist' ? <PsychiatristChats /> : <Navigate to={isAuthenticated ? '/' : '/login'} />} />
        </Routes>
      </div>

      {!hideFloating && <FloatingChatLauncher />}
    </>
  );
}
export default App;
