/**
 * 공유 로그 게시물 상세 모달.
 * 방·참가자·공유자 정보와 사진 목록을 표시하고, 내 게시물은 삭제를 허용한다.
 */
import { Clock, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SharedPost } from '../../lib/logRoomApi';
import { getImageUrl, handleAvatarError } from '../../lib/utils';

interface PostDetailModalProps {
  post: SharedPost | null;
  onClose: () => void;
  onDelete?: () => void;
}

/**
 * SharedPost 상세 오버레이.
 * post가 null이면 렌더하지 않는다.
 */
export const PostDetailModal = ({ post, onClose, onDelete }: PostDetailModalProps) => {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] bg-base-950 border border-base-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {post.isMine && onDelete && (
          <button
            onClick={onDelete}
            aria-label="게시물 삭제"
            className="absolute top-5 right-16 z-10 p-1.5 rounded-full bg-base-900/80 text-base-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-1.5 rounded-full bg-base-900/80 text-base-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="px-8 pt-8 pb-6 shrink-0">
          <div className="flex items-center gap-2 text-base-500 text-sm mb-4">
            <Clock size={14} />
            <span>{post.timeSlot.toString().padStart(2, '0')}:00</span>
            <span className="text-base-700">·</span>
            <span>{post.postDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{post.roomName}</h2>
              <p className="text-sm text-base-500 mt-0.5">
                {post.participants.map(p => p.name).join(', ')}
              </p>
            </div>
            <div className="flex -space-x-2">
              {post.participants.map(p => (
                <img
                  key={p.memberPublicId}
                  src={getImageUrl(p.imageUrl) || '/default-profile.svg'}
                  onError={handleAvatarError}
                  alt={p.name}
                  className="w-10 h-10 rounded-full border-2 border-base-950 object-cover"
                />
              ))}
            </div>
          </div>

          <Link
            to={`/users/${post.sharer.publicId}`}
            className="flex items-center gap-2 mt-4 w-fit hover:opacity-80 transition-opacity"
          >
            <img
              src={getImageUrl(post.sharer.profileImageUrl) || '/default-profile.svg'}
              onError={handleAvatarError}
              alt={post.sharer.nickname}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-xs text-base-500">{post.sharer.nickname}님이 공유함</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4 hide-scrollbar">
          {post.photos.length === 0 ? (
            <div className="py-16 text-center text-base-600 text-sm">공유된 사진이 없습니다.</div>
          ) : (
            post.photos.map(photo => (
              <div
                key={photo.photoPublicId}
                className="relative w-full rounded-2xl overflow-hidden bg-base-900 aspect-2/1"
              >
                <img
                  src={getImageUrl(photo.imageUrl) || ''}
                  alt={photo.caption || 'Log'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <img
                    src={getImageUrl(photo.authorImageUrl) || '/default-profile.svg'}
                    onError={handleAvatarError}
                    alt={photo.authorName}
                    className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                  />
                  <span className="text-base font-bold text-white drop-shadow">{photo.authorName}</span>
                </div>

                <div className="absolute bottom-4 left-4 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-white tabular-nums drop-shadow">
                    {post.timeSlot.toString().padStart(2, '0')}:00
                  </span>
                  {photo.caption && (
                    <p className="text-sm font-medium text-white/90 drop-shadow line-clamp-1 max-w-sm">
                      {photo.caption}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
