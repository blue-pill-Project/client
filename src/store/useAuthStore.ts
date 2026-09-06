/**
 * 로그인 모달·인증 여부·현재 유저 정보를 관리하는 Zustand 스토어.
 */
import { create } from 'zustand';
import { setAccessToken } from '../lib/token';

/** 인증 모달에 표시할 화면 단계 */
export type AuthView = 'login' | 'signup-step1' | 'signup-step2' | 'signup-success';

/** 클라이언트에서 쓰는 유저 프로필 요약 */
export interface User {
  publicId: string;
  nickname: string;
  profileImageUrl: string | null;
  email: string;
  planName: string | null;
  isPublic: boolean;
  characterCount: number;
  postCount: number;
}

/** 인증 스토어 상태와 액션 */
interface AuthState {
  isModalOpen: boolean;
  currentView: AuthView;
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: User | null;
  openModal: (view?: AuthView) => void;
  closeModal: () => void;
  setView: (view: AuthView) => void;
  setAuthenticated: (value: boolean, user?: User | null) => void;
  setInitialized: (value: boolean) => void;
  logout: () => void;
}

/**
 * 인증 UI·세션 상태 전역 스토어.
 */
export const useAuthStore = create<AuthState>((set) => ({
  isModalOpen: false,
  currentView: 'login',
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  openModal: (view = 'login') => set({ isModalOpen: true, currentView: view }),
  closeModal: () => set({ isModalOpen: false }),
  setView: (view) => set({ currentView: view }),
  setAuthenticated: (value, user = null) => set({ isAuthenticated: value, user, isInitialized: true }),
  setInitialized: (value) => set({ isInitialized: value }),
  logout: () => {
    // 쿠키 삭제는 백엔드 API(/auth/logout)에서 처리하도록 하고, 프론트에서는 토큰 및 상태 초기화
    setAccessToken(null);
    set({ isAuthenticated: false, isModalOpen: false, user: null, isInitialized: true });
  },
}));
