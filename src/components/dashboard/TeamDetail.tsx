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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { TeamStats, Commit, Developer, Team } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './TeamDetail.module.css';

interface CommitWithDeveloper extends Commit {
  developers: (Developer & { teams: Team | null }) | null;
}

interface TeamDetailProps {
  teamStats: TeamStats[];
  commits: CommitWithDeveloper[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function TeamDetail({
  teamStats,
  commits,
  dateRange,
  onDateRangeChange,
}: TeamDetailProps) {
  const { teamId } = useParams<{ teamId: string }>();

  const team = useMemo(() => {
    return teamStats.find((ts) => ts.team.id === teamId);
  }, [teamStats, teamId]);

  // Get team member IDs for filtering commits
  const teamMemberIds = useMemo(() => {
    if (!team) return [];
    return team.developers.map((d) => d.developer.id);
  }, [team]);

  // Calculate prefix counts for team's develop commits
  const prefixCounts = useMemo(() => {
    const prefixTypes = ['feat', 'fix', 'chore', 'refactor', 'docs'] as const;
    const teamDevelopCommits = commits.filter(
      (c) =>
        teamMemberIds.includes(c.developer_id || '') &&
        (c.type === 'develop' || c.type === null)
    );

    return prefixTypes.map((prefix) => ({
      prefix,
      count: teamDevelopCommits.filter(
        (c) =>
          c.message.toLowerCase().startsWith(`${prefix}(`) ||
          c.message.toLowerCase().startsWith(`${prefix}:`)
      ).length,
    }));
  }, [commits, teamMemberIds]);

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

  const totalScore = team.avgEvaluation * team.totalCommits;
  const totalAiMinutes = team.totalAiDrivenMinutes;
  const totalLinesAdded = team.developers.reduce(
    (sum, d) => sum + d.totalLinesAdded,
    0
  );
  const totalLinesDeleted = team.developers.reduce(
    (sum, d) => sum + d.totalLinesDeleted,
    0
  );

  // Type-based stats for the team
  const teamTypeStats = team.developers.reduce(
    (acc, d) => {
      acc.develop += d.commitsByType.develop;
      acc.meeting += d.commitsByType.meeting;
      acc.chore += d.commitsByType.chore;
      return acc;
    },
    { develop: 0, meeting: 0, chore: 0 }
  );

  const teamWorkHoursByType = team.developers.reduce(
    (acc, d) => {
      acc.develop += d.workHoursByType.develop;
      acc.meeting += d.workHoursByType.meeting;
      acc.chore += d.workHoursByType.chore;
      return acc;
    },
    { develop: 0, meeting: 0, chore: 0 }
  );

  const TYPE_COLORS = {
    develop: '#6366f1',
    meeting: '#22c55e',
    chore: '#f59e0b',
  };

  const memberCommitData = [...team.developers]
    .sort((a, b) => b.totalCommits - a.totalCommits)
    .map((d) => ({
      name: d.developer.name,
      develop: d.commitsByType.develop,
      meeting: d.commitsByType.meeting,
      chore: d.commitsByType.chore,
    }));

  const pieChartData = [
    { name: 'Develop', value: teamTypeStats.develop },
    { name: 'Meeting', value: teamTypeStats.meeting },
    { name: 'Chore', value: teamTypeStats.chore },
  ].filter((d) => d.value > 0);

  const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b'];

  // Time comparison data
  const timeComparisonData = [
    { name: 'Develop (AI Time)', value: parseFloat((team.aiDrivenMinutesByType.develop / 60).toFixed(1)) },
    { name: 'Meeting (Work Hours)', value: parseFloat(teamWorkHoursByType.meeting.toFixed(1)) },
    { name: 'Chore (Work Hours)', value: parseFloat(teamWorkHoursByType.chore.toFixed(1)) },
  ].filter((d) => d.value > 0);

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
          <span className={styles.statValue}>{totalScore.toFixed(0)}</span>
          <span className={styles.statLabel}>Total Score</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{team.avgEvaluationDevelop.toFixed(1)}</span>
          <span className={styles.statLabel}>Avg Score</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{team.totalWorkHours.toFixed(1)}h ({teamWorkHoursByType.develop.toFixed(1)}h)</span>
          <span className={styles.statLabel}>Total Work Hours (Dev)</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{(totalAiMinutes / 60).toFixed(1)}h</span>
          <span className={styles.statLabel}>AI Driven Time</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{teamWorkHoursByType.develop > 0 && team.aiDrivenMinutesByType.develop > 0 ? ((teamWorkHoursByType.develop * 60 / team.aiDrivenMinutesByType.develop) * 100).toFixed(0) : 0}%</span>
          <span className={styles.statLabel}>Productivity</span>
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

      <div className={styles.typeStatsContainer}>
        <div className={`${styles.typeStatsCard} ${styles.typeStatsCardDevelop}`}>
          <h4 className={styles.typeStatsTitle}>Develop</h4>
          <div className={styles.typeStatsGrid}>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{teamTypeStats.develop}</span>
              <span className={styles.typeStatLabel}>Commits</span>
            </div>
            <div className={styles.prefixCountsContainer}>
              {prefixCounts.map((p) => (
                <span key={p.prefix} className={styles.prefixBadge}>
                  {p.prefix}: {p.count}
                </span>
              ))}
            </div>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{team.avgEvaluationDevelop.toFixed(1)}</span>
              <span className={styles.typeStatLabel}>Avg Score</span>
            </div>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{teamWorkHoursByType.develop.toFixed(1)}h</span>
              <span className={styles.typeStatLabel}>Work Hours</span>
            </div>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{team.aiDrivenMinutesByType.develop}m</span>
              <span className={styles.typeStatLabel}>AI Time</span>
            </div>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{teamWorkHoursByType.develop > 0 && team.aiDrivenMinutesByType.develop > 0 ? ((teamWorkHoursByType.develop * 60 / team.aiDrivenMinutesByType.develop) * 100).toFixed(0) : 0}%</span>
              <span className={styles.typeStatLabel}>Productivity</span>
            </div>
          </div>
        </div>
        <div className={styles.typeStatsCard}>
          <h4 className={styles.typeStatsTitle}>Meeting</h4>
          <div className={styles.typeStatsGrid}>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{teamTypeStats.meeting}</span>
              <span className={styles.typeStatLabel}>Commits</span>
            </div>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{teamWorkHoursByType.meeting.toFixed(1)}h</span>
              <span className={styles.typeStatLabel}>Work Hours</span>
            </div>
          </div>
        </div>
        <div className={styles.typeStatsCard}>
          <h4 className={styles.typeStatsTitle}>Chore</h4>
          <div className={styles.typeStatsGrid}>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{teamTypeStats.chore}</span>
              <span className={styles.typeStatLabel}>Commits</span>
            </div>
            <div className={styles.typeStatItem}>
              <span className={styles.typeStatValue}>{teamWorkHoursByType.chore.toFixed(1)}h</span>
              <span className={styles.typeStatLabel}>Work Hours</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={`${styles.chartCard} ${styles.chartCardFullWidth}`}>
          <h3 className={styles.chartTitle}>Commits by Member</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={Math.max(300, team.developers.length * 50)}>
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
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="develop" name="Develop" stackId="commits" fill={TYPE_COLORS.develop} label={((props: any) => {
                  const v = memberCommitData[props.index]?.develop;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={11} textAnchor="middle" dominantBaseline="middle">{`Dev(${v})`}</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="meeting" name="Meeting" stackId="commits" fill={TYPE_COLORS.meeting} label={((props: any) => {
                  const v = memberCommitData[props.index]?.meeting;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={11} textAnchor="middle" dominantBaseline="middle">{`Meet(${v})`}</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="chore" name="Chore" stackId="commits" fill={TYPE_COLORS.chore} radius={[0, 4, 4, 0]} label={((props: any) => {
                  const v = memberCommitData[props.index]?.chore;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={11} textAnchor="middle" dominantBaseline="middle">{`Chore(${v})`}</text>;
                }) as any} />
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

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Commits by Type</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => [`${value} commits`, 'Count']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {timeComparisonData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Time Comparison</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={timeComparisonData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {timeComparisonData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#fff',
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => [`${value}h`, 'Hours']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className={styles.membersSection}>
        <h3 className={styles.chartTitle}>Team Members</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Commits</th>
                <th>Total Score</th>
                <th>Avg Score (Dev)</th>
                <th>Lines</th>
                <th>Work Hours (Dev)</th>
                <th>AI Minutes (Dev)</th>
                <th>Productivity (Dev)</th>
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
                    <td>{(dev.avgEvaluationDevelop * dev.commitsByType.develop).toFixed(0)}</td>
                    <td>{dev.avgEvaluationDevelop.toFixed(1)}</td>
                    <td>
                      <span style={{ color: '#22c55e' }}>+{dev.totalLinesAdded}</span>
                      {' / '}
                      <span style={{ color: '#ef4444' }}>-{dev.totalLinesDeleted}</span>
                    </td>
                    <td>{dev.totalWorkHours.toFixed(1)}h ({dev.workHoursByType.develop.toFixed(1)}h)</td>
                    <td>{dev.aiDrivenMinutesByType.develop}m</td>
                    <td>{dev.workHoursByType.develop > 0 && dev.aiDrivenMinutesByType.develop > 0 ? ((dev.workHoursByType.develop * 60 / dev.aiDrivenMinutesByType.develop) * 100).toFixed(0) : 0}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
