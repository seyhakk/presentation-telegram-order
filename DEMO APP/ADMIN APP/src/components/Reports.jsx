import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/format';
import { Download, RotateCcw, Sun, Moon, Filter, X, ArrowRight, Truck, Store, ExternalLink, MapPin, Loader2, Send, FileText } from 'lucide-react';

// Teal/warm palette matching the reference design
function parseCoord(order) {
  const lat = order.latitude || order.location_lat || order.customer_lat;
  const lng = order.longitude || order.location_lng || order.customer_lng;
  if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) };
  const addr = order.customer_address || order.location || '';
  const match = addr.match(/(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)/);
  if (match) return { lat: Number(match[1]), lng: Number(match[2]) };
  return null;
}

function reverseGeocode(lat, lng) {
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
    { headers: { 'User-Agent': 'OYSTERHOUSE-AdminPanel/1.0' } }
  )
    .then(r => r.json())
    .then(data => data.display_name || null)
    .catch(() => null);
}

const BRAND = '#0b6b70';
const BRAND2 = '#5b9ea7';

function exportCSV(data, columns, filename) {
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => {
    const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
    if (val == null) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
  }).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(title, data, columns, filename) {
  const win = window.open('', '_blank');
  const rows = data.map(row => columns.map(c => {
    const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
    return val != null ? String(val) : '';
  }));
  const headers = columns.map(c => c.label);
  const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  const bodyRows = rows.map(r => `<tr>${r.map((c, i) => `<td class="${typeof r[i] === 'number' ? 'num' : ''}">${c}</td>`).join('')}</tr>`).join('');
  const totals = rows.length > 0 ? `<tr class="total"><td colspan="${columns.length}">${rows.length} rows · ${new Date().toLocaleString()}</td></tr>` : '';
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:'Inter',-apple-system,sans-serif;padding:32px;color:#1e293b;max-width:960px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px;color:#0f172a}p.sub{color:#64748b;margin:0 0 20px;font-size:13px}
table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f1f5f9;padding:10px 12px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700}
td{padding:9px 12px;border-bottom:1px solid #f1f5f9}td.num{text-align:right;font-variant-numeric:tabular-nums}
tr:nth-child(even){background:#f8fafc}tr.total td{font-weight:700;background:#f1f5f9;border-top:2px solid #e2e8f0}</style></head><body>
<h1>${title}</h1><p class="sub">Generated ${new Date().toLocaleString()}</p>
<table><thead>${headerRow}</thead><tbody>${bodyRows}${totals}</tbody></table></body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 600);
}

async function sendToTelegram(text) {
  const stored = localStorage.getItem('admin_user');
  const user = stored ? JSON.parse(stored) : null;
  const tgId = user?.telegram_user_id;
  if (!tgId) { alert('Please link your Telegram in Profile first!'); return; }
  try {
    const res = await fetch('/api/send-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgId, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    if (data.success) alert('Report sent to your Telegram!');
    else alert('Failed: ' + (data.error || 'Error'));
  } catch (e) { alert('Error: ' + e.message); }
}

function ReportActions({ title, data, columns, filename, telegramText }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <button className="rp-btn" onClick={() => exportCSV(data, columns, filename)}><Download size={14} /> CSV</button>
      <button className="rp-btn" onClick={() => exportPDF(title, data, columns, filename)}><FileText size={14} /> PDF</button>
      <button className="rp-btn" onClick={() => sendToTelegram(telegramText)}><Send size={14} /> Telegram</button>
    </div>
  );
}

export default function Reports() {
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters — default to yesterday
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [customerFilter, setCustomerFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [appliedKey, setAppliedKey] = useState(1);
  const [detail, setDetail] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLocation, setDetailLocation] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [collapsed, setCollapsed] = useState(new Set());

  const toggleCollapse = (id) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-report-theme', theme);
  }, [theme]);

  const openDetail = async (o) => {
    setDetail(o);
    setDetailItems([]);
    setDetailLocation(null);
    setDetailLoading(true);
    const { data } = await supabase.from('order_items').select('*').eq('order_id', o.id);
    setDetailItems(data || []);
    setDetailLoading(false);
    const coord = parseCoord(o);
    if (coord) reverseGeocode(coord.lat, coord.lng).then(setDetailLocation);
  };

  const handleStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setDetail(prev => prev ? { ...prev, status } : null);
    setAppliedKey(k => k + 1);
  };

  const STATUS_CFG = {
    pending: { label: 'Pending', color: '#f59e0b', bg: 'bg-amber-50 text-amber-600' },
    confirmed: { label: 'Confirmed', color: '#3b82f6', bg: 'bg-blue-50 text-blue-600' },
    delivering: { label: 'Delivering', color: '#06b6d4', bg: 'bg-cyan-50 text-cyan-600' },
    dining: { label: 'Dining', color: '#8b5cf6', bg: 'bg-purple-50 text-purple-600' },
    completed: { label: 'Completed', color: '#22c55e', bg: 'bg-accent-50 text-accent-600' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'bg-red-50 text-red-500' },
  };
  const ALL_STATUSES = ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'];
  const HIDDEN_BUTTONS = {
    pending: ['delivering', 'completed'],
    confirmed: ['pending', 'completed'],
    delivering: ['pending', 'confirmed', 'completed'],
    completed: ALL_STATUSES,
    cancelled: ALL_STATUSES,
  };
  const getVisibleActions = (s) => ALL_STATUSES.filter(st => st !== s && !(HIDDEN_BUTTONS[s] || []).includes(st));

  const getDateRange = () => ({
    from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    to: dateTo ? new Date(dateTo + 'T23:59:59.999').toISOString() : undefined,
  });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const range = getDateRange();
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500);
      if (range.from) query = query.gte('created_at', range.from);
      if (range.to) query = query.lte('created_at', range.to);
      if (orderTypeFilter !== 'all') query = query.eq('order_type', orderTypeFilter);
      const { data: orderData, error: err } = await query;
      if (err) throw err;
      setOrders(orderData || []);

      const { data: itemData } = await supabase.from('order_items').select('*');
      setAllItems(itemData || []);

      const { data: catData } = await supabase.from('menu_categories').select('*').order('display_order');
      setCategories(catData || []);

      const { data: menuData } = await supabase.from('menu_items').select('name,cost_price,price_pickup,category_id');
      setMenuItems(menuData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (appliedKey > 0) fetchAll(); }, [appliedKey]);

  // Derived data
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (customerFilter !== 'all') result = result.filter(o => o.customer_name === customerFilter);
    return result;
  }, [orders, customerFilter]);

  const filteredItems = useMemo(() => {
    let result = allItems;
    const orderIds = new Set(filteredOrders.map(o => o.id));
    result = result.filter(i => orderIds.has(i.order_id));
    if (itemFilter !== 'all') result = result.filter(i => i.item_name === itemFilter);
    if (categoryFilter !== 'all') {
      const catItems = menuItemsByCat[categoryFilter] || [];
      const catItemNames = new Set(catItems);
      result = result.filter(i => catItemNames.has(i.item_name));
    }
    return result;
  }, [allItems, filteredOrders, itemFilter, categoryFilter]);

  // Category → item names mapping
  const [menuItemsByCat, setMenuItemsByCat] = useState({});
  useEffect(() => {
    supabase.from('menu_items').select('name,category_id').then(({ data }) => {
      const map = {};
      (data || []).forEach(i => { if (!map[i.category_id]) map[i.category_id] = []; map[i.category_id].push(i.name); });
      setMenuItemsByCat(map);
    });
  }, []);

  // Stats
  const stats = useMemo(() => {
    const rev = filteredOrders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const cnt = filteredOrders.length;
    const units = filteredItems.reduce((s, i) => s + (i.quantity || 0), 0);
    return { revenue: rev, orders: cnt, aov: cnt > 0 ? rev / cnt : 0, itemsSold: units };
  }, [filteredOrders, filteredItems]);

  // Top items
  const topItems = useMemo(() => {
    const map = {};
    filteredItems.forEach(i => {
      const k = i.item_name || 'Unknown';
      if (!map[k]) map[k] = { name: k, units: 0, revenue: 0, orders: new Set() };
      map[k].units += i.quantity || 0;
      map[k].revenue += (i.quantity || 0) * (parseFloat(i.unit_price) || 0);
      map[k].orders.add(i.order_id);
    });
    return Object.values(map).map(v => ({ ...v, orders: v.orders.size })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredItems]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { completed: 0, preparing: 0, pending: 0, confirmed: 0, delivering: 0, cancelled: 0 };
    filteredOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [filteredOrders]);

  // Order type counts
  const orderTypeCounts = useMemo(() => {
    const counts = {};
    filteredOrders.forEach(o => { const t = o.order_type || 'unknown'; counts[t] = (counts[t] || 0) + 1; });
    return counts;
  }, [filteredOrders]);

  // Daily summary (single day)
  const dailySummary = useMemo(() => {
    if (!dateFrom || !dateTo || dateFrom !== dateTo) return null;
    const deliveryRevenue = filteredOrders.filter(o => o.order_type === 'delivery').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const pickupRevenue = filteredOrders.filter(o => o.order_type === 'dine_in').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const completed = filteredOrders.filter(o => o.status === 'completed').length;
    const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length;
    const cancelledRevenue = filteredOrders.filter(o => o.status === 'cancelled').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const pending = filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'delivering').length;
    const deliveryCount = filteredOrders.filter(o => o.order_type === 'delivery').length;
    const pickupCount = filteredOrders.filter(o => o.order_type === 'dine_in').length;
    return { deliveryRevenue, pickupRevenue, completed, cancelled, cancelledRevenue, pending, deliveryCount, pickupCount };
  }, [filteredOrders, dateFrom, dateTo]);

  // Multi-day trends
  const dailyTrends = useMemo(() => {
    if (!dateFrom || !dateTo || dateFrom === dateTo) return null;
    const map = {};
    filteredOrders.forEach(o => {
      const d = o.created_at ? o.created_at.split('T')[0] : 'Unknown';
      if (!map[d]) map[d] = { date: d, orders: 0, revenue: 0, delivery: 0, pickup: 0, deliveryRev: 0, pickupRev: 0 };
      map[d].orders++;
      map[d].revenue += parseFloat(o.total_amount) || 0;
      if (o.order_type === 'delivery') { map[d].delivery++; map[d].deliveryRev += parseFloat(o.total_amount) || 0; }
      else if (o.order_type === 'dine_in') { map[d].pickup++; map[d].pickupRev += parseFloat(o.total_amount) || 0; }
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders, dateFrom, dateTo]);
  const customers = useMemo(() => [...new Set(orders.map(o => o.customer_name).filter(Boolean))], [orders]);
  const itemNames = useMemo(() => [...new Set(allItems.map(i => i.item_name).filter(Boolean))].sort(), [allItems]);

  // 1. P&L by Item
  const itemPL = useMemo(() => {
    const costMap = {};
    menuItems.forEach(mi => { if (mi.cost_price) costMap[mi.name] = parseFloat(mi.cost_price); });
    const map = {};
    filteredItems.forEach(i => {
      const name = i.item_name || 'Unknown';
      if (!map[name]) map[name] = { name, units: 0, revenue: 0, cost: 0 };
      map[name].units += i.quantity || 0;
      map[name].revenue += (i.quantity || 0) * (parseFloat(i.unit_price) || 0);
      map[name].cost += (i.quantity || 0) * (costMap[name] || 0);
    });
    return Object.values(map).map(v => ({ ...v, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue * 100) : 0 })).sort((a, b) => b.profit - a.profit);
  }, [filteredItems, menuItems]);

  // 2. Hourly Sales
  const hourlySales = useMemo(() => {
    const hours = {};
    for (let h = 0; h < 24; h++) hours[h] = { hour: h, orders: 0, revenue: 0 };
    filteredOrders.forEach(o => {
      if (!o.created_at) return;
      const h = new Date(o.created_at).getHours();
      hours[h].orders++;
      hours[h].revenue += parseFloat(o.total_amount) || 0;
    });
    return Object.values(hours);
  }, [filteredOrders]);

  // 3. Customer Lifetime
  const customerLTV = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const name = o.customer_name || 'Guest';
      if (!map[name]) map[name] = { name, orders: 0, revenue: 0, first: o.created_at, last: o.created_at };
      map[name].orders++;
      map[name].revenue += parseFloat(o.total_amount) || 0;
      if (o.created_at < map[name].first) map[name].first = o.created_at;
      if (o.created_at > map[name].last) map[name].last = o.created_at;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // 4. Category Performance
  const categoryPerf = useMemo(() => {
    const itemToCat = {};
    menuItems.forEach(mi => { if (mi.category_id) itemToCat[mi.name] = mi.category_id; });
    const catNames = {};
    categories.forEach(c => { catNames[c.id] = c.name; });
    const map = {};
    filteredItems.forEach(i => {
      const catId = itemToCat[i.item_name];
      const catName = catNames[catId] || 'Uncategorized';
      if (!map[catName]) map[catName] = { name: catName, units: 0, revenue: 0 };
      map[catName].units += i.quantity || 0;
      map[catName].revenue += (i.quantity || 0) * (parseFloat(i.unit_price) || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredItems, menuItems, categories]);

  // 5. Order Fulfillment Time
  const fulfillmentTime = useMemo(() => {
    const times = [];
    filteredOrders.forEach(o => {
      if (o.created_at && o.updated_at && o.status === 'completed') {
        const diff = (new Date(o.updated_at) - new Date(o.created_at)) / 60000;
        if (diff > 0 && diff < 1440) times.push(diff);
      }
    });
    const avg = times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 0;
    const max = times.length > 0 ? Math.max(...times) : 0;
    const min = times.length > 0 ? Math.min(...times) : 0;
    return { avg: Math.round(avg), max: Math.round(max), min: Math.round(min), count: times.length, all: times };
  }, [filteredOrders]);

  const [fulfillmentBin, setFulfillmentBin] = useState(null);
  useEffect(() => {
    if (fulfillmentTime.count > 0) {
      const bins = { '<15m': 0, '15-30m': 0, '30-60m': 0, '1-2h': 0, '2h+': 0 };
      fulfillmentTime.all.forEach(t => {
        if (t < 15) bins['<15m']++;
        else if (t < 30) bins['15-30m']++;
        else if (t < 60) bins['30-60m']++;
        else if (t < 120) bins['1-2h']++;
        else bins['2h+']++;
      });
      setFulfillmentBin(bins);
    }
  }, [fulfillmentTime]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (dateFrom || dateTo) chips.push(`Date: ${dateFrom || 'Any'} → ${dateTo || 'Any'}`);
    if (customerFilter !== 'all') chips.push(`Customer: ${customerFilter}`);
    if (categoryFilter !== 'all') {
      const cat = categories.find(c => c.id === categoryFilter);
      chips.push(`Category: ${cat?.name || categoryFilter}`);
    }
    if (itemFilter !== 'all') chips.push(`Item: ${itemFilter}`);
    if (orderTypeFilter !== 'all') chips.push(`Type: ${orderTypeFilter}`);
    return chips;
  }, [dateFrom, dateTo, customerFilter, categoryFilter, itemFilter, orderTypeFilter, categories]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--muted)' }}>Loading report…</div>
  );

  return (
    <div className="reports-root">
      <style>{`
        .reports-root {
          --bg: #f7f6f2; --card: #ffffff; --card2: #fafaf7; --text: #23211c; --muted: #6f6b62;
          --border: #ddd8cf; --brand: ${BRAND}; --brand2: ${BRAND2}; --radius: 18px; --radius-sm: 12px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text);
        }
        [data-report-theme='dark'] .reports-root {
          --bg: #171614; --card: #1d1c1a; --card2: #232220; --text: #e6e2dc; --muted: #a8a298; --border: #36332e;
        }
        .reports-root .rp-grid { display: grid; gap: 20px; }
        .reports-root .rp-grid-2 { grid-template-columns: 1.25fr 0.95fr; }
        .reports-root .rp-panel { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
        .reports-root .rp-section-title { margin: 0 0 6px; font-size: 20px; color: var(--text); }
        .reports-root .rp-subtle { margin: 0 0 14px; color: var(--muted); font-size: 14px; }
        .reports-root .rp-btn { border: 1px solid var(--border); background: var(--card); color: var(--text); padding: 10px 16px; border-radius: 999px; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; transition: background-color 0.15s, border-color 0.15s, transform 0.15s; }
        .reports-root .rp-btn:hover { border-color: var(--brand); color: var(--brand); }
        .reports-root .rp-filter-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .reports-root .rp-field label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 6px; font-weight: 600; }
        .reports-root .rp-field input, .reports-root .rp-field select { width: 100%; padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--card2); color: var(--text); font-size: 14px; outline: none; }
        .reports-root .rp-field input:focus, .reports-root .rp-field select:focus { border-color: var(--brand); }
        .reports-root .rp-chip { background: var(--card2); border: 1px solid var(--border); border-radius: 999px; padding: 7px 12px; font-size: 12px; color: var(--text); display: inline-flex; align-items: center; gap: 6px; }
        .reports-root .rp-chip.active { background: rgba(11,107,112,0.08); border-color: var(--brand); color: var(--brand); }
        .reports-root .rp-chips-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
        .reports-root .rp-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .reports-root .rp-kpi { background: var(--card2); border: 1px solid var(--border); border-radius: 16px; padding: 16px; }
        .reports-root .rp-kpi .rp-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
        .reports-root .rp-kpi .rp-value { font-size: 28px; font-weight: 700; margin-top: 4px; color: var(--text); }
        .reports-root .rp-kpi .rp-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .reports-root .rp-table { width: 100%; border-collapse: collapse; }
        .reports-root .rp-table th, .reports-root .rp-table td { padding: 12px 10px; border-bottom: 1px solid var(--border); text-align: left; }
        .reports-root .rp-table th { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
        .reports-root .rp-table td { font-size: 14px; }
        .reports-root .rp-table tr:last-child td { border-bottom: none; }
        .reports-root .rp-table tr:hover td { background: var(--card2); }
        .reports-root .rp-table .rp-cell-right { text-align: right; }
        .reports-root .rp-status-list { display: grid; gap: 12px; margin-top: 6px; }
        .reports-root .rp-status-row { display: grid; grid-template-columns: 100px 1fr 40px; gap: 12px; align-items: center; }
        .reports-root .rp-status-name { font-size: 13px; color: var(--text); font-weight: 500; }
        .reports-root .rp-status-bar { height: 10px; background: var(--card2); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
        .reports-root .rp-status-bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--brand), var(--brand2)); border-radius: 999px; transition: width 0.5s; }
        .reports-root .rp-status-val { font-size: 14px; font-weight: 700; color: var(--text); text-align: right; }
        .reports-root .rp-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
        .reports-root .rp-tag { background: var(--card2); border: 1px solid var(--border); border-radius: 999px; padding: 7px 12px; font-size: 12px; color: var(--text); }
        @media (max-width: 980px) { .reports-root .rp-filter-grid, .reports-root .rp-grid-2, .reports-root .rp-kpis { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 680px) { .reports-root .rp-filter-grid, .reports-root .rp-grid-2, .reports-root .rp-kpis { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 700 }}>Sales Reports</h1>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Analyze your restaurant performance with real data from Supabase</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="rp-btn" onClick={() => filteredOrders.length > 0 && exportCSV(filteredOrders, [{ label: 'Order #', accessor: o => o.id?.slice(0,8) }, { label: 'Customer', accessor: 'customer_name' }, { label: 'Total', accessor: o => formatCurrency(o.total_amount) }, { label: 'Status', accessor: 'status' }, { label: 'Date', accessor: o => o.created_at ? new Date(o.created_at).toLocaleDateString() : '' }], 'sales_report')}>
            <Download  size={16} /> Export
          </button>
          <button className="rp-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun  size={16} /> : <Moon  size={16} />}
          </button>
          <button className="rp-btn" onClick={() => setAppliedKey(k => k + 1)}><RotateCcw  size={16} /> Refresh</button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="rp-panel" style={{ marginBottom: 20 }}>
        <h3 className="rp-section-title">Filters</h3>
        <p className="rp-subtle">Date, customer, menu category, and menu item filters for your dashboard layout.</p>
        <div className="rp-filter-grid">
          <div className="rp-field"><label>Date from</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
          <div className="rp-field"><label>Date to</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          <div className="rp-field">
            <label>Customer</label>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}>
              <option value="all">All customers</option>
              {customers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="rp-field">
            <label>Menu category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="rp-field">
            <label>Menu item</label>
            <select value={itemFilter} onChange={e => setItemFilter(e.target.value)}>
              <option value="all">All menu items</option>
              {itemNames.slice(0, 50).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="rp-field">
            <label>Order type</label>
            <select value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              <option value="dine_in">Dine-in</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button className="rp-btn" onClick={() => setAppliedKey(k => k + 1)} style={{ background: BRAND, color: '#fff', borderColor: BRAND, fontWeight: 600 }}>
            <Filter  size={16} /> Apply Filters
          </button>
          <button className="rp-btn" onClick={() => { setAppliedKey(k => k + 1); }}><RotateCcw  size={16} /> Refresh</button>
        </div>
        <p className="rp-subtle" style={{ marginTop: 12, marginBottom: 0 }}>{appliedKey > 0 ? `This report shows ${filteredOrders.length} orders from ${customers.length} customers across ${categories.length} menu categories.` : 'Select filters above and click Apply to generate report.'}</p>
        <div className="rp-chips-row">
          {activeChips.length === 0 ? (
            <span className="rp-chip">No active filters</span>
          ) : activeChips.map((chip, i) => (
            <span key={i} className="rp-chip active"><Filter  size={12} /> {chip}</span>
          ))}
        </div>
      </div>

      {appliedKey === 0 ? (
        <div className="rp-panel" style={{ marginBottom: 20, textAlign: 'center', padding: '60px 20px' }}>
          <Filter size={48} style={{ color: 'var(--muted)', marginBottom: 16, opacity: 0.3 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--text)' }}>No report data yet</h3>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Set your filters above and click <strong>Apply Filters</strong> to generate the report.</p>
        </div>
      ) : (
        <div>
      {/* Overview KPIs */}
      <div className="rp-panel" style={{ marginBottom: 20 }}>
        <h3 className="rp-section-title">Overview</h3>
        <p className="rp-subtle">Summary for {filteredOrders.length} orders</p>
        <div className="rp-kpis">
          <div className="rp-kpi"><div className="rp-label">Revenue</div><div className="rp-value">{formatCurrency(stats.revenue)}</div></div>
          <div className="rp-kpi"><div className="rp-label">Orders</div><div className="rp-value">{stats.orders}</div></div>
          <div className="rp-kpi"><div className="rp-label">Avg order</div><div className="rp-value">{formatCurrency(stats.aov)}</div></div>
          <div className="rp-kpi"><div className="rp-label">Items sold</div><div className="rp-value">{stats.itemsSold}</div></div>
        </div>
      </div>

      {/* Daily Summary (single day only) */}
      {dailySummary && (
        <div className="rp-panel" style={{ marginBottom: 20 }}>
          <h3 className="rp-section-title">Daily Summary — {dateFrom}</h3>
          <div className="rp-kpis" style={{ marginBottom: 20 }}>
            <div className="rp-kpi"><div className="rp-label">Completed</div><div className="rp-value" style={{ color: '#22c55e' }}>{dailySummary.completed}</div></div>
            <div className="rp-kpi"><div className="rp-label">Pending</div><div className="rp-value" style={{ color: '#f59e0b' }}>{dailySummary.pending}</div></div>
            <div className="rp-kpi"><div className="rp-label">Cancelled</div><div className="rp-value" style={{ color: '#ef4444' }}>{dailySummary.cancelled}</div><div className="rp-sub">{formatCurrency(dailySummary.cancelledRevenue)} voided</div></div>
            <div className="rp-kpi"><div className="rp-label">Avg Order</div><div className="rp-value">{formatCurrency(stats.aov)}</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            <div style={{ background: 'var(--card2)', borderRadius: 16, padding: 16, border: '1px solid var(--border)' }}>
              <div className="rp-label" style={{ marginBottom: 12 }}>Revenue Split</div>
              <div className="rp-status-row" style={{ marginBottom: 8 }}><div className="rp-status-name" style={{ color: '#06b6d4' }}>Delivery</div><div className="rp-status-bar"><span style={{ width: `${stats.revenue > 0 ? (dailySummary.deliveryRevenue / stats.revenue) * 100 : 0}%`, background: 'linear-gradient(90deg, #06b6d4, #06b6d488)' }} /></div><div className="rp-status-val">{formatCurrency(dailySummary.deliveryRevenue)}</div></div>
              <div className="rp-status-row"><div className="rp-status-name" style={{ color: '#22c55e' }}>Dine-in</div><div className="rp-status-bar"><span style={{ width: `${stats.revenue > 0 ? (dailySummary.pickupRevenue / stats.revenue) * 100 : 0}%`, background: 'linear-gradient(90deg, #22c55e, #22c55e88)' }} /></div><div className="rp-status-val">{formatCurrency(dailySummary.pickupRevenue)}</div></div>
            </div>
            <div style={{ background: 'var(--card2)', borderRadius: 16, padding: 16, border: '1px solid var(--border)' }}>
              <div className="rp-label" style={{ marginBottom: 12 }}>Order Split</div>
              <div className="rp-status-row" style={{ marginBottom: 8 }}><div className="rp-status-name" style={{ color: '#06b6d4' }}>Delivery</div><div className="rp-status-bar"><span style={{ width: `${stats.orders > 0 ? (dailySummary.deliveryCount / stats.orders) * 100 : 0}%`, background: 'linear-gradient(90deg, #06b6d4, #06b6d488)' }} /></div><div className="rp-status-val">{dailySummary.deliveryCount}</div></div>
              <div className="rp-status-row"><div className="rp-status-name" style={{ color: '#22c55e' }}>Dine-in</div><div className="rp-status-bar"><span style={{ width: `${stats.orders > 0 ? (dailySummary.pickupCount / stats.orders) * 100 : 0}%`, background: 'linear-gradient(90deg, #22c55e, #22c55e88)' }} /></div><div className="rp-status-val">{dailySummary.pickupCount}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-day Trends (date range only) */}
      {dailyTrends && dailyTrends.length > 0 && (
        <div className="rp-panel" style={{ marginBottom: 20 }}>
          <h3 className="rp-section-title">Daily Breakdown — {dailyTrends.length} days</h3>
          <p className="rp-subtle">{dateFrom} → {dateTo}</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="rp-table" style={{ minWidth: 600 }}>
              <thead><tr><th>Date</th><th className="rp-cell-right">Orders</th><th className="rp-cell-right">Revenue</th><th className="rp-cell-right">Delivery</th><th className="rp-cell-right">Del Rev</th><th className="rp-cell-right">Dine-in</th><th className="rp-cell-right">Din Rev</th></tr></thead>
              <tbody>
                {dailyTrends.map(d => (
                  <tr key={d.date}>
                    <td style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: 13 }}>{d.date}</td>
                    <td className="rp-cell-right" style={{ fontWeight: 600 }}>{d.orders}</td>
                    <td className="rp-cell-right" style={{ fontWeight: 600 }}>{formatCurrency(d.revenue)}</td>
                    <td className="rp-cell-right">{d.delivery}</td>
                    <td className="rp-cell-right" style={{ color: '#06b6d4' }}>{formatCurrency(d.deliveryRev)}</td>
                    <td className="rp-cell-right">{d.pickup}</td>
                    <td className="rp-cell-right" style={{ color: '#22c55e' }}>{formatCurrency(d.pickupRev)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--card2)', fontWeight: 700 }}>
                  <td>Totals</td>
                  <td className="rp-cell-right">{dailyTrends.reduce((s, d) => s + d.orders, 0)}</td>
                  <td className="rp-cell-right">{formatCurrency(dailyTrends.reduce((s, d) => s + d.revenue, 0))}</td>
                  <td className="rp-cell-right">{dailyTrends.reduce((s, d) => s + d.delivery, 0)}</td>
                  <td className="rp-cell-right" style={{ color: '#06b6d4' }}>{formatCurrency(dailyTrends.reduce((s, d) => s + d.deliveryRev, 0))}</td>
                  <td className="rp-cell-right">{dailyTrends.reduce((s, d) => s + d.pickup, 0)}</td>
                  <td className="rp-cell-right" style={{ color: '#22c55e' }}>{formatCurrency(dailyTrends.reduce((s, d) => s + d.pickupRev, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Items + Order Type */}
      <div className="rp-grid rp-grid-2" style={{ marginBottom: 20 }}>
        <div className="rp-panel">
          <h3 className="rp-section-title">Top selling items</h3>
          <table className="rp-table">
            <thead><tr><th>#</th><th>Item</th><th className="rp-cell-right">Units</th><th className="rp-cell-right">Revenue</th><th className="rp-cell-right">Orders</th></tr></thead>
            <tbody>
              {topItems.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No items match the current filters</td></tr>
              ) : topItems.map((item, i) => (
                <tr key={item.name}>
                  <td style={{ fontWeight: 700, color: 'var(--muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td className="rp-cell-right">{item.units}</td>
                  <td className="rp-cell-right" style={{ fontWeight: 600 }}>{formatCurrency(item.revenue)}</td>
                  <td className="rp-cell-right">{item.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rp-panel">
          <h3 className="rp-section-title">Order type</h3>
          <div className="rp-status-list">
            {Object.entries(orderTypeCounts).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
              const pct = stats.orders > 0 ? (count / stats.orders) * 100 : 0;
              const color = type === 'delivery' ? '#3383a8' : type === 'dine_in' ? '#6b9e41' : 'var(--muted)';
              return (
                <div key={type} className="rp-status-row">
                  <div className="rp-status-name" style={{ textTransform: 'capitalize' }}>{type}</div>
                  <div className="rp-status-bar"><span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} /></div>
                  <div className="rp-status-val">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1. P&L by Item */}
      {itemPL.length > 0 && (
      <div className="rp-panel" style={{ cursor: 'pointer' }}>
        <div onClick={() => toggleCollapse('pnl')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="rp-section-title">📋 P&L by Item</h3>
            <p className="rp-subtle">Revenue − Cost = Profit {activeChips.length > 0 && <span style={{ color: '#0b6b70', fontWeight: 600 }}>· Filtered</span>}</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: collapsed.has('pnl') ? '#64748b' : '#3b82f6', border: '1px solid ' + (collapsed.has('pnl') ? '#ddd8cf' : '#3b82f6'), borderRadius: 999, padding: '3px 10px' }}>
            {collapsed.has('pnl') ? 'Show ▾' : 'Hide ▸'}
          </span>
        </div>
        {!collapsed.has('pnl') && (<div>
        <div style={{ overflowX: 'auto' }}>
          <table className="rp-table" style={{ minWidth: 500 }}>
            <thead><tr><th>Item</th><th className="rp-cell-right">Units</th><th className="rp-cell-right">Revenue</th><th className="rp-cell-right">Cost</th><th className="rp-cell-right">Profit</th><th className="rp-cell-right">Margin</th></tr></thead>
            <tbody>
              {itemPL.slice(0, 20).map(i => (
                <tr key={i.name}>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td className="rp-cell-right">{i.units}</td>
                  <td className="rp-cell-right">{formatCurrency(i.revenue)}</td>
                  <td className="rp-cell-right">{formatCurrency(i.cost)}</td>
                  <td className="rp-cell-right" style={{ fontWeight: 700, color: i.profit >= 0 ? '#22c55e' : '#ef4444' }}>{formatCurrency(i.profit)}</td>
                  <td className="rp-cell-right" style={{ fontWeight: 600, color: i.margin >= 30 ? '#22c55e' : i.margin >= 10 ? '#f59e0b' : '#ef4444' }}>{i.margin.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ReportActions title="P&L by Item" data={itemPL.slice(0, 20)} columns={[
          { label: 'Item', accessor: 'name' },
          { label: 'Units', accessor: 'units' },
          { label: 'Revenue', accessor: r => formatCurrency(r.revenue) },
          { label: 'Cost', accessor: r => formatCurrency(r.cost) },
          { label: 'Profit', accessor: r => formatCurrency(r.profit) },
          { label: 'Margin', accessor: r => r.margin.toFixed(0) + '%' },
        ]} filename="pnl_by_item" telegramText={`📋 <b>P&L by Item</b>\n\n${itemPL.slice(0, 10).map((i, n) => `${n + 1}. ${i.name}: ${formatCurrency(i.revenue)} rev / ${formatCurrency(i.cost)} cost / ${formatCurrency(i.profit)} profit`).join('\n')}`} />
        </div>)}
      </div>
      )}

      {/* 2 + 3. Hourly Sales + Category Performance */}
      <div className="rp-panel" style={{ cursor: 'pointer' }}>
        <div onClick={() => toggleCollapse('hourly')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="rp-section-title">⏰ Hourly Sales & 📦 Category Performance</h3>
            <p className="rp-subtle">Orders by hour and revenue by menu category</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: collapsed.has('hourly') ? '#64748b' : '#3b82f6', border: '1px solid ' + (collapsed.has('hourly') ? '#ddd8cf' : '#3b82f6'), borderRadius: 999, padding: '3px 10px' }}>
            {collapsed.has('hourly') ? 'Show ▾' : 'Hide ▸'}
          </span>
        </div>
        {!collapsed.has('hourly') && (
      <div className="rp-grid rp-grid-2">
        <div className="rp-panel">
          <h3 className="rp-section-title">⏰ Hourly Sales</h3>
          <p className="rp-subtle">Orders & revenue by hour of day</p>
          <div className="rp-status-list">
            {hourlySales.filter(h => h.orders > 0 || h.revenue > 0).map(h => {
              const pct = stats.orders > 0 ? (h.orders / stats.orders) * 100 : 0;
              return (
                <div key={h.hour} className="rp-status-row">
                  <div className="rp-status-name">{String(h.hour).padStart(2, '0')}:00</div>
                  <div className="rp-status-bar"><span style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand), var(--brand2))' }} /></div>
                  <div className="rp-status-val" style={{ fontSize: 12 }}>{h.orders} · {formatCurrency(h.revenue)}</div>
                </div>
              );
            })}
            {hourlySales.filter(h => h.orders > 0).length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No data</p>}
          </div>
          <ReportActions title="Hourly Sales" data={hourlySales.filter(h => h.orders > 0)} columns={[
            { label: 'Hour', accessor: h => String(h.hour).padStart(2,'0') + ':00' },
            { label: 'Orders', accessor: 'orders' },
            { label: 'Revenue', accessor: r => formatCurrency(r.revenue) },
          ]} filename="hourly_sales" telegramText={`⏰ <b>Hourly Sales</b>\n\n${hourlySales.filter(h => h.orders > 0).map(h => `${String(h.hour).padStart(2,'0')}:00 — ${h.orders} orders / ${formatCurrency(h.revenue)}`).join('\n')}`} />
        </div>

        {/* 3. Category Performance */}
        <div className="rp-panel">
          <h3 className="rp-section-title">📦 Category Performance</h3>
          <p className="rp-subtle">Units & revenue by menu category</p>
          <div className="rp-status-list">
            {categoryPerf.map(c => {
              const pct = stats.revenue > 0 ? (c.revenue / stats.revenue) * 100 : 0;
              return (
                <div key={c.name} className="rp-status-row">
                  <div className="rp-status-name">{c.name}</div>
                  <div className="rp-status-bar"><span style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #8b5cf688)' }} /></div>
                  <div className="rp-status-val" style={{ fontSize: 12 }}>{c.units} · {formatCurrency(c.revenue)}</div>
                </div>
              );
            })}
            {categoryPerf.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No data</p>}
          </div>
          <ReportActions title="Category Performance" data={categoryPerf} columns={[
            { label: 'Category', accessor: 'name' },
            { label: 'Units', accessor: 'units' },
            { label: 'Revenue', accessor: r => formatCurrency(r.revenue) },
          ]} filename="category_performance" telegramText={`📦 <b>Category Performance</b>\n\n${categoryPerf.map(c => `${c.name}: ${c.units} units / ${formatCurrency(c.revenue)}`).join('\n')}`} />
        </div>
      </div>
        )}
      </div>

      {/* 4. Customer Lifetime */}
      <div className="rp-panel" style={{ cursor: 'pointer' }}>
        <div onClick={() => toggleCollapse('customer')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="rp-section-title">👤 Customer Lifetime Value</h3>
            <p className="rp-subtle">Total spent, order count, first & last order</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: collapsed.has('customer') ? '#64748b' : '#3b82f6', border: '1px solid ' + (collapsed.has('customer') ? '#ddd8cf' : '#3b82f6'), borderRadius: 999, padding: '3px 10px' }}>
            {collapsed.has('customer') ? 'Show ▾' : 'Hide ▸'}
          </span>
        </div>
        {!collapsed.has('customer') && (<div>
        <div style={{ overflowX: 'auto' }}>
          <table className="rp-table" style={{ minWidth: 600 }}>
            <thead><tr><th>Customer</th><th className="rp-cell-right">Orders</th><th className="rp-cell-right">Total Spent</th><th className="rp-cell-right">Avg Order</th><th>First Order</th><th>Last Order</th></tr></thead>
            <tbody>
              {customerLTV.slice(0, 20).map(c => (
                <tr key={c.name}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td className="rp-cell-right">{c.orders}</td>
                  <td className="rp-cell-right" style={{ fontWeight: 600 }}>{formatCurrency(c.revenue)}</td>
                  <td className="rp-cell-right">{formatCurrency(c.revenue / c.orders)}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(c.first).toLocaleDateString()}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(c.last).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ReportActions title="Customer Lifetime Value" data={customerLTV.slice(0, 20)} columns={[
          { label: 'Customer', accessor: 'name' },
          { label: 'Orders', accessor: 'orders' },
          { label: 'Total Spent', accessor: r => formatCurrency(r.revenue) },
          { label: 'Avg Order', accessor: r => formatCurrency(r.revenue / r.orders) },
          { label: 'First Order', accessor: r => new Date(r.first).toLocaleDateString() },
          { label: 'Last Order', accessor: r => new Date(r.last).toLocaleDateString() },
        ]} filename="customer_ltv" telegramText={`👤 <b>Top Customers</b>\n\n${customerLTV.slice(0, 10).map((c, n) => `${n + 1}. ${c.name}: ${c.orders} orders / ${formatCurrency(c.revenue)} total`).join('\n')}`} />
        </div>)}
      </div>

      {/* 5. Fulfillment Time */}
      {fulfillmentTime.count > 0 && (
      <div className="rp-panel" style={{ cursor: 'pointer' }}>
        <div onClick={() => toggleCollapse('fulfillment')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="rp-section-title">⏱️ Order Fulfillment Time</h3>
            <p className="rp-subtle">{fulfillmentTime.count} completed orders — Avg: {fulfillmentTime.avg}min — Fastest: {fulfillmentTime.min}min — Slowest: {fulfillmentTime.max}min</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: collapsed.has('fulfillment') ? '#64748b' : '#3b82f6', border: '1px solid ' + (collapsed.has('fulfillment') ? '#ddd8cf' : '#3b82f6'), borderRadius: 999, padding: '3px 10px' }}>
            {collapsed.has('fulfillment') ? 'Show ▾' : 'Hide ▸'}
          </span>
        </div>
        {!collapsed.has('fulfillment') && (<div>
        <div className="rp-kpis" style={{ marginBottom: 16 }}>
          <div className="rp-kpi"><div className="rp-label">Average</div><div className="rp-value" style={{ fontSize: 24 }}>{fulfillmentTime.avg}<span style={{ fontSize: 14, color: 'var(--muted)' }}>min</span></div></div>
          <div className="rp-kpi"><div className="rp-label">Fastest</div><div className="rp-value" style={{ fontSize: 24, color: '#22c55e' }}>{fulfillmentTime.min}<span style={{ fontSize: 14, color: 'var(--muted)' }}>min</span></div></div>
          <div className="rp-kpi"><div className="rp-label">Slowest</div><div className="rp-value" style={{ fontSize: 24, color: '#ef4444' }}>{fulfillmentTime.max}<span style={{ fontSize: 14, color: 'var(--muted)' }}>min</span></div></div>
          <div className="rp-kpi"><div className="rp-label">Orders</div><div className="rp-value" style={{ fontSize: 24 }}>{fulfillmentTime.count}</div></div>
        </div>
        {fulfillmentBin && (
          <div className="rp-status-list">
            {Object.entries(fulfillmentBin).map(([label, count]) => {
              const pct = fulfillmentTime.count > 0 ? (count / fulfillmentTime.count) * 100 : 0;
              return (
                <div key={label} className="rp-status-row">
                  <div className="rp-status-name">{label}</div>
                  <div className="rp-status-bar"><span style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #06b6d4, #06b6d488)' }} /></div>
                  <div className="rp-status-val">{count}</div>
                </div>
              );
            })}
          </div>
        )}
        <ReportActions title="Fulfillment Time" data={fulfillmentBin ? Object.entries(fulfillmentBin).map(([k,v]) => ({ label: k, count: v })) : []} columns={[
          { label: 'Duration', accessor: 'label' },
          { label: 'Orders', accessor: 'count' },
        ]} filename="fulfillment_time" telegramText={`⏱️ <b>Fulfillment Time</b>\n\nAvg: ${fulfillmentTime.avg}min\nFastest: ${fulfillmentTime.min}min\nSlowest: ${fulfillmentTime.max}min\nOrders: ${fulfillmentTime.count}\n\n${fulfillmentBin ? Object.entries(fulfillmentBin).map(([k,v]) => `${k}: ${v} orders`).join('\n') : ''}`} />
        </div>)}
      </div>
      )}

      {/* Transaction Table (bottom) */}
      <div className="rp-panel" style={{ cursor: 'pointer' }}>
        <div onClick={() => toggleCollapse('transactions')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="rp-section-title">💳 Transactions</h3>
            <p className="rp-subtle">{filteredOrders.length} orders</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: collapsed.has('transactions') ? '#64748b' : '#3b82f6', border: '1px solid ' + (collapsed.has('transactions') ? '#ddd8cf' : '#3b82f6'), borderRadius: 999, padding: '3px 10px' }}>
            {collapsed.has('transactions') ? 'Show ▾' : 'Hide ▸'}
          </span>
        </div>
        {!collapsed.has('transactions') && (<div>
        <div style={{ overflowX: 'auto' }}>
          <table className="rp-table" style={{ minWidth: 600 }}>
            <thead><tr><th>Order #</th><th>Customer</th><th>Phone</th><th className="rp-cell-right">Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No orders match current filters</td></tr>
              ) : filteredOrders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{o.id?.slice(0, 8)}</td>
                  <td style={{ fontWeight: 500 }}>{o.customer_name || 'Guest'}</td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{o.customer_phone || '—'}</td>
                  <td className="rp-cell-right" style={{ fontWeight: 600 }}>{formatCurrency(o.total_amount)}</td>
                  <td><span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', background: 'var(--card2)', border: '1px solid var(--border)' }}>{o.status}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</td>
                  <td><button onClick={() => openDetail(o)} className="rp-btn" style={{ padding: '6px 12px', fontSize: 12 }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>)}
      </div>

      {/* Order Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4" onClick={() => setDetail(null)} style={{ overscrollBehavior: 'contain' }}>
          <div className="w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[85vh] bg-white sm:rounded-2xl shadow-2xl overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{detail.customer_name || 'Guest'}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400 font-mono">#{detail.id?.slice(0, 8)} {detail.order_type && `· ${detail.order_type}`}</p>
                  {detail.telegram_username && (
                    <a href={`https://t.me/${detail.telegram_username}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 font-medium bg-blue-50 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                      <ExternalLink className="h-2.5 w-2.5" /> @{detail.telegram_username}
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-4 sm:px-6 py-4 border-b border-slate-50 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Status</span><span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full" style={{ backgroundColor: STATUS_CFG[detail.status]?.color + '18', color: STATUS_CFG[detail.status]?.color }}>{detail.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-medium">{detail.customer_phone || '—'}</span></div>
              {detail.telegram_username && <div className="flex justify-between"><span className="text-slate-400">Telegram</span><a href={`https://t.me/${detail.telegram_username}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 hover:text-blue-600">@{detail.telegram_username}</a></div>}
              <div className="flex justify-between"><span className="text-slate-400">Time</span><span className="font-medium">{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</span></div>
              {detail.order_type && <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-medium capitalize">{detail.order_type === 'delivery' ? <><Truck className="h-3 w-3 inline mr-1" /> Delivery</> : <><Store className="h-3 w-3 inline mr-1" /> Dine-in</>}</span></div>}
              {detail.customer_address && <div className="flex justify-between"><span className="text-slate-400">Address</span><span className="font-medium text-right max-w-[260px]">{detail.customer_address}</span></div>}
              {detail.customer_note && <div className="flex justify-between"><span className="text-slate-400">Note</span><span className="italic text-right max-w-[260px]">{detail.customer_note}</span></div>}
            </div>

            {/* Map preview */}
            {detail.order_type === 'delivery' && (() => {
              const coord = parseCoord(detail);
              if (!coord) return null;
              const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coord.lng - 0.005},${coord.lat - 0.005},${coord.lng + 0.005},${coord.lat + 0.005}&layer=mapnik&marker=${coord.lat},${coord.lng}`;
              const gmUrl = `https://www.google.com/maps?q=${coord.lat},${coord.lng}`;
              return (
                <div className="px-4 sm:px-6 py-3 border-b border-slate-50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2"><MapPin className="h-3.5 w-3.5 text-primary-500" /> Delivery Location</div>
                  {detailLocation && <p className="text-xs text-slate-600 font-medium mb-2 bg-slate-50 rounded-lg px-3 py-2">{detailLocation}</p>}
                  <p className="text-xs text-slate-400 font-mono mb-2">{coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}</p>
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm"><iframe src={mapUrl} width="100%" height="180" style={{ border: 0 }} loading="lazy" title="Delivery location" className="block" /></div>
                  <a href={gmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-primary-500 hover:text-primary-600 font-medium"><ExternalLink className="h-3 w-3" /> Open in Google Maps</a>
                </div>
              );
            })()}

            <div className="px-4 sm:px-6 py-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Items · {detailItems.length}</h3>
              {detailLoading ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
              ) : detailItems.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No items</p>
              ) : (
                <div className="space-y-2">
                  {detailItems.map(i => (
                    <div key={i.id} className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
                      <div className="flex items-center gap-2"><span className="text-slate-400 font-mono font-bold">{i.quantity}×</span><span className="font-medium">{i.item_name}</span></div>
                      <span className="font-semibold">{formatCurrency(i.quantity * i.unit_price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800">Total</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(detail.total_amount)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {getVisibleActions(detail.status).map(s => (
                  <button key={s} onClick={() => handleStatus(detail.id, s)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-primary-300 hover:text-primary-600 transition-all flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3" />{STATUS_CFG[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
