import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// 로그인은 별도 페이지가 아니라 AuthModal로만 제공된다.
// /login으로 직접 들어온 경우(북마크, 외부 링크 등) 홈으로 보내고 로그인 모달을 띄운다.
const LoginRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const openModal = useAuthStore((state) => state.openModal);

  useEffect(() => {
    openModal('login');
    navigate('/', { replace: true });
  }, [navigate, openModal]);

  return null;
};

export default LoginRedirectPage;
