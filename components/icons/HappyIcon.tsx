import React from 'react';

const HappyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5 5 5 0 0 0 5-5v0a5 5 0 0 0-5-5z" />
    <path d="M12 12v10" />
    <path d="m16.5 16.5-9-9" />
    <path d="m7.5 16.5 9-9" />
  </svg>
);

export default HappyIcon;
