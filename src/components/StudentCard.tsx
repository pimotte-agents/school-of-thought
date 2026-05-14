// =============================================================================
// StudentCard — Interactive student display with drag-and-drop mentor hierarchy
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

const RANK_ORDER: Record<string, number> = {
  student: 0,
  assistant: 1,
  associate: 2,
  professor: 3,
};

export function StudentCard({ student, isSelected, onClick }: StudentCardProps) {
  const { promoteStudent, assignFields, assignMentor } = useSchoolStore();

  const rankColor =
    student.rank === 'professor' ? '#f59e0b' :
    student.rank === 'associate' ? '#c084fc' :
    student.rank === 'assistant' ? '#537895' : '#2a2a4a';

  const satColor =
    student.satisfaction >= 60 ? '#4ecca3' :
    student.satisfaction >= 30 ? '#ffd93d' : '#e94560';

  const canPromoteToAssistant = student.rank === 'student' && isPromotionEligible(student, 'assistant');
  const canPromoteToAssociate = student.rank === 'assistant' && isPromotionEligible(student, 'associate');
  const canPromoteToProfessor = student.rank === 'associate' && isPromotionEligible(student, 'professor');
  const allRatios = checkRankRatios(useSchoolStore.getState().students);

  const isStaff = student.rank !== 'student';

  const handlePromote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetRank =
      student.rank === 'student' ? 'assistant' :
      student.rank === 'assistant' ? 'associate' : 'professor';
    promoteStudent(student.id);
  };

  const handleFieldToggle = (field: ResearchField) => {
    const current = student.assignedFields;
    const next = current.includes(field)
      ? current.filter((f) => f !== field)
      : [...current, field];
    assignFields(student.id, next);
  };

  const handleMentorRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    assignMentor(student.id, null);
  };

  const totalStats = student.stats.rigor + student.stats.creativity + student.stats.teaching;

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    // Only non-student staff can be dragged as mentors
    if (!isStaff) return;
    e.dataTransfer.setData('studentId', student.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drop handler — only higher-rank staff can receive mentors
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('studentId');
    if (!draggedId || draggedId === student.id) return;

    const targetRankOrder = RANK_ORDER[student.rank];

    // Check that dragged student is higher rank (mentor > mentee)
    const dragState = useSchoolStore.getState();
    const draggedStudent = dragState.students.find((s) => s.id === draggedId);
    if (!draggedStudent) return;

    const draggedRankOrder = RANK_ORDER[draggedStudent.rank];
    if (draggedRankOrder <= targetRankOrder) return; // mentor must be higher rank

    // Set this student as the dragged student's mentor
    assignMentor(draggedId, student.id);
  };

  // Get mentor info
  const mentor = student.mentorId
    ? useSchoolStore.getState().students.find((s) => s.id === student.mentorId)
    : null;

  // Get mentees
  const mentees = student.menteeIds
    .map((id) => useSchoolStore.getState().students.find((s) => s.id === id))
    .filter(Boolean) as Student[];

  // Build hierarchy tree
  const HierarchyTree = ({ studentId, depth = 0 }: { studentId: string; depth?: number }) => {
    const menteeList = useSchoolStore.getState().students
      .filter((s) => s.mentorId === studentId)
      .sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);

    if (menteeList.length === 0) return null;

    return (
      <div className="hierarchy-tree" style={{ marginLeft: `${depth * 16 + 8}px` }}>
        {menteeList.map((m) => (
          <div key={m.id} className="hierarchy-branch">
            <div className="hierarchy-connector" />
            <span className="hierarchy-name" style={{ color: getRankColor(m.rank) }}>
              {RANK_EMOJI[m.rank]} {m.name}
            </span>
            <HierarchyTree studentId={m.id} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  };

  function getRankColor(rank: string): string {
    if (rank === 'professor') return '#f59e0b';
    if (rank === 'associate') return '#c084fc';
    if (rank === 'assistant') return '#537895';
    return '#2a2a4a';
  }

  return (
    <div
      className={`student-card rank-${student.rank}${isSelected ? ' selected' : ''}${isStaff ? ' staff' : ''}`}
      onClick={onClick}
      style={{ borderColor: isSelected ? rankColor : undefined }}
      draggable={isStaff}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
        {isStaff && (
          <span className="drag-hint" title="Drag to assign as mentor">⠿</span>
        )}
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

      {/* Mentor info bar (for staff) */}
      {isStaff && mentor && (
        <div className="mentor-bar">
          <span>Mentor: {mentor.name}</span>
          <button className="unmentor-btn" onClick={handleMentorRemove} title="Remove mentor">✕</button>
        </div>
      )}

      {/* Mentees tree (expanded for staff) */}
      {isStaff && mentees.length > 0 && (
        <div className="mentees-tree">
          {mentees.map((m) => (
            <div key={m.id} className="mentee-entry">
              <span className="mentee-name" style={{ color: getRankColor(m.rank) }}>
                {RANK_EMOJI[m.rank]} {m.name}
              </span>
              {m.menteeIds.length > 0 && (
                <div className="mentee-subtree">
                  {m.menteeIds.map((mid) => {
                    const sub = useSchoolStore.getState().students.find((s) => s.id === mid);
                    if (!sub) return null;
                    return (
                      <span key={mid} className="mentee-sub" style={{ color: getRankColor(sub.rank) }}>
                        └ {RANK_EMOJI[sub.rank]} {sub.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected Panel */}
      {isSelected && (
        <div className="student-details">
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

          {/* Hierarchy section for staff */}
          {isStaff && (
            <div className="detail-row hierarchy-row">
              <label>🌳 Hierarchy</label>
              {mentor && (
                <div className="hierarchy-info">
                  <span className="hierarchy-label">Mentor:</span>
                  <span className="hierarchy-mentor" style={{ color: getRankColor(mentor.rank) }}>
                    {RANK_EMOJI[mentor.rank]} {mentor.name}
                  </span>
                  <button className="remove-mentor-btn" onClick={handleMentorRemove}>✕</button>
                </div>
              )}
              {mentees.length > 0 && (
                <div className="hierarchy-mentees">
                  <span className="hierarchy-label">Mentees:</span>
                  {mentees.map((m) => (
                    <span key={m.id} className="hierarchy-mentee" style={{ color: getRankColor(m.rank) }}>
                      {RANK_EMOJI[m.rank]} {m.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="hierarchy-hint">
                Drag staff onto this card to set mentor
              </p>
              <HierarchyTree studentId={student.id} />
            </div>
          )}

          {/* Promotion Button */}
          {(canPromoteToAssistant || canPromoteToAssociate || canPromoteToProfessor) && (
            <button className="promote-btn" onClick={handlePromote}>
              🎓 Promote to {canPromoteToProfessor ? 'Full' : canPromoteToAssociate ? 'Associate' : 'Assistant'} Professor
            </button>
          )}
          {!canPromoteToAssistant && !canPromoteToAssociate && !canPromoteToProfessor && (
            <div className="promote-locked">
              {!canPromoteToAssistant && "Need ≥1 month as student + 1 theorem"}
              {!canPromoteToAssistant && canPromoteToAssociate && ' | '}
              {!canPromoteToAssociate && "Need ≥2 months as assistant + 3 theorems"}
              {!canPromoteToAssociate && canPromoteToProfessor && ' | '}
              {!canPromoteToProfessor && "Need ≥6 months as associate + 8 theorems"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
