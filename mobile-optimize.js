const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

const mobileCSS = `
@media(max-width:640px){
  .slide { padding:12px 8px !important; }
  .slide-inner { padding-top:6px !important; padding-left:6px !important; padding-right:6px !important; font-size:13px !important; }
  .slide-title { font-size:clamp(20px,5vw,28px) !important; }
  .slide-sub { font-size:13px !important; }
  .label-tag { font-size:9px !important; }
  .cover-title { font-size:clamp(28px,7vw,36px) !important; }
  .cover-sub { font-size:13px !important; }
  .cover-badge { font-size:8px !important; margin-bottom:10px !important; }
  .cover-tag { font-size:8px !important; padding:3px 8px !important; }
  .cover-cta { flex-direction:column; align-items:stretch; }
  .cover-cta a { text-align:center; justify-content:center; }
  .cover-right .phone-frame { width:160px !important; height:330px !important; transform:scale(0.8) !important; }
  .cover-float { display:none !important; }
  .cover-glow { display:none !important; }
  #slide-0 .slide-inner { grid-template-columns:1fr !important; gap:10px !important; text-align:center !important; }
  .cover-left { align-items:center !important; }
  .cover-left .cover-line { margin:12px auto !important; }
  .cover-left .cover-tags { justify-content:center !important; }
  .cover-left .cover-cta { justify-content:center !important; }
  .grid-2 { grid-template-columns:1fr !important; gap:12px !important; }
  .grid-3 { grid-template-columns:1fr !important; gap:10px !important; }
  .grid-4 { grid-template-columns:1fr 1fr !important; gap:6px !important; }
  .phone-frame { width:160px !important; height:330px !important; }
  .desktop-frame { max-width:100% !important; }
  .slide-num { font-size:9px !important; top:6px !important; right:8px !important; }
  .theme-btn { width:30px !important; height:30px !important; font-size:13px !important; }
  .slide-nav-arrow { width:32px !important; height:32px !important; font-size:12px !important; }
  .slide-nav-arrow.prev { left:4px !important; }
  .slide-nav-arrow.next { right:4px !important; }
  .slide-rail { display:none !important; }
  .keyboard-hint { display:none !important; }
  .nav-bar { padding:3px 8px !important; gap:4px !important; bottom:10px !important; }
  .nav-btn { width:28px !important; height:28px !important; font-size:12px !important; }
  .nav-dot { width:5px !important; height:5px !important; }
  .nav-dot.active { width:16px !important; }
  .section-wrap { padding:40px 12px !important; }
  .explain-box { font-size:12px !important; padding:8px 10px !important; }
  .feature-item { padding:6px 0 !important; gap:6px !important; }
  .feature-icon { width:28px !important; height:28px !important; font-size:14px !important; }
  .feature-title { font-size:11px !important; }
  .feature-desc { font-size:10px !important; }
  .benefits-grid { grid-template-columns:1fr !important; gap:10px !important; }
  .b-card { padding:20px 16px !important; }
  .b-card .bc-number { font-size:36px !important; }
  .tg-grid { grid-template-columns:1fr !important; gap:10px !important; }
  .tg-card { padding:20px 16px !important; }
  .arch-card-row { flex-direction:column !important; align-items:center !important; }
  .arch-card { min-width:auto !important; max-width:100% !important; width:100% !important; }
  .arch-card-row + div[style*="height"] { display:none !important; }
  .hex-flow { flex-wrap:wrap !important; gap:4px !important; }
  .hex-node { width:80px !important; height:68px !important; padding:0 8px !important; }
  .hex-node.hex-lg { width:120px !important; height:100px !important; }
  .hex-node .hex-icon { font-size:14px !important; }
  .hex-node .hex-label { font-size:9px !important; }
  .hex-node .hex-sub { font-size:8px !important; }
  .hex-desc { font-size:9px !important; max-width:120px !important; }
  .hex-line, .hex-line-arrow, .hex-junction, .hex-branch, .hex-line-v { display:none !important; }
  .hex-badge { width:12px !important; height:12px !important; font-size:6px !important; }
  .kpi-row { grid-template-columns:repeat(2,1fr) !important; gap:8px !important; }
  .kpi-card { padding:12px !important; }
  .kpi-card .kc-value { font-size:24px !important; }
  .admin-grid { grid-template-columns:1fr !important; gap:12px !important; }
  .admin-content { padding:16px !important; }
  .admin-showcase { border-radius:10px !important; }
  .tab-btn { padding:8px 10px !important; font-size:10px !important; }
  .feat-row { grid-template-columns:1fr !important; gap:8px !important; }
  .tech-grid { grid-template-columns:repeat(2,1fr) !important; gap:8px !important; }
  .tech-card { padding:14px !important; }
  .cta-title { font-size:clamp(24px,6vw,32px) !important; }
  .cta-sub { font-size:13px !important; }
  .cta-buttons { flex-direction:column !important; align-items:stretch !important; }
  .cta-buttons .btn { width:100% !important; justify-content:center !important; }
  .pin-wrap { grid-template-columns:1fr !important; gap:20px !important; }
  .step-item { padding:14px 0 !important; }
  .step-item h3 { font-size:16px !important; }
  .step-item p { font-size:12px !important; }
  .phone-step .phone-frame { width:160px !important; height:330px !important; }
  .flow-row { gap:4px !important; }
  .flow-icon { width:36px !important; height:36px !important; font-size:16px !important; }
  .flow-label { font-size:9px !important; }
  .flow-arrow { font-size:12px !important; }
  h2.slide-title { font-size:clamp(20px,5vw,26px) !important; }
  .slide-inner .arch-card .arch-card-title { font-size:13px !important; }
  .pulse-btn { padding:10px 20px !important; font-size:12px !important; }
  .btn { padding:10px 20px !important; font-size:12px !important; }
  .pull-quote { font-size:13px !important; padding:10px 12px 10px 32px !important; }
  input, textarea, select { font-size:16px !important; }
}
`;

// Insert mobile CSS before the last media query block
h = h.replace('@media (prefers-reduced-motion:reduce)', mobileCSS + '@media (prefers-reduced-motion:reduce)');

fs.writeFileSync(path, h, 'utf8');
console.log('Mobile optimization CSS added');
