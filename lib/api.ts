// lib/api.ts
// Core IGDB client using Twitch client credentials
import fetch from 'node-fetch';

export interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  rating: number;
  platforms: { platform: { id: number; name: string } }[];
  genres: { id: number; name: string }[];
}

// Helper to obtain an access token (client credentials flow). Token is cached in memory.
let cachedToken: { access_token: string; expires_at: number } | null = null;
async function getAccessToken(): Promise<string> {
  const now = Date.now() / 1000;
  if (cachedToken && cachedToken.expires_at - now > 60) {
    return cachedToken.access_token;
  }
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Twitch client credentials not configured');
  }
  const resp = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const data = await resp.json();
  cachedToken = { access_token: data.access_token, expires_at: now + data.expires_in };
  return cachedToken.access_token;
}

/** Generic IGDB request wrapper */
export async function igdbRequest(endpoint: string, query: string): Promise<any[]> {
  const token = await getAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  const url = `https://api.igdb.com/v4/${endpoint}`;
  const resp = await fetch(url, {
    method: 'POST',
    body: query,
    headers: {
      'Client-ID': clientId!,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'text/plain',
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`IGDB request failed: ${resp.status} ${txt}`);
  }
  return await resp.json();
}

/** Fetch a game by ID */
export async function fetchGameById(id: number): Promise<Game | null> {
  const results = await igdbRequest('games', `fields name,first_release_date,cover.image_id,total_rating,platforms.name,genres.name; where id = ${id};`);
  if (!results.length) return null;
  const g = results[0];
  return {
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : '',
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : '',
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  };
}

/** Fetch multiple games by IDs */
export async function fetchGamesByIds(ids: number[]): Promise<Game[]> {
  if (ids.length === 0) return [];
  const query = `fields name,first_release_date,cover.image_id,total_rating,platforms.name,genres.name; where id = (${ids.join(',')}); limit ${ids.length};`;
  const results = await igdbRequest('games', query);
  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : '',
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : '',
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  } as Game));
}

// ----------------------------------------------------------------------
// NEW IGDB Helpers – Calendar, Advanced Search, Collections, Comparison
// ----------------------------------------------------------------------

/**
 * Fetch all upcoming releases for a given year (default: current year) and group them by date.
 * Returns an object where the key is a YYYY-MM-DD string and the value is an array of Game.
 */
export async function fetchReleaseCalendar(year?: number): Promise<Record<string, Game[]>> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const start = Math.floor(new Date(`${targetYear}-01-01T00:00:00Z`).getTime() / 1000);
  const end = Math.floor(new Date(`${targetYear}-12-31T23:59:59Z`).getTime() / 1000);

  const query = `
    fields name, first_release_date, cover.image_id, total_rating, platforms.name, genres.name;
    where first_release_date >= ${start} & first_release_date <= ${end} & cover.image_id != null;
    sort first_release_date asc;
    limit 500;
  `;

  const results = await igdbRequest('games', query);
  const grouped: Record<string, Game[]> = {};
  results.forEach((g: any) => {
    const date = g.first_release_date
      ? new Date(g.first_release_date * 1000).toISOString().split('T')[0]
      : `${targetYear}-01-01`;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({
      id: g.id,
      name: g.name,
      released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : '',
      background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : '',
      rating: g.total_rating || 0,
      platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
      genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
    } as Game);
  });
  return grouped;
}

/**
 * Advanced search with multiple filter criteria.
 */
export interface AdvancedFilters {
  query?: string;
  genres?: number[];
  themes?: number[];
  platforms?: number[];
  game_modes?: number[];
  player_perspectives?: number[];
  releasedAfter?: number; // unix timestamp
}

export async function searchGamesAdvanced(filters: AdvancedFilters): Promise<Game[]> {
  const safeQuery = (filters.query || '').replace(/[\";{}()\n\r]/g, '').substring(0, 100);
  const whereClauses: string[] = [];
  if (filters.genres?.length) whereClauses.push(`genres = (${filters.genres.join(',')})`);
  if (filters.themes?.length) whereClauses.push(`themes = (${filters.themes.join(',')})`);
  if (filters.platforms?.length) whereClauses.push(`platforms = (${filters.platforms.join(',')})`);
  if (filters.game_modes?.length) whereClauses.push(`game_modes = (${filters.game_modes.join(',')})`);
  if (filters.player_perspectives?.length) whereClauses.push(`player_perspectives = (${filters.player_perspectives.join(',')})`);
  if (filters.releasedAfter) whereClauses.push(`first_release_date > ${filters.releasedAfter}`);
  const whereClause = whereClauses.length ? `where ${whereClauses.join(' & ')};` : '';
  const query = `
    search "${safeQuery}";
    fields name, first_release_date, cover.image_id, total_rating, platforms.name, genres.name;
    ${whereClause}
    limit 30;
  `;
  const results = await igdbRequest('games', query);
  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : '',
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : '',
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
  } as Game));
}

/** Fetch a collection or franchise by slug */
export async function fetchCollectionOrFranchise(slug: string): Promise<Game[]> {
  const colQuery = `search "${slug}"; fields name, games; limit 1;`;
  const colRes = await igdbRequest('collections', colQuery);
  if (colRes.length) {
    const ids = colRes[0].games || [];
    return await fetchGamesByIds(ids);
  }
  const frQuery = `search "${slug}"; fields name, games; limit 1;`;
  const frRes = await igdbRequest('franchises', frQuery);
  if (frRes.length) {
    const ids = frRes[0].games || [];
    return await fetchGamesByIds(ids);
  }
  return [];
}

/** Fetch up to two games for side‑by‑side comparison */
export async function fetchGamesForComparison(ids: number[]): Promise<Game[]> {
  if (!ids.length) return [];
  const limited = ids.slice(0, 2);
  const query = `
    fields name, first_release_date, cover.image_id, total_rating, platforms.name, genres.name, involved_companies.company.name;
    where id = (${limited.join(',')});
    limit 2;
  `;
  const results = await igdbRequest('games', query);
  return results.map((g: any) => ({
    id: g.id,
    name: g.name,
    released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : '',
    background_image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : '',
    rating: g.total_rating || 0,
    platforms: g.platforms ? g.platforms.map((p: any) => ({ platform: { id: p.id, name: p.name } })) : [],
    genres: g.genres ? g.genres.map((gen: any) => ({ id: gen.id, name: gen.name })) : [],
    companies: g.involved_companies ? g.involved_companies.map((c: any) => c.company?.name).filter(Boolean) : [],
  } as Game));
}

export { fetchReleaseCalendar, searchGamesAdvanced, fetchCollectionOrFranchise, fetchGamesForComparison };
