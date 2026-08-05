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

async function igdbRequest(endpoint: string, body: string) {
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
    fields name, first_release_date, cover.image_id, artworks.image_id, total_rating, platforms.name, genres.name;
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
    hero_image: g.artworks?.[0]?.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.artworks[0].image_id}.jpg` : "",
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

  const query = `
    search "${safeQuery}";
    fields name, first_release_date, cover.image_id, artworks.image_id, total_rating, platforms.name, genres.name;
    where cover.image_id != null;
    limit 20;
  `;
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
