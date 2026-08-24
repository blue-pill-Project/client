import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../store/useAuthStore';
import Button from '../../components/common/Button';
import Switch from '../../components/common/Switch';
import { useUserCharacterCards } from '../../hooks/useUserCharacterCards';
import { useDeleteCharacter } from '../../hooks/useDeleteCharacter';
import { updateProfileVisibility } from '../../lib/authApi';
import { api } from '../../lib/api';
import ProfileEditModal from '../../components/profile/ProfileEditModal';
import WithdrawModal from '../../components/profile/WithdrawModal';
import type { CharacterCard } from '../../lib/characterApi';
import { getCharacterCardDetail } from '../../lib/characterApi';
import CharacterCardComponent from '../../components/character/CharacterCard';
import { getErrorMessage, getImageUrl } from '../../lib/utils';
import { CharacterInfoModal } from '../../components/character/CharacterInfoModal';
import { SettingIcon } from '../../components/icons/SettingIcon';
import { LibrarySection } from '../../components/common/LibrarySection';

const ProfilePage = () => {
  const { publicId: paramPublicId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterCard | null>(null);

  const isOwner = !paramPublicId || paramPublicId === currentUser?.publicId;
  const targetPublicId = paramPublicId || currentUser?.publicId;

  const { characters, loading: charsLoading } = useUserCharacterCards(targetPublicId);
  const { deleteCharacter } = useDeleteCharacter();
  const { refresh } = useUserCharacterCards(targetPublicId);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetPublicId) return;
      setLoading(true);
      try {
        const userData = await api.get<User>(`/users/${targetPublicId}`);
        console.log('서버에서 가져온 프로필 데이터:', userData);
        setProfileUser(userData);
      } catch (err) {
        console.error(getErrorMessage(err, '프로필을 불러오는 중 오류가 발생했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetPublicId]);

  const handleCharacterClick = async (char: CharacterCard) => {
    if (char.prompt !== undefined) {
      setSelectedCharacter(char);
    } else {
      try {
        const fullChar = await getCharacterCardDetail(char.publicId);
        setSelectedCharacter(fullChar);
      } catch (err) {
        console.error(getErrorMessage(err, '캐릭터 정보를 불러오는 중 오류가 발생했습니다.'));
      }
    }
  };

  const handleVisibilityChange = async (checked: boolean) => {
    try {
      await updateProfileVisibility(!checked); // isPrivate state와 반대
      setProfileUser((prev) => prev ? { ...prev, isPublic: checked } : prev);
    } catch (err) {
      console.error(getErrorMessage(err, '공개 여부 변경 중 오류가 발생했습니다.'));
    }
  };

  const handleEditSuccess = (newNickname: string, newImageUrl: string | null) => {
    setProfileUser((prev) => prev ? {
      ...prev,
      nickname: newNickname,
      profileImageUrl: newImageUrl
    } : prev);
  };


  if (loading) return <PageLayout>Loading...</PageLayout>;
  if (!profileUser) return <PageLayout>User not found</PageLayout>;

  // 닉네임 첫 글자 (아바타용)
  const firstLetter = profileUser.nickname ? profileUser.nickname.charAt(0).toUpperCase() : '?';

  return (
    <PageLayout>
      {/* --- Character Detail Modal --- */}
      {selectedCharacter && (
        <CharacterInfoModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />
      )}

      <div className="flex flex-col gap-12">
        {/* 상단 프로필 섹션 */}
        <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pt-16">
          <div className="flex items-center gap-8">
            {/* 아바타 */}
            <div className="w-24 h-24 md:w-35 md:h-35 rounded-full border border-base-400 flex items-center justify-center bg-background-main text-display-2 font-bold text-base-400">
              {profileUser.profileImageUrl ? (
                <img src={getImageUrl(profileUser.profileImageUrl) || ''} alt="profile" className="w-full h-full rounded-full object-cover" onError={(e) => console.error('이미지 로딩 실패:', e)} />
              ) : (
                firstLetter
              )}
            </div>

            {/* 유저 정보 */}
            <div className="flex flex-col gap-2">
              <h1 className="typo-header-2 font-bold text-base-300">{profileUser.nickname || '사용자'}</h1>
              {isOwner && <span className="typo-body-2 text-base-500">{profileUser.email?.split('@')[0]}</span>}
            </div>
          </div>

          {/* 우측 액션 버튼 */}
          {isOwner && (
            <div className="flex flex-col items-end gap-6 self-stretch md:self-auto">
              <Button
                variant="Rectangleoutline"
                size="s"
                className="px-3"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<SettingIcon />}
                iconSize='l'
              >
                프로필 수정
              </Button>

              <Switch
                label="계정 비공개"
                checked={!profileUser.isPublic}
                onChange={(checked) => handleVisibilityChange(!checked)}
              />

              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="typo-body-4 text-base-600 hover:text-system-error transition-colors cursor-pointer"
              >
                회원 탈퇴
              </button>
            </div>
          )}
        </section>

        {/* 탭 메뉴 */}
        <section className="border-t border-base-700">
          <LibrarySection
            title='내 캐릭터'
            count={characters.length}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
            {characters.map((char) => (
              <CharacterCardComponent
                key={char.publicId}
                char={char}
                creatorNickname={profileUser.nickname}
                isOwner={isOwner}
                onEdit={() => navigate(`/library/edit/${char.publicId}`)}
                onDelete={() => deleteCharacter(char.publicId, refresh)}
                onClick={() => handleCharacterClick(char)}
              />
            ))}
            {characters.length === 0 && !charsLoading && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-6">
                <h3 className="typo-header-3 text-base-50 mb-2">생성된 캐릭터가 아직 없습니다</h3>
                {isOwner && (
                  <Button variant="solid" size="l" onClick={() => navigate('/library/new')} className="bg-primary text-background-main rounded-xl px-8">캐릭터 생성하기</Button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {isOwner && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentNickname={profileUser.nickname || ''}
          currentImageUrl={profileUser.profileImageUrl}
          onSuccess={handleEditSuccess}
        />
      )}

      {isOwner && (
        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
        />
      )}
    </PageLayout>
  );
};

export default ProfilePage;
