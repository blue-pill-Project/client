import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import Button from '../../common/Button';
import TextInput from '../../common/TextInput';
import { ImageUpload } from '../../common/ImageUpload';
import { updateProfile, getMyProfile } from '../../../lib/authApi';
import { useR2Upload } from '../../../hooks/useR2Upload';
import { getErrorMessage } from '../../../lib/utils';

const SignupStep2View: React.FC = () => {
  const { setView, setAuthenticated } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadToR2 } = useR2Upload();

  const handleImageChange = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      let profileImageUrl = null;

      // 1. 이미지가 선택된 경우 R2 업로드 수행
      if (selectedFile) {
        profileImageUrl = await uploadToR2(selectedFile, 'PROFILE');
      }

      // 2. 프로필 업데이트 (서버는 받은 key를 DB에 저장)
      await updateProfile({
        nickname,
        profileImageUrl
      });

      // 3. 업데이트된 유저 정보 다시 가져오기
      const updatedUser = await getMyProfile();

      // 4. 스토어 업데이트
      setAuthenticated(true, updatedUser);

      // 5. 성공 화면으로 이동
      setView('signup-success');
    } catch (error) {
      const message = getErrorMessage(error, '프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
      console.error(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 닉네임을 비워둔 채 건너뛰면 서버가 랜덤 닉네임을 자동 부여한다.
  // 이 호출 없이 넘어가면 nickname이 계속 null로 남아 다음 로그인마다
  // isNewUser가 true로 판정되어 회원가입 모달이 매번 다시 뜨게 된다.
  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await updateProfile({ nickname: '', profileImageUrl: null });
      const updatedUser = await getMyProfile();
      setAuthenticated(true, updatedUser);
      setView('signup-success');
    } catch (error) {
      const message = getErrorMessage(error, '건너뛰기에 실패했습니다. 다시 시도해주세요.');
      console.error(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

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
        <span className="absolute top-4 right-6 text-base-500 typo-body-3 font-mono">2/2</span>

        <h3 className="typo-body-2 font-bold text-base-200 mb-2 uppercase tracking-widest">BLUEPILL</h3>
        <p className="text-[18px] font-bold text-base-50 mb-8">프로필 사진과 닉네임을 등록하세요.</p>

        {/* 프로필 이미지 업로드 */}
        <div className="mb-8">
            <ImageUpload 
                imagePreview={imagePreview} 
                onFileChange={handleImageChange} 
                defaultLabel="이미지 업로드하기"
            />
        </div>

        {/* 닉네임 입력 */}
        <div className="mb-6">
          <TextInput
            label="닉네임 설정"
            placeholder="원하는 닉네임을 알려주세요"
            helperText="12자 이내로 작성해주세요!"
            maxLength={12}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button
          onClick={handleSkip}
          disabled={isLoading}
          className="text-left typo-body-4 text-base-500 hover:text-base-300 underline mb-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          나중에 정할게요.
        </button>

        {/* 확인 버튼 */}
        <Button
          variant="Darksolid"
          size="l"
          fullWidth
          onClick={handleSubmit}
          loading={isLoading}
        >
          확인
        </Button>
      </div>
    </div>
  );
};

export default SignupStep2View;
