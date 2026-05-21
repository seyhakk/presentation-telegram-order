const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

// Fix delivery video: add autoplay + lazy-video class + preload auto
h = h.replace(
  'id="deliveryVideo" src="images/delivey demo.mp4" muted loop playsinline preload="none"',
  'id="deliveryVideo" class="lazy-video" src="images/delivey demo.mp4" autoplay muted loop playsinline preload="auto"'
);

fs.writeFileSync(path, h, 'utf8');
console.log('Fixed: added autoplay + lazy-video to delivery video');
