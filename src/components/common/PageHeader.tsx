/**
 * 페이지 최상단 공통 헤더.
 * 카테고리·타이틀·설명·액션 버튼을 일관된 레이아웃으로 배치한다.
 */
import React from 'react';
import Button from './Button';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  /** 상단 작은 카테고리 텍스트 (예: LIBRARY, LOG ROOMS) */
  category?: string;
  /** 메인 타이틀 */
  title: string;
  /** 상세 설명 */
  description?: React.ReactNode;
  /** 우측 또는 하단에 배치될 액션 버튼 설정 */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "solid" | "Outline" | "Darkoutline" | "Rectangleoutline";
  };
  /** 추가적인 커스텀 클래스 */
  className?: string;
}

/**
 * 라이브러리/로그룸 등 목록 페이지용 PageHeader.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  category,
  title,
  description,
  action,
  className
}) => {
  return (
    <>
      <header className={cn("py-10 md:py-16", className)}>
        {category && (
          <span className="text-body-4 text-base-400 tracking-[0.3em] uppercase">
            {category}
          </span>
        )}

        <h1 className="text-display-3 font-bold tracking-tight text-base-300 pt-4 pb-6">
          {title}
        </h1>

        {description && (
          <p className="text-body-4 text-base-400 max-w-2xs leading-relaxed">
            {description}
          </p>
        )}

        {action && (
          <div className="pt-8">
            <Button
              variant={action.variant || "solid"}
              size="m"
              leftIcon={action.icon}
              className='min-w-[384px] text-body-2 text-base-800 font-medium'
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </header>
      <hr className="border-base-700" />
    </>
  );
};

export default PageHeader;
