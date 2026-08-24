import { Send, Crown } from 'lucide-react';
import { useMemo } from 'react';
import type { ChatMessage, DayLogTimeSlot, LogRoomParticipant, SharedPost, DayLogEntry } from '../../lib/logRoomApi';
import { getImageUrl, handleAvatarError } from '../../lib/utils';
import Button from '../common/Button';
import { PlusIcon } from '../icons/PlusIcon';

interface LogTimelineProps {
  timelineData: DayLogTimeSlot[];
  sharedPosts: SharedPost[];
  chatMessages: ChatMessage[];
  participants: LogRoomParticipant[];
  memberNames: Record<string, string>;
  selectedDate: string;
  selectedTimeSlot: number;
  ownerPublicId: string | null;
  onUpload: (timeSlot: number) => void;
  onReply: (photoPublicId: string) => void;
}

export const LogTimeline = ({
  timelineData, sharedPosts, chatMessages, participants, memberNames, selectedDate, selectedTimeSlot, onUpload, onReply
}: LogTimelineProps) => {
  const slotData = timelineData.find((data) => data.timeSlot === selectedTimeSlot);

  // Calculate current date and time slot
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentSlot = Math.floor(now.getHours() / 3) * 3;
  const isCurrentSlot = selectedDate === today && selectedTimeSlot === currentSlot;

  // Find shared posts for the selected date and time slot
  const sharedPostsForSlot = sharedPosts.filter(p => p.postDate === selectedDate && p.timeSlot === selectedTimeSlot);
  const sharedEntries = sharedPostsForSlot.flatMap(p => p.photos as DayLogEntry[]);

  // Merge raw entries and shared photos, ensuring uniqueness by photoPublicId
  const allEntries = [...(slotData?.entries || []), ...sharedEntries];
  const uniqueEntries = Array.from(new Map(allEntries.map(e => [e.photoPublicId, e])).values());

  // 사진별 최신 답장 (quotedPhotoPublicId 기준)
  const latestReplyByPhotoId = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const msg of chatMessages) {
      const photoId = msg.quotedPhotoPublicId;
      if (!photoId) continue;
      const prev = map.get(photoId);
      if (!prev || new Date(msg.createdAt).getTime() > new Date(prev.createdAt).getTime()) {
        map.set(photoId, msg);
      }
    }
    return map;
  }, [chatMessages]);

  // Fallback name lookup for participants with no entry in the selected slot,
  // built from any entry across the whole day (raw logs + shared posts)
  const nameByMember = new Map<string, string>();
  for (const e of [...timelineData.flatMap(t => t.entries), ...sharedPosts.flatMap(p => p.photos)]) {
    if (!nameByMember.has(e.memberPublicId)) nameByMember.set(e.memberPublicId, e.authorName);
  }

  return (
    <section className="flex-1 overflow-y-auto px-10 py-6 hide-scrollbar">
      <div className="flex flex-col items-center gap-5 max-w-4xl mx-auto">
        {participants.map((participant) => {
          const entry = uniqueEntries.find(e => e.memberPublicId === participant.memberPublicId);
          const isOwner = participant.isOwner;
          const displayName = memberNames[participant.memberPublicId] || nameByMember.get(participant.memberPublicId);

          if (entry) {
            const latestReply = latestReplyByPhotoId.get(entry.photoPublicId);
            const subtitle = latestReply?.content || entry.caption;

            return (
              <div
                key={entry.photoPublicId}
                className="relative w-full rounded-3xl overflow-hidden bg-gray-950 aspect-2/1 group shadow-2xl transition-all hover:scale-[1.01]"
              >
                {/* Main Image */}
                <img
                  src={getImageUrl(entry.imageUrl) || ''}
                  alt={entry.caption || 'Log'}
                  className="w-full h-full object-cover"
                />

                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 via-transparent to-gray-900/40" />

                {/* Top Left: Participant Info */}
                <div className="absolute top-5 left-5 flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={getImageUrl(participant.imageUrl) || '/default-profile.svg'}
                      onError={handleAvatarError}
                      alt={entry.authorName}
                      className="w-11 h-11 rounded-full border-2 border-white/20 object-cover shadow-lg"
                    />
                    {isOwner && (
                      <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1 border border-gray-900 shadow-md">
                        <Crown size={10} className="text-gray-900 fill-gray-900" />
                      </div>
                    )}
                  </div>
                  <span className="text-lg font-bold text-gray-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {entry.authorName}
                  </span>
                </div>

                {/* Bottom Left: Time and Caption / Latest Reply */}
                <div className="absolute bottom-5 left-5 flex flex-col gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-gray-200 tabular-nums tracking-tighter drop-shadow-lg">
                      {selectedTimeSlot.toString().padStart(2, '0')}:00
                    </span>
                    {subtitle && (
                      <p className="text-base font-medium text-gray-200/90 line-clamp-1 drop-shadow-md max-w-xl">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Right: Share/Reply Button */}
                <button
                  onClick={() => onReply(entry.photoPublicId)}
                  className="absolute bottom-6 right-6 text-gray-200/90 hover:text-gray-200 hover:scale-110 transition-all drop-shadow-xl cursor-pointer"
                >
                  <Send size={22} className="rotate-[-15deg] fill-white/5" />
                </button>
              </div>
            );
          } else {
            // No entry placeholder
            return (
              <div
                key={participant.memberPublicId}
                className="relative w-full rounded-3xl border border-gray-700 bg-gray-950 aspect-2/1 flex flex-col items-center justify-center gap-6 transition-all hover:bg-gray-950/50 hover:border-gray-700"
              >
                <div className="absolute top-4 left-4 flex items-center gap-4 opacity-30">
                  <img
                    src={getImageUrl(participant.imageUrl) || '/default-profile.svg'}
                    onError={handleAvatarError}
                    alt={displayName || ''}
                    className="w-12 h-12 rounded-full object-cover grayscale border-2 border-gray-950 shadow-lg"
                  />
                  {displayName && (
                    <span className="text-xl font-semibold text-gray-200">{displayName}</span>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <p className='text-center text-display-2 font-bold text-base-800 mb-1'>{selectedTimeSlot}:00</p>
                  {isOwner && isCurrentSlot ? (
                    <Button
                      onClick={() => onUpload(selectedTimeSlot)}
                      leftIcon={<PlusIcon />}
                      className='px-14'
                      size='l'
                    >
                      로그 업로드
                    </Button>
                  ) : (
                    <div className="text-base text-gray-600 font-medium text-center h-12">아직 로그가 없습니다.</div>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>
    </section>
  );
};
