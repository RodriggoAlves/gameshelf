// pages/api/auth/twitch.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * OAuth callback for Twitch login (client‑credentials already used for IGDB).
 * Expects `code` query param from Twitch redirect.
 * Exchanges it for an access token and redirects back to the home page with the token in a cookie.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing code' });
    return;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const redirectUri = process.env.TWITCH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).json({ error: 'Twitch credentials not configured' });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    res.status(500).json({ error: 'Failed to exchange token', details: tokenData });
    return;
  }

  // Set token cookie (httpOnly, secure in prod)
  const cookieOptions = [
    `access_token=${tokenData.access_token}`,
    'Path=/',
    'HttpOnly',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    'SameSite=Lax',
    `Max-Age=${tokenData.expires_in}`,
  ]
    .filter(Boolean)
    .join('; ');
  res.setHeader('Set-Cookie', cookieOptions);
  // Redirect to home (or dashboard)
  res.redirect('/');
}
