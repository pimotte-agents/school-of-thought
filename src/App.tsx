// =============================================================================
// App — School of Thought
// =============================================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSchoolStore } from './store/schoolStore';
import { StudentCard } from './components/StudentCard';
import { TheoremPanel } from './components/TheoremPanel';
import { PositionsPanel } from './components/PositionsPanel';
import { StaffCanvas } from './components/StaffCanvas';
import { ActionsPanel } from './components/ActionsPanel';
import { TopBar } from './components/TopBar';
import { BottomBar } from './components/BottomBar';
import './App.css';

function App() {
  const {
    students,
    gameSpeed,
    setGameSpeed,
    activeTheorems,
  } = useSchoolStore();

  const tickRef = useRef(useSchoolStore.getState().tick);
  const speedRef = useRef(useSchoolStore.getState().setGameSpeed);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Game loop
  useEffect(() => {
    tickRef.current = useSchoolStore.getState().tick;
    speedRef.current = useSchoolStore.getState().setGameSpeed;

    let lastTime = performance.now();
    let rafId: number;

    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      tickRef.current(dt);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleCycleSpeed = useCallback(() => {
    const speeds = [0, 1, 5] as const;
    const nextIdx = (speeds.indexOf(gameSpeed) + 1) % speeds.length;
    speedRef.current(speeds[nextIdx]);
  }, [gameSpeed]);

  const handleTogglePause = useCallback(() => {
    useSchoolStore.getState().setGameSpeed(gameSpeed === 0 ? 1 : 0);
  }, [gameSpeed]);

  return (
    <div className="app">
      <TopBar
        onTogglePause={handleTogglePause}
        onCycleSpeed={handleCycleSpeed}
      />

      <main className="main-content">
        {/* Left Panel — Theorem Pipeline + Positions */}
        <section className="panel center-panels">
          <div className="theorem-pipeline">
            <TheoremPanel />
          </div>
          <div className="positions-sidebar">
            <PositionsPanel />
          </div>
        </section>

        {/* Right Panel — Staff Canvas + Students */}
        <aside className="panel hierarchy">
          <StaffCanvas />
        </aside>

        {/* Actions & Log */}
        <aside className="panel actions-panel">
          <ActionsPanel />
        </aside>
      </main>

      <BottomBar />
    </div>
  );
}

export default App;
