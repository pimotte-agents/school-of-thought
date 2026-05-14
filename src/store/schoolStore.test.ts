// =============================================================================
// Unit tests for school store logic (vanilla store, no persist middleware)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import type { SchoolState, Student, ResearchField } from '../types/game';
import { createStudent, checkRankRatios, isPromotionEligible, calculateSatisfaction, calculatePrestige, generateStudentName, getTotalStats } from '../utils/gameUtils';
import { DEFAULT_RATIOS } from '../types/game';
import { ALL_THEOREMS } from '../data/theorems';

// --- Helper: create a vanilla store for testing (no persist) ---
function createTestStore(initial?: Partial<SchoolState>) {
  const defaults: SchoolState = {
    generation: 1,
    resources: { theorems: 5, money: 100, reputation: 10, prestige: 0 },
    config: { maxCapacity: 5, prestigeBuffs: [] },
    students: [
      createStudent(generateStudentName()),
      createStudent(generateStudentName()),
      createStudent(generateStudentName()),
    ],
    currentTheorems: [],
    activeTheorems: [],
    theoremPool: new Set(ALL_THEOREMS.map((t) => t.id)),
    eventLog: [],
    gameSpeed: 1,
    totalMonthsPlayed: 0,
  };

  return create<SchoolState & {
    hireStudent: () => void;
    promoteStudent: (id: string) => void;
    assignFields: (id: string, fields: ResearchField[]) => void;
    setGameSpeed: (speed: number) => void;
    retire: () => void;
  }>((set, get) => ({
    ...defaults,
    ...initial,

    hireStudent: () => {
      const state = get();
      if (state.students.length >= state.config.maxCapacity) return;
      const cost = 20 + state.students.length * 5;
      if (state.resources.money < cost) return;

      const newStudent = createStudent(generateStudentName());
      set((prev) => ({
        ...prev,
        students: [...prev.students, newStudent],
        resources: { ...prev.resources, money: prev.resources.money - cost },
        eventLog: [
          ...prev.eventLog,
          { id: `hire_${Date.now()}`, type: 'hire', message: `${newStudent.name} joined.`, timestamp: prev.totalMonthsPlayed, studentId: newStudent.id },
        ],
      }));
    },

    promoteStudent: (studentId: string) => {
      const state = get();
      const student = state.students.find((s) => s.id === studentId);
      if (!student) return;

      const targetRank = student.rank === 'student' ? 'assistant' :
                         student.rank === 'assistant' ? 'associate' : 'professor';
      if (!isPromotionEligible(student, targetRank)) return;

      const ratios = checkRankRatios(state.students, DEFAULT_RATIOS, targetRank);
      if (!ratios.canPromote) return;

      set((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId
            ? { ...s, rank: targetRank, monthsInRank: 0, satisfaction: Math.min(100, s.satisfaction + 15) }
            : s
        ),
        eventLog: [
          ...prev.eventLog,
          { id: `promo_${Date.now()}`, type: 'promotion', message: `${student.name} → ${targetRank}.`, timestamp: prev.totalMonthsPlayed, studentId: student.id },
        ],
      }));
    },

    assignFields: (studentId: string, fields: ResearchField[]) => {
      set((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, assignedFields: fields } : s
        ),
      }));
    },

    setGameSpeed: (speed: number) => {
      set({ gameSpeed: speed });
    },

    retire: () => {
      const state = get();
      const associates = state.students.filter((s) => s.rank === 'associate' || s.rank === 'professor');
      if (associates.length === 0) return;

      const total = associates.reduce((s, a) => s + getTotalStats(a), 0);
      let rand = Math.random() * total;
      let successor = associates[0];
      for (const a of associates) {
        rand -= getTotalStats(a);
        if (rand <= 0) { successor = a; break; }
      }

      const prestigeEarned = calculatePrestige(
        state.currentTheorems.length,
        state.currentTheorems.length > 0 ? state.currentTheorems[0].theorem.tier : 1,
        state.totalMonthsPlayed / 12,
        state.students.filter((s) => s.rank !== 'student').length,
        state.resources.reputation
      );

      set({
        generation: state.generation + 1,
        students: [createStudent(generateStudentName()), createStudent(generateStudentName())],
        resources: {
          theorems: state.resources.theorems,
          money: state.resources.money,
          reputation: state.resources.reputation,
          prestige: state.resources.prestige + prestigeEarned,
        },
        currentTheorems: [],
        activeTheorems: [],
        totalMonthsPlayed: 0,
        gameSpeed: 1,
        eventLog: [
          ...state.eventLog,
          { id: `retire_${Date.now()}`, type: 'retirement', message: `Gen ${state.generation} retires. ${successor.name} succeeds.`, timestamp: state.totalMonthsPlayed },
        ],
      });
    },
  }));
}

// --- Tests ---

describe('initial state', () => {
  it('starts with 3 students', () => {
    const store = createTestStore();
    expect(store.getState().students.length).toBe(3);
  });

  it('starts with correct resources', () => {
    const store = createTestStore();
    const state = store.getState();
    expect(state.resources.theorems).toBe(5);
    expect(state.resources.money).toBe(100);
    expect(state.resources.reputation).toBe(10);
    expect(state.resources.prestige).toBe(0);
  });

  it('starts in first generation', () => {
    const store = createTestStore();
    expect(store.getState().generation).toBe(1);
  });

  it('starts at normal game speed', () => {
    const store = createTestStore();
    expect(store.getState().gameSpeed).toBe(1);
  });
});

describe('hireStudent', () => {
  it('hires a student when there is capacity', () => {
    const store = createTestStore();
    const before = store.getState().students.length;
    store.getState().hireStudent();
    expect(store.getState().students.length).toBe(before + 1);
  });

  it('does not hire when at capacity', () => {
    const store = createTestStore();
    store.setState({ config: { maxCapacity: 3, prestigeBuffs: [] } });
    const before = store.getState().students.length;
    store.getState().hireStudent();
    expect(store.getState().students.length).toBe(before);
  });

  it('reduces money when hiring', () => {
    const store = createTestStore();
    const before = store.getState().resources.money;
    store.getState().hireStudent();
    expect(store.getState().resources.money).toBeLessThan(before);
  });

  it('adds a hire event to the log', () => {
    const store = createTestStore();
    store.getState().hireStudent();
    const events = store.getState().eventLog;
    expect(events.find((e) => e.type === 'hire')).toBeDefined();
  });
});

describe('promoteStudent', () => {
  it('does nothing if student is not eligible', () => {
    const store = createTestStore();
    const id = store.getState().students[0].id;
    const before = store.getState().students.find((s) => s.id === id)?.rank;
    store.getState().promoteStudent(id);
    expect(store.getState().students.find((s) => s.id === id)?.rank).toBe(before);
  });

  it('does nothing if ratio is exceeded', () => {
    const store = createTestStore();
    store.setState((s) => ({
      ...s,
      students: s.students.map((st) => ({ ...st, rank: 'assistant' as const, monthsInRank: 10, theoremsProved: 10 })),
    }));
    const id = store.getState().students[0].id;
    const before = store.getState().students.find((s) => s.id === id)?.rank;
    store.getState().promoteStudent(id);
    expect(store.getState().students.find((s) => s.id === id)?.rank).toBe(before);
  });

  it('promotes eligible student', () => {
    const store = createTestStore();
    // Use 10 students so ratios work (30% of 10 = 3 associates max)
    const extraStudents = Array.from({ length: 7 }, () => createStudent(generateStudentName()));
    store.setState((s) => ({
      ...s,
      students: [
        { ...s.students[0], rank: 'student' as const, monthsInRank: 1, theoremsProved: 1 },
        ...s.students.slice(1),
        ...extraStudents,
      ],
    }));
    const id = store.getState().students[0].id;
    store.getState().promoteStudent(id);
    const student = store.getState().students.find((s) => s.id === id);
    expect(student?.rank).toBe('assistant');
  });
});

describe('assignFields', () => {
  it('assigns fields to a student', () => {
    const store = createTestStore();
    const id = store.getState().students[0].id;
    store.getState().assignFields(id, ['Boolean Logic', 'Number Theory']);
    const student = store.getState().students.find((s) => s.id === id);
    expect(student?.assignedFields).toEqual(['Boolean Logic', 'Number Theory']);
  });
});

describe('setGameSpeed', () => {
  it('sets paused', () => {
    const store = createTestStore();
    store.getState().setGameSpeed(0);
    expect(store.getState().gameSpeed).toBe(0);
  });

  it('sets 5x', () => {
    const store = createTestStore();
    store.getState().setGameSpeed(5);
    expect(store.getState().gameSpeed).toBe(5);
  });
});

describe('retire', () => {
  it('does nothing without associate/professor', () => {
    const store = createTestStore();
    store.setState((s) => ({ ...s, students: s.students.map((st) => ({ ...st, rank: 'student' as const })) }));
    const beforeGen = store.getState().generation;
    store.getState().retire();
    expect(store.getState().generation).toBe(beforeGen);
  });

  it('advances generation with an associate', () => {
    const store = createTestStore();
    store.setState((s) => ({
      ...s,
      students: [{ ...s.students[0], rank: 'associate' as const, monthsInRank: 5, theoremsProved: 5 }, ...s.students.slice(1)],
    }));
    const beforeGen = store.getState().generation;
    store.getState().retire();
    expect(store.getState().generation).toBe(beforeGen + 1);
  });

  it('adds prestige on retirement', () => {
    const store = createTestStore();
    store.setState((s) => ({
      ...s,
      students: [{ ...s.students[0], rank: 'associate' as const, monthsInRank: 5, theoremsProved: 5 }, ...s.students.slice(1)],
      currentTheorems: [{ id: 't', theorem: { id: 't1_0', name: 'T', description: 'D', tier: 1, fields: ['Boolean Logic'], baseTime: 10, theoremValue: 1, moneyValue: 5, reputationValue: 2 }, completedDate: 0, provedBy: [] }],
    }));
    const before = store.getState().resources.prestige;
    store.getState().retire();
    expect(store.getState().resources.prestige).toBeGreaterThan(before);
  });

  it('adds retirement event', () => {
    const store = createTestStore();
    store.setState((s) => ({
      ...s,
      students: [{ ...s.students[0], rank: 'associate' as const, monthsInRank: 5, theoremsProved: 5 }, ...s.students.slice(1)],
    }));
    store.getState().retire();
    expect(store.getState().eventLog.find((e) => e.type === 'retirement')).toBeDefined();
  });
});
