const BOT_TOKEN = '8698720525:AAERQpvaU_G2l3W7N2z6NDldhAlb3E44JJw';
const GROUP_ID = '-5102051806';
const SUPABASE_URL = 'https://onvhmwjhiydhzirfcatp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udmhtd2poaXlkaHppcmZjYXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDM1OTgsImV4cCI6MjA5MzYxOTU5OH0.kxgGBEbGCleAGsv5903iutUbEQt6G7kaf12qm_f0tFQ';

async function tg(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  return r.json();
}

function sendText(chatId, text) {
  return tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
}

async function sendKeyboard(chatId, text, buttons) {
  await tg('sendMessage', {
    chat_id: chatId, text, parse_mode: 'HTML',
    reply_markup: { inline_keyboard: buttons }
  });
}

async function supabaseQuery(q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  return r.json();
}

async function supabasePatch(q, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/${q}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(data)
  });
}

async function checkAuth(userId) {
  const users = await supabaseQuery(`users?telegram_user_id=eq.${userId}&select=id,username,full_name,role`);
  if (users?.[0]) return { type: 'user', data: users[0] };
  const riders = await supabaseQuery(`delivery_staff?telegram_user_id=eq.${userId}&select=id,name,phone`);
  if (riders?.[0]) return { type: 'rider', data: riders[0] };
  return null;
}

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);
}

// --- Report handlers ---
async function handleReport(chatId) {
  const today = new Date().toISOString().split('T')[0];
  const orders = await supabaseQuery(`orders?select=*,order_items(*)&created_at=gte.${today}T00:00:00&created_at=lt.${today}T23:59:59`);
  const o = Array.isArray(orders) ? orders : [];
      const pickup = o.filter(oo => oo.order_type === 'pickup').length;
      const delivery = o.filter(oo => oo.order_type === 'delivery').length;
      const dineIn = o.filter(oo => oo.order_type === 'dine_in').length;
      const takeaway = o.filter(oo => oo.order_type === 'takeaway').length;
  const totalRevenue = o.reduce((s, oo) => s + (parseFloat(oo.total_amount) || 0), 0);
  const itemsSold = {};
  o.forEach(order => { (order.order_items || []).forEach(item => { itemsSold[item.name] = (itemsSold[item.name] || 0) + (item.quantity || 1); }); });
  const topItems = Object.entries(itemsSold).sort((a,b) => b[1]-a[1]).slice(0, 3).map(([n,q]) => `  ${q}x ${n}`).join('\n');
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  await sendText(chatId, `📊 <b>Daily Report</b>\n<code>${dateStr}</code>\n\n🏪 <b>Pickup</b>     ${pickup}\n🛵 <b>Delivery</b>   ${delivery}\n🍽️ <b>Dine-in</b>    ${dineIn}\n🥡 <b>Takeaway</b>   ${takeaway}\n─────────────────\n📦 <b>Total</b>       ${o.length}\n\n💰 <b>Revenue</b>     ${formatCurrency(totalRevenue)}${topItems ? `\n\n🔥 <b>Top Items</b>\n${topItems}` : ''}`);
}

async function handleOrders(chatId) {
  const today = new Date().toISOString().split('T')[0];
  const orders = await supabaseQuery(`orders?select=status&created_at=gte.${today}T00:00:00&created_at=lt.${today}T23:59:59`);
  const o = Array.isArray(orders) ? orders : [];
  const counts = {}; o.forEach(oo => { counts[oo.status] = (counts[oo.status] || 0) + 1; });
  await sendText(chatId, `📋 <b>Today's Orders</b>\n\n⏳ Pending     <b>${counts.pending || 0}</b>\n✅ Confirmed   <b>${counts.confirmed || 0}</b>\n🚚 Delivering  <b>${counts.delivering || 0}</b>\n🍽️ Dining      <b>${counts.dining || 0}</b>\n✔️ Completed   <b>${counts.completed || 0}</b>\n❌ Cancelled   <b>${counts.cancelled || 0}</b>\n─────────────────\n📦 <b>Total</b>        <b>${o.length}</b>`);
}

async function handleStock(chatId) {
  const items = await supabaseQuery('menu_items?select=name,stock_quantity,low_stock_threshold,available');
  const lowItems = (Array.isArray(items) ? items : []).filter(i => (i.stock_quantity || 0) <= (i.low_stock_threshold || 5));
  if (lowItems.length === 0) return sendText(chatId, '✅ <b>All items are well stocked!</b>');
  const list = lowItems.map(i => `⚠️ ${i.name} — <b>${i.stock_quantity}</b> left`).join('\n');
  await sendText(chatId, `📦 <b>Low Stock</b> · ${lowItems.length} items\n\n${list}`);
}

async function handleRevenue(chatId) {
  const today = new Date().toISOString().split('T')[0];
  const orders = await supabaseQuery(`orders?select=total_amount,status&created_at=gte.${today}T00:00:00&created_at=lt.${today}T23:59:59`);
  const o = Array.isArray(orders) ? orders : [];
  const total = o.reduce((s, oo) => s + (parseFloat(oo.total_amount) || 0), 0);
  const completed = o.filter(oo => oo.status === 'completed').reduce((s, oo) => s + (parseFloat(oo.total_amount) || 0), 0);
  await sendText(chatId, `💰 <b>Revenue</b>\n\nTotal: <b>${formatCurrency(total)}</b>\nDone: <b>${formatCurrency(completed)}</b>\nOpen: <b>${formatCurrency(total - completed)}</b>`);
}

async function handleUsers(chatId) {
  const users = await supabaseQuery('users?select=username,full_name,role,telegram_user_id&not.telegram_user_id.is.null&order=full_name');
  const list = (Array.isArray(users) ? users : []).map(u => `  • ${u.full_name || u.username} (@${u.username}) — ${u.role}`).join('\n');
  await sendText(chatId, `👥 <b>Linked Users (${(Array.isArray(users) ? users : []).length})</b>\n${list || '  None'}`);
}

// --- Delivery commands ---
async function handleAssigned(chatId, rider) {
  const name = rider.name || rider.data?.name || rider.data?.phone;
  const orders = await supabaseQuery(`orders?select=order_number,customer_name,customer_address,total_amount,status,order_type,created_at&assigned_driver_name=eq.${encodeURIComponent(name)}&in.status=(pending,confirmed,delivering)&order=created_at.desc&limit=10`);
  const o = Array.isArray(orders) ? orders : [];
  if (o.length === 0) return sendText(chatId, '✅ No active deliveries assigned to you.');
  const list = o.map((ord, i) => `#${i + 1}. <b>#${ord.order_number}</b>\n  🧑 ${ord.customer_name}\n  📍 ${ord.customer_address || 'N/A'}\n  💰 ${formatCurrency(ord.total_amount)}\n  📌 ${ord.order_type} | ${ord.status}`).join('\n\n');
  await sendText(chatId, `🚚 <b>Your Deliveries (${o.length})</b>\n\n${list}\n\nUse /delivered <order#>`);
}

async function handleDelivered(chatId, rider, orderNum) {
  if (!orderNum) return sendText(chatId, 'Usage: /delivered <order_number>\nExample: /delivered 42');
  const name = rider.name || rider.data?.name || rider.data?.phone;
  const orders = await supabaseQuery(`orders?order_number=eq.${orderNum}&assigned_driver_name=eq.${encodeURIComponent(name)}&select=id,status`);
  const ord = Array.isArray(orders) ? orders[0] : null;
  if (!ord) return sendText(chatId, '❌ Order not found or not assigned to you.');
  await supabasePatch(`orders?id=eq.${ord.id}`, { status: 'completed', updated_at: new Date().toISOString() });
  await sendText(chatId, `✅ Order #${orderNum} marked as delivered!`);
}

async function buildHelp(auth) {
  const isAdmin = auth?.type === 'user' && (auth?.data?.role === 'admin' || auth?.data?.role === 'manager');
  let cmds = `🤖 <b>Admin Bot Commands</b>\n━━━━━━━━━━━━━━━━━━\n📊 /report — Daily sales report\n📋 /orders — Today's order status\n⚠️ /stock — Low stock items\n💰 /revenue — Today's revenue`;
  if (auth?.data?.role === 'admin') cmds += `\n👥 /users — Linked users list`;
  cmds += `\n📱 /menu — Open report menu\n❓ /help — Show this menu`;
  return cmds;
}

async function helpRider(chatId) {
  await sendText(chatId, `🚚 <b>Delivery Bot Commands</b>\n━━━━━━━━━━━━━━━━━━\n🚚 /assigned — View your assigned deliveries\n✅ /delivered <order#> — Mark order as delivered\n❓ /help — Show this menu`);
}

// --- Main handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, my_chat_member, callback_query } = body;

    // Handle inline keyboard callbacks
    if (callback_query) {
      const chatId = callback_query.message.chat.id;
      const data = callback_query.data;
      const userId = callback_query.from.id;

      // Answer callback to stop loading
      await tg('answerCallbackQuery', { callback_query_id: callback_query.id });

      // Check auth
      const auth = await checkAuth(userId);
      if (!auth) {
        await sendText(chatId, '❌ <b>Not authorized</b>\n\nYour Telegram ID is not linked.\n\nContact your admin to link your account.\n\nYour ID: <code>' + userId + '</code>');
        return res.status(200).json({ ok: true });
      }

      const isAdmin = auth.type === 'user' && (auth.data.role === 'admin' || auth.data.role === 'manager');

      switch (data) {
        case 'report':
          if (!isAdmin) await sendText(chatId, '❌ Only admins and managers can use this command.');
          else await handleReport(chatId);
          break;
        case 'orders':
          if (!isAdmin) await sendText(chatId, '❌ Only admins and managers can use this command.');
          else await handleOrders(chatId);
          break;
        case 'stock':
          if (!isAdmin) await sendText(chatId, '❌ Only admins and managers can use this command.');
          else await handleStock(chatId);
          break;
        case 'revenue':
          if (!isAdmin) await sendText(chatId, '❌ Only admins and managers can use this command.');
          else await handleRevenue(chatId);
          break;
        case 'users':
          if (auth.data?.role !== 'admin') await sendText(chatId, '❌ Only admins can use this command.');
          else await handleUsers(chatId);
          break;
        case 'help':
          await sendText(chatId, buildHelp(auth));
          break;
        default:
          await sendText(chatId, 'Unknown report option.');
      }
      return res.status(200).json({ ok: true });
    }

    if (my_chat_member) return res.status(200).json({ ok: true });
    if (!message?.text) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim();
    const userId = message.from.id;

    // /start — always works with inline keyboard
    if (text === '/start') {
      await sendKeyboard(chatId, `👋 <b>Welcome!</b>\n\nYour ID: <code>${userId}</code>\n\nTap a report below:`, [
        [{ text: '📊 Daily Report', callback_data: 'report' }],
        [{ text: '📋 Orders', callback_data: 'orders' }, { text: '⚠️ Low Stock', callback_data: 'stock' }],
        [{ text: '💰 Revenue', callback_data: 'revenue' }, { text: '👥 Users', callback_data: 'users' }],
      ]);
      return res.status(200).json({ ok: true });
    }

    // /code — show today's dine-in table code (group only)
    if (text === '/code') {
      if (String(chatId) !== GROUP_ID) {
        await sendText(chatId, '❌ This command is only available in the group chat.');
        return res.status(200).json({ ok: true });
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_today_access_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: '{}'
      });
      const data = await r.json();
      const today = Array.isArray(data) ? data[0] : null;
      if (today?.display_hint) {
        await sendText(chatId, `🔐 <b>Today's Dine-In Table Code</b>\n\nCode: <code>${today.display_hint}</code>\nUpdated: ${today.updated_by || 'Auto'} · ${new Date(today.updated_at).toLocaleDateString()}`);
      } else {
        await sendText(chatId, '❌ No code set for today. Ask an admin to set one in the Dine-In Security page.');
      }
      return res.status(200).json({ ok: true });
    }

    // Any other message — direct to /start
    await sendText(chatId, 'Use <b>/start</b> to open the report menu.');
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true });
  }
}