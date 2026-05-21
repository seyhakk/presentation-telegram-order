const BOT_TOKEN = '8698720525:AAERQpvaU_G2l3W7N2z6NDldhAlb3E44JJw';
const SUPABASE_URL = 'https://onvhmwjhiydhzirfcatp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udmhtd2poaXlkaHppcmZjYXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDM1OTgsImV4cCI6MjA5MzYxOTU5OH0.kxgGBEbGCleAGsv5903iutUbEQt6G7kaf12qm_f0tFQ';

async function supabaseQuery(q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  return r.json();
}

async function tg(method, payload) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
}

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'daily-report-secret'}`) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const orders = await supabaseQuery(`orders?select=*,order_items(*)&created_at=gte.${today}T00:00:00&created_at=lt.${today}T23:59:59`);
    const o = Array.isArray(orders) ? orders : [];
    
    const totalOrders = o.length;
    const totalRevenue = o.reduce((s, oo) => s + (parseFloat(oo.total_amount) || 0), 0);
    const pickup = o.filter(oo => oo.order_type === 'pickup').length;
    const delivery = o.filter(oo => oo.order_type === 'delivery').length;
    const dineIn = o.filter(oo => oo.order_type === 'dine_in').length;

    const itemsSold = {};
    o.forEach(order => {
      (order.order_items || []).forEach(item => {
        itemsSold[item.name] = (itemsSold[item.name] || 0) + (item.quantity || 1);
      });
    });
    const topItems = Object.entries(itemsSold).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => `  • ${qty}x ${name}`).join('\n');

    const lowStock = await supabaseQuery('menu_items?select=name,stock_quantity&lte=stock_quantity.5&limit=5');

    const report = `📊 <b>Daily Sales Report</b>
━━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleDateString()}

📦 Orders: ${totalOrders} total
  • Pickup: ${pickup}
  • Delivery: ${delivery}
  • Dine-in: ${dineIn}

💰 Revenue: ${formatCurrency(totalRevenue)}

${topItems ? `🔥 <b>Top Items:</b>\n${topItems}\n` : ''}
${lowStock?.length ? `⚠️ <b>Low Stock:</b>\n  • ${lowStock.map(i => i.name).join(', ')}` : ''}
━━━━━━━━━━━━━━━━━━
🕐 Auto-generated`;

    // Send to admin and manager roles
    const users = await supabaseQuery('users?select=telegram_user_id,role&not.telegram_user_id.is.null&in.role=(admin,manager)');
    const userIds = (Array.isArray(users) ? users : []).map(u => u.telegram_user_id).filter(Boolean);
    
    if (userIds.length > 0) {
      await tg('sendMessage', { chat_id: userIds, text: report, parse_mode: 'HTML' });
    }

    return res.status(200).json({ ok: true, sent_to: userIds.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed' });
  }
}