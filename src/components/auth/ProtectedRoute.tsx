/**
 * 인증이 필요한 라우트를 감싸 비로그인 접근을 차단하는 모듈.
 */
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

import PageLayout from '../layout/PageLayout';

/**
 * 로그인 유저만 children을 렌더하고, 비로그인이면 홈으로 보내고 로그인 모달을 연다.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialized, openModal } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      openModal('login');
    }
  }, [isInitialized, isAuthenticated, openModal]);

  if (!isInitialized) {
    return (
      <PageLayout>
        <div className="flex flex-col gap-8 animate-pulse">
          <div className="h-20 bg-base-900/50 rounded-3xl w-2/3 mb-10"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-base-950/20 border border-base-900/30 rounded-4xl p-8 h-[320px]"></div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isAuthenticated) {
    // 현재는 모달 방식이므로 홈으로 리다이렉트 시키고 모달을 띄우는 방식이 자연스러움
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
