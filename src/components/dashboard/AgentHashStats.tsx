import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { Commit } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './AgentHashStats.module.css';

interface AgentHashStatsProps {
  commits: Commit[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

interface DayData {
  day: string;
  dayIndex: number;
  [key: string]: string | number;
}

const NORMAL_COLOR = '#22c55e';
const ANOMALY_COLORS = ['#ef4444', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4'];
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function AgentHashStats({ commits, dateRange, onDateRangeChange }: AgentHashStatsProps) {
  const navigate = useNavigate();

  const { dailyData, expectedHash, uniqueHashes, summary, hashDetails } = useMemo(() => {
    // agent_hash가 있는 커밋만 필터
    const hashCommits = commits.filter(c => c.agent_hash);

    if (hashCommits.length === 0) {
      return {
        dailyData: [] as DayData[],
        expectedHash: null as string | null,
        uniqueHashes: [] as string[],
        summary: { totalCommits: 0, normalCount: 0, anomalyCount: 0 },
        hashDetails: [] as Array<{ hash: string; count: number; percentage: string; isNormal: boolean; developers: string[] }>,
      };
    }

    // hash별 총 카운트 계산
    const hashCounts = new Map<string, number>();
    hashCommits.forEach(c => {
      if (c.agent_hash) {
        hashCounts.set(c.agent_hash, (hashCounts.get(c.agent_hash) || 0) + 1);
      }
    });

    // 가장 많이 사용된 hash를 정상으로 간주
    let maxCount = 0;
    let expected: string | null = null;
    hashCounts.forEach((count, hash) => {
      if (count > maxCount) {
        maxCount = count;
        expected = hash;
      }
    });

    // 요일별 집계
    const dayMap = new Map<number, Map<string, number>>();
    for (let i = 0; i < 7; i++) {
      dayMap.set(i, new Map());
    }

    hashCommits.forEach(commit => {
      if (!commit.agent_hash) return;
      const date = new Date(commit.created_at);
      const dayOfWeek = date.getDay();
      const hashMap = dayMap.get(dayOfWeek)!;
      hashMap.set(commit.agent_hash, (hashMap.get(commit.agent_hash) || 0) + 1);
    });

    // 고유 hash 목록 (정상 hash를 맨 앞으로)
    const hashes = Array.from(hashCounts.keys());
    const sortedHashes = [
      ...hashes.filter(h => h === expected),
      ...hashes.filter(h => h !== expected),
    ];

    // 차트 데이터 변환
    const data: DayData[] = Array.from(dayMap.entries()).map(([dayIndex, hashMap]) => {
      const dayData: DayData = {
        day: DAY_LABELS[dayIndex],
        dayIndex,
      };
      sortedHashes.forEach(hash => {
        dayData[hash] = hashMap.get(hash) || 0;
      });
      return dayData;
    });

    // 월요일부터 시작하도록 정렬
    const mondayFirst = [...data.slice(1), data[0]];

    // 정상/비정상 카운트
    const normalCount = expected ? (hashCounts.get(expected) || 0) : 0;
    const anomalyCount = hashCommits.length - normalCount;

    // hash별 개발자 목록 집계
    const hashDevelopers = new Map<string, Set<string>>();
    hashCommits.forEach((c: any) => {
      if (c.agent_hash && c.developers?.name) {
        if (!hashDevelopers.has(c.agent_hash)) {
          hashDevelopers.set(c.agent_hash, new Set());
        }
        hashDevelopers.get(c.agent_hash)!.add(c.developers.name);
      }
    });

    // hash 상세 정보
    const details = sortedHashes.map(hash => ({
      hash,
      count: hashCounts.get(hash) || 0,
      percentage: ((hashCounts.get(hash) || 0) / hashCommits.length * 100).toFixed(1),
      isNormal: hash === expected,
      developers: Array.from(hashDevelopers.get(hash) || []),
    }));

    return {
      dailyData: mondayFirst,
      expectedHash: expected,
      uniqueHashes: sortedHashes,
      summary: {
        totalCommits: hashCommits.length,
        normalCount,
        anomalyCount,
      },
      hashDetails: details,
    };
  }, [commits]);

  const getHashColor = (hash: string) => {
    if (hash === expectedHash) return NORMAL_COLOR;
    const anomalyIndex = uniqueHashes.filter(h => h !== expectedHash).indexOf(hash);
    return ANOMALY_COLORS[anomalyIndex % ANOMALY_COLORS.length];
  };

  const getHashLabel = (hash: string) => {
    const shortHash = hash.slice(0, 8);
    return hash === expectedHash ? `${shortHash}... (정상)` : `${shortHash}... (비정상)`;
  };

  const CustomTooltip = (props: {
    active?: boolean;
    payload?: Array<{ color?: string; name?: string; value?: number }>;
    label?: string;
  }) => {
    const { active, payload, label } = props;
    if (!active || !payload) return null;
    return (
      <div style={{
        background: '#1a1a2e',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '0.75rem',
      }}>
        <p style={{ color: '#fff', margin: '0 0 0.5rem', fontWeight: 500 }}>{label}요일</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color, margin: '0.25rem 0', fontSize: '0.85rem' }}>
            {entry.name}: {entry.value}건
          </p>
        ))}
      </div>
    );
  };

  if (summary.totalCommits === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Agent Hash Statistics</h2>
        <DateFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onFilterChange={onDateRangeChange}
        />
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>#</div>
          <p>선택한 기간에 agent_hash 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Agent Hash Statistics</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      {/* 요약 통계 카드 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statValue}>{summary.totalCommits}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Expected Hash</span>
          <span className={styles.statValue} style={{ color: NORMAL_COLOR, fontSize: '1.25rem' }}>
            {expectedHash ? `${expectedHash.slice(0, 8)}...` : 'N/A'}
          </span>
          {expectedHash && (
            <span className={styles.hashValue}>{expectedHash}</span>
          )}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Normal</span>
          <span className={styles.statValue} style={{ color: NORMAL_COLOR }}>
            {summary.normalCount}
          </span>
        </div>
        <div className={`${styles.statCard} ${summary.anomalyCount > 0 ? styles.warning : ''}`}>
          <span className={styles.statLabel}>Anomalous</span>
          <span className={styles.statValue} style={{ color: summary.anomalyCount > 0 ? '#ef4444' : '#888' }}>
            {summary.anomalyCount}
          </span>
        </div>
      </div>

      {/* 비정상 경고 배너 */}
      {summary.anomalyCount > 0 && (
        <div className={styles.warningBanner}>
          <span className={styles.warningIcon}>⚠️</span>
          <span>비정상 agent_hash가 {summary.anomalyCount}건 감지되었습니다. ({uniqueHashes.length - 1}개의 다른 hash)</span>
        </div>
      )}

      {/* 요일별 차트 */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>요일별 Agent Hash 분포</h3>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {uniqueHashes.map((hash) => (
                <Bar
                  key={hash}
                  dataKey={hash}
                  name={getHashLabel(hash)}
                  stackId="hashes"
                  fill={getHashColor(hash)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hash 상세 테이블 */}
      <div className={styles.tableCard}>
        <h3 className={styles.chartTitle}>Agent Hash 상세</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Hash</th>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
              <th>Users</th>
            </tr>
          </thead>
          <tbody>
            {hashDetails.map(detail => (
              <tr
                key={detail.hash}
                className={styles.tableRow}
                onClick={() => navigate(`/agent-hash/${encodeURIComponent(detail.hash)}`)}
                style={{ cursor: 'pointer' }}
              >
                <td className={styles.hashCell}>{detail.hash}</td>
                <td>
                  <span className={detail.isNormal ? styles.normalBadge : styles.anomalyBadge}>
                    {detail.isNormal ? '정상' : '비정상'}
                  </span>
                </td>
                <td>{detail.count}</td>
                <td>{detail.percentage}%</td>
                <td className={styles.usersCell}>
                  <span className={styles.userCount}>{detail.developers.length}명</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
