/**
 * 회원가입 완료를 안내하고 서비스를 시작하게 하는 뷰.
 */
import React from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import Button from '../../common/Button';

/** 가입 완료 체크 아이콘 */
const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="#62F6B5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 가입 완료 메시지를 보여 주고 모달을 닫아 서비스를 시작한다.
 */
const SignupSuccessView: React.FC = () => {
  const closeModal = useAuthStore((state) => state.closeModal);

  /** 인증 모달을 닫고 메인 화면으로 돌아간다. */
  const handleStart = () => {
    closeModal();
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-sm w-full mx-auto h-full">

      <div className="w-20 h-20 rounded-full border border-primary flex items-center justify-center mb-6">
        <CheckIcon />
      </div>

      <div className="text-center space-y-3 mb-10">
        <h2 className="text-[18px] font-bold text-primary tracking-widest uppercase">BLUEPILL</h2>
        <h1 className="text-[28px] font-bold text-base-50">가입이 완료되었습니다!</h1>
      </div>

      <Button
        variant="solid"
        size="l"
        fullWidth
        onClick={handleStart}
      >
        시작하기
      </Button>

    </div>
  );
};

export default SignupSuccessView;
