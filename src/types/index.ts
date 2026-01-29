export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface Developer {
  id: string;
  name: string;
  email: string | null;
  team_id: string | null;
  created_at: string;
  team?: Team;
}

export interface DeveloperTeam {
  developer_id: string;
  team_id: string;
  created_at: string;
}

export interface Evaluation {
  total: number;
  complexity: number;
  volume: number;
  thinking: number;
  others: number;
}

export type CommitType = 'develop' | 'meeting' | 'chore';

export interface Commit {
  id: string;
  commit_id: string;
  message: string;
  developer_id: string | null;
  team_id: string | null;
  type: CommitType | null;
  evaluation_total: number | null;
  evaluation_complexity: number | null;
  evaluation_volume: number | null;
  evaluation_thinking: number | null;
  evaluation_others: number | null;
  comment: string | null;
  lines_added: number | null;
  lines_deleted: number | null;
  work_hours: number | null;
  ai_driven_minutes: number | null;
  productivity: number | null;
  created_at: string;
  developer?: Developer;
}

export interface CommitWithDeveloper extends Commit {
  developer: Developer & { team: Team | null };
}

export interface CommitSubmitRequest {
  commit_id: string;
  message: string;
  developer_name: string;
  developer_email?: string;
  team_name: string;
  type?: CommitType;
  evaluation: Evaluation;
  comment?: string;
  lines_added?: number;
  lines_deleted?: number;
  work_hours?: number;
  ai_driven_minutes?: number;
  productivity?: number;
}

export interface DeveloperStats {
  developer: Developer;
  totalCommits: number;
  avgEvaluation: number;
  totalWorkHours: number;
  totalAiDrivenMinutes: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  avgProductivity: number;
  evaluationBreakdown: {
    complexity: number;
    volume: number;
    thinking: number;
    others: number;
  };
  commitsByType: {
    develop: number;
    meeting: number;
    chore: number;
  };
  workHoursByType: {
    develop: number;
    meeting: number;
    chore: number;
  };
}

export interface TeamStats {
  team: Team;
  developers: DeveloperStats[];
  totalCommits: number;
  avgEvaluation: number;
  totalWorkHours: number;
  totalAiDrivenMinutes: number;
}

export interface DashboardSummary {
  totalTeams: number;
  totalDevelopers: number;
  totalCommits: number;
  avgEvaluation: number;
  avgProductivity: number;
  totalWorkHours: number;
  totalAiDrivenMinutes: number;
}
