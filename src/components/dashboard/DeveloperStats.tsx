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
import type { DeveloperStats as DeveloperStatsType } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './DeveloperStats.module.css';

interface DeveloperStatsProps {
  stats: DeveloperStatsType[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DeveloperStats({ stats, dateRange, onDateRangeChange }: DeveloperStatsProps) {
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
              {sortedByCommits.map((s) => (
                <tr key={s.developer.id}>
                  <td>
                    <Link to={`/developers/${s.developer.id}`} className={styles.developerLink}>
                      {s.developer.name}
                    </Link>
                  </td>
                  <td>{(s.developer as { teams?: { name: string } }).teams?.name || '-'}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
