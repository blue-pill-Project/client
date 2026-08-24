import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import PageLayout from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';
import { useCharacterLibrary } from '../../hooks/useCharacterLibrary';
import type { CharacterCard } from '../../lib/characterApi';
import PageHeader from '../../components/common/PageHeader';
import CharacterCardComponent from '../../components/character/CharacterCard';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { CharacterInfoModal } from '../../components/character/CharacterInfoModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useDeleteCharacter } from '../../hooks/useDeleteCharacter';
import { LibrarySection } from '../../components/common/LibrarySection';

const CharacterLibraryPage = () => {
  const navigate = useNavigate();
  const {
    characters,
    loading,
    hasNext,
    keyword,
    setKeyword,
    sort,
    setSort,
    loadMore,
    removeCharacter,
    totalCount
  } = useCharacterLibrary();

  const [isFABOpen, setIsFABOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterCard | null>(null);
  const { user: currentUser } = useAuthStore();
  const { deleteCharacter } = useDeleteCharacter();

  const sortOptions = [
    { label: '최신순', value: 'LATEST' },
    { label: '인기순', value: 'POPULAR' },
  ];

  return (
    <PageLayout>
      {/* --- Character Detail Modal --- */}
      {selectedCharacter && (
        <CharacterInfoModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />
      )}

      {/* --- Main UI --- */}
      <PageHeader
        category="LIBRARY"
        title="Characters"
        description="BLUEPILL에서 만들어진 모든 캐릭터를 탐색하고, 나만의 캐릭터 제작을 위한 영감을 얻어보세요."
        action={{
          label: "캐릭터 생성하기",
          onClick: () => navigate('/library/new'),
          icon: <PlusIcon />
        }}
      />

      <LibrarySection
        title="라이브러리"
        count={totalCount}
        sortOptions={sortOptions}
        sort={sort}
        onSortChange={(val) => setSort(val as 'LATEST' | 'POPULAR')}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onClearKeyword={() => setKeyword('')}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-7 gap-y-8">
        {characters.map((char) => (
          <CharacterCardComponent
            key={char.publicId}
            isOwner={currentUser?.publicId === char.creatorPublicId}
            char={char}
            onClick={() => setSelectedCharacter(char)}
            onEdit={() => navigate(`/library/edit/${char.publicId}`)}
            onDelete={() => deleteCharacter(char.publicId, () => removeCharacter(char.publicId))} />
        ))}
      </div>

      {hasNext && (
        <div className="flex justify-center my-16">
          <Button
            variant="Outline"
            size="m"
            loading={loading}
            onClick={loadMore}
            className="rounded-full px-8"
          >
            Load More
          </Button>
        </div>
      )}

      {/* FAB & Menu */}
      <div className="fixed bottom-12 right-12 z-150">
        <div className={cn("absolute bottom-20 right-0 flex flex-col gap-2 transition-all duration-300 origin-bottom scale-95 opacity-0 pointer-events-none", isFABOpen && "scale-100 opacity-100 pointer-events-auto")}>
          <button
            onClick={() => navigate('/feed/new')}
            className="flex items-center gap-3 px-4 py-2.5 bg-base-900 border border-base-800 rounded-xl text-base-50 hover:bg-base-800 transition-all whitespace-nowrap shadow-xl cursor-pointer"
          >
            <PlusIcon /> <span className="text-sm font-bold">게시물</span>
          </button>
          <button
            onClick={() => navigate('/library/new')}
            className="flex items-center gap-3 px-4 py-2.5 bg-base-900 border border-base-800 rounded-xl text-base-50 hover:bg-base-800 transition-all whitespace-nowrap shadow-xl cursor-pointer"
          >
            <PlusIcon /> <span className="text-sm font-bold">캐릭터 카드</span>
          </button>
        </div>
        <button onClick={() => setIsFABOpen(!isFABOpen)} className={cn("size-16 bg-primary/20 backdrop-blur-2xl border border-primary/40 rounded-full flex items-center justify-center text-primary shadow-2xl transition-all cursor-pointer", isFABOpen ? "rotate-45" : "hover:scale-110")}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
      </div>
    </PageLayout>
  );
};

export default CharacterLibraryPage;
