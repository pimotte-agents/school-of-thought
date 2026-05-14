// =============================================================================
// ActionsPanel — Hire, retire, ideology, save/export/import
// =============================================================================

import { useState, useRef, type ChangeEvent } from 'react';
import { IDEOLOGY_DATA } from '../types/game';
import type { SchoolIdeology } from '../types/game';
import { useSchoolStore } from '../store/schoolStore';

const IDEOLOGY_ICONS: Record<SchoolIdeology, string> = {
  formalism: '🔷',
  intuitionism: '🔶',
  platonism: '🔵',
};

const IDEOLOGY_COSTS: Record<SchoolIdeology, number> = {
  formalism: 50,
  intuitionism: 100,
  platonism: 100,
};

export function ActionsPanel() {
  const {
    hireStudent,
    retire,
    setIdeology,
    setGameSpeed,
    clearEventLog,
    exportSave,
    importSave,
    config,
    resources,
    gameSpeed,
    students,
    eventLog,
  } = useSchoolStore();

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHire = () => hireStudent();
  const handleRetire = () => {
    if (confirm('Retire this generation? This will advance to the next generation.')) {
      retire();
    }
  };
  const handleToggleSpeed = () => {
    const speeds = [0, 1, 5] as const;
    const nextIdx = (speeds.indexOf(gameSpeed) + 1) % speeds.length;
    setGameSpeed(speeds[nextIdx]);
  };

  const handleIdeologyChange = (ideology: SchoolIdeology) => {
    if (ideology === config.ideology) return;
    const categories: Record<SchoolIdeology, number> = {
      formalism: 1,
      intuitionism: 2,
      platonism: 3,
    };
    const cost =
      categories[config.ideology] === categories[ideology] ? 50 : 100;
    if (resources.reputation < cost) {
      alert(`Need ${cost} reputation to switch (have ${resources.reputation})`);
      return;
    }
    if (confirm(`Switch to ${IDEOLOGY_DATA[ideology].name}? Costs ${cost} reputation.`)) {
      setIdeology(ideology);
    }
  };

  const handleExport = () => {
    const save = exportSave();
    navigator.clipboard.writeText(save).then(() => {
      alert('Save copied to clipboard!');
    }).catch(() => {
      // Fallback
      const blob = new Blob([save], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-of-thought-save.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        importSave(text);
        alert('Save imported successfully!');
      } catch {
        alert('Failed to import save: invalid JSON');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportText = () => {
    if (!importText.trim()) return;
    try {
      importSave(importText);
      setShowImport(false);
      setImportText('');
      alert('Save imported successfully!');
    } catch {
      alert('Failed to import save: invalid JSON');
    }
  };

  const handleSpeedOption = (speed: number) => {
    setGameSpeed(speed);
  };

  return (
    <div className="actions-panel">
      {/* Quick Actions */}
      <div className="panel-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-btn hire" onClick={handleHire}>
            🎓 Hire Student
            <span className="action-cost">💰 {20 + students.length * 5}</span>
          </button>

          <button className="action-btn speed" onClick={handleToggleSpeed}>
            {gameSpeed === 0 ? '▶ Play' : gameSpeed === 1 ? '⏩ 1×' : '⏩⏩ 5×'}
          </button>

          <button className="action-btn retire" onClick={handleRetire}>
            👑 Retire Generation
          </button>
        </div>
      </div>

      {/* Speed Options */}
      <div className="panel-section">
        <h2>Speed</h2>
        <div className="speed-options">
          {[0, 1, 5].map((speed) => (
            <button
              key={speed}
              className={`speed-option ${gameSpeed === speed ? 'active' : ''}`}
              onClick={() => handleSpeedOption(speed)}
            >
              {speed === 0 ? '⏸' : speed === 1 ? '▶' : '⏩⏩'}
            </button>
          ))}
        </div>
      </div>

      {/* Ideology */}
      <div className="panel-section ideology-section">
        <h2>Philosophy</h2>
        <div className="ideology-options">
          {(Object.keys(IDEOLOGY_DATA) as SchoolIdeology[]).map((ideo) => {
            const data = IDEOLOGY_DATA[ideo];
            const bonuses = data.bonuses;
            const isActive = config.ideology === ideo;
            const categories: Record<SchoolIdeology, number> = {
              formalism: 1,
              intuitionism: 2,
              platonism: 3,
            };
            const currentCategory = categories[config.ideology];
            const targetCategory = categories[ideo];
            const cost = currentCategory === targetCategory ? 50 : 100;
            const canAfford = resources.reputation >= cost;

            return (
              <div
                key={ideo}
                className={`ideology-option ${isActive ? 'active' : ''} ${!canAfford && !isActive ? 'locked' : ''}`}
                onClick={() => handleIdeologyChange(ideo)}
              >
                <div className="ideology-option-header">
                  <span className="ideology-icon">{IDEOLOGY_ICONS[ideo]}</span>
                  <span className="ideology-name">{data.name}</span>
                  {isActive && <span className="active-badge">✓</span>}
                </div>
                <p className="ideology-tagline">{data.tagline}</p>
                <div className="ideology-stats">
                  <span>Speed: {bonuses.theoremSpeed * 100}%</span>
                  <span>Quality: {bonuses.theoremQuality * 100}%</span>
                  {bonuses.reputationGain && (
                    <span>Rep: {bonuses.reputationGain * 100}%</span>
                  )}
                </div>
                {!isActive && (
                  <span className="ideology-cost">
                    Cost: {cost} ⭐ {canAfford ? '' : '(insufficient)'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save / Load */}
      <div className="panel-section save-section">
        <h2>Save & Load</h2>
        <div className="save-actions">
          <button className="action-btn save" onClick={handleExport}>
            💾 Export Save
          </button>
          <button className="action-btn load" onClick={() => setShowImport(!showImport)}>
            📂 Import Save
          </button>
          <button className="action-btn clear" onClick={clearEventLog}>
            🗑 Clear Log
          </button>
        </div>

        {showImport && (
          <div className="import-form">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="file-input"
            />
            <textarea
              placeholder="Or paste save data here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={3}
              className="import-textarea"
            />
            <button className="action-btn import-confirm" onClick={handleImportText}>
              Import
            </button>
          </div>
        )}
      </div>

      {/* Event Log */}
      <div className="panel-section log-section">
        <h2>
          Event Log <span className="log-count">({eventLog.length})</span>
        </h2>
        <div className="event-log">
          {eventLog.slice(-50).reverse().map((event) => (
            <div key={event.id} className={`event-entry type-${event.type}`}>
              <span className="event-time">
                {Math.floor(event.timestamp / 12)}y
              </span>
              <span className="event-message">{event.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
