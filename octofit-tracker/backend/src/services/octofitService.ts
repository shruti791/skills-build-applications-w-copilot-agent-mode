import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type Input = Record<string, unknown>;

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function asInput(input: unknown): Input {
  return input && typeof input === 'object' && !Array.isArray(input) ? (input as Input) : {};
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') throw httpError(`${field} is required`);
  return value.trim();
}

// Activities: validate input, check referenced records exist, compute points.
export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const { userId, teamId, type, minutes } = asInput(input);
  const activityType = requiredText(type, 'type').toLowerCase();
  const activityMinutes = Number(minutes);
  if (!Number.isFinite(activityMinutes) || activityMinutes < 1) throw httpError('minutes must be a number of at least 1');
  if (!isObjectId(userId)) throw httpError('userId must be a valid id');
  if (!isObjectId(teamId)) throw httpError('teamId must be a valid id');

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user) throw httpError('User not found', 404);
  if (!team) throw httpError('Team not found', 404);

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: activityType,
    minutes: activityMinutes,
    points: Math.max(1, Math.round(activityMinutes)),
    occurredAt: new Date(),
  });
  return activity.toObject();
}

// Teams: name and mascot are required; members must be valid ids.
export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const { name, mascot, members } = asInput(input);
  const teamName = requiredText(name, 'name');
  const teamMascot = requiredText(mascot, 'mascot');
  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds) || !memberIds.every(isObjectId)) throw httpError('members must be a list of valid user ids');

  const team = await Team.create({ name: teamName, mascot: teamMascot, members: memberIds });
  return team.toObject();
}

// Leaderboard: sum activity points per team, highest first, 1-based rank.
export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map((entry) => [entry._id.toString(), entry.totalPoints]));
  return teams
    .map((team) => ({
      teamId: team._id.toString(),
      teamName: team.name,
      mascot: team.mascot,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

// Workout suggestions: rank workouts by the user's goal and recent activity pattern.
const activityFocus: Record<string, string> = {
  run: 'endurance',
  walk: 'endurance',
  cycle: 'endurance',
  swim: 'endurance',
  strength: 'strength',
  weights: 'strength',
  lift: 'strength',
  yoga: 'mobility',
  stretch: 'mobility',
};

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) throw httpError('User not found', 404);

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const activityCounts = new Map<string, number>();
  for (const activity of recent) {
    const focus = activityFocus[activity.type] ?? activity.type;
    activityCounts.set(focus, (activityCounts.get(focus) ?? 0) + 1);
  }
  const topActivityFocus = [...activityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const recentTypes = [...new Set(recent.map((activity) => activity.type))];

  const score = (focus: string) => (focus === user.fitnessGoal ? 2 : 0) + (focus === topActivityFocus ? 1 : 0);
  const workouts = await Workout.find().lean();
  return workouts
    .sort((a, b) => score(b.focus) - score(a.focus) || a.title.localeCompare(b.title))
    .map((workout) => {
      const reasons: string[] = [];
      if (workout.focus === user.fitnessGoal) reasons.push(`matches your ${user.fitnessGoal} goal`);
      if (workout.focus === topActivityFocus && recentTypes.length > 0) reasons.push(`builds on your recent ${recentTypes.join(', ')} activity`);
      const reason = reasons.length > 0 ? `Suggested because it ${reasons.join(' and ')}.` : `Adds ${workout.focus} variety to your recent activity.`;
      return { ...workout, reason };
    });
}

export { User };
