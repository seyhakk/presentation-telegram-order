const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let html = fs.readFileSync(path, 'utf8');

// Replace all Rkeeper variants
html = html.replace(/RKEEPER/g, 'TELEGRAM ORDER');
html = html.replace(/Rkeeper/g, 'Telegram Order');
html = html.replace(/rkeeper/g, 'telegram-order');
html = html.replace(/RKEPER/g, 'TELEGRAM');
html = html.replace(/Rkeper/g, 'Telegram');
html = html.replace(/admin\.rkeeper\.app/g, 'admin.telegram.app');

fs.writeFileSync(path, html, 'utf8');
console.log('Replaced all Rkeeper branding with Telegram Order');
