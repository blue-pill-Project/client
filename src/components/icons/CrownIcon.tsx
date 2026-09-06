/**
 * 왕관 SVG 아이콘.
 */
import React from 'react';

/** 방장/소유자 표시용 아이콘 */
export const CrownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M3 8l4 4 5-8 5 8 4-4-2 11H5L3 8z" />
  </svg>
);
