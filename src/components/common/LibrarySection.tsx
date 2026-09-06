/**
 * 라이브러리 섹션 툴바.
 * 제목·개수와 함께 정렬 드롭다운·검색바를 배치한다.
 */
import React from 'react';
import SearchBar from './SearchBar';
import Dropdown from './Dropdown';

interface LibrarySectionProps {
  title: string;
  count: number;
  sortOptions?: { label: string; value: string }[];
  sort?: string;
  onSortChange?: (value: string) => void;
  keyword?: string;
  onKeywordChange?: (keyword: string) => void;
  onClearKeyword?: () => void;
}

/**
 * 목록 섹션 헤더(제목/카운트 + 정렬/검색).
 * sortOptions와 onKeywordChange가 모두 있을 때만 우측 컨트롤을 표시한다.
 */
export const LibrarySection: React.FC<LibrarySectionProps> = ({
  title,
  count,
  sortOptions,
  sort,
  onSortChange,
  keyword,
  onKeywordChange,
  onClearKeyword,
}) => {
  return (
    <section className="flex justify-between my-6 mx-auto max-w-273 w-full h-8">
      <div className="flex items-center text-body-1 font-bold gap-2 h-full">
        <h3 className="text-base-300">{title}</h3>
        <div className="border-l border-base-700 h-4.5" />
        <span className="text-base-500">{count}</span>
      </div>
      {
        (sortOptions && onKeywordChange) &&
        <div className="flex items-center justify-end gap-3">
          <Dropdown
            options={sortOptions}
            value={sort}
            onChange={onSortChange}
            className="w-41"
          />
          <div className="w-55">
            <SearchBar
              variant="dark"
              placeholder="Search"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              onClear={onClearKeyword}
              className="w-full"
            />
          </div>
        </div>
      }
    </section>
  );
};
