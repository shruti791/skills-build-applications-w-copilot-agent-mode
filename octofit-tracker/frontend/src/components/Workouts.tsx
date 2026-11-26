import { useState } from 'react';
import { getJson } from '../api/client.js';
import { DataPanel } from './DataPanel.js';
import { useApiData } from './useApiData.js';

type Suggestion = { _id?: string; title: string; reason?: string; focus?: string; minutes?: number; difficulty?: string };

const seededUsers = ['mona@example.com', 'hubot@example.com'];

export default function Workouts() {
  const [email, setEmail] = useState(seededUsers[0]);
  const state = useApiData(
    () => getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`),
    [email],
  );
  return (
    <DataPanel
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      label="workout suggestions"
      state={state}
      isEmpty={(data) => data.suggestions.length === 0}
      emptyMessage="No workout suggestions for this student yet."
      controls={
        <div className="mb-3">
          <label htmlFor="student-email" className="form-label">Student</label>
          <select id="student-email" className="form-select" value={email} onChange={(event) => setEmail(event.target.value)}>
            {seededUsers.map((user) => <option key={user} value={user}>{user}</option>)}
          </select>
        </div>
      }
    >
      {(data) => (
        <ul className="list-group">
          {data.suggestions.map((suggestion, index) => (
            <li key={suggestion._id ?? index} className="list-group-item">
              <strong>{suggestion.title}</strong>
              {suggestion.reason && <div className="text-body-secondary">{suggestion.reason}</div>}
              {suggestion.focus && suggestion.minutes !== undefined && (
                <small>{suggestion.focus} · {suggestion.minutes} min{suggestion.difficulty ? ` · ${suggestion.difficulty}` : ''}</small>
              )}
            </li>
          ))}
        </ul>
      )}
    </DataPanel>
  );
}
