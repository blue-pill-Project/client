import { useRef, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { MoreVertical, Reply, Send, X } from 'lucide-react';
import { getDayLog } from '../../lib/logRoomApi';
import type { ChatMessage, SharedPost, DayLogTimeSlot, DayLogEntry } from '../../lib/logRoomApi';
import { getImageUrl, handleAvatarError } from '../../lib/utils';

interface LogEntryItem extends DayLogEntry {
  dateKey: string;
  timeSlot: number;
  createdAt: string;
}

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

const getDateKey = (isoString: string) => {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateOnly = (dateKey: string) => {
  const [y, m, d] = dateKey.split('-');
  return `${y}.${Number(m)}.${Number(d)}`;
};

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${y}. ${m}. ${d}. ${hh}:${mm}`;
};

// 이름 마지막 글자의 받침 유무로 "이/가" 주격 조사를 고른다 (한글이 아니면 "가"로 폴백)
const withSubjectParticle = (name: string) => {
  const lastChar = name.charCodeAt(name.length - 1);
  const isHangulSyllable = lastChar >= 0xAC00 && lastChar <= 0xD7A3;
  const hasBatchim = isHangulSyllable && (lastChar - 0xAC00) % 28 !== 0;
  return `${name}${hasBatchim ? '이' : '가'}`;
};

const toLogEntryItems = (dateKey: string, slots: DayLogTimeSlot[]): LogEntryItem[] =>
  slots.flatMap(slot =>
    slot.entries.map(entry => ({
      ...entry,
      dateKey,
      timeSlot: slot.timeSlot,
      createdAt: `${dateKey}T${slot.timeSlot.toString().padStart(2, '0')}:00:00`,
    }))
  );

const LONG_PRESS_MS = 500;

/** 채팅 로그 사진 — 모바일 롱프레스 / 데스크톱 호버 3점 메뉴로 답장 */
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

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

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
  // 입력값을 부모(페이지 전체)가 아니라 여기 로컬에 둬서, 타이핑할 때마다 페이지 전체가
  // 리렌더링되는 것을 막는다 — 한글 등 IME 조합 입력 중 리렌더링 타이밍이 어긋나면
  // 마지막 글자가 중복 입력되는 문제가 있었음.
  const [inputValue, setInputValue] = useState('');
  const isComposingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const prevMessageCountRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const shouldStickToBottomRef = useRef(true);
  const isPrependingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  /** 최초 하단 정렬이 끝난 뒤에만 상단 로드를 허용 */
  const canLoadOlderRef = useRef(false);
  // selectedDate를 제외한 '과거' 날짜들의 로그 (메시지/공유 게시물 때문에 별도 조회가 필요한 날짜만)
  const [historicalLogsByDate, setHistoricalLogsByDate] = useState<Record<string, LogEntryItem[]>>({});

  // 채팅/공유 게시물에 등장하는 날짜 목록 (그 날짜들의 로그 사진을 별도로 조회하기 위함)
  const messagePostDateKeys = useMemo(() => [...new Set([
    ...chatMessages.map(m => getDateKey(m.createdAt)),
    ...sharedPosts.map(p => getDateKey(p.createdAt)),
  ])], [chatMessages, sharedPosts]);

  useEffect(() => {
    if (!roomPublicId) return;
    // selectedDate는 부모의 timelineData로 렌더 중에 바로 계산하므로 여기서 조회하지 않음
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

  // 현재 보고 있는 날짜(selectedDate)의 로그는 부모가 이미 들고 있는 timelineData에서 직접 파생
  const selectedDateLogItems = useMemo(
    () => toLogEntryItems(selectedDate, timelineData),
    [selectedDate, timelineData]
  );

  const allLogItems = useMemo(() => [
    ...Object.entries(historicalLogsByDate)
      .filter(([date]) => date !== selectedDate)
      .flatMap(([, entries]) => entries),
    ...selectedDateLogItems,
  ], [historicalLogsByDate, selectedDateLogItems, selectedDate]);

  const logByPhotoId = useMemo(() => {
    const map = new Map<string, LogEntryItem>();
    for (const log of allLogItems) map.set(log.photoPublicId, log);
    return map;
  }, [allLogItems]);

  const replyTarget = replyPhotoId ? logByPhotoId.get(replyPhotoId) ?? null : null;

  // 통합된 채팅/로그 목록 정렬 (createdAt 기준)
  // 공유 게시물(POST) 카드는 채팅창에 이미지로 올리지 않는다.
  // 사진 답장은 이미지 아래에 묶지 않고, 메시지 말풍선에 해당 사진을 다시 첨부해 표시한다.
  const chatItems: ChatItem[] = useMemo(() => [
    ...chatMessages.map(m => ({ type: 'MESSAGE' as const, data: m })),
    ...allLogItems.map(log => ({ type: 'LOG' as const, data: log })),
  ].sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()),
  [chatMessages, allLogItems]);

  // 이전 메시지 prepend 시 스크롤 위치 유지
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

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const nextCount = chatMessages.length;
    prevMessageCountRef.current = nextCount;

    // prepend 로딩 중이거나, 메시지 수가 줄/유지되면 하단 고정 스크롤 생략
    if (isLoadingOlder || isPrependingRef.current) return;
    if (nextCount <= prevCount && !isAiTyping) return;
    if (!shouldStickToBottomRef.current && prevCount > 0) return;

    const el = scrollRef.current;
    isProgrammaticScrollRef.current = true;
    chatEndRef.current?.scrollIntoView({ behavior: prevCount === 0 ? 'auto' : 'smooth' });
    // 하단 정렬 완료 후에만 상단 infinite scroll 허용 (초기 scrollTop=0으로 전체 로드되는 것 방지)
    requestAnimationFrame(() => {
      if (el) prevScrollTopRef.current = el.scrollTop;
      isProgrammaticScrollRef.current = false;
      canLoadOlderRef.current = true;
    });
  }, [chatMessages, isAiTyping, isLoadingOlder]);

  const requestLoadOlder = () => {
    if (!canLoadOlderRef.current || !hasMore || isLoadingOlder) return;
    const el = scrollRef.current;
    if (el) prevScrollHeightRef.current = el.scrollHeight;
    isPrependingRef.current = true;
    onLoadOlder?.();
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;

    const scrollingUp = scrollTop < prevScrollTopRef.current - 1;
    prevScrollTopRef.current = scrollTop;

    // 프로그래매틱 스크롤·초기 진입·아래로 스크롤은 무시.
    // 실제로 스크롤 가능한 상태에서, 사용자가 위로 올릴 때만 이전 페이지를 요청한다.
    if (isProgrammaticScrollRef.current || !canLoadOlderRef.current) return;
    if (!scrollingUp) return;
    if (scrollHeight <= clientHeight + 1) return;
    if (scrollTop > 80) return;

    requestLoadOlder();
  };

  const handleReplyFromPhoto = (photoPublicId: string) => {
    onReply(photoPublicId);
    // 답장 선택 후 입력창에 포커스
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || isInputDisabled) return;
    onSendMessage(content);
    setInputValue('');
  };

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
      className="max-h-[calc(100vh-263.5px)] w-full md:w-[25vw] flex flex-col overflow-y-auto hide-scrollbar"
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
