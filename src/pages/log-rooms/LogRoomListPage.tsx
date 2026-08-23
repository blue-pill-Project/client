import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/common/Button';
import { getMyLogRooms } from '../../lib/logRoomApi';
import type { LogRoomListItem } from '../../lib/logRoomApi';
import PageHeader from '../../components/common/PageHeader';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { LibrarySection } from '../../components/common/LibrarySection';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { LockIcon } from '../../components/icons/LockIcon';
import { CrownIcon } from '../../components/icons/CrownIcon';
import { getErrorMessage, getImageUrl } from '../../lib/utils';

const SkeletonCard = () => (
  <div className="bg-base-950/40 border border-base-900/60 rounded-[28px] overflow-hidden animate-pulse">
    <div className="aspect-video bg-base-900" />
    <div className="p-6 space-y-4">
      <div className="h-5 bg-base-900 rounded-lg w-2/3" />
      <div className="pt-4 border-t border-base-900/60 flex justify-between">
        <div className="h-3 bg-base-900 rounded-lg w-24" />
        <div className="h-3 bg-base-900 rounded-lg w-4" />
      </div>
    </div>
  </div>
);

type SortOption = 'LATEST' | 'NAME';

const LogRoomListPage = () => {
  const navigate = useNavigate();
  const [logRooms, setLogRooms] = useState<LogRoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<SortOption>('LATEST');

  const sortOptions = [
    { label: '최신 순', value: 'LATEST' },
    { label: '이름 순', value: 'NAME' },
  ];

  const fetchLogRooms = async (isFirst = true) => {
    setLoading(true);
    try {
      const cursor = isFirst ? undefined : (nextCursor || undefined);
      const response = await getMyLogRooms({ cursor, size: 12 });
      const { content, nextCursor: newCursor, hasNext: newHasNext, total } = response;

      if (isFirst) {
        setLogRooms(content);
      } else {
        setLogRooms((prev) => [...prev, ...content]);
      }
      setNextCursor(newCursor);
      setHasNext(newHasNext);
      setTotalCount(total);
    } catch (err) {
      console.error(getErrorMessage(err, '로그방 목록을 가져오는 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 마운트 시 목록을 페칭하는 표준 패턴 — react-hooks v7의 set-state-in-effect는
    // fetchLogRooms 내부의 setState를 정적으로 감지해 여기서 오탐 경고를 낸다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogRooms(true);
  }, []);

  const filteredRooms = logRooms
    .filter(room =>
      room.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      room.ownerNickname.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'NAME') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <PageLayout>
      <PageHeader
        category="Vlog"
        title="로그방"
        action={{
          label: "로그방 만들기",
          onClick: () => navigate('/log-rooms/new'),
          icon: <PlusIcon />,
        }}
      />

      <LibrarySection
        title="로그방"
        count={totalCount}
        sortOptions={sortOptions}
        sort={sort}
        onSortChange={(val) => setSort(val as SortOption)}
        keyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
        onClearKeyword={() => setSearchKeyword('')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && logRooms.length === 0 ? (
          [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          filteredRooms.map((room) => (
            <article
              key={room.publicId}
              className="group bg-base-950 rounded-[28px] overflow-hidden border border-base-900 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(98,246,181,0.1)] transition-all duration-500 cursor-pointer"
              onClick={() => navigate(`/log-rooms/${room.publicId}`, { state: { roomName: room.name } })}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-base-900">
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={getImageUrl(room.backgroundImageUrl) || '/default-room.png'}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Overlapping participant avatars */}
                <div className="absolute -bottom-5 right-4 z-10 flex -space-x-3">
                  {room.participants.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="w-11 h-11 rounded-full border-2 border-black/40 overflow-hidden bg-base-800">
                      <img src={getImageUrl(p.imageUrl) || '/default-profile.svg'} alt="participant" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info panel */}
              <div className="p-6">
                <p className="text-[11px] text-base-500 font-medium truncate mb-1">
                  {room.participants.map(p => p.name).join(', ')}
                </p>
                <h3 className="flex items-center gap-2 text-header-3 font-bold text-white tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {room.name}
                  {room.isOwner && <CrownIcon className="shrink-0 text-primary" />}
                </h3>

                <div className="mt-4 pt-4 border-t border-base-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-base-500">
                    <CalendarIcon />
                    <span className="text-[11px] font-medium">
                      {new Date(room.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })} 생성
                    </span>
                  </div>
                  {!room.isPublic && <LockIcon className="text-base-500" />}
                </div>
              </div>
            </article>
          ))
        )}

        {filteredRooms.length === 0 && !loading && (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-base-900/50 rounded-[40px] bg-base-950/20">
            <div className="w-20 h-20 bg-base-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-base-700">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 className="text-header-3 text-base-400 font-bold">No log rooms found</h3>
            <p className="text-body-2 text-base-600 mt-2 max-w-sm mx-auto">참여 중인 로그방이 없거나 검색 결과가 없습니다. 새로운 로그방을 만들어 시작해보세요!</p>
            <Button variant="Outline" size="m" className="mt-8 rounded-xl" onClick={() => navigate('/log-rooms/new')}>첫 로그방 만들기</Button>
          </div>
        )}
      </div>

      {hasNext && (
        <div className="flex justify-center mt-20">
          <Button
            variant="Darkoutline"
            size="l"
            className="rounded-2xl px-12"
            loading={loading}
            onClick={() => fetchLogRooms(false)}
          >
            Load More Rooms
          </Button>
        </div>
      )}
    </PageLayout>
  );
};

export default LogRoomListPage;
