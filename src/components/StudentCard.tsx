// =============================================================================
// StudentCard — Interactive student display with controls
// =============================================================================

import type { Student, ResearchField } from '../types/game';
import { ALL_FIELDS, RANK_LABELS, RANK_EMOJI, TRAITS } from '../types/game';
import { useSchoolStore } from '../store/schoolStore';
import { isPromotionEligible, checkRankRatios } from '../utils/gameUtils';

interface StudentCardProps {
  student: Student;
  isSelected: boolean;
  onClick: () => void;
}

export function StudentCard({ student, isSelected, onClick }: StudentCardProps) {
  const { promoteStudent, assignFunding, assignFields, assignMentor } = useSchoolStore();

  const rankColor =
    student.rank === 'associate' ? '#c084fc' :
    student.rank === 'assistant' ? '#537895' : '#2a2a4a';

  const satColor =
    student.satisfaction >= 60 ? '#4ecca3' :
    student.satisfaction >= 30 ? '#ffd93d' : '#e94560';

  const canPromoteToAssistant = student.rank === 'student' && isPromotionEligible(student, 'assistant');
  const canPromoteToAssociate = student.rank === 'assistant' && isPromotionEligible(student, 'associate');
  const allRatios = checkRankRatios(useSchoolStore.getState().students);

  const handlePromote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetRank = student.rank === 'student' ? 'assistant' : 'associate';
    promoteStudent(student.id);
  };

  const handleFundingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) assignFunding(student.id, val);
  };

  const handleFieldToggle = (field: ResearchField) => {
    const current = student.assignedFields;
    const next = current.includes(field)
      ? current.filter((f) => f !== field)
      : [...current, field];
    assignFields(student.id, next);
  };

  const handleMentorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const mentorId = e.target.value || null;
    assignMentor(student.id, mentorId);
  };

  const availableMentors = useSchoolStore.getState().students.filter(
    (s) => s.id !== student.id
  );

  const totalStats = student.stats.rigor + student.stats.creativity + student.stats.teaching;

  return (
    <div
      className={`student-card rank-${student.rank}${isSelected ? ' selected' : ''}`}
      onClick={onClick}
      style={{ borderColor: isSelected ? rankColor : undefined }}
    >
      {/* Header */}
      <div className="student-header">
        <span className="rank-icon" style={{ color: rankColor }}>
          {RANK_EMOJI[student.rank]}
        </span>
        <span className="student-name">{student.name}</span>
        <span
          className="satisfaction-icon"
          title={`Satisfaction: ${student.satisfaction}%`}
        >
          {student.satisfaction >= 60 ? '😊' : student.satisfaction >= 30 ? '😐' : '😟'}
        </span>
      </div>

      {/* Rank & Stats */}
      <div className="student-stats-row">
        <span className="rank-label" style={{ color: rankColor }}>
          {RANK_LABELS[student.rank]}
        </span>
        <span className="total-stats">Σ {totalStats}</span>
      </div>

      {/* Stat Bars */}
      <div className="stat-bars">
        <div className="stat-bar">
          <span className="stat-label">Rigor</span>
          <div className="bar-track">
            <div className="bar-fill bar-rigor" style={{ width: `${student.stats.rigor * 20}%` }} />
          </div>
          <span className="stat-value">{student.stats.rigor}</span>
        </div>
        <div className="stat-bar">
          <span className="stat-label">Creat</span>
          <div className="bar-track">
            <div className="bar-fill bar-creative" style={{ width: `${student.stats.creativity * 20}%` }} />
          </div>
          <span className="stat-value">{student.stats.creativity}</span>
        </div>
        <div className="stat-bar">
          <span className="stat-label">Teach</span>
          <div className="bar-track">
            <div className="bar-fill bar-teach" style={{ width: `${student.stats.teaching * 20}%` }} />
          </div>
          <span className="stat-value">{student.stats.teaching}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="student-meta">
        <span>{student.theoremsProved} theorems</span>
        <span>•</span>
        <span>Funding: {student.fundingLevel}%</span>
        {student.mentorId && (
          <>
            <span>•</span>
            <span>Mentor: ✓</span>
          </>
        )}
        {student.menteeIds.length > 0 && (
          <>
            <span>•</span>
            <span>{student.menteeIds.length} mentee(s)</span>
          </>
        )}
      </div>

      {/* Traits */}
      {student.traits.length > 0 && (
        <div className="student-traits">
          {student.traits.map((tId) => {
            const t = TRAITS[tId as keyof typeof TRAITS];
            return (
              <span key={t.id} className="trait-badge" title={t.description}>
                {t.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Selected Panel */}
      {isSelected && (
        <div className="student-details">
          {/* Funding Slider */}
          <div className="detail-row">
            <label>Funding</label>
            <div className="slider-row">
              <input
                type="range"
                min={0}
                max={100}
                value={student.fundingLevel}
                onChange={handleFundingChange}
              />
              <span>{student.fundingLevel}%</span>
            </div>
          </div>

          {/* Field Assignment */}
          <div className="detail-row">
            <label>Fields</label>
            <div className="field-toggles">
              {ALL_FIELDS.map((field) => (
                <button
                  key={field}
                  className={`field-toggle ${student.assignedFields.includes(field) ? 'active' : ''}`}
                  onClick={(e) => handleFieldToggle(field)}
                >
                  {field}
                </button>
              ))}
            </div>
          </div>

          {/* Mentor Assignment */}
          <div className="detail-row">
            <label>Mentor</label>
            <select value={student.mentorId || ''} onChange={handleMentorChange}>
              <option value="">None</option>
              {availableMentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({RANK_LABELS[m.rank]})
                </option>
              ))}
            </select>
          </div>

          {/* Promotion Button */}
          {(canPromoteToAssistant || canPromoteToAssociate) && (
            <button className="promote-btn" onClick={handlePromote}>
              🎓 Promote to {canPromoteToAssociate ? 'Associate' : 'Assistant'} Professor
            </button>
          )}
          {!canPromoteToAssistant && !canPromoteToAssociate && (
            <div className="promote-locked">
              {!canPromoteToAssistant && "Need ≥1 month as student + 1 theorem"}
              {!canPromoteToAssistant && canPromoteToAssociate && ' | '}
              {!canPromoteToAssociate && "Need ≥2 months as assistant + 3 theorems"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
