/**
 * 액세스 토큰의 로컬 스토리지 저장·조회 및 JWT에서 publicId 추출 유틸.
 */
import { getErrorMessage } from './utils';

// 액세스 토큰 로컬 스토리지 키
const ACCESS_TOKEN_KEY = 'accessToken';

/**
 * 로컬 스토리지에서 액세스 토큰을 가져옵니다.
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * 액세스 토큰을 로컬 스토리지에 저장하거나 삭제합니다.
 * @param token 'Bearer '를 포함하거나 포함하지 않은 토큰 문자열. null이면 삭제합니다.
 */
export const setAccessToken = (token: string | null) => {
  if (token) {
    // 'Bearer ' 접두사가 없으면 추가
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    localStorage.setItem(ACCESS_TOKEN_KEY, formattedToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

/**
 * JWT 토큰에서 publicId를 추출합니다.
 */
export const getPublicIdFromToken = (token: string): string | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    
    // base64url을 base64로 변환
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // 패딩 추가
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) throw new Error('Invalid base64 length');
      base64 += new Array(5 - pad).join('=');
    }
    
    // 디코딩
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload).publicId;
  } catch (e) {
    console.error(getErrorMessage(e, '토큰 디코딩에 실패했습니다.'));
    return null;
  }
};
