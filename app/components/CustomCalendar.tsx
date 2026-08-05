"use client";
import { useState } from "react";
import styles from "./calendar.module.css";

interface CustomCalendarProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
}

export default function CustomCalendar({ startDate, endDate, onDateChange }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const handleDayClick = (e: React.MouseEvent, day: number) => {
    e.preventDefault();
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Logic for range selection
    if (!startDate || (startDate && endDate)) {
      // Start a new range
      onDateChange(dateStr, "");
    } else {
      // Complete the range
      const start = new Date(startDate);
      const clicked = new Date(dateStr);
      if (clicked < start) {
        onDateChange(dateStr, startDate);
      } else {
        onDateChange(startDate, dateStr);
      }
    }
  };

  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const startObj = startDate ? new Date(startDate + "T00:00:00") : null;
  const endObj = endDate ? new Date(endDate + "T00:00:00") : null;

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <select 
          className={styles.monthSelect}
          value={currentMonth.getMonth()} 
          onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), Number(e.target.value), 1))}
        >
          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        
        <select 
          className={styles.yearSelect}
          value={currentMonth.getFullYear()} 
          onChange={(e) => setCurrentMonth(new Date(Number(e.target.value), currentMonth.getMonth(), 1))}
        >
          {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div style={{ flex: 1 }}></div>
        <button onClick={prevMonth} className={styles.navBtn}>←</button>
        <button onClick={nextMonth} className={styles.navBtn}>→</button>
      </div>

      <div className={styles.grid}>
        {['seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.', 'dom.'].map((d, i) => (
          <div key={`head-${i}`} className={styles.dayHead}>{d}</div>
        ))}
        
        {blanks.map((_, i) => <div key={`blank-${i}`} className={styles.dayEmpty}></div>)}
        
        {days.map(day => {
          const currentStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const currentObj = new Date(currentStr + "T00:00:00");
          
          let isStart = startDate === currentStr;
          let isEnd = endDate === currentStr;
          let inRange = false;

          if (startObj && endObj && currentObj > startObj && currentObj < endObj) {
            inRange = true;
          }

          let classes = styles.dayCell;
          let wrapperClasses = styles.dayWrapper;
          
          if (isStart) wrapperClasses += ` ${styles.isStartWrapper}`;
          if (isEnd) wrapperClasses += ` ${styles.isEndWrapper}`;
          if (inRange || isStart || isEnd) wrapperClasses += ` ${styles.inRangeWrapper}`;
          if (isStart && !endDate) wrapperClasses += ` ${styles.isStartOnlyWrapper}`;

          if (isStart) classes += ` ${styles.isStartCell}`;
          if (isEnd) classes += ` ${styles.isEndCell}`;

          return (
            <div key={day} className={wrapperClasses}>
              <button className={classes} onClick={(e) => handleDayClick(e, day)}>
                {day}
              </button>
            </div>
          );
        })}
      </div>
      
      <div className={styles.jumpActions}>
        <span className={styles.jumpText}>Jump to...</span>
        <button className={styles.jumpBtn} onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date()); }}>Latest</button>
        <button className={styles.jumpBtn} onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date()); }}>Today</button>
        {startDate && <button className={styles.jumpBtn} onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date(startDate + "T00:00:00")); }}>Start</button>}
        {endDate && <button className={styles.jumpBtn} onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date(endDate + "T00:00:00")); }}>Finish</button>}
      </div>
    </div>
  );
}
