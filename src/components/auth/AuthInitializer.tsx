/**
 * 앱 최초 로드 시 쿠키 기반 세션 복구를 담당하는 모듈.
 */
import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { reissueToken, getMyProfile } from '../../lib/authApi';
import { setAccessToken } from '../../lib/token';
import { getErrorMessage } from '../../lib/utils';

/**
 * 토큰 재발급·프로필 조회로 로그인 상태를 복원하고, UI는 렌더링하지 않는다.
 */
const AuthInitializer: React.FC = () => {
  const { setAuthenticated, setInitialized, logout, openModal } = useAuthStore();

  useEffect(() => {
    // /auth/callback은 CallbackPage가 동일한 세션 복구 로직을 전담한다.
    // 여기서도 함께 실행하면 두 요청이 동시에 경쟁하다가 한쪽이 실패할 경우
    // signup-step1 모달이 로그인 모달로 덮어써지는 문제가 있었다.
    if (window.location.pathname === '/auth/callback') {
      setInitialized(true);
      return;
    }

    /** 리프레시 토큰으로 액세스 토큰을 재발급하고 유저 정보를 스토어에 반영한다. */
    const checkSession = async () => {
      try {
        // 새로고침 시 토큰 재발급 시도 (성공하면 로그인 유지)
        const response = await reissueToken();
        const token = response.accessToken;
        
        // API 요청 시 사용할 토큰 설정
        setAccessToken(token);
        
        // 유저 정보 가져오기
        const userData = await getMyProfile();
        setAuthenticated(true, userData);

        // 신규 유저인 경우 회원가입 모달 유지
        if (response.isNewUser) {
          openModal('signup-step1');
        }
      } catch (error) {
        // 실패 시 세션 없음 (비로그인 상태 유지)
        console.error(getErrorMessage(error, '세션 복원에 실패했습니다.'));
        setAccessToken(null);
        logout();
      } finally {
        setInitialized(true);
      }
    };

    checkSession();
  }, [setAuthenticated, setInitialized, logout, openModal]);

  return null; // UI를 렌더링하지 않음
};

export default AuthInitializer;
