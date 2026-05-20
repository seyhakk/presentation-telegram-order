const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9000;
const baseDir = 'PRESENTATION-V2';

const server = http.createServer((req, res) => {
  let url = req.url;
  console.log('Request:', url);
  
  // Handle root and /PRESENTATION-V2/ as index
  if (url === '/' || url === '/PRESENTATION-V2/' || url === '/PRESENTATION-V2') {
    url = '/' + baseDir + '/index.html';
  } else if (url.startsWith('/' + baseDir)) {
    url = '/' + baseDir + url.substring(baseDir.length + 1);
  } else if (!url.startsWith('/' + baseDir)) {
    url = '/' + baseDir + url;
  }
  
  // Remove query parameters
  url = url.split('?')[0];
  // Decode URL-encoded characters (e.g. %20 → space)
  url = decodeURIComponent(url);
  console.log('Final URL:', url);
  
  const fullPath = path.join(__dirname, url);
  console.log('Full path:', fullPath);
  
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      console.log('Error:', err.code, 'for', fullPath);
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found: ' + fullPath);
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      const extname = path.extname(fullPath);
      let contentType = 'text/html';
       
      switch (extname) {
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
          contentType = 'image/jpeg';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.mp4':
          contentType = 'video/mp4';
          break;
      }
       
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`Presentation available at: http://localhost:${port}/PRESENTATION-V2/`);
});
