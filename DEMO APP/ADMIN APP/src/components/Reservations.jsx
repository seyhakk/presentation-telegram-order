import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendEventNotification, formatNewReservation } from '../lib/notifications';
import { CalendarDays, Plus, X, Loader2, Phone, Users, Clock, FileText, ArrowRight, Edit2, Trash2 } from 'lucide-react';

const STATUS_CFG = {
  pending: { label: 'Pending', color: '#f59e0b', bg: 'bg-amber-50 text-amber-600' },
  confirmed: { label: 'Confirmed', color: '#3b82f6', bg: 'bg-blue-50 text-blue-600' },
  seated: { label: 'Seated', color: '#22c55e', bg: 'bg-green-50 text-green-600' },
  completed: { label: 'Completed', color: '#64748b', bg: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'bg-red-50 text-red-500' },
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState('19:00');
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchReservations(); }, [date]);

  const fetchReservations = async () => {
    setLoading(true);
    const { data } = await supabase.from('reservations').select('*').eq('reservation_date', date).order('reservation_time', { ascending: true });
    setReservations(data || []);
    setLoading(false);
  };

  const resetForm = () => { setName(''); setPhone(''); setGuests(2); setTime('19:00'); setNotes(''); setError(''); };

  const handleOpen = (r = null) => {
    if (r) { setEditing(r); setName(r.customer_name); setPhone(r.customer_phone); setGuests(r.guest_count); setTime(r.reservation_time.slice(0, 5)); setNotes(r.notes || ''); }
    else { setEditing(null); resetForm(); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!time) { setError('Time is required'); return; }
    setSaving(true); setError('');
    const payload = { customer_name: name.trim(), customer_phone: phone.trim(), party_size: guests, reservation_date: date, reservation_time: time, notes, status: 'pending' };
    try {
      if (editing) {
        await supabase.from('reservations').update(payload).eq('id', editing.id);
      } else {
        const { data: newRes } = await supabase.from('reservations').insert(payload).select().single();
        if (newRes) {
          await sendEventNotification('reservation', formatNewReservation({
            customer_name: name.trim(),
            phone: phone.trim(),
            reservation_date: date,
            reservation_time: time,
            party_size: guests,
            notes
          }));
        }
      }
      await fetchReservations();
      setShowForm(false);
      resetForm();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleStatus = async (id, status) => {
    await supabase.from('reservations').update({ status }).eq('id', id);
    await fetchReservations();
  };

  const handleDelete = async (id) => {
    await supabase.from('reservations').delete().eq('id', id);
    await fetchReservations();
  };

  const STATUS_ACTIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['seated', 'cancelled'],
    seated: ['completed'],
    completed: [],
    cancelled: [],
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading reservations…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Reservations</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage table bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
          <button onClick={() => handleOpen()} className="rounded-xl bg-primary-500 text-white px-4 py-2 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Booking
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {reservations.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No reservations for this date</p>
            <p className="text-xs text-slate-400 mt-1">Click "New Booking" to add one</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {reservations.map(r => (
              <div key={r.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${r.status === 'cancelled' ? 'opacity-60' : ''}`}>
                <div className="flex items-stretch">
                  <div className={`w-2 flex-shrink-0 ${r.status === 'pending' ? 'bg-amber-400' : r.status === 'confirmed' ? 'bg-blue-400' : r.status === 'seated' ? 'bg-green-400' : r.status === 'completed' ? 'bg-slate-400' : 'bg-red-400'}`} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                          {r.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{r.customer_name}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.guest_count} guests</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.reservation_time?.slice(0, 5)}</span>
                            {r.customer_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.customer_phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${r.status === 'pending' ? 'bg-amber-50 text-amber-600' : r.status === 'confirmed' ? 'bg-blue-50 text-blue-600' : r.status === 'seated' ? 'bg-green-50 text-green-600' : r.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-500'}`}>
                          {r.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpen(r)} className="rounded-lg p-1.5 text-slate-400 hover:text-primary-500 hover:bg-slate-100 transition-colors"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('Delete this reservation?')) handleDelete(r.id); }} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                    {r.notes && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                        <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />{r.notes}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(STATUS_ACTIONS[r.status] || []).map(s => (
                        <button key={s} onClick={() => handleStatus(r.id, s)} className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase border flex items-center gap-1 ${s === 'cancelled' ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          <ArrowRight className="h-2.5 w-2.5" />{STATUS_CFG[s]?.label || s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit Reservation' : 'New Reservation'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Guests</label>
                  <input type="number" min="1" max="50" value={guests} onChange={e => setGuests(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Time *</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none" />
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-primary-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
