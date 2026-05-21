import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/format';
import { Truck, Plus, Trash2, Edit2, X, Loader2, Phone, CheckCircle, XCircle, PackageCheck, DollarSign, ChevronDown, Bike, Activity, Send } from 'lucide-react';

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [commission, setCommission] = useState(0);
  const [telegramUserId, setTelegramUserId] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { Promise.all([fetchRiders(), fetchOrders()]); }, []);

  const fetchRiders = async () => {
    setLoading(true);
    const { data } = await supabase.from('delivery_staff').select('*').order('created_at', { ascending: false });
    setRiders(data || []);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('id,assigned_driver_name,status,total_amount,created_at,updated_at,customer_name,customer_address').not('assigned_driver_name', 'is', null).order('created_at', { ascending: false }).limit(100);
    setOrders(data || []);
  };

  const riderStats = useMemo(() => {
    const map = {};
    riders.forEach(r => { map[r.name] = { claimed: 0, active: 0, completed: 0, cancelled: 0, revenue: 0, activeOrders: [], totalTime: 0, completedCount: 0 }; });
    orders.forEach(o => {
      if (!map[o.assigned_driver_name]) map[o.assigned_driver_name] = { claimed: 0, active: 0, completed: 0, cancelled: 0, revenue: 0, activeOrders: [], totalTime: 0, completedCount: 0 };
      const s = map[o.assigned_driver_name];
      s.claimed++;
      if (o.status === 'delivering') { s.active++; s.activeOrders.push(o); }
      if (o.status === 'completed' || o.status === 'delivered') { s.completed++; s.revenue += parseFloat(o.total_amount) || 0; s.completedCount++; if (o.created_at && o.updated_at) s.totalTime += (new Date(o.updated_at) - new Date(o.created_at)) / 60000; }
      if (o.status === 'cancelled') s.cancelled++;
    });
    return map;
  }, [riders, orders]);

  const totals = useMemo(() => {
    const t = { claimed: 0, completed: 0, active: 0, cancelled: 0, revenue: 0 };
    Object.values(riderStats).forEach(s => { t.claimed += s.claimed; t.completed += s.completed; t.active += s.active; t.cancelled += s.cancelled; t.revenue += s.revenue; });
    return t;
  }, [riderStats]);

  const avgTime = (riderName) => {
    const s = riderStats[riderName];
    if (!s || s.completedCount === 0) return null;
    return Math.round(s.totalTime / s.completedCount);
  };

  const resetForm = () => { setName(''); setPhone(''); setCommission(0); setTelegramUserId(''); setError(''); };

  const handleOpen = (r = null) => {
    if (r) { setEditing(r); setName(r.name); setPhone(r.phone); setCommission(r.commission || 0); setTelegramUserId(r.telegram_user_id || ''); }
    else { setEditing(null); resetForm(); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: name.trim(), phone: phone.trim(), commission: parseFloat(commission) || 0, telegram_user_id: telegramUserId.trim() || null };
      if (editing) await supabase.from('delivery_staff').update(payload).eq('id', editing.id);
      else await supabase.from('delivery_staff').insert(payload);
      await fetchRiders(); setShowForm(false); resetForm();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id, c) => { await supabase.from('delivery_staff').update({ is_active: !c }).eq('id', id); await fetchRiders(); };
  const handleDelete = async (id) => { await supabase.from('delivery_staff').delete().eq('id', id); await fetchRiders(); };

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading delivery staff…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Delivery Staff · {riders.length}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage riders, track deliveries & payments</p>
        </div>
        <button onClick={() => handleOpen()} className="rounded-xl bg-primary-500 text-white px-4 py-2 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[{l:'Active',v:totals.active,c:'text-cyan-600',icon:Activity},{l:'Completed',v:totals.completed,c:'text-emerald-600',icon:PackageCheck},{l:'Cancelled',v:totals.cancelled,c:'text-red-500',icon:XCircle},{l:'Revenue',v:formatCurrency(totals.revenue),c:'text-primary-600',icon:DollarSign},{l:'Total',v:totals.claimed,c:'text-slate-600',icon:Truck}].map(s => <div key={s.l} className="rounded-2xl border border-slate-200/60 bg-white p-4"><div className={`text-2xl font-bold ${s.c}`}>{s.v}</div><div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><s.icon className="h-3 w-3" />{s.l}</div></div>)}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Rider</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Active</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Done</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Rate</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Revenue</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Earnings</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Avg Time</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {riders.length === 0 ? <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">No delivery staff yet</td></tr> : riders.map(r => {
                const s = riderStats[r.name] || { claimed: 0, active: 0, completed: 0, cancelled: 0, revenue: 0, activeOrders: [] };
                const rate = s.claimed > 0 ? Math.round((s.completed / s.claimed) * 100) : 0;
                const avg = avgTime(r.name);
                const earnings = (r.commission || 0) > 0 ? s.completed * (r.commission || 0) : 0;
                const isOpen = expanded === r.id;
                return (
                  <>
                    <tr key={r.id} className="hover:bg-slate-50/50 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0"><Truck className="h-4.5 w-4.5 text-cyan-600" /></div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{r.name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">{r.phone ? <><Phone className="h-3 w-3" />{r.phone}</> : '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center"><span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{r.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{r.is_active ? 'Active' : 'Off'}</span></td>
                      <td className="px-4 py-3 text-center"><span className="font-bold text-cyan-600">{s.active}</span></td>
                      <td className="px-4 py-3 text-center"><span className="font-bold text-emerald-600">{s.completed}</span></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-10 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:rate+'%'}} /></div>
                          <span className="text-[10px] font-semibold text-slate-500">{rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(s.revenue)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{r.commission > 0 ? formatCurrency(earnings) : '—'}</td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400">{avg ? `~${avg}min` : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {s.active > 0 && <button onClick={() => setExpanded(isOpen ? null : r.id)} className="rounded-lg p-1.5 text-cyan-500 hover:bg-cyan-50"><ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>}
                          <button onClick={() => toggleActive(r.id, r.is_active)} className="rounded-lg p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity">{r.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}</button>
                          <button onClick={() => handleOpen(r)} className="rounded-lg p-1.5 text-slate-400 hover:text-primary-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('Delete?')) handleDelete(r.id); }} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && s.activeOrders.length > 0 && (
                      <tr key={`${r.id}-expanded`}>
                        <td colSpan={9} className="px-4 py-3 bg-cyan-50/30 border-t border-cyan-100">
                          <div className="flex items-center gap-1.5 text-[10px] text-cyan-600 font-bold mb-2"><Bike className="h-3.5 w-3.5" />Active Deliveries</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {s.activeOrders.map(o => (
                              <div key={o.id} className="rounded-lg bg-white border border-cyan-100 p-2.5">
                                <div className="flex items-center justify-between mb-0.5"><span className="text-xs font-semibold text-slate-700 truncate">{o.customer_name}</span><span className="text-xs font-bold text-cyan-600">{formatCurrency(o.total_amount)}</span></div>
                                <p className="text-[9px] text-slate-400 font-mono">#{o.id?.slice(0,8)}</p>
                                {o.customer_address && <p className="text-[9px] text-slate-400 truncate mt-0.5">{o.customer_address}</p>}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit' : 'Add'} Rider</h2><button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="h-5 w-5" /></button></div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Name *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Commission per Delivery ($)</label><input type="number" step="0.01" min="0" value={commission} onChange={e => setCommission(parseFloat(e.target.value) || 0)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Telegram User ID</label><div className="relative"><Send className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" value={telegramUserId} onChange={e => setTelegramUserId(e.target.value)} placeholder="579905843" className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div><p className="text-[10px] text-slate-400 mt-1">Delivery staff can then use /assigned in the bot</p></div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-primary-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
