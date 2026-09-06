/**
 * 인스타그램 포스트 형태의 캐릭터 피드 카드 UI.
 */
import { useState } from 'react';
import CharacterProfileItem from './CharacterProfileItem';
import { cn } from '../../lib/utils';

interface InstagramPostCardProps {
  user: {
    imageUrl: string;
    instagramId: string;
    characterName: string;
    tags: string[];
  };
  postImageUrl: string;
  date: string;
  caption: string;
  className?: string;
}

/**
 * 프로필 헤더·포스트 이미지·날짜·캡션(긴 글 More 펼치기)을 구성한 피드 카드.
 */
const InstagramPostCard = ({
  user,
  postImageUrl,
  date,
  caption,
  className,
}: InstagramPostCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongCaption = caption.length > 60;

  return (
    <div className={cn('flex flex-col w-full max-w-114', className)}>
      {/* 헤더: 기존 CharacterProfileItem 활용 */}
      <CharacterProfileItem
        {...user}
        className="mt-6"
      />

      {/* 포스트 이미지 */}
      <div className="my-4 w-full aspect-square rounded-2xl overflow-hidden bg-base-800 shadow-lg">
        <img
          src={postImageUrl}
          alt="Post content"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 포스트 정보 영역 */}
      <div className="mb-2 flex flex-col">
        {/* 날짜 */}
        <span className="text-base-500 typo-body-3 font-medium">
          {date}
        </span>

        {/* 캡션 영역 */}
        <div className="flex flex-col">
          <p className={cn(
            "text-base-50 mt-2.5 mb-2 typo-body-4 leading-relaxed whitespace-pre-wrap transition-all duration-300",
            !isExpanded && isLongCaption && "line-clamp-2"
          )}>
            {caption}
          </p>
          {isLongCaption && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-base-400 typo-body-4 font-semibold w-fit hover:text-base-50 transition-colors cursor-pointer"
            >
              More...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramPostCard;
