// =============================================================================
// BottomBar — Ideology selector + quick info
// =============================================================================

import { useState } from 'react';
import { IDEOLOGY_DATA } from '../types/game';
import type { SchoolIdeology } from '../types/game';
import { useSchoolStore } from '../store/schoolStore';

const IDEOLOGY_ICONS: Record<SchoolIdeology, string> = {
  formalism: '🔷',
  intuitionism: '🔶',
  platonism: '🔵',
};

export function BottomBar() {
  const { config, resources, setIdeology, students } = useSchoolStore();
  const [showDetails, setShowDetails] = useState(false);

  const handleIdeologyClick = (ideo: SchoolIdeology) => {
    if (ideo === config.ideology) {
      setShowDetails(!showDetails);
      return;
    }
    const categories: Record<SchoolIdeology, number> = {
      formalism: 1,
      intuitionism: 2,
      platonism: 3,
    };
    const cost =
      categories[config.ideology] === categories[ideo] ? 50 : 100;
    if (resources.reputation < cost) {
      alert(`Need ${cost} reputation to switch (have ${resources.reputation})`);
      return;
    }
    if (confirm(`Switch to ${IDEOLOGY_DATA[ideo].name}? Costs ${cost} reputation.`)) {
      setIdeology(ideo);
    }
  };

  return (
    <footer className="bottom-bar">
      <div className="bottom-bar-left">
        {Object.values(IDEOLOGY_DATA).map((ideo) => (
          <button
            key={ideo.id}
            className={`ideology-tab ${config.ideology === ideo.id ? 'active' : ''}`}
            onClick={() => handleIdeologyClick(ideo.id)}
          >
            <span className="ideology-tab-icon">{IDEOLOGY_ICONS[ideo.id]}</span>
            <span>{ideo.name}</span>
          </button>
        ))}
      </div>

      {showDetails && (
        <div className="ideology-details">
          <div className="ideology-detail-card">
            <h3>{IDEOLOGY_DATA[config.ideology].name}</h3>
            <p className="ideology-tagline">{IDEOLOGY_DATA[config.ideology].tagline}</p>
            <p className="ideology-desc">{IDEOLOGY_DATA[config.ideology].description}</p>
            <div className="ideology-bonuses">
              <span>Speed: {IDEOLOGY_DATA[config.ideology].bonuses.theoremSpeed * 100}%</span>
              <span>Quality: {IDEOLOGY_DATA[config.ideology].bonuses.theoremQuality * 100}%</span>
              {IDEOLOGY_DATA[config.ideology].bonuses.reputationGain && (
                <span>Reputation: {IDEOLOGY_DATA[config.ideology].bonuses.reputationGain * 100}%</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bottom-bar-right">
        <span className="student-count">{students.length} students</span>
        <span className="divider">|</span>
        <span className="active-theorems">{students.filter(s => s.assignedFields.length > 0).length} active researchers</span>
      </div>
    </footer>
  );
}
