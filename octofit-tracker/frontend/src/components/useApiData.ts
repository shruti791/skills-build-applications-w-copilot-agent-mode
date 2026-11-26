import { useEffect, useState, type DependencyList } from 'react';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

// Runs a loader built on the shared API client and tracks loading, error, and success states.
export function useApiData<T>(load: () => Promise<T>, deps: DependencyList = []): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load().then(
      (data) => { if (active) setState({ status: 'success', data }); },
      (error: unknown) => { if (active) setState({ status: 'error', message: error instanceof Error ? error.message : String(error) }); },
    );
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
