import React from 'react';

function ZenZoneLogo({ size = 28, withWordmark = false }) {
  const s = Number(size);
  return (
    <div className="zen-logo" style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <svg width={s} height={s} viewBox="0 0 64 64" aria-labelledby="zenLogoTitle" role="img">
        <title id="zenLogoTitle">ZenZone</title>
        <defs>
          <linearGradient id="zz-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#667eea"/>
            <stop offset="100%" stopColor="#764ba2"/>
          </linearGradient>
          <filter id="zz-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Outer rounded ring */}
        <circle cx="32" cy="32" r="27" fill="none" stroke="url(#zz-grad)" strokeWidth="6" opacity="0.9"/>
        {/* Yin-Yang inspired swirl */}
        <path d="M32 8c6.6 0 12 5.4 12 12 0 5-3.1 9.3-7.5 11 4.4 1.7 7.5 6 7.5 11 0 6.6-5.4 12-12 12s-12-5.4-12-12c0-5 3.1-9.3 7.5-11C23.1 29.3 20 25 20 20c0-6.6 5.4-12 12-12z" fill="url(#zz-grad)" filter="url(#zz-glow)" opacity="0.95"/>
        <circle cx="25" cy="20" r="3.2" fill="#fff" opacity="0.95"/>
        <circle cx="39" cy="44" r="3.2" fill="#fff" opacity="0.95"/>
      </svg>
      {withWordmark && (
        <span className="zen-wordmark" aria-label="ZenZone">ZenZone</span>
      )}
    </div>
  );
}

export default ZenZoneLogo;