import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2 } from 'lucide-react';

export default function ItemForm({ item, categories, onClose, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [pricePickup, setPricePickup] = useState(item?.price_pickup ?? item?.price ?? '');
  const [priceDelivery, setPriceDelivery] = useState(item?.price_delivery ?? item?.price ?? '');
  const [costPrice, setCostPrice] = useState(item?.cost_price ?? '');
  const [categoryId, setCategoryId] = useState(item?.category_id || (categories[0]?.id || ''));
  const [available, setAvailable] = useState(item?.available !== false);
  const [order, setOrder] = useState(item?.display_order ?? 0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image_url || '');
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const uploadImage = async () => {
    if (!imageFile) return item?.image_url || null;
    const fileName = `${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, imageFile, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      const payload = { name, description, price_pickup: parseFloat(pricePickup) || 0, price_delivery: parseFloat(priceDelivery) || 0, cost_price: parseFloat(costPrice) || 0, category_id: categoryId, image_url: imageUrl, available, display_order: parseInt(order) || 0 };
      if (item) { const { error } = await supabase.from('menu_items').update(payload).eq('id', item.id); if (error) throw error; }
      else { const { error } = await supabase.from('menu_items').insert(payload); if (error) throw error; }
      onSave();
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">{item ? 'Edit Item' : 'New Item'}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="item-name">Name</label><input id="item-name" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div>
          <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="item-desc">Description</label><input id="item-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="item-pickup">Dine-in Price ($)</label><input id="item-pickup" type="number" step="0.01" min="0" value={pricePickup} onChange={e => setPricePickup(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="item-delivery">Delivery Price ($)</label><input id="item-delivery" type="number" step="0.01" min="0" value={priceDelivery} onChange={e => setPriceDelivery(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="item-cost">Cost Price ($)</label>
            <input id="item-cost" type="number" step="0.01" min="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
            <p className="text-[10px] text-slate-400 mt-1">Your cost per unit — profit = price - cost</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="item-cat">Category</label>
            <select id="item-cat" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="item-order">Display Order</label><input id="item-order" type="number" value={order} onChange={e => setOrder(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" /></div>
          <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="item-image">Image</label><div className="flex items-center gap-3"><input id="item-image" type="file" accept="image/*" onChange={handleFileChange} className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm" />{imagePreview && <img src={imagePreview} alt="Preview" width={64} height={64} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />}</div></div>
          <label className="flex items-center gap-3 text-sm cursor-pointer"><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" />Available (visible to customers)</label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-primary-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 transition-colors flex items-center gap-2 disabled:opacity-60">{saving ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving…</> : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}