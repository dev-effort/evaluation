import { useMemo, useState, ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "recharts";
import type { DeveloperStats, Commit, Developer, Team } from "@/types";
import { DateFilter } from "./DateFilter";
import styles from "./DeveloperDetail.module.css";

const renderStackedTooltip =
  (unit: string, showTotal = true) =>
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
        {showTotal && (
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
        )}
      </div>
    );
  };

const renderWorkHoursTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const humanKeys = ["develop", "meeting", "chore"];
  const aiKeys = ["aiTime", "aiMeeting", "aiChore"];
  const humanItems = payload.filter((p: any) => humanKeys.includes(p.dataKey));
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
            <p key={p.dataKey} style={{ margin: "0.15rem 0", color: p.color }}>
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
            <p key={p.dataKey} style={{ margin: "0.15rem 0", color: p.color }}>
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

const renderPieTooltip =
  (unit: string) =>
  ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
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
        <p style={{ margin: 0, color: entry.payload?.fill || entry.color }}>
          {entry.name}: {entry.value}
          {unit}
        </p>
      </div>
    );
  };

function renderCommitMessage(message: string): ReactNode {
  const lines = message.split("\n");
  const result: ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      result.push(
        <ul key={`ul-${result.length}`} className={styles.bulletList}>
          {currentBullets.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>,
      );
      currentBullets = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      currentBullets.push(trimmedLine.substring(2));
    } else if (trimmedLine === "") {
      flushBullets();
    } else {
      flushBullets();
      result.push(
        <p key={`p-${index}`} className={styles.messageLine}>
          {trimmedLine}
        </p>,
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
  teams: Team[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DeveloperDetail({
  developerStats,
  commits,
  teams,
  dateRange,
  onDateRangeChange,
}: DeveloperDetailProps) {
  const { developerId } = useParams<{ developerId: string }>();
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const developer = useMemo(() => {
    return developerStats.find((ds) => ds.developer.id === developerId);
  }, [developerStats, developerId]);

  const developerCommits = useMemo(() => {
    return commits
      .filter((c) => c.developer_id === developerId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [commits, developerId]);

  // Type-based stats calculation (moved before early return to follow Rules of Hooks)
  const typeStats = useMemo(() => {
    const types = ["develop", "meeting", "chore"] as const;
    const prefixTypes = ["feat", "fix", "chore", "refactor", "docs"] as const;

    return types.map((type) => {
      const typeCommits = developerCommits.filter((c) =>
        type === "develop"
          ? c.type === "develop" || c.type === null
          : c.type === type,
      );
      const count = typeCommits.length;
      const avgScore =
        count > 0
          ? typeCommits.reduce((sum, c) => sum + (c.evaluation_total || 0), 0) /
            count
          : 0;
      const totalWorkHours = typeCommits.reduce(
        (sum, c) => sum + (c.work_hours || 0),
        0,
      );
      const totalAiMinutes = typeCommits.reduce(
        (sum, c) => sum + (c.ai_driven_minutes || 0),
        0,
      );
      const avgProductivity =
        count > 0
          ? typeCommits.reduce((sum, c) => sum + (c.productivity || 0), 0) /
            count
          : 0;

      const prefixCounts =
        type === "develop"
          ? prefixTypes.map((prefix) => ({
              prefix,
              count: typeCommits.filter(
                (c) =>
                  c.message.toLowerCase().startsWith(`${prefix}(`) ||
                  c.message.toLowerCase().startsWith(`${prefix}:`),
              ).length,
            }))
          : null;

      return {
        type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        avgScore,
        totalWorkHours,
        totalAiMinutes,
        avgProductivity,
        prefixCounts,
      };
    });
  }, [developerCommits]);

  const teamStatsData = useMemo(() => {
    const teamMap = new Map<
      string,
      {
        develop: number;
        meeting: number;
        chore: number;
        workHours: number;
        aiDrivenHours: number;
      }
    >();
    developerCommits.forEach((c) => {
      const tid = c.team_id;
      if (!tid) return;
      const prev = teamMap.get(tid) || {
        develop: 0,
        meeting: 0,
        chore: 0,
        workHours: 0,
        aiDrivenHours: 0,
      };
      const type = c.type || "develop";
      if (type === "develop") prev.develop += 1;
      else if (type === "meeting") prev.meeting += 1;
      else if (type === "chore") prev.chore += 1;
      prev.workHours += c.work_hours || 0;
      prev.aiDrivenHours += (c.ai_driven_minutes || 0) / 60;
      teamMap.set(tid, prev);
    });
    return Array.from(teamMap.entries()).map(([tid, data]) => {
      const team = teams.find((t) => t.id === tid);
      return {
        name: team?.name || "Unknown",
        develop: data.develop,
        meeting: data.meeting,
        chore: data.chore,
        workHours: parseFloat(data.workHours.toFixed(1)),
        aiDrivenHours: parseFloat(data.aiDrivenHours.toFixed(1)),
      };
    });
  }, [developerCommits, teams]);

  const availableTeams = useMemo(() => {
    const teamIds = new Set(
      developerCommits.map((c) => c.team_id).filter(Boolean),
    );
    return teams.filter((t) => teamIds.has(t.id));
  }, [developerCommits, teams]);

  const availableTypes = useMemo(() => {
    return [...new Set(developerCommits.map((c) => c.type || "develop"))];
  }, [developerCommits]);

  const filteredCommits = useMemo(() => {
    return developerCommits.filter((c) => {
      if (filterTeam !== "all" && c.team_id !== filterTeam) return false;
      if (filterType !== "all" && (c.type || "develop") !== filterType)
        return false;
      return true;
    });
  }, [developerCommits, filterTeam, filterType]);

  const dayCount = useMemo(() => {
    const dates = new Set<string>();
    developerCommits.forEach((c) => {
      const d = new Date(c.created_at);
      dates.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    });
    return dates.size || 1;
  }, [developerCommits]);

  if (!developer) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <p>Developer not found</p>
          <Link to="/developers" className={styles.backLink}>
            Back to Developers
          </Link>
        </div>
      </div>
    );
  }

  // Calculate evaluation breakdown only from develop type commits
  const developCommitsOnly = developerCommits.filter(
    (c) => c.type === "develop" || c.type === null,
  );
  const developCommitCount = developCommitsOnly.length;
  const developEvaluationBreakdown = {
    complexity:
      developCommitCount > 0
        ? developCommitsOnly.reduce(
            (sum, c) => sum + (c.evaluation_complexity || 0),
            0,
          ) / developCommitCount
        : 0,
    volume:
      developCommitCount > 0
        ? developCommitsOnly.reduce(
            (sum, c) => sum + (c.evaluation_volume || 0),
            0,
          ) / developCommitCount
        : 0,
    thinking:
      developCommitCount > 0
        ? developCommitsOnly.reduce(
            (sum, c) => sum + (c.evaluation_thinking || 0),
            0,
          ) / developCommitCount
        : 0,
    others:
      developCommitCount > 0
        ? developCommitsOnly.reduce(
            (sum, c) => sum + (c.evaluation_others || 0),
            0,
          ) / developCommitCount
        : 0,
  };

  const developLinesAdded = developCommitsOnly.reduce(
    (sum, c) => sum + (c.lines_added || 0),
    0,
  );
  const developLinesDeleted = developCommitsOnly.reduce(
    (sum, c) => sum + (c.lines_deleted || 0),
    0,
  );

  // Per-type breakdown for stat cards (matching DeveloperStats layout)
  const devType = typeStats.find((s) => s.type === "develop")!;
  const meetType = typeStats.find((s) => s.type === "meeting")!;
  const choreType = typeStats.find((s) => s.type === "chore")!;
  const totalWorkHours = developer.totalWorkHours;
  const devWorkHours = devType.totalWorkHours;
  const meetWorkHours = meetType.totalWorkHours;
  const choreWorkHours = choreType.totalWorkHours;
  const devAiMinutes = devType.totalAiMinutes;
  const aiWithHumanHours = devAiMinutes / 60 + meetWorkHours + choreWorkHours;
  const productivity =
    devWorkHours > 0 && devAiMinutes > 0
      ? ((devWorkHours * 60) / devAiMinutes) * 100
      : 0;

  const radarData = [
    { subject: "Complexity", value: developEvaluationBreakdown.complexity },
    { subject: "Volume", value: developEvaluationBreakdown.volume },
    { subject: "Thinking", value: developEvaluationBreakdown.thinking },
    { subject: "Others", value: developEvaluationBreakdown.others },
  ];

  const commitsByDate = developerCommits.reduce(
    (acc, commit) => {
      const date = new Date(commit.created_at).toLocaleDateString("ko-KR");
      if (!acc[date]) {
        acc[date] = { develop: 0, meeting: 0, chore: 0 };
      }
      const type = commit.type || "develop";
      if (type === "develop") acc[date].develop += 1;
      else if (type === "meeting") acc[date].meeting += 1;
      else if (type === "chore") acc[date].chore += 1;
      return acc;
    },
    {} as Record<string, { develop: number; meeting: number; chore: number }>,
  );

  const commitChartData = Object.entries(commitsByDate)
    .map(([date, data]) => ({ date, ...data }))
    .reverse()
    .slice(-14);

  // Daily work hours and AI time data (per type)
  const timeByDate = developerCommits.reduce(
    (acc, commit) => {
      const date = new Date(commit.created_at).toLocaleDateString("ko-KR");
      if (!acc[date]) {
        acc[date] = { develop: 0, meeting: 0, chore: 0, aiTime: 0 };
      }
      const type = commit.type || "develop";
      if (type === "develop") {
        acc[date].develop += commit.work_hours || 0;
        acc[date].aiTime += (commit.ai_driven_minutes || 0) / 60;
      } else if (type === "meeting") {
        acc[date].meeting += commit.work_hours || 0;
      } else if (type === "chore") {
        acc[date].chore += commit.work_hours || 0;
      }
      return acc;
    },
    {} as Record<
      string,
      { develop: number; meeting: number; chore: number; aiTime: number }
    >,
  );

  const timeChartData = Object.entries(timeByDate)
    .map(([date, data]) => ({
      date,
      develop: parseFloat(data.develop.toFixed(1)),
      meeting: parseFloat(data.meeting.toFixed(1)),
      chore: parseFloat(data.chore.toFixed(1)),
      aiTime: parseFloat(data.aiTime.toFixed(1)),
      aiMeeting: parseFloat(data.meeting.toFixed(1)),
      aiChore: parseFloat(data.chore.toFixed(1)),
    }))
    .reverse()
    .slice(-14);

  // Daily lines of code data (develop commits only)
  const linesByDate = developCommitsOnly.reduce(
    (acc, commit) => {
      const date = new Date(commit.created_at).toLocaleDateString("ko-KR");
      if (!acc[date]) {
        acc[date] = { added: 0, deleted: 0 };
      }
      acc[date].added += commit.lines_added || 0;
      acc[date].deleted += commit.lines_deleted || 0;
      return acc;
    },
    {} as Record<string, { added: number; deleted: number }>,
  );

  const linesChartData = Object.entries(linesByDate)
    .map(([date, data]) => ({
      date,
      added: data.added,
      deleted: data.deleted,
    }))
    .reverse()
    .slice(-14);

  const teamName =
    (developer.developer as { teams?: { name: string } }).teams?.name || "-";

  const pieChartData = typeStats
    .filter((stat) => stat.count > 0)
    .map((stat) => ({
      name: stat.label,
      value: stat.count,
    }));

  const timeComparisonData = typeStats
    .map((stat) => {
      if (stat.type === "develop") {
        const hours = stat.totalAiMinutes / 60;
        return hours > 0
          ? { name: "Develop (AI Time)", value: parseFloat(hours.toFixed(1)) }
          : null;
      } else {
        return stat.totalWorkHours > 0
          ? {
              name: `${stat.label} (Work Hours)`,
              value: parseFloat(stat.totalWorkHours.toFixed(1)),
            }
          : null;
      }
    })
    .filter((item): item is { name: string; value: number } => item !== null);

  const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b"];
  const PREFIX_COLORS = ["#6366f1", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4"];

  const developStats = typeStats.find((s) => s.type === "develop");
  const prefixPieData =
    developStats?.prefixCounts
      ?.filter((p) => p.count > 0)
      .map((p) => ({
        name: p.prefix,
        value: p.count,
      })) ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/developers" className={styles.backLink}>
          &larr; Back to Developers
        </Link>
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
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statValue}>{developer.totalCommits}</span>
          <span className={styles.statSub}>
            <span style={{ color: "#6366f1" }}>Dev {devType.count}</span>
            {" / "}
            <span style={{ color: "#22c55e" }}>Meet {meetType.count}</span>
            {" / "}
            <span style={{ color: "#f59e0b" }}>Chore {choreType.count}</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg Score</span>
          <span className={styles.statValue}>
            {devType.avgScore.toFixed(1)}
          </span>
          <span className={styles.statSub}>
            <span style={{ color: "#a78bfa" }}>
              Total {(devType.avgScore * devType.count).toFixed(0)}
            </span>
            {" / "}
            <span style={{ color: "#6366f1" }}>Dev {devType.count}</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Human Work Hours</span>
          <span className={styles.statValue}>{totalWorkHours.toFixed(1)}h</span>
          <span className={styles.statSub}>
            <span style={{ color: "#6366f1" }}>
              Dev {devWorkHours.toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#f59e0b" }}>
              Chore {choreWorkHours.toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#22c55e" }}>
              Meet {meetWorkHours.toFixed(1)}h
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
            {aiWithHumanHours.toFixed(1)}h
          </span>
          <span className={styles.statSub}>
            <span style={{ color: "#ef4444" }}>
              AI {(devAiMinutes / 60).toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#f59e0b" }}>
              Chore {choreWorkHours.toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#22c55e" }}>
              Meet {meetWorkHours.toFixed(1)}h
            </span>
          </span>
          <div className={styles.statHoverTip}>
            <span style={{ color: "#888", fontSize: "0.75rem" }}>
              Daily Avg ({dayCount}days)
            </span>
            <span
              style={{ fontSize: "1.5rem", fontWeight: 600, color: "#6366f1" }}
            >
              {(aiWithHumanHours / dayCount).toFixed(1)}h
            </span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg Productivity</span>
          <span className={styles.statValue}>{productivity.toFixed(0)}%</span>
          <span className={styles.statSub}>
            <span style={{ color: "#6366f1" }}>
              Dev {devWorkHours.toFixed(1)}h
            </span>
            {" / "}
            <span style={{ color: "#ef4444" }}>
              AI {(devAiMinutes / 60).toFixed(1)}h
            </span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Lines</span>
          <span className={styles.statValue}>
            {developLinesAdded + developLinesDeleted}
          </span>
          <span className={styles.statSub}>
            <span style={{ color: "#22c55e" }}>+{developLinesAdded}</span>
            {" / "}
            <span style={{ color: "#ef4444" }}>-{developLinesDeleted}</span>
          </span>
        </div>
      </div>

      <div className={styles.typeStatsContainer}>
        {typeStats.map((stat) => (
          <div
            key={stat.type}
            className={`${styles.typeStatsCard} ${stat.type === "develop" ? styles.typeStatsCardDevelop : styles.typeStatsCardSmall}`}
          >
            <h4 className={styles.typeStatsTitle}>{stat.label}</h4>
            <div className={styles.typeStatsGrid}>
              <div className={styles.typeStatItem}>
                <span className={styles.typeStatValue}>{stat.count}</span>
                <span className={styles.typeStatLabel}>Commits</span>
              </div>
              {stat.type === "develop" && stat.prefixCounts && (
                <div className={styles.prefixCountsContainer}>
                  {stat.prefixCounts.map((p) => (
                    <span key={p.prefix} className={styles.prefixBadge}>
                      {p.prefix}: {p.count}
                    </span>
                  ))}
                </div>
              )}
              {stat.type === "develop" && (
                <div className={styles.typeStatItem}>
                  <span className={styles.typeStatValue}>
                    {stat.avgScore.toFixed(1)}
                  </span>
                  <span className={styles.typeStatLabel}>Avg Score</span>
                </div>
              )}
              <div className={styles.typeStatItem}>
                <span className={styles.typeStatValue}>
                  {stat.totalWorkHours.toFixed(1)}h
                </span>
                <span className={styles.typeStatLabel}>Work Hours</span>
              </div>
              {stat.type === "develop" && (
                <>
                  <div className={styles.typeStatItem}>
                    <span className={styles.typeStatValue}>
                      {(stat.totalAiMinutes / 60).toFixed(1)}h
                    </span>
                    <span className={styles.typeStatLabel}>AI Time</span>
                  </div>
                  <div className={styles.typeStatItem}>
                    <span className={styles.typeStatValue}>
                      {stat.avgProductivity.toFixed(0)}%
                    </span>
                    <span className={styles.typeStatLabel}>Productivity</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartCard} style={{ marginBottom: "1.5rem" }}>
        <h3 className={styles.chartTitle}>Commits Over Time</h3>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commitChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" />
              <Tooltip content={renderStackedTooltip("")} />
              <Legend />
              <Bar
                dataKey="develop"
                name="Develop"
                stackId="commits"
                fill="#6366f1"
              />
              <Bar
                dataKey="meeting"
                name="Meeting"
                stackId="commits"
                fill="#22c55e"
              />
              <Bar
                dataKey="chore"
                name="Chore"
                stackId="commits"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartCard} style={{ marginBottom: "1.5rem" }}>
        <h3 className={styles.chartTitle}>Work Hours & AI Time Over Time</h3>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" unit="h" />
              <Tooltip content={renderWorkHoursTooltip} />
              <Legend />
              <Bar
                dataKey="develop"
                name="Develop"
                stackId="h"
                fill="#6366f1"
              />
              <Bar
                dataKey="meeting"
                name="Meeting"
                stackId="h"
                fill="#22c55e"
              />
              <Bar
                dataKey="chore"
                name="Chore"
                stackId="h"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="aiTime"
                name="AI Driven"
                stackId="ai"
                fill="#ef4444"
              />
              <Bar
                dataKey="aiMeeting"
                name="Meeting"
                stackId="ai"
                fill="#22c55e"
                legendType="none"
              />
              <Bar
                dataKey="aiChore"
                name="Chore"
                stackId="ai"
                fill="#f59e0b"
                legendType="none"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartCard} style={{ marginBottom: "1.5rem" }}>
        <h3 className={styles.chartTitle}>Lines of Code Over Time</h3>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={linesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
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
                    const v = linesChartData[props.index]?.added;
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
                    const v = linesChartData[props.index]?.deleted;
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

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Team Commits</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamStatsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" allowDecimals={false} />
                <Tooltip content={renderStackedTooltip("")} />
                <Legend />
                <Bar
                  dataKey="develop"
                  name="Develop"
                  stackId="commits"
                  fill="#6366f1"
                />
                <Bar
                  dataKey="meeting"
                  name="Meeting"
                  stackId="commits"
                  fill="#22c55e"
                />
                <Bar
                  dataKey="chore"
                  name="Chore"
                  stackId="commits"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
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
                  label={({ percent }) =>
                    `${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={renderPieTooltip(" commits")} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {prefixPieData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Commits by Prefix</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prefixPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) =>
                      `${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {prefixPieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PREFIX_COLORS[index % PREFIX_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={renderPieTooltip(" commits")} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {timeComparisonData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Time Comparison by Type</h3>
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
                    label={({ percent }) =>
                      `${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {timeComparisonData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={renderPieTooltip("h")} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className={styles.commitsSection}>
        <div className={styles.commitsSectionHeader}>
          <h3 className={styles.chartTitle}>
            Commit History ({filteredCommits.length})
          </h3>
          <div className={styles.commitFilters}>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${filterTeam === "all" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterTeam("all")}
              >
                All
              </button>
              {availableTeams.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.filterBtn} ${filterTeam === t.id ? styles.filterBtnActive : ""}`}
                  onClick={() => setFilterTeam(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <div className={styles.filterDivider} />
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${filterType === "all" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterType("all")}
              >
                All
              </button>
              {availableTypes.map((t) => (
                <button
                  key={t}
                  className={`${styles.filterBtn} ${filterType === t ? styles.filterBtnActive : ""}`}
                  onClick={() => setFilterType(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.commitsList}>
          {filteredCommits.length === 0 ? (
            <p className={styles.noCommits}>No commits in selected period</p>
          ) : (
            filteredCommits.map((commit) => (
              <div key={commit.id} className={styles.commitCard}>
                <div className={styles.commitHeader}>
                  <div className={styles.commitHeaderLeft}>
                    {commit.team_id && (
                      <span className={styles.commitTeamBadge}>
                        {teams.find((t) => t.id === commit.team_id)?.name ||
                          "Unknown"}
                      </span>
                    )}
                    <span className={styles.commitId}>
                      {commit.commit_id.substring(0, 8)}
                    </span>
                    <span
                      className={
                        styles[
                          `typeBadge${(commit.type || "develop").charAt(0).toUpperCase()}${(commit.type || "develop").slice(1)}`
                        ] || styles.typeBadgeDevelop
                      }
                    >
                      {(commit.type || "develop").toUpperCase()}
                    </span>
                  </div>
                  <span className={styles.commitDate}>
                    {new Date(commit.created_at).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className={styles.commitMessage}>
                  {renderCommitMessage(commit.message)}
                </div>
                <div className={styles.commitMeta}>
                  <span className={styles.evalBadge}>
                    Score: {commit.evaluation_total ?? "-"}
                  </span>
                  <span className={styles.evalDetail}>
                    (C:{commit.evaluation_complexity ?? 0} V:
                    {commit.evaluation_volume ?? 0} T:
                    {commit.evaluation_thinking ?? 0} O:
                    {commit.evaluation_others ?? 0})
                  </span>
                  {commit.lines_added || commit.lines_deleted ? (
                    <span className={styles.linesBadge}>
                      <span style={{ color: "#22c55e" }}>
                        +{commit.lines_added || 0}
                      </span>
                      {" / "}
                      <span style={{ color: "#ef4444" }}>
                        -{commit.lines_deleted || 0}
                      </span>
                    </span>
                  ) : null}
                  {commit.work_hours && (
                    <span className={styles.timeBadge}>
                      H: {commit.work_hours}h
                    </span>
                  )}
                  {commit.ai_driven_minutes && (
                    <span className={styles.timeBadge}>
                      AI: {commit.ai_driven_minutes}m
                    </span>
                  )}
                  {commit.productivity && (
                    <span className={styles.productivityBadge}>
                      {commit.productivity}%
                    </span>
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
