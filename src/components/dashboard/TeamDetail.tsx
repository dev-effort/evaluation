import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { TeamStats } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './TeamDetail.module.css';

interface TeamDetailProps {
  teamStats: TeamStats[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function TeamDetail({
  teamStats,
  dateRange,
  onDateRangeChange,
}: TeamDetailProps) {
  const { teamId } = useParams<{ teamId: string }>();

  const team = useMemo(() => {
    return teamStats.find((ts) => ts.team.id === teamId);
  }, [teamStats, teamId]);

  if (!team) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <p>Team not found</p>
          <Link to="/teams" className={styles.backLink}>Back to Teams</Link>
        </div>
      </div>
    );
  }

  const totalScore = team.developers.reduce(
    (sum, d) => sum + d.avgEvaluation * d.totalCommits,
    0
  );
  const totalAiMinutes = team.developers.reduce(
    (sum, d) => sum + d.totalAiDrivenMinutes,
    0
  );

  const memberCommitData = [...team.developers]
    .sort((a, b) => b.totalCommits - a.totalCommits)
    .map((d) => ({
      name: d.developer.name,
      commits: d.totalCommits,
      avgScore: d.avgEvaluation,
    }));

  const avgBreakdown = team.developers.reduce(
    (acc, d) => {
      acc.complexity += d.evaluationBreakdown.complexity;
      acc.volume += d.evaluationBreakdown.volume;
      acc.thinking += d.evaluationBreakdown.thinking;
      acc.others += d.evaluationBreakdown.others;
      return acc;
    },
    { complexity: 0, volume: 0, thinking: 0, others: 0 }
  );

  const memberCount = team.developers.length || 1;
  const radarData = [
    { subject: 'Complexity', value: avgBreakdown.complexity / memberCount },
    { subject: 'Volume', value: avgBreakdown.volume / memberCount },
    { subject: 'Thinking', value: avgBreakdown.thinking / memberCount },
    { subject: 'Others', value: avgBreakdown.others / memberCount },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/teams" className={styles.backLink}>&larr; Back to Teams</Link>
        <h2 className={styles.title}>{team.team.name}</h2>
        <span className={styles.memberCount}>{team.developers.length} members</span>
      </div>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{team.totalCommits}</span>
          <span className={styles.statLabel}>Total Commits</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{team.avgEvaluation.toFixed(1)}</span>
          <span className={styles.statLabel}>Avg Score</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalScore.toFixed(0)}</span>
          <span className={styles.statLabel}>Total Score</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{team.totalWorkHours.toFixed(1)}h</span>
          <span className={styles.statLabel}>Total Work Hours</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{(totalAiMinutes / 60).toFixed(1)}h</span>
          <span className={styles.statLabel}>AI Driven Time</span>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Commits by Member</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberCommitData} layout="vertical">
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
                />
                <Bar dataKey="commits" fill="#6366f1" radius={[0, 4, 4, 0]} name="Commits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Team Avg Evaluation Breakdown</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" stroke="#888" />
                <PolarRadiusAxis stroke="#888" domain={[0, 4]} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.membersSection}>
        <h3 className={styles.chartTitle}>Team Members</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Commits</th>
                <th>Avg Score</th>
                <th>Work Hours</th>
                <th>AI Minutes</th>
                <th>Productivity</th>
              </tr>
            </thead>
            <tbody>
              {team.developers
                .sort((a, b) => b.totalCommits - a.totalCommits)
                .map((dev) => (
                  <tr key={dev.developer.id}>
                    <td>
                      <Link to={`/developers/${dev.developer.id}`} className={styles.developerLink}>
                        {dev.developer.name}
                      </Link>
                    </td>
                    <td>{dev.totalCommits}</td>
                    <td>{dev.avgEvaluation.toFixed(1)}</td>
                    <td>{dev.totalWorkHours.toFixed(1)}h</td>
                    <td>{dev.totalAiDrivenMinutes}m</td>
                    <td>{dev.avgProductivity.toFixed(0)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
