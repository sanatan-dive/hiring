'use client';

import { useState, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useAsync<T>() {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await asyncFn();
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, error: err, isLoading: false });
      throw err;
    }
  }, []);

  return { ...state, execute };
}

export default useAsync;
