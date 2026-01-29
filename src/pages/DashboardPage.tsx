import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Summary } from '@/components/dashboard/Summary';
import { DeveloperStats } from '@/components/dashboard/DeveloperStats';
import { DeveloperDetail } from '@/components/dashboard/DeveloperDetail';
import { TeamStats } from '@/components/dashboard/TeamStats';
import { TeamDetail } from '@/components/dashboard/TeamDetail';
import { useCommits } from '@/hooks/useCommits';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { loading, error, summary, developerStats, teamStats, commits, teams, developerTeams, refetch, dateRange, setDateRange } = useCommits();

  if (loading) {
    return (
      <div className={styles.layout}>
        <Header />
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.loading}>Loading data...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.layout}>
        <Header />
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.error}>
            <p>Error: {error}</p>
            <button onClick={refetch} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Header />
      <Sidebar />
      <main className={styles.main}>
        <Routes>
          <Route
            index
            element={
              <Summary
                summary={summary}
                teamStats={teamStats}
                dateRange={dateRange}
                onDateRangeChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
              />
            }
          />
          <Route
            path="developers"
            element={
              <DeveloperStats
                stats={developerStats}
                teams={teams}
                developerTeams={developerTeams}
                dateRange={dateRange}
                onDateRangeChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
              />
            }
          />
          <Route
            path="developers/:developerId"
            element={
              <DeveloperDetail
                developerStats={developerStats}
                commits={commits}
                dateRange={dateRange}
                onDateRangeChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
              />
            }
          />
          <Route
            path="teams"
            element={
              <TeamStats
                stats={teamStats}
                dateRange={dateRange}
                onDateRangeChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
              />
            }
          />
          <Route
            path="teams/:teamId"
            element={
              <TeamDetail
                teamStats={teamStats}
                commits={commits}
                dateRange={dateRange}
                onDateRangeChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
