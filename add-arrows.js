const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

// Add CSS for nav arrows
const arrowCSS = `
.slide-nav-arrow { position:fixed; top:50%; transform:translateY(-50%); z-index:50; width:44px; height:44px; border-radius:50%; border:1px solid var(--border); background:var(--card); backdrop-filter:blur(8px); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; color:var(--espresso); transition:all 0.3s; box-shadow:0 2px 12px var(--card-shadow); }
.slide-nav-arrow:hover { border-color:var(--terracotta); color:var(--terracotta); transform:translateY(-50%) scale(1.05); }
.slide-nav-arrow.prev { left:16px; }
.slide-nav-arrow.next { right:16px; }
.slide-nav-arrow:disabled { opacity:0.2; cursor:default; transform:translateY(-50%) scale(1); }
@media(max-width:768px){ .slide-nav-arrow { width:36px; height:36px; font-size:14px; } .slide-nav-arrow.prev { left:6px; } .slide-nav-arrow.next { right:6px; } }
`;

// Insert CSS before </style>
h = h.replace('</style>', arrowCSS + '</style>');

// Add navigation buttons after slideCounter
const navButtons = `
<button class="slide-nav-arrow prev" id="navPrev" aria-label="Previous slide">&#10094;</button>
<button class="slide-nav-arrow next" id="navNext" aria-label="Next slide">&#10095;</button>
`;

h = h.replace('<div class="theme-toggle-wrap">', navButtons + '<div class="theme-toggle-wrap">');

// Add event listeners in the INIT section
const navInitJS = `
  /* === NAV ARROWS === */
  document.getElementById('navPrev').addEventListener('click', function() { prev(); });
  document.getElementById('navNext').addEventListener('click', function() { next(); });
  function updateNavArrows() {
    document.getElementById('navPrev').disabled = (current === 0);
    document.getElementById('navNext').disabled = (current === total - 1);
  }
  var origUpdateProgress = updateProgress;
  updateProgress = function() { origUpdateProgress(); updateNavArrows(); };
`;

// Insert after INIT comment
h = h.replace('/* === INIT === */', navInitJS + '/* === INIT === */');

fs.writeFileSync(path, h, 'utf8');
console.log('Added prev/next navigation arrows');
