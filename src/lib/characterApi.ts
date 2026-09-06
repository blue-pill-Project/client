/**
 * 캐릭터 카드 CRUD·라이브러리·프롬프트 자동완성 API.
 */
import { api } from './api';

/** 캐릭터 카드 단건 응답 */
export interface CharacterCard {
  publicId: string;
  name: string;
  characterCode: number;
  version: number;
  description: string;
  imageUrl: string;
  creatorPublicId: string;
  creatorNickname: string;
  prompt?: string;
  exampleDialogues?: string[];
  isPublic: boolean;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 캐릭터 카드 커서 페이지네이션 목록 응답 */
export interface CharacterCardListResponse {
  content: CharacterCard[];
  nextCursor: string | null;
  hasNext: boolean;
  total: number;
}

/** 캐릭터 카드 생성 요청 본문 */
export interface CharacterCardCreateRequest {
  name: string;
  description: string;
  imageUrl: string;
  prompt: string;
  exampleDialogues?: string[];
  isPublic: boolean;
}

/** 캐릭터 카드 수정 요청 본문 (부분 갱신) */
export interface CharacterCardUpdateRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  prompt?: string;
  exampleDialogues?: string[] | null;
  isPublic?: boolean;
}

/**
 * 캐릭터 카드 생성
 */
export const createCharacterCard = async (data: CharacterCardCreateRequest) => {
  return api.post<{ publicId: string; name: string; description: string; imageUrl: string; createdAt: string }>(
    '/character-cards',
    data
  );
};

/**
 * 캐릭터 카드 전체 목록 조회 (라이브러리)
 */
export const getCharacterLibrary = async (params: {
  keyword?: string;
  sort?: 'LATEST' | 'POPULAR';
  cursor?: string;
  size?: number;
}) => {
  const query = new URLSearchParams();
  if (params.keyword) query.append('keyword', params.keyword);
  if (params.sort) query.append('sort', params.sort);
  if (params.cursor) query.append('cursor', params.cursor);
  if (params.size) query.append('size', params.size.toString());

  const endpoint = `/character-cards${query.toString() ? `?${query.toString()}` : ''}`;
  return api.get<CharacterCardListResponse>(endpoint);
};

/**
 * 캐릭터 카드 상세 정보 조회
 */
export const getCharacterCardDetail = async (publicId: string) => {
  return api.get<CharacterCard>(`/character-cards/${publicId}`);
};

/**
 * 캐릭터 카드 삭제
 */
export const deleteCharacterCard = async (publicId: string) => {
  return api.delete(`/character-cards/${publicId}`);
};

/**
 * 캐릭터 카드 수정
 */
export const updateCharacterCard = async (publicId: string, data: CharacterCardUpdateRequest) => {
  return api.patch(`/character-cards/${publicId}`, data);
};

/**
 * 캐릭터 카드 공개 여부 변경
 */
export const updateCharacterVisibility = async (publicId: string, isPublic: boolean) => {
  return api.patch(`/character-cards/${publicId}/visibility`, { isPublic });
};

/**
 * 캐릭터 프롬프트 자동완성
 */
export const autoCompleteCharacterPrompt = async (data: {
  name: string;
  intro: string;
  prompt?: string;
}) => {
  return api.post<{ prompt: string }>('/character-cards/prompt/autocomplete', data);
};

/**
 * 특정 유저가 생성한 캐릭터 카드 목록 조회
 */
export const getUserCharacterCards = async (
  userPublicId: string,
  params: { cursor?: string; size?: number; sort?: 'LATEST' | 'POPULAR', keyword?: string; } = {}
) => {
  const query = new URLSearchParams();
  if (params.cursor) query.append('cursor', params.cursor);
  if (params.size) query.append('size', params.size.toString());
  if (params.sort) query.append('sort', params.sort);
  if (params.keyword) query.append('keyword', params.keyword);

  const endpoint = `/users/${userPublicId}/character-cards${query.toString() ? `?${query.toString()}` : ''}`;
  return api.get<CharacterCardListResponse>(endpoint);
};
