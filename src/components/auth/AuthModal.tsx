/**
 * 로그인·회원가입 플로우를 전체 화면 모달로 표시하는 모듈.
 */
import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import LoginView from './views/LoginView';
import SignupStep1View from './views/SignupStep1View';
import SignupStep2View from './views/SignupStep2View';
import SignupSuccessView from './views/SignupSuccessView';

/** 모달 헤더의 뒤로가기 화살표 아이콘 */
const BackArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 인증 스토어의 currentView에 따라 로그인/회원가입 단계를 전환하는 풀스크린 모달.
 */
const AuthModal: React.FC = () => {
  const { isModalOpen, currentView, setView, closeModal } = useAuthStore();

  // Escape로 닫기, 열림 시 배경 스크롤 잠금
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // 모달 열림 시 배경 스크롤 방지
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  /** 현재 단계에 따라 이전 뷰로 이동하거나 모달을 닫는다. */
  const handleBack = () => {
    switch (currentView) {
      case 'signup-step1':
        setView('login');
        break;
      case 'signup-step2':
        setView('signup-step1');
        break;
      case 'login':
      case 'signup-success':
      default:
        closeModal();
        break;
    }
  };

  /** currentView에 대응하는 인증 단계 뷰를 반환한다. */
  const renderView = () => {
    switch (currentView) {
      case 'login': return <LoginView />;
      case 'signup-step1': return <SignupStep1View />;
      case 'signup-step2': return <SignupStep2View />;
      case 'signup-success': return <SignupSuccessView />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background-main overflow-y-auto">
      {/* 헤더 / 뒤로가기 버튼 영역 */}
      <div className="flex items-center p-6 h-20 shrink-0">
        {currentView !== 'signup-success' && (
          <button
            onClick={handleBack}
            className="p-2 hover:bg-base-900 rounded-full transition-colors cursor-pointer"
            aria-label="뒤로 가기"
          >
            <BackArrowIcon />
          </button>
        )}
      </div>

      {/* 메인 컨텐트 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[calc(100vh-5rem)]">
        {renderView()}
      </div>
    </div>
  );
};

export default AuthModal;
