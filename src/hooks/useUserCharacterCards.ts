/**
 * 특정 유저가 만든 캐릭터 카드 목록을 무한 스크롤로 불러오는 훅.
 */
import { useState, useEffect, useCallback } from 'react';
import { getUserCharacterCards } from '../lib/characterApi';
import type { CharacterCard } from '../lib/characterApi';
import { getErrorMessage } from '../lib/utils';

/**
 * userPublicId 기준 캐릭터 카드를 커서 페이지네이션으로 조회한다.
 */
export const useUserCharacterCards = (userPublicId: string | undefined, initialSize = 10) => {
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  /** isFirst면 처음부터, 아니면 nextCursor로 이어 불러온다 */
  const fetchCharacters = useCallback(async (isFirst = true) => {
    if (!userPublicId || userPublicId === 'undefined') return; // undefined 체크 강화

    setLoading(true);
    setError(null);
    try {
      const currentCursor = isFirst ? undefined : nextCursor;
      const response = await getUserCharacterCards(userPublicId, {
        cursor: currentCursor || undefined,
        size: initialSize,
      });

      const { content, nextCursor: newCursor, hasNext: newHasNext } = response;

      if (isFirst) {
        setCharacters(content);
        console.log(content);
      } else {
        setCharacters((prev) => [...prev, ...content]);
      }

      setNextCursor(newCursor);
      setHasNext(newHasNext);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch characters'));
    } finally {
      setLoading(false);
    }
  }, [userPublicId, nextCursor, initialSize]);

  useEffect(() => {
    if (userPublicId && userPublicId !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCharacters(true);
    }
  }, [userPublicId, fetchCharacters]);

  /** 다음 페이지를 이어서 로드한다 */
  const loadMore = () => {
    if (!loading && hasNext) {
      fetchCharacters(false);
    }
  };

  return {
    characters,
    loading,
    error,
    hasNext,
    loadMore,
    refresh: () => fetchCharacters(true),
  };
};
