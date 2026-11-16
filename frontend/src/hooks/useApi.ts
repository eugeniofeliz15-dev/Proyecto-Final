import { useCallback, useState } from 'react';
import { getErrorMessage } from '../lib/errors';

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = useCallback(async (request: () => Promise<T>) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await request();
      setState({ data, error: null, loading: false });
      return data;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'No se pudo completar la solicitud.');
      setState((current) => ({ ...current, error: message, loading: false }));
      return undefined;
    }
  }, []);

  const setData = useCallback(
    (data: T | null) => setState((current) => ({ ...current, data })),
    [],
  );

  return { ...state, execute, setData };
}
