'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function CrevasseLogo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left side of the split glacier droplet (Sui droplet representation) */}
      <path
        d="M46 10
           C32 25, 18 45, 18 64
           C18 80, 30 90, 46 90
           L43 70
           L47 50
           L43 30
           Z"
        fill="#5FE3C0"
      />
      
      {/* Right side of the split glacier droplet (Deep abyss/ice representation) */}
      <path
        d="M54 10
           C68 25, 82 45, 82 64
           C82 80, 70 90, 54 90
           L57 70
           L53 50
           L57 30
           Z"
        fill="#1A5C80"
      />
    </svg>
  );
}
