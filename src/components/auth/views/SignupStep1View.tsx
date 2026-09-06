/**
 * 회원가입 1단계 — 서비스 약관 동의 화면.
 */
import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import Button from '../../common/Button';
import Checkbox from '../../common/Checkbox';

/**
 * 필수 약관 체크 후 프로필 등록(2단계)으로 진행하는 회원가입 뷰.
 */
const SignupStep1View: React.FC = () => {
  const setView = useAuthStore((state) => state.setView);

  const [allChecked, setAllChecked] = useState(false);
  const [terms1, setTerms1] = useState(false);
  const [terms2, setTerms2] = useState(false);
  const [terms3, setTerms3] = useState(false);

  /** 전체 동의 시 개별 약관 체크 상태를 일괄 동기화한다. */
  const handleAllCheck = (checked: boolean) => {
    setAllChecked(checked);
    setTerms1(checked);
    setTerms2(checked);
    setTerms3(checked);
  };

  // 현재는 모든 항목을 필수로 가정
  const isNextEnabled = terms1 && terms2 && terms3;

  return (
    <div className="flex flex-col max-w-120 w-full mx-auto">
      {/* 제목 */}
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-[18px] font-bold text-primary tracking-widest uppercase">BLUEPILL</h2>
        <h1 className="text-[28px] font-bold text-base-50">회원가입</h1>
      </div>

      {/* 박스 영역 */}
      <div className="relative bg-transparent border border-base-800 rounded-xl p-8 flex flex-col pt-12">
        {/* 단계 표시 */}
        <span className="absolute top-4 right-6 text-base-500 typo-body-3 font-mono">1/2</span>

        <h3 className="typo-body-2 font-bold text-base-200 mb-2 uppercase tracking-widest">BLUEPILL</h3>
        <p className="text-[18px] font-bold text-base-50 mb-8">서비스 약관에 동의해주세요</p>

        {/* 체크박스 영역 */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="pb-6 border-b border-base-800">
            <Checkbox
              label="모두 동의"
              checked={allChecked}
              onChange={handleAllCheck}
            />
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              label="서비스 이용약관 동의 (필수)"
              checked={terms1}
              onChange={(c) => { setTerms1(c); setAllChecked(c && terms2 && terms3); }}
            />
            <button className="text-base-500 hover:text-base-300 typo-body-4 border border-base-800 rounded px-2 py-1">약관 보기</button>
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              label="개인정보 수집 및 이용 동의 (필수)"
              checked={terms2}
              onChange={(c) => { setTerms2(c); setAllChecked(terms1 && c && terms3); }}
            />
            <button className="text-base-500 hover:text-base-300 typo-body-4 border border-base-800 rounded px-2 py-1">약관 보기</button>
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              label="만 14세 이상 확인 (필수)"
              checked={terms3}
              onChange={(c) => { setTerms3(c); setAllChecked(terms1 && terms2 && c); }}
            />
          </div>
        </div>

        {/* 다음 버튼 */}
        <Button
          variant="Darksolid"
          size="l"
          fullWidth
          disabled={!isNextEnabled}
          onClick={() => setView('signup-step2')}
        >
          다음
        </Button>
      </div>
    </div>
  );
};

export default SignupStep1View;
