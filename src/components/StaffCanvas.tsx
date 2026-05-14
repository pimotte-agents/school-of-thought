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
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
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

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setDragging(false);
      if (isDropTarget && !hasMoved.current) {
        // Clicked on a valid drop target — set as mentor
        onSetMentor(staff.id, e.currentTarget instanceof HTMLElement
          ? e.currentTarget.getAttribute('data-staff-id') || null
          : null);
      }
      setIsDropTarget(false);
    },
    [isDropTarget, staff.id, onSetMentor]
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
  // HTML5 drag-and-drop (for drag-onto-other-staff)
  // -----------------------------------------------------------------------
  const handleDragStart = (e: DragEvent) => {
    if (!hasMoved.current) {
      e.dataTransfer.setData('menteeId', staff.id);
      e.dataTransfer.effectAllowed = 'move';
      // Start a native drag that will be cancelled on drop
      setTimeout(() => {
        // The drag will be handled by the drop target
      }, 0);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDropTarget(true);
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    setIsDropTarget(false);
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    setIsDraggingOver(false);

    const menteeId = e.dataTransfer.getData('menteeId');
    if (!menteeId || menteeId === staff.id) return;

    const state = useSchoolStore.getState();
    const mentee = state.students.find((s) => s.id === menteeId);
    if (!mentee || mentee.rank === 'student') return;

    // Mentor must be strictly higher rank
    if (rankOrder(staff.rank) <= rankOrder(mentee.rank)) return;

    onSetMentor(menteeId, staff.id);
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const scale = useSchoolStore.getState().zoom ?? 1;
  const nestedScale = Math.max(0.5, scale * 0.95); // mentees render slightly smaller

  return (
    <div
      ref={cardRef}
      className={`staff-card ${dragging ? 'dragging' : ''} ${isDraggingOver ? 'drag-over' : ''}`}
      style={{
        transform: `translate(${cardPos.x + panOffset.x}px, ${cardPos.y + panOffset.y}px)`,
        width: cardWidth,
        height: cardHeight,
        zIndex: dragging ? 1000 : rankOrder(staff.rank),
        borderColor: isDraggingOver ? '#4ecca3' : rankColor,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
  // Zoom controls
  // -----------------------------------------------------------------------
  const zoomIn = () => setZoom((prev) => Math.min(MAX_ZOOM, prev * 1.2));
  const zoomOut = () => setZoom((prev) => Math.max(MIN_ZOOM, prev / 1.2));
  const zoomReset = () => { setZoom(DEFAULT_ZOOM); setPanOffset({ x: 0, y: 0 }); };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="staff-canvas-wrapper">
      {/* Zoom controls */}
      <div className="canvas-controls">
        <span className="canvas-zoom-label">{Math.round(zoom * 100)}%</span>
        <button className="canvas-btn" onClick={zoomOut} title="Zoom out">−</button>
        <button className="canvas-btn" onClick={zoomReset} title="Reset view">⌂</button>
        <button className="canvas-btn" onClick={zoomIn} title="Zoom in">+</button>
        <span className="canvas-hint">Shift+drag to pan · Scroll to zoom</span>
      </div>

      {/* Drop target for removing mentor */}
      <div className="clear-drop-zone">
        <span>🗑</span> Drop staff here to remove mentor
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
        {staff.length === 0 && (
          <div className="canvas-empty">
            <p>Promote students to staff to begin organising mentorship.</p>
            <p>Drag staff onto each other to nest them.</p>
          </div>
        )}

        {/* Render mentors first (lower z-index), then mentees (higher z-index) */}
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
      </div>

      {/* Regular students list */}
      {regularStudents.length > 0 && (
        <div className="regular-students-list">
          <h3>Regular Students ({regularStudents.length})</h3>
          <div className="regular-students-grid">
            {regularStudents.map((s) => (
              <div
                key={s.id}
                className="regular-student-chip"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('menteeId', s.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
              >
                <span>{RANK_EMOJI[s.rank]} {s.name}</span>
                <span className="student-stats">Σ {s.stats.rigor + s.stats.creativity + s.stats.teaching}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
