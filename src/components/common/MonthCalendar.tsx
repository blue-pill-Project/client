/**
 * 월간 캘린더 피커.
 * 날짜 선택·로그 표시 점·미래 날짜 비활성화를 지원한다.
 */
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MonthCalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  /** 로그가 있는 날짜 (YYYY-MM-DD) */
  markedDates?: Iterable<string>;
  /** 보이는 월이 바뀔 때 (month는 0–11) */
  onVisibleMonthChange?: (year: number, month: number) => void;
  /** 오늘보다 미래인 날짜는 선택할 수 없게 비활성화 */
  disableFuture?: boolean;
  className?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 연·월·일을 YYYY-MM-DD 문자열로 만든다 */
const toDateString = (year: number, month: number, day: number) => {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

/**
 * 월 단위 날짜 그리드 캘린더.
 * 6주(42칸)로 이전/다음 달 날짜를 채우고, markedDates에 점을 표시한다.
 */
export const MonthCalendar = ({
  value,
  onChange,
  markedDates,
  onVisibleMonthChange,
  disableFuture,
  className,
}: MonthCalendarProps) => {
  const selected = value ? new Date(`${value}T12:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const markedSet = markedDates instanceof Set
    ? markedDates
    : new Set(markedDates ? [...markedDates] : []);

  const today = new Date();
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  /** 보이는 월이 바뀌면 부모에 알려 해당 월 마킹 데이터를 불러오게 한다 */
  useEffect(() => {
    onVisibleMonthChange?.(viewYear, viewMonth);
  }, [viewYear, viewMonth, onVisibleMonthChange]);

  /** 이전 달로 이동한다 */
  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  /** 다음 달로 이동한다 */
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  /** 6주 그리드용 셀 (현재 달 + 앞뒤 패딩 날짜) */
  const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const month = viewMonth === 0 ? 11 : viewMonth - 1;
    const year = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day, isCurrentMonth: false, dateStr: toDateString(year, month, day) });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, isCurrentMonth: true, dateStr: toDateString(viewYear, viewMonth, day) });
  }
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const month = viewMonth === 11 ? 0 : viewMonth + 1;
    const year = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ day, isCurrentMonth: false, dateStr: toDateString(year, month, day) });
  }

  return (
    <div className={cn('w-72 select-none', className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-base-800 transition-colors cursor-pointer"
          aria-label="이전 달"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-base-200">{viewYear}년 {viewMonth + 1}월</span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-base-800 transition-colors cursor-pointer"
          aria-label="다음 달"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[11px] font-medium text-gray-500 text-center">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, idx) => {
          const isSelected = cell.dateStr === value;
          const isToday = cell.dateStr === todayStr;
          const hasLog = markedSet.has(cell.dateStr);
          const isFuture = disableFuture && cell.dateStr > todayStr;
          return (
            <button
              type="button"
              key={idx}
              disabled={isFuture}
              onClick={() => !isFuture && onChange(cell.dateStr)}
              className={cn(
                'relative w-9 h-9 mx-auto flex flex-col items-center justify-center rounded-full text-xs font-medium transition-colors',
                isFuture
                  ? 'text-gray-800 cursor-not-allowed'
                  : cn('cursor-pointer', cell.isCurrentMonth ? 'text-gray-200' : 'text-gray-700'),
                !isFuture && (isSelected
                  ? 'bg-primary text-background-main font-bold'
                  : isToday
                    ? 'border border-primary/60 text-primary'
                    : 'hover:bg-base-800')
              )}
            >
              {cell.day}
              {hasLog && (
                <span
                  className={cn(
                    'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                    isSelected ? 'bg-background-main' : 'bg-primary'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
