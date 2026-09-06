/**
 * 공통 버튼 컴포넌트.
 * variant·size·로딩·좌우 아이콘을 지원하는 디자인 시스템 버튼이다
 */
import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant =
  | 'solid'
  | 'Graysolid'
  | 'Outline'
  | 'Darksolid'
  | 'Darkoutline'
  | 'Rectangleoutline';

type ButtonSize = 'l' | 'm' | 's' | 'xs';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  iconSize?: ButtonSize; // 아이콘 전용 사이즈 (SVG 크기 강제 제어)
}

/**
 * 공통 Button.
 * loading 중에는 스피너를 보이고 클릭을 비활성화한다.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'solid',
    size = 'm',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    className = '',
    children,
    disabled,
    type = 'button',
    iconSize = 'l',
    ...props
  }, ref) => {

    // 1. 상태별 스타일 (Disabled)
    const disabledStyles = {
      primary: 'disabled:bg-base-600 disabled:border-base-600 disabled:text-base-500',
      secondary: 'disabled:bg-base-800 disabled:border-base-800 disabled:text-base-600',
    };

    // 2. 타입별 스타일 매핑
    const variantStyles: Record<ButtonVariant, string> = {
      solid: cn('bg-primary text-background-main hover:bg-primary-hovered rounded-full', disabledStyles.primary),
      Graysolid: cn('bg-base-300 border-base-300 text-base-800 border hover:bg-background-main hover:text-base-100 rounded-full', disabledStyles.primary),
      Outline: cn('border border-base-700 hover:border-base-600 bg-background-main hover:bg-background-hovered text-base-300 hover:text-base-400 rounded-full', disabledStyles.secondary),
      Darksolid: cn('bg-secondary-600 text-base-50 hover:bg-secondary-400 rounded-lg', disabledStyles.primary),
      Darkoutline: cn('border border-secondary-600 bg-background-main text-secondary-400 hover:bg-background-hovered hover:border-secondary-400 rounded-lg', disabledStyles.secondary),
      Rectangleoutline: cn('border border-base-700 bg-background-main text-base-300 hover:bg-background-hovered hover:border-base-600 hover:text-base-400 rounded-lg', disabledStyles.primary),
    };

    // 3. 사이즈별 스타일 (높이, 패딩, 타이포그래피, 간격)
    const sizeStyles: Record<ButtonSize, string> = {
      l: 'h-12 px-5 typo-body-1 gap-2',
      m: 'h-10 px-4 typo-body-2 gap-2',
      s: 'h-9 px-3 typo-body-3 gap-2',
      xs: 'h-7 px-2 typo-body-4 gap-1',
    };

    // 4. 아이콘 전용 사이즈 매핑 (SVG 크기 강제 제어)
    const iconSizeClasses: Record<ButtonSize, string> = {
      l: '[&_svg]:size-4 size-4',
      m: '[&_svg]:size-[12.8px] size-[12.8px]',
      s: '[&_svg]:size-[11.2px] size-[11.2px]',
      xs: '[&_svg]:size-3 size-3',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 focus:outline-none select-none whitespace-nowrap active:scale-[0.98]',
          'disabled:cursor-not-allowed box-border cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <svg
              className={cn("animate-spin text-current", iconSizeClasses[size])}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {size !== 'xs' && <span>Loading...</span>}
          </div>
        ) : (
          <>
            {leftIcon && (
              <span className={cn('shrink-0 flex items-center justify-center', iconSizeClasses[iconSize])}>
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className={cn('shrink-0 flex items-center justify-center', iconSizeClasses[iconSize])}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
