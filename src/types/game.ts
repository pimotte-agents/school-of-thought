// =============================================================================
// Core game types for School of Thought
// =============================================================================

// --- Research Fields ---

export type ResearchField =
  | 'Boolean Logic'
  | 'Number Theory'
  | 'Set Theory'
  | 'Category Theory'
  | 'Proof Theory'
  | 'Computability Theory'
  | 'Model Theory'
  | 'Combinatorics';

export const ALL_FIELDS: ResearchField[] = [
  'Boolean Logic',
  'Number Theory',
  'Set Theory',
  'Category Theory',
  'Proof Theory',
  'Computability Theory',
  'Model Theory',
  'Combinatorics',
];

export const INITIAL_UNLOCKED_FIELDS: ResearchField[] = [
  'Boolean Logic',
  'Number Theory',
  'Proof Theory',
];

// --- Student Ranks ---

export type StudentRank = 'student' | 'assistant' | 'associate' | 'professor';

export const RANK_LABELS: Record<StudentRank, string> = {
  student: 'PhD Candidate',
  assistant: 'Assistant Professor',
  associate: 'Associate Professor',
  professor: 'Full Professor',
};

export const RANK_EMOJI: Record<StudentRank, string> = {
  student: '🎓',
  assistant: '👤',
  associate: '👑',
  professor: '🏛️',
};

// --- Student ---

export type TraitId =
  | 'perfectionist'
  | 'eccentric'
  | 'team_player'
  | 'prodigy'
  | 'diplomat'
  | 'maverick';

export interface Trait {
  id: TraitId;
  name: string;
  description: string;
  statMod: { rigor: number; creativity: number; teaching: number };
}

export const TRAITS: Record<TraitId, Trait> = {
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Rigor +2, speed −20%',
    statMod: { rigor: 2, creativity: 0, teaching: 0 },
  },
  eccentric: {
    id: 'eccentric',
    name: 'Eccentric',
    description: 'Creativity +2, occasionally distracted',
    statMod: { rigor: 0, creativity: 2, teaching: 0 },
  },
  team_player: {
    id: 'team_player',
    name: 'Team Player',
    description: 'Teaching +1, mentees get +10%',
    statMod: { rigor: 0, creativity: 0, teaching: 1 },
  },
  prodigy: {
    id: 'prodigy',
    name: 'Prodigy',
    description: 'All stats +1, ages faster',
    statMod: { rigor: 1, creativity: 1, teaching: 1 },
  },
  diplomat: {
    id: 'diplomat',
    name: 'Diplomat',
    description: 'Harder to poach, better at negotiation',
    statMod: { rigor: 0, creativity: 0, teaching: 0 },
  },
  maverick: {
    id: 'maverick',
    name: 'Maverick',
    description: 'Creativity +1, dislikes being micromanaged',
    statMod: { rigor: -1, creativity: 1, teaching: 0 },
  },
};

export interface Student {
  id: string;
  name: string;
  rank: StudentRank;
  stats: { rigor: number; creativity: number; teaching: number };
  baseStats: { rigor: number; creativity: number; teaching: number }; // original, before trait mods
  traits: TraitId[];
  specialization: Record<ResearchField, number>;
  assignedFields: ResearchField[];
  mentorId: string | null;
  menteeIds: string[];
  theoremsProved: number;
  monthsInRank: number;
  satisfaction: number; // 0-100, affects retention
  joinedDate: number; // game time in months
  lastActiveQuote: string | null;
  lastQuoteDate: number; // game time in months
}

// --- Theorems ---

export type TheoremTier = 1 | 2 | 3 | 4 | 5;

export interface Theorem {
  id: string;
  name: string;
  description: string;
  tier: TheoremTier;
  fields: ResearchField[];
  baseTime: number; // seconds
  theoremValue: number; // theorems earned
  moneyValue: number;
  reputationValue: number;
}

// --- Resources ---

export interface Resources {
  theorems: number;
  money: number;
  reputation: number;
  prestige: number;
}

// --- School State ---

export interface SchoolConfig {
  maxCapacity: number;
  prestigeBuffs: PrestigeBuffState[];
}

export interface PrestigeBuffState {
  upgradeId: string;
  count: number; // how many times purchased (for stacking)
}

export interface SchoolState {
  generation: number;
  resources: Resources;
  config: SchoolConfig;
  students: Student[];
  currentTheorems: CompletedTheorem[];
  activeTheorems: ActiveTheorem[];
  theoremPool: Theorem[];
  eventLog: EventEntry[];
  gameSpeed: number; // 0 = paused, 1 = normal, 5 = fast
  totalMonthsPlayed: number;
}

export interface CompletedTheorem {
  id: string;
  theorem: Theorem;
  completedDate: number; // game time in months
  provedBy: string[]; // student IDs
}

export interface ActiveTheorem {
  id: string;
  theorem: Theorem;
  progress: number; // 0-100
  assignedStudents: string[]; // student IDs
  fundingPercentage: number;
  startDate: number; // game time in months
}

export interface EventEntry {
  id: string;
  type: 'quote' | 'promotion' | 'hire' | 'departure' | 'theorem' | 'event' | 'retirement';
  message: string;
  timestamp: number; // game time in months
  studentId?: string;
}

// --- Ratio Constraints ---

export interface RankRatios {
  professorMaxPercent: number;   // of total
  associateMaxPercent: number;   // of total
  assistantMaxPercent: number;   // of total
  studentMaxPercent: number;     // of total
}

export const DEFAULT_RATIOS: RankRatios = {
  professorMaxPercent: 0.1,
  associateMaxPercent: 0.3,
  assistantMaxPercent: 0.6,
  studentMaxPercent: 1.0,
};
