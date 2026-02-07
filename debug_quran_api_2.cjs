
const https = require('https');

https.get('https://api.alquran.cloud/v1/page/1/ar.abdulbasitmurattal', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        console.log("Status:", json.status);
        if (json.data && json.data.ayahs && json.data.ayahs.length > 0) {
            console.log("First Ayah Keys:", Object.keys(json.data.ayahs[0]));
            console.log("First Ayah Audio:", json.data.ayahs[0].audio);
            console.log("First Ayah AudioSecondary:", json.data.ayahs[0].audioSecondary);
        }
    } catch (e) { console.log(e); }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
