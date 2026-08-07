const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const idMatch = dotenv.match(/IGDB_CLIENT_ID=(.*)/);
const secMatch = dotenv.match(/IGDB_CLIENT_SECRET=(.*)/);
const clientId = idMatch ? idMatch[1].trim() : '';
const clientSecret = secMatch ? secMatch[1].trim() : '';

async function run() {
  const tokenRes = await fetch('https://id.twitch.tv/oauth2/token?client_id=' + clientId + '&client_secret=' + clientSecret + '&grant_type=client_credentials', { method: 'POST' });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  
  const searchRes = await fetch('https://api.igdb.com/v4/franchises', {
    method: 'POST',
    headers: { 'Client-ID': clientId, 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
    body: 'search "Zelda"; fields name, games, games.cover.image_id; limit 20;'
  });
  console.log(await searchRes.text());
}
run();
