import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';
import { formatCurrency } from '../lib/format';
import { sendEventNotification, formatLowStockAlert } from '../lib/notifications';
import { Package, AlertTriangle, Search, Plus, Truck, X, Loader2, ChevronDown, Zap, Hand, Download, Layers, BarChart3, ClipboardList } from 'lucide-react';

const REASONS = [
  { id: 'restock', label: 'Restock', icon: Truck },
  { id: 'delivery', label: 'New Delivery', icon: Package },
  { id: 'waste', label: 'Waste/Spoiled', icon: AlertTriangle },
  { id: 'correction', label: 'Correction', icon: Edit },
];

function Edit({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }

export default function StockManager() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoMode, setAutoMode] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkQty, setBulkQty] = useState(10);
  const [bulkReason, setBulkReason] = useState('restock');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkThreshold, setBulkThreshold] = useState(5);
  const [usageMap, setUsageMap] = useState({});
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [collapsedCats, setCollapsedCats] = useState(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const last7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const [itemsRes, logsRes, settingRes, catsRes, recentItemsRes] = await Promise.all([
        supabase.from('menu_items').select('id,name,stock_quantity,low_stock_threshold,cost_price,price_pickup,price_delivery,available,category_id,menu_categories(name)').order('name'),
        supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('app_settings').select('value').eq('key', 'stock_auto_mode').maybeSingle(),
        supabase.from('menu_categories').select('*').order('display_order'),
        supabase.from('order_items').select('menu_item_id,quantity').gte('created_at', last7),
      ]);
      setItems(itemsRes.data || []);
      setLogs(logsRes.data || []);
      setAutoMode(settingRes.data?.value === 'on');
      setCategories(catsRes.data || []);

      // Usage forecast: items sold in last 7 days
      const uMap = {};
      (recentItemsRes.data || []).forEach(oi => {
        if (!oi.menu_item_id) return;
        if (!uMap[oi.menu_item_id]) uMap[oi.menu_item_id] = 0;
        uMap[oi.menu_item_id] += oi.quantity || 1;
      });
      setUsageMap(uMap);
    } catch (err) { console.error('Fetch stock data failed', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => items.filter(i => {
    if (categoryFilter !== 'all' && i.category_id !== categoryFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    const qty = i.stock_quantity ?? 0;
    const thr = i.low_stock_threshold ?? 5;
    if (filter === 'low') return qty > 0 && qty <= thr;
    if (filter === 'out') return qty <= 0;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'stock_asc') return (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0);
    if (sortBy === 'stock_desc') return (b.stock_quantity ?? 0) - (a.stock_quantity ?? 0);
    return a.name.localeCompare(b.name);
  }), [items, search, filter, categoryFilter, sortBy]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(i => {
      const cat = i.menu_categories?.name || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(i);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const stats = useMemo(() => ({
    total: items.length,
    inStock: items.filter(i => (i.stock_quantity ?? 100) > (i.low_stock_threshold ?? 5)).length,
    low: items.filter(i => { const q = i.stock_quantity ?? 0; return q > 0 && q <= (i.low_stock_threshold ?? 5); }).length,
    out: items.filter(i => (i.stock_quantity ?? 100) <= 0).length,
  }), [items]);

  const filteredLogs = useMemo(() => logs.filter(l => {
    if (logDateFrom && new Date(l.created_at) < new Date(logDateFrom)) return false;
    if (logDateTo && new Date(l.created_at) > new Date(logDateTo + 'T23:59:59')) return false;
    return true;
  }), [logs, logDateFrom, logDateTo]);

  const forecastDays = (qty, dailyUsage) => {
    if (!dailyUsage || dailyUsage <= 0) return qty > 0 ? '∞' : '0';
    if (qty <= 0) return '0';
    return Math.floor(qty / dailyUsage);
  };

  const handleRestock = async (item, qty, reason) => {
    setSaving(true);
    try {
      const prev = item.stock_quantity;
      const newQty = prev + qty;
      const threshold = item.low_stock_threshold || 5;
      await supabase.from('menu_items').update({ stock_quantity: newQty, available: true }).eq('id', item.id);
      await supabase.from('stock_logs').insert({
        menu_item_id: item.id, change_amount: qty, reason,
        previous_quantity: prev, new_quantity: newQty,
      });
      
      // Check if stock now below threshold after deduction
      if (newQty <= threshold && prev > threshold) {
        await sendEventNotification('low_stock', formatLowStockAlert([{ name: item.name, stock_quantity: newQty }]));
      }
      
      await fetchAll();
    } catch (err) { console.error('Restock failed', err); }
    finally { setSaving(false); }
  };

  const handleBulkRestock = async (qty, reason) => {
    if (selected.size === 0 || qty <= 0) return;
    setBulkSaving(true);
    try {
      const ids = [...selected];
      const ups = ids.map(async id => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const prev = item.stock_quantity;
        const newQty = prev + qty;
        await supabase.from('menu_items').update({ stock_quantity: newQty, available: true }).eq('id', id);
        await supabase.from('stock_logs').insert({
          menu_item_id: id, change_amount: qty, reason,
          previous_quantity: prev, new_quantity: newQty,
        });
      });
      await Promise.all(ups);
      await fetchAll();
      setSelected(new Set());
    } catch (err) { console.error('Bulk restock failed', err); }
    finally { setBulkSaving(false); }
  };

  const handleBulkThreshold = async () => {
    if (selected.size === 0 || bulkThreshold < 0) return;
    setBulkSaving(true);
    try {
      await supabase.from('menu_items').update({ low_stock_threshold: bulkThreshold }).in('id', [...selected]);
      await fetchAll();
      setSelected(new Set());
    } catch (err) { console.error('Bulk threshold failed', err); }
    finally { setBulkSaving(false); }
  };

  const toggleAutoMode = async () => {
    const newVal = !autoMode;
    setAutoMode(newVal);
    const { data: existing } = await supabase.from('app_settings').select('id').eq('key', 'stock_auto_mode').maybeSingle();
    if (existing) {
      await supabase.from('app_settings').update({ value: newVal ? 'on' : 'off' }).eq('id', existing.id);
    } else {
      await supabase.from('app_settings').insert({ key: 'stock_auto_mode', value: newVal ? 'on' : 'off' });
    }
  };

  const exportCSV = () => {
    const rows = [['Name','Category','Stock','Threshold','Status','7-Day Usage','Days Left']];
    filtered.forEach(i => {
      const u = usageMap[i.id] || 0;
      const daily = u / 7;
      rows.push([i.name, i.menu_categories?.name || '', i.stock_quantity ?? 0, i.low_stock_threshold ?? 5, (i.stock_quantity??0) <= 0 ? 'Out' : (i.stock_quantity??0) <= (i.low_stock_threshold??5) ? 'Low' : 'OK', u, forecastDays(i.stock_quantity??0, daily)]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'stock_report.csv'; a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading stock…</div>;

  const TAB = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)} className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2', activeTab === id ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100')}>{Icon && <Icon className="h-4 w-4" />}{label}</button>
  );

  return (
    <div className="space-y-4">
      {/* Header + Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Inventory</h3>
        <div className="flex items-center gap-2">
          <button onClick={toggleAutoMode} className={cn('rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all', autoMode ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200')}>
            {autoMode ? <><Zap className="h-3.5 w-3.5" />Auto</> : <><Hand className="h-3.5 w-3.5" />Manual</>}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <TAB id="inventory" label="Inventory" icon={Layers} />
        <TAB id="operations" label="Operations" icon={ClipboardList} />
        <TAB id="history" label="History" icon={BarChart3} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{l:'Total',v:stats.total,c:'text-slate-600'},{l:'In Stock',v:stats.inStock,c:'text-green-600'},{l:'Low',v:stats.low,c:'text-amber-600'},{l:'Out',v:stats.out,c:'text-red-600'}].map(s => (
          <div key={s.l} className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center"><div className={`text-2xl font-bold ${s.c}`}>{s.v}</div><div className="text-xs text-slate-400 mt-0.5">{s.l}</div></div>
        ))}
      </div>

      {/* Shared: Search + Sort + Export */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
        </div>
        {activeTab === 'inventory' && (
          <>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="name">Name A-Z</option><option value="name_desc">Name Z-A</option><option value="stock_asc">Stock: Low to High</option><option value="stock_desc">Stock: High to Low</option>
            </select>
            <button onClick={() => setCollapsedCats(new Set())} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">Expand All</button>
            <button onClick={() => { const all = new Set(grouped.map(([n]) => n)); setCollapsedCats(all); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">Collapse All</button>
            <div className="flex-1" />
            <button onClick={exportCSV} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Export</button>
          </>
        )}
      </div>

      {/* === INVENTORY TAB === */}
      {activeTab === 'inventory' && (
        <div className="space-y-3">
          {grouped.length === 0 ? <div className="text-center py-12 text-sm text-slate-400">No items</div> : grouped.map(([catName, catItems]) => {
            const isCollapsed = collapsedCats.has(catName);
            const catOut = catItems.filter(i => (i.stock_quantity??0) <= 0).length;
            const catLow = catItems.filter(i => { const q = i.stock_quantity??0; return q > 0 && q <= (i.low_stock_threshold??5); }).length;
            return (
              <div key={catName} className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
                <button onClick={() => { const s = new Set(collapsedCats); s.has(catName) ? s.delete(catName) : s.add(catName); setCollapsedCats(s); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                  <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', !isCollapsed && 'rotate-180')} />
                  <span className="text-sm font-bold text-slate-700">{catName}</span>
                  <span className="text-xs text-slate-400">{catItems.length} items</span>
                  {catOut > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">{catOut} out</span>}
                  {catLow > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500">{catLow} low</span>}
                </button>
                {!isCollapsed && <div className="overflow-x-auto border-t border-slate-100">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-50 text-left">
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Item</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Cost</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Profit</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Stock</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right hidden sm:table-cell">Min</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right hidden md:table-cell">7d</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Left</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {catItems.map(i => {
                        const qty = i.stock_quantity ?? 0;
                        const thr = i.low_stock_threshold ?? 5;
                        const weekly = usageMap[i.id] || 0;
                        const daily = weekly / 7;
                        const days = forecastDays(qty, daily);
                        const isOut = qty <= 0;
                        const isLow = qty > 0 && qty <= thr;
                        return (
                          <tr key={i.id} className={cn('hover:bg-slate-50/50', isOut && 'bg-red-50/30', isLow && 'bg-amber-50/30')}>
                            <td className="px-4 py-2"><span className={cn('text-xs font-semibold', isOut && 'text-red-600', isLow && 'text-amber-600')}>{i.name}</span></td>
                            <td className="px-4 py-2 text-right text-xs">{i.cost_price ? formatCurrency(i.cost_price) : <span className="text-slate-300">—</span>}</td>
                            <td className="px-4 py-2 text-right text-xs">
                              {i.cost_price && i.price_pickup ? (
                                <span className="font-semibold" style={{ color: (i.price_pickup ?? i.price) > i.cost_price ? '#22c55e' : '#ef4444' }}>
                                  {formatCurrency((i.price_pickup ?? i.price) - i.cost_price)}
                                </span>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-2 text-right"><span className={cn('text-xs font-bold', isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800')}>{qty}</span></td>
                            <td className="px-4 py-2 text-right text-xs text-slate-400 hidden sm:table-cell">{thr}</td>
                            <td className="px-4 py-2 text-right text-xs text-slate-500 hidden md:table-cell">{weekly}</td>
                            <td className="px-4 py-2 text-right"><span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', days==='∞'?'bg-green-50 text-green-600':days<=1?'bg-red-50 text-red-600':days<=3?'bg-amber-50 text-amber-600':'bg-slate-100 text-slate-500')}>{days==='∞'?'∞':days<=0?'0':days}{days!=='∞'&&'d'}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>}
              </div>
            );
          })}
        </div>
      )}

      {/* === OPERATIONS TAB === */}
      {activeTab === 'operations' && (
        <>
          {/* Filters for Operations */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[{id:'all',l:'All'},{id:'low',l:'Low Stock'},{id:'out',l:'Out of Stock'}].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', filter === f.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700')}>{f.l}</button>
              ))}
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary-700">{selected.size} items selected</span>
                <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-700 ml-auto">Clear</button>
              </div>

              {/* Bulk restock */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Restock:</span>
                <input type="number" min="1" value={bulkQty} onChange={e => setBulkQty(parseInt(e.target.value)||1)} className="w-20 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20" />
                <select value={bulkReason} onChange={e => setBulkReason(e.target.value)} className="rounded-lg border border-primary-200 bg-white px-2 py-1.5 text-xs text-slate-600 outline-none">
                  {REASONS.filter(r => r.id !== 'waste').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                <button onClick={() => handleBulkRestock(bulkQty, bulkReason)} disabled={bulkSaving} className="rounded-lg bg-primary-500 text-white px-3 py-1.5 text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 flex items-center gap-1">
                  {bulkSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Add +{bulkQty}
                </button>
              </div>

              {/* Bulk threshold */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Set threshold:</span>
                <input type="number" min="0" value={bulkThreshold} onChange={e => setBulkThreshold(parseInt(e.target.value)||0)} className="w-20 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20" />
                <button onClick={handleBulkThreshold} disabled={bulkSaving} className="rounded-lg bg-primary-500 text-white px-3 py-1.5 text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">Apply</button>
              </div>
            </div>
          )}

          {/* Items table with select + individual actions */}
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 w-10"><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(i=>i.id)) : new Set())} checked={selected.size === filtered.length && filtered.length > 0} className="rounded" /></th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Item</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Cost</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Profit</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Stock</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Threshold</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Adjust</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(i => {
                    const qty = i.stock_quantity ?? 0;
                    return (
                      <tr key={i.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(i.id)} onChange={() => { const s = new Set(selected); s.has(i.id) ? s.delete(i.id) : s.add(i.id); setSelected(s); }} className="rounded" /></td>
                        <td className="px-4 py-2.5"><span className="font-semibold text-slate-800">{i.name}</span></td>
                        <td className="px-4 py-2.5 text-right text-xs">{i.cost_price ? formatCurrency(i.cost_price) : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-2.5 text-right text-xs">
                          {i.cost_price && i.price_pickup ? (
                            <span className="font-semibold" style={{ color: (i.price_pickup ?? i.price) > i.cost_price ? '#22c55e' : '#ef4444' }}>
                              {formatCurrency((i.price_pickup ?? i.price) - i.cost_price)}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold">{qty}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{i.low_stock_threshold ?? 5}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <AdjustButton item={i} onRestock={handleRestock} saving={saving} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === 'history' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={logDateFrom} onChange={e => setLogDateFrom(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20 w-[140px]" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={logDateTo} onChange={e => setLogDateTo(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20 w-[140px]" />
            {(logDateFrom || logDateTo) && <button onClick={() => { setLogDateFrom(''); setLogDateTo(''); }} className="text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1"><X className="h-3 w-3" />Clear</button>}
            <span className="ml-auto text-xs text-slate-400">{filteredLogs.length} entries</span>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Time</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Item</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Change</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">From</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">To</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Reason</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No log entries</td></tr> : filteredLogs.map(l => {
                    const item = items.find(i => i.id === l.menu_item_id);
                    return (
                      <tr key={l.id}>
                        <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-xs font-medium">{item?.name || 'Unknown'}</td>
                        <td className="px-4 py-2.5 text-right"><span className={cn('font-bold text-xs', l.change_amount > 0 ? 'text-green-600' : 'text-red-500')}>{l.change_amount > 0 ? '+' : ''}{l.change_amount}</span></td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-400">{l.previous_quantity}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-semibold">{l.new_quantity}</td>
                        <td className="px-4 py-2.5"><span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{l.reason}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AdjustButton({ item, onRestock, saving }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(10);
  const [reason, setReason] = useState('restock');

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={saving} className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors">± Adjust</button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-slate-200 shadow-xl p-3 w-56">
          <div className="flex items-center gap-2 mb-2">
            <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value)||0)} className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary-500/20" />
            <select value={reason} onChange={e => setReason(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-1 py-1 text-[10px] outline-none">
              {REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex gap-1">
            <button onClick={() => { onRestock(item, qty, reason); setOpen(false); }} className="flex-1 rounded-lg bg-green-500 text-white px-2 py-1.5 text-[10px] font-semibold hover:bg-green-600">+Add</button>
            <button onClick={() => { onRestock(item, -Math.abs(qty), reason); setOpen(false); }} className="flex-1 rounded-lg bg-red-500 text-white px-2 py-1.5 text-[10px] font-semibold hover:bg-red-600">-Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}
