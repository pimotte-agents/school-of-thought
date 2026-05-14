// =============================================================================
// TheoremPanel — Active theorems with progress bars + completed theorems list
// =============================================================================

import { ALL_THEOREMS, getNextTheorem } from '../data/theorems';
import type { ResearchField, TheoremTier } from '../types/game';
import { useSchoolStore } from '../store/schoolStore';

const TIER_COLORS: Record<TheoremTier, string> = {
  1: '#4ecca3',
  2: '#537895',
  3: '#ffd93d',
  4: '#ff6b6b',
  5: '#c084fc',
};

const TIER_NAMES: Record<TheoremTier, string> = {
  1: 'Basic',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Millennium',
};

export function TheoremPanel() {
  const { activeTheorems, currentTheorems, config } = useSchoolStore();

  return (
    <div className="theorem-pipeline">
      {/* Active Theorems */}
      <div className="panel-section">
        <h2>
          Active ({activeTheorems.length})
        </h2>
        {activeTheorems.length === 0 ? (
          <p className="empty-state">
            No active theorems. Assign research fields to students to begin.
          </p>
        ) : (
          <div className="theorem-list">
            {activeTheorems.map((at) => (
              <div key={at.id} className="theorem-card active">
                <div className="theorem-header">
                  <div>
                    <span className="theorem-name">{at.theorem.name}</span>
                    <span
                      className={`tier-badge tier-${at.theorem.tier}`}
                      style={{ background: TIER_COLORS[at.theorem.tier] }}
                    >
                      {TIER_NAMES[at.theorem.tier]}
                    </span>
                  </div>
                  <span className="theorem-progress-pct">
                    {at.progress.toFixed(1)}%
                  </span>
                </div>
                <div className="theorem-bar">
                  <div
                    className="theorem-progress-fill"
                    style={{
                      width: `${Math.min(100, at.progress)}%`,
                      background: TIER_COLORS[at.theorem.tier],
                    }}
                  />
                </div>
                <div className="theorem-meta-row">
                  <span>{at.theorem.baseTime}s base</span>
                  <span>•</span>
                  <span>{at.assignedStudents.length} student(s)</span>
                  <span>•</span>
                  <span>{at.theorem.theoremValue}📜 {at.theorem.moneyValue}💰 {at.theorem.reputationValue}⭐</span>
                </div>
                <div className="theorem-fields">
                  {at.theorem.fields.map((f) => (
                    <span key={f} className="field-tag">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Theorems */}
      <div className="panel-section">
        <h2>
          Completed ({currentTheorems.length})
        </h2>
        {currentTheorems.length === 0 ? (
          <p className="empty-state">No theorems yet.</p>
        ) : (
          <div className="completed-grid">
            {currentTheorems.slice(-20).reverse().map((ct) => (
              <div key={ct.id} className="completed-theorem">
                <span className="completed-name">{ct.theorem.name}</span>
                <div className="completed-meta">
                  <span
                    className={`tier-badge tier-${ct.theorem.tier}`}
                    style={{ background: TIER_COLORS[ct.theorem.tier] }}
                  >
                    {TIER_NAMES[ct.theorem.tier]}
                  </span>
                  <span>{ct.theorem.theoremValue}📜</span>
                  <span>{ct.theorem.moneyValue}💰</span>
                </div>
              </div>
            ))}
            {currentTheorems.length > 20 && (
              <p className="show-more">
                ...and {currentTheorems.length - 20} more
              </p>
            )}
          </div>
        )}
      </div>

      {/* Next Theorem Preview */}
      <div className="panel-section next-theorem">
        <h2>Next Available</h2>
        <NextTheoremPreview />
      </div>
    </div>
  );
}

function NextTheoremPreview() {
  const { students, config, currentTheorems } = useSchoolStore();
  const provedIds = new Set(currentTheorems.map((t) => t.theorem.id));

  // Find the best available theorem for any student with fields assigned
  let nextTheorem: typeof ALL_THEOREMS[number] | null = null;
  let bestStudentName = '';

  for (const student of students) {
    if (student.assignedFields.length === 0) continue;
    const available = getNextTheorem(
      provedIds,
      config.ideology,
      new Set(student.assignedFields)
    );
    if (available && (!nextTheorem || available.baseTime < nextTheorem.baseTime)) {
      nextTheorem = available;
      bestStudentName = student.name;
    }
  }

  if (!nextTheorem) {
    return (
      <p className="empty-state">
        Assign fields to a student to unlock the next theorem.
      </p>
    );
  }

  return (
    <div className="next-theorem-card">
      <div className="next-theorem-header">
        <span className="theorem-name">{nextTheorem.name}</span>
        <span
          className={`tier-badge tier-${nextTheorem.tier}`}
          style={{ background: TIER_COLORS[nextTheorem.tier] }}
        >
          {TIER_NAMES[nextTheorem.tier]}
        </span>
      </div>
      <p className="next-theorem-desc">{nextTheorem.description}</p>
      <div className="theorem-meta-row">
        <span>{nextTheorem.baseTime}s</span>
        <span>•</span>
        <span>by {bestStudentName}</span>
      </div>
      <div className="theorem-fields">
        {nextTheorem.fields.map((f) => (
          <span key={f} className="field-tag">{f}</span>
        ))}
      </div>
    </div>
  );
}
