import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shell } from './components/Shell';
import { OperatorTerminal } from './components/OperatorTerminal';
import { DualPanelView } from './components/DualPanelView';
import { ConversationView } from './components/ConversationView';
import { DashboardView } from './components/DashboardView';
import { DemoWalkthrough } from './components/DemoWalkthrough';
import './index.css';

type View = 'dual' | 'chat' | 'operator' | 'dashboard' | 'demo';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function App() {
  const [view, setView] = useState<View>('dual');
  const [metrics, setMetrics] = useState({ count: 0, latency: 0 });

  return (
    <Shell view={view} onViewChange={setView} count={metrics.count} latency={metrics.latency}>
      <AnimatePresence mode="wait">
        <motion.div key={view} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="h-full">
          {view === 'dual' && <DualPanelView onMetrics={(m) => setMetrics({ count: m.count, latency: m.latency })} />}
          {view === 'chat' && <ConversationView onMetrics={(m) => setMetrics({ count: m.count, latency: m.latency })} />}
          {view === 'operator' && <OperatorTerminal onMetrics={(m) => setMetrics({ count: m.count, latency: m.latency })} />}
          {view === 'dashboard' && <DashboardView />}
          {view === 'demo' && <DemoWalkthrough />}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}

export default App;
