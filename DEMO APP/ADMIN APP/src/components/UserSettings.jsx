import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createUser, updateUser, deleteUser, getAllUsers, hasPermission } from '../lib/auth';
import { Plus, Trash2, Edit2, X, Loader2, Shield, Eye, EyeOff, User } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Orders' },
  { id: 'reports', label: 'Reports' },
  { id: 'stock', label: 'Inventory' },
  { id: 'menu', label: 'Menu' },
  { id: 'customers', label: 'Customers' },
  { id: 'riders', label: 'Delivery Staff' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
  { id: 'users', label: 'Users' },
];

export default function UserSettings({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [permissions, setPermissions] = useState({
    dashboard: true,
    orders: false,
    reports: false,
    stock: false,
    menu: false,
    customers: false,
    riders: false,
    reservations: false,
    profile: true,
    settings: false,
    users: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await getAllUsers();
    if (!error) setUsers(data);
    setLoading(false);
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('user');
    setPermissions({
      dashboard: true,
      orders: false,
      reports: false,
      stock: false,
      menu: false,
      customers: false,
      riders: false,
      reservations: false,
      profile: true,
      settings: false,
      users: false
    });
    setError('');
  };

  const handleOpenForm = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUsername(user.username);
      setPassword('');
      setFullName(user.full_name || '');
      setRole(user.role);
      setPermissions(user.permissions || {
        dashboard: true, orders: false, reports: false, stock: false, menu: false, customers: false, riders: false, reservations: false, profile: true, settings: false, users: false
      });
    } else {
      setEditingUser(null);
      resetForm();
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!editingUser && !password) {
      setError('Password is required');
      return;
    }
    if (role === 'user' && !hasPermission(currentUser, 'users')) {
      setError('You do not have permission to create users');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingUser) {
        const updates = { username: username.trim(), full_name: fullName.trim(), role };
        if (role === 'user') {
          updates.permissions = permissions;
        }
        if (password) {
          updates.password_hash = password;
        }
        const { error } = await updateUser(editingUser.id, updates);
        if (error) throw error;
      } else {
        const { error } = await createUser(username.trim(), password, fullName.trim(), role);
        if (error) throw error;
      }

      await fetchUsers();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    setSaving(true);
    const { error } = await deleteUser(userId);
    if (!error) {
      await fetchUsers();
    }
    setShowDeleteConfirm(null);
    setSaving(false);
  };

  const togglePermission = (tab) => {
    setPermissions(prev => ({ ...prev, [tab]: !prev[tab] }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading users…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">User Management</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage admin users and their permissions</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="rounded-xl bg-primary-500 text-white px-4 py-2 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 transition-[background-color,transform,box-shadow,opacity] flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New User
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">User</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Role</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Permissions</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Last Login</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No users yet</td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.full_name || user.username}</p>
                        <p className="text-xs text-slate-400">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : user.role === 'manager' ? 'bg-blue-100 text-blue-700' : user.role === 'order_man' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : null}
                      {user.role === 'order_man' ? 'Order Man' : user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {TABS.filter(t => t.id !== 'users').map(tab => {
                        const perms = user.role === 'admin' 
                          ? { dashboard: true, orders: true, reports: true, stock: true, menu: true, settings: true, users: true }
                          : (user.permissions || {});
                        return (
                          <span key={tab.id} className={`text-[10px] px-1.5 py-0.5 rounded ${perms[tab.id] ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                            {tab.label}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenForm(user)}
                        className="rounded-lg p-2 text-slate-400 hover:text-primary-500 hover:bg-slate-100 transition-colors"
                        aria-label="Edit user"
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setShowDeleteConfirm(user)}
                          className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                          aria-label="Delete user"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex overscroll-contain items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-y-auto">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{editingUser ? 'Edit User' : 'New User'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Username *</label>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{editingUser ? 'New Password (optional)' : 'Password *'}</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Role</label>
                <select
                  value={role} onChange={e => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                >
                  <option value="admin">Admin (full access)</option>
                  <option value="manager">Manager</option>
                  <option value="order_man">Order Man</option>
                  <option value="user">User (limited access)</option>
                </select>
              </div>

              {role !== 'admin' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TABS.filter(t => t.id !== 'users').map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => togglePermission(tab.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${permissions[tab.id] ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'}`}
                      >
                        {tab.label}
                        {permissions[tab.id] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
              <button
                type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button" onClick={handleSave} disabled={saving}
                className="flex-1 rounded-xl bg-primary-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex overscroll-contain items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete User?</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete @{showDeleteConfirm.username}? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm.id)}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                >
                  {saving ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}