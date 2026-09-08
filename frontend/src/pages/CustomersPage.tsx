import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Search,
  Plus,
  Edit2,
  X,
  MessageSquare,
  Calendar,
  Send,
  Clock,
  Filter
} from 'lucide-react';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addCustomerNote
} from '../api/customers.js';
import { Customer } from '../types/index.js';
import { CustomerStatusBadge } from '../components/common/Badge.js';
import { TableSkeleton, Skeleton } from '../components/common/Skeleton.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import { getErrorMessage } from '../api/client.js';

const customerFormSchema = z.object({
  name: z.string().trim().min(2, 'Contact person name must be at least 2 characters'),
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters'),
  mobile: z.string().trim().min(8, 'Mobile number must be at least 8 digits'),
  email: z.string().trim().email('Invalid email address'),
  gstNumber: z.string().trim().toUpperCase().optional().or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  followUpDate: z.string().optional().or(z.literal(''))
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const CustomersPage: React.FC = () => {
  const { canManageCustomers } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modal / Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // 1. Fetch Customers List
  const { data, isLoading } = useQuery({
    queryKey: ['customers', { search, status: statusFilter, customerType: typeFilter, page }],
    queryFn: () =>
      getCustomers({
        search: search || undefined,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
        page,
        limit: 10
      })
  });

  // 2. Fetch Selected Customer Detail with Notes
  const { data: detailData, isLoading: loadingDetail } = useQuery({
    queryKey: ['customer-detail', selectedCustomerId],
    queryFn: () => getCustomerById(selectedCustomerId!),
    enabled: !!selectedCustomerId
  });

  // 3. React Hook Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      businessName: '',
      mobile: '',
      email: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      status: 'LEAD',
      address: '',
      followUpDate: ''
    }
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    reset({
      name: '',
      businessName: '',
      mobile: '',
      email: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      status: 'LEAD',
      address: '',
      followUpDate: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setValue('name', c.name);
    setValue('businessName', c.businessName);
    setValue('mobile', c.mobile);
    setValue('email', c.email);
    setValue('gstNumber', c.gstNumber || '');
    setValue('customerType', c.customerType);
    setValue('status', c.status);
    setValue('address', c.address);
    setValue('followUpDate', c.followUpDate ? c.followUpDate.split('T')[0] : '');
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      const payload = {
        ...values,
        followUpDate: values.followUpDate ? new Date(values.followUpDate).toISOString() : undefined
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
        toast.success('Customer Updated', `${values.businessName} updated.`);
      } else {
        await createCustomer(payload);
        toast.success('Customer Created', `${values.businessName} added to CRM.`);
      }

      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save customer', getErrorMessage(err));
    }
  };

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: (note: string) => addCustomerNote(selectedCustomerId!, note),
    onSuccess: () => {
      toast.success('Note Recorded', 'CRM log updated.');
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => {
      toast.error('Failed to add note', getErrorMessage(err));
    }
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedCustomerId) return;
    addNoteMutation.mutate(noteContent.trim());
  };

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans flex items-center gap-2">
            <span>Customer CRM Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-orange-100 dark:bg-zinc-800 text-orange-700 dark:text-zinc-300 font-semibold">
              {data?.meta.total ?? 0} Accounts
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Accounts, client contacts, GST verification, and sales follow-up notes.
          </p>
        </div>

        {canManageCustomers && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* 2. Filter & Search Control Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by business, name, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="LEAD">LEAD</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-orange-500"
          >
            <option value="">All Types</option>
            <option value="WHOLESALE">WHOLESALE</option>
            <option value="DISTRIBUTOR">DISTRIBUTOR</option>
            <option value="RETAIL">RETAIL</option>
          </select>
        </div>
      </div>

      {/* 3. Customers Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : data?.data.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Customers Found</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Try adjusting your search query or filters.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/70 text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-3.5 px-4">Business & Contact</th>
                  <th className="py-3.5 px-4">Segment</th>
                  <th className="py-3.5 px-4">Contact Coordinates</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Follow-up</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {data?.data.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCustomerId(c.id)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {c.businessName}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{c.name}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {c.customerType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-zinc-800 dark:text-zinc-200 font-medium">{c.mobile}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
                        {c.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                        {c.gstNumber || <span className="text-zinc-400 italic">Unregistered</span>}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <CustomerStatusBadge status={c.status} />
                    </td>

                    <td className="py-3.5 px-4">
                      {c.followUpDate ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-orange-600 dark:text-orange-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(c.followUpDate).toLocaleDateString('en-GB')}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 font-mono">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          <span>Notes ({c._count?.notes || 0})</span>
                        </button>

                        {canManageCustomers && (
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            title="Edit customer details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
              Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} records)
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

      {/* 4. Customer Detail Drawer (Notes Timeline + Full Metadata) */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Customer Profile & CRM Timeline
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                  {detailData?.businessName || 'Loading customer...'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {loadingDetail ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : detailData ? (
                <>
                  {/* Account Summary Cards */}
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400">Contact</div>
                      <div className="font-semibold text-zinc-900 dark:text-white mt-0.5">{detailData.name}</div>
                      <div className="font-mono text-zinc-700 dark:text-zinc-300 mt-1">{detailData.mobile}</div>
                      <div className="text-zinc-500 dark:text-zinc-400 truncate">{detailData.email}</div>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400">Type & Status</div>
                      <div className="flex items-center gap-2 mt-1">
                        <CustomerStatusBadge status={detailData.status} />
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {detailData.customerType}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-2">
                        GST: {detailData.gstNumber || 'Not provided'}
                      </div>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400">Billing Address</div>
                      <div className="text-zinc-700 dark:text-zinc-300 mt-0.5">{detailData.address}</div>
                    </div>
                  </div>

                  {/* Add Note Form (Admin & Sales only) */}
                  {canManageCustomers && (
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Record Follow-Up Call / Note
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          required
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Log meeting notes, dispatch commitments, payment terms..."
                          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-sans"
                        />
                        <button
                          type="submit"
                          disabled={addNoteMutation.isPending || !noteContent.trim()}
                          className="px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-colors shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Notes Timeline */}
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>Activity & Notes History ({detailData.notes?.length || 0})</span>
                    </h3>

                    {detailData.notes?.length === 0 ? (
                      <div className="text-xs text-zinc-400 py-6 text-center font-mono border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        No follow-up notes recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                        {detailData.notes?.map((n) => (
                          <div key={n.id} className="relative pl-7 text-xs">
                            <span className="absolute left-2 top-2 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white dark:border-zinc-900 shadow-sm" />
                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {n.author?.name || 'Staff'} ({n.author?.role})
                                </span>
                                <span>{new Date(n.createdAt).toLocaleString('en-GB')}</span>
                              </div>
                              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {n.note}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 5. Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider">
                {editingCustomer ? 'Edit Customer Record' : 'Enroll New Customer Account'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Business / Company Name *
                  </label>
                  <input
                    {...register('businessName')}
                    placeholder="e.g. Apex Engineering Ltd"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                  {errors.businessName && (
                    <div className="text-[10px] text-red-500 mt-0.5">
                      {errors.businessName.message}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                  {errors.name && (
                    <div className="text-[10px] text-red-500 mt-0.5">{errors.name.message}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    {...register('mobile')}
                    placeholder="+91 98200 11223"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                  {errors.mobile && (
                    <div className="text-[10px] text-red-500 mt-0.5">{errors.mobile.message}</div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="contact@company.com"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                  {errors.email && (
                    <div className="text-[10px] text-red-500 mt-0.5">{errors.email.message}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Customer Segment
                  </label>
                  <select
                    {...register('customerType')}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-orange-500"
                  >
                    <option value="WHOLESALE">WHOLESALE</option>
                    <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                    <option value="RETAIL">RETAIL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-orange-500"
                  >
                    <option value="LEAD">LEAD</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    GST Number (Optional)
                  </label>
                  <input
                    {...register('gstNumber')}
                    placeholder="27AABCA1234F1Z1"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono uppercase placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Delivery / Billing Address *
                </label>
                <textarea
                  rows={2}
                  {...register('address')}
                  placeholder="Plot/Shop details, Industrial Area, City, PIN"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
                {errors.address && (
                  <div className="text-[10px] text-red-500 mt-0.5">{errors.address.message}</div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Follow-Up Schedule Date
                </label>
                <input
                  type="date"
                  {...register('followUpDate')}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs font-mono uppercase tracking-wider disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Enroll Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
