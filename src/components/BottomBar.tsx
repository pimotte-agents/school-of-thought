// =============================================================================
// BottomBar — Quick info
// =============================================================================

import { useSchoolStore } from '../store/schoolStore';

export function BottomBar() {
  const { students } = useSchoolStore();

  return (
    <footer className="bottom-bar">
      <div className="bottom-bar-left">
        <span className="student-count">{students.length} students</span>
        <span className="divider">|</span>
        <span className="active-theorems">
          {students.filter(s => s.assignedFields.length > 0).length} active researchers
        </span>
      </div>
      <div className="bottom-bar-right">
        <span>🏛️ School of Thought</span>
      </div>
    </footer>
  );
}
