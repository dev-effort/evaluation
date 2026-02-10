import { Link } from "react-router-dom";
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
} from "recharts";
import type { TeamStats as TeamStatsType } from "@/types";
import { DateFilter } from "./DateFilter";
import styles from "./TeamStats.module.css";

interface TeamStatsProps {
  stats: TeamStatsType[];
  commits: import("@/types").Commit[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const TYPE_COLORS = {
  develop: "#6366f1",
  meeting: "#22c55e",
  chore: "#f59e0b",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderStackedTooltip =
  (unit: string) =>
  ({ active, payload, label }: any) => {
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
            {unit}
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
          Total: {parseFloat(total.toFixed(1))}
          {unit}
        </p>
      </div>
    );
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderHoursTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const workHours = payload.find((p: any) => p.dataKey === "workHours");
  const aiHours = payload.find((p: any) => p.dataKey === "aiDrivenHours");
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
      {workHours && (
        <p style={{ margin: "0.15rem 0", color: workHours.color }}>
          {workHours.name}: {workHours.value}h
        </p>
      )}
      {aiHours && (
        <p style={{ margin: "0.15rem 0", color: aiHours.color }}>
          {aiHours.name}: {aiHours.value}h
        </p>
      )}
    </div>
  );
};

export function TeamStats({
  stats,
  commits,
  dateRange,
  onDateRangeChange,
}: TeamStatsProps) {
  const sortedByCommits = [...stats].sort(
    (a, b) => b.totalCommits - a.totalCommits,
  );

  // Commits by type (stacked bar chart)
  const commitsByTypeData = sortedByCommits.map((s) => ({
    name: s.team.name,
    develop: s.commitsByType.develop,
    meeting: s.commitsByType.meeting,
    chore: s.commitsByType.chore,
  }));

  // Work hours and AI driven hours
  const hoursData = sortedByCommits.map((s) => ({
    name: s.team.name,
    workHours: parseFloat(s.totalWorkHours.toFixed(1)),
    aiDrivenHours: parseFloat(
      (s.aiDrivenMinutesByType.develop / 60).toFixed(1),
    ),
  }));

  // Lines of code by team (develop commits only)
  const teamLinesData = sortedByCommits.map((s) => {
    const teamDevelopCommits = commits.filter(
      (c) =>
        c.team_id === s.team.id &&
        (c.type === "develop" || c.type === null),
    );
    const added = teamDevelopCommits.reduce(
      (sum, c) => sum + (c.lines_added || 0),
      0,
    );
    const deleted = teamDevelopCommits.reduce(
      (sum, c) => sum + (c.lines_deleted || 0),
      0,
    );
    return {
      name: s.team.name,
      added,
      deleted,
    };
  });

  // Calculate averages
  const avgTotalCommits =
    sortedByCommits.length > 0
      ? parseFloat(
          (
            sortedByCommits.reduce((sum, s) => sum + s.totalCommits, 0) /
            sortedByCommits.length
          ).toFixed(1),
        )
      : 0;
  const avgWorkHours =
    hoursData.length > 0
      ? parseFloat(
          (
            hoursData.reduce((sum, d) => sum + d.workHours, 0) /
            hoursData.length
          ).toFixed(1),
        )
      : 0;
  const avgAiDrivenHours =
    hoursData.length > 0
      ? parseFloat(
          (
            hoursData.reduce((sum, d) => sum + d.aiDrivenHours, 0) /
            hoursData.length
          ).toFixed(1),
        )
      : 0;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Team Statistics</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.chartsColumn}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Commits by Team</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={commitsByTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={renderStackedTooltip("")} />
                <Legend />
                <ReferenceLine
                  y={avgTotalCommits}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `Avg: ${avgTotalCommits}`,
                    fill: "#ef4444",
                    position: "right",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
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
          <h3 className={styles.chartTitle}>Work Hours & AI Driven by Team</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" unit="h" />
                <Tooltip content={renderHoursTooltip} />
                <Legend />
                <ReferenceLine
                  y={avgWorkHours}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `${avgWorkHours}h`,
                    fill: "#22c55e",
                    position: "left",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <ReferenceLine
                  y={avgAiDrivenHours}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `${avgAiDrivenHours}h`,
                    fill: "#ef4444",
                    position: "right",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="workHours"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Work Hours"
                />
                <Bar
                  dataKey="aiDrivenHours"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  name="AI Driven Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Lines of Code by Team</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={teamLinesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={renderStackedTooltip(" lines")} />
                <Legend />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                  dataKey="added"
                  name="Added"
                  stackId="lines"
                  fill="#22c55e"
                  label={
                    ((props: any) => {
                      const v = teamLinesData[props.index]?.added;
                      if (!v) return null;
                      return (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          fill="#fff"
                          fontSize={10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >{`+${v}`}</text>
                      );
                    }) as any
                  }
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                  dataKey="deleted"
                  name="Deleted"
                  stackId="lines"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  label={
                    ((props: any) => {
                      const v = teamLinesData[props.index]?.deleted;
                      if (!v) return null;
                      return (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          fill="#fff"
                          fontSize={10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >{`-${v}`}</text>
                      );
                    }) as any
                  }
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
                <th>Avg Score (Dev)</th>
                <th>Work Hours</th>
                <th>AI Minutes (Dev)</th>
                <th>Productivity</th>
              </tr>
            </thead>
            <tbody>
              {sortedByCommits.map((s) => (
                <tr key={s.team.id}>
                  <td>
                    <Link
                      to={`/teams/${s.team.id}`}
                      className={styles.teamLink}
                    >
                      {s.team.name}
                    </Link>
                  </td>
                  <td>{s.developers.length}</td>
                  <td>{s.totalCommits}</td>
                  <td>{s.avgEvaluationDevelop.toFixed(1)}</td>
                  <td>
                    {s.totalWorkHours.toFixed(1)}h (
                    {s.workHoursByType.develop.toFixed(1)}h)
                  </td>
                  <td>{s.aiDrivenMinutesByType.develop}m</td>
                  <td>
                    {s.workHoursByType.develop > 0 &&
                    s.aiDrivenMinutesByType.develop > 0
                      ? (
                          ((s.workHoursByType.develop * 60) /
                            s.aiDrivenMinutesByType.develop) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
