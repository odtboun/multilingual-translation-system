import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-aviation text-white hover:bg-[#0052A3] active:bg-[#004080]',
  secondary: 'bg-subtle text-text-primary hover:bg-border active:bg-gray-200',
  ghost: 'text-text-secondary hover:bg-subtle active:bg-border',
  danger: 'bg-danger text-white hover:bg-[#C4281C] active:bg-[#B01E14]',
  brand: 'bg-navy text-white hover:bg-navy-light active:bg-[#0A1628]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-sm gap-1.5',
  md: 'px-4 py-2 text-sm rounded-sm gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-sm gap-2.5',
  xl: 'px-6 py-3 text-base rounded-md gap-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 ease-out disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
