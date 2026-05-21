const http = require('http');

http.get('http://localhost:9000/PRESENTATION-V2/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Content length:', data.length);
    console.log('First 100 chars:', data.substring(0, 100));
  });
}).on('error', (e) => {
  console.log('Error:', e.message);
});
