import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  X,
  Trash2,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Building,
  ShieldAlert
} from 'lucide-react';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan,
  downloadChallanPdf
} from '../api/challans.js';
import { getCustomers } from '../api/customers.js';
import { getProducts } from '../api/products.js';
import { Challan, ChallanStatus, Product, Customer } from '../types/index.js';
import { ChallanStatusBadge } from '../components/common/Badge.js';
import { TableSkeleton, Skeleton } from '../components/common/Skeleton.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import { getErrorMessage } from '../api/client.js';

interface LineItem {
  productId: string;
  quantity: number;
}

export const ChallansPage: React.FC = () => {
  const { canManageChallans, user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallanId, setSelectedChallanId] = useState<string | null>(null);

  // Create Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1 }]);
  const [isConfirmingImmediately, setIsConfirmingImmediately] = useState(false);

  // Read URL query params on mount
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsCreateModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
    const idParam = searchParams.get('id');
    if (idParam) {
      setSelectedChallanId(idParam);
      searchParams.delete('id');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // 1. Fetch Challans List
  const { data, isLoading } = useQuery({
    queryKey: ['challans', { search, status: statusFilter, page }],
    queryFn: () =>
      getChallans({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10
      })
  });

  // 2. Fetch Selected Challan Details
  const { data: detailChallan, isLoading: loadingDetail } = useQuery({
    queryKey: ['challan-detail', selectedChallanId],
    queryFn: () => getChallanById(selectedChallanId!),
    enabled: !!selectedChallanId
  });

  // 3. Customers & Products for Challan Creation
  const { data: customersData } = useQuery({
    queryKey: ['dropdown-customers'],
    queryFn: () => getCustomers({ limit: 100 }),
    enabled: isCreateModalOpen
  });

  const { data: productsData } = useQuery({
    queryKey: ['dropdown-products'],
    queryFn: () => getProducts({ limit: 100 }),
    enabled: isCreateModalOpen
  });

  const productList = productsData?.data || [];
  const customerList = customersData?.data || [];

  // Line item helpers
  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Compute live order summary
  const totalOrderQty = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const totalOrderEst = items.reduce((acc, curr) => {
    const prod = productList.find((p) => p.id === curr.productId);
    return acc + (prod ? prod.unitPrice * (Number(curr.quantity) || 0) : 0);
  }, 0);

  // Check if any product has insufficient stock
  const hasInsufficientStock = items.some((item) => {
    if (!item.productId) return false;
    const prod = productList.find((p) => p.id === item.productId);
    return prod ? item.quantity > prod.currentStock : false;
  });

  // Create Challan Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Customer Required', 'Please select a consignee customer.');
      return;
    }

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Items Required', 'Please add at least one valid product line.');
      return;
    }

    try {
      const challan = await createChallan({
        customerId: selectedCustomerId,
        items: validItems
      });

      // If user chose to confirm immediately
      if (isConfirmingImmediately) {
        try {
          await confirmChallan(challan.id);
          toast.success(
            'Challan Created & Confirmed',
            `${challan.challanNumber} confirmed. Inventory decremented.`
          );
        } catch (confirmErr) {
          toast.warning(
            'Saved as Draft (Confirm Failed)',
            getErrorMessage(confirmErr)
          );
        }
      } else {
        toast.success(
          'Draft Challan Generated',
          `${challan.challanNumber} saved with historical product snapshots.`
        );
      }

      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
      setSelectedCustomerId('');
      setItems([{ productId: '', quantity: 1 }]);
    } catch (err) {
      toast.error('Failed to create challan', getErrorMessage(err));
    }
  };

  // Confirm Mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmChallan(id),
    onSuccess: (data) => {
      toast.success(
        'Challan Confirmed',
        `${data.challanNumber} confirmed. Inventory stock decremented & logged.`
      );
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['challan-detail', selectedChallanId] });
    },
    onError: (err) => {
      toast.error('Confirmation Rejected', getErrorMessage(err));
    }
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelChallan(id),
    onSuccess: (data) => {
      toast.success(
        'Challan Cancelled',
        `${data.challanNumber} cancelled. Inventory items restocked.`
      );
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['challan-detail', selectedChallanId] });
    },
    onError: (err) => {
      toast.error('Cancellation Failed', getErrorMessage(err));
    }
  });

  // Handle PDF Download
  const handlePdfDownload = async (c: Challan) => {
    try {
      await downloadChallanPdf(c.id, c.challanNumber);
      toast.success('PDF Downloaded', `Invoice for ${c.challanNumber} saved.`);
    } catch (err) {
      toast.error('PDF Download Failed', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ops-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
            <span>Sales Challan & Dispatch Ledger</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-ops-800 text-slate-300">
              {data?.meta.total ?? 0} Challans
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official delivery challans, product snapshots, and automated inventory decrements.
          </p>
        </div>

        {canManageChallans && (
          <button
            onClick={() => {
              setSelectedCustomerId('');
              setItems([{ productId: '', quantity: 1 }]);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-amber-accent hover:bg-amber-bright text-ops-950 font-bold text-xs uppercase tracking-wider transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Challan</span>
          </button>
        )}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-3 rounded-lg bg-ops-900 border border-ops-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Challan number or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-ops-950 border border-ops-700/80 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-bright font-mono"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-ops-950 border border-ops-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-bright"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* 3. Challans Table */}
      <div className="rounded-lg bg-ops-900 border border-ops-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : data?.data.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-300">No Sales Challans Found</div>
            <div className="text-xs text-slate-400 mt-1">
              Create a new challan to begin warehouse dispatch operations.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ops-800 bg-ops-950/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Challan Number</th>
                  <th className="py-3 px-4">Consignee Customer</th>
                  <th className="py-3 px-4">Date Issued</th>
                  <th className="py-3 px-4 text-right">Items Qty</th>
                  <th className="py-3 px-4 text-right">Total (INR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-800/60 text-xs">
                {data?.data.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedChallanId(c.id)}
                    className="hover:bg-ops-850/60 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white group-hover:text-amber-glow transition-colors">
                        {c.challanNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        By {c.createdBy?.name || 'Staff'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {c.customer?.businessName || 'Customer'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.customer?.name} ({c.customer?.mobile})
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {new Date(c.createdAt).toLocaleDateString('en-GB')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      {c.totalQuantity} units
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-glow">
                      ₹{c.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <ChallanStatusBadge status={c.status} />
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* PDF Export button */}
                        <button
                          onClick={() => handlePdfDownload(c)}
                          className="p-1.5 rounded hover:bg-ops-700 text-slate-300 hover:text-amber-bright transition-colors"
                          title="Download PDF Invoice / Delivery Challan"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Confirm Action (Sales / Admin) */}
                        {canManageChallans && c.status === 'DRAFT' && (
                          <button
                            onClick={() => confirmMutation.mutate(c.id)}
                            disabled={confirmMutation.isPending}
                            className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold flex items-center gap-1"
                            title="Confirm challan & decrement inventory stock"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Confirm</span>
                          </button>
                        )}

                        {/* View details */}
                        <button
                          onClick={() => setSelectedChallanId(c.id)}
                          className="px-2 py-1 rounded bg-ops-800 hover:bg-ops-700 text-slate-300 text-[11px] font-mono"
                        >
                          Details
                        </button>
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
          <div className="p-3 border-t border-ops-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} records)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 rounded bg-ops-800 hover:bg-ops-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded bg-ops-800 hover:bg-ops-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Challan Detail Modal (Snapshots inspection, confirm, cancel, print, download) */}
      {selectedChallanId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-ops-900 border border-ops-800 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-ops-800 flex items-center justify-between bg-ops-950/40">
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-2">
                  <span>Sales Dispatch Challan Inspection</span>
                  {detailChallan && <ChallanStatusBadge status={detailChallan.status} />}
                </div>
                <h2 className="text-lg font-bold text-white font-mono mt-0.5">
                  {detailChallan?.challanNumber || 'Loading details...'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {detailChallan && (
                  <button
                    onClick={() => handlePdfDownload(detailChallan)}
                    className="px-3 py-1.5 rounded bg-ops-800 hover:bg-ops-700 border border-ops-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-bright" />
                    <span>PDF Invoice</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedChallanId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : detailChallan ? (
                <>
                  {/* Consignee & Order Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded bg-ops-950 border border-ops-800 text-xs">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                        Billed & Shipped To:
                      </div>
                      <div className="font-bold text-white text-sm">
                        {detailChallan.customer?.businessName}
                      </div>
                      <div className="text-slate-300 mt-1">
                        Attn: {detailChallan.customer?.name} ({detailChallan.customer?.mobile})
                      </div>
                      <div className="text-slate-400 mt-0.5">{detailChallan.customer?.address}</div>
                      <div className="font-mono text-slate-400 mt-1">
                        GSTIN: {detailChallan.customer?.gstNumber || 'Unregistered'}
                      </div>
                    </div>

                    <div className="space-y-1 font-mono">
                      <div className="text-[10px] uppercase text-slate-400 mb-1">
                        Challan Parameters:
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Challan Number:</span>
                        <span className="text-white font-bold">{detailChallan.challanNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date Generated:</span>
                        <span className="text-white">
                          {new Date(detailChallan.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Prepared By:</span>
                        <span className="text-white">
                          {detailChallan.createdBy?.name} ({detailChallan.createdBy?.role})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Status:</span>
                        <span className="text-amber-bright font-bold">{detailChallan.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Immutable Item Snapshots Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                        Item Snapshots (Locked at Creation Time)
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {detailChallan.items.length} Product Lines
                      </span>
                    </div>

                    <div className="rounded border border-ops-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-ops-800 bg-ops-950 text-[10px] font-mono uppercase text-slate-400">
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-right">Qty</th>
                            <th className="py-2.5 px-3 text-right">Unit Price</th>
                            <th className="py-2.5 px-3 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ops-800/60 font-mono">
                          {detailChallan.items.map((item) => (
                            <tr key={item.id} className="hover:bg-ops-850/40">
                              <td className="py-2.5 px-3 text-amber-glow font-bold">
                                {item.productSkuSnapshot}
                              </td>
                              <td className="py-2.5 px-3 font-sans text-slate-200">
                                {item.productNameSnapshot}
                              </td>
                              <td className="py-2.5 px-3 text-right text-white font-bold">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-300">
                                ₹{item.unitPriceSnapshot.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-white font-bold">
                                ₹{(item.quantity * item.unitPriceSnapshot).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-ops-800 bg-ops-950 font-mono text-xs">
                            <td colSpan={2} className="py-3 px-3 font-bold uppercase text-slate-300">
                              Total Dispatch Quantities
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-white">
                              {detailChallan.totalQuantity} units
                            </td>
                            <td className="py-3 px-3 text-right uppercase text-slate-400">
                              Grand Total:
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-amber-glow text-sm">
                              ₹{detailChallan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Status Business Logic Explanation */}
                  <div className="p-3.5 rounded bg-ops-950/70 border border-ops-800 text-xs space-y-1">
                    <div className="font-mono text-[11px] uppercase text-slate-400 font-bold">
                      Business Rules & Inventory Interaction:
                    </div>
                    {detailChallan.status === 'DRAFT' && (
                      <p className="text-slate-300">
                        This challan is currently in <span className="text-amber-bright font-bold">DRAFT</span> status.
                        Confirming will verify inventory availability for every product line and atomically decrement
                        warehouse stock.
                      </p>
                    )}
                    {detailChallan.status === 'CONFIRMED' && (
                      <p className="text-emerald-300">
                        This challan is <span className="font-bold">CONFIRMED</span>. Stock was decremented from the
                        warehouse. Cancelling will reverse the deduction and restore stock units back to inventory.
                      </p>
                    )}
                    {detailChallan.status === 'CANCELLED' && (
                      <p className="text-rose-300">
                        This challan is <span className="font-bold">CANCELLED</span>. Any previously dispatched items have
                        been safely returned to inventory stock.
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer Actions */}
            {detailChallan && canManageChallans && (
              <div className="p-4 border-t border-ops-800 bg-ops-950/80 flex items-center justify-between">
                <div>
                  {detailChallan.status !== 'CANCELLED' && (
                    <button
                      onClick={() => cancelMutation.mutate(detailChallan.id)}
                      disabled={cancelMutation.isPending}
                      className="px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>{detailChallan.status === 'CONFIRMED' ? 'Cancel & Restock Items' : 'Cancel Draft'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {detailChallan.status === 'DRAFT' && (
                    <button
                      onClick={() => confirmMutation.mutate(detailChallan.id)}
                      disabled={confirmMutation.isPending}
                      className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{confirmMutation.isPending ? 'Validating Stock...' : 'Confirm & Dispatch Stock'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedChallanId(null)}
                    className="px-4 py-2 rounded bg-ops-800 hover:bg-ops-700 text-xs font-mono text-slate-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Create Sales Challan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-ops-900 border border-ops-800 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-ops-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Outbound Logistics
                </div>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  New Sales Delivery Challan
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Select Consignee Customer *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-ops-950 border border-ops-700 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-bright"
                >
                  <option value="">-- Choose Wholesale / Retail Customer --</option>
                  {customerList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.name} - {c.mobile}) [{c.customerType}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    Products To Dispatch *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] font-mono text-amber-bright hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product Row</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, index) => {
                    const selectedProd = productList.find((p) => p.id === item.productId);
                    const isShort = selectedProd && item.quantity > selectedProd.currentStock;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded bg-ops-950 border ${
                          isShort ? 'border-rose-500/50' : 'border-ops-800'
                        } space-y-2`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Product select */}
                          <div className="flex-1">
                            <select
                              required
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              className="w-full bg-ops-900 border border-ops-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-bright"
                            >
                              <option value="">-- Choose Product --</option>
                              {productList.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.sku} — {p.name} (Stock: {p.currentStock} units | ₹{p.unitPrice})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity input */}
                          <div className="w-24">
                            <input
                              type="number"
                              min={1}
                              required
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'quantity',
                                  Math.max(1, parseInt(e.target.value, 10) || 1)
                                )
                              }
                              placeholder="Qty"
                              className="w-full bg-ops-900 border border-ops-700 rounded px-2 py-1.5 text-xs text-white font-mono text-right focus:outline-none focus:border-amber-bright"
                            />
                          </div>

                          {/* Line total */}
                          <div className="w-24 text-right font-mono text-xs font-bold text-amber-glow">
                            ₹
                            {selectedProd
                              ? (selectedProd.unitPrice * item.quantity).toFixed(2)
                              : '0.00'}
                          </div>

                          {/* Delete button */}
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remove item row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Live Stock Warning */}
                        {selectedProd && (
                          <div className="flex items-center justify-between text-[11px] font-mono px-1">
                            <span className="text-slate-400">
                              Bay: {selectedProd.location} | Available Stock: {selectedProd.currentStock}
                            </span>
                            {isShort && (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Insufficient Stock (Short by {item.quantity - selectedProd.currentStock})</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Totals Summary */}
              <div className="p-3.5 rounded bg-ops-950 border border-ops-800 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-slate-400">Total Items: </span>
                  <span className="text-white font-bold">{totalOrderQty} Units</span>
                </div>
                <div>
                  <span className="text-slate-400">Estimated Total: </span>
                  <span className="text-amber-glow font-bold text-sm">
                    ₹{totalOrderEst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Immediate Confirm Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="confirmImmediate"
                  checked={isConfirmingImmediately}
                  onChange={(e) => setIsConfirmingImmediately(e.target.checked)}
                  className="mt-0.5 rounded border-ops-700 bg-ops-950 text-amber-bright focus:ring-0"
                />
                <label htmlFor="confirmImmediate" className="text-xs text-slate-300">
                  Confirm and decrement warehouse stock immediately (saves as CONFIRMED rather than DRAFT)
                </label>
              </div>

              {hasInsufficientStock && isConfirmingImmediately && (
                <div className="p-2.5 rounded bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Warning: One or more products exceed current warehouse stock. Direct confirmation will be rejected.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ops-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded bg-ops-800 hover:bg-ops-700 text-xs font-mono text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-accent hover:bg-amber-bright text-ops-950 font-bold text-xs font-mono uppercase tracking-wider"
                >
                  {isConfirmingImmediately ? 'Create & Confirm Challan' : 'Save As Draft Challan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
