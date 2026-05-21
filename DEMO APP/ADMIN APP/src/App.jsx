import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Shield } from 'lucide-react';
import { getCurrentUser, logout, hasPermission } from './lib/auth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Reports from './components/Reports';
import StockManager from './components/StockManager';
import MenuControl from './components/MenuControl';
import OrdersManager from './components/OrdersManager';
import UserSettings from './components/UserSettings';
import Customers from './components/Customers';
import Riders from './components/Riders';
import Reservations from './components/Reservations';
import Profile from './components/Profile';
import DineInSecurity from './components/DineInSecurity';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function App() {
  const [user, setUser] = useState(getCurrentUser);
  const [tab, setTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [orderFilter, setOrderFilter] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchPendingCount = async () => {
    const { data } = await supabase.from('orders').select('id').in('status', ['pending', 'confirmed', 'delivering']);
    setPendingCount((data || []).length);
  };

  useEffect(() => {
    if (user) { fetchPendingCount(); fetchLowStockCount(); }
  }, [user, refreshKey]);

  const fetchLowStockCount = async () => {
    const { data } = await supabase.from('menu_items').select('id,stock_quantity,low_stock_threshold');
    const count = (data || []).filter(i => i.stock_quantity <= (i.low_stock_threshold || 5)).length;
    setLowStockCount(count);
  };

  const navigate = useCallback((to, filter) => {
    if (to === 'orders' && filter) {
      setOrderFilter(filter);
    }
    setTab(to);
    setSidebarOpen(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const handleTabChange = (newTab) => {
    if (hasPermission(user, newTab)) {
      setTab(newTab);
    }
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-page flex">
      <Sidebar 
        active={tab} 
        onNavigate={navigate} 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        lowStockCount={lowStockCount}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={`flex-1 min-w-0 transition-[margin] duration-300 ml-0 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        <Header
          tab={tab}
          pendingCount={pendingCount}
          onNavigate={handleTabChange}
          onLogout={handleLogout}
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {tab === 'dashboard' && hasPermission(user, 'dashboard') && <Dashboard refreshKey={refreshKey} onNavigate={navigate} />}
          {tab === 'orders' && hasPermission(user, 'orders') && <OrdersManager refreshKey={refreshKey} initialFilter={orderFilter} onFilterClear={() => setOrderFilter(null)} />}
          {tab === 'reports' && hasPermission(user, 'reports') && <Reports />}
          {tab === 'stock' && hasPermission(user, 'stock') && <StockManager />}
          {tab === 'menu' && hasPermission(user, 'menu') && <MenuControl refreshKey={refreshKey} />}
          {tab === 'settings' && hasPermission(user, 'settings') && <Settings />}
          {tab === 'users' && hasPermission(user, 'users') && <UserSettings currentUser={user} />}
          {tab === 'customers' && hasPermission(user, 'customers') && <Customers />}
          {tab === 'riders' && hasPermission(user, 'riders') && <Riders />}
          {tab === 'reservations' && hasPermission(user, 'reservations') && <Reservations />}
          {tab === 'dinein_security' && hasPermission(user, 'dinein_security') && <DineInSecurity />}
          {tab === 'profile' && <Profile />}
          
          {!hasPermission(user, tab) && (
            <div className="flex flex-col items-center justify-center py-12 lg:py-20 text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Shield className="h-10 w-10 text-slate-400 mx-auto" />
              </div>
              <h2 className="text-base lg:text-lg font-bold text-slate-800 mb-2">Access Denied</h2>
              <p className="text-sm text-slate-500 max-w-xs">You don't have permission to access this section. Contact an admin to get access.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}