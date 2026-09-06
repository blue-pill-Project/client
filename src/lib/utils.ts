/**
 * 클래스 병합·이미지 URL·아바타 폴백·반응형·에러 메시지 등 공용 유틸.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SyntheticEvent } from 'react';
import { R2_DOMAIN } from './config';

/**
 * tailwind-merge와 clsx를 결합하여 조건부 클래스 결합 및 
 * 테일윈드 클래스 충돌을 해결해주는 유틸리티 함수입니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * R2 키 또는 절대 URL을 브라우저에서 쓸 이미지 URL로 변환한다.
 * key가 없으면 null을 반환한다.
 */
export const getImageUrl = (key: string | null) => {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${R2_DOMAIN}/${key}`;
};

/**
 * 프로필/아바타 <img>의 onError 핸들러 — 실제 로드가 실패했을 때(URL은 있지만
 * R2에서 삭제됐거나 깨진 경우 등) 기본 아바타로 교체한다. `getImageUrl(...) || '/default-profile.svg'`는
 * URL 자체가 없는 경우만 처리하므로, 존재하는 URL이 로드 실패하는 경우는 이 핸들러가 필요하다.
 */
export const handleAvatarError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.src.endsWith('/default-profile.svg')) return; // 기본 이미지 자체가 실패하면 더 이상 시도하지 않음
  img.onerror = null;
  img.src = '/default-profile.svg';
};

/**
 * 뷰포트 너비가 1024px 이하인지 판별한다 (모바일/태블릿 UI 분기용).
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 1024;
};

/**
 * catch(err)에서 잡힌 unknown 값을 안전하게 문자열 메시지로 변환합니다.
 */
export const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;
