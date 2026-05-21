import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, updateUser } from '../lib/auth';
import { sendEventNotification } from '../lib/notifications';
import { Save, Check, Loader2, User, Clock, History, Wallet, Camera, Phone, Mail, Send, ShieldAlert, CalendarCheck, Upload } from 'lucide-react';

export default function Profile() {
  const stored = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(stored);
  const fileRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: stored?.full_name || '',
    phone: stored?.phone || '',
    email: stored?.email || '',
    tgId: stored?.telegram_user_id || '',
  });

  const [avatar, setAvatar] = useState(stored?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [activeShift, setActiveShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [openAmount, setOpenAmount] = useState(0);
  const [closeAmount, setCloseAmount] = useState('');
  const [shiftNote, setShiftNote] = useState('');
  const [showOpen, setShowOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchShift();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').eq('id', stored?.id).maybeSingle();
    if (data) {
      const merged = { ...stored, ...data };
      localStorage.setItem('admin_user', JSON.stringify(merged));
      setUser(merged);
      setFormData(prev => ({
        fullName: prev.fullName || data.full_name || '',
        phone: prev.phone || data.phone || '',
        email: prev.email || data.email || '',
        tgId: prev.tgId || data.telegram_user_id || '',
      }));
      if (!avatar) setAvatar(data.avatar_url || null);
    }
    setLoading(false);
  };

  const fetchShift = async () => {
    try {
      const { data: open } = await supabase.from('cash_shifts').select('*').eq('user_id', stored?.id).eq('status', 'open').order('opened_at', { ascending: false }).limit(1);
      setActiveShift(open?.[0] || null);
      const { data: closed } = await supabase.from('cash_shifts').select('*').eq('user_id', stored?.id).eq('status', 'closed').order('closed_at', { ascending: false }).limit(10);
      setShiftHistory(closed || []);
    } catch (e) {}
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return user?.avatar_url || null;
    const ext = avatarFile.name.split('.').pop();
    const path = `avatars/${userId}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(path, avatarFile, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path);
    return urlData?.publicUrl || null;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [sendingReport, setSendingReport] = useState(false);

  const sendDailyReport = async () => {
    const tgId = formData.tgId;
    if (!tgId) {
      setError('Please set your Telegram ID first!');
      return;
    }

    setSendingReport(true);
    setError('');

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', today + 'T00:00:00')
        .lt(today + 'T23:59:59');

      const { data: lowStock } = await supabase
        .from('menu_items')
        .select('name, stock_quantity')
        .lte('stock_quantity', 5)
        .limit(5);

      const totalOrders = (orders || []).length;
      const totalRevenue = (orders || []).reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      const pickupOrders = (orders || []).filter(o => o.order_type === 'dine_in' || o.order_type === 'pickup').length;
      const deliveryOrders = (orders || []).filter(o => o.order_type === 'delivery').length;

      const itemsSold = {};
      (orders || []).forEach(order => {
        (order.order_items || []).forEach(item => {
          itemsSold[item.name] = (itemsSold[item.name] || 0) + (item.quantity || 1);
        });
      });
      const topItems = Object.entries(itemsSold)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => `${qty}x ${name}`).join('\n  • ');

      const currency = '$';
      const reportText = `📊 <b>Daily Report</b> - ${new Date().toLocaleDateString()}

<b>📦 Orders:</b> ${totalOrders} total
  • Dine-in: ${pickupOrders}
  • Delivery: ${deliveryOrders}

💰 <b>Revenue:</b> ${currency}${totalRevenue.toFixed(2)}

${topItems ? `🔥 <b>Top Items:</b>\n  • ${topItems}` : ''}

${lowStock?.length ? `⚠️ <b>Low Stock:</b>\n  • ${lowStock.map(i => i.name).join(', ')}` : ''}

⏰ Generated: ${new Date().toLocaleTimeString()}`;

      const res = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgId, text: reportText, parse_mode: 'HTML' })
      });
      const data = await res.json();
      
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err) {
      setError(err.message || 'Failed to send report');
    } finally {
      setSendingReport(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true); setError('');
    try {
      if (newPassword) {
        if (!oldPassword) throw new Error('Current password is required to change password');
        if (oldPassword !== user.password_hash) throw new Error('Current password is incorrect');
        if (newPassword.length < 4) throw new Error('New password must be at least 4 characters');
        if (newPassword !== confirmPassword) throw new Error('New passwords do not match');
      }

      let avatarUrl = user?.avatar_url || null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id);
      }

      const updates = {
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        telegram_user_id: formData.tgId,
        avatar_url: avatarUrl,
      };
      if (newPassword) updates.password_hash = newPassword;

      await updateUser(user.id, updates);

      const { data: fresh } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (fresh) localStorage.setItem('admin_user', JSON.stringify({ ...stored, ...fresh }));

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 2000);
      await fetchUserData();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const notifyManagersShift = async (type, shiftData) => {
    const name = formData.fullName || user?.username || 'Someone';
    const amount = type === 'open' ? shiftData?.opening_amount : shiftData?.closing_amount;
    const diff = shiftData?.difference;
    const msg = type === 'open'
      ? `🟢 <b>Shift Opened</b>\n\n👤 ${name}\n💰 Opening: $${amount}\n🕐 ${new Date().toLocaleTimeString()}`
      : `🔴 <b>Shift Closed</b>\n\n👤 ${name}\n💰 Closing: $${amount}\n📊 Difference: $${diff}\n🕐 ${new Date().toLocaleTimeString()}`;
    await sendEventNotification('shift', msg);
  };

  const openShift = async () => {
    setSaving(true); setError('');
    try {
      if (openAmount < 0) throw new Error('Enter a valid opening amount');
      const { data } = await supabase.from('cash_shifts').insert({
        user_id: user.id, user_name: formData.fullName || user.username,
        shift_type: 'cash', opening_amount: openAmount, status: 'open', notes: shiftNote
      }).select().single();
      setActiveShift(data);
      setShowOpen(false);
      setShiftNote('');
      setOpenAmount(0);
      await fetchShift();
      await notifyManagersShift('open', data);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const closeShift = async () => {
    if (!activeShift) return;
    const closeAmt = parseFloat(closeAmount);
    if (isNaN(closeAmt)) { setError('Enter a valid closing amount'); return; }
    setSaving(true); setError('');
    try {
      const diff = closeAmt - (activeShift.opening_amount || 0);
      await supabase.from('cash_shifts').update({
        closing_amount: closeAmt, difference: diff, status: 'closed',
        closed_at: new Date().toISOString(), notes: shiftNote || activeShift.notes
      }).eq('id', activeShift.id);
      setActiveShift(null);
      setCloseAmount('');
      setShiftNote('');
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      await fetchShift();
      await notifyManagersShift('close', { closing_amount: closeAmt, difference: diff });
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading profile…</div>;

  return (
    <div className="max-w-2xl space-y-5">
      <h3 className="text-lg font-bold text-slate-800">My Profile</h3>
      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">{error}</div>}

      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-5 space-y-5">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><User className="h-4 w-4 text-indigo-500" />Account Info</h4>

        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            {avatar ? (
              <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-slate-200">
                {(formData.fullName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
          <div>
            <p className="font-semibold text-slate-800">{formData.fullName || user?.username}</p>
            <p className="text-xs text-slate-400">@{user?.username} · {user?.role}</p>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold mt-1 flex items-center gap-1">
              <Upload className="h-3 w-3" />{avatar ? 'Change' : 'Upload'} photo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={formData.fullName} 
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="012 345 678"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Telegram User ID</label>
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.tgId} 
                    onChange={(e) => handleInputChange('tgId', e.target.value)}
                    placeholder="579905843"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                  />
                </div>
                <div className="flex items-center gap-3">
                  {formData.tgId && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('Disconnect Telegram from your account?')) return;
                        handleInputChange('tgId', '');
                        await supabase.from('users').update({ telegram_user_id: null }).eq('id', user?.id);
                        setSaved(true);
                        setTimeout(() => setSaved(false), 2000);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://t.me/systemaadmin_bot?start=start" 
                  alt="Scan to open bot"
                  className="w-20 h-20 rounded-lg border border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-indigo-500" />Change Password</h4>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
            <input 
              type="password" 
              value={oldPassword} 
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 4 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>
          </div>
        </div>
        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-500 flex items-center gap-1"><ShieldAlert className="h-3 w-3" />Passwords do not match</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={saveProfile} disabled={saving} className="rounded-xl bg-indigo-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-indigo-600 shadow-md shadow-indigo-500/30 disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Profile'}
        </button>

        <button 
          onClick={sendDailyReport} 
          disabled={sendingReport || !formData.tgId}
          className="rounded-xl bg-emerald-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-600 shadow-md shadow-emerald-500/30 disabled:opacity-60 flex items-center gap-2"
        >
          {sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sendingReport ? 'Sending...' : 'Send Daily Report'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Wallet className="h-4 w-4 text-indigo-500" />Cash Shift</h4>
          {activeShift ? (
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Open</span>
          ) : (
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">No active shift</span>
          )}
        </div>

        {activeShift ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Shift in progress</span>
                <span className="text-[10px] text-emerald-500 font-mono">Opened: {new Date(activeShift.opened_at).toLocaleString()}</span>
              </div>
              <div className="text-3xl font-bold text-emerald-700">{formatCurrency(activeShift.opening_amount)}</div>
              <p className="text-xs text-emerald-500 mt-1">Opening balance</p>
              {activeShift.notes && <p className="text-xs text-slate-500 mt-2 italic">"{activeShift.notes}"</p>}
            </div>
            <div className="space-y-3 pt-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Closing Amount *</label>
              <input type="number" step="0.01" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} placeholder="Enter final cash count"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              {closeAmount && activeShift.opening_amount && (
                <div className={`rounded-lg px-3 py-2 text-sm font-semibold ${parseFloat(closeAmount) > parseFloat(activeShift.opening_amount) ? 'bg-emerald-50 text-emerald-600' : parseFloat(closeAmount) < parseFloat(activeShift.opening_amount) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-600'}`}>
                  Difference: {formatCurrency(parseFloat(closeAmount) - parseFloat(activeShift.opening_amount))}{' '}
                  {parseFloat(closeAmount) > parseFloat(activeShift.opening_amount) ? '(over)' : parseFloat(closeAmount) < parseFloat(activeShift.opening_amount) ? '(short)' : '(balanced)'}
                </div>
              )}
              <button onClick={closeShift} disabled={saving || !closeAmount} className="w-full rounded-xl bg-indigo-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-600 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}Close Shift
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {showOpen ? (
              <>
                <input type="number" step="0.01" value={openAmount} onChange={e => setOpenAmount(parseFloat(e.target.value) || 0)} placeholder="Opening cash amount"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                <input value={shiftNote} onChange={e => setShiftNote(e.target.value)} placeholder="Shift notes (optional)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                <div className="flex gap-2">
                  <button onClick={() => setShowOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={openShift} disabled={saving} className="flex-1 rounded-xl bg-emerald-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}Open Shift
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setShowOpen(true)} className="w-full rounded-xl bg-emerald-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2">
                <CalendarCheck className="h-4 w-4" />Open New Shift
              </button>
            )}
          </div>
        )}
      </div>

      {shiftHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><History className="h-4 w-4 text-indigo-500" />Shift History</h4>
          <div className="space-y-2">
            {shiftHistory.map(s => {
              const diff = parseFloat(s.difference || 0);
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{new Date(s.closed_at).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-400">{new Date(s.opened_at).toLocaleTimeString()} - {new Date(s.closed_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">{formatCurrency(s.opening_amount)} → {formatCurrency(s.closing_amount)}</p>
                    <p className={`text-xs font-semibold ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>{diff > 0 ? '+' : ''}{formatCurrency(diff)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}