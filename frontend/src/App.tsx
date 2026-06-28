import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shell } from './components/Shell';
import { OperatorTerminal } from './components/OperatorTerminal';
import { DualPanelView } from './components/DualPanelView';
import { ConversationView } from './components/ConversationView';
import { DashboardView } from './components/DashboardView';
import { DemoWalkthrough } from './components/DemoWalkthrough';
import { Onboarding } from './components/Onboarding';
import './index.css';

type View = 'dual' | 'chat' | 'operator' | 'dashboard' | 'demo';
const ONBOARDING_KEY = 'ats-onboarding-done';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function App() {
  const [view, setView] = useState<View>('dual');
  const [metrics, setMetrics] = useState({ count: 0, latency: 0 });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
    setView('demo');
  };

  const handleDemoComplete = () => {
    setView('dual');
  };

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Shell view={view} onViewChange={setView} count={metrics.count} latency={metrics.latency}>
        <AnimatePresence mode="wait">
          <motion.div key={view} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="h-full">
            {view === 'dual' && <DualPanelView onMetrics={(m) => setMetrics({ count: m.count, latency: m.latency })} />}
            {view === 'chat' && <ConversationView onMetrics={(m) => setMetrics({ count: m.count, latency: m.latency })} />}
            {view === 'operator' && <OperatorTerminal onMetrics={(m) => setMetrics({ count: m.count, latency: m.latency })} />}
            {view === 'dashboard' && <DashboardView />}
            {view === 'demo' && <DemoWalkthrough onComplete={handleDemoComplete} />}
          </motion.div>
        </AnimatePresence>
      </Shell>
    </>
  );
}

export default App;
