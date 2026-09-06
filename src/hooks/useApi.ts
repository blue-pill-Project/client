/**
 * 로딩·에러 상태를 포함한 변경성(API) 요청용 React 훅.
 */
import { useState, useCallback } from 'react';
import { api } from '../lib/api';

/** 지원하는 변경성 HTTP 메서드 */
type ApiMethod = 'post' | 'put' | 'patch' | 'delete';

/** useApi 내부 data/loading/error 상태 */
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * post/put/patch/delete 헬퍼와 요청 상태를 반환한다.
 */
export function useApi<T = unknown>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /** 지정 메서드로 API를 호출하고 상태를 갱신한다 */
  const request = useCallback(
    async (method: ApiMethod, endpoint: string, payload?: unknown) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let result: T;
        
        switch (method) {
          case 'post':
            result = await api.post<T>(endpoint, payload);
            break;
          case 'put':
            result = await api.put<T>(endpoint, payload);
            break;
          case 'patch':
            result = await api.patch<T>(endpoint, payload);
            break;
          case 'delete':
            result = await api.delete<T>(endpoint);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown API error');
        setState({ data: null, loading: false, error });
        throw error;
      }
    },
    []
  );

  const post = useCallback((endpoint: string, data?: unknown) => request('post', endpoint, data), [request]);
  const put = useCallback((endpoint: string, data?: unknown) => request('put', endpoint, data), [request]);
  const patch = useCallback((endpoint: string, data?: unknown) => request('patch', endpoint, data), [request]);
  const del = useCallback((endpoint: string) => request('delete', endpoint), [request]);

  return {
    ...state,
    post,
    put,
    patch,
    delete: del,
  };
}
