import { getJson } from '../api/client.js';
import { DataPanel } from './DataPanel.js';
import { useApiData } from './useApiData.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const state = useApiData(() => getJson<{ leaderboard: Entry[] }>('/api/leaderboard'));
  return (
    <DataPanel
      title="Leaderboard"
      description="Compare team point totals."
      label="the leaderboard"
      state={state}
      isEmpty={(data) => data.leaderboard.length === 0}
      emptyMessage="No leaderboard entries yet."
    >
      {(data) => (
        <table className="table table-striped">
          <thead>
            <tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Points</th></tr>
          </thead>
          <tbody>
            {data.leaderboard.map((entry) => (
              <tr key={entry.teamName}>
                <td>#{entry.rank}</td>
                <td>{entry.teamName}</td>
                <td>{entry.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DataPanel>
  );
}
