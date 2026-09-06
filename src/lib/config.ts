/**
 * API·OAuth·R2 등 클라이언트 전역 환경 설정 상수.
 * Vite 환경 변수가 없으면 프로덕션 기본 URL을 사용한다.
 */

/** 백엔드 REST API 베이스 URL */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://get-bluepill.xyz/api';

/** OAuth2 인가 요청에 쓰는 베이스 URL */
export const OAUTH2_BASE_URL = import.meta.env.VITE_OAUTH2_BASE_URL || 'https://get-bluepill.xyz';

/** Cloudflare R2 공개 이미지 도메인 */
export const R2_DOMAIN = 'https://pub-6197228c2b2a487daea08784bd1677d4.r2.dev';
