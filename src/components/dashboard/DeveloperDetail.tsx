import { useMemo, ReactNode } from 'react';
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
import type { DeveloperStats, Commit, Developer, Team } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './DeveloperDetail.module.css';

function renderCommitMessage(message: string): ReactNode {
  const lines = message.split('\n');
  const result: ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      result.push(
        <ul key={`ul-${result.length}`} className={styles.bulletList}>
          {currentBullets.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      currentBullets.push(trimmedLine.substring(2));
    } else if (trimmedLine === '') {
      flushBullets();
    } else {
      flushBullets();
      result.push(
        <p key={`p-${index}`} className={styles.messageLine}>
          {trimmedLine}
        </p>
      );
    }
  });

  flushBullets();
  return result;
}

interface CommitWithDeveloper extends Commit {
  developers: (Developer & { teams: Team | null }) | null;
}

interface DeveloperDetailProps {
  developerStats: DeveloperStats[];
  commits: CommitWithDeveloper[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DeveloperDetail({
  developerStats,
  commits,
  dateRange,
  onDateRangeChange,
}: DeveloperDetailProps) {
  const { developerId } = useParams<{ developerId: string }>();

  const developer = useMemo(() => {
    return developerStats.find((ds) => ds.developer.id === developerId);
  }, [developerStats, developerId]);

  const developerCommits = useMemo(() => {
    return commits
      .filter((c) => c.developer_id === developerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [commits, developerId]);

  if (!developer) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <p>Developer not found</p>
          <Link to="/developers" className={styles.backLink}>Back to Developers</Link>
        </div>
      </div>
    );
  }

  const radarData = [
    { subject: 'Complexity', value: developer.evaluationBreakdown.complexity },
    { subject: 'Volume', value: developer.evaluationBreakdown.volume },
    { subject: 'Thinking', value: developer.evaluationBreakdown.thinking },
    { subject: 'Others', value: developer.evaluationBreakdown.others },
  ];

  const commitsByDate = developerCommits.reduce((acc, commit) => {
    const date = new Date(commit.created_at).toLocaleDateString('ko-KR');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commitChartData = Object.entries(commitsByDate)
    .map(([date, count]) => ({ date, commits: count }))
    .reverse()
    .slice(-14);

  const teamName = (developer.developer as { teams?: { name: string } }).teams?.name || '-';

  // Type-based stats calculation
  const typeStats = useMemo(() => {
    const types = ['develop', 'meeting', 'chore'] as const;
    return types.map((type) => {
      const typeCommits = developerCommits.filter(
        (c) => (type === 'develop' ? (c.type === 'develop' || c.type === null) : c.type === type)
      );
      const count = typeCommits.length;
      const avgScore = count > 0
        ? typeCommits.reduce((sum, c) => sum + (c.evaluation_total || 0), 0) / count
        : 0;
      const totalWorkHours = typeCommits.reduce((sum, c) => sum + (c.work_hours || 0), 0);
      const totalAiMinutes = typeCommits.reduce((sum, c) => sum + (c.ai_driven_minutes || 0), 0);
      const avgProductivity = count > 0
        ? typeCommits.reduce((sum, c) => sum + (c.productivity || 0), 0) / count
        : 0;

      return {
        type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        avgScore,
        totalWorkHours,
        totalAiMinutes,
        avgProductivity,
      };
    });
  }, [developerCommits]);

  const pieChartData = typeStats
    .filter((stat) => stat.count > 0)
    .map((stat) => ({
      name: stat.label,
      value: stat.count,
    }));

  const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/developers" className={styles.backLink}>&larr; Back to Developers</Link>
        <h2 className={styles.title}>{developer.developer.name}</h2>
        <span className={styles.team}>{teamName}</span>
      </div>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{developer.totalCommits}</span>
          <span className={styles.statLabel}>Total Commits</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{developer.avgEvaluation.toFixed(1)}</span>
          <span className={styles.statLabel}>Avg Score</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{developer.totalWorkHours.toFixed(1)}h</span>
          <span className={styles.statLabel}>Total Work Hours</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{developer.totalAiDrivenMinutes}m</span>
          <span className={styles.statLabel}>AI Driven Time</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{developer.avgProductivity.toFixed(0)}%</span>
          <span className={styles.statLabel}>Avg Productivity</span>
        </div>
      </div>

      <div className={styles.typeStatsContainer}>
        {typeStats.map((stat) => (
          <div key={stat.type} className={styles.typeStatsCard}>
            <h4 className={styles.typeStatsTitle}>{stat.label}</h4>
            <div className={styles.typeStatsGrid}>
              <div className={styles.typeStatItem}>
                <span className={styles.typeStatValue}>{stat.count}</span>
                <span className={styles.typeStatLabel}>Commits</span>
              </div>
              <div className={styles.typeStatItem}>
                <span className={styles.typeStatValue}>{stat.avgScore.toFixed(1)}</span>
                <span className={styles.typeStatLabel}>Avg Score</span>
              </div>
              <div className={styles.typeStatItem}>
                <span className={styles.typeStatValue}>{stat.totalWorkHours.toFixed(1)}h</span>
                <span className={styles.typeStatLabel}>Work Hours</span>
              </div>
              {stat.type === 'develop' && (
                <>
                  <div className={styles.typeStatItem}>
                    <span className={styles.typeStatValue}>{stat.totalAiMinutes}m</span>
                    <span className={styles.typeStatLabel}>AI Time</span>
                  </div>
                  <div className={styles.typeStatItem}>
                    <span className={styles.typeStatValue}>{stat.avgProductivity.toFixed(0)}%</span>
                    <span className={styles.typeStatLabel}>Productivity</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Commits Over Time</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={commitChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '4px',
                  }}
                />
                <Bar dataKey="commits" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Evaluation Breakdown</h3>
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
                  }}
                  formatter={(value) => [`${value} commits`, 'Count']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.commitsSection}>
        <h3 className={styles.chartTitle}>Commit History ({developerCommits.length})</h3>
        <div className={styles.commitsList}>
          {developerCommits.length === 0 ? (
            <p className={styles.noCommits}>No commits in selected period</p>
          ) : (
            developerCommits.map((commit) => (
              <div key={commit.id} className={styles.commitCard}>
                <div className={styles.commitHeader}>
                  <span className={styles.commitId}>{commit.commit_id.substring(0, 8)}</span>
                  <span className={styles.commitDate}>
                    {new Date(commit.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className={styles.commitMessage}>
                  {renderCommitMessage(commit.message)}
                </div>
                <div className={styles.commitMeta}>
                  <span className={styles.evalBadge}>
                    Score: {commit.evaluation_total ?? '-'}
                  </span>
                  <span className={styles.evalDetail}>
                    (C:{commit.evaluation_complexity ?? 0} V:{commit.evaluation_volume ?? 0} T:{commit.evaluation_thinking ?? 0} O:{commit.evaluation_others ?? 0})
                  </span>
                  {commit.work_hours && (
                    <span className={styles.timeBadge}>H: {commit.work_hours}h</span>
                  )}
                  {commit.ai_driven_minutes && (
                    <span className={styles.timeBadge}>AI: {commit.ai_driven_minutes}m</span>
                  )}
                  {commit.productivity && (
                    <span className={styles.productivityBadge}>{commit.productivity}%</span>
                  )}
                </div>
                {commit.comment && (
                  <p className={styles.commitComment}>{commit.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
