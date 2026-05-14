// =============================================================================
// StaffCanvas — Freeform canvas for mentoring staff with zoom/pan
// =============================================================================

import { useRef, useState, useCallback, type DragEvent, type MouseEvent, type TouchEvent } from 'react';
import { useSchoolStore } from '../store/schoolStore';
import { RANK_LABELS, RANK_EMOJI } from '../types/game';
import { getRankColor } from '../utils/gameUtils';
import type { Student, StudentRank } from '../types/game';

const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 0.5;

function rankOrder(rank: StudentRank): number {
  return rank === 'student' ? 0 : rank === 'assistant' ? 1 : rank === 'associate' ? 2 : 3;
}

/* --------------------------------------------------------------------------- */
/*  PhDStudentBox — a simpler box for regular students on the canvas           */
/* --------------------------------------------------------------------------- */

function PhDStudentBox({
  student,
  panOffset,
  onClearMentor,
}: {
  student: Student;
  panOffset: { x: number; y: number };
  onClearMentor: (studentId: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [cardPos, setCardPos] = useState(() => ({ x: 0, y: 0 }));
  const hasMoved = useRef(false);
  const isDraggingRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const boxWidth = 140;
  const boxHeight = 60;
  const rankColor = getRankColor(student.rank);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      setMouseDownPos({ x: e.clientX, y: e.clientY });
      hasMoved.current = false;
      isDraggingRef.current = true;
      setDragging(true);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
      }
      if (hasMoved.current) {
        setCardPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setMouseDownPos({ x: e.clientX, y: e.clientY });
      }
    },
    [mouseDownPos]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setDragging(false);

      // Detect what's under the cursor
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const staffId = el?.closest('[data-staff-id]')?.getAttribute('data-staff-id');
      const clearZone = el?.closest('.clear-drop-zone');

      if (clearZone) {
        // Dropped on clear zone — remove mentor
        if (student.mentorId) {
          onClearMentor(student.id);
        }
      } else if (staffId && staffId !== student.id) {
        // Dropped on a staff card — set as mentor
        const state = useSchoolStore.getState();
        const targetStaff = state.students.find((s) => s.id === staffId);
        if (targetStaff && targetStaff.rank !== 'student') {
          if (rankOrder(targetStaff.rank) > rankOrder(student.rank)) {
            useSchoolStore.getState().assignMentor(student.id, staffId);
          }
        }
      }
    },
    [student.id, student.mentorId, onClearMentor]
  );

  return (
    <div
      className={`phd-student-box ${dragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${cardPos.x + panOffset.x}px, ${cardPos.y + panOffset.y}px)`,
        width: boxWidth,
        height: boxHeight,
        borderColor: dragging ? '#4ecca3' : rankColor,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="phd-student-header">
        <span style={{ color: rankColor }}>{RANK_EMOJI[student.rank]}</span>
        <span className="phd-student-name">{student.name}</span>
      </div>
      <div className="phd-student-stats">
        <span>R:{student.stats.rigor} C:{student.stats.creativity} T:{student.stats.teaching}</span>
        <span>Σ {student.stats.rigor + student.stats.creativity + student.stats.teaching}</span>
      </div>
      {student.assignedFields.length > 0 && (
        <div className="phd-student-fields">
          {student.assignedFields.map((f) => (
            <span key={f} className="field-tag">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/*  StaffCard — a single draggable staff member rendered on the canvas        */
/* --------------------------------------------------------------------------- */

function StaffCard({
  staff,
  mentees,
  mentor,
  panOffset,
  onSetMentor,
}: {
  staff: Student;
  mentees: Student[];
  mentor: Student | undefined;
  panOffset: { x: number; y: number };
  onSetMentor: (menteeId: string, mentorId: string | null) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [cardPos, setCardPos] = useState(() => ({ x: 0, y: 0 }));
  const hasMoved = useRef(false);
  const isDraggingRef = useRef(false);

  const rankColor = getRankColor(staff.rank);
  const cardWidth = 220;
  const cardHeight = mentees.length > 0 ? Math.max(120, 120 + mentees.length * 70) : 120;

  // -----------------------------------------------------------------------
  // Native mouse drag (for repositioning the card on the canvas)
  // -----------------------------------------------------------------------
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return; // only left click
      e.preventDefault();
      e.stopPropagation();
      setMouseDownPos({ x: e.clientX, y: e.clientY });
      hasMoved.current = false;
      isDraggingRef.current = true;
      setDragging(true);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
      }

      // Only reposition if the card has been dragged (not just clicked)
      if (hasMoved.current) {
        const newX = cardPos.x + dx;
        const newY = cardPos.y + dy;
        setCardPos({ x: newX, y: newY });
        setMouseDownPos({ x: e.clientX, y: e.clientY });
      }
    },
    [mouseDownPos, cardPos]
  );

  // -----------------------------------------------------------------------
  // Detect drop target via elementFromPoint on mouseup
  // -----------------------------------------------------------------------
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setDragging(false);

      if (hasMoved.current) {
        // Dragged — check what's under the cursor
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const targetId = el?.closest('[data-staff-id]')?.getAttribute('data-staff-id');

        if (targetId && targetId !== staff.id) {
          // Dropped on another staff card — set as mentor
          const state = useSchoolStore.getState();
          const target = state.students.find((s) => s.id === targetId);
          const mentee = state.students.find((s) => s.id === staff.id);
          if (target && mentee && target.rank !== 'student') {
            if (rankOrder(target.rank) > rankOrder(mentee.rank)) {
              onSetMentor(staff.id, targetId);
            }
          }
        }
      } else {
        // Not dragged — just a click. Toggle mentor if clicked on another card.
        // (Handled by the drop target's onSetMentor)
      }
    },
    [staff.id, onSetMentor]
  );

  // -----------------------------------------------------------------------
  // Touch drag (for mobile)
  // -----------------------------------------------------------------------
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      setMouseDownPos({ x: touch.clientX, y: touch.clientY });
      hasMoved.current = false;
      isDraggingRef.current = true;
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - mouseDownPos.x;
      const dy = touch.clientY - mouseDownPos.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
      }
      if (hasMoved.current) {
        setCardPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setMouseDownPos({ x: touch.clientX, y: touch.clientY });
      }
    },
    [mouseDownPos]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    // Touch drop handled separately via drop target state
  }, []);



  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const scale = useSchoolStore.getState().zoom ?? 1;
  const nestedScale = Math.max(0.5, scale * 0.95); // mentees render slightly smaller

  return (
    <div
      ref={cardRef}
      className={`staff-card ${dragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${cardPos.x + panOffset.x}px, ${cardPos.y + panOffset.y}px)`,
        width: cardWidth,
        height: cardHeight,
        zIndex: dragging ? 1000 : rankOrder(staff.rank),
        borderColor: dragging ? '#4ecca3' : rankColor,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-staff-id={staff.id}
    >
      {/* Card header */}
      <div className="staff-card-header" style={{ cursor: 'grab' }}>
        <span style={{ color: rankColor, fontSize: 20 }}>
          {RANK_EMOJI[staff.rank]}
        </span>
        <span className="staff-card-name">{staff.name}</span>
        <span className="staff-card-rank" style={{ color: rankColor }}>
          {RANK_LABELS[staff.rank]}
        </span>
      </div>

      {/* Mentor indicator */}
      {mentor && (
        <div className="staff-card-mentor">
          ↑ Mentor: {mentor.name}
        </div>
      )}

      {/* Mentees (nested cards) */}
      {mentees.length > 0 && (
        <div className="staff-card-mentees">
          {mentees.map((m) => (
            <div key={m.id} className="staff-card-mentee">
              <span style={{ color: getRankColor(m.rank) }}>
                {RANK_EMOJI[m.rank]}
              </span>
              <span>{m.name}</span>
              <span className="staff-card-mentee-rank" style={{ color: getRankColor(m.rank) }}>
                {RANK_LABELS[m.rank]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/*  StaffCanvas — main component                                               */
/* --------------------------------------------------------------------------- */

export function StaffCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const { students, assignMentor } = useSchoolStore();

  const staff = students.filter((s): s is Student => s.rank !== 'student');
  const regularStudents = students.filter((s) => s.rank === 'student');

  const getMentor = useCallback(
    (id: string): Student | undefined => {
      const state = useSchoolStore.getState();
      const s = state.students.find((st) => st.id === id);
      return s?.mentorId ? state.students.find((st) => st.id === s.mentorId) : undefined;
    },
    []
  );

  const getMentees = useCallback(
    (id: string): Student[] => {
      const state = useSchoolStore.getState();
      return state.students.filter((s) => s.mentorId === id && s.rank !== 'student');
    },
    []
  );

  // -----------------------------------------------------------------------
  // Mentor assignment
  // -----------------------------------------------------------------------
  const handleSetMentor = useCallback((menteeId: string, mentorId: string | null) => {
    // If the mentee already has this mentor, toggle off
    const state = useSchoolStore.getState();
    const mentee = state.students.find((s) => s.id === menteeId);
    if (mentee?.mentorId === mentorId) {
      assignMentor(menteeId, null);
      return;
    }
    assignMentor(menteeId, mentorId);
  }, [assignMentor]);

  // -----------------------------------------------------------------------
  // Zoom with scroll wheel
  // -----------------------------------------------------------------------
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      setZoom((prev) => {
        const next = prev * (1 + delta);
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
      });
    },
    []
  );

  // -----------------------------------------------------------------------
  // Pan with middle mouse or shift+drag
  // -----------------------------------------------------------------------
  const handleCanvasMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    },
    [panOffset]
  );

  const handleCanvasMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    },
    [isPanning, panStart]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch pan (two fingers)
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        setPanStart({
          x: e.touches[0].clientX - panOffset.x,
          y: e.touches[0].clientY - panOffset.y,
        });
        setIsPanning(true);
      }
    },
    [panOffset]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPanning || e.touches.length !== 2) return;
      e.preventDefault();
      const t = e.touches[0];
      setPanOffset({
        x: t.clientX - panStart.x,
        y: t.clientY - panStart.y,
      });
    },
    [isPanning, panStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Pinch-to-zoom on touch
  const [pinchStart, setPinchStart] = useState<number | null>(null);
  const handlePinchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setPinchStart(Math.sqrt(dx * dx + dy * dy));
    }
  }, []);

  const handlePinchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStart === null) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchStart;
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * ratio)));
      setPinchStart(dist);
    },
    [pinchStart]
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="staff-canvas-wrapper">
      {/* Zoom controls */}
      <div className="canvas-controls">
        <span className="canvas-zoom-label">{Math.round(zoom * 100)}%</span>
        <span className="canvas-hint">Scroll to zoom · Shift+drag to pan · Left-click drag to move</span>
      </div>

      {/* Drop target for removing mentor */}
      <div className="clear-drop-zone">
        <span>🗑</span> Drop any student here to remove mentor
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="staff-canvas"
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onTouchStart={(e) => { handleTouchStart(e); handlePinchStart(e); }}
        onTouchMove={(e) => { handleTouchMove(e); handlePinchMove(e); }}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render mentors first (lower z-index), then mentees, then PhD students */}
        {staff
          .sort((a, b) => rankOrder(a.rank) - rankOrder(b.rank))
          .map((s) => (
            <StaffCard
              key={s.id}
              staff={s}
              mentees={getMentees(s.id)}
              mentor={getMentor(s.id)}
              panOffset={panOffset}
              onSetMentor={handleSetMentor}
            />
          ))}

        {/* PhD students */}
        {regularStudents.map((s) => (
          <PhDStudentBox
            key={s.id}
            student={s}
            panOffset={panOffset}
            onClearMentor={(id) => onSetMentor(id, null)}
          />
        ))}
      </div>


    </div>
  );
}
