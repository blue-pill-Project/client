import React from 'react';
import Sidebar from './Sidebar';
import { cn } from '../../lib/utils';
import { useLocation } from 'react-router-dom';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

const PageLayout = ({ children, className, containerClassName }: PageLayoutProps) => {

  const location = useLocation();
  const isCreateOrEditPage = location.pathname === '/log-rooms/new'
    || location.pathname.startsWith('/log-rooms/edit')
    || location.pathname === '/library/new'
    || location.pathname.startsWith('/library/edit');

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background-main text-base-50 font-sans overflow-hidden">
      {/* 사이드바: Desktop(왼쪽), Mobile(하단 고정) */}
      <Sidebar />

      {/* 메인 콘텐츠 영역 */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 overflow-y-auto hide-scrollbar",
        // 모바일에서는 하단 탭바 높이만큼 여백 확보
        "pb-16 md:pb-0",
        className
      )}>
        {/* 중앙 정렬 컨테이너 */}
        <div className={cn(
          "mx-auto w-full max-w-7xl py-10 md:py-16 px-6",
          containerClassName
        )}>
          <div className={cn('mx-auto w-full max-w-273 h-full', isCreateOrEditPage && 'flex justify-between max-w-full')}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageLayout;