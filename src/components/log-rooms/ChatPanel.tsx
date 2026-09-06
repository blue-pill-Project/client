/**
 * 로그룸 채팅 패널.
 * 메시지·로그 사진을 시간순으로 병합하고, 무한 스크롤·IME 입력을 처리한다.
 */
import { useRef, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { MoreVertical, Reply, Send, X } from 'lucide-react';
import { getDayLog } from '../../lib/logRoomApi';
import type { ChatMessage, SharedPost, DayLogTimeSlot, DayLogEntry } from '../../lib/logRoomApi';
import { getImageUrl, handleAvatarError } from '../../lib/utils';

/** 채팅 타임라인에 넣을 로그 사진 항목 (날짜·슬롯 메타 포함) */
interface LogEntryItem extends DayLogEntry {
  dateKey: string;
  timeSlot: number;
}

/** 채팅 목록의 단일 아이템 (텍스트 메시지 또는 로그 사진) */
interface ChatItem {
  type: 'MESSAGE' | 'LOG';
  data: ChatMessage | LogEntryItem;
}

interface ChatPanelProps {
  roomPublicId: string;
  chatMessages: ChatMessage[];
  sharedPosts: SharedPost[];
  timelineData: DayLogTimeSlot[];
  selectedDate: string;
  isAiTyping: boolean;
  isInputDisabled?: boolean;
  onSendMessage: (content: string) => void;
  replyPhotoId: string | null;
  onReply: (photoPublicId: string | null) => void;
  onJumpToLog: (date: string, timeSlot: number) => void;
  myImageUrl: string | null;
  characterName?: string;
  characterImageUrl: string | null;
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
}

/** ISO 시각을 로컬 YYYY-MM-DD 키로 변환 */
const getDateKey = (isoString: string) => {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** 날짜 키를 UI용 `YYYY.M.D` 문자열로 포맷 */
const formatDateOnly = (dateKey: string) => {
  const [y, m, d] = dateKey.split('-');
  return `${y}.${Number(m)}.${Number(d)}`;
};

/** ISO 시각을 `YYYY. M. D. HH:mm` 타임스탬프로 포맷 */
const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${y}. ${m}. ${d}. ${hh}:${mm}`;
};

/**
 * 이름 마지막 글자의 받침 유무로 "이/가" 주격 조사를 붙인다.
 * 한글 음절이 아니면 "가"로 폴백한다.
 */
const withSubjectParticle = (name: string) => {
  const lastChar = name.charCodeAt(name.length - 1);
  const isHangulSyllable = lastChar >= 0xAC00 && lastChar <= 0xD7A3;
  const hasBatchim = isHangulSyllable && (lastChar - 0xAC00) % 28 !== 0;
  return `${name}${hasBatchim ? '이' : '가'}`;
};

/** DayLog 슬롯 배열을 채팅용 LogEntryItem 평탄화 목록으로 변환 */
const toLogEntryItems = (dateKey: string, slots: DayLogTimeSlot[]): LogEntryItem[] =>
  slots.flatMap(slot =>
    slot.entries.map(entry => ({
      ...entry,
      dateKey,
      timeSlot: slot.timeSlot,
    }))
  );

const LONG_PRESS_MS = 500;

/**
 * 채팅 내 로그 사진.
 * 모바일은 롱프레스, 데스크톱은 호버 3점 메뉴로 답장을 연다.
 */
const ChatLogPhoto = ({
  log,
  onReply,
}: {
  log: LogEntryItem;
  onReply: (photoPublicId: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const didLongPress = useRef(false);

  /** 롱프레스 타이머를 취소한다 */
  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  /** 메뉴 바깥 포인터 다운 시 답장 메뉴를 닫는다 */
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen]);

  const openMenu = () => setMenuOpen(true);

  /** 답장 대상을 부모에 알리고 메뉴를 닫는다 */
  const handleReply = () => {
    setMenuOpen(false);
    onReply(log.photoPublicId);
  };

  return (
    <div className="relative group max-w-60" ref={menuRef}>
      <img
        src={getImageUrl(log.imageUrl) || ''}
        alt={log.caption || '로그 이미지'}
        className="w-full rounded-2xl object-cover border border-gray-800 select-none"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={() => {
          didLongPress.current = false;
          clearLongPress();
          longPressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            openMenu();
          }, LONG_PRESS_MS);
        }}
        onTouchEnd={clearLongPress}
        onTouchMove={clearLongPress}
        onTouchCancel={clearLongPress}
        onClick={(e) => {
          // 롱프레스로 메뉴를 연 직후 발생하는 click은 무시
          if (didLongPress.current) {
            e.preventDefault();
            didLongPress.current = false;
          }
        }}
      />

      {/* 데스크톱: 호버 시 3점 버튼 */}
      <button
        type="button"
        aria-label="사진 메뉴"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        className="hidden md:flex absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
      >
        <MoreVertical size={16} />
      </button>

      {menuOpen && (
        <div className="absolute top-10 right-2 z-20 min-w-[7.5rem] py-1 rounded-xl bg-gray-900 border border-gray-700 shadow-lg">
          <button
            type="button"
            onClick={handleReply}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Reply size={14} />
            답장
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * 로그룸 우측 채팅 패널.
 * 메시지·로그 사진 병합, 상단 무한 스크롤, 사진 답장, IME 안전 입력을 담당한다.
 */
export const ChatPanel = ({
  roomPublicId,
  chatMessages,
  sharedPosts,
  timelineData,
  selectedDate,
  isAiTyping,
  isInputDisabled = false,
  onSendMessage,
  replyPhotoId,
  onReply,
  onJumpToLog,
  myImageUrl,
  characterName,
  characterImageUrl,
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
}: ChatPanelProps) => {
  const scrollRef = useRef<HTMLElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * 입력값은 부모 상태가 아닌 로컬로 관리한다.
   * 타이핑마다 페이지 전체 리렌더를 막고, 한글 IME 조합 중 글자 중복을 방지한다.
   */
  const [inputValue, setInputValue] = useState('');
  /** IME 조합(한글 등) 진행 중이면 Enter 전송을 막기 위한 플래그 */
  const isComposingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const prevMessageCountRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  /** 사용자가 하단 근처일 때만 새 메시지에 자동 스크롤 */
  const shouldStickToBottomRef = useRef(true);
  /** 이전 페이지 prepend 직후 스크롤 보정 중인지 */
  const isPrependingRef = useRef(false);
  /** 코드로 스크롤할 때 상단 로드 트리거를 무시 */
  const isProgrammaticScrollRef = useRef(false);
  /** 최초 하단 정렬이 끝난 뒤에만 상단 로드를 허용 */
  const canLoadOlderRef = useRef(false);
  /** selectedDate 외 과거 날짜 로그 (메시지/공유에 등장해 별도 조회가 필요한 날짜) */
  const [historicalLogsByDate, setHistoricalLogsByDate] = useState<Record<string, LogEntryItem[]>>({});

  /** 채팅·공유에 등장하는 날짜 키 (해당 날짜 로그 사진을 조회하기 위함) */
  const messagePostDateKeys = useMemo(() => [...new Set([
    ...chatMessages.map(m => getDateKey(m.createdAt)),
    ...sharedPosts.map(p => getDateKey(p.createdAt)),
  ])], [chatMessages, sharedPosts]);

  /**
   * selectedDate를 제외한 누락 날짜의 DayLog를 병렬 조회해 historicalLogsByDate에 채운다.
   * selectedDate 로그는 부모 timelineData에서 파생하므로 여기서 조회하지 않는다.
   */
  useEffect(() => {
    if (!roomPublicId) return;
    const missingDates = messagePostDateKeys.filter(d => d !== selectedDate && !(d in historicalLogsByDate));
    if (missingDates.length === 0) return;

    let cancelled = false;
    Promise.all(missingDates.map(async (date) => {
      try {
        const slots = await getDayLog(roomPublicId, date);
        return [date, toLogEntryItems(date, slots)] as const;
      } catch {
        return [date, [] as LogEntryItem[]] as const;
      }
    })).then((results) => {
      if (cancelled) return;
      setHistoricalLogsByDate(prev => {
        const next = { ...prev };
        results.forEach(([date, entries]) => { next[date] = entries; });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [messagePostDateKeys, roomPublicId, historicalLogsByDate, selectedDate]);

  /** 현재 선택 날짜 로그 — 부모 timelineData에서 파생 */
  const selectedDateLogItems = useMemo(
    () => toLogEntryItems(selectedDate, timelineData),
    [selectedDate, timelineData]
  );

  /** 과거 날짜 로그 + 선택 날짜 로그를 합친 전체 로그 목록 */
  const allLogItems = useMemo(() => [
    ...Object.entries(historicalLogsByDate)
      .filter(([date]) => date !== selectedDate)
      .flatMap(([, entries]) => entries),
    ...selectedDateLogItems,
  ], [historicalLogsByDate, selectedDateLogItems, selectedDate]);

  /** photoPublicId → 로그 엔트리 조회 맵 (답장 인용용) */
  const logByPhotoId = useMemo(() => {
    const map = new Map<string, LogEntryItem>();
    for (const log of allLogItems) map.set(log.photoPublicId, log);
    return map;
  }, [allLogItems]);

  const replyTarget = replyPhotoId ? logByPhotoId.get(replyPhotoId) ?? null : null;

  /**
   * 메시지와 로그 사진을 createdAt 기준으로 병합·정렬한다.
   * 공유 게시물(POST) 카드는 채팅에 올리지 않으며, 사진 답장은 말풍선에 인용 이미지로 표시한다.
   */
  const chatItems: ChatItem[] = useMemo(() => [
    ...chatMessages.map(m => ({ type: 'MESSAGE' as const, data: m })),
    ...allLogItems.map(log => ({ type: 'LOG' as const, data: log })),
  ].sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()),
  [chatMessages, allLogItems]);

  /**
   * 이전 메시지 prepend 후 스크롤 앵커 유지.
   * 새 scrollHeight와 이전 height 차이만큼 scrollTop을 보정한다.
   */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !isPrependingRef.current) return;
    isProgrammaticScrollRef.current = true;
    el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
    prevScrollTopRef.current = el.scrollTop;
    isPrependingRef.current = false;
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, [chatMessages]);

  /**
   * 새 메시지/AI 타이핑 시 하단에 붙는다.
   * prepend·사용자가 위로 올린 상태·메시지 수 감소는 자동 스크롤을 생략한다.
   * 최초 하단 정렬 후에만 상단 infinite scroll을 허용한다.
   */
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const nextCount = chatMessages.length;
    prevMessageCountRef.current = nextCount;

    if (isLoadingOlder || isPrependingRef.current) return;
    if (nextCount <= prevCount && !isAiTyping) return;
    if (!shouldStickToBottomRef.current && prevCount > 0) return;

    const el = scrollRef.current;
    isProgrammaticScrollRef.current = true;
    chatEndRef.current?.scrollIntoView({ behavior: prevCount === 0 ? 'auto' : 'smooth' });
    requestAnimationFrame(() => {
      if (el) prevScrollTopRef.current = el.scrollTop;
      isProgrammaticScrollRef.current = false;
      canLoadOlderRef.current = true;
    });
  }, [chatMessages, isAiTyping, isLoadingOlder]);

  /** 상단 이전 대화 로드 요청 — 현재 scrollHeight를 저장해 prepend 후 위치 보정에 쓴다 */
  const requestLoadOlder = () => {
    if (!canLoadOlderRef.current || !hasMore || isLoadingOlder) return;
    const el = scrollRef.current;
    if (el) prevScrollHeightRef.current = el.scrollHeight;
    isPrependingRef.current = true;
    onLoadOlder?.();
  };

  /**
   * 스크롤 핸들러.
   * 하단 근접 여부를 갱신하고, 사용자가 위로 올려 상단 근처일 때만 이전 페이지를 요청한다.
   * 프로그래매틱 스크롤·초기 진입·아래 방향 스크롤은 무시한다.
   */
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;

    const scrollingUp = scrollTop < prevScrollTopRef.current - 1;
    prevScrollTopRef.current = scrollTop;

    if (isProgrammaticScrollRef.current || !canLoadOlderRef.current) return;
    if (!scrollingUp) return;
    if (scrollHeight <= clientHeight + 1) return;
    if (scrollTop > 80) return;

    requestLoadOlder();
  };

  /** 사진 답장 모드를 켜고 입력창에 포커스한다 */
  const handleReplyFromPhoto = (photoPublicId: string) => {
    onReply(photoPublicId);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  /** 입력값을 전송하고 로컬 입력을 비운다 */
  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || isInputDisabled) return;
    onSendMessage(content);
    setInputValue('');
  };

  /** 메시지 말풍선(+인용 사진)을 렌더한다 */
  const renderMessageBubble = (msg: ChatMessage, options?: { showHeader?: boolean }) => {
    const showHeader = options?.showHeader ?? true;
    const quoted = msg.quotedPhotoPublicId
      ? logByPhotoId.get(msg.quotedPhotoPublicId) ?? null
      : null;

    return (
      <div className={`flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!msg.isMe && (
          <img
            src={getImageUrl(characterImageUrl) || '/default-profile.svg'}
            onError={handleAvatarError}
            alt={characterName || '캐릭터'}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
        )}
        <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
          {showHeader && (
            <span className="text-[11px] text-gray-500 mb-1 px-1">
              {!msg.isMe && characterName ? `${characterName} · ` : ''}{formatTimestamp(msg.createdAt)}
            </span>
          )}
          <div className={`flex flex-col gap-1.5 ${msg.isMe ? 'items-end' : 'items-start'}`}>
            {quoted && (
              <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-900/80 max-w-40">
                <img
                  src={getImageUrl(quoted.imageUrl) || ''}
                  alt={quoted.caption || '답장 대상 사진'}
                  className="w-full object-cover"
                />
              </div>
            )}
            <div className="px-3 py-2 rounded-2xl max-w-60 bg-gray-800 text-gray-100">
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      ref={scrollRef}
      onScroll={handleScroll}
      className="max-h-[calc(100vh-263.5px)] w-full lg:w-[25vw] flex flex-col overflow-y-auto hide-scrollbar"
    >
      <div className="p-4 space-y-3 flex-1 mb-11">
        {(isLoadingOlder || hasMore) && (
          <div className="flex justify-center py-2">
            {isLoadingOlder ? (
              <span className="text-[11px] text-gray-500">이전 대화 불러오는 중...</span>
            ) : (
              <button
                type="button"
                onClick={requestLoadOlder}
                className="text-[11px] text-gray-400 hover:text-primary transition-colors cursor-pointer"
              >
                이전 대화 더 보기
              </button>
            )}
          </div>
        )}
        {chatItems.map((item, index) => {
          const dateKey = getDateKey(item.data.createdAt);
          const prevItem = chatItems[index - 1];
          const isNewDay = !prevItem || getDateKey(prevItem.data.createdAt) !== dateKey;

          // 메시지는 timeSlot이 없으므로 작성 시각에서 3시간 단위 슬롯을 역산한다.
          const itemTimeSlot = item.type === 'MESSAGE'
            ? Math.floor(new Date(item.data.createdAt).getHours() / 3) * 3
            : (item.data as LogEntryItem).timeSlot;

          const dateDivider = isNewDay && (
            <div key={`divider-${dateKey}`} className="flex items-center justify-between bg-gray-900/60 rounded-xl px-4 py-2.5">
              <span className="text-xs text-gray-400 font-medium">{formatDateOnly(dateKey)}</span>
              <button onClick={() => onJumpToLog(dateKey, itemTimeSlot)} className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors cursor-pointer">
                로그 보기
              </button>
            </div>
          );

          if (item.type === 'MESSAGE') {
            const msg = item.data as ChatMessage;
            const showHeader = isNewDay || prevItem?.type !== 'MESSAGE' || (prevItem.data as ChatMessage).isMe !== msg.isMe;

            return (
              <div key={`item-${index}`} className="space-y-3">
                {dateDivider}
                {renderMessageBubble(msg, { showHeader })}
              </div>
            );
          }

          const log = item.data as LogEntryItem;

          return (
            <div key={`item-${index}`} className="space-y-3">
              {dateDivider}
              <div className="flex flex-col items-start gap-1.5">
                <span className="text-[11px] text-gray-500 px-1">
                  {log.authorName} · {formatTimestamp(log.createdAt)}
                </span>
                <ChatLogPhoto log={log} onReply={handleReplyFromPhoto} />
                {log.caption && <p className="text-xs text-gray-400 px-1 max-w-60">{log.caption}</p>}
              </div>
            </div>
          );
        })}
        {isAiTyping && (
          <div className="text-xs text-gray-400 p-2 italic">
            {characterName ? `${withSubjectParticle(characterName)} 작성 중...` : 'AI가 생각하는 중...'}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 fixed bottom-11 w-full md:w-[25vw] bg-background-main">
        {replyTarget && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-800 px-2.5 py-2">
            <img
              src={getImageUrl(replyTarget.imageUrl) || ''}
              alt="답장 대상"
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-primary font-medium">사진에 답장</p>
              {replyTarget.caption && (
                <p className="text-xs text-gray-400 truncate">{replyTarget.caption}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="답장 취소"
              onClick={() => onReply(null)}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <img
            src={getImageUrl(myImageUrl) || '/default-profile.svg'}
            onError={handleAvatarError}
            alt="me"
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
          <div className={`flex-1 flex items-center gap-2 bg-gray-900 rounded-full pl-4 pr-1.5 py-1.5 ${isInputDisabled ? 'opacity-50' : ''}`}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onCompositionStart={() => { isComposingRef.current = true; }}
              onCompositionEnd={() => { isComposingRef.current = false; }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || isInputDisabled) return;
                // 한글 등 IME 조합 확정용 Enter는 전송으로 처리하지 않는다
                if (isComposingRef.current || e.nativeEvent.isComposing) return;
                handleSend();
              }}
              placeholder={
                isInputDisabled
                  ? `${characterName || 'AI'}의 답장 대기 중...`
                  : replyPhotoId
                    ? '사진에 답장 중...'
                    : '메시지'
              }
              disabled={isInputDisabled}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-gray-500 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={isInputDisabled}
              className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
