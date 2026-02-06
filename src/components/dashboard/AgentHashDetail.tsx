import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Commit } from '@/types';
import { DateFilter } from './DateFilter';
import styles from './AgentHashDetail.module.css';

interface AgentHashDetailProps {
  commits: Commit[];
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

interface UserCommitInfo {
  name: string;
  commitCount: number;
  lastCommitDate: string;
}

export function AgentHashDetail({ commits, dateRange, onDateRangeChange }: AgentHashDetailProps) {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const decodedHash = hash ? decodeURIComponent(hash) : '';

  const { hashInfo, users, isNormal, totalHashCommits } = useMemo(() => {
    // agent_hash가 있는 커밋만 필터
    const hashCommits = commits.filter(c => c.agent_hash);

    if (hashCommits.length === 0 || !decodedHash) {
      return {
        hashInfo: null,
        users: [],
        isNormal: false,
        totalHashCommits: 0,
      };
    }

    // hash별 총 카운트 계산하여 정상 hash 판별
    const hashCounts = new Map<string, number>();
    hashCommits.forEach(c => {
      if (c.agent_hash) {
        hashCounts.set(c.agent_hash, (hashCounts.get(c.agent_hash) || 0) + 1);
      }
    });

    // 가장 많이 사용된 hash를 정상으로 간주
    let maxCount = 0;
    let expectedHash: string | null = null;
    hashCounts.forEach((count, h) => {
      if (count > maxCount) {
        maxCount = count;
        expectedHash = h;
      }
    });

    // 현재 hash의 커밋들
    const currentHashCommits = hashCommits.filter(c => c.agent_hash === decodedHash);

    // 사용자별 정보 집계
    const userMap = new Map<string, UserCommitInfo>();
    currentHashCommits.forEach((c: any) => {
      const userName = c.developers?.name || 'Unknown';
      const existing = userMap.get(userName);
      const commitDate = new Date(c.created_at);

      if (existing) {
        existing.commitCount++;
        if (new Date(existing.lastCommitDate) < commitDate) {
          existing.lastCommitDate = c.created_at;
        }
      } else {
        userMap.set(userName, {
          name: userName,
          commitCount: 1,
          lastCommitDate: c.created_at,
        });
      }
    });

    const userList = Array.from(userMap.values()).sort((a, b) => b.commitCount - a.commitCount);

    return {
      hashInfo: {
        hash: decodedHash,
        count: currentHashCommits.length,
        percentage: ((currentHashCommits.length / hashCommits.length) * 100).toFixed(1),
      },
      users: userList,
      isNormal: decodedHash === expectedHash,
      totalHashCommits: hashCommits.length,
    };
  }, [commits, decodedHash]);

  if (!hashInfo) {
    return (
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => navigate('/agent-hash')}>
          ← Agent Hash 목록으로
        </button>
        <h2 className={styles.title}>Agent Hash Detail</h2>
        <DateFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onFilterChange={onDateRangeChange}
        />
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>#</div>
          <p>해당 hash를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/agent-hash')}>
        ← Agent Hash 목록으로
      </button>

      <h2 className={styles.title}>Agent Hash Detail</h2>

      <DateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onFilterChange={onDateRangeChange}
      />

      {/* Hash 정보 카드 */}
      <div className={`${styles.hashCard} ${!isNormal ? styles.warning : ''}`}>
        <div className={styles.hashHeader}>
          <span className={isNormal ? styles.normalBadge : styles.anomalyBadge}>
            {isNormal ? '정상' : '비정상'}
          </span>
        </div>
        <div className={styles.hashValue}>{hashInfo.hash}</div>
        <div className={styles.hashStats}>
          <div className={styles.hashStat}>
            <span className={styles.statLabel}>커밋 수</span>
            <span className={styles.statValue}>{hashInfo.count}</span>
          </div>
          <div className={styles.hashStat}>
            <span className={styles.statLabel}>비율</span>
            <span className={styles.statValue}>{hashInfo.percentage}%</span>
          </div>
          <div className={styles.hashStat}>
            <span className={styles.statLabel}>사용자 수</span>
            <span className={styles.statValue}>{users.length}명</span>
          </div>
        </div>
      </div>

      {/* 사용자 목록 테이블 */}
      <div className={styles.tableCard}>
        <h3 className={styles.tableTitle}>사용자 목록</h3>
        {users.length === 0 ? (
          <div className={styles.noUsers}>이 hash를 사용한 사용자가 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>커밋 수</th>
                <th>마지막 커밋</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.name} className={styles.tableRow}>
                  <td>{user.name}</td>
                  <td>{user.commitCount}</td>
                  <td>{new Date(user.lastCommitDate).toLocaleString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
