/**
 * 공통 검색 입력 바.
 * light/dark 변형과 입력값 클리어 버튼을 지원한다.
 */
import React from 'react';
import { cn } from '../../lib/utils';

type SearchBarVariant = 'light' | 'dark';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: SearchBarVariant;
  onClear?: () => void;
  containerClassName?: string;
}

/**
 * 검색 아이콘·클리어 버튼이 있는 SearchBar.
 * - dark: 어두운 배경 / light: 크림색 배경
 */
const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({
    variant = 'light',
    onClear,
    containerClassName,
    value,
    onChange,
    className,
    placeholder = 'Search',
    ...props
  }, ref) => {
    const isDark = variant === 'dark';
    const hasValue = value && String(value).length > 0;

    /** 클리어 버튼 클릭 시 onClear를 호출한다 */
    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      if (onClear) {
        onClear();
      }
    };

    return (
      <div
        className={cn(
          'group relative flex items-center w-full h-9 rounded-full box-border px-4 transition-all duration-200',
          isDark
            ? 'bg-base-950 text-base-50 border border-base-300'
            : 'bg-base-300 text-base-950',
          containerClassName
        )}
      >
        {/* 검색 아이콘 */}
        <div className={cn('mr-3 shrink-0 transition-colors', isDark ? 'text-base-50' : 'text-base-950')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <g clipPath="url(#clip0_978_8016)">
              <path d="M6 11.5C9.03757 11.5 11.5 9.03757 11.5 6C11.5 2.96243 9.03757 0.5 6 0.5C2.96243 0.5 0.5 2.96243 0.5 6C0.5 9.03757 2.96243 11.5 6 11.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.5 13.5L10 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_978_8016">
                <rect width="14" height="14" fill="currentColor" />
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* 입력 필드 */}
        <input
          ref={ref}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'flex-1 h-full bg-transparent border-none outline-none typo-body-3 font-medium placeholder:text-inherit/50',
            className
          )}
          {...props}
        />

        {/* 삭제 버튼 - 입력값이 있을 때만 표시됨 */}
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'ml-2 cursor-pointer shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-90',
              isDark ? 'text-base-50 hover:text-primary' : 'text-base-950 hover:text-base-600'
            )}
            aria-label="Clear search"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <circle cx="9" cy="9" r="9" fill="currentColor" />
              <path
                d="M12 6L6 12M6 6L12 12"
                stroke={isDark ? "#0E0E13" : "#FFFAEA"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
