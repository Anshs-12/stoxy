interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({ className = '', variant = 'rectangular' }: SkeletonProps) => {
  const baseClasses = 'skeleton animate-shimmer';
  
  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton = () => (
  <div className="card-border p-5 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" variant="text" />
        <Skeleton className="h-8 w-32" variant="text" />
      </div>
      <Skeleton className="h-16 w-24" />
    </div>
    <Skeleton className="h-3 w-full" variant="text" />
    <Skeleton className="h-3 w-3/4" variant="text" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="card-border p-5">
    <div className="space-y-4">
      <Skeleton className="h-4 w-48" variant="text" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 flex-1" variant="text" />
            <Skeleton className="h-4 w-20" variant="text" />
            <Skeleton className="h-4 w-24" variant="text" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
