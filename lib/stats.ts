/**
 * Stats & Gamification Utils — Zerey Platform
 */

import { differenceInDays, parseISO, startOfYear, eachDayOfInterval, format } from "date-fns";

export interface UserStats {
  gamesCount: number;
  playtime: number;
  completed: number;
  reviews: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // reference to Lucide icon name or generic string
  unlocked: boolean;
  unlockedAt?: string;
}

export interface RadarData {
  genre: string;
  count: number;
}

export interface HeatmapDay {
  date: string;
  count: number; // number of play sessions or total minutes
}

// XP Config
const XP_RATES = {
  ZEREY: 500,
  PLATINADO: 1000,
  REVIEW: 50,
  GAME_ADDED: 10,
};

// Calculation functions
export function calculateLevelAndXP(
  games: any[], // UserGame records
): { level: number; xp: number; nextLevelXp: number; progressPercent: number } {
  let xp = 0;

  for (const game of games) {
    xp += XP_RATES.GAME_ADDED;
    if (game.status === 'Zerey' || game.status === '100%') xp += XP_RATES.ZEREY;
    if (game.status === 'Platinado') xp += XP_RATES.PLATINADO;
    if (game.review && game.review.trim().length > 0) xp += XP_RATES.REVIEW;
  }

  // Level formula: Level = floor(sqrt(XP / 100)) + 1
  // Lvl 1: 0 XP
  // Lvl 2: 100 XP
  // Lvl 3: 400 XP
  // Lvl 4: 900 XP
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  
  // Next level requirement: (Lvl)^2 * 100
  const nextLevelXp = Math.pow(level, 2) * 100;
  const prevLevelXp = Math.pow(level - 1, 2) * 100;
  
  const xpInCurrentLevel = xp - prevLevelXp;
  const xpNeededForLevel = nextLevelXp - prevLevelXp;
  
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));

  return { level, xp, nextLevelXp, progressPercent };
}

export function calculateBadges(games: any[], sessions: any[], genres: string[]): Badge[] {
  const badges: Badge[] = [
    {
      id: "first_blood",
      name: "Primeiro Passo",
      description: "Adicionou seu primeiro jogo à biblioteca.",
      icon: "Gamepad2",
      unlocked: games.length > 0,
    },
    {
      id: "completionist",
      name: "Platinador Nato",
      description: "Conquistou 3 ou mais jogos Platinados.",
      icon: "Trophy",
      unlocked: games.filter(g => g.status === 'Platinado').length >= 3,
    },
    {
      id: "critic",
      name: "Crítico Literário",
      description: "Escreveu análises para mais de 5 jogos.",
      icon: "Feather",
      unlocked: games.filter(g => g.review && g.review.length > 10).length >= 5,
    },
    {
      id: "explorer",
      name: "Polímata dos Games",
      description: "Sua biblioteca abriga jogos de 7 ou mais gêneros diferentes.",
      icon: "Compass",
      unlocked: new Set(genres).size >= 7,
    },
    {
      id: "weekend_warrior",
      name: "Guerreiro de Fim de Semana",
      description: "Registrou 5 ou mais sessões de jogatina em finais de semana.",
      icon: "Swords",
      unlocked: sessions.filter(s => {
        const d = new Date(s.sessionDate).getDay();
        return d === 0 || d === 6; // 0 = Sunday, 6 = Saturday
      }).length >= 5,
    }
  ];

  return badges;
}

export function generateHeatmapData(sessions: any[]): HeatmapDay[] {
  // Aggregate sessions by date (YYYY-MM-DD)
  const countsByDate = new Map<string, number>();
  
  for (const session of sessions) {
    // assume sessionDate is YYYY-MM-DD
    const d = session.sessionDate.split('T')[0];
    const currentCount = countsByDate.get(d) || 0;
    // We can count sessions or minutes. Let's count minutes to have weight.
    countsByDate.set(d, currentCount + (session.durationMinutes || 30));
  }

  // Generate 365 days of data ending today (or start of year to today)
  // To keep it simple, let's do the last 365 days
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 364);

  const days = eachDayOfInterval({ start, end });
  
  return days.map(day => {
    const dStr = format(day, "yyyy-MM-dd");
    return {
      date: dStr,
      count: countsByDate.get(dStr) || 0
    };
  });
}

export function generateRadarData(games: any[], gameDetailsMap: Record<number, any>): RadarData[] {
  const genreCounts = new Map<string, number>();

  for (const game of games) {
    const details = gameDetailsMap[game.gameId];
    if (details && details.genres) {
      for (const genre of details.genres) {
        const current = genreCounts.get(genre.name) || 0;
        genreCounts.set(genre.name, current + 1);
      }
    }
  }

  // Sort and take top 6 genres for a clean radar
  const sorted = Array.from(genreCounts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  
  // If no genres, return some dummy layout so chart doesn't break
  if (sorted.length < 3) {
    return [
      { genre: "Ação", count: 0 },
      { genre: "Aventura", count: 0 },
      { genre: "RPG", count: 0 },
      { genre: "Tiro", count: 0 },
      { genre: "Estratégia", count: 0 },
    ];
  }

  return sorted;
}
