import { useMemo, useState, Fragment } from 'react';
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
import type { DeveloperStats as DeveloperStatsType, DeveloperTeam, Team, TeamStats as TeamStatsType } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './DeveloperStats.module.css';

interface DeveloperStatsProps {
  stats: DeveloperStatsType[];
  teamStats: TeamStatsType[];
  teams: Team[];
  developerTeams: DeveloperTeam[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DeveloperStats({ stats, teamStats, teams, developerTeams, dateRange, onDateRangeChange }: DeveloperStatsProps) {
  const [expandedDevs, setExpandedDevs] = useState<Set<string>>(new Set());

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
  const sortedByCommits = [...stats].sort((a, b) => b.totalCommits - a.totalCommits);

  const commitData = sortedByCommits.map((s) => ({
    name: s.developer.name,
    develop: s.commitsByType.develop,
    meeting: s.commitsByType.meeting,
    chore: s.commitsByType.chore,
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

  const totalWorkHoursByType = [{
    name: 'All Developers',
    develop: parseFloat(stats.reduce((sum, s) => sum + s.workHoursByType.develop, 0).toFixed(1)),
    meeting: parseFloat(stats.reduce((sum, s) => sum + s.workHoursByType.meeting, 0).toFixed(1)),
    chore: parseFloat(stats.reduce((sum, s) => sum + s.workHoursByType.chore, 0).toFixed(1)),
    aiDriven: parseFloat(stats.reduce((sum, s) => sum + s.aiDrivenMinutesByType.develop / 60, 0).toFixed(1)),
    aiMeeting: parseFloat(stats.reduce((sum, s) => sum + s.workHoursByType.meeting, 0).toFixed(1)),
    aiChore: parseFloat(stats.reduce((sum, s) => sum + s.workHoursByType.chore, 0).toFixed(1)),
  }];

  const TYPE_COLORS = {
    develop: '#6366f1',
    meeting: '#22c55e',
    chore: '#f59e0b',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderStackedTooltip = (unit: string) => ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
    return (
      <div style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.85rem' }}>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ margin: '0.15rem 0', color: p.color }}>{p.name}: {p.value}{unit}</p>
        ))}
        <p style={{ margin: '0.25rem 0 0', borderTop: '1px solid #444', paddingTop: '0.25rem', fontWeight: 600, color: '#fff' }}>Total: {parseFloat(total.toFixed(1))}{unit}</p>
      </div>
    );
  };

  // Summary calculations
  const devCount = stats.length || 1;
  const totalCommits = stats.reduce((sum, s) => sum + s.totalCommits, 0);
  const totalDevelop = stats.reduce((sum, s) => sum + s.commitsByType.develop, 0);
  const totalMeeting = stats.reduce((sum, s) => sum + s.commitsByType.meeting, 0);
  const totalChore = stats.reduce((sum, s) => sum + s.commitsByType.chore, 0);
  const totalWorkHours = stats.reduce((sum, s) => sum + s.totalWorkHours, 0);
  const totalDevelopWorkHours = stats.reduce((sum, s) => sum + s.workHoursByType.develop, 0);
  const totalDevelopAiMinutes = stats.reduce((sum, s) => sum + s.aiDrivenMinutesByType.develop, 0);
  const avgScore = totalDevelop > 0
    ? stats.reduce((sum, s) => sum + s.avgEvaluationDevelop * s.commitsByType.develop, 0) / totalDevelop
    : 0;
  const avgWorkHours = totalWorkHours / devCount;
  const avgDevelopAiMinutes = totalDevelopAiMinutes / devCount;
  const avgProductivity = totalDevelopWorkHours > 0 && totalDevelopAiMinutes > 0
    ? (totalDevelopWorkHours * 60 / totalDevelopAiMinutes) * 100
    : 0;
  const totalLinesAdded = stats.reduce((sum, s) => sum + s.totalLinesAdded, 0);
  const totalLinesDeleted = stats.reduce((sum, s) => sum + s.totalLinesDeleted, 0);

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
        const teamName = (s.developer as { teams?: { name: string } }).teams?.name;
        if (teamName) {
          devTeamMap.set(s.developer.id, [teamName]);
        }
      });
    }
    return devTeamMap;
  }, [teams, developerTeams, stats]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Developer Statistics</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      <div className={styles.chartsRowThree}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Commits by Developer</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={Math.max(350, sortedByCommits.length * 40)}>
              <BarChart data={commitData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" />
                <YAxis dataKey="name" type="category" stroke="#888" width={100} />
                <Tooltip content={renderStackedTooltip('')} />
                <Legend />
                <Bar dataKey="develop" name="Develop" stackId="commits" fill={TYPE_COLORS.develop} />
                <Bar dataKey="meeting" name="Meeting" stackId="commits" fill={TYPE_COLORS.meeting} />
                <Bar dataKey="chore" name="Chore" stackId="commits" fill={TYPE_COLORS.chore} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Work Hours by Developer</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={Math.max(350, sortedByCommits.length * 70)}>
              <BarChart data={workHoursData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" unit="h" />
                <YAxis dataKey="name" type="category" stroke="#888" width={100} />
                <Tooltip content={renderStackedTooltip('h')} />
                <Legend />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="develop" name="Develop" stackId="h" fill={TYPE_COLORS.develop} label={((props: any) => {
                  const v = workHoursData[props.index]?.develop;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="meeting" name="Meeting" stackId="h" fill={TYPE_COLORS.meeting} label={((props: any) => {
                  const v = workHoursData[props.index]?.meeting;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="chore" name="Chore" stackId="h" fill={TYPE_COLORS.chore} radius={[0, 4, 4, 0]} label={((props: any) => {
                  const v = workHoursData[props.index]?.chore;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="aiDriven" name="AI Driven" stackId="ai" fill="#ef4444" label={((props: any) => {
                  const v = workHoursData[props.index]?.aiDriven;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="aiMeeting" name="Meeting" stackId="ai" fill={TYPE_COLORS.meeting} legendType="none" label={((props: any) => {
                  const v = workHoursData[props.index]?.aiMeeting;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="aiChore" name="Chore" stackId="ai" fill={TYPE_COLORS.chore} legendType="none" radius={[0, 4, 4, 0]} label={((props: any) => {
                  const v = workHoursData[props.index]?.aiChore;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Total Work Hours by Type</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={totalWorkHoursByType} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" unit="h" />
                <YAxis dataKey="name" type="category" stroke="#888" width={100} />
                <Tooltip content={renderStackedTooltip('h')} />
                <Legend />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="develop" name="Develop" stackId="h" fill={TYPE_COLORS.develop} label={((props: any) => {
                  const v = totalWorkHoursByType[props.index]?.develop;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="meeting" name="Meeting" stackId="h" fill={TYPE_COLORS.meeting} label={((props: any) => {
                  const v = totalWorkHoursByType[props.index]?.meeting;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="chore" name="Chore" stackId="h" fill={TYPE_COLORS.chore} radius={[0, 4, 4, 0]} label={((props: any) => {
                  const v = totalWorkHoursByType[props.index]?.chore;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="aiDriven" name="AI Driven" stackId="ai" fill="#ef4444" label={((props: any) => {
                  const v = totalWorkHoursByType[props.index]?.aiDriven;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="aiMeeting" name="Meeting" stackId="ai" fill={TYPE_COLORS.meeting} legendType="none" label={((props: any) => {
                  const v = totalWorkHoursByType[props.index]?.aiMeeting;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar dataKey="aiChore" name="Chore" stackId="ai" fill={TYPE_COLORS.chore} legendType="none" radius={[0, 4, 4, 0]} label={((props: any) => {
                  const v = totalWorkHoursByType[props.index]?.aiChore;
                  if (!v) return null;
                  return <text x={props.x + props.width / 2} y={props.y + props.height / 2} fill="#fff" fontSize={10} textAnchor="middle" dominantBaseline="middle">{v}h</text>;
                }) as any} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalCommits}</span>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statSub}>
            <span style={{ color: '#6366f1' }}>Dev {totalDevelop}</span>
            {' / '}
            <span style={{ color: '#22c55e' }}>Meet {totalMeeting}</span>
            {' / '}
            <span style={{ color: '#f59e0b' }}>Chore {totalChore}</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{avgScore.toFixed(1)}</span>
          <span className={styles.statLabel}>Avg Score (Dev)</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalWorkHours.toFixed(1)}h</span>
          <span className={styles.statLabel}>Total Work Hours</span>
          <span className={styles.statSub}>dev {totalDevelopWorkHours.toFixed(1)}h</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalDevelopAiMinutes}m</span>
          <span className={styles.statLabel}>AI Minutes (Dev)</span>
          <span className={styles.statSub}>avg {avgDevelopAiMinutes.toFixed(0)}m</span>
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
              {sortedByCommits.map((s) => {
                const devId = s.developer.id;
                const perTeam = devTeamStatsMap.get(devId) || [];
                const isMultiTeam = perTeam.length > 1;
                const isExpanded = expandedDevs.has(devId);

                return (
                  <Fragment key={devId}>
                    <tr
                      className={isMultiTeam ? styles.expandableRow : undefined}
                      onClick={isMultiTeam ? () => toggleExpand(devId) : undefined}
                    >
                      <td>
                        <div className={styles.nameCell}>
                          {isMultiTeam && (
                            <span className={styles.expandIcon}>{isExpanded ? '▾' : '▸'}</span>
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
                            <span className={`${styles.teamBadge} ${styles.teamBadgeAll}`}>All</span>
                          ) : (
                            <>
                              {(teamMap.get(devId) || []).map((name) => (
                                <span key={name} className={styles.teamBadge}>{name}</span>
                              ))}
                              {!(teamMap.get(devId) || []).length && '-'}
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
                        <span style={{ color: '#22c55e' }}>+{s.totalLinesAdded}</span>
                        {' / '}
                        <span style={{ color: '#ef4444' }}>-{s.totalLinesDeleted}</span>
                      </td>
                      <td>{s.totalWorkHours.toFixed(1)}h ({s.workHoursByType.develop.toFixed(1)}h)</td>
                      <td>{s.aiDrivenMinutesByType.develop}m</td>
                      <td>{s.workHoursByType.develop > 0 && s.aiDrivenMinutesByType.develop > 0
                        ? ((s.workHoursByType.develop * 60 / s.aiDrivenMinutesByType.develop) * 100).toFixed(0)
                        : 0}%</td>
                    </tr>
                    {isMultiTeam && isExpanded && perTeam.map((pt) => (
                      <tr key={`${devId}-${pt.team.id}`} className={styles.subRow}>
                        <td></td>
                        <td>
                          <div className={styles.teamBadges}>
                            <span className={styles.teamBadge}>{pt.team.name}</span>
                          </div>
                        </td>
                        <td>{pt.stats.totalCommits}</td>
                        <td>{pt.stats.commitsByType.develop}</td>
                        <td>{pt.stats.commitsByType.meeting}</td>
                        <td>{pt.stats.commitsByType.chore}</td>
                        <td>{pt.stats.avgEvaluationDevelop.toFixed(1)}</td>
                        <td>
                          <span style={{ color: '#22c55e' }}>+{pt.stats.totalLinesAdded}</span>
                          {' / '}
                          <span style={{ color: '#ef4444' }}>-{pt.stats.totalLinesDeleted}</span>
                        </td>
                        <td>{pt.stats.totalWorkHours.toFixed(1)}h ({pt.stats.workHoursByType.develop.toFixed(1)}h)</td>
                        <td>{pt.stats.aiDrivenMinutesByType.develop}m</td>
                        <td>{pt.stats.workHoursByType.develop > 0 && pt.stats.aiDrivenMinutesByType.develop > 0
                          ? ((pt.stats.workHoursByType.develop * 60 / pt.stats.aiDrivenMinutesByType.develop) * 100).toFixed(0)
                          : 0}%</td>
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
