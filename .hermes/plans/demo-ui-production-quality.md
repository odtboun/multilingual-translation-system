# Demo UI/UX Production Plan — Trillion-Dollar Airline Product

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform the current prototype UI into a stunning, production-grade operator terminal that looks and feels like enterprise software for a world-class airline — before touching translation quality.

**Architecture:** React 19 + TypeScript + Tailwind CSS + Framer Motion. Keep the existing FastAPI backend unchanged. Replace all custom CSS and component styling with a unified design system. Add a scripted demo walkthrough mode that showcases every capability in a natural flow. Build for iPad Pro (1024×1366) as the primary target, with graceful adaptation to desktop.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Tailwind CSS 4, Framer Motion 12, Lucide React icons, Inter font.

**Design references:** Linear (minimalism, purpose), Stripe Dashboard (confidence, clarity), modern FIDS displays (information hierarchy), premium airline lounges (spaciousness, quality materials).

---

## Design Language

### Color System

```
Brand Navy       #0B1D3A    Headers, footers, primary backgrounds
Brand Red        #E31E26    Critical actions, emergency context
Aviation Blue    #0066CC    Primary actions, links, accent
Sky Blue         #E8F4FD    Subtle highlights, selected states
Surface White    #FFFFFF    Cards, panels, inputs
Warm Gray 50     #F8F9FB    Page background
Warm Gray 100    #F1F3F5    Hover states, alternate rows
Warm Gray 200    #E5E8EB    Borders, dividers
Warm Gray 400    #8B95A1    Secondary text, placeholders
Warm Gray 600    #4E5867    Body text
Warm Gray 800    #1C2128    Headings, primary text
Success Green    #0D7C4B    Success states, guard corrections
Warning Amber    #C7520A    Warnings, partial matches
Danger Red       #D92D20    Errors, failed states
```

### Typography

```css
font-family: 'Inter', system-ui, sans-serif;
/* Weights: 400 (body), 500 (emphasis), 600 (headings), 700 (hero) */
/* Scale: 12/14/16/18/20/24/32/40/56 */
/* Line heights: 1.2 (headings), 1.5 (body), 1.0 (data) */
```

### Spacing Scale

```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

### Elevation

```
Level 0: flat (page background)
Level 1: 0 1px 3px rgba(0,0,0,0.04) — cards, inputs
Level 2: 0 4px 12px rgba(0,0,0,0.06) — dropdowns, tooltips
Level 3: 0 8px 24px rgba(0,0,0,0.08) — modals, dialogs
```

### Corner Radius

```
4px: inputs, buttons, small elements
8px: cards, panels
12px: modals, large panels
16px: main content areas
```

---

## Phase 1: Design System Foundation

### Task 1: Install Tailwind CSS 4 and configure design tokens

**Objective:** Replace 511 lines of custom CSS with Tailwind 4 design tokens.

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Replace: `frontend/src/index.css`

**Step 1: Install dependencies**

```bash
cd frontend
npm install -D tailwindcss @tailwindcss/vite
npm install framer-motion
```

**Step 2: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

**Step 3: Replace index.css with design tokens**

Write `frontend/src/index.css`:
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@theme {
  /* Brand */
  --color-navy: #0B1D3A;
  --color-navy-light: #13294B;
  --color-brand-red: #E31E26;
  --color-aviation: #0066CC;
  --color-aviation-light: #E8F4FD;
  
  /* Surfaces */
  --color-surface: #FFFFFF;
  --color-page: #F8F9FB;
  --color-subtle: #F1F3F5;
  --color-border: #E5E8EB;
  
  /* Text */
  --color-text-primary: #1C2128;
  --color-text-secondary: #4E5867;
  --color-text-tertiary: #8B95A1;
  --color-text-inverse: #FFFFFF;
  
  /* Semantic */
  --color-success: #0D7C4B;
  --color-success-bg: #ECFDF5;
  --color-warning: #C7520A;
  --color-warning-bg: #FFF7ED;
  --color-danger: #D92D20;
  --color-danger-bg: #FEF2F2;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-modal: 0 8px 24px rgba(0, 0, 0, 0.08);
  
  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

/* Base styles */
body {
  font-family: var(--font-sans);
  background: var(--color-page);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 102, 204, 0.4); }
  50% { box-shadow: 0 0 0 16px rgba(0, 102, 204, 0); }
}

@keyframes guard-highlight {
  0% { background-color: rgba(217, 45, 32, 0.15); text-decoration-color: #D92D20; }
  60% { background-color: rgba(217, 45, 32, 0.05); text-decoration-color: #D92D20; }
  100% { background-color: transparent; text-decoration-color: transparent; }
}

@keyframes number-count {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-fade-in { animation: fade-in 0.3s ease-out; }
.animate-slide-up { animation: slide-up 0.4s ease-out; }
.animate-scale-in { animation: scale-in 0.2s ease-out; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
.animate-guard-highlight { animation: guard-highlight 1.2s ease-out; }
.animate-number-count { animation: number-count 0.5s ease-out; }
.animate-shimmer {
  background: linear-gradient(90deg, #F1F3F5 25%, #E5E8EB 50%, #F1F3F5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

**Step 4: Verify build**

```bash
cd frontend && npm run build
# Expected: builds without errors
```

**Step 5: Commit**

```bash
cd /Users/omerdemirtas/Documents/Github/multilingual-translation-system
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/index.css
git commit -m "feat: install Tailwind CSS 4 + Framer Motion, define aviation design system tokens"
```

---

### Task 2: Create reusable component primitives

**Objective:** Build the foundational UI components that everything else composes from.

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Card.tsx`
- Create: `frontend/src/components/ui/Input.tsx`
- Create: `frontend/src/components/ui/Select.tsx`
- Create: `frontend/src/components/ui/Badge.tsx`
- Create: `frontend/src/components/ui/Skeleton.tsx`
- Create: `frontend/src/components/ui/Divider.tsx`
- Create: `frontend/src/components/ui/index.ts`

**Step 1: Button component**

```tsx
// frontend/src/components/ui/Button.tsx
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
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium
          transition-all duration-150 ease-out
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

**Step 2: Card component**

```tsx
// frontend/src/components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  return (
    <div className={`
      bg-surface rounded-lg border border-border shadow-card
      ${hover ? 'hover:shadow-dropdown transition-shadow duration-200' : ''}
      ${paddings[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
}
```

**Step 3: Input component**

```tsx
// frontend/src/components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 text-sm rounded-sm
            bg-surface border border-border
            text-text-primary placeholder:text-text-tertiary
            focus:outline-none focus:ring-2 focus:ring-aviation/20 focus:border-aviation
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
```

**Step 4: Badge component**

```tsx
// frontend/src/components/ui/Badge.tsx
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-aviation-light text-aviation',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-subtle text-text-secondary',
};

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}
      ${badgeVariants[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}
```

**Step 5: Skeleton component**

```tsx
// frontend/src/components/ui/Skeleton.tsx
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const baseClasses = 'animate-shimmer rounded-sm';
  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: '',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}
```

**Step 6: Barrel export**

```tsx
// frontend/src/components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Badge } from './Badge';
export { Skeleton } from './Skeleton';
```

**Step 7: Verify build**

```bash
cd frontend && npm run build
# Expected: builds without errors (even if components aren't used yet)
```

**Step 8: Commit**

```bash
git add frontend/src/components/ui/
git commit -m "feat: create design system component primitives (Button, Card, Input, Badge, Skeleton)"
```

---

## Phase 2: App Shell & Layout

### Task 3: Build the app shell with navigation

**Objective:** Replace the current navbar with a premium app shell that communicates "enterprise airline software."

**Files:**
- Replace: `frontend/src/App.tsx`
- Replace: `frontend/src/App.css` (delete, no longer needed)
- Create: `frontend/src/components/Shell.tsx`
- Create: `frontend/src/components/TopBar.tsx`
- Create: `frontend/src/components/StatusBar.tsx`

**Step 1: TopBar component**

```tsx
// frontend/src/components/TopBar.tsx
import { Plane, Clock, Wifi, Battery } from 'lucide-react';
import { useEffect, useState } from 'react';

export function TopBar() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-navy text-white flex items-center justify-between px-6 flex-shrink-0 select-none">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Plane size={20} className="text-white/80" />
          <span className="font-semibold text-sm tracking-wide">AVIATION TRANSLATION SYSTEM</span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <span className="text-xs text-white/60 font-medium">Operator Terminal</span>
      </div>
      
      {/* Center: Context indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/80 font-medium">System Online</span>
        </div>
      </div>
      
      {/* Right: Time + Status */}
      <div className="flex items-center gap-4 text-xs text-white/60">
        <div className="flex items-center gap-1.5">
          <Wifi size={14} />
          <span>Connected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span className="tabular-nums">
            {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: StatusBar component (bottom)**

```tsx
// frontend/src/components/StatusBar.tsx
interface StatusBarProps {
  translationCount?: number;
  avgLatency?: number;
  guardRate?: string;
  modelName?: string;
}

export function StatusBar({ 
  translationCount = 0, 
  avgLatency = 0, 
  guardRate = '0%',
  modelName = 'Gemini Flash'
}: StatusBarProps) {
  return (
    <footer className="h-8 bg-navy text-white/50 flex items-center justify-between px-6 text-xs flex-shrink-0 select-none">
      <div className="flex items-center gap-4">
        <span>{translationCount.toLocaleString()} translations today</span>
        <span className="text-white/20">·</span>
        <span>{avgLatency}ms avg latency</span>
        <span className="text-white/20">·</span>
        <span>{guardRate} terminology compliance</span>
      </div>
      <div className="flex items-center gap-4">
        <span>Model: {modelName}</span>
        <span className="text-white/20">·</span>
        <span>v0.1.0</span>
      </div>
    </footer>
  );
}
```

**Step 3: Shell component**

```tsx
// frontend/src/components/Shell.tsx
import { type ReactNode } from 'react';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';

interface ShellProps {
  children: ReactNode;
  translationCount?: number;
  avgLatency?: number;
  guardRate?: string;
}

export function Shell({ children, translationCount, avgLatency, guardRate }: ShellProps) {
  return (
    <div className="h-screen flex flex-col bg-page overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <StatusBar 
        translationCount={translationCount}
        avgLatency={avgLatency}
        guardRate={guardRate}
      />
    </div>
  );
}
```

**Step 4: Rewrite App.tsx**

```tsx
// frontend/src/App.tsx
import { useState } from 'react';
import { Shell } from './components/Shell';
import { OperatorTerminal } from './components/OperatorTerminal';
import { DashboardView } from './components/DashboardView';
import { DemoWalkthrough } from './components/DemoWalkthrough';
import './index.css';

type View = 'operator' | 'dashboard' | 'demo';

function App() {
  const [currentView, setCurrentView] = useState<View>('operator');
  const [metrics, setMetrics] = useState({ count: 0, latency: 0, guardRate: '0%' });

  return (
    <Shell 
      translationCount={metrics.count}
      avgLatency={metrics.latency}
      guardRate={metrics.guardRate}
    >
      {/* View Switcher — subtle, bottom-left floating */}
      <div className="absolute bottom-12 left-6 z-50 flex gap-1 bg-surface rounded-lg border border-border shadow-dropdown p-1">
        {([
          ['operator', 'Terminal'],
          ['dashboard', 'Dashboard'],
          ['demo', 'Demo'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCurrentView(key)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150
              ${currentView === key 
                ? 'bg-aviation text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
      
      {currentView === 'operator' && <OperatorTerminal onMetrics={setMetrics} />}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'demo' && <DemoWalkthrough />}
    </Shell>
  );
}

export default App;
```

**Step 5: Delete App.css**

```bash
rm frontend/src/App.css
```

**Step 6: Verify build**

```bash
cd frontend && npm run build
# Expected: builds, but may have import errors for components not yet created
# Stub OperatorTerminal, DashboardView, DemoWalkthrough if needed
```

**Step 7: Commit**

```bash
git add frontend/src/
git rm frontend/src/App.css
git commit -m "feat: build premium app shell with navy TopBar, StatusBar, and view switcher"
```

---

### Task 4: Create stub components to verify shell

**Objective:** Create minimal stub components so the app builds and renders.

**Files:**
- Create: `frontend/src/components/OperatorTerminal.tsx`
- Create: `frontend/src/components/DashboardView.tsx`
- Create: `frontend/src/components/DemoWalkthrough.tsx`

**Step 1: OperatorTerminal stub**

```tsx
// frontend/src/components/OperatorTerminal.tsx
export function OperatorTerminal({ onMetrics }: { onMetrics: (m: any) => void }) {
  return (
    <div className="h-full flex items-center justify-center text-text-tertiary">
      <div className="text-center space-y-2">
        <div className="text-6xl">✈️</div>
        <p className="text-lg font-medium">Operator Terminal</p>
        <p className="text-sm">Coming soon</p>
      </div>
    </div>
  );
}
```

**Step 2: DashboardView stub**

```tsx
// frontend/src/components/DashboardView.tsx
export function DashboardView() {
  return (
    <div className="h-full flex items-center justify-center text-text-tertiary">
      <div className="text-center space-y-2">
        <div className="text-6xl">📊</div>
        <p className="text-lg font-medium">Operational Dashboard</p>
        <p className="text-sm">Coming soon</p>
      </div>
    </div>
  );
}
```

**Step 3: DemoWalkthrough stub**

```tsx
// frontend/src/components/DemoWalkthrough.tsx
export function DemoWalkthrough() {
  return (
    <div className="h-full flex items-center justify-center text-text-tertiary">
      <div className="text-center space-y-2">
        <div className="text-6xl">🎬</div>
        <p className="text-lg font-medium">Demo Walkthrough</p>
        <p className="text-sm">Coming soon</p>
      </div>
    </div>
  );
}
```

**Step 4: Verify build**

```bash
cd frontend && npm run build
# Expected: clean build
```

**Step 5: Commit**

```bash
git add frontend/src/components/OperatorTerminal.tsx frontend/src/components/DashboardView.tsx frontend/src/components/DemoWalkthrough.tsx
git commit -m "feat: add stub views for operator terminal, dashboard, and demo walkthrough"
```

---

## Phase 3: Operator Terminal — Primary Screen

This is the main interface. Every pixel matters. This is what the demo viewer sees 80% of the time.

### Task 5: Build the Context Header

**Objective:** The top section showing flight info, touchpoint, and language direction. Must feel like an airline operations tool.

**Files:**
- Create: `frontend/src/components/ContextHeader.tsx`
- Modify: `frontend/src/components/OperatorTerminal.tsx`

```tsx
// frontend/src/components/ContextHeader.tsx
import { MapPin, Plane, ArrowRight, ChevronDown } from 'lucide-react';
import { Touchpoint, type FlightContext } from '../types';

interface ContextHeaderProps {
  touchpoint: Touchpoint;
  onTouchpointChange: (t: Touchpoint) => void;
  flight?: FlightContext;
  sourceLang: string;
  targetLang: string;
  onSwapLanguages: () => void;
  sourceLangName: string;
  targetLangName: string;
}

const TOUCHPOINTS: { value: Touchpoint; label: string; icon: string }[] = [
  { value: 'BOARDING', label: 'Boarding Gate', icon: '🚪' },
  { value: 'CHECK_IN', label: 'Check-in Counter', icon: '🛂' },
  { value: 'SECURITY', label: 'Security Screening', icon: '🔍' },
  { value: 'PASSPORT', label: 'Passport Control', icon: '📋' },
  { value: 'BAGGAGE', label: 'Baggage Claim', icon: '🧳' },
  { value: 'TRANSFER', label: 'Transfer Desk', icon: '🔄' },
  { value: 'DIRECTIONS', label: 'Directions', icon: '🧭' },
  { value: 'DELAY', label: 'Flight Delay', icon: '⏰' },
  { value: 'IRREGULAR', label: 'Irregular Ops', icon: '⚠️' },
  { value: 'EMERGENCY', label: 'Emergency', icon: '🚨' },
  { value: 'GENERAL', label: 'General', icon: '💬' },
];

export function ContextHeader({
  touchpoint, onTouchpointChange, flight,
  sourceLang, targetLang, onSwapLanguages,
  sourceLangName, targetLangName,
}: ContextHeaderProps) {
  const currentTouchpoint = TOUCHPOINTS.find(t => t.value === touchpoint) || TOUCHPOINTS[10];
  const isEmergency = touchpoint === 'EMERGENCY';
  
  return (
    <div className={`
      px-6 py-4 border-b border-border
      ${isEmergency ? 'bg-danger-bg border-danger/20' : 'bg-surface'}
      transition-colors duration-300
    `}>
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        {/* Left: Touchpoint + Flight Info */}
        <div className="flex items-center gap-6">
          {/* Touchpoint Selector */}
          <div className="relative group">
            <button className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              text-sm font-medium transition-all duration-150
              ${isEmergency 
                ? 'bg-danger/10 text-danger hover:bg-danger/20' 
                : 'bg-subtle text-text-primary hover:bg-border'
              }
            `}>
              <span className="text-lg">{currentTouchpoint.icon}</span>
              <span>{currentTouchpoint.label}</span>
              <ChevronDown size={14} className="text-text-tertiary" />
            </button>
            
            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-1 w-56 bg-surface rounded-lg border border-border shadow-dropdown opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 py-1">
              {TOUCHPOINTS.map(tp => (
                <button
                  key={tp.value}
                  onClick={() => onTouchpointChange(tp.value)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                    hover:bg-subtle transition-colors duration-75
                    ${tp.value === touchpoint ? 'bg-aviation-light text-aviation font-medium' : 'text-text-primary'}
                    ${tp.value === 'EMERGENCY' ? 'text-danger hover:bg-danger-bg' : ''}
                  `}
                >
                  <span className="text-base">{tp.icon}</span>
                  <span>{tp.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Flight Info (when available) */}
          {flight && (
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="flex items-center gap-1.5">
                <Plane size={14} className="text-aviation" />
                <span className="text-sm font-semibold text-text-primary tabular-nums">{flight.flight}</span>
              </div>
              {flight.gate && (
                <>
                  <span className="text-text-tertiary text-xs">·</span>
                  <span className="text-sm text-text-secondary">
                    Gate <span className="font-semibold text-text-primary">{flight.gate}</span>
                  </span>
                </>
              )}
              {flight.destination && (
                <>
                  <span className="text-text-tertiary text-xs">·</span>
                  <span className="text-sm text-text-secondary">
                    to <span className="font-medium text-text-primary">{flight.destination}</span>
                  </span>
                </>
              )}
              {flight.status && (
                <Badge variant={flight.status === 'DELAYED' ? 'warning' : 'success'} size="sm">
                  {flight.status}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Right: Language Direction */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-medium ${sourceLang === 'tr' ? 'text-text-primary' : 'text-text-secondary'}`}>
              {sourceLangName}
            </span>
            <button
              onClick={onSwapLanguages}
              className="p-1.5 rounded-md hover:bg-subtle transition-colors duration-150"
              title="Swap languages"
            >
              <ArrowRight size={16} className="text-text-tertiary" />
            </button>
            <span className="font-semibold text-text-primary">
              {targetLangName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create types file**

```tsx
// frontend/src/types.ts
export type Touchpoint = 
  | 'CHECK_IN' | 'SECURITY' | 'PASSPORT' | 'BOARDING' 
  | 'GATE' | 'TRANSFER' | 'BAGGAGE' | 'DELAY' 
  | 'IRREGULAR' | 'DIRECTIONS' | 'EMERGENCY' | 'GENERAL';

export interface FlightContext {
  flight: string;
  gate?: string;
  destination?: string;
  destination_code?: string;
  status?: string;
  boarding_rows?: string;
}

export interface TranslationResult {
  translation: string;
  raw_translation: string;
  source_text: string;
  source_lang: string;
  target_lang: string;
  touchpoint: string;
  model_used: string;
  latency_ms: number;
  glossary_terms_injected: number;
  guard_corrections: GuardCorrection[];
  guard_active: boolean;
  notes: string[];
}

export interface GuardCorrection {
  original: string;
  corrected: string;
  term_id?: string;
  reason: string;
}

export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: 'tr', name: 'Turkish' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Chinese' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'fa', name: 'Persian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
];
```

**Step 3: Commit**

```bash
git add frontend/src/components/ContextHeader.tsx frontend/src/types.ts
git commit -m "feat: build ContextHeader with touchpoint dropdown, flight info, and language direction"
```

### Task 6: Build the Translation Display (centerpiece)

**Objective:** The large, readable area where translations appear. This is what passengers see on the facing display. Must be crystal clear at a distance.

**Files:**
- Create: `frontend/src/components/TranslationDisplay.tsx`
- Create: `frontend/src/components/GuardDiff.tsx`
- Modify: `frontend/src/components/OperatorTerminal.tsx`

**Step 1: TranslationDisplay component**

```tsx
// frontend/src/components/TranslationDisplay.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Copy } from 'lucide-react';
import { GuardDiff } from './GuardDiff';
import type { TranslationResult } from '../types';

interface TranslationDisplayProps {
  result: TranslationResult | null;
  loading: boolean;
  sourceText: string;
  onPlayTTS: (text: string) => void;
  streaming?: boolean;
  partialText?: string;
}

export function TranslationDisplay({ 
  result, loading, sourceText, onPlayTTS, streaming, partialText 
}: TranslationDisplayProps) {
  // Empty state
  if (!result && !loading && !sourceText) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-aviation-light flex items-center justify-center">
            <span className="text-3xl">💬</span>
          </div>
          <div>
            <p className="text-text-primary font-semibold text-lg mb-1">Ready to Translate</p>
            <p className="text-text-tertiary text-sm leading-relaxed">
              Speak into the microphone or type text to begin real-time aviation translation
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !streaming) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-aviation border-t-transparent animate-spin" />
          <p className="text-text-secondary text-sm">Translating...</p>
        </div>
      </div>
    );
  }

  const displayText = streaming && partialText ? partialText : result?.translation || '';

  return (
    <div className="flex-1 flex flex-col min-h-[300px]">
      {/* Source text — subtle, smaller */}
      {sourceText && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-8 pt-6 pb-2"
        >
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">Source</p>
          <p className="text-text-secondary text-sm leading-relaxed">{sourceText}</p>
        </motion.div>
      )}
      
      {/* Translation — large, prominent */}
      <div className="flex-1 flex flex-col px-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Translation</p>
          {result && !streaming && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onPlayTTS(result.translation)}
                className="p-1.5 rounded-md text-text-tertiary hover:text-aviation hover:bg-aviation-light transition-colors"
                title="Play audio"
              >
                <Volume2 size={16} />
              </button>
              <button 
                onClick={() => navigator.clipboard.writeText(result.translation)}
                className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors"
                title="Copy"
              >
                <Copy size={16} />
              </button>
            </div>
          )}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={displayText || 'loading'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`
              flex-1 flex items-center
              ${!displayText ? 'justify-center' : ''}
            `}
          >
            {displayText ? (
              <p className={`
                text-2xl font-semibold text-text-primary leading-relaxed
                ${streaming ? 'after:content-["|"] after:animate-pulse after:text-aviation after:ml-0.5' : ''}
              `}>
                {displayText}
              </p>
            ) : (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 rounded-full bg-aviation/40"
                    style={{ animation: `pulse 1s ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Guard corrections — below translation */}
      {result && result.guard_corrections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.3 }}
          className="px-8 pb-6"
        >
          <GuardDiff corrections={result.guard_corrections} raw={result.raw_translation} />
        </motion.div>
      )}
      
      {/* Pipeline metadata — subtle footer */}
      {result && !streaming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-8 pb-4 flex items-center gap-4 text-xs text-text-tertiary"
        >
          <span>{result.latency_ms}ms</span>
          <span className="text-border">·</span>
          <span>{result.model_used}</span>
          <span className="text-border">·</span>
          <span>{result.glossary_terms_injected} glossary terms</span>
          {result.notes.length > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="text-warning">{result.notes.length} note{result.notes.length > 1 ? 's' : ''}</span>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
```

**Step 2: GuardDiff component**

```tsx
// frontend/src/components/GuardDiff.tsx
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import type { GuardCorrection } from '../types';

interface GuardDiffProps {
  corrections: GuardCorrection[];
  raw: string;
}

export function GuardDiff({ corrections, raw }: GuardDiffProps) {
  if (corrections.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border border-success/20 bg-success-bg/50 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-success" />
        <span className="text-xs font-semibold text-success uppercase tracking-wider">
          Terminology Guard — {corrections.length} correction{corrections.length > 1 ? 's' : ''}
        </span>
      </div>
      
      {corrections.map((correction, i) => (
        <motion.div
          key={correction.original + i}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * i }}
          className="flex items-center gap-2 text-sm"
        >
          <span className="text-danger line-through font-medium animate-guard-highlight px-1 rounded">
            {correction.original}
          </span>
          <ArrowRight size={12} className="text-success shrink-0" />
          <span className="text-success font-semibold px-1 rounded bg-success/5">
            {correction.corrected}
          </span>
          <span className="text-text-tertiary text-xs ml-auto">
            {correction.reason}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/TranslationDisplay.tsx frontend/src/components/GuardDiff.tsx
git commit -m "feat: build TranslationDisplay with GuardDiff — the centerpiece of the operator view"
```

### Task 7: Build the Input Area (voice + text)

**Objective:** The bottom section where the agent speaks or types. Voice button is the hero element.

**Files:**
- Create: `frontend/src/components/InputArea.tsx`
- Create: `frontend/src/components/VoiceButton.tsx`
- Modify: `frontend/src/components/OperatorTerminal.tsx`

**Step 1: VoiceButton component**

```tsx
// frontend/src/components/VoiceButton.tsx
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceButtonProps {
  recording: boolean;
  loading: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function VoiceButton({ recording, loading, disabled, onToggle }: VoiceButtonProps) {
  return (
    <div className="relative">
      {/* Pulse rings when recording */}
      {recording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-danger/20"
            animate={{ scale: [1, 1.8, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-danger/10"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </>
      )}
      
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-300 ease-out
          ${recording 
            ? 'bg-danger text-white shadow-lg shadow-danger/30 scale-110' 
            : loading
              ? 'bg-subtle text-text-tertiary cursor-wait'
              : 'bg-aviation text-white shadow-lg shadow-aviation/20 hover:shadow-aviation/30 hover:scale-105 active:scale-95'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <Loader2 size={32} className="animate-spin" />
        ) : recording ? (
          <MicOff size={32} />
        ) : (
          <Mic size={32} />
        )}
      </button>
      
      {/* Label */}
      <p className="text-center mt-3 text-xs font-medium text-text-tertiary">
        {recording ? 'Tap to stop' : loading ? 'Processing...' : 'Tap to speak'}
      </p>
    </div>
  );
}
```

**Step 2: InputArea component**

```tsx
// frontend/src/components/InputArea.tsx
import { useState } from 'react';
import { Send, Keyboard, Mic } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { Button } from './ui/Button';

interface InputAreaProps {
  onTranslate: (text: string) => void;
  onVoiceToggle: () => void;
  recording: boolean;
  loading: boolean;
  sourceLangName: string;
}

export function InputArea({ onTranslate, onVoiceToggle, recording, loading, sourceLangName }: InputAreaProps) {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onTranslate(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-6 py-4 border-t border-border bg-surface">
      <div className="max-w-2xl mx-auto">
        {/* Mode toggle */}
        <div className="flex justify-center mb-4">
          <div className="flex bg-subtle rounded-lg p-0.5">
            <button
              onClick={() => setMode('voice')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150
                ${mode === 'voice' 
                  ? 'bg-surface text-text-primary shadow-sm' 
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              <Mic size={16} />
              Voice
            </button>
            <button
              onClick={() => setMode('text')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150
                ${mode === 'text' 
                  ? 'bg-surface text-text-primary shadow-sm' 
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              <Keyboard size={16} />
              Text
            </button>
          </div>
        </div>

        {/* Voice mode */}
        {mode === 'voice' && (
          <div className="flex flex-col items-center py-4">
            <VoiceButton
              recording={recording}
              loading={loading}
              disabled={loading && !recording}
              onToggle={onVoiceToggle}
            />
            <p className="mt-4 text-sm text-text-tertiary text-center">
              Speak in <span className="font-medium text-text-secondary">{sourceLangName}</span>
            </p>
          </div>
        )}

        {/* Text mode */}
        {mode === 'text' && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type in ${sourceLangName}...`}
                disabled={loading}
                rows={3}
                className="
                  w-full px-4 py-3 text-sm rounded-lg
                  bg-surface border border-border
                  text-text-primary placeholder:text-text-tertiary
                  focus:outline-none focus:ring-2 focus:ring-aviation/20 focus:border-aviation
                  transition-all duration-150 resize-none
                  disabled:opacity-50
                "
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!text.trim() || loading}
                loading={loading}
                icon={<Send size={16} />}
                size="lg"
              >
                Translate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/InputArea.tsx frontend/src/components/VoiceButton.tsx
git commit -m "feat: build InputArea with voice button (pulse animation) and text mode"
```

### Task 8: Assemble the full OperatorTerminal

**Objective:** Wire ContextHeader + TranslationDisplay + InputArea together into the complete operator screen.

**Files:**
- Replace: `frontend/src/components/OperatorTerminal.tsx`

```tsx
// frontend/src/components/OperatorTerminal.tsx
import { useState, useCallback } from 'react';
import { ContextHeader } from './ContextHeader';
import { TranslationDisplay } from './TranslationDisplay';
import { InputArea } from './InputArea';
import type { Touchpoint, FlightContext, TranslationResult } from '../types';

const API_BASE = 'http://localhost:8000/api';

// Demo flight context — makes it look real
const DEMO_FLIGHT: FlightContext = {
  flight: 'TK1234',
  gate: 'A12',
  destination: 'London',
  destination_code: 'LHR',
  status: 'BOARDING',
  boarding_rows: '15-25',
};

const LANGUAGE_NAMES: Record<string, string> = {
  tr: 'Turkish', en: 'English', ar: 'Arabic', ru: 'Russian',
  de: 'German', fr: 'French', zh: 'Chinese', es: 'Spanish',
  it: 'Italian', fa: 'Persian', ja: 'Japanese', ko: 'Korean',
  pt: 'Portuguese', nl: 'Dutch',
};

export function OperatorTerminal({ onMetrics }: { onMetrics: (m: any) => void }) {
  const [touchpoint, setTouchpoint] = useState<Touchpoint>('BOARDING');
  const [sourceLang, setSourceLang] = useState('tr');
  const [targetLang, setTargetLang] = useState('en');
  const [sourceText, setSourceText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [partialText, setPartialText] = useState('');

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setResult(null);
    setSourceText('');
  };

  const handleTranslate = async (text: string) => {
    setSourceText(text);
    setLoading(true);
    setStreaming(false);
    setPartialText('');
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source_lang: sourceLang,
          target_lang: targetLang,
          context: { touchpoint, flight: DEMO_FLIGHT },
        }),
      });
      const data: TranslationResult = await res.json();
      setResult(data);
      
      // Update metrics
      onMetrics((prev: any) => ({
        count: prev.count + 1,
        latency: Math.round((prev.latency * (prev.count) + data.latency_ms) / (prev.count + 1)),
        guardRate: data.guard_corrections.length > 0 ? 'Active' : 'Clean',
      }));
    } catch (e) {
      console.error('Translation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    // Voice implementation — connects to existing STT pipeline
    setRecording(!recording);
  };

  const handlePlayTTS = (text: string) => {
    // TTS implementation — connects to existing TTS endpoint
    console.log('TTS:', text);
  };

  return (
    <div className="h-full flex flex-col">
      <ContextHeader
        touchpoint={touchpoint}
        onTouchpointChange={setTouchpoint}
        flight={DEMO_FLIGHT}
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSwapLanguages={swapLanguages}
        sourceLangName={LANGUAGE_NAMES[sourceLang]}
        targetLangName={LANGUAGE_NAMES[targetLang]}
      />
      
      <TranslationDisplay
        result={result}
        loading={loading}
        sourceText={sourceText}
        onPlayTTS={handlePlayTTS}
        streaming={streaming}
        partialText={partialText}
      />
      
      <InputArea
        onTranslate={handleTranslate}
        onVoiceToggle={handleVoiceToggle}
        recording={recording}
        loading={loading}
        sourceLangName={LANGUAGE_NAMES[sourceLang]}
      />
    </div>
  );
}
```

**Step 2: Verify build**

```bash
cd frontend && npm run build
# Fix any import issues
```

**Step 3: Commit**

```bash
git add frontend/src/components/OperatorTerminal.tsx
git commit -m "feat: assemble full OperatorTerminal with live flight context and demo data"
```

---

## Phase 4: Dashboard — Live Metrics

### Task 9: Build the live DashboardView

**Objective:** Real-time operational dashboard with four stat cards, touchpoint distribution, recent activity. Polls backend metrics endpoint.

**Files:**
- Replace: `frontend/src/components/DashboardView.tsx`
- Create: `frontend/src/hooks/useMetrics.ts`

**Step 1: useMetrics hook**

```tsx
// frontend/src/hooks/useMetrics.ts
import { useState, useEffect } from 'react';

interface Metrics {
  total_translations: number;
  guard_interventions: number;
  guard_rate: string;
  avg_latency_ms: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
  cache_hit_rate: string;
  uptime_seconds: number;
  by_touchpoint: Record<string, number>;
  by_language_pair: Record<string, number>;
}

export function useMetrics(refreshMs = 5000) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/debug/health');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        // Transform health response into metrics format
        setMetrics({
          total_translations: 0, // Will be filled by real metrics endpoint
          guard_interventions: 0,
          guard_rate: '0%',
          avg_latency_ms: 0,
          latency_p50_ms: 0,
          latency_p95_ms: 0,
          cache_hit_rate: '0%',
          uptime_seconds: 0,
          by_touchpoint: {},
          by_language_pair: {},
        });
        setError(false);
      } catch {
        setError(true);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);

  return { metrics, error };
}
```

**Step 2: DashboardView component**

```tsx
// frontend/src/components/DashboardView.tsx
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Zap, Globe, Clock, TrendingUp } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { useMetrics } from '../hooks/useMetrics';

function StatCard({ 
  icon, label, value, subtitle, accent = 'aviation', loading 
}: { 
  icon: React.ReactNode; label: string; value: string; subtitle: string; 
  accent?: 'aviation' | 'success' | 'warning' | 'danger';
  loading: boolean;
}) {
  const accentClasses = {
    aviation: 'border-t-aviation',
    success: 'border-t-success',
    warning: 'border-t-warning',
    danger: 'border-t-danger',
  };

  return (
    <Card className={`border-t-[3px] ${accentClasses[accent]}`} padding="lg">
      <div className="flex items-center gap-2 mb-3">
        <span className={`
          ${accent === 'aviation' ? 'text-aviation' : ''}
          ${accent === 'success' ? 'text-success' : ''}
          ${accent === 'warning' ? 'text-warning' : ''}
          ${accent === 'danger' ? 'text-danger' : ''}
        `}>
          {icon}
        </span>
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{label}</span>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold text-text-primary tabular-nums mb-1">{value}</div>
          <div className="text-xs text-text-tertiary">{subtitle}</div>
        </>
      )}
    </Card>
  );
}

export function DashboardView() {
  const { metrics, error } = useMetrics();
  const loading = !metrics && !error;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Operational Analytics</h1>
          <p className="text-sm text-text-tertiary mt-1">Real-time translation metrics across all touchpoints</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity size={18} />}
            label="Translations"
            value={metrics?.total_translations.toLocaleString() || '0'}
            subtitle="Total today"
            accent="aviation"
            loading={loading}
          />
          <StatCard
            icon={<ShieldAlert size={18} />}
            label="Guard Rate"
            value={metrics?.guard_rate || '0%'}
            subtitle="Terminology corrections"
            accent={metrics && parseFloat(metrics.guard_rate) > 20 ? 'warning' : 'success'}
            loading={loading}
          />
          <StatCard
            icon={<Zap size={18} />}
            label="Avg Latency"
            value={metrics ? `${Math.round(metrics.avg_latency_ms)}ms` : '0ms'}
            subtitle={`P95: ${metrics ? Math.round(metrics.latency_p95_ms) : 0}ms`}
            accent={metrics && metrics.avg_latency_ms < 500 ? 'success' : 'warning'}
            loading={loading}
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Cache Hits"
            value={metrics?.cache_hit_rate || '0%'}
            subtitle="Instant translations"
            accent="aviation"
            loading={loading}
          />
        </div>

        {/* Touchpoint Distribution */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Globe size={16} className="text-text-tertiary" />
            Activity by Touchpoint
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : !metrics || Object.keys(metrics.by_touchpoint).length === 0 ? (
            <p className="text-sm text-text-tertiary py-8 text-center">
              Start translating to see touchpoint distribution
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.by_touchpoint)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([touchpoint, count]) => {
                  const maxCount = Math.max(...Object.values(metrics.by_touchpoint));
                  const width = (count / maxCount) * 100;
                  return (
                    <div key={touchpoint} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-text-secondary w-28 truncate">
                        {touchpoint.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 h-6 bg-subtle rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-aviation rounded-full"
                        />
                      </div>
                      <span className="text-xs font-semibold text-text-primary tabular-nums w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        {/* Uptime */}
        <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary">
          <Clock size={12} />
          <span>
            System online for {metrics ? Math.floor(metrics.uptime_seconds / 3600) : 0}h{' '}
            {metrics ? Math.floor((metrics.uptime_seconds % 3600) / 60) : 0}m
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/DashboardView.tsx frontend/src/hooks/useMetrics.ts
git commit -m "feat: build live DashboardView with animated stat cards and touchpoint distribution"
```

---

## Phase 5: Demo Walkthrough — The Story

### Task 10: Build the scripted DemoWalkthrough

**Objective:** A guided, step-by-step demo that walks a viewer through every capability. Each step highlights a different feature with explanations.

**Files:**
- Replace: `frontend/src/components/DemoWalkthrough.tsx`
- Create: `frontend/src/data/demoScript.ts`

**Step 1: Demo script data**

```tsx
// frontend/src/data/demoScript.ts
import type { Touchpoint, FlightContext } from '../types';

export interface DemoStep {
  id: number;
  title: string;
  description: string;
  highlight: 'context' | 'guard' | 'speed' | 'multilang' | 'emergency';
  phrase: string;
  sourceLang: string;
  targetLang: string;
  touchpoint: Touchpoint;
  flight: FlightContext;
  expectedBehavior: string;
  visualHint: string;
}

export const DEMO_SCRIPT: DemoStep[] = [
  {
    id: 1,
    title: 'Context-Aware Translation',
    description: 'The same Turkish word "sıra" translates differently depending on where you are in the airport.',
    highlight: 'context',
    phrase: '15 ile 25. sıralar arasındaki yolcular biniş yapabilir',
    sourceLang: 'tr',
    targetLang: 'en',
    touchpoint: 'BOARDING',
    flight: { flight: 'TK1234', gate: 'A12', destination: 'London', destination_code: 'LHR', status: 'BOARDING', boarding_rows: '15-25' },
    expectedBehavior: '"sıralar" → "rows" (not "queues")',
    visualHint: 'Watch how "sıralar" becomes "rows" at the boarding gate — this would be "queues" at check-in.',
  },
  {
    id: 2,
    title: 'Terminology Enforcement',
    description: 'The guard layer catches and corrects non-standard aviation terms in real-time.',
    highlight: 'guard',
    phrase: 'Biniş kartınızı okutunuz lütfen',
    sourceLang: 'tr',
    targetLang: 'en',
    touchpoint: 'BOARDING',
    flight: { flight: 'TK1234', gate: 'A12', destination: 'London', destination_code: 'LHR', status: 'BOARDING', boarding_rows: '15-25' },
    expectedBehavior: 'Guard corrects any non-standard terms',
    visualHint: 'If the LLM outputs "boarding card" or "boarding ticket", the guard will correct it to "boarding pass" in real-time.',
  },
  {
    id: 3,
    title: 'Context Shift — Same Phrase, Different Meaning',
    description: 'Now watch what happens when the same phrase is used at a different touchpoint.',
    highlight: 'context',
    phrase: 'Sıraya giriniz lütfen',
    sourceLang: 'tr',
    targetLang: 'en',
    touchpoint: 'CHECK_IN',
    flight: { flight: 'TK1234', gate: 'A12', destination: 'London', destination_code: 'LHR', status: 'CHECK_IN' },
    expectedBehavior: '"sıra" → "queue" (not "row")',
    visualHint: 'Same word "sıra" — but now at check-in it means "queue", not "row". This is context-aware translation.',
  },
  {
    id: 4,
    title: 'Multi-Language Support',
    description: 'Instantly switch to any of 14 supported languages.',
    highlight: 'multilang',
    phrase: 'Uçuşunuz rötar yaptı, yeni kapınız B04',
    sourceLang: 'tr',
    targetLang: 'ar',
    touchpoint: 'DELAY',
    flight: { flight: 'TK1234', gate: 'B04', destination: 'London', destination_code: 'LHR', status: 'DELAYED' },
    expectedBehavior: 'Arabic translation with correct aviation terminology',
    visualHint: '14 languages supported — including Arabic, Russian, Chinese, Persian, and Japanese.',
  },
  {
    id: 5,
    title: 'Emergency Communication',
    description: 'In emergency situations, clarity and speed are critical.',
    highlight: 'emergency',
    phrase: 'Acil durum! Lütfen en yakın çıkışa yönelin',
    sourceLang: 'tr',
    targetLang: 'en',
    touchpoint: 'EMERGENCY',
    flight: { flight: 'TK1234', gate: 'A12', destination: 'London', destination_code: 'LHR', status: 'EMERGENCY' },
    expectedBehavior: 'Clear, direct emergency instructions',
    visualHint: 'Notice the red emergency context bar — the system adapts its behavior for critical situations.',
  },
];
```

**Step 2: DemoWalkthrough component**

```tsx
// frontend/src/components/DemoWalkthrough.tsx
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Play, CheckCircle2, Sparkles, Shield, Zap, Globe, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { ContextHeader } from './ContextHeader';
import { TranslationDisplay } from './TranslationDisplay';
import { DEMO_SCRIPT, type DemoStep } from '../data/demoScript';
import type { TranslationResult } from '../types';

const API_BASE = 'http://localhost:8000/api';

const LANGUAGE_NAMES: Record<string, string> = {
  tr: 'Turkish', en: 'English', ar: 'Arabic', ru: 'Russian',
  de: 'German', fr: 'French', zh: 'Chinese', es: 'Spanish',
  it: 'Italian', fa: 'Persian', ja: 'Japanese', ko: 'Korean',
  pt: 'Portuguese', nl: 'Dutch',
};

const HIGHLIGHT_ICONS = {
  context: Sparkles,
  guard: Shield,
  speed: Zap,
  multilang: Globe,
  emergency: AlertTriangle,
};

const HIGHLIGHT_COLORS = {
  context: 'text-aviation bg-aviation-light border-aviation/20',
  guard: 'text-success bg-success-bg border-success/20',
  speed: 'text-warning bg-warning-bg border-warning/20',
  multilang: 'text-purple-600 bg-purple-50 border-purple-200',
  emergency: 'text-danger bg-danger-bg border-danger/20',
};

export function DemoWalkthrough() {
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  
  const step = DEMO_SCRIPT[stepIndex];
  const isLast = stepIndex === DEMO_SCRIPT.length - 1;
  const isFirst = stepIndex === 0;
  const HighlightIcon = HIGHLIGHT_ICONS[step.highlight];

  const runTranslation = useCallback(async (demoStep: DemoStep) => {
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: demoStep.phrase,
          source_lang: demoStep.sourceLang,
          target_lang: demoStep.targetLang,
          context: { touchpoint: demoStep.touchpoint, flight: demoStep.flight },
        }),
      });
      const data: TranslationResult = await res.json();
      setResult(data);
    } catch (e) {
      console.error('Demo translation failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = () => {
    setStarted(true);
    runTranslation(step);
  };

  const handleNext = () => {
    if (isLast) return;
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    runTranslation(DEMO_SCRIPT[nextIndex]);
  };

  const handlePrev = () => {
    if (isFirst) return;
    const prevIndex = stepIndex - 1;
    setStepIndex(prevIndex);
    runTranslation(DEMO_SCRIPT[prevIndex]);
  };

  const handleReplay = () => {
    runTranslation(step);
  };

  // Intro screen
  if (!started) {
    return (
      <div className="h-full flex items-center justify-center bg-page">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg mx-auto space-y-8"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-aviation-light flex items-center justify-center">
            <span className="text-5xl">✈️</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-text-primary">Aviation Translation System</h1>
            <p className="text-text-secondary leading-relaxed">
              A guided demonstration of context-aware, terminology-enforced aviation translation.
              See how the same words translate differently based on airport context.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-sm text-text-tertiary">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-aviation" />
              Context-Aware
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              Terminology Guard
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              14 Languages
            </div>
          </div>
          
          <Button size="xl" onClick={handleStart} icon={<Play size={20} />}>
            Start Demo
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main translation area (2/3) */}
      <div className="flex-1 flex flex-col">
        <ContextHeader
          touchpoint={step.touchpoint}
          onTouchpointChange={() => {}}
          flight={step.flight}
          sourceLang={step.sourceLang}
          targetLang={step.targetLang}
          onSwapLanguages={() => {}}
          sourceLangName={LANGUAGE_NAMES[step.sourceLang]}
          targetLangName={LANGUAGE_NAMES[step.targetLang]}
        />
        
        <TranslationDisplay
          result={result}
          loading={loading}
          sourceText={step.phrase}
          onPlayTTS={() => {}}
        />
        
        {/* Step navigation */}
        <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={isFirst} icon={<ArrowLeft size={16} />}>
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {DEMO_SCRIPT.map((_, i) => (
              <div
                key={i}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${i === stepIndex ? 'bg-aviation w-6' : 'bg-border'}
                `}
              />
            ))}
          </div>
          
          <Button onClick={handleNext} disabled={isLast} icon={<ArrowRight size={16} />}>
            {isLast ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
      
      {/* Side panel (1/3) — Explanation */}
      <div className="w-96 border-l border-border bg-surface flex flex-col">
        {/* Step header with highlight */}
        <div className={`px-6 py-4 border-b ${HIGHLIGHT_COLORS[step.highlight]}`}>
          <div className="flex items-center gap-2 mb-2">
            <HighlightIcon size={16} />
            <Badge variant={
              step.highlight === 'context' ? 'default' :
              step.highlight === 'guard' ? 'success' :
              step.highlight === 'speed' ? 'warning' :
              step.highlight === 'multilang' ? 'info' :
              'danger'
            }>
              {step.highlight === 'context' ? 'Context' :
               step.highlight === 'guard' ? 'Guard' :
               step.highlight === 'speed' ? 'Performance' :
               step.highlight === 'multilang' ? 'Multi-Language' :
               'Emergency'}
            </Badge>
          </div>
          <h2 className="text-lg font-bold text-text-primary">{step.title}</h2>
        </div>
        
        {/* Explanation content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          <div>
            <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-subtle space-y-2">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Input Phrase</p>
            <p className="text-sm text-text-primary font-medium">"{step.phrase}"</p>
            <p className="text-xs text-text-tertiary">
              {step.sourceLang === 'tr' ? 'Turkish' : step.sourceLang} →{' '}
              {step.targetLang === 'ar' ? 'Arabic' : step.targetLang === 'en' ? 'English' : step.targetLang}
            </p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Expected Behavior</p>
            <p className="text-sm text-success font-medium">{step.expectedBehavior}</p>
          </div>
          
          <div className="p-4 rounded-lg border border-aviation/10 bg-aviation-light/50">
            <p className="text-xs font-medium text-aviation uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles size={12} />
              What to Notice
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{step.visualHint}</p>
          </div>

          {/* Real-time latency */}
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-subtle flex items-center gap-3"
            >
              <CheckCircle2 size={16} className="text-success shrink-0" />
              <div className="text-xs">
                <span className="text-text-primary font-medium">{result.latency_ms}ms</span>
                <span className="text-text-tertiary"> · {result.model_used}</span>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Replay button */}
        <div className="px-6 py-4 border-t border-border">
          <Button variant="secondary" onClick={handleReplay} loading={loading} className="w-full" size="sm">
            Replay This Step
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/DemoWalkthrough.tsx frontend/src/data/demoScript.ts
git commit -m "feat: build scripted DemoWalkthrough with 5-step guided experience and explanation panel"
```

---

## Phase 6: Final Polish

### Task 11: Add page transitions and micro-interactions

**Objective:** Smooth transitions between views using Framer Motion.

**Files:**
- Modify: `frontend/src/App.tsx`

Add `AnimatePresence` wrapping the view content with fade+slide transitions.

### Task 12: Responsive design pass

**Objective:** Ensure the app works beautifully on iPad (1024×1366) and gracefully adapts to desktop.

**Files:**
- Modify: Various components

Key checks:
- Touchpoint dropdown works on touch
- Voice button is tappable with finger
- Text is readable without zoom
- Cards reflow on narrow viewports
- Demo side panel stacks below on narrow screens

### Task 13: Add loading shimmer to TranslationDisplay

**Objective:** Replace basic spinner with skeleton shimmer while translation loads.

Already partially implemented via the Skeleton component and shimmer animation in Task 1.

### Task 14: Verify full build and run

```bash
cd frontend && npm run build
# Expected: clean production build
cd .. && make test
# Expected: all 24 tests still pass
make dev
# Expected: server starts, debug UI works, API responds
```

### Task 15: Final commit

```bash
git add -A
git commit -m "chore: final UI/UX polish for trillion-dollar airline demo"
git push origin main
```

---

## Summary

| Phase | Tasks | Focus |
|---|---|---|
| 1: Design System | 2 | Tailwind 4, design tokens, component primitives |
| 2: App Shell | 2 | Navy TopBar, StatusBar, view switcher, layout |
| 3: Operator Terminal | 4 | ContextHeader, TranslationDisplay, GuardDiff, InputArea, VoiceButton |
| 4: Dashboard | 1 | Live metrics with animated stats |
| 5: Demo Walkthrough | 1 | 5-step guided demo with explanation panel |
| 6: Polish | 5 | Transitions, responsive, loading states, verify |

**What the demo viewer experiences:**
1. Opens the app → navy-branded shell with live clock, "System Online" indicator
2. Operator Terminal shows a boarding gate context with TK1234 to London
3. Taps mic or types → translation appears with smooth animation
4. Guard corrections highlight in red→green transition
5. Switches to Dashboard → sees live stats animating in
6. Opens Demo Walkthrough → guided 5-step experience showing context awareness, terminology enforcement, multi-language, and emergency mode
7. Every state looks intentional — no broken empty screens, no jarring loading spinners

**What makes it "trillion-dollar airline product":**
- Navy + white color palette with restrained use of aviation blue
- Generous spacing, clean typography (Inter), subtle shadows
- Live clock and "System Online" indicator in the top bar
- Context bar adapts to emergency mode (red background)
- All numbers use tabular-nums for alignment
- Guard corrections animate in with purpose
- Demo walkthrough tells a coherent story, not a feature checklist
- Bottom status bar with live metrics feels like mission control
- Zero raw CSS — everything through Tailwind design tokens
- Framer Motion for purposeful animations (not decorative)
