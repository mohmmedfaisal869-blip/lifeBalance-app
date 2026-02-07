
const https = require('https');

https.get('https://api.alquran.cloud/v1/edition?format=audio', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        if (json.data) {
             const list = json.data.map(e => ({ id: e.identifier, name: e.englishName, type: e.type, language: e.language }));
             console.log(JSON.stringify(list, null, 2));
        } else {
             console.log("No data found");
        }
    } catch (e) { console.log(e); }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
