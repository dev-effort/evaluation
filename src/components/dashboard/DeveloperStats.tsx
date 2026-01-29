import { useMemo, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DeveloperStats as DeveloperStatsType, DeveloperTeam, Team, TeamStats as TeamStatsType } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './DeveloperStats.module.css';

interface DeveloperStatsProps {
  stats: DeveloperStatsType[];
  teamStats: TeamStatsType[];
  teams: Team[];
  developerTeams: DeveloperTeam[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DeveloperStats({ stats, teamStats, teams, developerTeams, dateRange, onDateRangeChange }: DeveloperStatsProps) {
  const [expandedDevs, setExpandedDevs] = useState<Set<string>>(new Set());

  const toggleExpand = (devId: string) => {
    setExpandedDevs((prev) => {
      const next = new Set(prev);
      if (next.has(devId)) {
        next.delete(devId);
      } else {
        next.add(devId);
      }
      return next;
    });
  };

  // Build per-developer per-team stats from teamStats
  const devTeamStatsMap = useMemo(() => {
    const map = new Map<string, { team: Team; stats: DeveloperStatsType }[]>();
    teamStats.forEach((ts) => {
      ts.developers.forEach((devStat) => {
        const devId = devStat.developer.id;
        const arr = map.get(devId) || [];
        arr.push({ team: ts.team, stats: devStat });
        map.set(devId, arr);
      });
    });
    return map;
  }, [teamStats]);
  const sortedByCommits = [...stats].sort((a, b) => b.totalCommits - a.totalCommits);

  const commitData = sortedByCommits.map((s) => ({
    name: s.developer.name,
    develop: s.commitsByType.develop,
    meeting: s.commitsByType.meeting,
    chore: s.commitsByType.chore,
  }));

  const TYPE_COLORS = {
    develop: '#6366f1',
    meeting: '#22c55e',
    chore: '#f59e0b',
  };

  // Summary calculations
  const devCount = stats.length || 1;
  const totalCommits = stats.reduce((sum, s) => sum + s.totalCommits, 0);
  const totalDevelop = stats.reduce((sum, s) => sum + s.commitsByType.develop, 0);
  const totalMeeting = stats.reduce((sum, s) => sum + s.commitsByType.meeting, 0);
  const totalChore = stats.reduce((sum, s) => sum + s.commitsByType.chore, 0);
  const totalWorkHours = stats.reduce((sum, s) => sum + s.totalWorkHours, 0);
  const totalAiMinutes = stats.reduce((sum, s) => sum + s.totalAiDrivenMinutes, 0);
  const avgScore = totalCommits > 0
    ? stats.reduce((sum, s) => sum + s.avgEvaluation * s.totalCommits, 0) / totalCommits
    : 0;
  const avgWorkHours = totalWorkHours / devCount;
  const avgAiMinutes = totalAiMinutes / devCount;
  const avgProductivity = totalCommits > 0
    ? stats.reduce((sum, s) => sum + s.avgProductivity * s.totalCommits, 0) / totalCommits
    : 0;
  const totalLinesAdded = stats.reduce((sum, s) => sum + s.totalLinesAdded, 0);
  const totalLinesDeleted = stats.reduce((sum, s) => sum + s.totalLinesDeleted, 0);

  // Build team lookup: developerId -> team names
  const teamMap = useMemo(() => {
    const tMap = new Map<string, string>();
    teams.forEach((t) => tMap.set(t.id, t.name));

    const devTeamMap = new Map<string, string[]>();
    if (developerTeams.length > 0) {
      developerTeams.forEach((dt) => {
        const teamName = tMap.get(dt.team_id);
        if (!teamName) return;
        const existing = devTeamMap.get(dt.developer_id) || [];
        existing.push(teamName);
        devTeamMap.set(dt.developer_id, existing);
      });
    } else {
      stats.forEach((s) => {
        const teamName = (s.developer as { teams?: { name: string } }).teams?.name;
        if (teamName) {
          devTeamMap.set(s.developer.id, [teamName]);
        }
      });
    }
    return devTeamMap;
  }, [teams, developerTeams, stats]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Developer Statistics</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Commits by Developer</h3>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={Math.max(350, sortedByCommits.length * 40)}>
            <BarChart data={commitData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" />
              <YAxis dataKey="name" type="category" stroke="#888" width={100} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="develop" name="Develop" stackId="commits" fill={TYPE_COLORS.develop} />
              <Bar dataKey="meeting" name="Meeting" stackId="commits" fill={TYPE_COLORS.meeting} />
              <Bar dataKey="chore" name="Chore" stackId="commits" fill={TYPE_COLORS.chore} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalCommits}</span>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statSub}>
            <span style={{ color: '#6366f1' }}>{totalDevelop}</span>
            {' / '}
            <span style={{ color: '#22c55e' }}>{totalMeeting}</span>
            {' / '}
            <span style={{ color: '#f59e0b' }}>{totalChore}</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{avgScore.toFixed(1)}</span>
          <span className={styles.statLabel}>Avg Score</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalWorkHours.toFixed(1)}h</span>
          <span className={styles.statLabel}>Total Work Hours</span>
          <span className={styles.statSub}>avg {avgWorkHours.toFixed(1)}h</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalAiMinutes}m</span>
          <span className={styles.statLabel}>Total AI Minutes</span>
          <span className={styles.statSub}>avg {avgAiMinutes.toFixed(0)}m</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{avgProductivity.toFixed(0)}%</span>
          <span className={styles.statLabel}>Avg Productivity</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalLinesAdded + totalLinesDeleted}</span>
          <span className={styles.statLabel}>Total Lines</span>
          <span className={styles.statSub}>
            <span style={{ color: '#22c55e' }}>+{totalLinesAdded}</span>
            {' / '}
            <span style={{ color: '#ef4444' }}>-{totalLinesDeleted}</span>
          </span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.chartTitle}>All Developers</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Team</th>
                <th>Commits</th>
                <th>Develop</th>
                <th>Meeting</th>
                <th>Chore</th>
                <th>Avg Score</th>
                <th>Lines</th>
                <th>Work Hours</th>
                <th>AI Minutes</th>
                <th>Productivity</th>
              </tr>
            </thead>
            <tbody>
              {sortedByCommits.map((s) => {
                const devId = s.developer.id;
                const perTeam = devTeamStatsMap.get(devId) || [];
                const isMultiTeam = perTeam.length > 1;
                const isExpanded = expandedDevs.has(devId);

                return (
                  <Fragment key={devId}>
                    <tr
                      className={isMultiTeam ? styles.expandableRow : undefined}
                      onClick={isMultiTeam ? () => toggleExpand(devId) : undefined}
                    >
                      <td>
                        <div className={styles.nameCell}>
                          {isMultiTeam && (
                            <span className={styles.expandIcon}>{isExpanded ? '▾' : '▸'}</span>
                          )}
                          <Link
                            to={`/developers/${devId}`}
                            className={styles.developerLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {s.developer.name}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <div className={styles.teamBadges}>
                          {isMultiTeam ? (
                            <span className={`${styles.teamBadge} ${styles.teamBadgeAll}`}>All</span>
                          ) : (
                            <>
                              {(teamMap.get(devId) || []).map((name) => (
                                <span key={name} className={styles.teamBadge}>{name}</span>
                              ))}
                              {!(teamMap.get(devId) || []).length && '-'}
                            </>
                          )}
                        </div>
                      </td>
                      <td>{s.totalCommits}</td>
                      <td>{s.commitsByType.develop}</td>
                      <td>{s.commitsByType.meeting}</td>
                      <td>{s.commitsByType.chore}</td>
                      <td>{s.avgEvaluation.toFixed(1)}</td>
                      <td>
                        <span style={{ color: '#22c55e' }}>+{s.totalLinesAdded}</span>
                        {' / '}
                        <span style={{ color: '#ef4444' }}>-{s.totalLinesDeleted}</span>
                      </td>
                      <td>{s.totalWorkHours.toFixed(1)}h</td>
                      <td>{s.totalAiDrivenMinutes}m</td>
                      <td>{s.avgProductivity.toFixed(0)}%</td>
                    </tr>
                    {isMultiTeam && isExpanded && perTeam.map((pt) => (
                      <tr key={`${devId}-${pt.team.id}`} className={styles.subRow}>
                        <td></td>
                        <td>
                          <div className={styles.teamBadges}>
                            <span className={styles.teamBadge}>{pt.team.name}</span>
                          </div>
                        </td>
                        <td>{pt.stats.totalCommits}</td>
                        <td>{pt.stats.commitsByType.develop}</td>
                        <td>{pt.stats.commitsByType.meeting}</td>
                        <td>{pt.stats.commitsByType.chore}</td>
                        <td>{pt.stats.avgEvaluation.toFixed(1)}</td>
                        <td>
                          <span style={{ color: '#22c55e' }}>+{pt.stats.totalLinesAdded}</span>
                          {' / '}
                          <span style={{ color: '#ef4444' }}>-{pt.stats.totalLinesDeleted}</span>
                        </td>
                        <td>{pt.stats.totalWorkHours.toFixed(1)}h</td>
                        <td>{pt.stats.totalAiDrivenMinutes}m</td>
                        <td>{pt.stats.avgProductivity.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
