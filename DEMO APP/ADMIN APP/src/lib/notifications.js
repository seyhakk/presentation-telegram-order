import { supabase } from './supabase';

const DEFAULT_ROUTING = {
  reservation: ['admin', 'manager'],
  order_cancelled: ['admin', 'manager', 'order_man'],
  low_stock: ['admin', 'manager'],
  shift: ['admin', 'manager'],
};

let routingCache = null;

async function getRouting() {
  if (routingCache) return routingCache;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'notification_routing')
    .maybeSingle();
  if (data?.value) {
    try {
      routingCache = JSON.parse(data.value);
      return routingCache;
    } catch {}
  }
  return DEFAULT_ROUTING;
}

export function clearRoutingCache() {
  routingCache = null;
}

export async function sendPushNotification(message) {
  return sendRoleNotification(['manager', 'order_man', 'admin'], message);
}

export async function sendRoleNotification(roles, message) {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('telegram_user_id, role')
      .not('telegram_user_id', 'is', null);

    const userIds = (users || [])
      .filter(u => roles.includes(u.role))
      .map(u => u.telegram_user_id)
      .filter(Boolean);

    if (userIds.length === 0) return;

    const res = await fetch('/api/send-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userIds,
        text: message,
        parse_mode: 'HTML'
      })
    });

    return await res.json();
  } catch (e) {
    console.error('Push notification error:', e);
  }
}

export async function sendEventNotification(eventId, message) {
  const routing = await getRouting();
  const roles = routing[eventId] || DEFAULT_ROUTING[eventId] || [];
  if (roles.length === 0) return;
  return sendRoleNotification(roles, message);
}

export function formatLowStockAlert(items) {
  const list = items.map(i => `• ${i.name}: ${i.stock_quantity} left`).join('\n');
  return `⚠️ <b>Low Stock Alert</b>\n\n${list}\n\n${new Date().toLocaleString()}`;
}

export function formatOrderCancelled(order) {
  return `🚫 <b>Order Cancelled</b>\n\nOrder #${order.order_number}\nType: ${order.order_type}\nAmount: $${order.total_amount}\nReason: ${order.cancellation_reason || 'Not specified'}\n\n${new Date().toLocaleString()}`;
}

export function formatNewReservation(reservation) {
  return `📅 <b>New Reservation</b>\n\nName: ${reservation.customer_name}\nPhone: ${reservation.phone}\nDate: ${new Date(reservation.reservation_date).toLocaleDateString()}\nTime: ${reservation.reservation_time}\nParty Size: ${reservation.party_size}\n${reservation.notes ? `Notes: ${reservation.notes}` : ''}\n\n${new Date().toLocaleString()}`;
}