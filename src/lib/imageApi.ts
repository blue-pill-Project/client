/**
 * R2 직접 업로드를 위한 Presigned URL 발급 API.
 */
import { api } from './api';

/** Presigned 업로드 URL과 R2 객체 키 */
export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

/**
 * 이미지 업로드용 Presigned URL을 발급받는다.
 * @param imageType 프로필·캐릭터·로그 용도 구분
 */
export const getPresignedUrl = async (filename: string, contentType: string, imageType: 'PROFILE' | 'CHARACTER' | 'LOG') => {
  return await api.post<PresignedUrlResponse>('/images/presigned-url', {
    filename,
    contentType,
    imageType
  });
};
