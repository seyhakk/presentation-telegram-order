const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

// Remove deliveryPlayBtn variable declaration
h = h.replace('var deliveryPlayBtn = document.getElementById(\'deliveryPlayBtn\');', '');

// Remove the "Tap the screen" text
h = h.replace('Tap the screen to play delivery demo', 'Delivery App Demo · Auto-playing');

fs.writeFileSync(path, h, 'utf8');
console.log('Cleaned up playBtn variable and caption');
