/**
 * 캐릭터 상세 정보 모달 — 설명·프롬프트·로그방 생성 진입을 담당한다.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Chip from "../common/Chip";
import Button from "../common/Button";
import { getImageUrl, handleAvatarError } from '../../lib/utils';
import { UserIcon } from '../icons/UserIcon';
import { UseCountIcon } from '../icons/UserCountIcon';
import { PlusIcon } from '../icons/PlusIcon';
import type { CharacterCard } from '../../lib/characterApi';
import { useAuthStore } from '../../store/useAuthStore';
import { Modal } from '../common/Modal';

interface CharacterInfoModalProps {
    character: CharacterCard;
    onClose: () => void;
}

/**
 * 캐릭터 이미지·설명·작성자 정보를 보여 주고, 소유자 프로필에서는 프롬프트·대사 예시도 노출한다.
 */
export const CharacterInfoModal: React.FC<CharacterInfoModalProps> = ({ character, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuthStore();
    const isOwner = currentUser?.publicId === character.creatorPublicId;
    const isProfilePage = location.pathname.startsWith('/profile');
    const showDetails = isOwner && isProfilePage;

    return (
        <Modal isOpen={!!character} onClose={onClose} title="캐릭터 정보">
            <div className="aspect-square w-full overflow-hidden border-b border-base-700 bg-base-800 box-border">
                <img src={getImageUrl(character.imageUrl) || '/default-profile.svg'} onError={handleAvatarError} alt={character.name} className="w-full h-full object-cover" />
            </div>
            <div className="py-5 px-4">
                <div>
                    <div className='flex gap-3 items-center'>
                        <h2 className="text-header-3 font-medium text-base-100">{character.name}</h2>
                        <Chip size='s'>#{character.characterCode}</Chip>
                    </div>
                    <div className='my-6'>
                        <h4 className="text-body-2 text-base-100 font-medium uppercase tracking-widest mb-2">캐릭터 설명</h4>
                        <p className="text-body-3 text-base-200 leading-relaxed">{character.description}</p>
                    </div>
                </div>

                {/* 소유자가 프로필 페이지에서 볼 때만 프롬프트·대사 예시 노출 */}
                {showDetails && (
                    <div className="mb-6">
                        <div className='mb-4'>
                            <h4 className="text-body-2 text-base-100 font-medium uppercase tracking-widest mb-2">캐릭터 프롬프트</h4>
                            <p className="text-body-3 text-base-200 bg-base-900 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">{character.prompt || '프롬프트가 없습니다.'}</p>
                        </div>
                        <div>
                            <h4 className="text-body-2 text-base-100 font-medium uppercase tracking-widest mb-2">대사 예시</h4>
                            {character.exampleDialogues && character.exampleDialogues.length > 0 ? (
                                <ul className="text-body-3 text-base-200 space-y-2">
                                    {character.exampleDialogues.map((dialogue, index) => (
                                        <li key={index} className="bg-base-900 p-3 rounded-lg">"{dialogue}"</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-body-3 text-base-500">대사 예시가 없습니다.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => { onClose(); navigate(`/users/${character.creatorPublicId}`); }}
                        className="inline-flex h-5 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <Chip size='s' icon={<UserIcon />}>{character.creatorNickname}</Chip>
                    </button>
                    <Chip size='s' icon={<UseCountIcon />}>{character.useCount}회</Chip>
                </div>
                <hr className='my-4 border-base-700' />
                <Button
                    variant="solid"
                    fullWidth
                    size="m"
                    leftIcon={<PlusIcon />}
                    onClick={() => navigate('/log-rooms/new', { state: { characterId: character.publicId, isPublic: character.isPublic } })}
                >
                    캐릭터와 로그방 만들기
                </Button>
            </div>
        </Modal>
    );
};