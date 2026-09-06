/**
 * 자물쇠 SVG 아이콘.
 */
import React from 'react';

/** 잠금/비공개 상태 표시용 아이콘 */
export const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
