import { useState, useEffect, useCallback } from 'react';
import { getCharacterLibrary } from '../lib/characterApi';
import type { CharacterCard, CharacterCardListResponse } from '../lib/characterApi';
import { getErrorMessage } from '../lib/utils';

export const useCharacterLibrary = (initialSize = 10) => {
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<'LATEST' | 'POPULAR'>('LATEST');

  const fetchCharacters = useCallback(async (isFirst = true) => {
    setLoading(true);
    setError(null);
    try {
      const currentCursor = isFirst ? undefined : nextCursor;
      const response: CharacterCardListResponse = await getCharacterLibrary({
        keyword,
        sort,
        cursor: currentCursor || undefined,
        size: initialSize,
      });

      const { content, nextCursor: newCursor, hasNext: newHasNext, total } = response;
      console.log(response);


      if (isFirst) {
        setCharacters(content);
      } else {
        setCharacters((prev) => [...prev, ...content]);
      }

      setNextCursor(newCursor);
      setHasNext(newHasNext);
      setTotalCount(total);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch characters'));
    } finally {
      setLoading(false);
    }
  }, [keyword, sort, nextCursor, initialSize]);

  // 키워드나 정렬이 바뀌면 처음부터 다시 로드
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCharacters(true);
  }, [keyword, sort]);

  const loadMore = () => {
    if (!loading && hasNext) {
      fetchCharacters(false);
    }
  };

  // 삭제 직후 재조회 없이 목록에서 바로 제거해 즉시 리렌더링되도록 한다.
  const removeCharacter = (publicId: string) => {
    setCharacters((prev) => prev.filter((c) => c.publicId !== publicId));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  return {
    characters,
    loading,
    error,
    hasNext,
    keyword,
    setKeyword,
    sort,
    setSort,
    loadMore,
    refresh: () => fetchCharacters(true),
    removeCharacter,
    totalCount
  };
};
