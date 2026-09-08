import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { getAllStockMovements } from '../api/products.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { RoleBadge } from '../components/common/Badge.js';

export const StockLedgerPage: React.FC = () => {
  const [movementFilter, setMovementFilter] = useState<'IN' | 'OUT' | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements-ledger', { movementFilter, page }],
    queryFn: () =>
      getAllStockMovements({
        movementType: movementFilter,
        page,
        limit: 15
      })
  });

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans flex items-center gap-2">
            <span>Inventory Movement Audit Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-orange-100 dark:bg-zinc-800 text-orange-700 dark:text-zinc-300 font-semibold">
              {data?.meta.total ?? 0} Transactions
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Complete chronological audit trail of all warehouse stock intakes, dispatch deductions, and cancellations.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5 font-mono text-xs shadow-sm">
            <button
              onClick={() => {
                setMovementFilter(undefined);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                movementFilter === undefined
                  ? 'bg-orange-500 text-white font-bold shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => {
                setMovementFilter('IN');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                movementFilter === 'IN'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              + INTAKE
            </button>
            <button
              onClick={() => {
                setMovementFilter('OUT');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                movementFilter === 'OUT'
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              - DISPATCH
            </button>
          </div>
        </div>
      </div>

      {/* 2. Audit Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : data?.data.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Transactions Recorded</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Stock movements will automatically log here when challans are confirmed or inventory is adjusted.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/70 text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-3.5 px-4">Transaction Date</th>
                  <th className="py-3.5 px-4">Direction</th>
                  <th className="py-3.5 px-4">Product SKU & Name</th>
                  <th className="py-3.5 px-4 text-right">Qty Changed</th>
                  <th className="py-3.5 px-4">Audit Reason / Reference</th>
                  <th className="py-3.5 px-4 text-right">Authorized User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-mono">
                {data?.data.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                      {new Date(m.createdAt).toLocaleString('en-GB')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          m.movementType === 'IN'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
                        }`}
                      >
                        {m.movementType === 'IN' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{m.movementType === 'IN' ? 'INBOUND' : 'OUTBOUND'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-orange-600 dark:text-orange-400">{m.product?.sku}</div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300 font-sans truncate max-w-xs">
                        {m.product?.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-sm">
                      <span className={m.movementType === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {m.movementType === 'IN' ? `+${m.quantityChanged}` : `-${m.quantityChanged}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-zinc-700 dark:text-zinc-300">
                      {m.reason}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="text-zinc-800 dark:text-zinc-200 font-sans">{m.createdBy?.name || 'Staff'}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {m.createdBy?.role ? <RoleBadge role={m.createdBy.role} /> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.meta.totalPages > 1 && (
          <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <div>
              Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} movements)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
