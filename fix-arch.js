const fs = require('fs');
const path = 'C:\\Users\\seyha\\Desktop\\PRESENTATION-V2\\PRESENTATION-V2\\index.html';
let h = fs.readFileSync(path, 'utf8');

// Find the hex diagram section and replace with large card layout
const startMarker = '<!-- SLIDE 3: ARCHITECTURE';
const endMarker = '<!-- ====== PART 2: DINE-IN APP ====== -->';

const startIdx = h.indexOf(startMarker);
const endIdx = h.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('Markers not found');
  process.exit(1);
}

const newSlide = `<!-- SLIDE 3: ARCHITECTURE → CARD DIAGRAM -->
<section class="slide" id="slide-2" data-index="2" data-title="How It Connects">
<div class="slide-inner">
<span class="label-tag anim-el d1">Part 1 · Architecture</span>
<h2 class="slide-title anim-el d2">How It <span class="italic">All Connects</span></h2>
<p class="slide-sub anim-el d3" style="margin-bottom:16px;">A visual look at how customers, apps, database, and Telegram bots work together in real time.</p>

<div class="arch-card-wrap anim-el d4" style="max-width:780px;margin:0 auto;">

<!-- ROW: CUSTOMER -->
<div class="arch-card-row" style="display:flex;justify-content:center;margin-bottom:6px;">
<div class="arch-card" style="background:rgba(201,79,58,0.06);border:2px solid rgba(201,79,58,0.2);border-radius:14px;padding:16px 28px;text-align:center;min-width:200px;">
<div style="font-size:26px;margin-bottom:4px;">👤</div>
<div style="font-weight:700;font-size:16px;color:var(--terracotta);">Customer</div>
<div style="font-size:13px;color:var(--warm-gray);margin-top:2px;">Opens Telegram mini app or scans QR code at table</div>
</div>
</div>
<div style="display:flex;justify-content:center;margin-bottom:6px;"><div style="width:2px;height:22px;background:var(--warm-gray-light);"></div></div>
<div class="arch-card-row" style="display:flex;justify-content:center;margin-bottom:2px;">
<div style="width:40%;height:2px;background:var(--warm-gray-light);"></div>
<div style="width:10px;height:10px;border-radius:2px;background:#ccc;flex-shrink:0;margin:0 4px;"></div>
<div style="width:40%;height:2px;background:var(--warm-gray-light);"></div>
</div>

<!-- ROW: THREE APPS -->
<div style="font-size:10px;color:var(--warm-gray);text-transform:uppercase;letter-spacing:0.1em;text-align:center;margin-bottom:8px;">APPLICATION LAYER</div>
<div class="arch-card-row" style="display:flex;gap:14px;justify-content:center;margin-bottom:6px;">
<div class="arch-card" style="flex:1;max-width:210px;background:rgba(212,168,83,0.05);border:1px solid rgba(212,168,83,0.2);border-radius:12px;padding:14px 16px;text-align:center;border-top:3px solid #d4a853;">
<div style="font-size:22px;margin-bottom:4px;">📱</div>
<div style="font-weight:700;font-size:14px;color:#8a6a20;">Dine‑In App</div>
<div style="font-size:12px;color:var(--warm-gray);line-height:1.4;margin-top:4px;">Customer browses menu, adds items, enters access code, submits order. Receipt via Telegram.</div>
</div>
<div class="arch-card" style="flex:1;max-width:210px;background:rgba(90,122,90,0.05);border:1px solid rgba(90,122,90,0.2);border-radius:12px;padding:14px 16px;text-align:center;border-top:3px solid #5a7a5a;">
<div style="font-size:22px;margin-bottom:4px;">🚚</div>
<div style="font-weight:700;font-size:14px;color:#5a7a5a;">Delivery App</div>
<div style="font-size:12px;color:var(--warm-gray);line-height:1.4;margin-top:4px;">Customer orders delivery, shares GPS, chooses delivery or pickup. Driver dispatch via Telegram.</div>
</div>
<div class="arch-card" style="flex:1;max-width:210px;background:rgba(201,79,58,0.05);border:1px solid rgba(201,79,58,0.2);border-radius:12px;padding:14px 16px;text-align:center;border-top:3px solid var(--terracotta);">
<div style="font-size:22px;margin-bottom:4px;">🖥️</div>
<div style="font-weight:700;font-size:14px;color:var(--terracotta);">Admin App</div>
<div style="font-size:12px;color:var(--warm-gray);line-height:1.4;margin-top:4px;">Staff manages orders on Kanban, controls menu, stock, reports, customers, riders — 13 tabs.</div>
</div>
</div>

<!-- CONNECTOR TO DATABASE -->
<div style="display:flex;justify-content:center;margin-bottom:2px;">
<div style="width:2px;height:18px;background:var(--warm-gray-light);"></div>
</div>
<div class="arch-card-row" style="display:flex;justify-content:center;margin-bottom:8px;">
<div style="width:35%;height:2px;background:var(--warm-gray-light);"></div>
<div style="width:10px;height:10px;border-radius:2px;background:#ccc;flex-shrink:0;margin:0 4px;"></div>
<div style="width:35%;height:2px;background:var(--warm-gray-light);"></div>
</div>

<!-- ROW: DATABASE -->
<div style="font-size:10px;color:var(--warm-gray);text-transform:uppercase;letter-spacing:0.1em;text-align:center;margin-bottom:8px;">DATA LAYER</div>
<div class="arch-card-row" style="display:flex;justify-content:center;margin-bottom:6px;">
<div class="arch-card" style="background:rgba(90,122,90,0.06);border:2px dashed rgba(90,122,90,0.35);border-radius:14px;padding:16px 32px;text-align:center;min-width:260px;">
<div style="font-size:26px;margin-bottom:4px;">🗄️</div>
<div style="font-weight:700;font-size:16px;color:#5a7a5a;">Supabase Database</div>
<div style="font-size:13px;color:var(--warm-gray);margin-top:2px;">PostgreSQL · Real-time subscriptions · 11 tables — all apps read/write in real-time</div>
</div>
</div>

<!-- CONNECTOR TO BOTS -->
<div style="display:flex;justify-content:center;margin-bottom:2px;">
<div style="width:2px;height:18px;background:var(--warm-gray-light);"></div>
</div>
<div class="arch-card-row" style="display:flex;justify-content:center;margin-bottom:8px;">
<div style="width:35%;height:2px;background:var(--warm-gray-light);"></div>
<div style="width:10px;height:10px;border-radius:2px;background:#ccc;flex-shrink:0;margin:0 4px;"></div>
<div style="width:35%;height:2px;background:var(--warm-gray-light);"></div>
</div>

<!-- ROW: BOTS -->
<div style="font-size:10px;color:var(--warm-gray);text-transform:uppercase;letter-spacing:0.1em;text-align:center;margin-bottom:8px;">INTEGRATION LAYER</div>
<div class="arch-card-row" style="display:flex;gap:14px;justify-content:center;">
<div class="arch-card" style="flex:1;max-width:210px;background:rgba(58,50,44,0.04);border:1px solid rgba(58,50,44,0.12);border-radius:12px;padding:12px 16px;text-align:center;">
<div style="font-size:20px;margin-bottom:2px;">🤖</div>
<div style="font-weight:700;font-size:13px;">Staff Bot</div>
<div style="font-size:11px;color:var(--warm-gray);line-height:1.3;margin-top:4px;">New order alerts, daily reports, /code command to staff Telegram group</div>
</div>
<div class="arch-card" style="flex:1;max-width:210px;background:rgba(58,50,44,0.04);border:1px solid rgba(58,50,44,0.12);border-radius:12px;padding:12px 16px;text-align:center;">
<div style="font-size:20px;margin-bottom:2px;">🤖</div>
<div style="font-weight:700;font-size:13px;">Customer Bot</div>
<div style="font-size:11px;color:var(--warm-gray);line-height:1.3;margin-top:4px;">Digital receipts and order confirmations sent to customer Telegram chat</div>
</div>
<div class="arch-card" style="flex:1;max-width:210px;background:rgba(58,50,44,0.04);border:1px solid rgba(58,50,44,0.12);border-radius:12px;padding:12px 16px;text-align:center;">
<div style="font-size:20px;margin-bottom:2px;">🔗</div>
<div style="font-weight:700;font-size:13px;">Driver Webhook</div>
<div style="font-size:11px;color:var(--warm-gray);line-height:1.3;margin-top:4px;">Take Order button → driver assigned → delivered. Live location tracking</div>
</div>
</div>

<!-- FLOW SUMMARY -->
<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px;">
<span style="font-size:11px;color:var(--warm-gray);padding:3px 10px;background:var(--card);border:1px solid var(--border);border-radius:6px;">① → ②③④ Customer places order via app</span>
<span style="font-size:11px;color:var(--warm-gray);padding:3px 10px;background:var(--card);border:1px solid var(--border);border-radius:6px;">⑤ Supabase stores and syncs in real-time</span>
<span style="font-size:11px;color:var(--warm-gray);padding:3px 10px;background:var(--card);border:1px solid var(--border);border-radius:6px;">⑥⑦⑧ Bots dispatch notifications</span>
</div>

</div>
</div>
</section>`;

const before = h.substring(0, startIdx);
const after = h.substring(endIdx);
const result = before + newSlide + after;

fs.writeFileSync(path, result, 'utf8');
console.log('Architecture slide replaced with large card diagram');
console.log('Start marker at:', startIdx);
console.log('End marker at:', endIdx);
