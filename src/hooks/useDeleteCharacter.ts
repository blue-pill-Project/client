/**
 * 캐릭터 카드 삭제 확인·API 호출을 묶은 훅.
 */
import { deleteCharacterCard } from '../lib/characterApi';
import { getErrorMessage } from '../lib/utils';

/**
 * confirm 후 캐릭터를 삭제하고, 성공 시 콜백을 실행한다.
 */
export const useDeleteCharacter = () => {
  /** 캐릭터 삭제 요청을 실행한다 */
  const deleteCharacter = async (publicId: string, onSuccess?: () => void) => {
    if (!confirm('정말로 이 캐릭터를 삭제하시겠습니까?')) return;

    try {
      await deleteCharacterCard(publicId);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const message = getErrorMessage(err, '캐릭터 삭제에 실패했습니다.');
      console.error(message);
      alert(message);
    }
  };

  return { deleteCharacter };
};
