
const https = require('https');

https.get('https://api.alquran.cloud/v1/edition?format=audio&language=ar&type=versebyverse', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        if (json.data) {
             const list = json.data.map(e => ({ id: e.identifier, name: e.englishName }));
             console.log(JSON.stringify(list, null, 2));
        }
    } catch (e) { console.log(e); }
  });
});
