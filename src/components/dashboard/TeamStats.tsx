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
  ReferenceLine,
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
    aiDrivenHours: parseFloat((s.totalAiDrivenMinutes / 60).toFixed(1)),
  }));

  const performanceData = sortedByCommits.map((s) => ({
    name: s.team.name,
    avgScore: parseFloat(s.avgEvaluation.toFixed(2)),
    members: s.developers.length,
  }));

  const avgCommits = commitData.length > 0
    ? parseFloat((commitData.reduce((sum, d) => sum + d.commits, 0) / commitData.length).toFixed(1))
    : 0;
  const avgWorkHours = commitData.length > 0
    ? parseFloat((commitData.reduce((sum, d) => sum + d.workHours, 0) / commitData.length).toFixed(1))
    : 0;
  const avgAiDrivenHours = commitData.length > 0
    ? parseFloat((commitData.reduce((sum, d) => sum + d.aiDrivenHours, 0) / commitData.length).toFixed(1))
    : 0;

  const overallAvgScore = performanceData.length > 0
    ? parseFloat((performanceData.reduce((sum, d) => sum + d.avgScore, 0) / performanceData.length).toFixed(2))
    : 0;

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
          <h3 className={styles.chartTitle}>Commits & Work Hours & AI Driven by Team</h3>
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
                <Legend />
                <ReferenceLine
                  yAxisId="left"
                  y={avgCommits}
                  stroke="#6366f1"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `${avgCommits}`, fill: '#6366f1', position: 'left', fontSize: 12, fontWeight: 600 }}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={avgWorkHours}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `${avgWorkHours}h`, fill: '#22c55e', position: 'right', fontSize: 12, fontWeight: 600 }}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={avgAiDrivenHours}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `${avgAiDrivenHours}h`, fill: '#f59e0b', position: 'right', fontSize: 12, fontWeight: 600 }}
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
                <Bar
                  yAxisId="right"
                  dataKey="aiDrivenHours"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  name="AI Driven Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Average Evaluation Score by Team</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={performanceData}>
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
                <ReferenceLine
                  y={overallAvgScore}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `${overallAvgScore}`, fill: '#ef4444', position: 'left', fontSize: 12, fontWeight: 600 }}
                />
                <Bar
                  dataKey="avgScore"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  name="Avg Score"
                />
              </BarChart>
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
              {sortedByCommits.map((s) => (
                  <tr key={s.team.id}>
                    <td>
                      <Link to={`/teams/${s.team.id}`} className={styles.teamLink}>
                        {s.team.name}
                      </Link>
                    </td>
                    <td>{s.developers.length}</td>
                    <td>{s.totalCommits}</td>
                    <td>{(s.avgEvaluation * s.totalCommits).toFixed(0)}</td>
                    <td>{s.avgEvaluation.toFixed(1)}</td>
                    <td>{s.totalWorkHours.toFixed(1)}h</td>
                    <td>{(s.totalAiDrivenMinutes / 60).toFixed(1)}h</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
