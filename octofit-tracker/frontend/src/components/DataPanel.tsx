import type { ReactNode } from 'react';
import type { ApiState } from './useApiData.js';

type Props<T> = {
  title: string;
  description: string;
  label: string;
  state: ApiState<T>;
  isEmpty: (data: T) => boolean;
  emptyMessage: string;
  controls?: ReactNode;
  children: (data: T) => ReactNode;
};

// Shared layout for loading, error, empty state, and success views.
export function DataPanel<T>({ title, description, label, state, isEmpty, emptyMessage, controls, children }: Props<T>) {
  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p className="text-body-secondary">{description}</p>
        {controls}
        {state.status === 'loading' && <p role="status" className="text-body-secondary">Loading {label}…</p>}
        {state.status === 'error' && <div role="alert" className="alert alert-danger">Unable to load {label}. {state.message}</div>}
        {state.status === 'success' && (isEmpty(state.data) ? <p className="text-body-secondary">{emptyMessage}</p> : children(state.data))}
      </div>
    </section>
  );
}
