import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { TeamStats as TeamStatsType } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './TeamStats.module.css';

interface TeamStatsProps {
  stats: TeamStatsType[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function TeamStats({ stats, dateRange, onDateRangeChange }: TeamStatsProps) {
  const sortedByCommits = [...stats].sort((a, b) => b.totalCommits - a.totalCommits);

  const commitData = sortedByCommits.map((s) => ({
    name: s.team.name,
    commits: s.totalCommits,
    avgScore: s.avgEvaluation,
    workHours: s.totalWorkHours,
  }));

  const performanceData = sortedByCommits.map((s) => ({
    name: s.team.name,
    avgScore: parseFloat(s.avgEvaluation.toFixed(2)),
    members: s.developers.length,
  }));

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Team Statistics</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Commits & Work Hours by Team</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={commitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis yAxisId="left" stroke="#888" />
                <YAxis yAxisId="right" orientation="right" stroke="#888" />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="commits"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="Commits"
                />
                <Bar
                  yAxisId="right"
                  dataKey="workHours"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Work Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Average Evaluation Score by Team</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                  name="Avg Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.chartTitle}>Team Overview</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Team</th>
                <th>Members</th>
                <th>Total Commits</th>
                <th>Total Score</th>
                <th>Avg Score</th>
                <th>Total Work Hours</th>
                <th>Total AI Driven</th>
              </tr>
            </thead>
            <tbody>
              {sortedByCommits.map((s) => {
                const totalScore = s.developers.reduce((sum, d) => sum + d.avgEvaluation * d.totalCommits, 0);
                const totalAiMinutes = s.developers.reduce((sum, d) => sum + d.totalAiDrivenMinutes, 0);
                return (
                  <tr key={s.team.id}>
                    <td>
                      <Link to={`/teams/${s.team.id}`} className={styles.teamLink}>
                        {s.team.name}
                      </Link>
                    </td>
                    <td>{s.developers.length}</td>
                    <td>{s.totalCommits}</td>
                    <td>{totalScore.toFixed(0)}</td>
                    <td>{s.avgEvaluation.toFixed(1)}</td>
                    <td>{s.totalWorkHours.toFixed(1)}h</td>
                    <td>{(totalAiMinutes / 60).toFixed(1)}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
