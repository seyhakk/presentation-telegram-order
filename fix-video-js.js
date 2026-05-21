const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

// Simplify delivery video handler - remove playBtn references
const oldJS = 'if (deliveryVideo && deliveryScreen) {    deliveryVideo.volume = 1.0;    deliveryScreen.addEventListener(\'click\', function(e) {      if (deliveryVideo.readyState === 0) deliveryVideo.load();      if (deliveryVideo.paused) {        deliveryVideo.muted = false;        deliveryVideo.play().then(function() {          if (deliveryPlayBtn) deliveryPlayBtn.style.display = \'none\';        }).catch(function() {});      } else {        deliveryVideo.pause();        if (deliveryPlayBtn) deliveryPlayBtn.style.display = \'flex\';      }    });    deliveryVideo.addEventListener(\'ended\', function() {      if (deliveryPlayBtn) deliveryPlayBtn.style.display = \'flex\';    });  }';

const newJS = 'if (deliveryVideo && deliveryScreen) {    deliveryVideo.volume = 1.0;    deliveryScreen.addEventListener(\'click\', function(e) {      if (deliveryVideo.readyState === 0) deliveryVideo.load();      if (deliveryVideo.paused) {        deliveryVideo.muted = false;        deliveryVideo.play().catch(function() {});      } else {        deliveryVideo.pause();      }    });  }';

if (h.includes(oldJS)) {
  h = h.replace(oldJS, newJS);
  console.log('Updated delivery video handler');
} else {
  console.log('Old JS not found - checking alternative pattern');
  // Try alternate pattern (minified may differ)
  if (h.includes('deliveryPlayBtn')) {
    h = h.replace(/var deliveryPlayBtn = document\.getElementById\('deliveryPlayBtn'\);\s*/g, '');
    h = h.replace(/if \(deliveryPlayBtn\) deliveryPlayBtn\.style\.display = '[^']+';\s*/g, '');
    console.log('Cleaned up playBtn references');
  }
}

fs.writeFileSync(path, h, 'utf8');
