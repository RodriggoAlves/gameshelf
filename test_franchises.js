require('dotenv').config({ path: '.env' });
async function run() {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  const tokenRes = await fetch('https://id.twitch.tv/oauth2/token?client_id=' + clientId + '&client_secret=' + clientSecret + '&grant_type=client_credentials', { method: 'POST' });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  
  const res = await fetch('https://api.igdb.com/v4/franchises', {
    method: 'POST',
    headers: { 'Client-ID': clientId, 'Authorization': 'Bearer ' + token },
    body: 'fields name, games; where id = 24;'
  });
  console.log('ID 24:', await res.json());
  
  const searchRes = await fetch('https://api.igdb.com/v4/franchises', {
    method: 'POST',
    headers: { 'Client-ID': clientId, 'Authorization': 'Bearer ' + token },
    body: 'search "The Legend of Zelda"; fields name, games; limit 1;'
  });
  console.log('Search Zelda:', await searchRes.json());
}
run();
