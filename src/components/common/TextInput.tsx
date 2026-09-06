/**
 * 공통 텍스트 입력 필드.
 * 라벨·에러·헬퍼 텍스트·글자 수 카운터를 지원한다.
 */
import React from 'react';
import { cn } from '../../lib/utils';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

/**
 * 라벨·검증 메시지를 포함한 단일 라인 입력 컴포넌트.
 */
const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, className, maxLength, value, onChange, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="typo-body-3 text-base-300">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            className={cn(
              'w-full bg-transparent border rounded-lg px-4 py-3 typo-body-3 text-base-50 outline-none transition-colors duration-200',
              'placeholder:text-base-600',
              error
                ? 'border-system-error focus:border-system-error focus:ring-1 focus:ring-system-error'
                : 'border-base-800 focus:border-primary hover:border-base-700',
              className
            )}
            {...props}
          />
          {maxLength && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-base-600 font-mono">
              {String(value || '').length}/{maxLength}
            </span>
          )}
        </div>

        {(error || helperText) && (
          <span className={cn('text-[12px] leading-4.5 font-medium', error ? 'text-system-error' : 'text-base-500')}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
