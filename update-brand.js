const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let html = fs.readFileSync(path, 'utf8');

// Replace all variants
html = html.replace(/Oyster House/g, 'Telegram Order Management');
html = html.replace(/Oyster<span>House</span>/g, 'Telegram<span>Order Management</span>');
html = html.replace(/oysterhouse/g, 'telegram-order');
html = html.replace(/Rkeeper/g, 'Telegram Order');
html = html.replace(/rkeeper/g, 'telegram-order');
html = html.replace(/TELEGRAM ORDER/g, 'TELEGRAM ORDER MANAGEMENT');

fs.writeFileSync(path, html, 'utf8');
console.log('Branding updated to Telegram Order Management');
