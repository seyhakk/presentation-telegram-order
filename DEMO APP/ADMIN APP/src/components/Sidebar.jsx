import { cn } from '../utils/cn';
import { hasPermission } from '../lib/auth';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, ChevronLeft, ChevronRight, Store, BarChart3, Package, Users, X, UserCheck, Truck, CalendarDays, UserCog, KeyRound } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'stock', label: 'Inventory', icon: Package },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'dinein_security', label: 'Dine-In Security', icon: KeyRound },
  { id: 'customers', label: 'Customers', icon: UserCheck },
  { id: 'riders', label: 'Delivery Staff', icon: Truck },
  { id: 'reservations', label: 'Reservations', icon: CalendarDays },
  { id: 'users', label: 'User Management', icon: Users },
];

const BOTTOM_ITEMS = [
  { id: 'profile', label: 'My Profile', icon: UserCog },
  { id: 'settings', label: 'Settings', icon: Store },
];

export default function Sidebar({ active, onNavigate, collapsed, onToggle, lowStockCount, user, isOpen, onClose }) {
  const visibleMainItems = NAV_ITEMS.filter(item => hasPermission(user, item.id));
  const visibleBottomItems = BOTTOM_ITEMS.filter(item => hasPermission(user, item.id));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-35 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar z-40 flex flex-col transition-[width,transform,box-shadow] duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Mobile close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0">
            <Store className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-base tracking-tight">Admin Panel</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">Main Menu</span>
          )}
          {visibleMainItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={cn(
                  'flex items-center gap-3 rounded-xl text-sm font-medium transition-[background-color,transform,box-shadow,opacity] duration-200 relative',
                  collapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                  active === item.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.id === 'stock' && lowStockCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">{lowStockCount}</span>
                )}
                {collapsed && item.id === 'stock' && lowStockCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">System</span>
          )}
          {visibleBottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={cn(
                  'flex items-center gap-3 rounded-xl text-sm font-medium transition-[background-color,transform,box-shadow,opacity] duration-200 w-full',
                  collapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                  active === item.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 items-center justify-center shadow-sm hover:shadow-md transition-[background-color,transform,box-shadow,opacity]"
        >
          {collapsed ? <ChevronRight className="h-3 w-3 text-slate-500" /> : <ChevronLeft className="h-3 w-3 text-slate-500" />}
        </button>
      </aside>
    </>
  );
}