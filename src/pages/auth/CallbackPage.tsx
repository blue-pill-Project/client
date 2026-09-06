import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { reissueToken, getMyProfile } from '../../lib/authApi';
import { setAccessToken } from '../../lib/token';
import { getErrorMessage } from '../../lib/utils';

/**
 * OAuth 콜백 페이지.
 * 소셜 로그인 리다이렉트 후 토큰 재발급·프로필 조회를 수행하고 홈으로 이동한다.
 */
const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthenticated, openModal, logout } = useAuthStore();

  useEffect(() => {
    /** 토큰 재발급 → 프로필 조회 → 인증 상태 반영 후 홈으로 이동 */
    const initAuth = async () => {
      try {
        // 즉시 토큰 재발급 호출
        const response = await reissueToken();
        
        // 액세스 토큰 저장
        setAccessToken(response.accessToken);
        
        // 프로필 정보 가져오기
        const userProfile = await getMyProfile();

        // 로그인 상태 업데이트
        setAuthenticated(true, userProfile);

        if (response.isNewUser) {
          // 최초 로그인인 경우 회원가입 모달(약관 동의 단계) 표시
          openModal('signup-step1');
        }

        // 메인 페이지로 이동
        navigate('/', { replace: true });
      } catch (error) {
        console.error(getErrorMessage(error, '인증에 실패했습니다.'));
        // 실패 시 토큰 삭제 및 로그아웃 처리
        setAccessToken(null);
        logout();
        openModal('login');
        navigate('/', { replace: true });
      }
    };

    initAuth();
  }, [navigate, setAuthenticated, openModal, logout]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background-main">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base-200 typo-body-2 animate-pulse">인증 중입니다...</p>
      </div>
    </div>
  );
};

export default CallbackPage;
