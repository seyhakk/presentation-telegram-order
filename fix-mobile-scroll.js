const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

// Fix 1: deltaY threshold - change 20 to 80 on mobile
h = h.replace(
  'if (e.deltaY > 20) next();      else if (e.deltaY < -20) prev();    }, 80);',
  'if (window.innerWidth < 768) { if (e.deltaY > 80) next(); else if (e.deltaY < -80) prev(); } else { if (e.deltaY > 20) next(); else if (e.deltaY < -20) prev(); }    }, window.innerWidth < 768 ? 300 : 80);'
);

// Fix 2: Touch swipe threshold - change 40 to 100 on mobile
h = h.replace(
  '> 40) {      diff > 0 ? next(true) : prev(true);    }',
  '> (window.innerWidth < 768 ? 100 : 40)) {      diff > 0 ? next(true) : prev(true);    }'
);

// Fix 3: Make touchmove passive but prevent default on slides already added

fs.writeFileSync(path, h, 'utf8');
console.log('Mobile scroll sensitivity fixed');
