/**
 * 공통 토글 스위치.
 * on/off boolean 상태를 시각적으로 전환한다.
 */
import React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

/**
 * 라벨 옵션이 있는 on/off Switch.
 */
const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, className }) => {
  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)}>
      {label && <span className="typo-body-3 text-base-400">{label}</span>}
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            'w-11 h-5 rounded-full transition-colors duration-200 ease-in-out',
            checked ? 'bg-primary' : 'bg-base-700'
          )}
        />
        <div
          className={cn(
            'absolute left-0.5 top-0.5 w-4 h-4 bg-base-400 rounded-full shadow transform transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-6' : 'translate-x-0'
          )}
        />
      </div>
    </label>
  );
};

export default Switch;
