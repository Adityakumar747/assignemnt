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
    draft: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    confirmed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cancelled: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    low: 'bg-red-500/15 text-red-400 border border-red-500/40 font-semibold animate-pulse',
    lead: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    inactive: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    admin: 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-semibold',
    sales: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    warehouse: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    accounts: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    neutral: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg font-mono font-medium uppercase tracking-wider',
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
