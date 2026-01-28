import { Link } from 'react-router-dom';
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

  const selectedDeveloper = sortedByCommits[0];
  const radarData = selectedDeveloper
    ? [
        { subject: 'Complexity', value: selectedDeveloper.evaluationBreakdown.complexity },
        { subject: 'Volume', value: selectedDeveloper.evaluationBreakdown.volume },
        { subject: 'Thinking', value: selectedDeveloper.evaluationBreakdown.thinking },
        { subject: 'Others', value: selectedDeveloper.evaluationBreakdown.others },
      ]
    : [];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Developer Statistics</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.chartsGrid}>
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

        {selectedDeveloper && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>
              Evaluation Breakdown: {selectedDeveloper.developer.name}
            </h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" stroke="#888" />
                  <PolarRadiusAxis stroke="#888" />
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
        )}
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
