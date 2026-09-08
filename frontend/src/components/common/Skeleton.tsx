import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={clsx(
            'animate-pulse bg-ops-800/60 rounded border border-ops-700/30',
            className
          )}
        />
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6
}) => {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-3 items-center py-2.5 border-b border-ops-800/40">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={clsx(
                'h-4 bg-ops-800/70 rounded animate-pulse',
                cIdx === 0 ? 'w-16' : cIdx === 1 ? 'w-48' : 'flex-1'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
