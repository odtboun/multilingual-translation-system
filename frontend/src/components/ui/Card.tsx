interface CardProps { children: React.ReactNode; className?: string; padding?: 'none' | 'sm' | 'md' | 'lg'; hover?: boolean; }
const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  return (
    <div className={`bg-surface rounded-lg border border-border shadow-card ${hover ? 'hover:shadow-dropdown transition-shadow duration-200' : ''} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
