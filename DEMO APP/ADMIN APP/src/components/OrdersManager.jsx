import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/format';
import { cn } from '../utils/cn';
import { sendEventNotification, formatOrderCancelled } from '../lib/notifications';
import { X, RefreshCw, ArrowRight, Truck, Store, MapPin, ExternalLink, Clock, Bike, Phone, Copy } from 'lucide-react';

const DELIVERY_BOT_TOKEN = '8721362023:AAGUUSAmAGxN6CszdSnO4yK0MIoYAkyRmQg';
const PICKUP_BOT_TOKEN = '8707616318:AAHZydCWkN1L5KLf3SbBBHgH8nSf5L8JpSw';
const DELIVERY_GROUP_ID = '-5178890371';
const STATUSES = ['pending', 'confirmed', 'delivering', 'dining', 'completed', 'cancelled'];
const STATUS_CFG = {
  pending:   { label: 'Pending',    color: '#f59e0b', glow: 'shadow-[inset_0_0_0_1px_#f59e0b30] bg-amber-50/80' },
  confirmed: { label: 'Confirmed',  color: '#3b82f6', glow: 'shadow-[inset_0_0_0_1px_#3b82f630] bg-blue-50/80' },
  delivering:{ label: 'Delivering', color: '#06b6d4', glow: 'shadow-[inset_0_0_0_1px_#06b6d430] bg-cyan-50/80' },
  dining:    { label: 'Dining',     color: '#8b5cf6', glow: 'shadow-[inset_0_0_0_1px_#8b5cf630] bg-violet-50/80' },
  completed: { label: 'Completed',  color: '#22c55e', glow: 'shadow-[inset_0_0_0_1px_#22c55e30] bg-emerald-50/80' },
  cancelled: { label: 'Cancelled',  color: '#6b7280', glow: 'shadow-[inset_0_0_0_1px_#6b728030] bg-slate-50/80' },
};

const HIDDEN_BUTTONS = {
  pending:    ['delivering', 'dining', 'completed'],
  confirmed:  ['pending', 'completed', 'cancelled'],
  delivering: ['pending', 'confirmed', 'dining', 'cancelled'],
  dining:     ['pending', 'confirmed', 'delivering', 'cancelled'],
  completed:  ['pending', 'confirmed', 'delivering', 'dining'],
  cancelled:  STATUSES,
};

function getVisibleActions(s) { return STATUSES.filter(x => x !== s && !(HIDDEN_BUTTONS[s] || []).includes(x)); }

function tgBotToken(orderType) {
  return orderType === 'delivery' ? DELIVERY_BOT_TOKEN : PICKUP_BOT_TOKEN;
}

async function sendOrderToCustomer(order) {
  if (!order?.telegram_user_id) return;
  try {
    const resp = await fetch('/api/send-to-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id })
    });
    const result = await resp.json();
    if (!result.success) console.warn('Send details failed:', result.error);
  } catch (e) {
    console.warn('Send details failed:', e);
  }
}

function orderDetailText(order, orderItems) {
  const itemsList = (orderItems || []).map(i =>
    `• ${i.item_name} x${i.quantity} — $${(i.quantity * i.unit_price).toFixed(2)}`
  ).join('\n');
  const totalItems = (orderItems || []).reduce((s, i) => s + i.quantity, 0);
  const typeLabel = order.order_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Order';
  return `Order #${order.id?.slice(0, 8)} (${typeLabel})
Customer: ${order.customer_name || 'Guest'}
Phone: ${order.customer_phone || 'N/A'}
Address: ${order.customer_address || 'N/A'}
Status: ${order.status}
Total: $${Number(order.total_amount || 0).toFixed(2)}
Items:
${itemsList}
Total items: ${totalItems}`;
}

function tgDeepLink(order) {
  if (order.telegram_username) return `https://t.me/${order.telegram_username}`;
  if (order.telegram_user_id) return `tg://user?id=${order.telegram_user_id}`;
  return null;
}

async function sendDeliveryToGroup(order, orderItems) {
  const tgLink = order.telegram_username
    ? `<a href="https://t.me/${order.telegram_username}">@${order.telegram_username}</a>`
    : order.telegram_first_name
      ? `<a href="tg://user?id=${order.telegram_user_id}">${order.telegram_first_name}</a>`
      : 'N/A';

  const itemsList = (orderItems || []).map(i =>
    `┃ ${i.item_name} x${i.quantity} — $${(i.quantity * i.unit_price).toFixed(2)}`
  ).join('\n');

  const totalItems = (orderItems || []).reduce((s, i) => s + i.quantity, 0);
  const locLine = order.customer_lat && order.customer_lng
    ? `\n┃ 📌 <b>Location:</b> Shared via GPS` : '';

  const text = `🛵 <b>New Delivery Order #${order.id?.slice(0, 8)}</b>\n\n┏━━━━━━━━━━━━━━━━━━┓\n┃ 📧 <b>Customer Telegram:</b> ${tgLink}\n┃ 👤 <b>Customer Name:</b> ${order.customer_name}\n┃ 📍 <b>Address:</b> ${order.customer_address || 'N/A'}\n┃ 📞 <b>Phone:</b> ${order.customer_phone || 'N/A'}\n┃ 📝 <b>Note:</b> ${order.customer_note || 'None'}${locLine}\n┃\n${itemsList}\n┃\n┃ 📦 <b>${totalItems} items</b> — 💰 <b>$${Number(order.total_amount || 0).toFixed(2)}</b>\n┗━━━━━━━━━━━━━━━━━━┛`;

  const buttons = [[{ text: '🚴 Take Order', callback_data: `take_order_${order.id}` }]];
  if (order.customer_lat && order.customer_lng) {
    buttons[0].push({ text: '📍 Show Map', url: `https://maps.google.com/maps?q=${order.customer_lat},${order.customer_lng}` });
  }

  try {
    await fetch(`https://api.telegram.org/bot${DELIVERY_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: DELIVERY_GROUP_ID, text, parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } })
    });
  } catch (e) {
    console.warn('Failed to send delivery to Telegram group:', e);
  }
}

function parseCoord(order) {
  const lat = order.latitude || order.location_lat || order.customer_lat;
  const lng = order.longitude || order.location_lng || order.customer_lng;
  if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) };
  const addr = order.customer_address || order.location || '';
  const m = addr.match(/(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

function reverseGeocode(lat, lng) {
  return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
    { headers: { 'User-Agent': 'OYSTERHOUSE-AdminPanel/1.0' } })
    .then(r => r.json()).then(d => d.display_name || null).catch(() => null);
}

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function elapsedMin(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

export default function OrdersManager({ refreshKey, initialFilter, onFilterClear }) {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [typeTab, setTypeTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [locationName, setLocationName] = useState(null);
  const [riders, setRiders] = useState([]);
  const [compact, setCompact] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.from('delivery_staff').select('id,name,phone').eq('is_active', true).then(({ data }) => setRiders(data || []));
  }, []);
  useEffect(() => { setActiveFilter(initialFilter); }, [initialFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
      if (activeFilter?.status) q = q.eq('status', activeFilter.status);
      if (activeFilter?.date === 'today') { const t = new Date().toISOString().split('T')[0]; q = q.gte('created_at', t).lt('created_at', t + 'T23:59:59'); }
      if (activeFilter?.month) {
        const m = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(activeFilter.month);
        if (m >= 0) { const y = new Date().getFullYear(); q = q.gte('created_at', `${y}-${String(m+1).padStart(2,'0')}-01`).lte('created_at', new Date(y,m+1,0).toISOString().split('T')[0]+'T23:59:59'); }
      }
      if (dateFilter) q = q.gte('created_at', dateFilter).lt('created_at', dateFilter + 'T23:59:59');
      if (typeTab !== 'all') q = q.eq('order_type', typeTab);
      const { data } = await q;
      setOrders(data || []);
    } catch (e) { console.error('Fetch failed:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [refreshKey, activeFilter, typeTab, dateFilter]);

  const fetchItems = async (orderId) => {
    try { const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId); if (data) setItems(p => ({ ...p, [orderId]: data })); }
    catch (e) { console.error('Items failed:', e); }
  };

  const fetchProfilePhoto = async (tgId) => {
    if (!tgId) return;
    try {
      const res = await fetch(`https://api.telegram.org/bot${DELIVERY_BOT_TOKEN}/getUserProfilePhotos?user_id=${tgId}&limit=1`);
      const data = await res.json();
      if (data.ok && data.result.photos.length > 0) {
        const sizes = data.result.photos[0];
        const best = sizes[sizes.length - 1];
        const fileRes = await fetch(`https://api.telegram.org/bot${DELIVERY_BOT_TOKEN}/getFile?file_id=${best.file_id}`);
        const fileData = await fileRes.json();
        if (fileData.ok) {
          setProfilePhoto(`https://api.telegram.org/file/bot${DELIVERY_BOT_TOKEN}/${fileData.result.file_path}`);
        }
      }
    } catch (e) {}
  };

  const handleDetail = async (o) => { setDetail(o); setProfilePhoto(null); setLocationName(null); if (!items[o.id]) await fetchItems(o.id); const c = parseCoord(o); if (c) reverseGeocode(c.lat, c.lng).then(setLocationName); if (o.telegram_user_id) fetchProfilePhoto(o.telegram_user_id); };

  const handleStatus = async (id, st) => { 
    try { 
      const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      await supabase.from('orders').update({ status: st }).eq('id', id);

      // When delivery order is confirmed by admin — send to Telegram group for drivers
      if (st === 'confirmed' && order?.order_type === 'delivery') {
        const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', id);
        sendDeliveryToGroup(order, orderItems || []);
      }
      
      // Send push notification when order is cancelled
      if (st === 'cancelled' && order) {
        await sendEventNotification('order_cancelled', formatOrderCancelled(order));
      }
    } catch (e) {} 
    fetchOrders(); 
    setDetail(null); 
  };

  const assignRider = async (oid, rn) => { await supabase.from('orders').update({ assigned_driver_name: rn || null }).eq('id', oid); setDetail(p => p ? { ...p, assigned_driver_name: rn || null } : null); fetchOrders(); };

  const grouped = {};
  STATUSES.forEach(s => { grouped[s] = []; });
  orders.forEach(o => { if (grouped[o.status]) grouped[o.status].push(o); });

  const detailItems = items[detail?.id] || [];
  const detailTotal = detailItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const liveCount = grouped.pending.length + grouped.confirmed.length + grouped.delivering.length + grouped.dining.length;

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading orders…</div>;

  return (
    <div className="space-y-3 -mx-4 sm:-mx-6 lg:mx-0">

      {/* HEADER */}
      <div className="px-4 sm:px-6 lg:px-0 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-800">Orders</h3>
          <span className="text-xs font-mono text-slate-400 bg-slate-100 rounded-lg px-2 py-0.5">{orders.length} total</span>
          {liveCount > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-50 rounded-lg px-2 py-0.5 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" />{liveCount} active</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {[{k:'all',l:'All'},{k:'dine_in',l:'Dine-in'},{k:'takeaway',l:'Takeaway'},{k:'pickup',l:'Pickup'},{k:'delivery',l:'Delivery'}].map(t => (
              <button key={t.k} onClick={() => setTypeTab(t.k)} className={cn('px-3 py-1 rounded-md text-[11px] font-semibold transition-all', typeTab === t.k ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700')}>{t.l}</button>
            ))}
          </div>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 w-[130px]" />
          <button onClick={() => setCompact(!compact)} className={cn('rounded-lg border px-2.5 py-1 text-[11px] transition-all', compact ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500')}>Compact</button>
          <button onClick={fetchOrders} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {/* MAIN LAYOUT: Horizontal scrolling lanes */}
      <div className="px-4 sm:px-6 lg:px-0 flex gap-2.5 overflow-x-auto hide-scrollbar">
        {STATUSES.map(st => {
          const cfg = STATUS_CFG[st];
          const cols = grouped[st] || [];
          return (
            <div key={st} className="flex-shrink-0 w-[300px] sm:w-[340px] flex flex-col">
              {/* Lane header */}
              <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl" style={{ borderLeft: `3px solid ${cfg.color}`, backgroundColor: cfg.color + '0a' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: cfg.color + '18', color: cfg.color }}>{cols.length}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {cols.length === 0 ? (
                  <div className="flex items-center justify-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">empty</span>
                  </div>
                ) : cols.map(o => {
                  const mins = elapsedMin(o.created_at);
                  const urgent = st === 'pending' && mins > 15;
                  return (
                    <div key={o.id} onClick={() => handleDetail(o)}
                      className={cn(
                        'group rounded-xl border p-3 cursor-pointer transition-all duration-200',
                        'hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5',
                        urgent ? 'border-amber-300 bg-amber-50/60 animate-pulse' : cfg.glow
                      )}>
                      {/* Row 1: Name + Time */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{o.customer_name || 'Guest'}</span>
                        <span className={cn('text-[10px] font-mono', mins > 20 ? 'text-red-400 font-bold' : 'text-slate-400')}>{timeAgo(o.created_at)}</span>
                      </div>

                      {/* Row 2: Order type + ID */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                          o.order_type === 'delivery' ? 'bg-cyan-100 text-cyan-600' :
                          o.order_type === 'dine_in' ? 'bg-emerald-100 text-emerald-600' :
                          o.order_type === 'takeaway' ? 'bg-amber-100 text-amber-600' :
                          'bg-orange-100 text-orange-600')}>
                          {o.order_type === 'delivery' ? <><Truck className="h-2.5 w-2.5 inline mr-0.5" />delivery</> :
                           o.order_type === 'dine_in' ? <><Store className="h-2.5 w-2.5 inline mr-0.5" />dine-in</> :
                           o.order_type === 'takeaway' ? <>🥡 takeaway</> :
                           <>🏪 pickup</>}
                        </span>
                        <span className="text-[9px] text-slate-300 font-mono">#{o.id?.slice(0, 6)}</span>
                      </div>

                      {/* Row 3: Phone + Address snippet */}
                      {(o.customer_phone || o.customer_address) && (
                        <p className="text-[10px] text-slate-400 truncate mb-1">
                          {o.customer_phone && <><Phone className="h-2.5 w-2.5 inline mr-0.5" />{o.customer_phone} </>}
                          {o.customer_address?.slice(0, 30)}
                        </p>
                      )}

                      {/* Row 4: Total + Rider */}
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-indigo-600">{formatCurrency(o.total_amount)}</span>
                        {o.assigned_driver_name ? (
                          <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <Bike className="h-2.5 w-2.5" />{o.assigned_driver_name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300">unassigned</span>
                        )}
                      </div>

                      {/* Quick actions on hover */}
                      <div className="mt-2 pt-2 border-t border-slate-100 hidden group-hover:flex items-center gap-1 flex-wrap">
                        {getVisibleActions(o.status).map(s => (
                          <button key={s} onClick={e => { e.stopPropagation(); handleStatus(o.id, s); }}
                            className="text-[9px] font-bold uppercase px-2 py-1 rounded-md border transition-all hover:scale-[1.02]"
                            style={{ borderColor: STATUS_CFG[s].color + '50', color: STATUS_CFG[s].color }}>
                            {STATUS_CFG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL PANEL - slide from right */}
      {detail && (
        <>
          <div className="fixed inset-0 bg-black/15 z-40" onClick={() => setDetail(null)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-5 py-3.5 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: STATUS_CFG[detail.status]?.color + '14', color: STATUS_CFG[detail.status]?.color }}>{detail.status}</span>
                    <span className="text-[10px] text-slate-400 font-mono">#{detail.id?.slice(0, 8)}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">{detail.customer_name || 'Guest'}</h2>
                  {tgDeepLink(detail) && (
                    <div className="mt-2 flex items-start gap-3">
                      {profilePhoto && (
                        <img src={profilePhoto} alt=""
                          className="w-40 h-40 rounded-full border border-slate-200 object-cover flex-shrink-0"
                        />
                      )}
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tgDeepLink(detail))}`}
                        alt="Telegram QR"
                        className="rounded-xl border border-slate-200 flex-shrink-0"
                        style={{ width: 160, height: 160 }}
                      />
                    </div>
                  )}
                </div>
                <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Panel body */}
            <div className="px-5 py-4 space-y-5">

              {/* Contact via Telegram — matching Customers profile style */}
              <div className="rounded-xl bg-slate-50 p-3 space-y-3 text-sm">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Contact via Telegram</p>
                {detail.telegram_user_id || detail.telegram_username ? (
                  <>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-12 h-12 rounded-full bg-[#2AABEE]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="h-5 w-5 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">{detail.customer_name || 'Guest'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {detail.telegram_user_id ? `ID: ${detail.telegram_user_id}` : ''}
                          {detail.telegram_username ? ` · @${detail.telegram_username}` : ''}
                        </p>
                        {detail.customer_phone && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{detail.customer_phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {detail.telegram_user_id && (
                        <a href={`tg://user?id=${detail.telegram_user_id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#2AABEE] text-white px-3 py-2 text-xs font-semibold hover:bg-[#2291d9] shadow-sm shadow-blue-200">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                          Chat on Telegram
                        </a>
                      )}
                      {detail.telegram_username && !detail.telegram_user_id && (
                        <a href={`https://t.me/${detail.telegram_username}`}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#2AABEE] text-white px-3 py-2 text-xs font-semibold hover:bg-[#2291d9] shadow-sm shadow-blue-200">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                          Message
                        </a>
                      )}
                      <button onClick={() => { navigator.clipboard.writeText(orderDetailText(detail, detailItems)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                        <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy Order Info'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{detail.customer_name || 'Guest'}</p>
                      <p className="text-[10px] text-slate-400">No Telegram linked</p>
                      {detail.customer_phone && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{detail.customer_phone}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div className="rounded-xl bg-slate-50 p-3 space-y-2 text-sm">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Order Info</p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Type</span>
                  <span className="font-semibold capitalize flex items-center gap-1">
                    {detail.order_type === 'delivery' ? <><Truck className="h-3 w-3 text-cyan-500" /> delivery</> :
                     detail.order_type === 'dine_in' ? <><Store className="h-3 w-3 text-emerald-500" /> dine-in</> :
                     detail.order_type === 'takeaway' ? <>🥡 takeaway</> :
                     <>🏪 pickup</>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Time</span>
                  <span className="font-medium text-xs">{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</span>
                </div>
                {detail.customer_address && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 text-xs flex-shrink-0">Address</span>
                    <span className="font-medium text-xs text-right">{detail.customer_address}</span>
                  </div>
                )}
                {detail.customer_note && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 text-xs flex-shrink-0">Note</span>
                    <span className="text-xs text-slate-500 italic text-right">{detail.customer_note}</span>
                  </div>
                )}
              </div>

              {/* Rider */}
              {detail.order_type === 'delivery' && (
                <div className="rounded-xl bg-slate-50 p-3 space-y-2 text-sm">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Rider</p>
                  {(detail.status === 'delivering' || detail.status === 'confirmed') ? (
                    <select value={detail.assigned_driver_name || ''} onChange={e => assignRider(detail.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="">Select rider…</option>
                      {riders.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Bike className="h-3.5 w-3.5 text-cyan-500" />{detail.assigned_driver_name || 'Unassigned'}
                    </span>
                  )}
                </div>
              )}

              {/* Map */}
              {detail.order_type === 'delivery' && (() => {
                const coord = parseCoord(detail);
                if (!coord) return null;
                const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coord.lng-0.005},${coord.lat-0.005},${coord.lng+0.005},${coord.lat+0.005}&layer=mapnik&marker=${coord.lat},${coord.lng}`;
                return (
                  <div className="rounded-xl bg-slate-50 p-3 space-y-2 text-sm">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" />Location</p>
                    {locationName && <p className="text-xs text-slate-600">{locationName}</p>}
                    <div className="rounded-xl overflow-hidden border border-slate-200"><iframe src={mapUrl} width="100%" height="140" style={{border:0}} loading="lazy" title="Location" /></div>
                  </div>
                );
              })()}

              {/* Items */}
              <div className="rounded-xl bg-slate-50 p-3 space-y-2 text-sm">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Items · {detailItems.length}</p>
                {detailItems.map(i => (
                  <div key={i.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2"><span className="text-xs font-bold text-indigo-500 font-mono">{i.quantity}×</span><span className="font-medium text-slate-700">{i.item_name}</span></div>
                    <span className="font-semibold text-xs">{formatCurrency(i.quantity * i.unit_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-5 py-3.5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                <span className="text-xl font-bold text-indigo-600">{formatCurrency(detailTotal)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {getVisibleActions(detail.status).map(s => {
                  const sc = STATUS_CFG[s];
                  return (
                    <button key={s} onClick={() => handleStatus(detail.id, s)}
                      className="flex-1 min-w-[80px] rounded-lg border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1"
                      style={{ borderColor: sc.color, color: sc.color, backgroundColor: sc.color + '06' }}>
                      <ArrowRight className="h-3 w-3" />{sc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
