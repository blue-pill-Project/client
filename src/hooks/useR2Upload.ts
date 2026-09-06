/**
 * Presigned URL로 Cloudflare R2에 이미지를 직접 업로드하는 훅.
 */
import { useState } from 'react';
import { getPresignedUrl } from '../lib/imageApi';
import { getErrorMessage } from '../lib/utils';

// 서버가 원본 파일명을 그대로 R2 키에 이어붙이는데, 공백/괄호 등 특수문자가
// 섞이면 presigned PUT 서명 시점과 이후 공개 URL 조회 시점의 인코딩이 어긋나
// 404가 난다. 서버를 건드리지 않고 안전한 파일명만 보내서 우회한다.
/** R2 키용으로 안전한 파일명만 남긴다 */
const sanitizeFilename = (filename: string) => {
  const dotIndex = filename.lastIndexOf('.');
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const ext = dotIndex > 0 ? filename.slice(dotIndex + 1).replace(/[^a-zA-Z0-9]/g, '') : '';
  const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, '_') || 'image';
  return ext ? `${safeBase}.${ext}` : safeBase;
};

/**
 * R2 업로드 상태와 uploadToR2 함수를 제공한다.
 */
export const useR2Upload = () => {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Presigned URL을 받아 R2에 PUT 업로드하고 객체 key를 반환한다.
   */
  const uploadToR2 = async (file: File, imageType: 'PROFILE' | 'CHARACTER' | 'LOG') => {
    setIsUploading(true);
    try {
      // 1. Presigned URL 요청
      const { uploadUrl, key } = await getPresignedUrl(sanitizeFilename(file.name), file.type, imageType);
      
      // 2. R2로 직접 업로드 (PUT)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadResponse.ok) {
        throw new Error(`R2 업로드 실패 (status: ${uploadResponse.status})`);
      }

      return key; // 서버에 저장할 key 반환
    } catch (error) {
      console.error(getErrorMessage(error, 'R2 업로드에 실패했습니다.'));
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadToR2, isUploading };
};
