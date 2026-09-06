/**
 * 인스타그램 스타일 캐릭터 프로필 헤더(아바타·ID·이름·태그) UI.
 */
import { cn } from '../../lib/utils';
import Chip from '../common/Chip';

interface CharacterProfileItemProps {
  imageUrl: string;
  instagramId: string;
  characterName: string;
  tags: string[];
  className?: string;
}

/**
 * 캐릭터 아바타와 인스타그램 ID·이름·태그를 한 줄로 표시한다.
 */
const CharacterProfileItem = ({
  imageUrl,
  instagramId,
  characterName,
  tags,
  className,
}: CharacterProfileItemProps) => {
  return (
    <div className={cn('flex items-center gap-4 py-2', className)}>
      {/* 아바타 영역: Primary 컬러 테두리 포함 */}
      <div className="relative size-13 shrink-0 p-0.5 rounded-full bg-primary flex items-center justify-center">
        <div className="size-full rounded-full bg-background-main overflow-hidden border-2 border-background-main">
          <img
            src={imageUrl}
            alt={characterName}
            className="size-full object-cover"
          />
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="flex flex-col justify-center gap-1">
        {/* Instagram ID (Yellowish) */}
        <span className="text-base-300 typo-body-1 font-medium leading-tight opacity-90">
          {instagramId}
        </span>

        {/* 캐릭터 이름 & 태그들 */}
        <div className="flex items-center gap-1.5">
          <span className="text-base-50 typo-body-2 font-regular">
            {characterName}
          </span>
          <div className="flex gap-1.5">
            {tags.map((tag) => (
              <Chip key={tag} variant="gray" size="s">
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterProfileItem;
