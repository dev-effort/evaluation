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
  Legend,
} from "recharts";
import type { DashboardSummary, TeamStats } from "@/types";
import { DateFilter } from "./DateFilter";
import styles from "./Summary.module.css";

interface SummaryProps {
  summary: DashboardSummary;
  teamStats: TeamStats[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const TYPE_COLORS = {
  develop: "#6366f1",
  meeting: "#22c55e",
  chore: "#f59e0b",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderStackedTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce(
    (sum: number, p: any) => sum + (p.value || 0),
    0,
  );
  return (
    <div
      style={{
        background: "#1a1a2e",
        border: "1px solid #333",
        borderRadius: "4px",
        padding: "0.5rem 0.75rem",
        color: "#fff",
        fontSize: "0.85rem",
      }}
    >
      <p style={{ margin: "0 0 0.25rem", fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: "0.15rem 0", color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
      <p
        style={{
          margin: "0.25rem 0 0",
          borderTop: "1px solid #444",
          paddingTop: "0.25rem",
          fontWeight: 600,
          color: "#fff",
        }}
      >
        Total: {total}
      </p>
    </div>
  );
};

export function Summary({
  summary,
  teamStats,
  dateRange,
  onDateRangeChange,
}: SummaryProps) {
  const teamCommitData = teamStats.map((ts) => ({
    name: ts.team.name,
    develop: ts.commitsByType.develop,
    meeting: ts.commitsByType.meeting,
    chore: ts.commitsByType.chore,
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
          <span className={styles.statLabel}>Teams</span>
          <span className={styles.statValue}>{summary.totalTeams}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Developers</span>
          <span className={styles.statValue}>{summary.totalDevelopers}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statValue}>{summary.totalCommits}</span>
          <span className={styles.statSub}>
            <span style={{ color: "#6366f1" }}>Dev {summary.commitsByType.develop}</span>
            {" / "}
            <span style={{ color: "#22c55e" }}>Meet {summary.commitsByType.meeting}</span>
            {" / "}
            <span style={{ color: "#f59e0b" }}>Chore {summary.commitsByType.chore}</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg Score</span>
          <span className={styles.statValue}>
            {summary.avgEvaluationDevelop.toFixed(1)}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg Productivity</span>
          <span className={styles.statValue}>
            {summary.avgProductivity.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className={styles.chartsColumn}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Commits by Team</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamCommitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={renderStackedTooltip} />
                <Legend />
                <Bar
                  dataKey="develop"
                  name="Develop"
                  stackId="commits"
                  fill={TYPE_COLORS.develop}
                />
                <Bar
                  dataKey="meeting"
                  name="Meeting"
                  stackId="commits"
                  fill={TYPE_COLORS.meeting}
                />
                <Bar
                  dataKey="chore"
                  name="Chore"
                  stackId="commits"
                  fill={TYPE_COLORS.chore}
                  radius={[4, 4, 0, 0]}
                />
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
                    background: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "4px",
                    color: "#fff",
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
