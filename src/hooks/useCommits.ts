import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Commit,
  Developer,
  Team,
  DeveloperStats,
  TeamStats,
  DashboardSummary,
} from '@/types';

interface CommitWithRelations extends Commit {
  developers: (Developer & { teams: Team | null }) | null;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UseCommitsReturn {
  commits: CommitWithRelations[];
  developers: Developer[];
  teams: Team[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  developerStats: DeveloperStats[];
  teamStats: TeamStats[];
  summary: DashboardSummary;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

export function useCommits(): UseCommitsReturn {
  const [commits, setCommits] = useState<CommitWithRelations[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return {
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${day}`,
    };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let commitsQuery = supabase
        .from('commits')
        .select(`
          *,
          developers (
            *,
            teams (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (dateRange.startDate) {
        commitsQuery = commitsQuery.gte('created_at', `${dateRange.startDate}T00:00:00+09:00`);
      }
      if (dateRange.endDate) {
        commitsQuery = commitsQuery.lte('created_at', `${dateRange.endDate}T23:59:59+09:00`);
      }

      const [commitsRes, developersRes, teamsRes] = await Promise.all([
        commitsQuery,
        supabase.from('developers').select('*, teams (*)'),
        supabase.from('teams').select('*'),
      ]);

      if (commitsRes.error) throw commitsRes.error;
      if (developersRes.error) throw developersRes.error;
      if (teamsRes.error) throw teamsRes.error;

      setCommits(commitsRes.data || []);
      setDevelopers(developersRes.data || []);
      setTeams(teamsRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const developerStats = useMemo((): DeveloperStats[] => {
    return developers.map((developer) => {
      const devCommits = commits.filter(
        (c) => c.developer_id === developer.id
      );

      const totalCommits = devCommits.length;
      const avgEvaluation = totalCommits > 0
        ? devCommits.reduce((sum, c) => sum + (c.evaluation_total || 0), 0) / totalCommits
        : 0;
      const totalWorkHours = devCommits.reduce(
        (sum, c) => sum + (c.work_hours || 0),
        0
      );
      const totalAiDrivenMinutes = devCommits.reduce(
        (sum, c) => sum + (c.ai_driven_minutes || 0),
        0
      );
      const avgProductivity = totalCommits > 0
        ? devCommits.reduce((sum, c) => sum + (c.productivity || 0), 0) / totalCommits
        : 0;

      const evaluationBreakdown = {
        complexity: totalCommits > 0
          ? devCommits.reduce((sum, c) => sum + (c.evaluation_complexity || 0), 0) / totalCommits
          : 0,
        volume: totalCommits > 0
          ? devCommits.reduce((sum, c) => sum + (c.evaluation_volume || 0), 0) / totalCommits
          : 0,
        thinking: totalCommits > 0
          ? devCommits.reduce((sum, c) => sum + (c.evaluation_thinking || 0), 0) / totalCommits
          : 0,
        others: totalCommits > 0
          ? devCommits.reduce((sum, c) => sum + (c.evaluation_others || 0), 0) / totalCommits
          : 0,
      };

      return {
        developer,
        totalCommits,
        avgEvaluation,
        totalWorkHours,
        totalAiDrivenMinutes,
        avgProductivity,
        evaluationBreakdown,
      };
    });
  }, [commits, developers]);

  const teamStats = useMemo((): TeamStats[] => {
    return teams.map((team) => {
      const teamDevs = developerStats.filter(
        (ds) => ds.developer.team_id === team.id
      );

      const totalCommits = teamDevs.reduce((sum, ds) => sum + ds.totalCommits, 0);
      const avgEvaluation = teamDevs.length > 0
        ? teamDevs.reduce((sum, ds) => sum + ds.avgEvaluation * ds.totalCommits, 0) /
          (totalCommits || 1)
        : 0;
      const totalWorkHours = teamDevs.reduce(
        (sum, ds) => sum + ds.totalWorkHours,
        0
      );

      return {
        team,
        developers: teamDevs,
        totalCommits,
        avgEvaluation,
        totalWorkHours,
      };
    });
  }, [teams, developerStats]);

  const summary = useMemo((): DashboardSummary => {
    const totalCommits = commits.length;
    const avgEvaluation = totalCommits > 0
      ? commits.reduce((sum, c) => sum + (c.evaluation_total || 0), 0) / totalCommits
      : 0;
    const avgProductivity = totalCommits > 0
      ? commits.reduce((sum, c) => sum + (c.productivity || 0), 0) / totalCommits
      : 0;
    const totalWorkHours = commits.reduce(
      (sum, c) => sum + (c.work_hours || 0),
      0
    );
    const totalAiDrivenMinutes = commits.reduce(
      (sum, c) => sum + (c.ai_driven_minutes || 0),
      0
    );

    return {
      totalTeams: teams.length,
      totalDevelopers: developers.length,
      totalCommits,
      avgEvaluation,
      avgProductivity,
      totalWorkHours,
      totalAiDrivenMinutes,
    };
  }, [commits, developers, teams]);

  return {
    commits: commits,
    developers,
    teams,
    loading,
    error,
    refetch: fetchData,
    developerStats,
    teamStats,
    summary,
    dateRange,
    setDateRange,
  };
}
