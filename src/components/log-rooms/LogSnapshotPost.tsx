import type { SharedPost } from "../../lib/logRoomApi";

interface LogSnapshotPostProps {
  post: SharedPost;
  onViewLog: (post: SharedPost) => void;
}

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
