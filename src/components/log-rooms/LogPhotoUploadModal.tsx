/**
 * 로그 사진 업로드 모달.
 * 선택한 파일 미리보기와 캡션 입력을 받아 업로드를 제출한다.
 */
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import Button from '../common/Button';

interface LogPhotoUploadModalProps {
  isOpen: boolean;
  file: File | null;
  isUploading?: boolean;
  onClose: () => void;
  onSubmit: (caption: string) => void;
}

/**
 * 로그 사진 업로드 UI.
 * 파일이 바뀌면 캡션을 초기화하고, 미리보기 Object URL을 정리한다.
 */
export const LogPhotoUploadModal = ({
  isOpen,
  file,
  isUploading = false,
  onClose,
  onSubmit,
}: LogPhotoUploadModalProps) => {
  const [caption, setCaption] = useState('');
  const [captionSourceFile, setCaptionSourceFile] = useState(file);

  // 파일이 바뀌면 캡션을 초기화 (effect setState 대신 렌더 중 조정)
  if (file !== captionSourceFile) {
    setCaptionSourceFile(file);
    setCaption('');
  }

  /** 선택 파일의 미리보기 Object URL */
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  /** 미리보기 URL을 언마운트/교체 시 revoke한다 */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen || !file) return null;

  /** 트림된 캡션과 함께 업로드를 제출한다 */
  const handleSubmit = () => {
    onSubmit(caption.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="로그 업로드" width="lg">
      <div className="p-6 space-y-5">
        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-base-900 border border-base-800">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="업로드 미리보기"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="typo-body-3 text-base-300">캡션</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="사진에 대한 설명을 적어주세요 (선택)"
            maxLength={200}
            rows={3}
            disabled={isUploading}
            className="w-full resize-none bg-transparent border border-base-800 rounded-lg px-4 py-3 typo-body-3 text-base-50 outline-none transition-colors duration-200 placeholder:text-base-600 focus:border-primary hover:border-base-700 disabled:opacity-50"
          />
          <span className="self-end text-[10px] text-base-600 font-mono">
            {caption.length}/200
          </span>
        </div>

        <div className="flex gap-3">
          <Button variant="Outline" fullWidth onClick={onClose} disabled={isUploading}>
            취소
          </Button>
          <Button
            variant="solid"
            fullWidth
            onClick={handleSubmit}
            loading={isUploading}
            disabled={isUploading}
          >
            업로드
          </Button>
        </div>
      </div>
    </Modal>
  );
};
