import { getJson } from '../api/client.js';
import { DataPanel } from './DataPanel.js';
import { useApiData } from './useApiData.js';

type Team = { _id?: string; name: string; mascot?: string; members?: unknown[] };

export default function Teams() {
  const state = useApiData(() => getJson<{ teams: Team[] }>('/api/teams'));
  return (
    <DataPanel
      title="Teams"
      description="Manage teams and members."
      label="teams"
      state={state}
      isEmpty={(data) => data.teams.length === 0}
      emptyMessage="No teams created yet."
    >
      {(data) => (
        <ul className="list-group">
          {data.teams.map((team, index) => (
            <li key={team._id ?? index} className="list-group-item d-flex justify-content-between">
              <strong>{team.name}</strong>
              <span>{team.mascot ? `Mascot: ${team.mascot} · ` : ''}{team.members?.length ?? 0} member(s)</span>
            </li>
          ))}
        </ul>
      )}
    </DataPanel>
  );
}
