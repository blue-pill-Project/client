import { useAuthStore } from '../store/useAuthStore';
import { getAccessToken, setAccessToken } from './token';
import { BASE_URL } from './config';
import { getErrorMessage } from './utils';

interface FetchOptions extends RequestInit {
  data?: unknown;
}

// 재발급 중인지 여부를 저장하여 중복 요청 방지
let isReissuing = false;

/**
 * 전역 로그아웃 및 로그인 유도
 * 장기간 방치 등으로 세션(리프레시 토큰)이 만료된 경우, 보호된 페이지에
 * 그대로 남아 API 에러 메시지("존재하지 않는 유저입니다" 등)만 노출되는 대신
 * 홈으로 이동시킨다.
 */
const handleAuthFailure = () => {
  useAuthStore.getState().logout();
  useAuthStore.getState().openModal('login');
  if (window.location.pathname !== '/') {
    window.location.replace('/');
  }
};

/**
 * 토큰 재발급 시도
 */
const attemptTokenReissue = async (): Promise<string | null> => {
  if (isReissuing) return null;
  
  isReissuing = true;
  try {
    const response = await fetch(`${BASE_URL}/auth/reissue`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      const { data } = await response.json();
      const newToken = data.accessToken;
      setAccessToken(newToken);
      return newToken;
    }
  } catch (err) {
    console.error(getErrorMessage(err, '토큰 재발급 중 오류가 발생했습니다.'));
  } finally {
    isReissuing = false;
  }
  
  return null;
};

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, ...rest } = options;
  const url = `${BASE_URL}${endpoint}`;

  const headers = new Headers(rest.headers);
  if (data && !(data instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // 로컬 스토리지에서 최신 토큰 읽기
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', token);
  }

  const config: RequestInit = {
    ...rest,
    headers,
    credentials: 'include',
  };

  if (data) {
    config.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  const response = await fetch(url, config);

  // 401 에러 발생 시 자동 재발급 시도
  if (response.status === 401 && endpoint !== '/auth/reissue') {
    const newToken = await attemptTokenReissue();
    if (newToken) {
      // 재발급 성공 시 원래 요청 재시도
      return apiFetch<T>(endpoint, options);
    } else {
      // 재발급 실패 시 로그아웃
      handleAuthFailure();
      throw new Error('AUTH_REQUIRED');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  const result = await response.json();
  // 서버가 ApiResponse 형태로 응답을 래핑해서 보낸 경우, data 필드만 반환
  if (result && result.data !== undefined) {
      return result.data;
  }
  return result;
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) => 
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', data }),

  put: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT', data }),

  patch: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', data }),
  
  delete: <T>(endpoint: string, options?: FetchOptions) => 
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
