import React from 'react';
import './ChatSettingsDrawer.css';

function Toggle({label, checked, onChange}){
  return (
    <label className="cs-toggle">
      <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} />
      <span className="cs-slider" />
      <span className="cs-label">{label}</span>
    </label>
  );
}

export default function ChatSettingsDrawer({ open, onClose, settings, onChange }) {
  if (!open) return null;
  const s = settings || {};
  const set = (k, v) => onChange({ ...s, [k]: v });

  return (
    <aside className="chat-settings-drawer" role="dialog" aria-modal="true">
      <div className="cs-header">
        <h3>Chat Settings</h3>
        <button className="cs-close" onClick={onClose} aria-label="Close settings">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="cs-section">
        <h4>Appearance</h4>
        <Toggle label="Dark Mode" checked={s.darkMode === true} onChange={(v)=>set('darkMode', v)} />
      </div>

      <div className="cs-section">
        <h4>Notifications</h4>
        <Toggle label="Message Sounds" checked={s.messageSounds} onChange={(v)=>set('messageSounds', v)} />
        <Toggle label="Desktop Notifications" checked={s.desktopNotifications} onChange={(v)=>{
          if (v && 'Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
          }
          set('desktopNotifications', v);
        }} />
      </div>

      <div className="cs-section">
        <h4>Privacy</h4>
        <Toggle label="Read Receipts" checked={s.readReceipts} onChange={(v)=>set('readReceipts', v)} />
        <Toggle label="Last Seen" checked={s.lastSeen} onChange={(v)=>set('lastSeen', v)} />
      </div>

      <div className="cs-section">
        <h4>Chat</h4>
        <Toggle label="Auto-download Media" checked={s.autoDownloadMedia} onChange={(v)=>set('autoDownloadMedia', v)} />
        <Toggle label="Enter to Send" checked={s.enterToSend} onChange={(v)=>set('enterToSend', v)} />
        <div className="cs-hint">When disabled, use Ctrl/Cmd + Enter to send.</div>
      </div>
    </aside>
  );
}
