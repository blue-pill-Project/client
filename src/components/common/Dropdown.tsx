/**
 * 공통 드롭다운 셀렉트.
 * 옵션 목록에서 단일 값을 선택하는 커스텀 셀렉트 UI다.
 */
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 바깥 클릭으로 닫히는 단일 선택 Dropdown.
 */
const Dropdown = ({
  options,
  value,
  onChange,
  placeholder = 'option',
  disabled = false,
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  /** 메뉴 바깥 클릭 시 드롭다운을 닫는다 */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** 비활성 상태가 아니면 메뉴 열림/닫힘을 토글한다 */
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  /** 옵션을 선택하고 메뉴를 닫는다 */
  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={cn('relative w-full max-w-41', className)}
    >
      {/* 트리거 버튼 */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'w-full h-9 px-4 cursor-pointer flex items-center justify-between rounded-full border box-border transition-all duration-200 outline-none select-none',
          'bg-background-main text-base-300 font-regular typo-body-3',
          // 디폴트 상태
          'border-base-700',
          // 호버 상태
          'hover:bg-background-hovered hover:border-base-600',
          // 포커스 상태
          isFocused && 'border-base-600 ring-1 ring-base-500/20',
          // 눌러진 (열린) 상태
          isOpen && 'border-base-600 bg-background-hovered',
          // 비활성 상태
          'disabled:cursor-not-allowed disabled:bg-base-600 disabled:border-base-600 disabled:text-base-500',
          disabled && 'opacity-60'
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {/* 더블 쉐브론 아이콘 */}
        <div className="flex flex-col -space-y-1 ml-2 shrink-0 text-base-500">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <g clipPath="url(#clip0_765_4899)">
              <path d="M2 5L4 7L6 5" stroke="currentColor" />
              <path d="M2 3L4 1L6 3" stroke="currentColor" />
            </g>
            <defs>
              <clipPath id="clip0_765_4899">
                <rect width="8" height="8" fill="currentColor" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 mt-1 p-1 z-50 overflow-hidden',
            'bg-background-main border border-base-700 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200'
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors not-last:mb-1',
                  'text-base-300 typo-body-3',
                  'hover:bg-base-800 active:bg-base-800',
                  isSelected && 'bg-base-800 text-base-50'
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <g clipPath="url(#clip0_1189_1053)">
                      <g clipPath="url(#clip1_1189_1053)">
                        <path d="M0.5 4.83466L1.97 6.72463C2.0196 6.78909 2.08316 6.84148 2.1559 6.87788C2.22864 6.91423 2.30868 6.93366 2.39 6.93463C2.47001 6.9356 2.54922 6.91864 2.62188 6.88515C2.69453 6.8516 2.75879 6.80228 2.81 6.74079L7.5 1.06543" stroke="#FAFAFA" stroke-linecap="round" stroke-linejoin="round" />
                      </g>
                    </g>
                    <defs>
                      <clipPath id="clip0_1189_1053">
                        <rect width="8" height="8" fill="white" />
                      </clipPath>
                      <clipPath id="clip1_1189_1053">
                        <rect width="8" height="8" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
