import React, { useState } from 'react';
import './EmojiPicker.css';

const EmojiPicker = ({ onEmojiSelect, isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');

  const emojiCategories = {
    smileys: {
      name: 'Smileys & Emotion',
      icon: '😀',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
        '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
        '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
        '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
        '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸'
      ]
    },
    gestures: {
      name: 'People & Body',
      icon: '👋',
      emojis: [
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
        '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
        '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
        '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂'
      ]
    },
    hearts: {
      name: 'Hearts & Love',
      icon: '❤️',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '❤️‍🔥',
        '❤️‍🩹', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
        '♥️', '💯', '💢', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '💫'
      ]
    },
    nature: {
      name: 'Animals & Nature',
      icon: '🐶',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
        '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊',
        '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
        '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌'
      ]
    },
    food: {
      name: 'Food & Drink',
      icon: '🍕',
      emojis: [
        '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥗', '🥘', '🍝',
        '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚',
        '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧',
        '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪'
      ]
    }
  };

  if (!isOpen) return null;

  return (
    <div className="emoji-picker-overlay" onClick={onClose}>
      <div className="emoji-picker-container" onClick={(e) => e.stopPropagation()}>
        <div className="emoji-picker-header">
          <div className="emoji-categories">
            {Object.entries(emojiCategories).map(([key, category]) => (
              <button
                key={key}
                className={`category-btn ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
                title={category.name}
              >
                {category.icon}
              </button>
            ))}
          </div>
          <button className="close-emoji-picker" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>
        
        <div className="emoji-grid">
          <div className="category-title">
            {emojiCategories[activeCategory].name}
          </div>
          <div className="emojis-container">
            {emojiCategories[activeCategory].emojis.map((emoji, index) => (
              <button
                key={index}
                className="emoji-btn"
                onClick={() => {
                  onEmojiSelect(emoji);
                  onClose();
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;