import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingDown,
  Warehouse,
  PlusCircle,
  FileText
} from 'lucide-react';
import { getProducts, getAllStockMovements } from '../api/products.js';
import { getCustomers } from '../api/customers.js';
import { getChallans } from '../api/challans.js';
import { useAuth } from '../context/AuthContext.js';
import { ChallanStatusBadge, Badge } from '../components/common/Badge.js';
import { Skeleton } from '../components/common/Skeleton.js';

export const DashboardPage: React.FC = () => {
  const { user, canManageCustomers, canManageStock, canManageChallans } = useAuth();
  const navigate = useNavigate();

  // Load KPI data
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: () => getProducts({ limit: 100 })
  });

  const { data: lowStockData, isLoading: loadingLowStock } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => getProducts({ lowStock: 'true', limit: 10 })
  });

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['dashboard-customers'],
    queryFn: () => getCustomers({ limit: 100 })
  });

  const { data: challansData, isLoading: loadingChallans } = useQuery({
    queryKey: ['dashboard-challans'],
    queryFn: () => getChallans({ limit: 5 })
  });

  const { data: movementsData, isLoading: loadingMovements } = useQuery({
    queryKey: ['dashboard-movements'],
    queryFn: () => getAllStockMovements({ limit: 5 })
  });

  const totalProducts = productsData?.meta.total ?? 0;
  const lowStockCount = lowStockData?.meta.total ?? 0;
  const totalCustomers = customersData?.meta.total ?? 0;
  const totalChallans = challansData?.meta.total ?? 0;

  const leadCount = customersData?.data.filter((c) => c.status === 'LEAD').length ?? 0;
  const draftChallans = challansData?.data.filter((c) => c.status === 'DRAFT').length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Operations Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ops-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Warehouse Operations Command Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-glow border border-amber-500/30">
              Shift Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inventory levels, customer CRM follow-ups, and sales challan dispatch ledger.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          {canManageChallans && (
            <button
              onClick={() => navigate('/challans?new=true')}
              className="flex items-center gap-2 px-3 py-2 rounded bg-amber-accent hover:bg-amber-bright text-ops-950 font-bold text-xs uppercase tracking-wider transition-all shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Challan</span>
            </button>
          )}

          {canManageCustomers && (
            <button
              onClick={() => navigate('/customers?new=true')}
              className="flex items-center gap-2 px-3 py-2 rounded bg-ops-850 hover:bg-ops-800 border border-ops-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>New Customer</span>
            </button>
          )}

          {canManageStock && (
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-2 px-3 py-2 rounded bg-ops-850 hover:bg-ops-800 border border-ops-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <Warehouse className="w-4 h-4 text-amber-400" />
              <span>Adjust Inventory</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Inventory */}
        <div className="p-4 rounded-lg bg-ops-900 border border-ops-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Catalog SKUs</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            {loadingProducts ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {totalProducts}
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Across all warehouse storage bays
            </div>
          </div>
        </div>

        {/* Metric 2: Low Stock Alerts */}
        <div className="p-4 rounded-lg bg-ops-900 border border-red-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-300">
              Low Stock Warnings
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            {loadingLowStock ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono text-rose-400 tracking-tight flex items-baseline gap-2">
                <span>{lowStockCount}</span>
                <span className="text-xs text-rose-400/80 font-normal">items under threshold</span>
              </div>
            )}
            <div className="text-[11px] text-rose-300/70 mt-1 font-mono">
              Immediate PO replenishment required
            </div>
          </div>
        </div>

        {/* Metric 3: Customers & Leads */}
        <div className="p-4 rounded-lg bg-ops-900 border border-ops-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Customer Accounts</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            {loadingCustomers ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-2">
                <span>{totalCustomers}</span>
                <span className="text-xs text-blue-400 font-mono font-normal">
                  ({leadCount} active leads)
                </span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Wholesale, Retail & Distributors
            </div>
          </div>
        </div>

        {/* Metric 4: Sales Challans */}
        <div className="p-4 rounded-lg bg-ops-900 border border-ops-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Sales Challans</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-bright" />
          </div>
          <div className="mt-3">
            {loadingChallans ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-2">
                <span>{totalChallans}</span>
                {draftChallans > 0 && (
                  <span className="text-xs text-amber-bright font-mono font-normal">
                    ({draftChallans} pending draft)
                  </span>
                )}
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Sequential dispatch orders
            </div>
          </div>
        </div>
      </div>

      {/* 3. Low Stock Priority Alert Box (if any items low) */}
      {lowStockData && lowStockData.data.length > 0 && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-red-300">
                Critical Inventory Shortage Watchlist
              </h3>
            </div>
            <button
              onClick={() => navigate('/products?lowStock=true')}
              className="text-xs font-mono text-amber-glow hover:underline flex items-center gap-1"
            >
              <span>View All Shortages</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {lowStockData.data.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded bg-ops-900/80 border border-red-500/20 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">{item.sku}</div>
                  <div className="text-[11px] text-slate-300 truncate max-w-[170px]">
                    {item.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-rose-400">
                    {item.currentStock} / {item.minStockAlert}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">
                    Available / Min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Dual Operational Panes: Recent Challans & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pane A: Recent Sales Challans */}
        <div className="rounded-lg bg-ops-900 border border-ops-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-bright" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                Recent Sales Challans
              </h2>
            </div>
            <button
              onClick={() => navigate('/challans')}
              className="text-xs font-mono text-slate-400 hover:text-amber-glow transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-ops-800/60">
            {loadingChallans ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-10 w-full" count={3} />
              </div>
            ) : challansData?.data.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center font-mono">
                No challans created yet.
              </div>
            ) : (
              challansData?.data.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/challans?id=${c.id}`)}
                  className="py-3 flex items-center justify-between hover:bg-ops-850/50 px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-white">
                        {c.challanNumber}
                      </span>
                      <ChallanStatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5 truncate max-w-xs">
                      {c.customer?.businessName || 'Consignee'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-amber-glow">
                      ₹{c.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {c.totalQuantity} items • {new Date(c.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pane B: Recent Stock Movements */}
        <div className="rounded-lg bg-ops-900 border border-ops-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                Live Inventory Ledger
              </h2>
            </div>
            <button
              onClick={() => navigate('/stock-ledger')}
              className="text-xs font-mono text-slate-400 hover:text-amber-glow transition-colors flex items-center gap-1"
            >
              <span>Audit Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-ops-800/60">
            {loadingMovements ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-10 w-full" count={3} />
              </div>
            ) : movementsData?.data.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center font-mono">
                No inventory movements recorded yet.
              </div>
            ) : (
              movementsData?.data.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between px-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          m.movementType === 'IN'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {m.movementType === 'IN' ? '+ IN' : '- OUT'}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {m.product?.sku || 'SKU'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                      {m.reason}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-mono font-bold ${
                        m.movementType === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {m.movementType === 'IN' ? `+${m.quantityChanged}` : `-${m.quantityChanged}`} units
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      By {m.createdBy?.name?.split(' ')[0] || 'System'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
