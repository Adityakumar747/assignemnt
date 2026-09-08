import React from 'react';
import clsx from 'clsx';
import { ChallanStatus, CustomerStatus, Role } from '../../types/index.js';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'draft' | 'confirmed' | 'cancelled' | 'low' | 'lead' | 'active' | 'inactive' | 'admin' | 'sales' | 'warehouse' | 'accounts' | 'neutral';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  size = 'md'
}) => {
  const variantStyles = {
    draft: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    cancelled: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    low: 'bg-red-500/15 text-red-400 border border-red-500/40 font-semibold animate-pulse',
    lead: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    inactive: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
    admin: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    sales: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    warehouse: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    accounts: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded font-mono font-medium uppercase tracking-wider',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
};

export const ChallanStatusBadge: React.FC<{ status: ChallanStatus }> = ({ status }) => {
  const variantMap: Record<ChallanStatus, 'draft' | 'confirmed' | 'cancelled'> = {
    DRAFT: 'draft',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled'
  };
  return <Badge variant={variantMap[status]}>{status}</Badge>;
};

export const CustomerStatusBadge: React.FC<{ status: CustomerStatus }> = ({ status }) => {
  const variantMap: Record<CustomerStatus, 'lead' | 'active' | 'inactive'> = {
    LEAD: 'lead',
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  };
  return <Badge variant={variantMap[status]}>{status}</Badge>;
};

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const variantMap: Record<Role, 'admin' | 'sales' | 'warehouse' | 'accounts'> = {
    ADMIN: 'admin',
    SALES: 'sales',
    WAREHOUSE: 'warehouse',
    ACCOUNTS: 'accounts'
  };
  return <Badge variant={variantMap[role]}>{role}</Badge>;
};
