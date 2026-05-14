// =============================================================================
// Zustand store for School of Thought
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SchoolState,
  Student,
  StudentRank,
  ResearchField,
  ActiveTheorem,
  EventEntry,
  PositionId,
} from '../types/game';
import { DEFAULT_RATIOS, POSITION_DATA, POSITION_IDS } from '../types/game';
import {
  ALL_THEOREMS,
  getNextTheorem,
} from '../data/theorems';
import { getQuotesForTrigger } from '../data/personality';
import {
  generateId,
  createStudent,
  checkRankRatios,
  isPromotionEligible,
  calculateSatisfaction,
  calculatePrestige,
  generateStudentName,
  secondsToMonths,
} from '../utils/gameUtils';

// --- Initial State Factory ---

function createInitialState(): SchoolState {
  const initialStudents: Student[] = [
    createStudent(generateStudentName()),
  ];

  return {
    generation: 1,
    resources: {
      theorems: 5,
      money: 100,
      reputation: 10,
      prestige: 0,
    },
    config: {
      maxCapacity: 1,
      positions: { phd: 1, assistant: 0, associate: 0, professor: 0 },
      prestigeBuffs: [],
    },
    // maxCapacity is always the sum of position counts
    // (kept as explicit value for persistence)
    students: initialStudents,
    currentTheorems: [],
    activeTheorems: [],
    theoremPool: new Set(ALL_THEOREMS.map((t) => t.id)),
    eventLog: [
      {
        id: generateId(),
        type: 'event',
        message: 'Your school is founded. The journey begins.',
        timestamp: 0,
      },
    ],
    gameSpeed: 1,
    totalMonthsPlayed: 0,
  };
}

// --- Helper: get current store state ---
const getStore = () => useSchoolStore.getState();

// --- Helper: calculate theorem progress per month ---
function calcTheoremProgress(
  active: ActiveTheorem,
  students: Student[]
): number {
  let totalStats = 0;

  for (const studentId of active.assignedStudents) {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      totalStats += student.stats.rigor + student.stats.creativity + student.stats.teaching;
    }
  }

  const baseRate = 100 / active.theorem.baseTime;
  const statsMult = Math.max(0.1, totalStats * 0.1);

  return baseRate * statsMult * statsMult;
}

function studentTotalStats(s: Student): number {
  return s.stats.rigor + s.stats.creativity + s.stats.teaching;
}

function isStudentIdle(studentId: string, active: ActiveTheorem[]): boolean {
  return !active.some((a) => a.assignedStudents.includes(studentId));
}

// --- Store ---

interface SchoolStore extends SchoolState {
  tick: (dtMs: number) => void;
  hireStudent: () => void;
  promoteStudent: (studentId: string) => void;
  assignFields: (studentId: string, fields: ResearchField[]) => void;
  assignMentor: (studentId: string, mentorId: string | null) => void;
  buyPosition: (positionId: PositionId) => void;
  retire: () => void;
  setGameSpeed: (speed: number) => void;
  clearEventLog: () => void;
  exportSave: () => string;
  importSave: (json: string) => void;
}

export const useSchoolStore = create<SchoolStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // ===================================================================
      // Game Loop
      // ===================================================================
      tick: (dtMs: number) => {
        const state = get();
        if (state.gameSpeed === 0 || state.students.length === 0) return;

        const dtMonths = secondsToMonths((dtMs * state.gameSpeed) / 1000);
        if (dtMonths < 0.001) return;

        set((prev) => {
          const newState: SchoolState = { ...prev };
          newState.totalMonthsPlayed += dtMonths;

          // --- Update student stats & satisfaction ---
          newState.students = prev.students.map((student) => {
            const updated = { ...student };
            updated.monthsInRank += dtMonths;
            updated.satisfaction = calculateSatisfaction(student, prev.students);

            // Random idle quotes (low probability)
            if (Math.random() < 0.0005 * dtMonths) {
              const quotes = getQuotesForTrigger('idle');
              if (quotes.length > 0) {
                updated.lastActiveQuote = quotes[Math.floor(Math.random() * quotes.length)];
              }
              updated.lastQuoteDate = prev.totalMonthsPlayed;
            }

            return updated;
          });

          // --- Check for faculty departures ---
          const departingIds: string[] = [];
          for (const student of newState.students) {
            if (student.satisfaction < 20 && Math.random() < 0.001 * dtMonths) {
              departingIds.push(student.id);
            }
          }

          if (departingIds.length > 0) {
            const departedStudents = newState.students.filter((s) =>
              departingIds.includes(s.id)
            );

            newState.students = newState.students.filter(
              (s) => !departingIds.includes(s.id)
            );

            // Reassign mentees whose mentor left
            newState.students = newState.students.map((s) => {
              if (s.mentorId && departingIds.includes(s.mentorId)) {
                return { ...s, mentorId: null };
              }
              return s;
            });

            // Add departure events
            for (const departed of departedStudents) {
              const quotes = [
                "I've learned all I can here. Time to move on.",
                "The grant money dried up. I can't keep working on this.",
              ];
              const quote = quotes[Math.floor(Math.random() * quotes.length)];
              newState.eventLog = [
                ...newState.eventLog,
                {
                  id: generateId(),
                  type: 'departure',
                  message: `${departed.name} has left the school. "${quote}"`,
                  timestamp: newState.totalMonthsPlayed,
                  studentId: departed.id,
                },
              ];
            }
          }

          // --- Process active theorems ---
          const updatedActive = prev.activeTheorems.map((active) => {
            const progressPerMonth = calcTheoremProgress(active, newState.students);
            const newProgress = Math.min(100, active.progress + progressPerMonth * dtMonths);
            return { ...active, progress: newProgress };
          });

          // Separate completed vs still-active theorems
          const completed: ActiveTheorem[] = [];
          const stillActive: ActiveTheorem[] = [];
          for (const active of updatedActive) {
            if (active.progress >= 100) {
              completed.push(active);
            } else {
              stillActive.push(active);
            }
          }

          newState.activeTheorems = stillActive;

          // --- Award resources for completed theorems ---
          for (const completedTheorem of completed) {
            const tEarned = completedTheorem.theorem.theoremValue;
            const mEarned = completedTheorem.theorem.moneyValue;
            const rEarned = completedTheorem.theorem.reputationValue;

            newState.resources = {
              theorems: prev.resources.theorems + tEarned,
              money: prev.resources.money + mEarned,
              reputation: prev.resources.reputation + rEarned,
              prestige: prev.resources.prestige,
            };

            // Update student theorem counts
            for (const studentId of completedTheorem.assignedStudents) {
              const student = newState.students.find((s) => s.id === studentId);
              if (student) {
                student.theoremsProved += 1;
              }
            }

            newState.eventLog = [
              ...newState.eventLog,
              {
                id: generateId(),
                type: 'theorem',
                message: `📜 "${completedTheorem.theorem.name}" formalized!`,
                timestamp: newState.totalMonthsPlayed,
              },
            ];
          }

          newState.currentTheorems = [
            ...prev.currentTheorems,
            ...completed.map((c) => ({
              id: c.id,
              theorem: c.theorem,
              completedDate: newState.totalMonthsPlayed,
              provedBy: c.assignedStudents,
            })),
          ];

          // --- Assign new theorems to idle students ---
          const provedIds = new Set(prev.currentTheorems.map((t) => t.theorem.id));
          for (const student of newState.students) {
            if (
              student.assignedFields.length > 0 &&
              isStudentIdle(student.id, stillActive)
            ) {
              const next = getNextTheorem(
                provedIds,
                new Set(student.assignedFields)
              );
              if (next) {
                stillActive.push({
                  id: generateId(),
                  theorem: next,
                  progress: 0,
                  assignedStudents: [student.id],
                  fundingPercentage: 50,
                  startDate: newState.totalMonthsPlayed,
                });
              }
            }
          }

          newState.activeTheorems = stillActive;

          return newState;
        });
      },

      // ===================================================================
      // Student Management
      // ===================================================================
      hireStudent: () => {
        const { students, resources, config } = get();
        if (students.length >= config.maxCapacity) return;
        const phdCount = students.filter((s) => s.rank === 'student').length;
        if (phdCount >= config.positions.phd) return;

        const cost = 20 + students.length * 5;
        if (resources.money < cost) return;

        const newStudent = createStudent(generateStudentName());

        set((prev) => ({
          ...prev,
          students: [...prev.students, newStudent],
          resources: {
            ...prev.resources,
            money: prev.resources.money - cost,
          },
          eventLog: [
            ...prev.eventLog,
            {
              id: generateId(),
              type: 'hire',
              message: `🎓 ${newStudent.name} joined as a PhD candidate.`,
              timestamp: prev.totalMonthsPlayed,
              studentId: newStudent.id,
            },
          ],
        }));
      },

      promoteStudent: (studentId: string) => {
        const state = get();
        const student = state.students.find((s) => s.id === studentId);
        if (!student) return;

        const targetRank =
          student.rank === 'student' ? 'assistant' :
          student.rank === 'assistant' ? 'associate' : 'professor';
        if (!isPromotionEligible(student, targetRank)) return;

        // Check ratio constraints
        const ratios = checkRankRatios(state.students, DEFAULT_RATIOS, targetRank);
        if (!ratios.canPromote) return;

        set((prev) => ({
          ...prev,
          students: prev.students.map((s) =>
            s.id === studentId
              ? {
                  ...s,
                  rank: targetRank,
                  monthsInRank: 0,
                  satisfaction: Math.min(100, s.satisfaction + 15),
                }
              : s
          ),
          eventLog: [
            ...prev.eventLog,
            {
              id: generateId(),
              type: 'promotion',
              message: `🎉 ${student.name} → ${
                targetRank === 'assistant' ? 'Assistant' :
                targetRank === 'associate' ? 'Associate' :
                'Full' } Professor!`,
              timestamp: prev.totalMonthsPlayed,
              studentId: student.id,
            },
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

      assignMentor: (studentId: string, mentorId: string | null) => {
        set((prev) => {
          const updated = prev.students.map((s) => {
            if (s.id === studentId) {
              return { ...s, mentorId };
            }
            if (s.id === mentorId) {
              return {
                ...s,
                menteeIds: [...s.menteeIds, studentId],
              };
            }
            if (s.menteeIds.includes(studentId)) {
              return {
                ...s,
                menteeIds: s.menteeIds.filter((id) => id !== studentId),
              };
            }
            return s;
          });
          return { ...prev, students: updated };
        });
      },

      retire: () => {
        const state = get();
        const associates = state.students.filter((s) => s.rank === 'associate' || s.rank === 'professor');
        if (associates.length === 0) return;
        // Check there's room in PhD positions for new students
        if (state.config.positions.phd < 2) return;

        // Weighted random successor
        const total = associates.reduce((s, a) => s + studentTotalStats(a), 0);
        let rand = Math.random() * total;
        let successor = associates[0];
        for (const a of associates) {
          rand -= studentTotalStats(a);
          if (rand <= 0) {
            successor = a;
            break;
          }
        }

        const prestigeEarned = calculatePrestige(
          state.currentTheorems.length,
          state.currentTheorems.reduce((max, t) => Math.max(max, t.theorem.tier), 1),
          state.totalMonthsPlayed / 12,
          state.students.filter((s) => s.rank !== 'student').length,
          state.resources.reputation
        );

        const retirementQuote = getQuotesForTrigger('retirement');

        set({
          generation: state.generation + 1,
          students: [
            createStudent(generateStudentName()),
            createStudent(generateStudentName()),
          ],
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
            {
              id: generateId(),
              type: 'retirement',
              message: `👑 Gen ${state.generation} retires. ${successor.name} succeeds. +${prestigeEarned.toFixed(1)} Prestige!`,
              timestamp: state.totalMonthsPlayed,
            },
            ...(retirementQuote.map((text) => ({
              id: generateId(),
              type: 'quote' as const,
              message: text,
              timestamp: state.totalMonthsPlayed,
            }))),
          ],
        });
      },

      // ===================================================================
      // Positions
      // ===================================================================
      buyPosition: (positionId: PositionId) => {
        const state = get();
        const data = POSITION_DATA[positionId];
        const currentCount = state.config.positions[positionId];
        const cost = data.baseCost + currentCount * data.costPerLevel;

        if (state.resources.money < cost) return;

        set((prev) => {
          const newPositions = { ...prev.config.positions, [positionId]: prev.config.positions[positionId] + 1 };
          const newMaxCapacity = Object.values(newPositions).reduce((a, b) => a + b, 0);
          return {
            ...prev,
            resources: { ...prev.resources, money: prev.resources.money - cost },
            config: {
              ...prev.config,
              positions: newPositions,
              maxCapacity: newMaxCapacity,
            },
            eventLog: [
              ...prev.eventLog,
              {
                id: generateId(),
                type: 'event',
                message: `🏗️ Expanded: +1 ${data.label} position (${newPositions[positionId]} total).`,
                timestamp: prev.totalMonthsPlayed,
              },
            ],
          };
        });
      },

      // ===================================================================
      // Speed
      // ===================================================================
      setGameSpeed: (speed: number) => {
        set({ gameSpeed: speed });
      },

      // ===================================================================
      // Event Log
      // ===================================================================
      clearEventLog: () => {
        set((prev) => ({
          ...prev,
          eventLog: prev.eventLog.slice(-50),
        }));
      },

      // ===================================================================
      // Save / Load
      // ===================================================================
      exportSave: () => JSON.stringify(get()),
      importSave: (json: string) => {
        try {
          const data = JSON.parse(json);
          set(data);
        } catch (e) {
          console.error('Failed to import save:', e);
        }
      },
    }),
    {
      name: 'school-of-thought-save',
      version: 2,
      partialize: (state) => ({
        generation: state.generation,
        resources: state.resources,
        config: state.config,
        students: state.students,
        currentTheorems: state.currentTheorems,
        activeTheorems: state.activeTheorems,
        eventLog: state.eventLog.slice(-200),
        gameSpeed: state.gameSpeed,
        totalMonthsPlayed: state.totalMonthsPlayed,
      }),
    }
  )
);
