// =============================================================================
// App — School of Thought
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { useSchoolStore } from './store/schoolStore';
import './App.css';

function App() {
  const {
    students,
    resources,
    config,
    activeTheorems,
    currentTheorems,
    eventLog,
    gameSpeed,
    generation,
    totalMonthsPlayed,
  } = useSchoolStore();

  const tickRef = useRef(useSchoolStore.getState().tick);
  const speedRef = useRef(useSchoolStore.getState().setGameSpeed);

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

  const handleSpeedToggle = useCallback(() => {
    const speeds = [0, 1, 5] as const;
    const nextIdx = (speeds.indexOf(gameSpeed) + 1) % speeds.length;
    speedRef.current(speeds[nextIdx]);
  }, [gameSpeed]);

  const handleHire = useCallback(() => {
    useSchoolStore.getState().hireStudent();
  }, []);

  const togglePause = () => {
    useSchoolStore.getState().setGameSpeed(gameSpeed === 0 ? 1 : 0);
  };

  return (
    <div className="app">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="resources">
          <span className="resource theorems">📜 {resources.theorems.toFixed(1)}</span>
          <span className="resource money">💰 {resources.money.toFixed(0)}</span>
          <span className="resource reputation">⭐ {resources.reputation.toFixed(0)}</span>
          <span className="resource prestige">🏆 {resources.prestige.toFixed(1)}</span>
        </div>
        <div className="meta">
          <span>Gen {generation}</span>
          <span>•</span>
          <span>{Math.floor(totalMonthsPlayed / 12)}y {Math.floor(totalMonthsPlayed % 12)}m</span>
          <span>•</span>
          <button className="speed-btn" onClick={handleSpeedToggle}>
            {gameSpeed === 0 ? '⏸' : gameSpeed === 5 ? '⏩⏩' : '⏩'} {gameSpeed === 0 ? 'PAUSED' : gameSpeed + '×'}
          </button>
          <button className="hire-btn" onClick={handleHire}>
            + Hire
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Left Panel — School Hierarchy */}
        <aside className="panel hierarchy">
          <h2>School ({students.length}/{config.maxCapacity})</h2>
          <div className="student-list">
            {students.map((student) => (
              <div key={student.id} className={`student-card rank-${student.rank}`}>
                <div className="student-header">
                  <span className="rank-icon">
                    {student.rank === 'student' ? '🎓' : student.rank === 'assistant' ? '👤' : '👑'}
                  </span>
                  <span className="student-name">{student.name}</span>
                  <span className="satisfaction-bar">
                    {student.satisfaction >= 60 ? '😊' : student.satisfaction >= 30 ? '😐' : '😟'}
                  </span>
                </div>
                <div className="student-stats">
                  <div className="stat">Rigor: {student.stats.rigor}</div>
                  <div className="stat">Creative: {student.stats.creativity}</div>
                  <div className="stat">Teach: {student.stats.teaching}</div>
                </div>
                <div className="student-meta">
                  <span>{student.theoremsProved} theorems</span>
                  <span>•</span>
                  <span>{student.fundingLevel}% fund</span>
                  <span>•</span>
                  <span>{student.assignedFields.join(', ') || 'No field'}</span>
                </div>
                {student.traits.length > 0 && (
                  <div className="student-traits">
                    {student.traits.map((t) => (
                      <span key={t} className="trait-badge">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Center Panel — Theorem Pipeline */}
        <section className="panel theorem-pipeline">
          <h2>Theorem Pipeline</h2>
          <div className="active-theorems">
            <h3>Active ({activeTheorems.length})</h3>
            {activeTheorems.length === 0 ? (
              <p className="empty-state">No active theorems. Assign fields to students.</p>
            ) : (
              activeTheorems.map((at) => (
                <div key={at.id} className="theorem-card">
                  <div className="theorem-header">
                    <span className="theorem-name">{at.theorem.name}</span>
                    <span className="theorem-tier">Tier {at.theorem.tier}</span>
                  </div>
                  <div className="theorem-bar">
                    <div
                      className="theorem-progress"
                      style={{ width: `${at.progress}%` }}
                    />
                  </div>
                  <div className="theorem-meta">
                    {at.progress.toFixed(0)}% • {at.assignedStudents.length} student(s)
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="completed-theorems">
            <h3>Completed ({currentTheorems.length})</h3>
            {currentTheorems.length === 0 ? (
              <p className="empty-state">No theorems yet.</p>
            ) : (
              <ul className="theorem-list">
                {currentTheorems.slice(-5).reverse().map((ct) => (
                  <li key={ct.id} className="completed-theorem">
                    {ct.theorem.name} <span className="tier-tag">T{ct.theorem.tier}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Right Panel — Actions & Log */}
        <aside className="panel actions-log">
          <h2>Actions</h2>
          <div className="actions-grid">
            <button className="action-btn" onClick={handleHire}>
              🎓 Hire Student
            </button>
            <button className="action-btn" onClick={togglePause}>
              {gameSpeed === 0 ? '▶ Play' : '⏸ Pause'}
            </button>
          </div>

          <h2>Event Log</h2>
          <div className="event-log">
            {eventLog.slice(-20).reverse().map((event) => (
              <div key={event.id} className={`event-entry type-${event.type}`}>
                <span className="event-message">{event.message}</span>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {/* Bottom Bar — Ideology */}
      <footer className="bottom-bar">
        <span>Philosophy: {config.ideology}</span>
        <span>•</span>
        <span>
          {config.ideology === 'formalism'
            ? 'Speed +20%, extra fields, lower quality'
            : config.ideology === 'intuitionism'
            ? 'Quality +15%, bonus stats, no excluded middle'
            : 'Reputation +25%, better students, slower'}
        </span>
      </footer>
    </div>
  );
}

export default App;
