/**
 * 닉네임·프로필 이미지 수정을 위한 모달 모듈.
 */
import React, { useRef, useState } from 'react';
import Button from '../common/Button';
import TextInput from '../common/TextInput';
import { updateProfile } from '../../lib/authApi';
import { useAuthStore } from '../../store/useAuthStore';
import { getErrorMessage } from '../../lib/utils';
import { useR2Upload } from '../../hooks/useR2Upload';
import { Modal } from '../common/Modal';
import { ImageUpload, type ImageUploadHandle } from '../common/ImageUpload';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  currentImageUrl: string | null;
  onSuccess: (newNickname: string, newImageUrl: string | null) => void;
}

/**
 * 프로필 사진 업로드와 닉네임 변경을 서버·스토어에 반영하는 편집 모달.
 */
const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentNickname,
  currentImageUrl,
  onSuccess
}) => {
  const [nickname, setNickname] = useState(currentNickname);
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const imageUploadRef = useRef<ImageUploadHandle>(null);
  const { setAuthenticated, user } = useAuthStore();
  const { uploadToR2 } = useR2Upload();

  if (!isOpen) return null;

  /** 선택한 이미지를 미리보기로 반영한다. */
  const handleImageChange = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /** R2 업로드(필요 시) 후 프로필을 갱신하고 성공 콜백을 호출한다. */
  const handleSubmit = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      let finalImageUrl = currentImageUrl;

      // 새 파일이 선택된 경우에만 R2 업로드 수행
      if (selectedFile) {
        finalImageUrl = await uploadToR2(selectedFile, 'PROFILE');
      }

      await updateProfile({
        nickname,
        profileImageUrl: finalImageUrl
      });

      console.log('서버로 보낼 이미지 키:', finalImageUrl);

      // 전역 스토어 업데이트
      if (user) {
        setAuthenticated(true, { ...user, nickname, profileImageUrl: finalImageUrl });
      }

      onSuccess(nickname, finalImageUrl);
      onClose();
    } catch (error) {
      const message = getErrorMessage(error, '프로필 업데이트에 실패했습니다.');
      console.error(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프로필 수정" width='lg'>
      <div className='p-8 space-y-8'>
        {/* 프로필 이미지 업로드 */}
        <div className="flex flex-col gap-4">
          <ImageUpload
            ref={imageUploadRef}
            imagePreview={imagePreview}
            onFileChange={handleImageChange}
            defaultLabel='나를 대표하는 이미지를 업로드해 주세요'
            boxSize='l'
            actions={[
              {
                label: '수정',
                onClick: () => imageUploadRef.current?.triggerUpload(),
              },
              {
                label: '삭제',
                onClick: () => {
                  setImagePreview(null);
                  setSelectedFile(null);
                },
              }
            ]}
          />
        </div>

        {/* 닉네임 입력 */}
        <TextInput
          label="닉네임"
          placeholder="닉네임을 입력하세요"
          helperText='12자 이내로 입력해 주세요'
          maxLength={12}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button variant="Outline" fullWidth onClick={onClose}>취소</Button>
          <Button variant="solid" fullWidth onClick={handleSubmit} loading={isLoading}>등록</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileEditModal;
