import { getJson } from '../api/client.js';
import { DataPanel } from './DataPanel.js';
import { useApiData } from './useApiData.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };

export default function Activities() {
  const state = useApiData(() => getJson<{ activities: Activity[] }>('/api/activities'));
  return (
    <DataPanel
      title="Activities"
      description="Track student activity minutes and points."
      label="activities"
      state={state}
      isEmpty={(data) => data.activities.length === 0}
      emptyMessage="No activities logged yet."
    >
      {(data) => (
        <ul className="list-group">
          {data.activities.map((activity, index) => (
            <li key={activity._id ?? index} className="list-group-item d-flex justify-content-between">
              <span className="text-capitalize fw-semibold">{activity.type}</span>
              <span>{activity.minutes} min · {activity.points} pts</span>
            </li>
          ))}
        </ul>
      )}
    </DataPanel>
  );
}
