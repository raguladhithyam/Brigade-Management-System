import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PaginatedResult<T> {
  rows: T[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
}

/**
 * Firestore cursor-based pagination. Fetches `pageSize` docs at a time using
 * `startAfter` cursors so we never read the whole collection at once — important
 * with 1000+ records where a full fetch would rack up reads on every page load.
 */
export function usePaginatedCollection<T extends { id: string }>(
  collectionName: string,
  orderByField: string,
  initialPageSize = 20
): PaginatedResult<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  // cursors[i] is the doc to `startAfter` when loading page i (cursors[0] is undefined).
  const [cursors, setCursors] = useState<(QueryDocumentSnapshot<DocumentData> | undefined)[]>([undefined]);

  const fetchCount = useCallback(async () => {
    try {
      const snap = await getCountFromServer(collection(db, collectionName));
      setTotalCount(snap.data().count);
    } catch (err) {
      console.error(`Failed to count ${collectionName}:`, err);
    }
  }, [collectionName]);

  const fetchPage = useCallback(
    async (pageIndex: number, cursorList: (QueryDocumentSnapshot<DocumentData> | undefined)[]) => {
      setLoading(true);
      try {
        const startCursor = cursorList[pageIndex];
        const constraints = [orderBy(orderByField), limit(pageSize)];
        const q = startCursor
          ? query(collection(db, collectionName), orderBy(orderByField), startAfter(startCursor), limit(pageSize))
          : query(collection(db, collectionName), ...constraints);
        const snap = await getDocs(q);
        const docs = snap.docs;
        setRows(docs.map((d) => ({ id: d.id, ...d.data() })) as T[]);
        if (docs.length > 0) {
          setCursors((prev) => {
            const copy = [...prev];
            copy[pageIndex + 1] = docs[docs.length - 1];
            return copy;
          });
        }
        setPage(pageIndex);
      } catch (err) {
        console.error(`Failed to fetch ${collectionName} page ${pageIndex}:`, err);
      } finally {
        setLoading(false);
      }
    },
    [collectionName, orderByField, pageSize]
  );

  // Initial load + whenever pageSize changes: reset to page 0.
  useEffect(() => {
    setCursors([undefined]);
    fetchCount();
    fetchPage(0, [undefined]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, orderByField, pageSize]);

  const nextPage = useCallback(() => {
    if ((page + 1) * pageSize < totalCount) fetchPage(page + 1, cursors);
  }, [page, pageSize, totalCount, cursors, fetchPage]);

  const prevPage = useCallback(() => {
    if (page > 0) fetchPage(page - 1, cursors);
  }, [page, cursors, fetchPage]);

  const refresh = useCallback(() => {
    fetchCount();
    fetchPage(page, cursors);
  }, [fetchCount, fetchPage, page, cursors]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
  }, []);

  return {
    rows,
    loading,
    totalCount,
    page,
    pageSize,
    hasNext: (page + 1) * pageSize < totalCount,
    hasPrev: page > 0,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
  };
}
