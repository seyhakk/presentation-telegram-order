const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let html = fs.readFileSync(path, 'utf8');

// Replace all branding variants
html = html.replace(/Tasty Bites/g, 'Telegram Order Management');
html = html.replace(/Restaurant Platform · Tasty Bites/g, 'Telegram Order Management · Restaurant Platform');
html = html.replace(/© 2026.*Platform/g, '© 2026 Telegram Order Management · Restaurant Platform');
html = html.replace(/nav-logo[^>]*>.*?</a>/g, 'nav-logo" href="#">Telegram<span>Order Management</span></a>');

fs.writeFileSync(path, html, 'utf8');
console.log('Branding updated to Telegram Order Management');
