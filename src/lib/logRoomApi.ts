import { api } from './api';

export interface LogRoomParticipant {
  memberPublicId: string;
  name: string;
  imageUrl: string | null;
  isUser: boolean;
  isOwner: boolean;
}

export interface LogRoomListItem {
  publicId: string;
  name: string;
  participantCount: number;
  createdAt: string;
  isOwner: boolean;
  isPublic: boolean;
  backgroundImageUrl: string | null;
  ownerPublicId: string;
  ownerNickname: string;
  participants: LogRoomParticipant[];
}

export interface LogRoomListResponse {
  content: LogRoomListItem[];
  nextCursor: string | null;
  hasNext: boolean;
  total: number;
}

export interface DayLogEntry {
  memberPublicId: string;
  photoPublicId: string;
  caption: string | null;
  imageUrl: string;
  authorType: 'USER' | 'CHARACTER';
  authorName: string;
  authorImageUrl: string | null;
}

export interface DayLogTimeSlot {
  timeSlot: number;
  entries: DayLogEntry[];
}

export interface LogCharacterCard {
  memberPublicId: string;
  characterPublicId: string;
  name: string;
  description: string;
  imageUrl: string;
  useCount: number;
  isDeleted: boolean;
  isPublic: boolean;
  isLatest: boolean;
  isOwner: boolean;
  canUpdate: boolean;
}

export interface ChatMessage {
  isMe: boolean;
  content: string;
  createdAt: string;
  /** 서버 미제공 — 클라이언트가 사진 답장 시 로컬로 붙이는 값 */
  quotedPhotoPublicId?: string | null;
}

export interface SharedPostPhoto {
  memberPublicId: string;
  photoPublicId: string;
  caption: string | null;
  imageUrl: string;
  authorType: 'USER' | 'CHARACTER';
  authorName: string;
  authorImageUrl: string | null;
}

export interface SharedPost {
  publicId: string;
  roomPublicId: string;
  roomName: string;
  postDate: string;
  timeSlot: number;
  sharer: {
    publicId: string;
    nickname: string;
    profileImageUrl: string | null;
  };
  isMine: boolean;
  createdAt: string;
  participants: LogRoomParticipant[];
  photos: SharedPostPhoto[];
}

export interface SharedPostListResponse {
  content: SharedPost[];
  nextCursor: string | null;
  hasNext: boolean;
  total: number;
}

export interface PostShareResponse {
  publicId: string;
  logRoomPublicId: string;
  postDate: string;
  timeSlot: number;
  createdAt: string;
}

/**
 * 로그방 목록 조회
 */
export const getMyLogRooms = async (params: { cursor?: string; size?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.cursor) query.append('cursor', params.cursor);
  if (params.size) query.append('size', params.size.toString());

  const endpoint = `/log-rooms${query.toString() ? `?${query.toString()}` : ''}`;
  return api.get<LogRoomListResponse>(endpoint);
};

/**
 * 로그방 생성
 */
export const createLogRoom = async (data: {
  name: string;
  characterCardPublicIds: string[];
  relationship: string;
  isPublic: boolean;
  backgroundPhoto?: string;
}) => {
  return api.post<{ publicId: string; name: string; isPublic: boolean; createdAt: string }>(
    '/log-rooms',
    data
  );
};

/**
 * 로그방 삭제 (방장만 가능)
 */
export const deleteLogRoom = async (publicId: string) => {
  return api.delete(`/log-rooms/${publicId}`);
};

/**
 * 하루 로그 조회
 */
export const getDayLog = async (publicId: string, date: string) => {
  return api.get<DayLogTimeSlot[]>(`/log-rooms/${publicId}/logs?date=${date}`);
};

/**
 * 로그 캐릭터 카드 조회
 */
export const getLogCharacterCard = async (publicId: string, memberPublicId: string) => {
  return api.get<LogCharacterCard>(`/log-rooms/${publicId}/members/${memberPublicId}`);
};

/**
 * 로그 캐릭터 카드 업데이트 (최신 버전으로)
 */
export const updateLogCharacterCard = async (publicId: string, memberPublicId: string) => {
  return api.patch(`/log-rooms/${publicId}/members/${memberPublicId}`);
};

/**
 * 로그 게시물 공유 (피드 게시물로)
 */
export const shareLog = async (publicId: string, data: { postDate: string; timeSlot: number }) => {
  return api.post<PostShareResponse>(`/log-rooms/${publicId}/posts`, data);
};

/**
 * 로그방에서 공유된 게시물 조회
 */
export const getLogRoomPosts = async (
  publicId: string,
  params: { cursor?: string; size?: number } = {}
) => {
  const query = new URLSearchParams();
  if (params.cursor) query.append('cursor', params.cursor);
  if (params.size) query.append('size', params.size.toString());

  const endpoint = `/log-rooms/${publicId}/posts${query.toString() ? `?${query.toString()}` : ''}`;
  return api.get<SharedPostListResponse>(endpoint);
};

/**
 * 전체 게시물 목록 조회 (홈 피드 — 모든 로그방에서 공유된 게시물)
 */
export const getPosts = async (params: { cursor?: string; size?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.cursor) query.append('cursor', params.cursor);
  if (params.size) query.append('size', params.size.toString());

  const endpoint = `/posts${query.toString() ? `?${query.toString()}` : ''}`;
  return api.get<SharedPostListResponse>(endpoint);
};

/**
 * 공유된 게시물 삭제 (공유한 본인만 가능 — 원본 로그 사진은 삭제되지 않음)
 */
export const deletePost = async (publicId: string) => {
  return api.delete(`/posts/${publicId}`);
};

/**
 * 로그 사진 업로드
 */
export const uploadLogPhoto = async (
  publicId: string,
  data: { imageUrl: string; caption?: string },
  timezone: string
) => {
  return api.post(`/log-rooms/${publicId}/photos`, data, {
    headers: { 'X-Timezone': timezone },
  });
};

/**
 * 로그 사진 삭제
 */
export const deleteLogPhoto = async (publicId: string, photoPublicId: string) => {
  return api.delete(`/log-rooms/${publicId}/photos/${photoPublicId}`);
};

/**
 * 채팅방 메시지 목록 조회
 */
export const getChatMessages = async (publicId: string, params: { cursor?: number; size?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.cursor !== undefined) query.append('cursor', params.cursor.toString());
  if (params.size !== undefined) query.append('size', params.size.toString());

  const endpoint = `/log-rooms/${publicId}/chats${query.toString() ? `?${query.toString()}` : ''}`;
  return api.get<{ messages: ChatMessage[]; nextCursor: number | null; hasMore: boolean }>(endpoint);
};

/**
 * 채팅방 메시지 전송
 */
export const sendChatMessage = async (publicId: string, data: { message: string; photoPublicId?: string }) => {
  return api.post(`/log-rooms/${publicId}/chats`, {
    content: data.message,
    quotedPhotoPublicId: data.photoPublicId
  });
};
