import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { Modal } from '../common/Modal';
import { withdrawUser } from '../../lib/authApi';
import { useAuthStore } from '../../store/useAuthStore';
import { getErrorMessage } from '../../lib/utils';

const REASON_MAX_LENGTH = 300;

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [deleteReason, setDeleteReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    if (!confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setIsLoading(true);
    try {
      await withdrawUser(deleteReason.trim() || undefined);
      logout();
      onClose();
      navigate('/', { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, '회원 탈퇴에 실패했습니다.');
      console.error(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="회원 탈퇴" width="lg">
      <div className="p-8 space-y-6">
        <p className="typo-body-3 text-base-400 leading-relaxed">
          탈퇴 시 계정 정보와 캐릭터 카드, 게시물이 삭제되며 복구할 수 없습니다.
        </p>

        <div className="flex flex-col gap-2 w-full">
          <label className="typo-body-3 text-base-300">탈퇴 사유 (선택)</label>
          <div className="relative">
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              maxLength={REASON_MAX_LENGTH}
              placeholder="탈퇴 사유를 알려주시면 서비스 개선에 참고하겠습니다."
              rows={4}
              className="w-full bg-transparent border border-base-800 rounded-lg px-4 py-3 typo-body-3 text-base-50 outline-none transition-colors duration-200 placeholder:text-base-600 focus:border-primary hover:border-base-700 resize-none"
            />
            <span className="absolute right-4 bottom-3 text-[10px] text-base-600 font-mono">
              {deleteReason.length}/{REASON_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="Outline" fullWidth onClick={onClose}>취소</Button>
          <Button
            variant="solid"
            fullWidth
            onClick={handleWithdraw}
            loading={isLoading}
            className="bg-system-error hover:bg-system-error-hovered text-base-50"
          >
            탈퇴하기
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WithdrawModal;
