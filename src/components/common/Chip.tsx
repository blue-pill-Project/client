/**
 * 공통 칩(배지) 컴포넌트.
 * 작은 상태·태그 라벨을 아이콘과 함께 표시한다.
 */
import React from 'react';
import { cn } from '../../lib/utils';

type ChipVariant = 'gray' | 'black';
type ChipSize = 'm' | 's';

interface ChipProps {
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * 비상호작용 태그/상태 Chip.
 */
const Chip = ({
  variant = 'gray',
  size = 'm',
  icon,
  children,
  className,
}: ChipProps) => {
  // 1. 배경 및 텍스트 색상 (디자인 가이드 기반)
  const variantStyles: Record<ChipVariant, string> = {
    gray: 'bg-base-700 text-base-50',
    black: 'bg-background-main text-base-50',
  };

  // 2. 사이즈별 스타일 (높이, 패딩, 타이포그래피, 간격)
  const sizeStyles: Record<ChipSize, string> = {
    m: 'h-7 rounded-md',
    s: 'h-5 rounded-sm',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center gap-1 px-1.5 whitespace-nowrap select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && (
        <span className='text-primary flex items-center justify-center shrink-0'>
          {icon}
        </span>
      )}
      <span className="leading-none typo-body-4">{children}</span>
    </div>
  );
};

export default Chip;
