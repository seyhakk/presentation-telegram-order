const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

// Remove the play button overlay div (deliveryPlayBtn)
const start = 'style="cursor:pointer;">';
const end = '<video id="deliveryVideo"';

const idx = h.indexOf(start);
const idx2 = h.indexOf(end);

if (idx !== -1 && idx2 !== -1) {
  // The play button is between cursor:pointer and the video tag
  const before = h.substring(0, idx + start.length);
  const after = h.substring(idx2);
  h = before + after;
  console.log('Removed play button overlay');
} else {
  console.log('Markers not found');
}

fs.writeFileSync(path, h, 'utf8');
