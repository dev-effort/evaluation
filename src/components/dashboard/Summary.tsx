import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { DashboardSummary, TeamStats } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './Summary.module.css';

interface SummaryProps {
  summary: DashboardSummary;
  teamStats: TeamStats[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function Summary({ summary, teamStats, dateRange, onDateRangeChange }: SummaryProps) {
  const teamCommitData = teamStats.map((ts) => ({
    name: ts.team.name,
    commits: ts.totalCommits,
    avgScore: ts.avgEvaluation.toFixed(1),
  }));

  const teamDistribution = teamStats.map((ts) => ({
    name: ts.team.name,
    value: ts.totalCommits,
  }));

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Dashboard Summary</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{summary.totalTeams}</span>
          <span className={styles.statLabel}>Teams</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{summary.totalDevelopers}</span>
          <span className={styles.statLabel}>Developers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{summary.totalCommits}</span>
          <span className={styles.statLabel}>Commits</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{summary.avgEvaluation.toFixed(1)}</span>
          <span className={styles.statLabel}>Avg Score</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{summary.avgProductivity.toFixed(0)}%</span>
          <span className={styles.statLabel}>Avg Productivity</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{summary.totalWorkHours.toFixed(1)}h</span>
          <span className={styles.statLabel}>Total Work Hours</span>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Commits by Team</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamCommitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
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
          <h3 className={styles.chartTitle}>Commit Distribution</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={teamDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                >
                  {teamDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '4px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
