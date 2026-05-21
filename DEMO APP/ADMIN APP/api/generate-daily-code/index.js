const BOT_TOKEN = '8698720525:AAERQpvaU_G2l3W7N2z6NDldhAlb3E44JJw';
const GROUP_ID = '-5102051806';
const SUPABASE_URL = 'https://onvhmwjhiydhzirfcatp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udmhtd2poaXlkaHppcmZjYXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDM1OTgsImV4cCI6MjA5MzYxOTU5OH0.kxgGBEbGCleAGsv5903iutUbEQt6G7kaf12qm_f0tFQ';

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function supabaseRpc(method, params) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(params || {}),
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Check if today's code already exists
    const existing = await supabaseRpc('get_today_access_code', {});
    const todayData = Array.isArray(existing) ? existing[0] : null;

    if (todayData && todayData.display_hint) {
      // Code already set for today — resend it
      const text = `<b>🔐 Today's Dine-In Table Code</b>\n\nCode: <code>${todayData.display_hint}</code>\n\nShare this code with dine-in customers when they order.`;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: GROUP_ID, text, parse_mode: 'HTML' }),
      });
      return res.status(200).json({ code: todayData.display_hint, source: 'existing', sent: true });
    }

    // No code set — generate and save a new one
    const newCode = generateCode();
    await supabaseRpc('save_daily_access_code', {
      input_code: newCode,
      admin_name: 'Auto-Generator',
    });

    const text = `<b>🔐 Today's Dine-In Table Code</b>\n\nCode: <code>${newCode}</code>\n<i>Auto-generated — change in admin panel if needed.</i>\n\nShare this code with dine-in customers when they order.`;
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: GROUP_ID, text, parse_mode: 'HTML' }),
    });

    return res.status(200).json({ code: newCode, source: 'generated', sent: true });
  } catch (error) {
    console.error('Daily code error:', error);
    return res.status(500).json({ error: error.message });
  }
}
