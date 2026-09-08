import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Package,
  FileSpreadsheet,
  Layers,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { RoleBadge } from '../common/Badge.js';
import clsx from 'clsx';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']
    },
    {
      label: 'Customer CRM',
      path: '/customers',
      icon: Users,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']
    },
    {
      label: 'Products & Stock',
      path: '/products',
      icon: Package,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']
    },
    {
      label: 'Sales Challans',
      path: '/challans',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']
    },
    {
      label: 'Stock Ledger',
      path: '/stock-ledger',
      icon: Layers,
      roles: ['ADMIN', 'WAREHOUSE', 'ACCOUNTS']
    }
  ];

  const filteredNav = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      {/* 1. Left Operations Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 select-none transition-colors duration-150">
        {/* Brand / Warehouse Identity */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-zinc-900 border border-orange-200 dark:border-zinc-800 flex items-center justify-center text-orange-500 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>OPS<span className="text-orange-500">.</span>FLOW</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono font-medium border border-orange-200 dark:border-orange-500/20">
                  v2.4
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 tracking-wider font-mono">
                Operations Portal
              </div>
            </div>
          </div>
        </div>

        {/* User Identity Snippet */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-zinc-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate pr-2">
              {user?.name}
            </div>
            {user && <RoleBadge role={user.role} />}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate mt-0.5">
            {user?.email}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Workstation Modules
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative',
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold border-l-2 border-orange-500 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/80'
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-orange-500' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200'
                  )}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>


        {/* Footer Logout */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-md px-6 flex items-center justify-between transition-colors duration-150">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-800 dark:text-zinc-300 font-medium">LIVE OPERATIONS</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Depot: <span className="text-zinc-900 dark:text-zinc-200 font-medium">B-04 Industrial Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-200">{user?.name}</div>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 capitalize">
                Role: <span className="text-orange-600 dark:text-orange-400 font-semibold">{user?.role?.toLowerCase()}</span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-zinc-800 border border-orange-200 dark:border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-orange-600 dark:text-orange-400 shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Container with Route Transitions */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950 industrial-grid transition-colors duration-150">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="max-w-7xl mx-auto h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
