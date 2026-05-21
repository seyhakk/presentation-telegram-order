import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Bell, LogOut, ArrowRight, User, Shield, Menu } from 'lucide-react';

const TITLES = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  reports: 'Reports',
  stock: 'Inventory',
  menu: 'Menu',
  dinein_security: 'Dine-In Security',
  riders: 'Delivery Staff',
  users: 'User Management',
  profile: 'My Profile',
  settings: 'Settings',
};

export default function Header({ tab, pendingCount, onNavigate, onLogout, user, onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
      <div className="flex items-center justify-between px-3 lg:px-6 h-14 lg:h-16">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight">{TITLES[tab] || 'Dashboard'}</h1>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Manage your restaurant operations</p>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-3">
          {/* Search - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
            <label htmlFor="header-search" className="sr-only">Search</label>
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input id="header-search" type="text" placeholder="Search…" className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 rounded w-40" />
          </div>

          {/* Filter button - hidden on mobile */}
          <button aria-label="Filters" className="hidden lg:flex rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition-colors">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl hover:bg-slate-50 p-2.5 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-slate-600" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-white px-1">
                  {pendingCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-72 lg:w-80 rounded-2xl border border-slate-200/60 bg-white shadow-xl animate-fade-in overflow-hidden z-50">
                <div className="px-4 lg:px-5 py-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800">Notifications</h4>
                </div>
                <div className="px-4 lg:px-5 py-4">
                  {pendingCount > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bell className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">You have {pendingCount} pending order{pendingCount !== 1 ? 's' : ''}</p>
                          <p className="text-xs text-slate-400 mt-1">Review and update order statuses</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowNotifications(false); onNavigate('orders'); }}
                        className="w-full rounded-xl bg-primary-500 text-white py-2 text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/30 transition-[background-color,transform,box-shadow,opacity] flex items-center justify-center gap-2"
                      >
                        View Orders <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No pending orders</p>
                      <p className="text-xs text-slate-300 mt-0.5">Everything is up to date</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User info - simplified on mobile */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                {user.role === 'admin' ? (
                  <Shield className="h-4 w-4 text-primary-600" />
                ) : (
                  <User className="h-4 w-4 text-primary-600" />
                )}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-700">{user.full_name || user.username}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="rounded-xl border border-red-200 bg-white px-2 lg:px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1 lg:gap-2"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}