import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/common/Button';
import { createLogRoom } from '../../lib/logRoomApi';
import { useCharacterLibrary } from '../../hooks/useCharacterLibrary';
import { useAuthStore } from '../../store/useAuthStore';
import { cn, getErrorMessage, getImageUrl, handleAvatarError } from '../../lib/utils';
import SearchBar from '../../components/common/SearchBar';
import PageHeader from '../../components/common/PageHeader';

/**
 * 로그방 생성 시 참여 캐릭터를 고르는 모달.
 * 라이브러리 캐릭터를 검색·그리드로 선택한다.
 */
const CharacterSelectModal = ({
  isOpen,
  onClose,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}) => {
  const { characters, loading } = useCharacterLibrary(40);
  const [search, setSearch] = useState('');

  // 이름 키워드로 캐릭터 필터
  const filtered = useMemo(() =>
    characters.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [characters, search]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-base-950 border border-base-800 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-base-900 flex items-center justify-between">
          <h2 className="text-header-3 font-bold text-base-50">캐릭터 선택</h2>
          <button onClick={onClose} className="p-2 text-base-500 hover:text-white transition-colors cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-6 border-b border-base-900">
          <SearchBar
            variant="dark"
            placeholder="캐릭터 이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-base-950/50">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filtered.map(char => (
                <div
                  key={char.publicId}
                  onClick={() => { onSelect(char.publicId); onClose(); }}
                  className="group relative aspect-3/4 rounded-2xl overflow-hidden cursor-pointer border-2 border-base-900 hover:border-primary transition-colors"
                >
                  <img src={getImageUrl(char.imageUrl) || ''} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent opacity-80" />
                  <div className="absolute inset-0 p-3 flex flex-col justify-end">
                    <span className="text-[12px] font-bold text-white truncate">{char.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 로그방 생성 페이지.
 * 방 이름·공개 여부·관계·캐릭터를 설정하고 노드 UI로 미리본 뒤 생성한다.
 */
const LogRoomCreationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { characterId, isPublic: initialIsPublic } = (location.state as { characterId?: string; isPublic?: boolean }) || {};
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPublic, setIsPublic] = useState(initialIsPublic ?? false); // Default false based on UI
  const [participantCount, setParticipantCount] = useState(2); // Default 2

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(characterId || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { characters } = useCharacterLibrary(40);
  const selectedCharacter = useMemo(() =>
    characters.find(c => c.publicId === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  /** 입력값 검증 후 로그방 생성 API 호출·상세로 이동 */
  const handleSubmit = async () => {
    if (!name || !selectedCharacterId) return;
    setIsSubmitting(true);
    try {
      const response = await createLogRoom({
        name,
        characterCardPublicIds: [selectedCharacterId],
        relationship,
        isPublic,
      });
      navigate(`/log-rooms/${response.publicId}`);
    } catch (err) {
      const message = getErrorMessage(err, '로그방 생성에 실패했습니다.');
      console.error(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout containerClassName="max-w-full md:px-0 md:py-0 h-screen overflow-hidden" className='py-0'>

      <div className='flex w-full'>
        {/* 좌측 사이드바: 생성 폼 */}
        <div className="w-100 shrink-0 border-r border-base-900 bg-background-main flex flex-col h-full overflow-y-auto custom-scrollbar">

          <PageHeader title='로그방 생성' category='Vlog' className='px-10' />
          <div className="p-10 flex-1">

            <div className="space-y-12">
              {/* 로그방 이름 */}
              <div>
                <label className="block text-body-2 font-bold text-base-50 mb-2">로그방 이름</label>
                <p className="text-[12px] text-base-600 mb-4">0~12자 이내로 입력해 주세요 (특수문자, 이모지 제외)</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ex 동물 친구들"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 12))}
                    className="w-full bg-transparent border border-base-800 rounded-xl px-4 py-3.5 text-sm text-base-50 focus:border-primary focus:outline-hidden transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-base-600 font-mono">
                    {name.length}/12
                  </span>
                </div>
              </div>

              {/* 공개 여부 */}
              <div>
                <label className="block text-body-2 font-bold text-base-50 mb-4">공개 여부</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-base-400">로그방 {isPublic ? '공개' : '비공개'}</span>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                      isPublic ? "bg-primary" : "bg-base-800"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      isPublic ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>
              </div>

              {/* 초대하기 */}
              <div>
                <label className="block text-body-2 font-bold text-base-50 mb-2">초대하기</label>
                <p className="text-[12px] text-base-600 mb-4 leading-relaxed">
                  로그방은 최대 4명까지 가능합니다.<br />
                  관계를 설정하지 않을시 친한 친구가 기본설정입니다.
                </p>
                <div className="flex gap-4">
                  {[2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setParticipantCount(num)}
                      className={cn(
                        "w-16 h-12 rounded-xl border flex items-center justify-center text-sm font-bold transition-all cursor-pointer",
                        participantCount === num
                          ? "border-primary text-primary bg-primary/5"
                          : "border-base-800 text-base-400 hover:border-base-600"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-base-900 bg-base-950/50 mt-auto">
            <Button
              variant={name && selectedCharacterId ? "solid" : "Darksolid"}
              size="l"
              className={cn(
                "w-full rounded-2xl h-14 font-bold text-sm transition-all",
                !name || !selectedCharacterId ? "opacity-50 cursor-not-allowed text-base-500 bg-base-800" : ""
              )}
              disabled={!name || !selectedCharacterId || isSubmitting}
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              완료하기
            </Button>
          </div>
        </div>

        {/* 우측 캔버스: 관계 노드 UI */}
        <div className="flex-1 bg-[#111214] relative overflow-hidden flex items-center justify-center">

          {/* 연결선·점 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl flex items-center justify-between px-10 pointer-events-none">
            <div className="h-0.5 bg-primary w-full origin-left transform scale-x-100 transition-transform duration-1000"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl flex items-center justify-between px-[170px] pointer-events-none">
            <div className="w-4 h-4 rounded-full border-[3px] border-primary bg-background-main shadow-[0_0_15px_rgba(98,246,181,0.5)] z-10"></div>
            <div className="w-4 h-4 rounded-full border-[3px] border-primary bg-background-main shadow-[0_0_15px_rgba(98,246,181,0.5)] z-10"></div>
            <div className="w-4 h-4 rounded-full border-[3px] border-primary bg-background-main shadow-[0_0_15px_rgba(98,246,181,0.5)] z-10"></div>
            <div className="w-4 h-4 rounded-full border-[3px] border-primary bg-background-main shadow-[0_0_15px_rgba(98,246,181,0.5)] z-10"></div>
          </div>

          {/* 노드 컨테이너 */}
          <div className="relative z-20 flex items-center gap-12 w-full max-w-4xl justify-center">

            {/* 유저(나) 노드 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-45 h-45 rounded-2xl border border-base-800 bg-[#1A1B1E] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
                {user?.profileImageUrl ? (
                  <img src={getImageUrl(user.profileImageUrl) || '/default-profile.svg'} onError={handleAvatarError} alt="me" className="w-full h-full object-cover opacity-90" />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-base-700 flex items-center justify-center text-base-600 mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                )}
                <div className="absolute bottom-4">
                  <div className="px-4 py-1.5 rounded-lg border border-base-700 bg-base-900/80 backdrop-blur-sm flex items-center gap-2">
                    <span className="text-[12px] font-bold text-base-400">⊕</span>
                    <span className="text-[12px] font-medium text-base-300">나</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-base-50">{user?.nickname || '사용자'}</span>
                <span className="text-[11px] px-2 py-0.5 bg-base-800 text-base-400 rounded">#Code</span>
              </div>
            </div>

            {/* 관계 설정 노드 */}
            <div className="w-70 -mt-10">
              <div className="rounded-2xl border-2 border-primary bg-[#1A1B1E] p-6 shadow-[0_0_30px_rgba(98,246,181,0.1)] relative">
                <label className="block text-[12px] font-bold text-base-50 mb-3">관계 설정</label>
                <div className="relative">
                  <textarea
                    placeholder="ex 친한친구"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value.slice(0, 30))}
                    className="w-full bg-[#111214] border border-base-800 rounded-xl px-4 py-4 text-sm text-base-50 focus:border-primary focus:outline-hidden transition-colors resize-none h-24 custom-scrollbar"
                  />
                  <span className="absolute bottom-3 right-4 text-[10px] text-base-600 font-mono">
                    {relationship.length}/30
                  </span>
                </div>
              </div>
            </div>

            {/* 캐릭터 노드 */}
            <div className="flex flex-col items-center gap-4">
              {selectedCharacter ? (
                // 선택됨
                <>
                  <div className="w-45 h-45 rounded-2xl border-2 border-primary overflow-hidden shadow-[0_0_30px_rgba(98,246,181,0.15)] relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
                    <img src={getImageUrl(selectedCharacter.imageUrl) || ''} alt={selectedCharacter.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-sm font-bold text-white">변경하기</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-base-50">{selectedCharacter.name}</span>
                    <span className="text-[11px] px-2 py-0.5 bg-base-800 text-base-400 rounded">#{selectedCharacter.characterCode}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCharacterId(null); }} className="text-base-600 hover:text-red-400 transition-colors ml-1 cursor-pointer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </>
              ) : (
                // 미선택
                <div
                  className="w-45 h-45 rounded-2xl border border-base-800 bg-[#1A1B1E] hover:border-primary/50 transition-colors flex flex-col items-center justify-center shadow-2xl cursor-pointer group"
                  onClick={() => setIsModalOpen(true)}
                >
                  <div className="w-16 h-16 rounded-full border border-base-700 flex items-center justify-center text-base-600 mb-4 group-hover:text-primary group-hover:border-primary transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                  <div className="px-4 py-1.5 rounded-lg border border-base-700 bg-base-900 group-hover:border-primary transition-colors flex items-center gap-2">
                    <span className="text-[12px] font-bold text-base-400 group-hover:text-primary">⊕</span>
                    <span className="text-[12px] font-medium text-base-300 group-hover:text-primary">캐릭터 1</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <CharacterSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={setSelectedCharacterId}
      />
    </PageLayout>
  );
};

export default LogRoomCreationPage;
