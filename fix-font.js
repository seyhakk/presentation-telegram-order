const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

// Replace all Playfair Display with DM Sans
h = h.replace(/'Playfair Display', serif/g, "'DM Sans', sans-serif");

// Replace inline font-family styles
h = h.replace(/font-family:'Playfair Display'/g, "font-family:'DM Sans'");

// Update Google Fonts URL - swap Playfair for DM Sans
h = h.replace('Playfair+Display:ital', 'DM+Sans:ital');

// Remove duplicate DM Sans weights from URL
h = h.replace('DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&family=DM+Sans', 'DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700');

console.log('Replaced Playfair Display with DM Sans');

fs.writeFileSync(path, h, 'utf8');
