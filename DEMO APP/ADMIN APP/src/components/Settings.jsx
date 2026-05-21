import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { clearRoutingCache } from '../lib/notifications';
import { getCurrentUser } from '../lib/auth';
import { Save, Check, Loader2, Store, Receipt, CreditCard, Truck, Clock, Globe, Cog, Settings2, DollarSign, Send, UserCheck } from 'lucide-react';

const NAV = [
  { id: 'general', label: 'General', icon: Store },
  { id: 'pricing', label: 'Pricing & Tax', icon: DollarSign },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'telegram-reports', label: 'Push Notifications', icon: Send },
  { id: 'display', label: 'Display', icon: Settings2 },
  { id: 'advanced', label: 'Advanced', icon: Cog },
];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});

  useEffect(() => { fetchSettings(); }, []);

  const DEFAULTS = {
    restaurant_name: '', restaurant_phone: '', restaurant_address: '',
    currency_symbol: '$', timezone: 'Asia/Phnom_Penh',
    tax_name: 'VAT', tax_rate: '', service_charge: '',
    delivery_price: '', free_delivery_threshold: '', min_order_amount: '',
    order_prefix: 'ORD-', auto_confirm: false,
    accept_cash: 'true', accept_card: 'false', accept_qr: 'false',
    alert_phone: '', alert_email: '',
    open_time: '', close_time: '',
    receipt_footer: '', receipt_header: '',
    tg_pickup_url: '', tg_delivery_url: '',
    tg_delivery_group: '', tg_delivery_bot_token: '',
    tg_pickup_bot_token: '',
    report_bot_token: '',
    bot_username: 'systemaadmin_bot',
    default_low_threshold: '5', items_per_page: '50',
  };

  const get = (key) => settings[key] ?? DEFAULTS[key] ?? '';
  const getBool = (key) => (settings[key] ?? DEFAULTS[key] ?? 'false') === 'true';
  const set = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('app_settings').select('key,value');
      if (data) {
        const map = { ...DEFAULTS };
        data.forEach(d => { map[d.key] = d.value; });
        setSettings(map);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const ops = Object.entries(settings).map(([k, v]) => {
        const val = typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v);
        return saveSetting(k, val);
      });
      await Promise.all(ops);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const saveSetting = async (key, value) => {
    const { data: exist } = await supabase.from('app_settings').select('id').eq('key', key).maybeSingle();
    if (exist) await supabase.from('app_settings').update({ value }).eq('id', exist.id);
    else await supabase.from('app_settings').insert({ key, value });
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading settings…</div>;

  const Input = ({ label, desc, value, onChange, type = 'text', placeholder, ...rest }) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...rest} />
      {desc && <p className="text-[10px] text-slate-400 mt-1">{desc}</p>}
    </div>
  );

  const Toggle = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div><p className="text-sm font-medium text-slate-700">{label}</p>{desc && <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>}</div>
      <button onClick={() => onChange(!checked)} className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Settings</h3>
          <p className="text-xs text-slate-400 mt-0.5">Configure your restaurant operations</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="rounded-xl bg-indigo-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-indigo-600 shadow-md shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-4">{error}</div>}

      <div className="flex gap-5">
        <div className="w-48 flex-shrink-0 hidden sm:block">
          <div className="space-y-0.5 sticky top-24">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setActiveTab(n.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === n.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                <n.icon className="h-4 w-4" />{n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="sm:hidden mb-4">
            <select value={activeTab} onChange={e => setActiveTab(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              {NAV.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-5 sm:p-6 space-y-5">
            {activeTab === 'general' && (
              <>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Store className="h-4 w-4 text-indigo-500" />Restaurant Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Restaurant Name" value={get('restaurant_name')} onChange={v => set('restaurant_name', v)} placeholder="Your Restaurant Name" />
                  <Input label="Phone Number" type="tel" value={get('restaurant_phone')} onChange={v => set('restaurant_phone', v)} placeholder="012 345 678" />
                  <div className="sm:col-span-2">
                    <Input label="Address" value={get('restaurant_address')} onChange={v => set('restaurant_address', v)} placeholder="St 154, Phnom Penh" />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3"><Clock className="h-4 w-4 text-indigo-500" />Business Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Opening Time" type="time" value={get('open_time')} onChange={v => set('open_time', v)} />
                    <Input label="Closing Time" type="time" value={get('close_time')} onChange={v => set('close_time', v)} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'pricing' && (
              <>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><DollarSign className="h-4 w-4 text-indigo-500" />Pricing & Tax</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Currency Symbol" value={get('currency_symbol')} onChange={v => set('currency_symbol', v)} placeholder="$" desc="Shown throughout the app" />
                  <Input label="Tax Name" value={get('tax_name')} onChange={v => set('tax_name', v)} placeholder="VAT" />
                  <Input label="Tax Rate (%)" type="number" step="0.01" value={get('tax_rate')} onChange={v => set('tax_rate', v)} placeholder="10" />
                  <Input label="Service Charge (%)" type="number" step="0.01" value={get('service_charge')} onChange={v => set('service_charge', v)} placeholder="5" />
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3"><CreditCard className="h-4 w-4 text-indigo-500" />Payment Methods</h4>
                  <div>
                    <Toggle label="Accept Cash" checked={getBool('accept_cash')} onChange={v => set('accept_cash', v ? 'true' : 'false')} />
                    <Toggle label="Accept Card" checked={getBool('accept_card')} onChange={v => set('accept_card', v ? 'true' : 'false')} />
                    <Toggle label="Accept QR / Banking" checked={getBool('accept_qr')} onChange={v => set('accept_qr', v ? 'true' : 'false')} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'delivery' && (
              <>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Truck className="h-4 w-4 text-indigo-500" />Delivery Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Delivery Fee ($)" type="number" step="0.01" value={get('delivery_price')} onChange={v => set('delivery_price', v)} placeholder="2.50" />
                  <Input label="Free Delivery Over ($)" type="number" step="0.01" value={get('free_delivery_threshold')} onChange={v => set('free_delivery_threshold', v)} placeholder="30" />
                  <Input label="Minimum Order ($)" type="number" step="0.01" value={get('min_order_amount')} onChange={v => set('min_order_amount', v)} placeholder="5" />
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <Toggle label="Auto-confirm New Orders" desc="Orders go directly to Confirmed status" checked={getBool('auto_confirm')} onChange={v => set('auto_confirm', v ? 'true' : 'false')} />
                </div>
              </>
            )}

            {activeTab === 'telegram-reports' && (
              <>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Send className="h-4 w-4 text-indigo-500" />Push Notifications</h4>
                <p className="text-xs text-slate-400 -mt-2 mb-4">Receive instant order alerts and daily reports via Telegram</p>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-6 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-4">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://t.me/${get('bot_username')}?start=start`} alt="Scan to open bot" className="w-56 h-56" />
                    </div>
                    <p className="text-base font-semibold text-slate-700">@{get('bot_username')}</p>
                    <p className="text-xs text-slate-400 text-center mt-1 mb-3">Scan to enable push notifications</p>
                    <a href={`https://t.me/${get('bot_username')}?start=start`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">Open in Telegram →</a>
                  </div>

                  <button
                    onClick={async () => {
                      const tgId = getCurrentUser()?.telegram_user_id;
                      if (!tgId) { alert('Please scan QR code first to link your Telegram!'); return; }
                      const btn = document.activeElement;
                      btn.disabled = true;
                      btn.innerHTML = '<span class="animate-spin">⏳</span> Sending...';
                      try {
                        const res = await fetch('/api/send-telegram', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            chat_id: tgId,
                            text: `<b>✅ Test Notification</b>\n\nPush notifications are now enabled!\n\nYou'll receive daily sales reports and instant order alerts to this chat.`,
                            parse_mode: 'HTML'
                          })
                        });
                        const data = await res.json();
                        if (data.success) alert('Test notification sent successfully!');
                        else alert('Failed: ' + (data.error || 'Unknown error'));
                      } catch (e) { alert('Error: ' + e.message); }
                      btn.disabled = false;
                      btn.innerHTML = 'Send Test Notification';
                    }}
                    className="w-full rounded-xl bg-emerald-500 text-white px-4 py-3 text-sm font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" /> Send Test Notification
                  </button>

                  <NotificationRules />
                  <AutoReport />
                  <LinkedUsersList />
                </div>
              </>
            )}

            {activeTab === 'display' && (
              <>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Receipt className="h-4 w-4 text-indigo-500" />Receipt & Display</h4>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="Order Number Prefix" value={get('order_prefix')} onChange={v => set('order_prefix', v)} placeholder="ORD-" />
                  <Input label="Receipt Header" value={get('receipt_header')} onChange={v => set('receipt_header', v)} placeholder="OYSTER HOUSE" desc="Top of printed/digital receipts" />
                  <Input label="Receipt Footer" value={get('receipt_footer')} onChange={v => set('receipt_footer', v)} placeholder="Thank you for your order!" desc="Bottom of printed/digital receipts" />
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3"><Globe className="h-4 w-4 text-indigo-500" />Localization</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Timezone" value={get('timezone')} onChange={v => set('timezone', v)} placeholder="Asia/Phnom_Penh" />
                    <Input label="Items Per Page" type="number" min="10" value={get('items_per_page')} onChange={v => set('items_per_page', v)} placeholder="50" />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'advanced' && (
              <>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Cog className="h-4 w-4 text-indigo-500" />Advanced</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Default Low Stock Threshold" type="number" value={get('default_low_threshold')} onChange={v => set('default_low_threshold', v)} placeholder="5" desc="Applied to new menu items" />
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">System Info</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-slate-400">Supabase Project</span>
                    <span className="font-mono text-xs text-slate-500 text-right">onvhmwjhiydhzirfcatp</span>
                    <span className="text-slate-400">Admin Panel</span>
                    <span className="font-mono text-xs text-slate-500 text-right">v2.0.0</span>
                    <span className="text-slate-400">Connected Apps</span>
                    <span className="font-mono text-xs text-slate-500 text-right">Dine-in · Delivery · Bot</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AutoReport() {
  const [sending, setSending] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-700">Auto Daily Report</h4>
          <p className="text-xs text-slate-400 mt-0.5">Send scheduled daily report to all admin & managers</p>
        </div>
        <button
          onClick={async () => {
            setSending(true);
            try {
              const res = await fetch('/api/send-daily-report', { method: 'POST' });
              const data = await res.json();
              if (data.ok) alert(`Report sent to ${data.sent_to} users!`);
              else alert('Failed: ' + (data.error || 'Unknown'));
            } catch (e) { alert('Error: ' + e.message); }
            setSending(false);
          }}
          disabled={sending}
          className="rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 disabled:opacity-60 flex items-center gap-2"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Sending...' : 'Send Now'}
        </button>
      </div>
    </div>
  );
}

function LinkedUsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tgProfiles, setTgProfiles] = useState({});
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    async function fetchLinkedUsers() {
      const { data } = await supabase.from('users').select('id, username, full_name, telegram_user_id, role').not('telegram_user_id', 'is', null).order('full_name');
      setUsers(data || []);
      setLoading(false);
      for (const u of (data || [])) {
        if (u.telegram_user_id) {
          try {
            const res = await fetch('/api/get-telegram-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: u.telegram_user_id }) });
            const result = await res.json();
            if (result.success) setTgProfiles(prev => ({ ...prev, [u.telegram_user_id]: result.data }));
          } catch (e) {}
        }
      }
    }
    fetchLinkedUsers();
  }, []);

  const unlinkUser = async (userId, username) => {
    if (!isAdmin) { alert('Only admins can unlink users.'); return; }
    if (!confirm(`Disconnect ${username} from the bot?`)) return;
    await supabase.from('users').update({ telegram_user_id: null }).eq('id', userId);
    setUsers(users.filter(u => u.id !== userId));
  };

  if (loading) return <div className="text-sm text-slate-400 py-4">Loading...</div>;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-indigo-500" />
        <h4 className="text-sm font-bold text-slate-700">Linked Users ({users.length})</h4>
      </div>
      {users.length === 0 ? (
        <p className="text-sm text-slate-400">No users have linked their Telegram yet.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => {
            const tg = tgProfiles[u.telegram_user_id];
            return (
              <div key={u.id} className="p-3 rounded-xl bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                      {(u.full_name || u.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{u.full_name || u.username}</p>
                      <p className="text-xs text-slate-400">@{u.username} · {u.role}</p>
                    </div>
                  </div>
                  {isAdmin ? (
                    <button onClick={() => unlinkUser(u.id, u.username)} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1">Unlink</button>
                  ) : (
                    <span className="text-xs text-slate-400 px-2 py-1">Admin only</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 pl-11">
                  <span>ID: <code className="bg-white px-1 rounded border">{u.telegram_user_id}</code></span>
                  {tg && (
                    <>
                      {tg.username && <span>· @{tg.username}</span>}
                      {tg.first_name && <span>· {tg.first_name}{tg.last_name ? ' ' + tg.last_name : ''}</span>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const NOTIF_RULES = [
  { id: 'reservation', label: '📅 New Reservation', roles: ['admin', 'manager'] },
  { id: 'order_cancelled', label: '🚫 Order Cancelled', roles: ['admin', 'manager', 'order_man'] },
  { id: 'low_stock', label: '⚠️ Low Stock Alert', roles: ['admin', 'manager'] },
  { id: 'shift', label: '🟢 Shift Open/Close', roles: ['admin', 'manager'] },
];

const ALL_ROLES = [
  { id: 'admin', label: 'Admin', color: 'bg-amber-100 text-amber-700' },
  { id: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-700' },
  { id: 'order_man', label: 'Order Man', color: 'bg-emerald-100 text-emerald-700' },
];

function NotificationRules() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'notification_routing').maybeSingle();
      if (data?.value) { try { setConfig(JSON.parse(data.value)); } catch { setConfig(null); } }
    }
    load();
  }, []);

  const getRoles = (ruleId) => config?.[ruleId] || NOTIF_RULES.find(r => r.id === ruleId)?.roles || [];

  const toggleRole = (ruleId, roleId) => {
    setConfig(prev => {
      const current = prev ? { ...prev } : {};
      const roles = current[ruleId] ? [...current[ruleId]] : [...(NOTIF_RULES.find(r => r.id === ruleId)?.roles || [])];
      if (roles.includes(roleId)) { const updated = roles.filter(r => r !== roleId); current[ruleId] = updated.length ? updated : null; }
      else { current[ruleId] = [...roles, roleId]; }
      return current;
    });
  };

  const saveConfig = async () => {
    setSaving(true);
    const { data: exist } = await supabase.from('app_settings').select('id').eq('key', 'notification_routing').maybeSingle();
    const value = JSON.stringify(config || {});
    if (exist) await supabase.from('app_settings').update({ value }).eq('id', exist.id);
    else await supabase.from('app_settings').insert({ key: 'notification_routing', value });
    clearRoutingCache();
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-indigo-500" />
          <h4 className="text-sm font-bold text-slate-700">Notification Routing</h4>
        </div>
        <button onClick={saveConfig} disabled={saving} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-3 py-2 text-[10px] font-bold uppercase text-slate-400">Event</th>
              {ALL_ROLES.map(role => <th key={role.id} className="text-center px-2 py-2 text-[10px] font-bold uppercase text-slate-400">{role.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {NOTIF_RULES.map(rule => (
              <tr key={rule.id}>
                <td className="px-3 py-2.5 text-slate-700 text-xs">{rule.label}</td>
                {ALL_ROLES.map(role => {
                  const enabled = getRoles(rule.id).includes(role.id);
                  return (
                    <td key={role.id} className="px-2 py-2.5 text-center">
                      <button onClick={() => toggleRole(rule.id, role.id)}
                        className={`w-6 h-6 rounded-md border transition-all ${enabled ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-200'}`}>
                        {enabled && <Check className="h-3.5 w-3.5 text-white mx-auto" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}