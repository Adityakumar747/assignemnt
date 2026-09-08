import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  ArrowUpDown,
  History,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  MapPin
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createStockMovement,
  getProductStockMovements
} from '../api/products.js';
import { Product } from '../types/index.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import { getErrorMessage } from '../api/client.js';

const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().trim().toUpperCase().min(3, 'SKU must be at least 3 characters'),
  category: z.string().trim().min(2, 'Category must be at least 2 characters'),
  unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
  currentStock: z.coerce.number().int().min(0, 'Current stock cannot be negative').default(0),
  minStockAlert: z.coerce.number().int().min(0, 'Min alert cannot be negative').default(10),
  location: z.string().trim().min(2, 'Location bay must be at least 2 characters')
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductsPage: React.FC = () => {
  const { user, canManageStock } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stock Movement Modal state
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [quantityChanged, setQuantityChanged] = useState<number>(10);
  const [movementReason, setMovementReason] = useState<string>('');

  // History Drawer state
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);

  // 1. Fetch Products
  const { data, isLoading } = useQuery({
    queryKey: ['products', { search, lowStock: lowStockFilter, page }],
    queryFn: () =>
      getProducts({
        search: search || undefined,
        lowStock: lowStockFilter ? 'true' : undefined,
        page,
        limit: 10
      })
  });

  // 2. Fetch Selected Product History
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['product-movements', historyProductId],
    queryFn: () => getProductStockMovements(historyProductId!, { limit: 25 }),
    enabled: !!historyProductId
  });

  // 3. React Hook Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      unitPrice: 100,
      currentStock: 50,
      minStockAlert: 10,
      location: 'Bay A-01'
    }
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      category: '',
      unitPrice: 100,
      currentStock: 50,
      minStockAlert: 10,
      location: 'Bay A-01'
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setValue('name', p.name);
    setValue('sku', p.sku);
    setValue('category', p.category);
    setValue('unitPrice', p.unitPrice);
    setValue('currentStock', p.currentStock);
    setValue('minStockAlert', p.minStockAlert);
    setValue('location', p.location);
    setIsProductModalOpen(true);
  };

  const onSubmitProduct = async (values: ProductFormValues) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, values);
        toast.success('Product Updated', `${values.name} (${values.sku}) updated.`);
      } else {
        await createProduct(values);
        toast.success('Product Created', `${values.name} added to inventory.`);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductModalOpen(false);
    } catch (err) {
      toast.error('Failed to save product', getErrorMessage(err));
    }
  };

  // Delete product handler (Admin only)
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      toast.success(
        'Product Deleted',
        `Product ${productToDelete.name} (${productToDelete.sku}) removed from stock.`
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductToDelete(null);
    } catch (err) {
      toast.error('Deletion Failed', getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Stock Movement Submit
  const handleStockMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct) return;

    if (movementType === 'OUT' && stockProduct.currentStock < quantityChanged) {
      toast.error(
        'Negative Stock Prevented',
        `Cannot reduce by ${quantityChanged}. Current stock is only ${stockProduct.currentStock}.`
      );
      return;
    }

    try {
      await createStockMovement(stockProduct.id, {
        movementType,
        quantityChanged,
        reason: movementReason.trim() || `Manual stock ${movementType.toLowerCase()}`
      });

      toast.success(
        'Stock Adjusted',
        `${stockProduct.sku} ${movementType === 'IN' ? 'increased' : 'reduced'} by ${quantityChanged} units.`
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-movements', stockProduct.id] });
      setStockProduct(null);
      setMovementReason('');
    } catch (err) {
      toast.error('Stock adjustment failed', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans flex items-center gap-2">
            <span>Product & Inventory Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-orange-100 dark:bg-zinc-800 text-orange-700 dark:text-zinc-300 font-semibold">
              {data?.meta.total ?? 0} SKUs
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Warehouse location bays, minimum reorder thresholds, and live stock tracking.
          </p>
        </div>

        {canManageStock && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search SKU, product name, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Low Stock Toggle */}
          <button
            onClick={() => {
              setLowStockFilter((prev) => !prev);
              setPage(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all ${
              lowStockFilter
                ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300 border-red-300 dark:border-red-500/40 font-bold'
                : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${lowStockFilter ? 'text-red-500' : ''}`} />
            <span>Low Stock Alert Only</span>
          </button>
        </div>
      </div>

      {/* 3. Products Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : data?.data.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Inventory Items Found</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Try adjusting your search criteria or clear the low stock filter.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/70 text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-3.5 px-4">SKU / Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location Bay</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-4 text-right">Current Stock</th>
                  <th className="py-3.5 px-4 text-center">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {data?.data.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{p.sku}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {p.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{p.location}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-zinc-800 dark:text-zinc-200 font-medium">
                        ₹{p.unitPrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={isLow ? 'text-red-600 dark:text-red-400 text-sm' : 'text-zinc-900 dark:text-zinc-100'}>
                          {p.currentStock}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-normal ml-1">
                          / {p.minStockAlert} min
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/40 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>LOW STOCK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>HEALTHY</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock IN / OUT Adjustment Button (Warehouse & Admin) */}
                          {canManageStock && (
                            <button
                              onClick={() => {
                                setStockProduct(p);
                                setMovementType('IN');
                                setQuantityChanged(10);
                                setMovementReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 text-[11px] font-mono font-semibold flex items-center gap-1 transition-all"
                              title="Record stock IN/OUT adjustment"
                            >
                              <ArrowUpDown className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                          )}

                          {/* Stock Movements History */}
                          <button
                            onClick={() => setHistoryProductId(p.id)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            title="View stock movement history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Product (Warehouse & Admin) */}
                          {canManageStock && (
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                              title="Edit product details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Product (Admin Only) */}
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete product from stock (Admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.meta.totalPages > 1 && (
          <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <div>
              Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} products)
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

      {/* 4. Delete Confirmation Modal (Admin Only) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Delete Product from Stock</h3>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-mono font-semibold">{productToDelete.sku}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-zinc-900 dark:text-white">{productToDelete.name}</strong>?
              This will remove the product and its historical stock movement audit records.
            </p>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              <div>Stock on hand: {productToDelete.currentStock} units</div>
              <div>Location: {productToDelete.location}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting SKU...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Stock Movement Adjustment Modal (IN / OUT) */}
      {stockProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Inventory Adjustment
                </div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono">
                  {stockProduct.sku} — {stockProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setStockProduct(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockMovementSubmit} className="p-5 space-y-4">
              {/* Current Stock Banner */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 uppercase">Current Stock On Hand:</span>
                <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                  {stockProduct.currentStock} units
                </span>
              </div>

              {/* Movement Type Toggle */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Movement Direction *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('IN')}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all ${
                      movementType === 'IN'
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>STOCK IN (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementType('OUT')}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all ${
                      movementType === 'OUT'
                        ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/50 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>STOCK OUT (-)</span>
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Quantity To Adjust *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantityChanged}
                  onChange={(e) => setQuantityChanged(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-orange-500"
                />
                {movementType === 'OUT' && quantityChanged > stockProduct.currentStock && (
                  <div className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Exceeds available stock ({stockProduct.currentStock} units available)</span>
                  </div>
                )}
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Movement Reason / Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supplier PO receipt, Scrap write-off, Sample dispatch"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStockProduct(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={movementType === 'OUT' && quantityChanged > stockProduct.currentStock}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-40 transition-colors shadow-sm"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Product Movement History Drawer */}
      {historyProductId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Stock Movement Audit Ledger
                </div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono mt-0.5">
                  Item Movement History
                </h2>
              </div>
              <button
                onClick={() => setHistoryProductId(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loadingHistory ? (
                <div className="space-y-3">
                  <TableSkeleton rows={5} cols={3} />
                </div>
              ) : historyData?.data.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  No stock movements recorded for this item.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyData?.data.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                            m.movementType === 'IN'
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
                          }`}
                        >
                          {m.movementType === 'IN' ? '+ INTAKE' : '- DISPATCH'}
                        </span>
                        <span
                          className={`font-bold ${
                            m.movementType === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {m.movementType === 'IN' ? `+${m.quantityChanged}` : `-${m.quantityChanged}`} units
                        </span>
                      </div>

                      <div className="text-zinc-700 dark:text-zinc-300 font-sans">{m.reason}</div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-850">
                        <span>Recorded by: {m.createdBy?.name || 'Staff'} ({m.createdBy?.role})</span>
                        <span>{new Date(m.createdAt).toLocaleString('en-GB')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Inventory SKU'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitProduct)} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    SKU Code (Unique) *
                  </label>
                  <input
                    {...register('sku')}
                    placeholder="e.g. PRD-FST-101"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono uppercase focus:outline-none focus:border-orange-500"
                  />
                  {errors.sku && (
                    <div className="text-[10px] text-red-500 mt-0.5">{errors.sku.message}</div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Category *
                  </label>
                  <input
                    {...register('category')}
                    placeholder="e.g. Bearings, Fasteners"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                  {errors.category && (
                    <div className="text-[10px] text-red-500 mt-0.5">{errors.category.message}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Product Description / Name *
                </label>
                <input
                  {...register('name')}
                  placeholder="e.g. Deep Groove Ball Bearing 6205-2RS"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
                {errors.name && (
                  <div className="text-[10px] text-red-500 mt-0.5">{errors.name.message}</div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('unitPrice')}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                  {errors.unitPrice && (
                    <div className="text-[10px] text-red-500 mt-0.5">{errors.unitPrice.message}</div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    {...register('currentStock')}
                    disabled={!!editingProduct}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-orange-500 disabled:opacity-50"
                  />
                  {editingProduct && (
                    <div className="text-[9px] text-zinc-400 mt-0.5">Use Adjust for edits</div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    {...register('minStockAlert')}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Warehouse Bay Location *
                </label>
                <input
                  {...register('location')}
                  placeholder="e.g. Rack B-12, Bin C-03"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-orange-500"
                />
                {errors.location && (
                  <div className="text-[10px] text-red-500 mt-0.5">{errors.location.message}</div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
