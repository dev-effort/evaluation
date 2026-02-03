import { useMemo, useState, Fragment } from "react";
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
} from "recharts";
import type {
  Commit,
  DeveloperStats as DeveloperStatsType,
  DeveloperTeam,
  Team,
  TeamStats as TeamStatsType,
} from "@/types";
import { DateFilter } from "./DateFilter";
import styles from "./DeveloperStats.module.css";

interface DeveloperStatsProps {
  stats: DeveloperStatsType[];
  teamStats: TeamStatsType[];
  teams: Team[];
  developerTeams: DeveloperTeam[];
  commits: Commit[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DeveloperStats({
  stats,
  teamStats,
  teams,
  developerTeams,
  commits,
  dateRange,
  onDateRangeChange,
}: DeveloperStatsProps) {
  const [expandedDevs, setExpandedDevs] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );
  const [isCommitChartHovered, setIsCommitChartHovered] = useState(false);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const toggleExpand = (devId: string) => {
    setExpandedDevs((prev) => {
      const next = new Set(prev);
      if (next.has(devId)) {
        next.delete(devId);
      } else {
        next.add(devId);
      }
      return next;
    });
  };

  // Build per-developer per-team stats from teamStats
  const devTeamStatsMap = useMemo(() => {
    const map = new Map<string, { team: Team; stats: DeveloperStatsType }[]>();
    teamStats.forEach((ts) => {
      ts.developers.forEach((devStat) => {
        const devId = devStat.developer.id;
        const arr = map.get(devId) || [];
        arr.push({ team: ts.team, stats: devStat });
        map.set(devId, arr);
      });
    });
    return map;
  }, [teamStats]);

  const dailyCommitData = useMemo(() => {
    const dateMap = new Map<
      string,
      { date: string; develop: number; meeting: number; chore: number }
    >();
    commits.forEach((c) => {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!dateMap.has(key)) {
        dateMap.set(key, { date: label, develop: 0, meeting: 0, chore: 0 });
      }
      const entry = dateMap.get(key)!;
      const type = c.type || "develop";
      entry[type] += 1;
    });
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [commits]);

  const sortedByCommits = [...stats].sort(
    (a, b) => b.totalCommits - a.totalCommits,
  );

  const commitData = sortedByCommits.map((s) => ({
    name: s.developer.name,
    develop: s.commitsByType.develop,
    meeting: s.commitsByType.meeting,
    chore: s.commitsByType.chore,
  }));

  // Developer time data for hover chart (AI, Meeting, Chore hours)
  const developerTimeData = sortedByCommits.map((s) => ({
    name: s.developer.name,
    ai: parseFloat((s.aiDrivenMinutesByType.develop / 60).toFixed(1)),
    meeting: parseFloat(s.workHoursByType.meeting.toFixed(1)),
    chore: parseFloat(s.workHoursByType.chore.toFixed(1)),
  }));

  const workHoursData = sortedByCommits.map((s) => ({
    name: s.developer.name,
    develop: parseFloat(s.workHoursByType.develop.toFixed(1)),
    meeting: parseFloat(s.workHoursByType.meeting.toFixed(1)),
    chore: parseFloat(s.workHoursByType.chore.toFixed(1)),
    aiDriven: parseFloat((s.aiDrivenMinutesByType.develop / 60).toFixed(1)),
    aiMeeting: parseFloat(s.workHoursByType.meeting.toFixed(1)),
    aiChore: parseFloat(s.workHoursByType.chore.toFixed(1)),
  }));

  const totalWorkHoursByType = [
    {
      name: "All Developers",
      develop: parseFloat(
        stats.reduce((sum, s) => sum + s.workHoursByType.develop, 0).toFixed(1),
      ),
      meeting: parseFloat(
        stats.reduce((sum, s) => sum + s.workHoursByType.meeting, 0).toFixed(1),
      ),
      chore: parseFloat(
        stats.reduce((sum, s) => sum + s.workHoursByType.chore, 0).toFixed(1),
      ),
      aiDriven: parseFloat(
        stats
          .reduce((sum, s) => sum + s.aiDrivenMinutesByType.develop / 60, 0)
          .toFixed(1),
      ),
      aiMeeting: parseFloat(
        stats.reduce((sum, s) => sum + s.workHoursByType.meeting, 0).toFixed(1),
      ),
      aiChore: parseFloat(
        stats.reduce((sum, s) => sum + s.workHoursByType.chore, 0).toFixed(1),
      ),
    },
  ];

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
  const renderWorkHoursTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const humanKeys = ["develop", "meeting", "chore"];
    const aiKeys = ["aiDriven", "aiMeeting", "aiChore"];
    const humanItems = payload.filter((p: any) =>
      humanKeys.includes(p.dataKey),
    );
    const aiItems = payload.filter((p: any) => aiKeys.includes(p.dataKey));
    const humanTotal = humanItems.reduce(
      (sum: number, p: any) => sum + (p.value || 0),
      0,
    );
    const aiTotal = aiItems.reduce(
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
        <p style={{ margin: "0 0 0.4rem", fontWeight: 600 }}>{label}</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div>
            {humanItems.map((p: any) => (
              <p
                key={p.dataKey}
                style={{ margin: "0.15rem 0", color: p.color }}
              >
                {p.name}: {p.value}h
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
              Work: {parseFloat(humanTotal.toFixed(1))}h
            </p>
          </div>
          <div style={{ borderLeft: "1px solid #444", paddingLeft: "0.75rem" }}>
            {aiItems.map((p: any) => (
              <p
                key={p.dataKey}
                style={{ margin: "0.15rem 0", color: p.color }}
              >
                {p.name}: {p.value}h
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
              AI: {parseFloat(aiTotal.toFixed(1))}h
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Summary calculations
  const dayCount = useMemo(() => {
    const dates = new Set<string>();
    commits.forEach((c) => {
      const d = new Date(c.created_at);
      dates.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    });
    return dates.size || 1;
  }, [commits]);

  const totalCommits = stats.reduce((sum, s) => sum + s.totalCommits, 0);
  const totalDevelop = stats.reduce(
    (sum, s) => sum + s.commitsByType.develop,
    0,
  );
  const totalMeeting = stats.reduce(
    (sum, s) => sum + s.commitsByType.meeting,
    0,
  );
  const totalChore = stats.reduce((sum, s) => sum + s.commitsByType.chore, 0);
  const totalWorkHours = stats.reduce((sum, s) => sum + s.totalWorkHours, 0);
  const totalDevelopWorkHours = stats.reduce(
    (sum, s) => sum + s.workHoursByType.develop,
    0,
  );
  const totalMeetingWorkHours = stats.reduce(
    (sum, s) => sum + s.workHoursByType.meeting,
    0,
  );
  const totalChoreWorkHours = stats.reduce(
    (sum, s) => sum + s.workHoursByType.chore,
    0,
  );
  const totalDevelopAiMinutes = stats.reduce(
    (sum, s) => sum + s.aiDrivenMinutesByType.develop,
    0,
  );
  const avgScore =
    totalDevelop > 0
      ? stats.reduce(
          (sum, s) => sum + s.avgEvaluationDevelop * s.commitsByType.develop,
          0,
        ) / totalDevelop
      : 0;
  const avgProductivity =
    totalDevelopWorkHours > 0 && totalDevelopAiMinutes > 0
      ? ((totalDevelopWorkHours * 60) / totalDevelopAiMinutes) * 100
      : 0;
  const developCommits = commits.filter(
    (c) => c.type === "develop" || c.type === null,
  );
  const totalLinesAdded = developCommits.reduce(
    (sum, c) => sum + (c.lines_added || 0),
    0,
  );
  const totalLinesDeleted = developCommits.reduce(
    (sum, c) => sum + (c.lines_deleted || 0),
    0,
  );

  // Build develop-only lines per developer (and per developer+team)
  const developLinesMap = useMemo(() => {
    const devMap = new Map<string, { added: number; deleted: number }>();
    const devTeamMap = new Map<string, { added: number; deleted: number }>();
    commits.forEach((c) => {
      if (c.type !== "develop" && c.type !== null) return;
      if (!c.developer_id) return;
      const devKey = c.developer_id;
      const prev = devMap.get(devKey) || { added: 0, deleted: 0 };
      prev.added += c.lines_added || 0;
      prev.deleted += c.lines_deleted || 0;
      devMap.set(devKey, prev);
      if (c.team_id) {
        const dtKey = `${c.developer_id}:${c.team_id}`;
        const prevDt = devTeamMap.get(dtKey) || { added: 0, deleted: 0 };
        prevDt.added += c.lines_added || 0;
        prevDt.deleted += c.lines_deleted || 0;
        devTeamMap.set(dtKey, prevDt);
      }
    });
    return { devMap, devTeamMap };
  }, [commits]);

  // Build team lookup: developerId -> team names
  const teamMap = useMemo(() => {
    const tMap = new Map<string, string>();
    teams.forEach((t) => tMap.set(t.id, t.name));

    const devTeamMap = new Map<string, string[]>();
    if (developerTeams.length > 0) {
      developerTeams.forEach((dt) => {
        const teamName = tMap.get(dt.team_id);
        if (!teamName) return;
        const existing = devTeamMap.get(dt.developer_id) || [];
        existing.push(teamName);
        devTeamMap.set(dt.developer_id, existing);
      });
    } else {
      stats.forEach((s) => {
        const teamName = (s.developer as { teams?: { name: string } }).teams
          ?.name;
        if (teamName) {
          devTeamMap.set(s.developer.id, [teamName]);
        }
      });
    }
    return devTeamMap;
  }, [teams, developerTeams, stats]);

  const sortedStats = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return stats;
    }
    const getVal = (s: DeveloperStatsType): number | string => {
      const devId = s.developer.id;
      switch (sortKey) {
        case "name":
          return s.developer.name;
        case "team":
          return (teamMap.get(devId) || []).join(",");
        case "commits":
          return s.totalCommits;
        case "develop":
          return s.commitsByType.develop;
        case "meeting":
          return s.commitsByType.meeting;
        case "chore":
          return s.commitsByType.chore;
        case "avgScore":
          return s.avgEvaluationDevelop;
        case "lines": {
          const l = developLinesMap.devMap.get(devId);
          return l ? l.added + l.deleted : 0;
        }
        case "workHours":
          return s.totalWorkHours;
        case "aiMinutes":
          return s.aiDrivenMinutesByType.develop;
        case "productivity": {
          const wh = s.workHoursByType.develop;
          const ai = s.aiDrivenMinutesByType.develop;
          return wh > 0 && ai > 0 ? ((wh * 60) / ai) * 100 : 0;
        }
        default:
          return 0;
      }
    };
    return [...stats].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp =
        typeof va === "string" && typeof vb === "string"
          ? va.localeCompare(vb)
          : (va as number) - (vb as number);
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [stats, sortKey, sortDirection, teamMap, developLinesMap]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Developer Statistics</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statValue}>{totalCommits}</span>
          <span className={styles.statSub}>
            <span style={{ color: "#6366f1" }}>Dev {totalDevelop}</span>
            {" / "}
            <span style={{ color: "#22c55e" }}>Meet {totalMeeting}</span>
            {" / "}
            <span style={{ color: "#f59e0b" }}>Chore {totalChore}</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg Score</span>
          <span className={styles.statValue}>{avgScore.toFixed(1)}</span>
          <span className={styles.statSub}>
            <span style={{ color: "#a78bfa" }}>
              Total {(avgScore * totalDevelop).toFixed(0)}
            </span>
            {" / "}
            <span style={{ color: "#6366f1" }}>Dev {totalDevelop}</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Human Work Hours</span>
          <span className={styles.statValue}>{totalWorkHours.toFixed(1)}h</span>
          <span className={styles.statSub}>
            <span style={{ color: "#6366f1" }}>
              Dev {totalDevelopWorkHours.toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#f59e0b" }}>
              Chore {totalChoreWorkHours.toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#22c55e" }}>
              Meet {totalMeetingWorkHours.toFixed(1)}h
            </span>
          </span>
          <div className={styles.statHoverTip}>
            <span style={{ color: "#888", fontSize: "0.75rem" }}>
              Daily Avg ({dayCount}days)
            </span>
            <span
              style={{ fontSize: "1.5rem", fontWeight: 600, color: "#6366f1" }}
            >
              {(totalWorkHours / dayCount).toFixed(1)}h
            </span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Human with AI Work Hours</span>
          <span className={styles.statValue}>
            {(
              totalDevelopAiMinutes / 60 +
              totalMeetingWorkHours +
              totalChoreWorkHours
            ).toFixed(1)}
            h
          </span>
          <span className={styles.statSub}>
            <span style={{ color: "#ef4444" }}>
              AI {(totalDevelopAiMinutes / 60).toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#f59e0b" }}>
              Chore {totalChoreWorkHours.toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#22c55e" }}>
              Meet {totalMeetingWorkHours.toFixed(1)}h
            </span>
          </span>
          <div className={styles.statHoverTip}>
            <span style={{ color: "#888", fontSize: "0.75rem" }}>
              Daily Avg ({dayCount}days)
            </span>
            <span
              style={{ fontSize: "1.5rem", fontWeight: 600, color: "#6366f1" }}
            >
              {(
                (totalDevelopAiMinutes / 60 +
                  totalMeetingWorkHours +
                  totalChoreWorkHours) /
                dayCount
              ).toFixed(1)}
              h
            </span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg Productivity</span>
          <span className={styles.statValue}>
            {avgProductivity.toFixed(0)}%
          </span>
          <span className={styles.statSub}>
            <span style={{ color: "#6366f1" }}>
              Dev {totalDevelopWorkHours.toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#ef4444" }}>
              AI {(totalDevelopAiMinutes / 60).toFixed(1)}h
            </span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Lines</span>
          <span className={styles.statValue}>
            {totalLinesAdded + totalLinesDeleted}
          </span>
          <span className={styles.statSub}>
            <span style={{ color: "#22c55e" }}>+{totalLinesAdded}</span>
            {" / "}
            <span style={{ color: "#ef4444" }}>-{totalLinesDeleted}</span>
          </span>
        </div>
      </div>

      <div className={styles.chartsColumn}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Daily Commits</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyCommitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" interval={0} />
              <YAxis stroke="#888" allowDecimals={false} />
              <Tooltip content={renderStackedTooltip("")} />
              <Legend />
              <Bar
                dataKey="develop"
                name="Develop"
                stackId="daily"
                fill={TYPE_COLORS.develop}
              />
              <Bar
                dataKey="meeting"
                name="Meeting"
                stackId="daily"
                fill={TYPE_COLORS.meeting}
              />
              <Bar
                dataKey="chore"
                name="Chore"
                stackId="daily"
                fill={TYPE_COLORS.chore}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className={styles.chartCard}
          onMouseEnter={() => setIsCommitChartHovered(true)}
          onMouseLeave={() => setIsCommitChartHovered(false)}
        >
          <h3 className={styles.chartTitle}>
            {isCommitChartHovered
              ? "Hours by Developer (AI / Meeting / Chore)"
              : "Commits by Developer"}
          </h3>
          {isCommitChartHovered ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={developerTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="name"
                  type="category"
                  stroke="#888"
                  interval={0}
                />
                <YAxis type="number" stroke="#888" unit="h" />
                <Tooltip content={renderStackedTooltip("h")} />
                <Legend />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                  dataKey="ai"
                  name="AI Time"
                  stackId="hours"
                  fill={TYPE_COLORS.develop}
                  label={
                    ((props: any) => {
                      const v = developerTimeData[props.index]?.ai;
                      if (!v) return null;
                      return (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          fill="#fff"
                          fontSize={10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >{`AI(${v}h)`}</text>
                      );
                    }) as any
                  }
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                  dataKey="meeting"
                  name="Meeting"
                  stackId="hours"
                  fill={TYPE_COLORS.meeting}
                  label={
                    ((props: any) => {
                      const v = developerTimeData[props.index]?.meeting;
                      if (!v) return null;
                      return (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          fill="#fff"
                          fontSize={10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >{`Meet(${v}h)`}</text>
                      );
                    }) as any
                  }
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                  dataKey="chore"
                  name="Chore"
                  stackId="hours"
                  fill={TYPE_COLORS.chore}
                  radius={[4, 4, 0, 0]}
                  label={
                    ((props: any) => {
                      const v = developerTimeData[props.index]?.chore;
                      if (!v) return null;
                      return (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          fill="#fff"
                          fontSize={10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >{`Chore(${v}h)`}</text>
                      );
                    }) as any
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={commitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="name"
                  type="category"
                  stroke="#888"
                  interval={0}
                />
                <YAxis type="number" stroke="#888" />
                <Tooltip content={renderStackedTooltip("")} />
                <Legend />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                  dataKey="develop"
                  name="Develop"
                  stackId="commits"
                  fill={TYPE_COLORS.develop}
                  label={
                    ((props: any) => {
                      const v = commitData[props.index]?.develop;
                      if (!v) return null;
                      return (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          fill="#fff"
                          fontSize={10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >{`Dev(${v})`}</text>
                      );
                    }) as any
                  }
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                  dataKey="meeting"
                  name="Meeting"
                  stackId="commits"
                  fill={TYPE_COLORS.meeting}
                  label={
                    ((props: any) => {
                      const v = commitData[props.index]?.meeting;
                      if (!v) return null;
                      return (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          fill="#fff"
                          fontSize={10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >{`Meet(${v})`}</text>
                      );
                    }) as any
                  }
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                  dataKey="chore"
                  name="Chore"
                  stackId="commits"
                  fill={TYPE_COLORS.chore}
                  radius={[4, 4, 0, 0]}
                  label={
                    ((props: any) => {
                      const v = commitData[props.index]?.chore;
                      if (!v) return null;
                      return (
                        <text
                          x={props.x + props.width / 2}
                          y={props.y + props.height / 2}
                          fill="#fff"
                          fontSize={10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >{`Chore(${v})`}</text>
                      );
                    }) as any
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Work Hours by Developer</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={workHoursData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="name"
                type="category"
                stroke="#888"
                interval={0}
              />
              <YAxis type="number" stroke="#888" unit="h" />
              <Tooltip content={renderWorkHoursTooltip} />
              <Legend />
              <Bar
                dataKey="develop"
                name="Develop"
                stackId="h"
                fill={TYPE_COLORS.develop}
              />
              <Bar
                dataKey="meeting"
                name="Meeting"
                stackId="h"
                fill={TYPE_COLORS.meeting}
              />
              <Bar
                dataKey="chore"
                name="Chore"
                stackId="h"
                fill={TYPE_COLORS.chore}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="aiDriven"
                name="AI Driven"
                stackId="ai"
                fill="#ef4444"
              />
              <Bar
                dataKey="aiMeeting"
                name="Meeting"
                stackId="ai"
                fill={TYPE_COLORS.meeting}
                legendType="none"
              />
              <Bar
                dataKey="aiChore"
                name="Chore"
                stackId="ai"
                fill={TYPE_COLORS.chore}
                legendType="none"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Total Work Hours by Type</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              data={totalWorkHoursByType}
              layout="vertical"
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" unit="h" />
              <YAxis dataKey="name" type="category" stroke="#888" width={100} />
              <Tooltip content={renderWorkHoursTooltip} />
              <Legend />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Bar
                dataKey="develop"
                name="Develop"
                stackId="h"
                fill={TYPE_COLORS.develop}
                label={
                  ((props: any) => {
                    const v = totalWorkHoursByType[props.index]?.develop;
                    if (!v) return null;
                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={props.y + props.height / 2}
                        fill="#fff"
                        fontSize={10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {v}h
                      </text>
                    );
                  }) as any
                }
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Bar
                dataKey="meeting"
                name="Meeting"
                stackId="h"
                fill={TYPE_COLORS.meeting}
                label={
                  ((props: any) => {
                    const v = totalWorkHoursByType[props.index]?.meeting;
                    if (!v) return null;
                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={props.y + props.height / 2}
                        fill="#fff"
                        fontSize={10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {v}h
                      </text>
                    );
                  }) as any
                }
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Bar
                dataKey="chore"
                name="Chore"
                stackId="h"
                fill={TYPE_COLORS.chore}
                radius={[0, 4, 4, 0]}
                label={
                  ((props: any) => {
                    const v = totalWorkHoursByType[props.index]?.chore;
                    if (!v) return null;
                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={props.y + props.height / 2}
                        fill="#fff"
                        fontSize={10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {v}h
                      </text>
                    );
                  }) as any
                }
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Bar
                dataKey="aiDriven"
                name="AI Driven"
                stackId="ai"
                fill="#ef4444"
                label={
                  ((props: any) => {
                    const v = totalWorkHoursByType[props.index]?.aiDriven;
                    if (!v) return null;
                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={props.y + props.height / 2}
                        fill="#fff"
                        fontSize={10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {v}h
                      </text>
                    );
                  }) as any
                }
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Bar
                dataKey="aiMeeting"
                name="Meeting"
                stackId="ai"
                fill={TYPE_COLORS.meeting}
                legendType="none"
                label={
                  ((props: any) => {
                    const v = totalWorkHoursByType[props.index]?.aiMeeting;
                    if (!v) return null;
                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={props.y + props.height / 2}
                        fill="#fff"
                        fontSize={10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {v}h
                      </text>
                    );
                  }) as any
                }
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Bar
                dataKey="aiChore"
                name="Chore"
                stackId="ai"
                fill={TYPE_COLORS.chore}
                legendType="none"
                radius={[0, 4, 4, 0]}
                label={
                  ((props: any) => {
                    const v = totalWorkHoursByType[props.index]?.aiChore;
                    if (!v) return null;
                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={props.y + props.height / 2}
                        fill="#fff"
                        fontSize={10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {v}h
                      </text>
                    );
                  }) as any
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.chartTitle}>All Developers</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {[
                  { key: "name", label: "Name" },
                  { key: "team", label: "Team" },
                  { key: "commits", label: "Commits" },
                  { key: "develop", label: "Develop" },
                  { key: "meeting", label: "Meeting" },
                  { key: "chore", label: "Chore" },
                  { key: "avgScore", label: "Avg Score" },
                  { key: "lines", label: "Lines" },
                  { key: "workHours", label: "Work Hours" },
                  { key: "aiMinutes", label: "AI Minutes" },
                  { key: "productivity", label: "Productivity" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={styles.sortableHeader}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <span className={styles.sortIndicator}>
                      {sortKey === col.key
                        ? sortDirection === "asc"
                          ? " ▲"
                          : " ▼"
                        : ""}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((s) => {
                const devId = s.developer.id;
                const perTeam = devTeamStatsMap.get(devId) || [];
                const isMultiTeam = perTeam.length > 1;
                const isExpanded = expandedDevs.has(devId);

                return (
                  <Fragment key={devId}>
                    <tr
                      className={isMultiTeam ? styles.expandableRow : undefined}
                      onClick={
                        isMultiTeam ? () => toggleExpand(devId) : undefined
                      }
                    >
                      <td>
                        <div className={styles.nameCell}>
                          {isMultiTeam && (
                            <span className={styles.expandIcon}>
                              {isExpanded ? "▾" : "▸"}
                            </span>
                          )}
                          <Link
                            to={`/developers/${devId}`}
                            className={styles.developerLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {s.developer.name}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <div className={styles.teamBadges}>
                          {isMultiTeam ? (
                            <span
                              className={`${styles.teamBadge} ${styles.teamBadgeAll}`}
                            >
                              All
                            </span>
                          ) : (
                            <>
                              {(teamMap.get(devId) || []).map((name) => (
                                <span key={name} className={styles.teamBadge}>
                                  {name}
                                </span>
                              ))}
                              {!(teamMap.get(devId) || []).length && "-"}
                            </>
                          )}
                        </div>
                      </td>
                      <td>{s.totalCommits}</td>
                      <td>{s.commitsByType.develop}</td>
                      <td>{s.commitsByType.meeting}</td>
                      <td>{s.commitsByType.chore}</td>
                      <td>{s.avgEvaluationDevelop.toFixed(1)}</td>
                      <td>
                        <span style={{ color: "#22c55e" }}>
                          +{developLinesMap.devMap.get(devId)?.added ?? 0}
                        </span>
                        {" / "}
                        <span style={{ color: "#ef4444" }}>
                          -{developLinesMap.devMap.get(devId)?.deleted ?? 0}
                        </span>
                      </td>
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
                    {isMultiTeam &&
                      isExpanded &&
                      perTeam.map((pt) => (
                        <tr
                          key={`${devId}-${pt.team.id}`}
                          className={styles.subRow}
                        >
                          <td></td>
                          <td>
                            <div className={styles.teamBadges}>
                              <span className={styles.teamBadge}>
                                {pt.team.name}
                              </span>
                            </div>
                          </td>
                          <td>{pt.stats.totalCommits}</td>
                          <td>{pt.stats.commitsByType.develop}</td>
                          <td>{pt.stats.commitsByType.meeting}</td>
                          <td>{pt.stats.commitsByType.chore}</td>
                          <td>{pt.stats.avgEvaluationDevelop.toFixed(1)}</td>
                          <td>
                            <span style={{ color: "#22c55e" }}>
                              +
                              {developLinesMap.devTeamMap.get(
                                `${devId}:${pt.team.id}`,
                              )?.added ?? 0}
                            </span>
                            {" / "}
                            <span style={{ color: "#ef4444" }}>
                              -
                              {developLinesMap.devTeamMap.get(
                                `${devId}:${pt.team.id}`,
                              )?.deleted ?? 0}
                            </span>
                          </td>
                          <td>
                            {pt.stats.totalWorkHours.toFixed(1)}h (
                            {pt.stats.workHoursByType.develop.toFixed(1)}h)
                          </td>
                          <td>{pt.stats.aiDrivenMinutesByType.develop}m</td>
                          <td>
                            {pt.stats.workHoursByType.develop > 0 &&
                            pt.stats.aiDrivenMinutesByType.develop > 0
                              ? (
                                  ((pt.stats.workHoursByType.develop * 60) /
                                    pt.stats.aiDrivenMinutesByType.develop) *
                                  100
                                ).toFixed(0)
                              : 0}
                            %
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
