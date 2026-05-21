import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2 } from 'lucide-react';

export default function CategoryForm({ category, onClose, onSave }) {
  const [name, setName] = useState(category?.name || '');
  const [order, setOrder] = useState(category?.display_order ?? 0);
  const [available, setAvailable] = useState(category?.available !== false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, display_order: parseInt(order) || 0, available };
      if (category) { const { error } = await supabase.from('menu_categories').update(payload).eq('id', category.id); if (error) throw error; }
      else { const { error } = await supabase.from('menu_categories').insert(payload); if (error) throw error; }
      onSave();
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">{category ? 'Edit Category' : 'New Category'}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="cat-name">Name</label>
            <input id="cat-name" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="cat-order">Display Order</label>
            <input id="cat-order" type="number" value={order} onChange={e => setOrder(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
          </div>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" />
            Available (visible to customers)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-primary-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 transition-colors flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving…</> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}