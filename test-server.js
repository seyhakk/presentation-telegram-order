const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Test Server</title></head>
      <body>
        <h1>Local Server is Working!</h1>
        <p>If you can see this, the server is running on localhost:9000</p>
        <p><a href="/PRESENTATION-V2/">View Presentation</a></p>
        <p><strong>Try this link: http://localhost:9000/PRESENTATION-V2/</strong></p>
      </body>
    </html>
  `);
});

server.listen(9000, '127.0.0.1', () => {
  console.log('Server running at http://127.0.0.1:9000/');
});