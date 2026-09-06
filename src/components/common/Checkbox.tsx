/**
 * 공통 체크박스.
 * 커스텀 스타일의 선택 UI와 선택적 라벨을 제공한다.
 */
import React from 'react';
import { cn } from '../../lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onChange?: (checked: boolean) => void;
}

/**
 * boolean onChange를 받는 커스텀 Checkbox.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, onChange, disabled, className, id, ...props }, ref) => {
    /** 네이티브 change를 boolean으로 변환해 부모에 전달한다 */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.checked);
      }
    };

    const checkboxId = id || (label ? `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex items-center gap-2.5 cursor-pointer select-none group',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />

          {/* 커스텀 체크박스 박스 */}
          <div
            className={cn(
              'w-4.5 h-4.5 rounded-sm border-[1.4px] transition-all duration-200 flex items-center justify-center',
              // 선택 안됨 (기본)
              'border-base-200 bg-transparent',
              // 선택됨 (peer 활용)
              'peer-checked:bg-primary peer-checked:border-primary peer-checked:[&_svg]:opacity-100',
              // 비활성화 (peer 활용)
              'peer-disabled:bg-base-800 peer-disabled:border-base-600',
              // 포커스 (peer 활용)
              'peer-focus-visible:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20',
              // 호버 (비활성화가 아닐 때만 적용)
              !disabled && 'group-hover:border-primary/70'
            )}
          >
            {/* 체크 아이콘 - 기본적으로 숨김 (opacity-0) */}
            <svg className="w-3.5 h-3.5 text-base-300 opacity-0 transition-opacity duration-200" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.7762 2.66239C13.0514 2.89826 13.0762 3.30459 12.8316 3.56995L5.7205 11.2842C5.59398 11.4215 5.41265 11.5 5.22222 11.5C5.0318 11.5 4.85046 11.4215 4.72395 11.2842L1.1684 7.42709C0.923789 7.16173 0.948576 6.7554 1.22376 6.51953C1.49895 6.28365 1.92033 6.30755 2.16495 6.57291L5.22222 9.88952L11.8351 2.71577C12.0797 2.45041 12.501 2.42651 12.7762 2.66239Z" fill="#FFFAEA" />
            </svg>
          </div>
        </div>

        {label && (
          <span className="typo-body-3 text-base-300 group-hover:text-base-100 transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
