interface SkeletonProps { className?: string; variant?: 'text' | 'circular' | 'rectangular'; width?: string | number; height?: string | number; }
export function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const base = 'animate-shimmer rounded-sm';
  const v = { text: 'h-4 w-full', circular: 'rounded-full', rectangular: '' };
  return <div className={`${base} ${v[variant]} ${className}`} style={{ width, height }} />;
}
