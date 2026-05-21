import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/format';
import { cn } from '../utils/cn';
import { DollarSign, Clock, ArrowUpRight, ArrowDownRight,
  ShoppingBag, ArrowRight, Truck, Store, Bike, CheckCircle, UserCheck, Wallet, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BLUE = '#3b82f6';
const GREEN = '#22c55e';
const CYAN = '#06b6d4';
const PURPLE = '#8b5cf6';
const AMBER = '#f59e0b';

function StatCard({ title, value, trend, trendUp, icon: Icon, color, gradient, delay, href, onNavigate }) {
  return (
    <button
      onClick={href ? () => onNavigate('orders', href) : undefined}
      className={cn('w-full text-left rounded-2xl border border-slate-200/60 bg-white shadow-sm p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer', delay)} title={title}>
      <div className={cn('absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10', gradient)} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-3xl font-bold tracking-tight text-slate-800 mt-1">{value}</h3>
      {trend != null && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${trendUp ? 'bg-accent-50 text-accent-600' : 'bg-red-50 text-red-500'}`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-400">vs last week</span>
        </div>
      )}
      <div className={cn('absolute top-4 right-4 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg', gradient)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-slate-100"><div className={cn('h-full rounded-full bg-gradient-to-r', gradient)} style={{ width: '75%' }} /></div>
      <ArrowRight className="absolute top-3 right-3 h-4 w-4 text-primary-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export default function Dashboard({ refreshKey, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalOrders: 0, deliveryRevenue: 0, pickupRevenue: 0, aov: 0, active: 0, pickup: 0, delivery: 0 });
  const [trends, setTrends] = useState({ ordersTrend: null, ordersUp: true, deliveryTrend: null, deliveryUp: true, pickupTrend: null, pickupUp: true });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [topRiders, setTopRiders] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [activeShifts, setActiveShifts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [sinceLogin, setSinceLogin] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const weekBefore = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];

      const [allRes, recentRes, thisWeekRes, lastWeekRes] = await Promise.all([
        supabase.from('orders').select('id,total_amount,status,created_at,order_type'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('orders').select('id,total_amount,order_type').gte('created_at', lastWeek).lt('created_at', today + 'T23:59:59'),
        supabase.from('orders').select('id,total_amount,order_type').gte('created_at', weekBefore).lt('created_at', lastWeek),
      ]);

      const all = allRes.data || [];
      const active = all.filter(o => ['pending', 'confirmed', 'delivering', 'dining'].includes(o.status)).length;
      const pickup = all.filter(o => o.order_type === 'dine_in').length;
      const delivery = all.filter(o => o.order_type === 'delivery').length;
      const deliveryRev = all.filter(o => o.order_type === 'delivery').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
      const pickupRev = all.filter(o => o.order_type === 'dine_in').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
      const rev = deliveryRev + pickupRev;
      const aov = all.length > 0 ? rev / all.length : 0;

      const tw = thisWeekRes.data || [];
      const lw = lastWeekRes.data || [];
      const twDel = tw.filter(o => o.order_type === 'delivery').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
      const lwDel = lw.filter(o => o.order_type === 'delivery').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
      const twPick = tw.filter(o => o.order_type === 'dine_in').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
      const lwPick = lw.filter(o => o.order_type === 'dine_in').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
      const ordersTrend = lw.length > 0 ? Math.round(((tw.length - lw.length) / lw.length) * 100) : null;
      const deliveryTrend = lwDel > 0 ? Math.round(((twDel - lwDel) / lwDel) * 100) : null;
      const pickupTrend = lwPick > 0 ? Math.round(((twPick - lwPick) / lwPick) * 100) : null;

      setTrends({ ordersTrend, ordersUp: ordersTrend >= 0, deliveryTrend, deliveryUp: deliveryTrend >= 0, pickupTrend, pickupUp: pickupTrend >= 0 });
      setStats({ totalOrders: all.length, deliveryRevenue: deliveryRev, pickupRevenue: pickupRev, aov, active, pickup, delivery });
      setRecentOrders(recentRes.data || []);

      // 7-day revenue chart: delivery vs pickup
      const days = [];
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split('T')[0]); }
      const chartRes = await Promise.all(days.map(async d => {
        const { data } = await supabase.from('orders').select('total_amount,order_type').gte('created_at', d).lt('created_at', d + 'T23:59:59');
        const del = (data || []).filter(o => o.order_type === 'delivery').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
        const pic = (data || []).filter(o => o.order_type === 'dine_in').reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
        return { day: new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' }), delivery: Math.round(del), pickup: Math.round(pic) };
      }));
      setRevenueChart(chartRes);

      // Top riders from completed deliveries
      const completedDeliveries = all.filter(o => o.order_type === 'delivery' && o.assigned_driver_name && (o.status === 'completed' || o.status === 'delivered'));
      const riderMap = {};
      completedDeliveries.forEach(o => {
        const k = o.assigned_driver_name;
        if (!riderMap[k]) riderMap[k] = { name: k, count: 0, revenue: 0 };
        riderMap[k].count++;
        riderMap[k].revenue += parseFloat(o.total_amount) || 0;
      });
      setTopRiders(Object.values(riderMap).sort((a, b) => b.count - a.count).slice(0, 5));

      // Top items
      const { data: items } = await supabase.from('order_items').select('item_name,quantity,menu_item_id');
      if (items) {
        const map = {};
        items.forEach(i => { const k = i.menu_item_id || i.item_name; if (!map[k]) map[k] = { name: i.item_name || 'Unknown', count: 0 }; map[k].count += (i.quantity || 1); });
        setTopItems(Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5));
      }

      // Active shifts (staff clocked in)
      const { data: shifts } = await supabase.from('cash_shifts').select('id,user_name,opened_at').eq('status', 'open').order('opened_at');
      setActiveShifts(shifts || []);

      // Pending orders for quick actions
      const { data: pending } = await supabase.from('orders').select('id,customer_name,total_amount,order_type,created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
      setPendingOrders(pending || []);

      // Since last login
      const user = (await supabase.from('users').select('last_login').eq('id', (JSON.parse(localStorage.getItem('admin_user') || '{}')).id).maybeSingle()).data;
      if (user?.last_login) {
        const since = new Date(user.last_login).toISOString();
        const { data: newOrders } = await supabase.from('orders').select('id,total_amount').gte('created_at', since);
        const { data: newReservations } = await supabase.from('reservations').select('id').gte('created_at', since);
        const newRevenue = (newOrders || []).reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
        const newOrderCount = (newOrders || []).length;
        const newResCount = (newReservations || []).length;
        setSinceLogin({ orders: newOrderCount, revenue: newRevenue, reservations: newResCount, since: user.last_login });
      }
    } catch (err) { setError(err.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [refreshKey]);

  const quickApprove = async (orderId) => {
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId);
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading dashboard&hellip;</div>;

  return (
    <div className="space-y-5">
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard onNavigate={onNavigate} href={null} title="Total Orders" value={stats.totalOrders} trend={trends.ordersTrend} trendUp={trends.ordersUp} icon={ShoppingBag} color={BLUE} gradient="bg-gradient-to-br from-blue-500 to-blue-700" delay="animate-fade-in-delay-1" />
        <StatCard onNavigate={onNavigate} href={{ order_type: 'delivery' }} title="Delivery Revenue" value={formatCurrency(stats.deliveryRevenue)} trend={trends.deliveryTrend} trendUp={trends.deliveryUp} icon={Truck} color={CYAN} gradient="bg-gradient-to-br from-cyan-400 to-cyan-600" delay="animate-fade-in-delay-2" />
        <StatCard onNavigate={onNavigate} href={{ order_type: 'dine_in' }} title="Dine-in Revenue" value={formatCurrency(stats.pickupRevenue)} trend={trends.pickupTrend} trendUp={trends.pickupUp} icon={Store} color={GREEN} gradient="bg-gradient-to-br from-emerald-400 to-emerald-600" delay="animate-fade-in-delay-3" />
        <StatCard onNavigate={onNavigate} href={{ date: 'today' }} title="Avg Order" value={formatCurrency(stats.aov)} icon={DollarSign} color={PURPLE} gradient="bg-gradient-to-br from-violet-500 to-violet-700" delay="animate-fade-in-delay-4" />
        <StatCard onNavigate={onNavigate} href={{ status: 'pending' }} title="Active" value={stats.active} icon={Clock} color={AMBER} gradient="bg-gradient-to-br from-amber-400 to-amber-600" delay="animate-fade-in-delay-5" />
      </div>

      {/* Since last login banner */}
      {sinceLogin && (
        <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/80 shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-800">Since your last login</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                {sinceLogin.orders} new orders · {formatCurrency(sinceLogin.revenue)} revenue · {sinceLogin.reservations} new reservations
              </p>
            </div>
          </div>
          <span className="text-[10px] text-indigo-400 font-mono">{new Date(sinceLogin.since).toLocaleString()}</span>
        </div>
      )}

      {/* Staff Status + Pending Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Staff Status */}
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">Staff on Shift</h3>
          </div>
          {activeShifts.length === 0 ? (
            <p className="text-sm text-slate-400">No one clocked in</p>
          ) : (
            <div className="space-y-2">
              {activeShifts.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">{s.user_name}</span>
                  </div>
                  <span className="text-xs text-emerald-600">Since {new Date(s.opened_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Quick Actions */}
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">Pending Orders</h3>
            </div>
            {pendingOrders.length > 0 && (
              <button onClick={() => onNavigate('orders')} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">View all</button>
            )}
          </div>
          {pendingOrders.length === 0 ? (
            <p className="text-sm text-slate-400">No pending orders — all clear!</p>
          ) : (
            <div className="space-y-2">
              {pendingOrders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-slate-700 truncate">{o.customer_name || 'Guest'}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(o.total_amount)} · {o.order_type}</p>
                  </div>
                  <button
                    onClick={() => quickApprove(o.id)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-600"
                  >
                    <CheckCircle className="h-3 w-3" /> Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart: Delivery vs Dine-in */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">Revenue — Delivery vs Dine-in (7 days)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={revenueChart.length > 0 ? revenueChart : daysFallback}>
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} formatter={(v, name) => ['$' + v, name === 'delivery' ? 'Delivery' : 'Dine-in']} />
            <Legend iconType="rect" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="delivery" fill={CYAN} radius={[4, 4, 0, 0]} barSize={28} />
            <Bar dataKey="pickup" fill={GREEN} radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom: Recent + Popular + Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Recent Orders</h3>
            <button onClick={() => onNavigate('orders')} className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline flex items-center gap-1">View All →</button>
          </div>
          <div className="divide-y divide-slate-50 max-h-[340px] overflow-y-auto">
            {recentOrders.length === 0 ? <div className="px-6 py-8 text-center text-sm text-slate-400">No orders yet</div> : recentOrders.map(o => (
              <button key={o.id} className="w-full text-left px-6 py-3 flex items-center justify-between hover:bg-slate-50/80" onClick={() => onNavigate('orders')}>
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-semibold text-slate-800 truncate">{o.customer_name || 'Guest'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(o.total_amount)} <span className="ml-1">{o.order_type === 'delivery' ? <Truck className="h-3 w-3 inline text-cyan-500" /> : <Store className="h-3 w-3 inline text-emerald-500" />}</span></p>
                </div>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase flex-shrink-0', o.status === 'completed' ? 'bg-accent-50 text-accent-600' : o.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-primary-600')}>{o.status}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Popular Items</h3>
            <button onClick={() => onNavigate('menu')} className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline flex items-center gap-1">View All →</button>
          </div>
          <div className="divide-y divide-slate-50">
            {topItems.length === 0 ? <div className="px-6 py-8 text-center text-sm text-slate-400">No data yet</div> : topItems.map((item, i) => (
              <div key={item.name} className="px-6 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50/80" onClick={() => onNavigate('menu')}>
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-sm font-medium text-slate-700 flex-1 truncate">{item.name}</span>
                <span className="text-xs font-semibold text-slate-400">{item.count}x sold</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Top Riders</h3>
            <button onClick={() => onNavigate('riders')} className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline flex items-center gap-1">View All →</button>
          </div>
          <div className="divide-y divide-slate-50">
            {topRiders.length === 0 ? <div className="px-6 py-8 text-center text-sm text-slate-400">No deliveries yet</div> : topRiders.map((r, i) => (
              <div key={r.name} className="px-6 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50/80" onClick={() => onNavigate('riders')}>
                <span className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.count} deliveries · {formatCurrency(r.revenue)}</p>
                </div>
                <Bike className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const daysFallback = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({ day: d, delivery: 0, pickup: 0 }));
