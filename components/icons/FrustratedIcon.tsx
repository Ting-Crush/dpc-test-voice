import React from 'react';

const FrustratedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <path d="M3.5 8.5C4.4 7.6 6.2 7 8 7c4 0 6 4 6 4s2-4 6-4c1.8 0 3.6.6 4.5 1.5" />
     <path d="M3.5 15.5c1-1 2.8-1.5 4.5-1.5 4 0 6 4 6 4s2-4 6-4c1.7 0 3.5.5 4.5 1.5" />
  </svg>
);

export default FrustratedIcon;
