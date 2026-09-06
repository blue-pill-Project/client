/**
 * 피드용 로그 스냅샷 썸네일.
 * SharedPost의 첫 사진을 클릭 가능한 미리보기로 보여준다.
 */
import type { SharedPost } from "../../lib/logRoomApi";

interface LogSnapshotPostProps {
  post: SharedPost;
  onViewLog: (post: SharedPost) => void;
}

/**
 * 공유 로그 썸네일 버튼.
 * 사진이 없으면 렌더하지 않고, 클릭 시 상세 보기를 연다.
 */
export const LogSnapshotPost = ({ post, onViewLog }: LogSnapshotPostProps) => {
  if (post.photos.length === 0) return null;

  return (
    <button
      onClick={() => onViewLog(post)}
      className="block rounded-2xl overflow-hidden w-[55%] hover:opacity-90 transition-opacity cursor-pointer"
    >
      <img src={post.photos[0].imageUrl} alt="Log" className="w-full h-28 object-cover" />
    </button>
  );
};
