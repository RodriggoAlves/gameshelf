// IGDB API Client — Zerey Platform

export interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  hero_image?: string;
  rating: number;
  platforms: { platform: { id: number; name: string } }[];
  genres: { id: number; name: string }[];
  summary?: string;
  screenshots?: string[];
  companies?: string[];
}

let cachedAccessToken: string | null = null;
let tokenExpiration: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiration) {
    return cachedAccessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Twitch API credentials in .env");
  }

  const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
  const response = await fetch(url, { 
    method: 'POST',
    headers: { "User-Agent": "ZereyApp/1.0" },
    cache: "no-store"
  });
  const data = await response.json();

  if (!data.access_token) {
    throw new Error("Failed to get IGDB access token");
  }

  cachedAccessToken = data.access_token as string;
  tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000;
  return cachedAccessToken;
}

export async function igdbRequest(endpoint: string, body: string) {
  const token = await getAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID!;

  try {
    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      body,
      headers: {
        "Client-ID": clientId,
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "text/plain",
        "User-Agent": "ZereyApp/1.0"
      },
      next: { revalidate: 3600 } // Cache do Next.js de 1 hora!
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`IGDB API Error: ${response.status} - ${errText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    throw new Error(`Request Failed: ${error.message}`);
  }
}

export async function fetchPopularGames(): Promise<Game[]> {
  const query = `
    fields name, first_release_date, cover.image_id, total_rating, platforms.name, genres.name;
    where cover.image_id != null & total_rating_count > 0;
    sort total_rating_count desc;
    limit 27;
  `;

  const results = await igdbRequest("games", query);

  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
    hero_image: "",
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  }));
}

export async function fetchGameDetails(id: number): Promise<Game | undefined> {
  if (!Number.isInteger(id) || id <= 0) return undefined;
  
  const query = `
    fields name, first_release_date, cover.image_id, artworks.image_id, total_rating, platforms.name, genres.name, summary, screenshots.image_id, involved_companies.company.name;
    where id = ${id};
  `;
  const results = await igdbRequest("games", query);
  if (!results.length) return undefined;
  const g = results[0];
  return {
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
    hero_image: g.artworks?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.artworks[0].image_id}.jpg` : (g.screenshots?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.screenshots[0].image_id}.jpg` : ""),
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
    summary: g.summary || "",
    screenshots: g.screenshots ? g.screenshots.map((s: any) => `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`) : [],
    companies: g.involved_companies ? g.involved_companies.map((c: any) => c.company?.name).filter(Boolean) : [],
  };
}

export async function searchGames(queryStr: string): Promise<Game[]> {
  const safeQuery = (queryStr || "")
    .replace(/[\\";{}()\n\r]/g, '') // Remove todos os caracteres especiais (VULN-14)
    .substring(0, 100); // Limita o tamanho

  if (!safeQuery.trim()) return [];

  const { db } = await import("./db");
  try {
    const cached = await db.get('SELECT * FROM "SearchCache" WHERE query = $1 AND type = $2 AND "expiresAt" > CURRENT_TIMESTAMP', [safeQuery.toLowerCase(), 'game']);
    if (cached && cached.resultData) {
      return typeof cached.resultData === 'string' ? JSON.parse(cached.resultData) : cached.resultData;
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }

  const query = `
    search "${safeQuery}";
    fields name, first_release_date, cover.image_id, artworks.image_id, total_rating, platforms.name, genres.name;
    where cover.image_id != null;
    limit 20;
  `;
  const results = await igdbRequest("games", query);
  const mapped = results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
    hero_image: g.artworks?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.artworks[0].image_id}.jpg` : "",
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  }));

  try {
    await db.run(`
      INSERT INTO "SearchCache" (query, type, "resultData", "expiresAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '1 day')
      ON CONFLICT (query) DO UPDATE SET "resultData" = $3, "expiresAt" = CURRENT_TIMESTAMP + INTERVAL '1 day'
    `, [safeQuery.toLowerCase(), 'game', JSON.stringify(mapped)]);
  } catch (err) {
    console.error("Cache write error:", err);
  }

  return mapped;
}

export async function fetchGamesByIds(ids: number[]): Promise<Game[]> {
  if (ids.length === 0) return [];
  const query = `
    fields name, first_release_date, cover.image_id, artworks.image_id, screenshots.image_id, total_rating, platforms.name, genres.name;
    where id = (${ids.join(",")});
    limit 500;
  `;
  const results = await igdbRequest("games", query);
  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
    hero_image: g.artworks?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.artworks[0].image_id}.jpg` : (g.screenshots?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.screenshots[0].image_id}.jpg` : ""),
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  }));
}

export async function fetchUpcomingGames(): Promise<Game[]> {
  const now = Math.floor(Date.now() / 1000);
  const query = `
    fields name, first_release_date, cover.image_id, total_rating, platforms.name, genres.name;
    where first_release_date > ${now} & cover.image_id != null & (hypes > 3 | follows > 10);
    sort first_release_date asc;
    limit 24;
  `;
  const results = await igdbRequest("games", query);
  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
    hero_image: "",
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  }));
}

export async function fetchRecentReleases(): Promise<Game[]> {
  const now = Math.floor(Date.now() / 1000);
  const twoMonthsAgo = now - (60 * 24 * 60 * 60);
  const query = `
    fields name, first_release_date, cover.image_id, total_rating, platforms.name, genres.name;
    where first_release_date < ${now} & first_release_date > ${twoMonthsAgo} & cover.image_id != null;
    sort total_rating_count desc;
    limit 24;
  `;
  const results = await igdbRequest("games", query);
  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
    hero_image: "",
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  }));
}

export interface CalendarRelease {
  id: number;
  date: number;
  human: string;
  game: {
    id: number;
    name: string;
    cover?: { image_id: string };
    total_rating?: number;
    genres?: { id: number; name: string }[];
  };
  platform?: { id: number; name: string };
}

export interface AdvancedSearchFilters {
  genres?: number[];
  platforms?: number[];
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
  gameModes?: number[];
  query?: string;
}

export interface ComparisonGame extends Game {
  summary?: string;
  involved_companies?: string[];
  game_modes?: { id: number; name: string }[];
  themes?: { id: number; name: string }[];
}

export async function fetchReleaseCalendar(month: number, year: number): Promise<CalendarRelease[]> {
  const startOfMonth = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  const endOfMonth = Math.floor(new Date(year, month, 1).getTime() / 1000);

  const query = `
    fields game.name, game.cover.image_id, game.total_rating, game.genres.name, date, human, platform.name;
    where date >= ${startOfMonth} & date < ${endOfMonth};
    sort date asc;
    limit 100;
  `;
  const results = await igdbRequest("release_dates", query);
  return results;
}

export async function searchGamesAdvanced(filters: AdvancedSearchFilters): Promise<Game[]> {
  let whereClauses: string[] = ["cover.image_id != null"];
  
  if (filters.genres && filters.genres.length > 0) {
    whereClauses.push(`genres = (${filters.genres.join(',')})`);
  }
  if (filters.platforms && filters.platforms.length > 0) {
    whereClauses.push(`platforms = (${filters.platforms.join(',')})`);
  }
  if (filters.minRating) {
    whereClauses.push(`total_rating >= ${filters.minRating}`);
  }
  if (filters.yearFrom) {
    const fromStamp = Math.floor(new Date(filters.yearFrom, 0, 1).getTime() / 1000);
    whereClauses.push(`first_release_date >= ${fromStamp}`);
  }
  if (filters.yearTo) {
    const toStamp = Math.floor(new Date(filters.yearTo + 1, 0, 1).getTime() / 1000);
    whereClauses.push(`first_release_date < ${toStamp}`);
  }
  if (filters.gameModes && filters.gameModes.length > 0) {
    whereClauses.push(`game_modes = (${filters.gameModes.join(',')})`);
  }

  let query = `
    fields name, first_release_date, cover.image_id, artworks.image_id, total_rating, platforms.name, genres.name;
    where ${whereClauses.join(' & ')};
    limit 20;
  `;

  if (filters.query) {
    const safeQuery = filters.query.replace(/[\\";{}()\n\r]/g, '').substring(0, 100);
    query = `search "${safeQuery}";\n` + query;
  }

  const results = await igdbRequest("games", query);
  
  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
    hero_image: g.artworks?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.artworks[0].image_id}.jpg` : "",
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  }));
}

export async function fetchFranchiseGames(franchiseId: number): Promise<{ name: string; games: Game[] } | null> {
  if (!Number.isInteger(franchiseId) || franchiseId <= 0) return null;

  const query = `
    fields name, games;
    where id = ${franchiseId};
  `;
  const franchiseResults = await igdbRequest("franchises", query);
  if (!franchiseResults.length) return null;

  const franchise = franchiseResults[0];
  if (!franchise.games || franchise.games.length === 0) {
    return { name: franchise.name, games: [] };
  }

  const games = await fetchGamesByIds(franchise.games);
  return { name: franchise.name, games };
}

export async function fetchGamesForComparison(ids: [number, number]): Promise<ComparisonGame[]> {
  if (ids.length !== 2) return [];
  const query = `
    fields name, first_release_date, cover.image_id, total_rating, platforms.name, genres.name, summary, involved_companies.company.name, game_modes.name, themes.name;
    where id = (${ids.join(",")});
    limit 2;
  `;
  const results = await igdbRequest("games", query);

  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : "2024-01-01",
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
    summary: g.summary || "",
    involved_companies: g.involved_companies ? g.involved_companies.map((c: any) => c.company?.name).filter(Boolean) : [],
    game_modes: g.game_modes ? g.game_modes.map((m: any) => ({ id: m.id, name: m.name })) : [],
    themes: g.themes ? g.themes.map((t: any) => ({ id: t.id, name: t.name })) : [],
  }));
}

export async function fetchGenresList(): Promise<{ id: number; name: string }[]> {
  const query = `
    fields name;
    limit 100;
  `;
  const results = await igdbRequest("genres", query);
  return results.map((g: any) => ({ id: g.id, name: g.name }));
}

export async function fetchPlatformsList(): Promise<{ id: number; name: string }[]> {
  const query = `
    fields name;
    sort name asc;
    limit 200;
  `;
  const results = await igdbRequest("platforms", query);
  return results.map((p: any) => ({ id: p.id, name: p.name }));
}

export async function searchFranchises(queryStr: string): Promise<{ id: number; name: string; games_count: number }[]> {
  const safeQuery = (queryStr || "")
    .replace(/[\\";{}()\n\r]/g, '')
    .substring(0, 100);

  if (!safeQuery.trim()) return [];

  const { db } = await import("./db");
  try {
    const cached = await db.get('SELECT * FROM "SearchCache" WHERE query = $1 AND type = $2 AND "expiresAt" > CURRENT_TIMESTAMP', [safeQuery.toLowerCase(), 'franchise']);
    if (cached && cached.resultData) {
      return typeof cached.resultData === 'string' ? JSON.parse(cached.resultData) : cached.resultData;
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }

  const query = `
    fields name, games;
    where name ~ *"${safeQuery}"*ig;
    limit 20;
  `;
  const results = await igdbRequest("franchises", query);
  
  const mapped = results.map((f: any) => ({
    id: f.id,
    name: f.name,
    games_count: f.games ? f.games.length : 0
  }));

  try {
    await db.run(`
      INSERT INTO "SearchCache" (query, type, "resultData", "expiresAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '1 day')
      ON CONFLICT (query) DO UPDATE SET "resultData" = $3, "expiresAt" = CURRENT_TIMESTAMP + INTERVAL '1 day'
    `, [safeQuery.toLowerCase(), 'franchise', JSON.stringify(mapped)]);
  } catch (err) {
    console.error("Cache write error:", err);
  }

  return mapped;
}
