import { supabase } from './supabase';

const USER_KEY = 'admin_user';

const DEFAULT_ADMIN_PERMISSIONS = {
  dashboard: true, orders: true, reports: true, stock: true,
  menu: true, dinein_security: true, customers: true, riders: true,
  reservations: true, profile: true, settings: true, users: true
};

const DEFAULT_MANAGER_PERMISSIONS = {
  dashboard: true, orders: true, reports: true, stock: true,
  menu: true, dinein_security: true, customers: true, riders: false,
  reservations: true, profile: true, settings: true, users: false
};

const DEFAULT_ORDER_MAN_PERMISSIONS = {
  dashboard: true, orders: true, reports: false, stock: false,
  menu: false, customers: true, riders: false, reservations: false,
  profile: true, settings: false, users: false
};

const DEFAULT_USER_PERMISSIONS = {
  dashboard: true, orders: false, reports: false, stock: false,
  menu: false, customers: false, riders: false, reservations: false,
  profile: true, settings: false, users: false
};

function defaultPermsForRole(role) {
  switch (role) {
    case 'admin': return DEFAULT_ADMIN_PERMISSIONS;
    case 'manager': return DEFAULT_MANAGER_PERMISSIONS;
    case 'order_man': return DEFAULT_ORDER_MAN_PERMISSIONS;
    default: return DEFAULT_USER_PERMISSIONS;
  }
}

export async function login(username, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', password)
    .maybeSingle();

  if (error || !data) {
    return { error: 'Invalid username or password' };
  }

  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.id);

  const defaults = defaultPermsForRole(data.role);
  const permissions = { ...defaults, ...(data.permissions || {}) };
  const userData = { ...data, permissions };

  localStorage.setItem(USER_KEY, JSON.stringify(userData));
  return { user: userData };
}

export function logout() {
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { return null; }
  }
  return null;
}

export function hasPermission(user, tab) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.[tab] || false;
}

export async function updateUserPermissions(userId, permissions) {
  const { error } = await supabase
    .from('users')
    .update({ permissions })
    .eq('id', userId);
  return { error };
}

export async function createUser(username, password, fullName, role) {
  const defaultPerms = defaultPermsForRole(role);
  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      password_hash: password,
      full_name: fullName,
      role,
      permissions: defaultPerms
    })
    .select()
    .single();
  return { data, error };
}

export async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

export async function deleteUser(userId) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  return { error };
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, role, permissions, created_at, last_login')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}