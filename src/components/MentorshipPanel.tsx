// =============================================================================
// MentorshipPanel — Drag staff onto each other to organise mentorship
// =============================================================================

import { useRef, type DragEvent, type MouseEvent } from 'react';
import { useSchoolStore } from '../store/schoolStore';
import { RANK_LABELS, RANK_EMOJI } from '../types/game';
import { getRankColor } from '../utils/gameUtils';
import type { Student } from '../types/game';

export function MentorshipPanel() {
  const { students, assignMentor } = useSchoolStore();
  const clearRef = useRef<HTMLDivElement>(null);

  const staff = students.filter((s): s is Student => s.rank !== 'student');

  const rankOrder = (rank: StudentRank) =>
    rank === 'student' ? 0 : rank === 'assistant' ? 1 : rank === 'associate' ? 2 : 3;

  const handleDragStart = (e: DragEvent, id: string) => {
    e.dataTransfer.setData('menteeId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnMentor = (e: DragEvent, mentorId: string) => {
    e.preventDefault();
    const menteeId = e.dataTransfer.getData('menteeId');
    if (!menteeId || menteeId === mentorId) return;

    const state = useSchoolStore.getState();
    const mentee = state.students.find((s) => s.id === menteeId);
    if (!mentee) return;

    const mentor = state.students.find((s) => s.id === mentorId);
    if (!mentor || mentor.rank === 'student') return;

    if (rankOrder(mentor.rank) <= rankOrder(mentee.rank)) return;

    assignMentor(menteeId, mentorId);
  };

  const handleDropOnClear = (e: DragEvent) => {
    e.preventDefault();
    const menteeId = e.dataTransfer.getData('menteeId');
    if (!menteeId) return;

    const state = useSchoolStore.getState();
    const mentee = state.students.find((s) => s.id === menteeId);
    if (!mentee || mentee.rank === 'student') return;

    if (mentee.mentorId) {
      assignMentor(menteeId, null);
    }
  };

  if (staff.length === 0) {
    return (
      <div className="panel-section">
        <h2>Mentorship Board</h2>
        <p className="empty-state">No staff yet. Promote students to begin.</p>
      </div>
    );
  }

  return (
    <div className="panel-section mentorship-panel">
      <h2>Mentorship Board</h2>

      <div className="mentorship-grid">
        {staff.map((s) => {
          const mentor = s.mentorId
            ? students.find((st) => st.id === s.mentorId)
            : null;
          const mentees = students.filter((st) => st.mentorId === s.id);

          return (
            <div
              key={s.id}
              className="mentorship-card"
              draggable
              onDragStart={(e) => handleDragStart(e, s.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnMentor(e, s.id)}
              style={{
                borderColor: mentor ? getRankColor(s.rank) : undefined,
              }}
            >
              <div className="mentorship-card-header">
                <span style={{ color: getRankColor(s.rank) }}>
                  {RANK_EMOJI[s.rank]} {s.name}
                </span>
                <span className="mentorship-rank">{RANK_LABELS[s.rank]}</span>
              </div>

              {mentor && (
                <div className="mentorship-mentor">
                  ↑ Mentor: {mentor.name}
                </div>
              )}

              {mentees.length > 0 && (
                <div className="mentorship-mentees">
                  ↓ {mentees.length} mentee(s):
                  {mentees.map((m) => (
                    <span key={m.id} className="mentee-tag">
                      {m.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear Zone */}
      <div
        ref={clearRef}
        className="mentorship-clear-zone"
        onDragOver={handleDragOver}
        onDrop={handleDropOnClear}
      >
        <div className="clear-zone-content">
          <span>🗑</span> Drop staff here to remove mentor
        </div>
      </div>
    </div>
  );
}
