type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
interface BadgeProps { children: React.ReactNode; variant?: BadgeVariant; size?: 'sm' | 'md'; className?: string; }
const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-aviation-light text-aviation', success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning', danger: 'bg-danger-bg text-danger',
  info: 'bg-blue-50 text-blue-700', neutral: 'bg-subtle text-text-secondary',
};
export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'} ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
  );
}
