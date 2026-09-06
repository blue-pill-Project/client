import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * /login 직접 진입 시 홈으로 리다이렉트하고 로그인 모달을 연다.
 * 실제 로그인은 별도 페이지가 아니라 AuthModal로만 제공된다.
 */
const LoginRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const openModal = useAuthStore((state) => state.openModal);

  useEffect(() => {
    // 북마크·외부 링크로 /login에 들어온 경우 홈 + 로그인 모달로 유도
    openModal('login');
    navigate('/', { replace: true });
  }, [navigate, openModal]);

  return null;
};

export default LoginRedirectPage;
