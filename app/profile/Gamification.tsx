"use client";

import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from "recharts";
import * as LucideIcons from "lucide-react";
import styles from "./gamification.module.css";
import { Badge, HeatmapDay, RadarData } from "../../lib/stats";
import { parseISO, format, getDay, startOfWeek, endOfWeek, eachDayOfInterval, getWeek } from "date-fns";

export function XpRing({ level, xp, progressPercent, avatarUrl }: { level: number; xp: number; progressPercent: number; avatarUrl: string }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={styles.xpRingContainer}>
      <svg className={styles.xpRingSvg} width="140" height="140">
        <circle 
          className={styles.xpRingBg} 
          cx="70" cy="70" r={radius} 
          strokeWidth="6"
        />
        <circle 
          className={styles.xpRingProgress} 
          cx="70" cy="70" r={radius} 
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <img src={avatarUrl} alt="Avatar" className={styles.xpAvatar} />
      <div className={styles.levelBadge}>Lvl {level}</div>
    </div>
  );
}

export function GenreRadar({ data }: { data: RadarData[] }) {
  if (!data || data.length === 0) return <div className={styles.emptyCard}>Jogue mais para gerar seu perfil.</div>;

  return (
    <div className={styles.radarContainer}>
      <h3 className={styles.cardTitle}>Radar de Gêneros</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="genre" tick={{ fill: '#888', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              itemStyle={{ color: '#00f0ff' }}
            />
            <Radar name="Jogos" dataKey="count" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BadgesGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className={styles.badgesContainer}>
      <h3 className={styles.cardTitle}>Conquistas</h3>
      <div className={styles.badgesGrid}>
        {badges.map(b => {
          // Dynamically grab icon from lucide
          const IconComp = (LucideIcons as any)[b.icon] || LucideIcons.Award;
          return (
            <div key={b.id} className={`${styles.badgeCard} ${b.unlocked ? styles.badgeUnlocked : styles.badgeLocked}`} title={b.description}>
              <div className={styles.badgeIconWrapper}>
                <IconComp size={24} className={b.unlocked ? styles.iconUnlocked : styles.iconLocked} />
              </div>
              <span className={styles.badgeName}>{b.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ActivityHeatmap({ data }: { data: HeatmapDay[] }) {
  // Simple GitHub style grid: 7 rows (Sunday - Saturday), columns are weeks
  // Let's take the last 20 weeks for mobile friendliness
  
  if (!data || data.length === 0) return null;
  
  // Create a map for easy lookup
  const dataMap = new Map(data.map(d => [d.date, d.count]));

  // Get last 20 weeks ending this week
  const today = new Date();
  const endDate = endOfWeek(today);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (20 * 7 - 1));

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Group by weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  for (const d of allDays) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getColor = (count: number) => {
    if (count === 0) return '#1e1e1e';
    if (count <= 60) return '#104d26'; // Light green (up to 1h)
    if (count <= 120) return '#1b7d3f'; // Mid green (up to 2h)
    if (count <= 240) return '#22a953'; // Neon green (up to 4h)
    return '#00f0ff'; // Bright neon green (4h+)
  };

  return (
    <div className={styles.heatmapContainer}>
      <h3 className={styles.cardTitle}>Diário Gamer (Últimas 20 semanas)</h3>
      <div className={styles.heatmapScroll}>
        <div className={styles.heatmapGrid}>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className={styles.heatmapCol}>
              {week.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = dataMap.get(dateStr) || 0;
                return (
                  <div 
                    key={dateStr}
                    className={styles.heatmapCell}
                    style={{ backgroundColor: getColor(count) }}
                    title={`${dateStr}: ${count} min`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
