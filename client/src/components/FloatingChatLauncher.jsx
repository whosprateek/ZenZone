import React, { useState } from 'react';
import AIChatbotSupport from './AIChatbotSupport';
import './FloatingChatLauncher.css';

function FloatingChatLauncher() {
  const [open, setOpen] = useState(false);

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
