import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AIChatbotSupport from './AIChatbotSupport';
import './FloatingChatLauncher.css';

function FloatingChatLauncher() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Hide launcher on dedicated messaging routes to avoid overlap
  const hiddenPaths = ['/messaging', '/student-chats', '/psychiatrist-chats'];
  const shouldHide = hiddenPaths.some((p) => location.pathname.startsWith(p));

  if (shouldHide) return null;

  return (
    <>
      <button
        type="button"
        className="floating-chat-launcher"
        title="ZenZone AI"
        onClick={() => setOpen(true)}
      >
        <i className="bi bi-robot"></i>
      </button>

      <AIChatbotSupport isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default FloatingChatLauncher;
