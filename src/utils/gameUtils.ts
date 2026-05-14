// =============================================================================
// Pure utility functions for game logic
// =============================================================================

import type {
  Student,
  StudentRank,
  Resources,
  RankRatios,
  TheoremTier,
  TraitId,
} from '../types/game';
import { RANK_LABELS, RANK_EMOJI, DEFAULT_RATIOS, TRAITS } from '../types/game';
import { FIRST_NAMES, LAST_NAMES } from '../data/personality';

// --- ID Generation ---

let idCounter = 0;
export function generateId(): string {
  idCounter++;
  return `id_${idCounter}_${Date.now()}`;
}

// --- Student Creation ---

export function createStudent(name: string): Student {
  // Base stats: 1-3 per stat
  const baseStats = {
    rigor: Math.floor(Math.random() * 3) + 1,
    creativity: Math.floor(Math.random() * 3) + 1,
    teaching: Math.floor(Math.random() * 2) + 1,
  };

  // Random traits (1-2 traits)
  const numTraits = Math.random() < 0.3 ? 2 : 1;
  const allTraitIds = Object.keys(TRAITS) as TraitId[];

  const usedTraits = new Set<string>();
  const traits: TraitId[] = [];
  for (let i = 0; i < numTraits; i++) {
    const available = allTraitIds.filter((t) => !usedTraits.has(t));
    if (available.length === 0) break;
    const trait = available[Math.floor(Math.random() * available.length)];
    usedTraits.add(trait);
    traits.push(trait);
  }

  return {
    id: generateId(),
    name,
    rank: 'student',
    stats: baseStats,
    baseStats: baseStats,
    traits: traits as string[],
    specialization: {
      'Boolean Logic': 1,
      'Number Theory': 1,
      'Set Theory': 1,
      'Category Theory': 0,
      'Proof Theory': 1,
      'Computability Theory': 0,
      'Model Theory': 0,
      'Combinatorics': 0,
    },
    assignedFields: [],
    mentorId: null,
    menteeIds: [],
    theoremsProved: 0,
    monthsInRank: 0,
    satisfaction: 70,
    joinedDate: 0,
    lastActiveQuote: null,
    lastQuoteDate: 0,
  };
}



// --- Rank Calculations ---

export function getRankTotal(rank: StudentRank): number {
  const multipliers: Record<StudentRank, number> = {
    student: 1,
    assistant: 2,
    associate: 4,
    professor: 8,
  };
  return multipliers[rank];
}

export function getRankLabel(rank: StudentRank): string {
  return RANK_LABELS[rank];
}

export function getRankEmoji(rank: StudentRank): string {
  return RANK_EMOJI[rank];
}

// --- Ratio Checks ---

export function checkRankRatios(
  students: Student[],
  ratios: RankRatios = DEFAULT_RATIOS,
  targetRank?: StudentRank
): { canPromote: boolean; reason: string } {
  const total = students.length;
  if (total === 0) return { canPromote: false, reason: 'No students' };

  const ranks = students.reduce(
    (acc, s) => {
      acc[s.rank]++;
      return acc;
    },
    { student: 0, assistant: 0, associate: 0, professor: 0 } as Record<StudentRank, number>
  );

  // Check the ratio for the current rank's promotion cap
  // When a 'student' promotes to 'assistant', check the assistantMaxPercent cap
  const ratioKeyMap: Record<StudentRank, keyof RankRatios> = {
    student: 'assistantMaxPercent',
    assistant: 'associateMaxPercent',
    associate: 'professorMaxPercent',
    professor: 'professorMaxPercent',
  };

  if (targetRank) {
    // Map from current rank (who's being promoted from) to ratio key
    const currentRankKey: StudentRank =
      targetRank === 'assistant' ? 'student' :
      targetRank === 'associate' ? 'assistant' :
      targetRank === 'professor' ? 'associate' : 'student';
    const ratioKey = ratioKeyMap[currentRankKey];
    const maxPercent = ratios[ratioKey];
    const maxCount = Math.max(1, Math.floor(total * maxPercent));
    // The ratio caps the TARGET rank's percentage of total
    if (ranks[targetRank] + 1 > maxCount) {
      return { canPromote: false, reason: `${targetRank} ratio would exceed ${Math.round(maxPercent * 100)}%` };
    }
    return { canPromote: true, reason: '' };
  }

  // Without a target rank: check if any promotion is possible.
  // Only check a rank's ratio if there are students at a lower rank who could be promoted to it.
  if (ranks.associate > 0 && ranks.professor + 1 > Math.max(1, Math.floor(total * ratios.professorMaxPercent))) {
    return { canPromote: false, reason: `Professor ratio would exceed ${Math.round(ratios.professorMaxPercent * 100)}%` };
  }
  if (ranks.assistant > 0 && ranks.associate + 1 > Math.max(1, Math.floor(total * ratios.associateMaxPercent))) {
    return { canPromote: false, reason: `Associate ratio would exceed ${Math.round(ratios.associateMaxPercent * 100)}%` };
  }
  if (ranks.student > 0 && ranks.assistant + 1 > Math.max(1, Math.floor(total * ratios.assistantMaxPercent))) {
    return { canPromote: false, reason: `Assistant ratio would exceed ${Math.round(ratios.assistantMaxPercent * 100)}%` };
  }

  return { canPromote: true, reason: '' };
}

// --- Promotion Eligibility ---

export function isPromotionEligible(
  student: Student,
  targetRank: StudentRank
): boolean {
  if (student.rank === targetRank) return false;

  // Check rank progression order
  const rankOrder: StudentRank[] = ['student', 'assistant', 'associate', 'professor'];
  const currentIdx = rankOrder.indexOf(student.rank);
  const targetIdx = rankOrder.indexOf(targetRank);
  if (targetIdx !== currentIdx + 1) return false; // Must promote one step at a time

  // Check months in current rank
  const minMonths: Record<StudentRank, number> = {
    student: 1,
    assistant: 2,
    associate: 6,
    professor: 999, // Won't happen without manual trigger or prestige upgrade
  };
  if (student.monthsInRank < minMonths[student.rank]) return false;

  // Check theorem requirements
  const minTheorems: Record<StudentRank, number> = {
    student: 0,
    assistant: 1,
    associate: 3,
    professor: 8,
  };
  if (student.theoremsProved < minTheorems[targetRank]) return false;

  return true;
}

// --- Satisfaction Calculation ---

export function calculateSatisfaction(
  student: Student,
  allStudents: Student[]
): number {
  let sat = 70; // base

  // Check for rank inversion: are less talented students above?
  const talentedStudents = allStudents
    .filter((s) => s.id !== student.id && s.rank === student.rank)
    .sort((a, b) => getTotalStats(b) - getTotalStats(a));

  const studentTotal = getTotalStats(student);
  for (const peer of talentedStudents) {
    if (getTotalStats(peer) < studentTotal - 2) {
      sat -= 10; // Penalized for being above a less talented peer
    }
  }

  // Mentorship satisfaction
  if (student.rank !== 'student' && student.menteeIds.length === 0 && student.stats.teaching >= 2) {
    sat -= 10;
  }

  // Trait bonuses
  if (student.traits.includes('perfectionist')) sat -= 5; // perfectionists are never satisfied
  if (student.traits.includes('maverick')) sat -= 5; // mavericks are hard to please

  return Math.max(0, Math.min(100, sat));
}

export function getTotalStats(student: Student): number {
  return student.stats.rigor + student.stats.creativity + student.stats.teaching;
}

// --- Prestige Calculation ---

export function calculatePrestige(
  theoremsProved: number,
  highestTier: TheoremTier,
  yearsPlayed: number,
  promotedCount: number,
  finalReputation: number
): number {
  return (
    theoremsProved * 0.5 +
    highestTier * 2 +
    yearsPlayed * 1 +
    promotedCount * 2 +
    finalReputation / 100
  );
}

// --- Random Name Generation ---

export function generateStudentName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

// --- Time Conversion ---

export const SECONDS_PER_GAME_YEAR = 60; // 60 seconds = 1 game year
export const SECONDS_PER_GAME_MONTH = SECONDS_PER_GAME_YEAR / 12; // ~5 seconds per month

export function secondsToMonths(seconds: number): number {
  return seconds / SECONDS_PER_GAME_MONTH;
}

export function monthsToSeconds(months: number): number {
  return months * SECONDS_PER_GAME_MONTH;
}

export function getRankColor(rank: string): string {
  if (rank === 'professor') return '#f59e0b';
  if (rank === 'associate') return '#c084fc';
  if (rank === 'assistant') return '#537895';
  return '#2a2a4a';
}
