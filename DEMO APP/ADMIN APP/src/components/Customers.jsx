import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/format';
import { Search, Phone, ShoppingBag, CalendarDays, X, Loader2, Star, Medal, UserPlus, ChevronRight, Download, PhoneCall, Send, FileText, Package2, Edit2, Check } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [favItems, setFavItems] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sortBy, setSortBy] = useState('spent');
  const [tierFilter, setTierFilter] = useState('all');
  const [period, setPeriod] = useState('all');
  const [copied, setCopied] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const BOT_TOKEN = '8721362023:AAGUUSAmAGxN6CszdSnO4yK0MIoYAkyRmQg';

  const fetchProfilePhoto = async (tgId) => {
    if (!tgId) return;
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${tgId}&limit=1`);
      const data = await res.json();
      if (data.ok && data.result.photos.length > 0) {
        // Use largest size (last in array)
        const sizes = data.result.photos[0];
        const best = sizes[sizes.length - 1];
        const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${best.file_id}`);
        const fileData = await fileRes.json();
        if (fileData.ok) {
          setProfilePhoto(`https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`);
        }
      }
    } catch (e) { /* user may have privacy settings blocking photo access */ }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500);
    if (data) {
      const map = {};
      data.forEach(o => {
        // Group by Telegram ID first (most reliable), then phone, then name
        const tgId = o.telegram_user_id ? String(o.telegram_user_id) : '';
        const phone = o.customer_phone || '';
        const name = o.customer_name || 'Guest';
        const key = tgId || phone || name;
        if (!map[key]) map[key] = { names: new Set(), phones: new Set(), orders: [], firstOrder: o.created_at, tgIds: new Set(), tgUsernames: new Set(), tgFirstName: '' };
        if (phone) map[key].phones.add(phone);
        if (name !== 'Guest') map[key].names.add(name);
        if (tgId) map[key].tgIds.add(tgId);
        if (o.telegram_username) map[key].tgUsernames.add(o.telegram_username);
        if (o.telegram_first_name && !map[key].tgFirstName) map[key].tgFirstName = o.telegram_first_name;
        map[key].orders.push(o);
        if (new Date(o.created_at) < new Date(map[key].firstOrder)) map[key].firstOrder = o.created_at;
      });
      setCustomers(Object.values(map).map(c => {
        const orderCount = c.orders.length;
        const totalSpent = c.orders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
        const lastOrder = c.orders[0]?.created_at;
        const aov = orderCount > 0 ? totalSpent / orderCount : 0;
        const daysSinceLast = lastOrder ? Math.floor((Date.now() - new Date(lastOrder).getTime()) / 86400000) : 999;
        const deliveryCount = c.orders.filter(o => o.order_type === 'delivery').length;
        const pickupCount = c.orders.filter(o => o.order_type === 'pickup').length;
        const tier = orderCount >= 10 || totalSpent >= 50 ? 'vip' : orderCount >= 3 ? 'regular' : 'new';
        const tgId = [...c.tgIds][0] || '';
        return {
          name: c.names.size > 0 ? [...c.names].join(', ') : 'Guest',
          phone: [...c.phones].join(', '),
          tgId,
          tgUsername: [...c.tgUsernames][0] || '',
          tgFirstName: c.tgFirstName || '',
          telegram: [...c.tgUsernames][0] || '',
          orderCount, totalSpent, lastOrder, firstOrder: c.firstOrder, aov,
          daysSinceLast, deliveryCount, pickupCount, tier,
        };
      }).sort((a, b) => b.totalSpent - a.totalSpent));
    }
    setLoading(false);
  };

  const fetchCustomerNote = async (phone) => {
    const { data } = await supabase.from('customer_notes').select('*').eq('phone', phone).maybeSingle();
    setCustomerNote(data?.notes || '');
  };

  const saveCustomerNote = async () => {
    setNoteSaving(true);
    const phone = selected.tgId || selected.phone.split(', ')[0] || '000';
    const name = selected.name;
    const { data: existing } = await supabase.from('customer_notes').select('id').eq('phone', phone).maybeSingle();
    if (existing) {
      await supabase.from('customer_notes').update({ notes: customerNote, name }).eq('id', existing.id);
    } else {
      await supabase.from('customer_notes').insert({ phone, name, notes: customerNote });
    }
    setNoteSaving(false);
    setEditingNote(false);
  };

  const openProfile = async (c) => {
    setSelected(c);
    setHistory([]);
    setFavItems([]);
    setOrderDetail(null);
    setProfileLoading(true);
    setEditingNote(false);
    setProfilePhoto(null);
    if (c.tgId) fetchProfilePhoto(c.tgId);

    const params = [];
    if (c.phone) c.phone.split(', ').forEach(p => { if (p) params.push(`customer_phone.eq.${p}`); });
    if (c.name && c.name !== 'Guest') c.name.split(', ').forEach(n => { if (n) params.push(`customer_name.eq.${n}`); });

    let q = supabase.from('orders').select('*');
    if (params.length > 0) q = q.or(params.join(','));
    const { data: orders } = await q.order('created_at', { ascending: false }).limit(50);
    setHistory(orders || []);

    if (orders && orders.length > 0) {
      const { data: items } = await supabase.from('order_items').select('item_name,quantity').in('order_id', orders.map(o => o.id));
      if (items) {
        const itemMap = {};
        items.forEach(i => { itemMap[i.item_name] = (itemMap[i.item_name] || 0) + (i.quantity || 1); });
        setFavItems(Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, ct]) => ({ name: n, count: ct })));
      }
    }
    await fetchCustomerNote(c.tgId || c.phone.split(', ')[0] || '000');
    setProfileLoading(false);
  };

  const viewOrderDetail = async (o) => {
    setOrderDetail(o);
    setItemsLoading(true);
    const { data } = await supabase.from('order_items').select('*').eq('order_id', o.id);
    setOrderItems(data || []);
    setItemsLoading(false);
  };

  const copyPhone = (phone) => { navigator.clipboard.writeText(phone.split(', ')[0]).then(() => { setCopied(phone); setTimeout(() => setCopied(''), 2000); }); };

  const exportCSV = () => {
    const rows = [['Name','Telegram ID','Phone','Tier','Orders','Total','AOV','Last Order','First Order','Delivery','Pickup']];
    filtered.forEach(c => rows.push([c.name,c.tgId,c.phone,c.tier,c.orderCount,c.totalSpent.toFixed(2),c.aov.toFixed(2),c.lastOrder||'',c.firstOrder||'',c.deliveryCount,c.pickupCount]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    const cutoff = period === '30d' ? Date.now() - 30*86400000 : period === '90d' ? Date.now() - 90*86400000 : period === '1y' ? Date.now() - 365*86400000 : 0;
    let result = customers.filter(c => {
      if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
      if (search) { const q = search.toLowerCase(); if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false; }
      if (cutoff && c.lastOrder && new Date(c.lastOrder).getTime() < cutoff) return false;
      if (cutoff && !c.lastOrder) return false;
      return true;
    });
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'orders') return b.orderCount - a.orderCount;
      if (sortBy === 'recent') return new Date(b.lastOrder||0) - new Date(a.lastOrder||0);
      if (sortBy === 'aov') return b.aov - a.aov;
      return b.totalSpent - a.totalSpent;
    });
    return result;
  }, [customers, search, sortBy, tierFilter, period]);

  const vipCount = customers.filter(c => c.tier === 'vip').length;
  const regCount = customers.filter(c => c.tier === 'regular').length;
  const newCount = customers.filter(c => c.tier === 'new').length;

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading customers…</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Customers · {filtered.length}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Profiles, order history & insights</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-36" />
            {search && <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/30">
            <option value="spent">Highest spent</option><option value="orders">Most orders</option><option value="aov">Highest AOV</option><option value="recent">Most recent</option><option value="name">Name A-Z</option><option value="name_desc">Name Z-A</option>
          </select>
          <button onClick={exportCSV} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Export</button>
        </div>
      </div>

      {/* Tier + Period */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-0.5 bg-slate-100 rounded-xl p-1">
          {[{k:'all',l:'All',n:customers.length},{k:'vip',l:'VIP',n:vipCount,icon:Star},{k:'regular',l:'Regular',n:regCount,icon:Medal},{k:'new',l:'New',n:newCount,icon:UserPlus}].map(t => (
            <button key={t.k} onClick={() => setTierFilter(t.k)} className={cn('px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1', tierFilter === t.k ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700')}>{t.icon && <t.icon className="h-3 w-3" />}{t.l} <span className="text-slate-300">{t.n}</span></button>
          ))}
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/30">
          <option value="all">All time</option><option value="30d">Last 30d</option><option value="90d">Last 90d</option><option value="1y">Last year</option>
        </select>
        {(tierFilter !== 'all' || period !== 'all' || sortBy !== 'spent') && <button onClick={() => { setTierFilter('all'); setPeriod('all'); setSortBy('spent'); }} className="text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1"><X className="h-3 w-3" />Clear</button>}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left">
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Customer</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Tier</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Orders</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Total</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">AOV</th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Last</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No customers</td></tr> : filtered.map(c => (
                <tr key={c.phone || c.name} className="hover:bg-slate-50/50 cursor-pointer group" onClick={() => openProfile(c)}>
                  <td className="px-5 py-3"><div className="flex items-center gap-3"><div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0', c.tier === 'vip' ? 'bg-amber-100 text-amber-600' : c.tier === 'regular' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500')}>{c.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="font-semibold text-slate-800 truncate flex items-center gap-1.5">{c.name}{c.tier === 'vip' && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}{c.tgId && <Send className="h-3 w-3 text-[#2AABEE] flex-shrink-0" />}</p>{c.phone ? <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{c.phone.split(', ')[0]}</p> : c.tgId && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Send className="h-3 w-3" />ID: {c.tgId}</p>}</div></div></td>
                  <td className="px-5 py-3 hidden md:table-cell"><span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', c.tier === 'vip' ? 'bg-amber-50 text-amber-600' : c.tier === 'regular' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500')}>{c.tier}</span></td>
                  <td className="px-5 py-3"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"><ShoppingBag className="h-3 w-3" />{c.orderCount}</span></td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{formatCurrency(c.totalSpent)}</td>
                  <td className="px-5 py-3 text-slate-600 hidden sm:table-cell">{formatCurrency(c.aov)}</td>
                  <td className="px-5 py-3 hidden lg:table-cell"><span className={cn('text-xs', c.daysSinceLast > 30 ? 'text-red-400 font-semibold' : c.daysSinceLast > 14 ? 'text-amber-500' : 'text-slate-400')}>{c.daysSinceLast === 0 ? 'Today' : c.daysSinceLast === 1 ? 'Yesterday' : `${c.daysSinceLast}d ago`}</span></td>
                  <td className="px-5 py-3"><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-5 py-4 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selected.tier === 'vip' && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full"><Star className="h-3 w-3 fill-amber-400" />VIP</span>}
                    {selected.tier === 'regular' && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"><Medal className="h-3 w-3" />Regular</span>}
                    {selected.tier === 'new' && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full"><UserPlus className="h-3 w-3" />New</span>}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                  {(selected.tgUsername || selected.tgId) && (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selected.tgUsername ? `https://t.me/${selected.tgUsername}` : `tg://user?id=${selected.tgId}`)}`}
                      alt="Telegram QR"
                      className="mt-2 rounded-xl border border-slate-200"
                      style={{ width: 160, height: 160 }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {selected.tgId && <a href={`tg://user?id=${selected.tgId}`} className="w-8 h-8 rounded-lg bg-[#2AABEE] flex items-center justify-center text-white shadow-sm shadow-blue-200"><Send className="h-4 w-4" /></a>}
                  {!selected.tgId && selected.telegram && <a href={`tg://resolve?domain=${selected.telegram}`} className="w-8 h-8 rounded-lg bg-[#2AABEE] flex items-center justify-center text-white shadow-sm shadow-blue-200"><Send className="h-4 w-4" /></a>}
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="h-5 w-5" /></button>
                </div>
              </div>
            </div>

            {profileLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : (
              <div className="px-5 py-4 space-y-5">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { l:'Orders', v:selected.orderCount, c:'bg-blue-50 text-blue-600' },
                    { l:'Spent', v:formatCurrency(selected.totalSpent), c:'bg-emerald-50 text-emerald-600' },
                    { l:'AOV', v:formatCurrency(selected.aov), c:'bg-violet-50 text-violet-600' },
                    { l:'Last', v:selected.daysSinceLast===0?'Today':`${selected.daysSinceLast}d ago`, c:selected.daysSinceLast>14?'bg-red-50 text-red-500':'bg-slate-50 text-slate-600' },
                  ].map(s => <div key={s.l} className={`rounded-xl px-3 py-2.5 ${s.c.split(' ')[0]}`}><p className="text-[10px] uppercase tracking-wider opacity-70">{s.l}</p><p className={`text-sm font-bold ${s.c.split(' ')[1]}`}>{s.v}</p></div>)}
                </div>

                {/* Contact — Telegram ID first */}
                <div className="rounded-xl bg-slate-50 p-3 space-y-3 text-sm">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Contact via Telegram</p>
                    {selected.tgId ? (
                      <>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-12 h-12 rounded-full bg-[#2AABEE]/10 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                            <Send className="h-5 w-5 text-[#2AABEE]" />
                            {profilePhoto && <img src={profilePhoto} alt="" className="absolute inset-0 w-full h-full object-cover rounded-full" onError={(e) => e.target.remove()} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800">{selected.tgFirstName || selected.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {selected.tgId}{selected.tgUsername ? ` · @${selected.tgUsername}` : ''}</p>
                            {selected.phone && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{selected.phone.split(', ')[0]}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href={`tg://user?id=${selected.tgId}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#2AABEE] text-white px-3 py-2 text-xs font-semibold hover:bg-[#2291d9] shadow-sm shadow-blue-200">
                            <Send className="h-3.5 w-3.5" />Chat on Telegram
                          </a>
                          <a href={`tg://user?id=${selected.tgId}`} className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2AABEE]/30 text-[#2AABEE] px-3 py-2 text-xs font-semibold hover:bg-[#2AABEE]/5">
                            <PhoneCall className="h-3.5 w-3.5" />Call
                          </a>
                        </div>
                      </>
                    ) : selected.telegram ? (
                      <>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-12 h-12 rounded-full bg-[#2AABEE]/10 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                            <Send className="h-5 w-5 text-[#2AABEE]" />
                            {profilePhoto && <img src={profilePhoto} alt="" className="absolute inset-0 w-full h-full object-cover rounded-full" onError={(e) => e.target.remove()} />}
                          </div>
                          <div className="min-w-0">
                            <a href={`tg://resolve?domain=${selected.telegram}`} className="text-sm font-bold text-[#2AABEE] hover:underline">@{selected.telegram}</a>
                            <p className="text-[10px] text-slate-400">Open in Telegram</p>
                            {selected.phone && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{selected.phone.split(', ')[0]}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href={`tg://resolve?domain=${selected.telegram}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#2AABEE] text-white px-3 py-2 text-xs font-semibold hover:bg-[#2291d9] shadow-sm shadow-blue-200"><Send className="h-3.5 w-3.5" />Message</a>
                          <a href={`tg://resolve?domain=${selected.telegram}&voice`} className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2AABEE]/30 text-[#2AABEE] px-3 py-2 text-xs font-semibold hover:bg-[#2AABEE]/5"><PhoneCall className="h-3.5 w-3.5" />Call</a>
                        </div>
                      </>
                    ) : (
                      <>
                        {selected.phone ? (
                          <>
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><Phone className="h-5 w-5 text-slate-400" /></div>
                              <div><p className="text-sm font-bold text-slate-800">{selected.phone.split(', ')[0]}</p><p className="text-[10px] text-slate-400">No Telegram linked</p></div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); copyPhone(selected.phone); }} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">{copied === selected.phone ? 'Copied!' : 'Copy'}</button>
                              <a href={`tel:${selected.phone.split(', ')[0]}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-700"><PhoneCall className="h-3.5 w-3.5" />Call</a>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400 py-2 text-center">No contact info available</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200"><CalendarDays className="h-4 w-4 text-slate-400" /><span className="text-slate-600 text-xs">First: {selected.firstOrder ? new Date(selected.firstOrder).toLocaleDateString() : '—'} · Last: {selected.lastOrder ? new Date(selected.lastOrder).toLocaleDateString() : '—'}</span></div>
                  <div className="flex gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{selected.deliveryCount} delivery</span><span>{selected.pickupCount} pickup</span></div>
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Notes</h4>
                    {!editingNote && (
                      <button onClick={(e) => { e.stopPropagation(); setEditingNote(true); }} className="text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1"><Edit2 className="h-3 w-3" />Edit</button>
                    )}
                  </div>
                  {editingNote ? (
                    <div className="space-y-2">
                      <textarea value={customerNote} onChange={e => setCustomerNote(e.target.value)} placeholder="Add notes about this customer… (allergies, preferences, etc.)" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingNote(false); }} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button onClick={saveCustomerNote} disabled={noteSaving} className="flex-1 rounded-xl bg-primary-500 text-white px-3 py-2 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center gap-1">{noteSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-3 min-h-[40px]">{customerNote || 'No notes yet'}</p>
                  )}
                </div>

                {/* Favorite Items */}
                {favItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Favorite Items</h4>
                    <div className="space-y-1">
                      {favItems.map((fi, i) => (
                        <div key={fi.name} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-slate-50">
                          <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-300 w-5">{i+1}.</span><span className="font-medium text-slate-700">{fi.name}</span></div>
                          <span className="text-xs text-slate-400">{fi.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Orders · {history.length}</h4>
                  <div className="space-y-1.5">
                    {history.slice(0, 30).map(o => (
                      <div key={o.id} className="rounded-lg border border-slate-100 p-3 hover:bg-slate-50/50 cursor-pointer" onClick={() => viewOrderDetail(o)}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-slate-400">#{o.id?.slice(0, 8)}</span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: (o.status === 'completed' ? '#22c55e' : o.status === 'cancelled' ? '#ef4444' : '#f59e0b') + '14', color: o.status === 'completed' ? '#22c55e' : o.status === 'cancelled' ? '#ef4444' : '#f59e0b' }}>{o.status}</span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-800">{formatCurrency(o.total_amount)}</span>
                          <span className="text-[11px] text-slate-400">{o.created_at ? new Date(o.created_at).toLocaleString() : ''}</span>
                        </div>
                        {o.customer_address && <p className="text-xs text-slate-400 mt-0.5 truncate">{o.customer_address}</p>}
                        <div className="mt-1 text-[10px] text-primary-400 flex items-center gap-1"><Package2 className="h-3 w-3" />View items</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Order Detail Sub-panel */}
            {orderDetail && (
              <>
                <div className="fixed inset-0 bg-black/10 z-[51]" onClick={() => setOrderDetail(null)} />
                <div className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl z-[52] overflow-y-auto animate-slide-in border-l border-slate-200">
                  <div className="sticky top-0 bg-white/95 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Order #{orderDetail.id?.slice(0, 8)}</h3>
                      <p className="text-[10px] text-slate-400">{formatCurrency(orderDetail.total_amount)} · {orderDetail.status}</p>
                    </div>
                    <button onClick={() => setOrderDetail(null)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="h-4 w-4" /></button>
                  </div>
                    <div className="px-4 py-3 space-y-2">
                    {itemsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div> : orderItems.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">No items</p> : (
                      <>
                        {orderItems.map(i => (
                          <div key={i.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 text-sm">
                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-primary-400 font-mono">{i.quantity}×</span><span className="font-medium">{i.item_name}</span></div>
                            <span className="font-semibold text-xs">{formatCurrency(i.quantity * i.unit_price)}</span>
                          </div>
                        ))}
                        <button onClick={() => {
                          const txt = `Order #${orderDetail.id?.slice(0, 8)}
Amount: ${formatCurrency(orderDetail.total_amount)}
Status: ${orderDetail.status}
Items:
${orderItems.map(i => `  ${i.item_name} x${i.quantity} — ${formatCurrency(i.quantity * i.unit_price)}`).join('\n')}`;
                          navigator.clipboard.writeText(txt);
                        }}
                          className="w-full mt-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          Copy Order
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } } .animate-slide-in { animation: slide-in 0.2s ease-out; }`}</style>
    </div>
  );
}

function cn(...c) { return c.filter(Boolean).join(' '); }

