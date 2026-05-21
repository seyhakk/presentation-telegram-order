import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/format';
import { cn } from '../utils/cn';
import ItemForm from './ItemForm';
import CategoryForm from './CategoryForm';
import { Plus, Edit2, Eye, EyeOff, Trash2, AlertTriangle, ImageOff, Loader2 } from 'lucide-react';

export default function MenuControl({ refreshKey }) {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [itemFilter, setItemFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('menu_items').select('*').order('display_order'),
      supabase.from('menu_categories').select('*').order('display_order')
    ]);
    if (!itemsRes.error) setItems(itemsRes.data || []);
    if (!catsRes.error) setCategories(catsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [refreshKey]);

  const toggleCatAvailable = async (cat) => {
    const newAvailable = cat.available === false ? true : false;
    const { error: catError } = await supabase.from('menu_categories').update({ available: newAvailable }).eq('id', cat.id);
    if (!catError) {
      await supabase.from('menu_items').update({ available: newAvailable }).eq('category_id', cat.id);
    }
    fetchAll();
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '—';
  };

  const itemsInCategory = (catId) => items.filter(i => i.category_id === catId).length;

  const filteredItems = items.filter(item => {
    if (categoryFilter !== 'all' && item.category_id !== categoryFilter) return false;
    if (itemFilter === 'visible') return item.available;
    if (itemFilter === 'hidden') return !item.available;
    if (itemFilter === 'low_stock') {
      const qty = item.stock_quantity ?? 100;
      const thr = item.low_stock_threshold ?? 5;
      return qty <= thr;
    }
    if (itemFilter === 'no_image') return !item.image_url && !item.image_emoji;
    if (itemFilter === 'no_category') return !item.category_id;
    return true;
  });

  const stats = {
    total: items.length,
    available: items.filter(i => i.available).length,
    hidden: items.filter(i => !i.available).length,
    lowStock: items.filter(i => {
      const q = i.stock_quantity ?? 100;
      return q <= (i.low_stock_threshold ?? 5);
    }).length,
    noImage: items.filter(i => !i.image_url && !i.image_emoji).length,
    noCategory: items.filter(i => !i.category_id).length,
    categories: categories.length,
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    }
  };

  const bulkAction = async (action) => {
    if (selectedItems.size === 0) return;
    setBulkSaving(true);
    try {
      const ids = [...selectedItems];
      if (action === 'show') {
        await supabase.from('menu_items').update({ available: true }).in('id', ids);
      } else if (action === 'hide') {
        await supabase.from('menu_items').update({ available: false }).in('id', ids);
      } else if (action === 'delete') {
        if (!confirm(`Delete ${ids.length} selected items?`)) return;
        await supabase.from('menu_items').delete().in('id', ids);
      }
      setSelectedItems(new Set());
      await fetchAll();
    } catch (err) {
      console.error('Bulk action failed:', err);
    } finally {
      setBulkSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading…</div>;

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-slate-800 tracking-tight">Menu Control</h3>

      {/* Summary Cards - clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button type="button" onClick={() => { setActiveTab('items'); setItemFilter('all'); setSelectedItems(new Set()); }} className="rounded-2xl border border-slate-200/60 bg-white p-3.5 text-center cursor-pointer hover:shadow-md transition-shadow"><div className="text-xl font-bold text-slate-700">{stats.total}</div><div className="text-xs text-slate-400">Total Items</div></button>
        <button type="button" onClick={() => { setActiveTab('items'); setItemFilter('visible'); setSelectedItems(new Set()); }} className="rounded-2xl border border-green-200 bg-green-50/50 p-3.5 text-center cursor-pointer hover:shadow-md transition-shadow"><div className="text-xl font-bold text-green-600">{stats.available}</div><div className="text-xs text-green-500">Available</div></button>
        <button type="button" onClick={() => { setActiveTab('items'); setItemFilter('hidden'); setSelectedItems(new Set()); }} className="rounded-2xl border border-slate-200/60 bg-white p-3.5 text-center cursor-pointer hover:shadow-md transition-shadow"><div className="text-xl font-bold text-slate-500">{stats.hidden}</div><div className="text-xs text-slate-400">Hidden</div></button>
        <button type="button" onClick={() => { setActiveTab('items'); setItemFilter('low_stock'); setSelectedItems(new Set()); }} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 text-center cursor-pointer hover:shadow-md transition-shadow"><div className="text-xl font-bold text-amber-600">{stats.lowStock}</div><div className="text-xs text-amber-500">Low Stock</div></button>
        <button type="button" onClick={() => { setActiveTab('items'); setItemFilter('no_image'); setSelectedItems(new Set()); }} className="rounded-2xl border border-slate-200/60 bg-white p-3.5 text-center cursor-pointer hover:shadow-md transition-shadow"><div className="text-xl font-bold text-slate-400">{stats.noImage}</div><div className="text-xs text-slate-400">No Image</div></button>
        <button type="button" onClick={() => { setActiveTab('items'); setItemFilter('no_category'); setSelectedItems(new Set()); }} className="rounded-2xl border border-red-200 bg-red-50/50 p-3.5 text-center cursor-pointer hover:shadow-md transition-shadow"><div className="text-xl font-bold text-red-500">{stats.noCategory}</div><div className="text-xs text-red-400">No Category</div></button>
        <button type="button" onClick={() => setActiveTab('categories')} className="rounded-2xl border border-slate-200/60 bg-white p-3.5 text-center cursor-pointer hover:shadow-md transition-shadow"><div className="text-xl font-bold text-slate-700">{stats.categories}</div><div className="text-xs text-slate-400">Categories</div></button>
      </div>

      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setSelectedItems(new Set()); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-semibold"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({itemsInCategory(cat.id)})</option>
                ))}
              </select>
              {/* Bulk Actions */}
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-3 py-1.5 border border-primary-200 animate-fade-in">
                  <span className="text-xs font-semibold text-primary-700">{selectedItems.size} selected</span>
                  <div className="h-4 w-px bg-primary-200" />
                  <button onClick={() => bulkAction('show')} disabled={bulkSaving} className="text-xs font-semibold text-green-600 hover:text-green-700 disabled:opacity-50 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Show
                  </button>
                  <button onClick={() => bulkAction('hide')} disabled={bulkSaving} className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50 flex items-center gap-1">
                    <EyeOff className="h-3 w-3" /> Hide
                  </button>
                  <button onClick={() => bulkAction('delete')} disabled={bulkSaving} className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                  {bulkSaving && <Loader2 className="h-3 w-3 animate-spin text-primary-500" />}
                </div>
              )}
            </div>
            <button onClick={() => { setEditItem(null); setShowItemForm(true); }} className="rounded-xl bg-primary-500 text-white px-4 py-2 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 transition-[background-color,transform,box-shadow,opacity] flex items-center gap-2"><Plus  className="h-4 w-4" /> New Item</button>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left"><th className="px-4 py-3 w-10"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" checked={selectedItems.size === filteredItems.length && filteredItems.length > 0} onChange={toggleSelectAll} /></th><th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Image</th><th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Name</th><th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Dine-in $</th><th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Delivery $</th><th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Category</th><th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th><th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 w-10">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No items match this filter</td></tr>
                  ) : filteredItems.map(item => {
                    const qty = item.stock_quantity ?? null;
                    const thr = item.low_stock_threshold ?? 5;
                    const isLowStock = qty !== null && qty <= thr;
                    const isOut = qty !== null && qty <= 0;
                    const noImage = !item.image_url && !item.image_emoji;
                    const noCategory = !item.category_id;
                    return (
                      <tr key={item.id} className={cn(!item.available && 'opacity-50', 'hover:bg-slate-50/80 transition-colors')}>
                        <td className="px-4 py-2.5"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" checked={selectedItems.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                        <td className="px-4 py-2.5">{item.image_url ? <img src={item.image_url} alt={item.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><ImageOff  className="h-4 w-4 text-slate-300" /></div>}</td>
                        <td className="px-4 py-2.5"><div><p className="font-semibold text-slate-800">{item.name}</p>{item.description && <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{item.description}</p>}<div className="flex items-center gap-1.5 mt-1">{noImage && <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded font-medium">No image</span>}{noCategory && <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium">No category</span>}{isOut && <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5"><AlertTriangle  className="h-2.5 w-2.5" /> Out</span>}{isLowStock && !isOut && <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Low</span>}</div></div></td>
                        <td className="px-4 py-2.5 font-medium">{formatCurrency(item.price_pickup ?? item.price)}</td>
                        <td className="px-4 py-2.5 font-medium">{formatCurrency(item.price_delivery ?? item.price)}</td>
                        <td className="px-4 py-2.5 text-slate-500">{getCategoryName(item.category_id)}</td>
                        <td style={{fontVariantNumeric: "tabular-nums"}} className="px-4 py-2.5">
                        {qty !== null ? <span className={cn('font-mono text-xs font-bold', isOut ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-500')}>{qty}</span> : <span className="text-xs text-slate-300">—</span>}</td>
                        <td className="px-4 py-2.5"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.available ? 'bg-accent-50 text-accent-600' : 'bg-red-50 text-red-500'}`}>{item.available ? 'Available' : 'Hidden'}</span></td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-1"><button onClick={() => { setEditItem(item); setShowItemForm(true); }} aria-label="Edit item" className="rounded-lg p-1.5 text-slate-400 hover:text-primary-500 hover:bg-slate-100 transition-colors"><Edit2  className="h-3.5 w-3.5" aria-hidden="true" /></button><button onClick={async () => { await supabase.from('menu_items').update({ available: item.available === false ? true : false }).eq('id', item.id); fetchAll(); }} aria-label={item.available ? 'Hide item' : 'Show item'} className="rounded-lg p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors">{item.available ? <EyeOff  className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye  className="h-3.5 w-3.5" aria-hidden="true" />}</button><button onClick={async () => { if (confirm(`Delete "${item.name}"?`)) { await supabase.from('menu_items').delete().eq('id', item.id); fetchAll(); } }} aria-label="Delete item" className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"><Trash2  className="h-3.5 w-3.5" aria-hidden="true" /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {showItemForm && <ItemForm item={editItem} categories={categories} onClose={() => { setShowItemForm(false); setEditItem(null); }} onSave={() => { setShowItemForm(false); setEditItem(null); fetchAll(); }} />}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button onClick={() => { setEditCat(null); setShowCatForm(true); }} className="rounded-xl bg-primary-500 text-white px-4 py-2 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 transition-[background-color,transform,box-shadow,opacity] flex items-center gap-2"><Plus  className="h-4 w-4" /> New Category</button>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left"><th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Name</th><th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Items</th><th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Order</th><th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th><th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {categories.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No categories yet</td></tr>
                  ) : categories.map(cat => {
                    const count = itemsInCategory(cat.id);
                    return (
                      <tr key={cat.id} className={cn(cat.available === false && 'opacity-50', 'hover:bg-slate-50/80 transition-colors')}>
                        <td className="px-5 py-3"><span className="font-semibold text-slate-800">{cat.name}</span></td>
                        <td className="px-5 py-3"><span className={cn('font-mono text-sm font-bold', count === 0 ? 'text-slate-300' : 'text-slate-600')}>{count}</span><span className="text-xs text-slate-400 ml-1">items</span></td>
                        <td className="px-5 py-3 text-slate-500">{cat.display_order}</td>
                        <td className="px-5 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cat.available !== false ? 'bg-accent-50 text-accent-600' : 'bg-red-50 text-red-500'}`}>{cat.available !== false ? 'Visible' : 'Hidden'}</span></td>
                        <td className="px-5 py-3"><div className="flex items-center gap-1.5"><button onClick={() => { setEditCat(cat); setShowCatForm(true); }} aria-label="Edit category" className="rounded-lg p-2 text-slate-400 hover:text-primary-500 hover:bg-slate-100 transition-colors"><Edit2  className="h-4 w-4" aria-hidden="true" /></button><button onClick={() => toggleCatAvailable(cat)} aria-label={cat.available !== false ? 'Hide category' : 'Show category'} className="rounded-lg p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors">{cat.available !== false ? <EyeOff  className="h-4 w-4" aria-hidden="true" /> : <Eye  className="h-4 w-4" aria-hidden="true" />}</button><button onClick={async () => { if (confirm(`Delete "${cat.name}"? All items in this category will also be deleted.`)) { await supabase.from('menu_categories').delete().eq('id', cat.id); fetchAll(); } }} aria-label="Delete category" className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"><Trash2  className="h-4 w-4" aria-hidden="true" /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {showCatForm && <CategoryForm category={editCat} onClose={() => { setShowCatForm(false); setEditCat(null); }} onSave={() => { setShowCatForm(false); setEditCat(null); fetchAll(); }} />}
        </div>
      )}
    </div>
  );
}