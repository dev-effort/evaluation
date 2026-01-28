import { useState, useEffect, useMemo } from 'react';
import styles from './DateFilter.module.css';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onFilterChange: (startDate: string, endDate: string) => void;
}

interface WeekRange {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeeksOfMonth(year: number, month: number): WeekRange[] {
  const weeks: WeekRange[] = [];
  const lastDay = getLastDayOfMonth(year, month);

  let currentDate = new Date(year, month, 1);
  let weekNumber = 1;

  while (currentDate.getMonth() === month) {
    const weekStart = new Date(currentDate);

    // 주의 끝을 일요일로 설정 (0 = 일요일)
    let weekEnd: Date;
    const dayOfWeek = currentDate.getDay();

    if (dayOfWeek === 0) {
      // 일요일이면 그 날이 주의 마지막
      weekEnd = new Date(currentDate);
    } else {
      // 일요일까지 남은 일수 계산
      const daysUntilSunday = 7 - dayOfWeek;
      weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
    }

    // 월말을 넘어가면 월말로 조정
    if (weekEnd.getMonth() !== month) {
      weekEnd = new Date(year, month, lastDay);
    }

    weeks.push({
      weekNumber,
      startDate: weekStart,
      endDate: weekEnd,
    });

    // 다음 주 시작 (월요일)
    currentDate = new Date(weekEnd);
    currentDate.setDate(currentDate.getDate() + 1);
    weekNumber++;
  }

  return weeks;
}

export function DateFilter({ startDate, endDate, onFilterChange }: DateFilterProps) {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  useEffect(() => {
    setLocalStart(startDate);
    setLocalEnd(endDate);
  }, [startDate, endDate]);

  const now = new Date();
  const weeks = useMemo(() => getWeeksOfMonth(now.getFullYear(), now.getMonth()), []);

  const handleApply = () => {
    onFilterChange(localStart, localEnd);
  };

  const handleReset = () => {
    setLocalStart('');
    setLocalEnd('');
    onFilterChange('', '');
  };

  const setThisMonth = () => {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = getLastDayOfMonth(now.getFullYear(), now.getMonth());

    const startStr = `${year}-${month}-01`;
    const endStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    setLocalStart(startStr);
    setLocalEnd(endStr);
    onFilterChange(startStr, endStr);
  };

  const setWeek = (week: WeekRange) => {
    const startStr = formatDateStr(week.startDate);
    const endStr = formatDateStr(week.endDate);

    setLocalStart(startStr);
    setLocalEnd(endStr);
    onFilterChange(startStr, endStr);
  };

  const getWeekLabel = (week: WeekRange): string => {
    const startDay = week.startDate.getDate();
    const endDay = week.endDate.getDate();
    return `${week.weekNumber}주 (${startDay}~${endDay}일)`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.presets}>
        <button onClick={setThisMonth} className={styles.presetBtn}>This Month</button>
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => setWeek(week)}
            className={styles.presetBtn}
          >
            {getWeekLabel(week)}
          </button>
        ))}
      </div>
      <div className={styles.inputs}>
        <label className={styles.label}>
          From:
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          To:
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className={styles.input}
          />
        </label>
        <button onClick={handleApply} className={styles.applyBtn}>Apply</button>
        <button onClick={handleReset} className={styles.resetBtn}>Reset</button>
      </div>
    </div>
  );
}
