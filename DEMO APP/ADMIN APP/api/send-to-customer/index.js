const DELIVERY_BOT_TOKEN = '8721362023:AAGUUSAmAGxN6CszdSnO4yK0MIoYAkyRmQg';
const PICKUP_BOT_TOKEN = '8707616318:AAHZydCWkN1L5KLf3SbBBHgH8nSf5L8JpSw';
const SUPABASE_URL = 'https://onvhmwjhiydhzirfcatp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udmhtd2poaXlkaHppcmZjYXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDM1OTgsImV4cCI6MjA5MzYxOTU5OH0.kxgGBEbGCleAGsv5903iutUbEQt6G7kaf12qm_f0tFQ';

async function supabaseQuery(q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  return r.json();
}

function tgBotToken(orderType) {
  return orderType === 'delivery' ? DELIVERY_BOT_TOKEN : PICKUP_BOT_TOKEN;
}

function formatCurrency(v) {
  return '$' + Number(v || 0).toFixed(2);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id required' });

    const [order] = await supabaseQuery(`orders?id=eq.${order_id}&select=*`);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.telegram_user_id) return res.status(400).json({ error: 'No Telegram user ID' });

    const items = await supabaseQuery(`order_items?order_id=eq.${order_id}&select=*`);
    const itemsArr = Array.isArray(items) ? items : [];

    const itemsList = itemsArr.map(i =>
      `• ${i.item_name} x${i.quantity} — ${formatCurrency(i.quantity * i.unit_price)}`
    ).join('\n');

    const totalItems = itemsArr.reduce((s, i) => s + i.quantity, 0);
    const typeLabel = order.order_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Order';

    const text = `📋 <b>Order Update — ${typeLabel}</b>\n\n` +
      `🆔 <b>Order #${order.id?.slice(0, 8)}</b>\n` +
      `👤 ${order.customer_name || 'Guest'}\n` +
      `📞 ${order.customer_phone || 'N/A'}\n` +
      `📌 Status: <b>${order.status}</b>\n\n` +
      `<b>Items:</b>\n${itemsList}\n\n` +
      `💰 <b>Total:</b> ${formatCurrency(order.total_amount)}\n\n` +
      `Thank you for your order! 🍽️`;

    const token = tgBotToken(order.order_type);
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: order.telegram_user_id, text, parse_mode: 'HTML' })
    });

    const result = await resp.json();

    if (!result.ok) {
      return res.status(400).json({ error: result.description });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('send-to-customer error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
