import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Package,
  FileSpreadsheet,
  Layers,
  LogOut,
  Warehouse,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { RoleBadge } from '../common/Badge.js';
import { Role } from '../../types/index.js';
import clsx from 'clsx';

export const AppLayout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
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
    <div className="flex h-screen w-screen overflow-hidden bg-ops-950 font-sans text-slate-200">
      {/* 1. Left Operations Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-ops-800/80 bg-ops-900 select-none">
        {/* Brand / Warehouse Identity */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-ops-800/80">
          <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-bright">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>METRO OPS</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-glow font-mono font-normal">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">
              Mini ERP + CRM
            </div>
          </div>
        </div>

        {/* User Identity Snippet */}
        <div className="px-4 py-3.5 mx-3 my-3 rounded border border-ops-800/70 bg-ops-950/60">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 truncate pr-2">
              {user?.name}
            </div>
            {user && <RoleBadge role={user.role} />}
          </div>
          <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
            {user?.email}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Operations Console
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all group relative',
                  isActive
                    ? 'bg-amber-500/15 text-amber-glow font-semibold border-l-2 border-amber-bright shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-ops-800/50'
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-amber-bright' : 'text-slate-400 group-hover:text-slate-300'
                  )}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Role Quick Switcher for Evaluators */}
        <div className="p-3 border-t border-ops-800/80 bg-ops-950/40">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Evaluator Role Switch</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-bright" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={async () => {
                  await switchRole(r);
                  navigate('/dashboard');
                }}
                className={clsx(
                  'text-[10px] font-mono py-1 px-1.5 rounded transition-all text-center uppercase tracking-wide border',
                  user?.role === r
                    ? 'bg-amber-bright text-ops-950 font-bold border-amber-bright shadow'
                    : 'bg-ops-800/40 text-slate-300 border-ops-700/50 hover:bg-ops-700/60 hover:text-white'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-ops-800/80">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 flex-shrink-0 border-b border-ops-800/80 bg-ops-900/60 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE SYSTEM</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-xs text-slate-400">
              Depot: <span className="text-slate-200 font-medium">B-04 Industrial Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-200">{user?.name}</div>
              <div className="text-[11px] font-mono text-slate-400 capitalize">
                Permissions: {user?.role.toLowerCase()}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-ops-800 border border-ops-700 flex items-center justify-center text-xs font-mono font-bold text-amber-bright">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Container with Route Transitions */}
        <main className="flex-1 overflow-y-auto p-6 bg-ops-950 industrial-grid">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="max-w-7xl mx-auto h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
