/**
 * 공통 탭 네비게이션.
 * 밑줄 인디케이터로 활성 탭을 표시한다.
 */
import React from 'react';
import { cn } from '../../lib/utils';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onTabChange: (id: string) => void;
  className?: string;
}

/**
 * 수평 탭 목록. 클릭 시 onTabChange(id)를 호출한다.
 */
const Tabs: React.FC<TabsProps> = ({ items, activeId, onTabChange, className }) => {
  return (
    <div className={cn('flex items-center', className)}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'px-3 transition-all duration-200 cursor-pointer outline-none group',
              isActive
                ? 'text-base-50 font-bold'
                : 'text-base-600 hover:text-base-300 font-medium'
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <span className="typo-body-3">{item.label}</span>
              {/* 활성화 표시 밑줄 */}
              <div
                className={cn(
                  'w-full h-px transition-all duration-200',
                  isActive ? 'bg-base-50 opacity-100' : 'bg-transparent opacity-0 group-hover:bg-base-600/30 group-hover:opacity-100'
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
