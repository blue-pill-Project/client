import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as logRoomApi from '../../lib/logRoomApi';
import PageLayout from '../../components/layout/PageLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useR2Upload } from '../../hooks/useR2Upload';
import { LogRoomHeader } from '../../components/log-rooms/LogRoomHeader';
import { LogTimeline } from '../../components/log-rooms/LogTimeline';
import { ChatPanel } from '../../components/log-rooms/ChatPanel';
import { LogPhotoUploadModal } from '../../components/log-rooms/LogPhotoUploadModal';
import { applyPhotoReplyCache, messageReplyKey, registerPhotoReply } from '../../lib/photoReplyCache';
import { expandChatBatches, saveChatBatchSplit } from '../../lib/chatBatchCache';
import { getErrorMessage, isMobile } from '../../lib/utils';
import type { ChatMessage } from '../../lib/logRoomApi';

/**
 * 로그방 상세 페이지.
 * 일별 타임라인·채팅·사진 업로드·공유·방 삭제를 한 화면에서 처리한다.
 */

const CHAT_PAGE_SIZE = 10;
const AI_POLL_INTERVAL_MS = 400;
const AI_POLL_MAX_ATTEMPTS = 75; // 약 30초

// 로컬 타임존 기준 YYYY-MM-DD (toISOString()은 UTC라 자정~오전9시 KST 구간에서 하루 어긋남)
/** 로컬 기준 날짜 키(YYYY-MM-DD) 생성 */
const getLocalDateKey = (d = new Date()) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** 채팅 메시지를 생성 시각 오름차순으로 정렬 */
const sortByCreatedAt = (a: ChatMessage, b: ChatMessage) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

/** 지정 ms만큼 대기 */
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 서버에 저장된 방금 보낸 유저(배치) 메시지 인덱스 */
const findBatchedUserIndex = (messages: ChatMessage[], batchedContent: string) => {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].isMe && messages[i].content === batchedContent) return i;
    }
    return -1;
};

/** 유저 메시지 이후에 AI(비-isMe) 답장이 있는지 확인 */
const hasAiReplyAfter = (messages: ChatMessage[], userIdx: number) => {
    if (userIdx < 0) return false;
    return messages.slice(userIdx + 1).some((m) => !m.isMe);
};

/**
 * 전송 직후 바로 GET 하면 AI 답장이 아직 저장되기 전일 수 있다.
 * 유저 메시지 뒤에 AI(비-isMe) 메시지가 보일 때까지 폴링한다.
 */
const waitForAiReply = async (publicId: string, batchedContent: string) => {
    let last = await logRoomApi.getChatMessages(publicId, { size: CHAT_PAGE_SIZE });

    for (let attempt = 0; attempt < AI_POLL_MAX_ATTEMPTS; attempt++) {
        const sorted = [...last.messages].sort(sortByCreatedAt);
        const combinedIdx = findBatchedUserIndex(sorted, batchedContent);
        if (hasAiReplyAfter(sorted, combinedIdx)) {
            return { response: last, sorted, combinedIdx };
        }
        await sleep(AI_POLL_INTERVAL_MS);
        last = await logRoomApi.getChatMessages(publicId, { size: CHAT_PAGE_SIZE });
    }

    const sorted = [...last.messages].sort(sortByCreatedAt);
    return {
        response: last,
        sorted,
        combinedIdx: findBatchedUserIndex(sorted, batchedContent),
    };
};

/** 전송 후 최신 페이지만 받아도, 이미 불러둔 더 오래된 메시지는 유지한다. */
const mergePreservingOlder = (prev: ChatMessage[], recent: ChatMessage[]) => {
    if (recent.length === 0) return prev;
    const recentKeys = new Set(recent.map(messageReplyKey));
    const oldestRecent = Math.min(...recent.map((m) => new Date(m.createdAt).getTime()));
    const preserved = prev.filter((m) => {
        if (recentKeys.has(messageReplyKey(m))) return false;
        return new Date(m.createdAt).getTime() < oldestRecent;
    });
    return [...preserved, ...recent].sort(sortByCreatedAt);
};

/**
 * 라우트용 래퍼.
 * publicId가 바뀌면 key로 본문 컴포넌트를 통째로 리마운트한다.
 */
export const LogRoomPage = () => {
    const { publicId } = useParams<{ publicId: string }>();
    if (!publicId) return null;
    // 방(publicId)이 바뀌면 모든 상태를 새로 시작해야 하므로 key로 컴포넌트를 통째로 리마운트한다.
    return <LogRoomPageContent key={publicId} publicId={publicId} />;
};

/** 로그방 상세 본문: 타임라인·채팅·업로드·공유 상태와 핸들러 */
const LogRoomPageContent = ({ publicId }: { publicId: string }) => {
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.user);
    const [timelineData, setTimelineData] = useState<logRoomApi.DayLogTimeSlot[]>([]);
    const [chatMessages, setChatMessages] = useState<logRoomApi.ChatMessage[]>([]);
    const [chatNextCursor, setChatNextCursor] = useState<number | null>(null);
    const [chatHasMore, setChatHasMore] = useState(false);
    const [isLoadingOlderChat, setIsLoadingOlderChat] = useState(false);
    const [sharedPosts, setSharedPosts] = useState<logRoomApi.SharedPost[]>([]);
    const [participants, setParticipants] = useState<logRoomApi.LogRoomParticipant[]>([]);
    const [memberNames, setMemberNames] = useState<Record<string, string>>({});
    const [ownerPublicId, setOwnerPublicId] = useState<string | null>(null);
    const [roomName, setRoomName] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [isInputLocked, setIsInputLocked] = useState(false);
    const [replyPhotoId, setReplyPhotoId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(getLocalDateKey());

    // 현재 시각 기준 초기 타임슬롯 계산: 0, 3, 6, 9, 12, 15, 18, 21
    /** 현재 시각을 3시간 단위 슬롯(0~21)으로 변환 */
    const getInitialTimeSlot = () => {
        const hour = new Date().getHours();
        return Math.floor(hour / 3) * 3;
    };
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(getInitialTimeSlot());

    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [markedDates, setMarkedDates] = useState<Set<string>>(() => new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingChatsRef = useRef<{ content: string; createdAt: string; photoPublicId?: string }[]>([]);
    const aiDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadedCalendarMonthsRef = useRef<Set<string>>(new Set());
    const { uploadToR2 } = useR2Upload();
    const isMobileDevice = isMobile();

    useEffect(() => {
        return () => {
            if (aiDebounceTimerRef.current) clearTimeout(aiDebounceTimerRef.current);
        };
    }, []);

    // 현재 보고 있는 날짜에 로그가 있으면 달력 표시에 반영 (effect로 markedDates에 되써넣지 않고,
    // 렌더링 시점에 파생시켜 react-hooks/set-state-in-effect를 피한다)
    const markedDatesWithCurrent = useMemo(() => {
        const hasCurrentDayLog = timelineData.some((slot) => slot.entries.length > 0);
        if (!hasCurrentDayLog || markedDates.has(selectedDate)) return markedDates;
        const next = new Set(markedDates);
        next.add(selectedDate);
        return next;
    }, [markedDates, timelineData, selectedDate]);

    /** 달력에 표시할 월의 로그 있는 날짜들을 조회해 markedDates에 반영 */
    const loadCalendarMonth = useCallback(async (year: number, month: number) => {
        if (!publicId) return;
        const monthKey = `${year}-${month}`;
        if (loadedCalendarMonthsRef.current.has(monthKey)) return;
        loadedCalendarMonthsRef.current.add(monthKey);

        // 해당 월 모든 날짜에 로그 존재 여부를 병렬 조회해 달력 마크에 반영
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
            const day = String(i + 1).padStart(2, '0');
            const mm = String(month + 1).padStart(2, '0');
            return `${year}-${mm}-${day}`;
        });

        const results = await Promise.all(
            dates.map(async (date) => {
                try {
                    const slots = await logRoomApi.getDayLog(publicId, date);
                    return slots.some((slot) => slot.entries.length > 0) ? date : null;
                } catch {
                    return null;
                }
            }),
        );

        setMarkedDates((prev) => {
            const next = new Set(prev);
            results.forEach((date) => {
                if (date) next.add(date);
            });
            return next;
        });
    }, [publicId]);

    // 방의 공유된 게시물 목록을 새로 불러온다. 다른 탭/페이지(홈 피드)에서 게시물을 삭제/공유하면
    // 이 페이지의 sharedPosts가 낡은 채로 남아 "이미 공유된 시간대예요"가 잘못 표시될 수 있어서,
    // 날짜가 바뀌거나 탭에 다시 포커스가 올 때마다 재조회한다.
    /** 공유 게시물 목록 재조회 */
    const fetchSharedPosts = useCallback(async () => {
        if (!publicId) return;
        try {
            const postResponse = await logRoomApi.getLogRoomPosts(publicId);
            setSharedPosts(postResponse.content);
        } catch (e) {
            console.error(getErrorMessage(e, '공유된 게시물을 불러오는 중 오류가 발생했습니다.'));
        }
    }, [publicId]);

    // 타임라인은 선택한 날짜가 바뀔 때마다 다시 조회
    useEffect(() => {
        if (!publicId) return;

        /** 선택 날짜의 데이로그(타임라인) 조회 */
        const fetchTimeline = async () => {
            try {
                const timelineResponse = await logRoomApi.getDayLog(publicId, selectedDate);
                setTimelineData(timelineResponse);
            } catch (e) {
                console.error(getErrorMessage(e, '타임라인을 불러오는 중 오류가 발생했습니다.'));
            }
        };
        // fetchTimeline/fetchSharedPosts는 비동기 함수라 setState는 await 이후 콜백에서 실행되지만,
        // react-hooks v7의 set-state-in-effect가 이를 정적으로 감지해 오탐 경고를 낸다.
        /* eslint-disable react-hooks/set-state-in-effect */
        fetchTimeline();
        fetchSharedPosts();
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [publicId, selectedDate, fetchSharedPosts]);

    // 탭이 다시 포커스될 때(다른 탭/페이지에서 공유·삭제하고 돌아온 경우 등) 최신 상태로 갱신
    useEffect(() => {
        window.addEventListener('focus', fetchSharedPosts);
        return () => window.removeEventListener('focus', fetchSharedPosts);
    }, [fetchSharedPosts]);

    // 채팅/방 정보는 방 진입 시 한 번만 (날짜 변경으로 채팅 페이지네이션을 리셋하지 않음)
    useEffect(() => {
        if (!publicId) return;

        /** 채팅 최근 페이지·참가자·캐릭터 이름 등 방 메타 로드 */
        const fetchRoomData = async () => {
            try {
                const chatResponse = await logRoomApi.getChatMessages(publicId, { size: CHAT_PAGE_SIZE });
                setChatMessages(
                    expandChatBatches(publicId, applyPhotoReplyCache(publicId, chatResponse.messages)),
                );
                setChatNextCursor(chatResponse.nextCursor);
                setChatHasMore(chatResponse.hasMore);

                const roomListResponse = await logRoomApi.getMyLogRooms();
                const room = roomListResponse.content.find(r => r.publicId === publicId);
                console.log("Room List Response:", roomListResponse);
                if (room) {
                    console.log("Participants:", room.participants, "Owner Public ID:", room.ownerPublicId);
                    setParticipants(room.participants);
                    setOwnerPublicId(room.ownerPublicId);
                    setRoomName(room.name);

                    const ownerParticipant = room.participants.find(p => p.isOwner);
                    if (ownerParticipant) {
                        setMemberNames(prev => ({ ...prev, [ownerParticipant.memberPublicId]: room.ownerNickname }));
                    }

                    const missingIds = room.participants
                        .filter(p => !p.isUser && !p.isOwner && !(p.memberPublicId in memberNames))
                        .map(p => p.memberPublicId);

                    if (missingIds.length > 0) {
                        const results = await Promise.allSettled(
                            missingIds.map(id => logRoomApi.getLogCharacterCard(publicId, id))
                        );
                        const newNames: Record<string, string> = {};
                        results.forEach((result, i) => {
                            if (result.status === 'fulfilled') newNames[missingIds[i]] = result.value.name;
                        });
                        setMemberNames(prev => ({ ...prev, ...newNames }));
                    }
                }
            } catch (e) {
                console.error(getErrorMessage(e, '데이터를 불러오는 중 오류가 발생했습니다.'));
            }
        };
        fetchRoomData();
        // memberNames는 초기 로드 시 비어 있는 것이 정상이므로 deps에서 제외
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicId]);

    /** 커서 기반 이전 채팅 페이지를 앞에 이어 붙임 */
    const loadOlderChatMessages = useCallback(async () => {
        if (!publicId || !chatHasMore || chatNextCursor == null || isLoadingOlderChat) return;

        setIsLoadingOlderChat(true);
        try {
            const response = await logRoomApi.getChatMessages(publicId, {
                cursor: chatNextCursor,
                size: CHAT_PAGE_SIZE,
            });
            const older = expandChatBatches(
                publicId,
                applyPhotoReplyCache(publicId, response.messages),
            );

            setChatMessages((prev) => {
                const existing = new Set(prev.map(messageReplyKey));
                const uniqueOlder = older.filter((m) => !existing.has(messageReplyKey(m)));
                return [...uniqueOlder, ...prev].sort(sortByCreatedAt);
            });
            setChatNextCursor(response.nextCursor);
            setChatHasMore(response.hasMore);
        } catch (e) {
            console.error(getErrorMessage(e, '이전 채팅을 불러오는 중 오류가 발생했습니다.'));
        } finally {
            setIsLoadingOlderChat(false);
        }
    }, [publicId, chatHasMore, chatNextCursor, isLoadingOlderChat]);

    /** 파일 선택 후 공유된 슬롯이 아니면 업로드 모달 오픈 */
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (isSelectedSlotShared) {
            alert('이미 공유된 시간대입니다. 더 이상 업로드할 수 없습니다.');
            return;
        }

        setPendingFile(file);
        setIsUploadModalOpen(true);
    };

    /** 업로드 중이면 닫지 않고, 모달·선택 파일 초기화 */
    const closeUploadModal = () => {
        if (isUploading) return;
        setIsUploadModalOpen(false);
        setPendingFile(null);
    };

    /** R2 업로드 후 로그 사진 API 호출·타임라인 갱신 */
    const handleUploadSubmit = async (caption: string) => {
        if (!pendingFile || !publicId) return;

        setIsUploading(true);
        try {
            const imageUrl = await uploadToR2(pendingFile, 'LOG');
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            await logRoomApi.uploadLogPhoto(
                publicId,
                { imageUrl, caption: caption || undefined },
                timezone,
            );

            const updatedResponse = await logRoomApi.getDayLog(publicId, selectedDate);
            setTimelineData(updatedResponse);
            setMarkedDates((prev) => {
                const next = new Set(prev);
                next.add(selectedDate);
                return next;
            });

            setIsUploadModalOpen(false);
            setPendingFile(null);
        } catch (error) {
            const message = getErrorMessage(error, '로그 업로드에 실패했습니다.');
            console.error(message);
            alert(message);
        } finally {
            setIsUploading(false);
        }
    };

    // 유저 메시지는 화면에 각각 표시하고, 일반 채팅은 5초 디바운스 후 서버로 묶어서 전송한다.
    // 사진 답장은 sendMessage에서 디바운스 없이 바로 flush한다.
    /** 대기 중인 채팅을 묶어 서버 전송 후 AI 답장까지 반영 */
    const flushPendingChats = async () => {
        if (!publicId || pendingChatsRef.current.length === 0) return;

        const batch = [...pendingChatsRef.current];
        pendingChatsRef.current = [];
        if (aiDebounceTimerRef.current) {
            clearTimeout(aiDebounceTimerRef.current);
            aiDebounceTimerRef.current = null;
        }

        const batchedContent = batch.map((m) => m.content).join('\n');
        const lastPhotoId = [...batch].reverse().find((m) => m.photoPublicId)?.photoPublicId;

        setIsInputLocked(true);
        setIsAiTyping(true);

        try {
            await logRoomApi.sendChatMessage(publicId, {
                message: batchedContent,
                photoPublicId: lastPhotoId,
            });

            // POST 직후 단발 GET은 AI 저장 전 스냅샷을 받을 수 있어,
            // 유저 메시지 뒤에 AI 답장이 보일 때까지 기다린다.
            const { response: updatedResponse, sorted, combinedIdx } = await waitForAiReply(
                publicId,
                batchedContent,
            );

            const before = combinedIdx >= 0 ? sorted.slice(0, combinedIdx) : sorted;
            const after = combinedIdx >= 0 ? sorted.slice(combinedIdx + 1) : [];

            saveChatBatchSplit(
                publicId,
                batchedContent,
                batch.map((m) => ({
                    content: m.content,
                    createdAt: m.createdAt,
                    photoPublicId: m.photoPublicId ?? null,
                })),
            );

            const individuals = batch.map((m) => ({
                isMe: true as const,
                content: m.content,
                createdAt: m.createdAt,
                quotedPhotoPublicId: m.photoPublicId ?? null,
            }));

            let afterMessages = after;
            if (lastPhotoId) {
                // AI 답장에 사진 연결을 남기기 위해 묶인 원본 기준으로 캐시 등록 후, 표시용 after만 사용
                registerPhotoReply(publicId, updatedResponse.messages, batchedContent, lastPhotoId);
                afterMessages = after.map((m) =>
                    m.isMe ? m : { ...m, quotedPhotoPublicId: lastPhotoId },
                );
            } else {
                afterMessages = applyPhotoReplyCache(publicId, after);
            }

            const recent = [
                ...expandChatBatches(publicId, applyPhotoReplyCache(publicId, before)),
                ...individuals,
                ...afterMessages,
            ];
            setChatMessages((prev) => mergePreservingOlder(prev, recent));
        } catch (e) {
            console.error(getErrorMessage(e, '메시지 전송 중 오류가 발생했습니다.'));
            try {
                const updatedResponse = await logRoomApi.getChatMessages(publicId, { size: CHAT_PAGE_SIZE });
                const recent = expandChatBatches(
                    publicId,
                    applyPhotoReplyCache(publicId, updatedResponse.messages),
                );
                setChatMessages((prev) => mergePreservingOlder(prev, recent));
            } catch {
                /* 무시 */
            }
        } finally {
            setIsAiTyping(false);
            setIsInputLocked(false);
        }
    };

    /** 화면엔 즉시 말풍선 추가, 서버 전송은 디바운스(사진 답장은 즉시) */
    const sendMessage = (rawContent: string) => {
        const content = rawContent.trim();
        if (!publicId || !content || isInputLocked || isAiTyping) return;

        const quotedPhotoPublicId = replyPhotoId || undefined;
        const createdAt = new Date().toISOString();
        setReplyPhotoId(null);

        pendingChatsRef.current.push({ content, createdAt, photoPublicId: quotedPhotoPublicId });

        // 화면에는 항상 개별 말풍선으로 표시
        setChatMessages((prev) => [
            ...prev,
            {
                isMe: true,
                content,
                createdAt,
                quotedPhotoPublicId: quotedPhotoPublicId ?? null,
            },
        ]);

        if (aiDebounceTimerRef.current) clearTimeout(aiDebounceTimerRef.current);

        // 사진 답장은 디바운스 없이 바로 전송해 AI가 즉시 응답하도록 한다.
        // 일반 메시지는 연속 입력을 묶기 위해 5초 디바운스를 유지한다.
        if (quotedPhotoPublicId) {
            aiDebounceTimerRef.current = null;
            void flushPendingChats();
        } else {
            aiDebounceTimerRef.current = setTimeout(() => {
                void flushPendingChats();
            }, 5000);
        }
    };

    // 현재 선택된 (날짜, 시간대)를 게시물로 공유하고, 모든 로그방의 공유 게시물이 모이는
    // 홈 피드(/feed)로 이동한다. 방금 공유한 게시물 정보는 state로 함께 전달해
    // 피드 페이지에서 곧바로 상세를 열어 보여줄 수 있게 한다.
    /** 선택 슬롯을 공유 게시물로 올리고 피드로 이동 */
    const handleShare = async () => {
        if (!publicId || isSharing) return;

        const hasPhotoInSlot = (timelineData.find((slot) => slot.timeSlot === selectedTimeSlot)?.entries.length ?? 0) > 0;
        if (!hasPhotoInSlot) {
            alert('업로드된 사진이 없습니다.');
            return;
        }

        setIsSharing(true);
        try {
            const newPost = await logRoomApi.shareLog(publicId, {
                postDate: selectedDate,
                timeSlot: selectedTimeSlot,
            });
            navigate('/feed', { state: { newPost } });
        } catch (error) {
            const message = getErrorMessage(error, '게시물 공유에 실패했습니다.');
            console.error(message);
            alert(message);
        } finally {
            setIsSharing(false);
        }
    };

    // 방장만 방을 삭제할 수 있다 (LogRoomHeader에서 isOwner일 때만 버튼 노출).
    /** 로그방 삭제 후 목록으로 이동 */
    const handleDeleteRoom = async () => {
        if (isDeleting) return;
        if (!confirm('정말로 이 로그방을 삭제하시겠습니까? 대화, 사진, 게시물이 모두 삭제되며 되돌릴 수 없습니다.')) return;

        setIsDeleting(true);
        try {
            await logRoomApi.deleteLogRoom(publicId);
            navigate('/log-rooms', { replace: true });
        } catch (error) {
            const message = getErrorMessage(error, '로그방 삭제에 실패했습니다.');
            console.error(message);
            alert(message);
        } finally {
            setIsDeleting(false);
        }
    };

    // 달력에서 날짜를 고르면, 그 날짜에 로그가 있는 타임슬롯 중 가장 늦은 구간으로 이동한다.
    /** 날짜 변경 시 타임라인 로드 후 최신 슬롯 선택 */
    const handleDateChange = async (date: string) => {
        setSelectedDate(date);
        if (!publicId) return;

        try {
            const slots = await logRoomApi.getDayLog(publicId, date);
            setTimelineData(slots);

            const slotsWithLogs = slots.filter((slot) => slot.entries.length > 0);
            if (slotsWithLogs.length === 0) return;

            // 0시는 UI에서 24로 보이므로, 늦은 시간 비교 시 0을 24로 취급한다.
            const rank = (timeSlot: number) => (timeSlot === 0 || timeSlot === 24 ? 24 : timeSlot);
            const latest = slotsWithLogs.reduce((best, slot) =>
                rank(slot.timeSlot) > rank(best.timeSlot) ? slot : best,
            );
            setSelectedTimeSlot(latest.timeSlot);
        } catch (e) {
            console.error(getErrorMessage(e, '날짜별 로그를 불러오는 중 오류가 발생했습니다.'));
        }
    };

    // 채팅에서 특정 로그/게시물을 눌렀을 때 해당 (날짜, 시간대)의 타임라인으로 이동.
    // 모바일에서는 채팅과 타임라인이 배타적으로 표시되므로, 채팅을 닫아 타임라인이 보이게 한다.
    /** 채팅에서 지정한 날짜·슬롯으로 타임라인 점프 */
    const jumpToLog = (date: string, timeSlot: number) => {
        setSelectedDate(date);
        setSelectedTimeSlot(timeSlot);
        if (isMobileDevice) setIsChatOpen(false);
    };

    const characterParticipant = participants.find(p => !p.isUser);
    const characterName = characterParticipant ? memberNames[characterParticipant.memberPublicId] : undefined;

    // 공유는 조회 시점에 사진을 live join하므로, 이미 공유된 (날짜, 시간대)에 새 사진을 올리면
    // 이미 공유된 게시물 내용이 뒤늦게 바뀌어 보이게 된다 — 그런 시간대는 업로드를 막는다.
    const isSelectedSlotShared = sharedPosts.some(
        (p) => p.postDate === selectedDate && p.timeSlot === selectedTimeSlot,
    );

    return (
        <PageLayout
        >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />

            <LogPhotoUploadModal
                isOpen={isUploadModalOpen}
                file={pendingFile}
                isUploading={isUploading}
                onClose={closeUploadModal}
                onSubmit={handleUploadSubmit}
            />

            <LogRoomHeader
                roomName={roomName}
                participants={participants}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                selectedTimeSlot={selectedTimeSlot}
                onTimeSlotChange={setSelectedTimeSlot}
                isChatOpen={isChatOpen}
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                timelineData={timelineData}
                markedDates={markedDatesWithCurrent}
                onCalendarMonthChange={loadCalendarMonth}
                onShare={handleShare}
                isSharing={isSharing}
                isOwner={!!ownerPublicId && ownerPublicId === currentUser?.publicId}
                onDelete={handleDeleteRoom}
                isDeleting={isDeleting}
            />

            <div className="flex max-h-[calc(100vh-263.5px)]">
                {isMobileDevice ? !isChatOpen ? <LogTimeline
                    timelineData={timelineData}
                    sharedPosts={sharedPosts}
                    chatMessages={chatMessages}
                    participants={participants}
                    memberNames={memberNames}
                    selectedDate={selectedDate}
                    selectedTimeSlot={selectedTimeSlot}
                    ownerPublicId={ownerPublicId}
                    onUpload={() => fileInputRef.current?.click()}
                    onReply={setReplyPhotoId}
                /> : null : <LogTimeline
                    timelineData={timelineData}
                    sharedPosts={sharedPosts}
                    chatMessages={chatMessages}
                    participants={participants}
                    memberNames={memberNames}
                    selectedDate={selectedDate}
                    selectedTimeSlot={selectedTimeSlot}
                    ownerPublicId={ownerPublicId}
                    onUpload={() => fileInputRef.current?.click()}
                    onReply={setReplyPhotoId}
                />}
                {isChatOpen && (
                    <ChatPanel
                        roomPublicId={publicId ?? ''}
                        chatMessages={chatMessages}
                        sharedPosts={sharedPosts}
                        timelineData={timelineData}
                        selectedDate={selectedDate}
                        isAiTyping={isAiTyping}
                        isInputDisabled={isInputLocked || isAiTyping}
                        onSendMessage={sendMessage}
                        replyPhotoId={replyPhotoId}
                        onReply={setReplyPhotoId}
                        onJumpToLog={jumpToLog}
                        myImageUrl={participants.find(p => p.isUser)?.imageUrl ?? null}
                        characterName={characterName}
                        characterImageUrl={characterParticipant?.imageUrl ?? null}
                        hasMore={chatHasMore}
                        isLoadingOlder={isLoadingOlderChat}
                        onLoadOlder={loadOlderChatMessages}
                    />
                )}
            </div>
        </PageLayout>
    );
};

