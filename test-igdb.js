require('dotenv').config({path: '.env.local'});
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';

(async () => {
  try {
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token?client_id='+process.env.TWITCH_CLIENT_ID+'&client_secret='+process.env.TWITCH_CLIENT_SECRET+'&grant_type=client_credentials', {method:'POST'});
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    
    const igdbQuery = `
      search "Minecraft";
      fields name;
      limit 10;
    `;
    
    const res = await fetch('https://api.igdb.com/v4/franchises', {
      method:'POST',
      headers:{
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'text/plain'
      },
      body: igdbQuery
    });
    
    console.log(res.status, await res.text());
  } catch(e) {
    console.error(e);
  }
})();
