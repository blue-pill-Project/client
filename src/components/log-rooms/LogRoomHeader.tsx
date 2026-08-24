import { useEffect, useRef, useState } from 'react';
import { Calendar, Share2, ArrowLeft, MessageCircleMore, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, handleAvatarError } from '../../lib/utils';
import type { DayLogTimeSlot } from '../../lib/logRoomApi';
import { MonthCalendar } from '../common/MonthCalendar';

interface LogRoomHeaderProps {
  roomName: string;
  participants: { imageUrl: string | null }[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedTimeSlot: number;
  onTimeSlotChange: (slot: number) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  timelineData: DayLogTimeSlot[];
  markedDates?: Iterable<string>;
  onCalendarMonthChange?: (year: number, month: number) => void;
  onShare: () => void;
  isSharing: boolean;
  isOwner?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export const LogRoomHeader = ({
  roomName,
  participants,
  selectedDate,
  onDateChange,
  selectedTimeSlot,
  onTimeSlotChange,
  isChatOpen,
  onToggleChat,
  timelineData,
  markedDates,
  onCalendarMonthChange,
  onShare,
  isSharing,
  isOwner,
  onDelete,
  isDeleting
}: LogRoomHeaderProps) => {
  const navigate = useNavigate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timeSlots = [6, 9, 12, 15, 18, 21, 24, 3];

  // 현재 시각 기준, 미래 날짜/타임슬롯은 선택하지 못하게 막는다 (로컬 타임존 기준)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentApiSlot = Math.floor(now.getHours() / 3) * 3;

  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  return (
    <header className="w-full flex flex-col items-center pb-2">
      {/* Top Row */}
      <div className="w-full flex items-start justify-between px-8 mb-6">
        {/* Left: Back Button */}
        <button
          onClick={() => navigate('/log-rooms')}
          className="p-2.5 rounded-full bg-background-main border border-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Center: Room Pill */}
        <div className='flex flex-col items-center gap-5.25'>
          <div className="flex items-center gap-3 px-6 py-2 rounded-full border border-gray-700 bg-background-main">
            <h1 className="text-lg font-bold text-base-300 tracking-wide">{roomName}</h1>
            <div className="flex -space-x-2">
              {participants.map((p, i) => (
                <img
                  key={i}
                  src={getImageUrl(p.imageUrl) || '/default-profile.svg'}
                  onError={handleAvatarError}
                  alt="participant"
                  className="w-7 h-7 rounded-full border-2 border-gray-900 object-cover"
                />
              ))}
            </div>
          </div>

          {/* Time Slot Selector */}
          <div className="flex items-center gap-8">
            {timeSlots.map(slot => {
              const apiSlot = slot === 24 ? 0 : slot;
              const isSelected = selectedTimeSlot === slot || selectedTimeSlot === apiSlot;
              const hasLog = (timelineData.find(t => t.timeSlot === apiSlot || t.timeSlot === slot)?.entries.length ?? 0) > 0;
              const isFuture = selectedDate > todayStr || (selectedDate === todayStr && apiSlot > currentApiSlot);
              return (
                <button
                  key={slot}
                  disabled={isFuture}
                  onClick={() => !isFuture && onTimeSlotChange(apiSlot)}
                  className={`flex flex-col items-center gap-2 group ${isFuture ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`rounded-full transition-all ${isFuture
                    ? 'w-2 h-2 bg-gray-800'
                    : isSelected
                      ? 'w-3 h-3 bg-primary shadow-[0_0_0_4px_rgba(98,246,181,0.25),0_0_10px_rgba(98,246,181,0.6)]'
                      : hasLog
                        ? 'w-2 h-2 bg-primary/80'
                        : 'w-2 h-2 bg-gray-700 group-hover:bg-gray-500'
                    }`} />
                  <span className={`text-[11px] font-medium transition-colors ${isFuture ? 'text-gray-800' : isSelected ? 'text-white' : hasLog ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    {slot.toString().padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div ref={calendarRef} className="relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="p-2.5 rounded-full bg-background-main border border-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <Calendar size={20} />
            </button>
            {isCalendarOpen && (
              <div className="absolute right-0 top-full mt-2 bg-background-main border border-gray-700 rounded-2xl p-4 shadow-xl z-50">
                <MonthCalendar
                  value={selectedDate}
                  onChange={(date) => { onDateChange(date); setIsCalendarOpen(false); }}
                  markedDates={markedDates}
                  onVisibleMonthChange={onCalendarMonthChange}
                  disableFuture
                />
              </div>
            )}
          </div>

          <button
            onClick={onShare}
            disabled={isSharing}
            className="p-2.5 rounded-full bg-background-main border border-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={20} />
          </button>

          {isOwner && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-2.5 rounded-full bg-background-main border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <button
          onClick={onToggleChat}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-700 bg-background-main transition-colors cursor-pointer ${isChatOpen ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
        >
          <MessageCircleMore size={18} />
          <span className="text-sm font-medium">채팅하기</span>
        </button>
      </div>
    </header>
  );
};
