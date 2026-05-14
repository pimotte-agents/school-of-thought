// =============================================================================
// TopBar — Resources, generation, time, speed controls
// =============================================================================

import type { StudentRank } from '../types/game';
import { useSchoolStore } from '../store/schoolStore';

interface TopBarProps {
  onTogglePause: () => void;
  onCycleSpeed: () => void;
}

const RANK_ICONS: Record<StudentRank, string> = {
  student: '🎓',
  assistant: '👤',
  associate: '👑',
};

export function TopBar({ onTogglePause, onCycleSpeed }: TopBarProps) {
  const {
    resources,
    config,
    students,
    gameSpeed,
    generation,
    totalMonthsPlayed,
    activeTheorems,
  } = useSchoolStore();

  const years = Math.floor(totalMonthsPlayed / 12);
  const months = Math.floor(totalMonthsPlayed % 12);

  const ranks = students.reduce(
    (acc, s) => {
      acc[s.rank]++;
      return acc;
    },
    { student: 0, assistant: 0, associate: 0 } as Record<StudentRank, number>
  );

  const resourceBars = [
    {
      label: 'Theorems',
      value: resources.theorems,
      icon: '📜',
      color: '#a8d8ea',
      bg: 'rgba(168, 216, 234, 0.15)',
    },
    {
      label: 'Money',
      value: resources.money,
      icon: '💰',
      color: '#ffd93d',
      bg: 'rgba(255, 217, 61, 0.15)',
    },
    {
      label: 'Reputation',
      value: resources.reputation,
      icon: '⭐',
      color: '#ff6b6b',
      bg: 'rgba(255, 107, 107, 0.15)',
    },
    {
      label: 'Prestige',
      value: resources.prestige,
      icon: '🏆',
      color: '#c084fc',
      bg: 'rgba(192, 132, 252, 0.15)',
    },
  ];

  const ideos = ['formalism', 'intuitionism', 'platonism'] as const;
  const ideologyIcons: Record<string, string> = {
    formalism: '🔷',
    intuitionism: '🔶',
    platonism: '🔵',
  };

  return (
    <header className="top-bar">
      {/* Resources */}
      <div className="resources">
        {resourceBars.map((r) => (
          <div key={r.label} className="resource-block" style={{ borderColor: r.color }}>
            <span className="resource-icon">{r.icon}</span>
            <span className="resource-value" style={{ color: r.color }}>
              {r.value >= 1000
                ? (r.value / 1000).toFixed(1) + 'k'
                : r.value >= 100
                ? r.value.toFixed(1)
                : r.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="meta">
        {/* Generation */}
        <span className="meta-item">
          <span className="meta-label">Gen</span>
          <span className="meta-value">{generation}</span>
        </span>

        {/* Time */}
        <span className="meta-item">
          <span className="meta-label">Time</span>
          <span className="meta-value">{years}y {months}m</span>
        </span>

        {/* Ideology */}
        <span className="meta-item ideology">
          <span className="ideology-icon">{ideologyIcons[config.ideology]}</span>
          <span className="meta-label">
            {config.ideology.charAt(0).toUpperCase() + config.ideology.slice(1)}
          </span>
        </span>

        {/* Student Count */}
        <span className="meta-item">
          <span className="meta-value">{students.length}/{config.maxCapacity}</span>
          <span className="rank-badges">
            <span className="badge" title="Associate Professors">{ranks.associate}👑</span>
            <span className="badge" title="Assistant Professors">{ranks.assistant}👤</span>
            <span className="badge" title="PhD Students">{ranks.student}🎓</span>
          </span>
        </span>

        {/* Active Theorems */}
        <span className="meta-item">
          <span className="meta-label">Theorems</span>
          <span className="meta-value">{activeTheorems.length}</span>
        </span>

        {/* Speed Control */}
        <div className="speed-control">
          <button
            className="speed-btn"
            onClick={onCycleSpeed}
            title="Cycle speed"
          >
            {gameSpeed === 0 ? '⏸' : gameSpeed === 1 ? '▶' : '⏩'}
          </button>
          <button
            className="pause-btn"
            onClick={onTogglePause}
            title={gameSpeed === 0 ? 'Play' : 'Pause'}
          >
            {gameSpeed === 0 ? '▶' : '⏸'}
          </button>
          <span className="speed-label">{gameSpeed === 0 ? 'PAUSED' : gameSpeed + '×'}</span>
        </div>
      </div>
    </header>
  );
}
