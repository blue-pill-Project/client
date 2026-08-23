import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Send } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import { MonthCalendar } from '../../components/common/MonthCalendar';
import { PostDetailModal } from '../../components/log-rooms/PostDetailModal';
import { PlusIcon } from '../../components/icons/PlusIcon';
import * as logRoomApi from '../../lib/logRoomApi';
import type { SharedPost, PostShareResponse, LogRoomParticipant } from '../../lib/logRoomApi';
import { getErrorMessage, getImageUrl } from '../../lib/utils';

interface RoomGroup {
  roomPublicId: string;
  roomName: string;
  participants: LogRoomParticipant[];
  posts: SharedPost[];
}

const formatDisplayDate = (date: string) => date.replaceAll('-', '. ');

const formatTimeSlot = (timeSlot: number) =>
  `${(timeSlot === 0 ? 24 : timeSlot).toString().padStart(2, '0')}:00`;

const SkeletonColumn = () => (
  <div className="space-y-4 animate-pulse">
    <div className="space-y-2 pb-4 border-b border-base-800">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-base-900 rounded-lg w-2/3" />
        <div className="h-4 bg-base-900 rounded-lg w-14" />
      </div>
      <div className="h-3 bg-base-900 rounded-lg w-1/2" />
    </div>
    {[...Array(2)].map((_, i) => (
      <div key={i} className="aspect-4/3 bg-base-900 rounded-2xl" />
    ))}
  </div>
);

const LogRoomPostListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const newPostRef = useRef((location.state as { newPost?: PostShareResponse } | null)?.newPost ?? null);

  const [posts, setPosts] = useState<SharedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SharedPost | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const fetchPosts = async (isFirst = true) => {
    setLoading(true);
    try {
      const cursor = isFirst ? undefined : (nextCursor || undefined);
      const response = await logRoomApi.getPosts({ cursor, size: 12 });

      const nextPosts = isFirst ? response.content : [...posts, ...response.content];
      setPosts(nextPosts);
      setNextCursor(response.nextCursor);
      setHasNext(response.hasNext);

      // 방금 공유 버튼을 눌러 넘어온 경우, 새로 생긴 게시물의 상세를 곧바로 열어 보여준다.
      if (isFirst && newPostRef.current) {
        const justShared = nextPosts.find(p => p.publicId === newPostRef.current?.publicId);
        if (justShared) setSelectedPost(justShared);
        newPostRef.current = null;
      }
    } catch (err) {
      console.error(getErrorMessage(err, '게시물 목록을 가져오는 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 마운트 시 목록을 페칭하는 표준 패턴 — react-hooks v7의 set-state-in-effect는
    // fetchPosts 내부의 setState를 정적으로 감지해 여기서 오탐 경고를 낸다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts(true);
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const filteredPosts = posts.filter(post => {
    if (dateFilter && post.postDate !== dateFilter) return false;
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      const matchesRoom = post.roomName.toLowerCase().includes(keyword);
      const matchesSharer = post.sharer.nickname.toLowerCase().includes(keyword);
      const matchesParticipant = post.participants.some(p => p.name.toLowerCase().includes(keyword));
      const matchesCaption = post.photos.some(p => p.caption?.toLowerCase().includes(keyword));
      if (!matchesRoom && !matchesSharer && !matchesParticipant && !matchesCaption) return false;
    }
    return true;
  });

  // 같은 로그방의 게시물끼리 묶어 컬럼으로 보여준다 (최신 게시물이 있는 방이 먼저)
  const roomGroups = useMemo(() => {
    const groups = new Map<string, RoomGroup>();
    for (const post of filteredPosts) {
      const existing = groups.get(post.roomPublicId);
      if (existing) {
        existing.posts.push(post);
      } else {
        groups.set(post.roomPublicId, {
          roomPublicId: post.roomPublicId,
          roomName: post.roomName,
          participants: post.participants,
          posts: [post],
        });
      }
    }
    return [...groups.values()];
  }, [filteredPosts]);

  return (
    <PageLayout>
      <PageHeader
        category="home"
        title="홈"
        action={{
          label: '로그 업로드',
          onClick: () => navigate('/log-rooms'),
          icon: <PlusIcon />,
        }}
      />

      <div className="flex items-center justify-end gap-3 my-6">
        <div ref={calendarRef} className="relative">
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="flex items-center gap-2 h-10 px-4 rounded-full bg-base-950 border border-base-800 text-base-300 hover:text-white transition-colors text-sm font-medium"
          >
            <Calendar size={16} className="text-base-400" />
            {dateFilter ? formatDisplayDate(dateFilter) : '전체 날짜'}
          </button>
          {isCalendarOpen && (
            <div className="absolute right-0 top-full mt-2 bg-background-main border border-gray-700 rounded-2xl p-4 shadow-xl z-50">
              <MonthCalendar
                value={dateFilter || ''}
                onChange={(date) => {
                  setDateFilter(date === dateFilter ? null : date);
                  setIsCalendarOpen(false);
                }}
              />
            </div>
          )}
        </div>
        <div className="w-55">
          <SearchBar
            variant="dark"
            placeholder="Search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onClear={() => setSearchKeyword('')}
            className="w-full"
          />
        </div>
      </div>

      {loading && posts.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => <SkeletonColumn key={i} />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-40 text-center border-2 border-dashed border-base-900/50 rounded-[40px] bg-base-950/20">
          <h3 className="text-header-3 text-base-400 font-bold">공유된 게시물이 없습니다</h3>
          <p className="text-body-2 text-base-600 mt-2 max-w-sm mx-auto">
            로그방에서 로그를 공유하면 여기에서 모아볼 수 있어요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {roomGroups.map((group) => {
            const latestTimeSlot = group.posts[0]?.timeSlot ?? 0;

            return (
              <section key={group.roomPublicId} className="min-w-0">
                <header className="pb-4 mb-4 border-b border-base-800">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-white tracking-tight truncate">
                      {group.roomName}
                    </h3>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-primary shrink-0 tabular-nums">
                      <Clock size={14} />
                      {formatTimeSlot(latestTimeSlot)}
                    </span>
                  </div>
                  <p className="text-xs text-base-500 mt-1.5 truncate">
                    {group.participants.map((p) => p.name).join(', ')}
                  </p>
                </header>

                <div className="flex flex-col gap-4">
                  {group.posts.map((post) => {
                    const mainPhoto = post.photos[0];
                    const authorName = mainPhoto?.authorName || post.sharer.nickname;
                    const authorImage = mainPhoto?.authorImageUrl || post.sharer.profileImageUrl;
                    const caption = mainPhoto?.caption;

                    return (
                      <article
                        key={post.publicId}
                        className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-base-900 cursor-pointer"
                        onClick={() => setSelectedPost(post)}
                      >
                        {mainPhoto ? (
                          <img
                            src={getImageUrl(mainPhoto.imageUrl) || ''}
                            alt={caption || 'Log'}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-base-700 text-sm">
                            사진 없음
                          </div>
                        )}

                        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-black/35" />

                        <div className="absolute top-3.5 left-3.5 flex items-center gap-2 min-w-0 max-w-[75%]">
                          <img
                            src={getImageUrl(authorImage) || '/default-profile.svg'}
                            alt={authorName}
                            className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                          />
                          <span className="text-sm font-semibold text-white drop-shadow truncate">
                            {authorName}
                          </span>
                        </div>

                        {post.photos.length > 1 && (
                          <div className="absolute top-3.5 right-3.5 text-white text-[11px] font-medium bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            +{post.photos.length - 1}
                          </div>
                        )}

                        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-3">
                          <div className="min-w-0 flex items-baseline gap-2">
                            <span className="text-sm font-bold text-white tabular-nums drop-shadow shrink-0">
                              {formatTimeSlot(post.timeSlot)}
                            </span>
                            {caption && (
                              <p className="text-xs font-medium text-white/90 drop-shadow line-clamp-1">
                                {caption}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label="게시물 보기"
                            className="p-1.5 text-white/90 hover:text-white shrink-0 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPost(post);
                            }}
                          >
                            <Send size={16} className="rotate-[-15deg]" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {hasNext && (
        <div className="flex justify-center mt-20">
          <Button
            variant="Darkoutline"
            size="l"
            className="rounded-2xl px-12"
            loading={loading}
            onClick={() => fetchPosts(false)}
          >
            게시물 더보기
          </Button>
        </div>
      )}

      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </PageLayout>
  );
};

export default LogRoomPostListPage;
