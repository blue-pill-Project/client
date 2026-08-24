import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { R2_DOMAIN } from '../../lib/config';
import type { CharacterCard } from '../../lib/characterApi';
import Chip from '../common/Chip';
import { UserIcon } from '../icons/UserIcon';
import { FireIcon } from '../icons/FireIcon';
import { MoreIcon } from '../icons/MoreIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { cn, handleAvatarError } from '../../lib/utils';

interface CharacterCardProps {
  char: CharacterCard;
  onClick?: () => void;
  className?: string;
  creatorNickname?: string;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const getImageUrl = (key: string | null) => {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${R2_DOMAIN}/${key}`;
};

const CharacterCardComponent: React.FC<CharacterCardProps> = ({ char, onClick, className, creatorNickname, isOwner, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <article key={char.publicId} className={cn("group cursor-pointer relative", className)} onClick={onClick}>
      <div className="relative aspect-square mb-3 overflow-hidden rounded-2xl bg-base-900">
        <img src={getImageUrl(char.imageUrl) || '/default-profile.svg'} onError={handleAvatarError} alt={char.name} className="size-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" />
        <Chip className='absolute bottom-2 right-2' variant='black' icon={<FireIcon />}>{char.useCount} M</Chip>
      </div>
      <div>
        <h3 className="text-body-2 font-semibold text-base-300">{char.name} <Chip variant='gray' size='s'>#{char.characterCode}</Chip></h3>
        <div className="text-body-4 my-1 text-base-500 line-clamp-2">{char.description}</div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/users/${char.creatorPublicId}`); }}
          className="inline-flex h-5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Chip variant='gray' size='s' icon={<UserIcon />}>{creatorNickname || char.creatorNickname}</Chip>
        </button>
      </div>
      {isOwner && (
        <button
          className="absolute cursor-pointer bottom-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
          onClick={handleMenuClick}
        >
          <MoreIcon className="size-5" />
        </button>
      )}

      {isMenuOpen && (
        <div ref={menuRef} className="absolute bottom-10 right-2 w-32 bg-base-900 rounded-lg shadow-xl border border-base-700 py-1 z-10" onClick={(e) => e.stopPropagation()}>
          <button className="flex cursor-pointer items-center gap-2 w-full px-4 py-2 text-body-3 text-base-200 hover:bg-base-800" onClick={onEdit}>
            <EditIcon /> 수정
          </button>
          <button className="flex cursor-pointer items-center gap-2 w-full px-4 py-2 text-body-3 text-red-400 hover:bg-base-800" onClick={onDelete}>
            <TrashIcon /> 삭제
          </button>
        </div>
      )}
    </article>
  );
};

export default CharacterCardComponent;
