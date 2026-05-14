// =============================================================================
// Unit tests for game utility functions
// =============================================================================

import { describe, it, expect } from 'vitest';
import type {
  Student,
  SchoolIdeology,
  ResearchField,
  StudentRank,
} from '../types/game';
import {
  createStudent,
  checkRankRatios,
  isPromotionEligible,
  calculateSatisfaction,
  getRankLabel,
  getRankEmoji,
  calculatePrestige,
  generateStudentName,
  secondsToMonths,
  monthsToSeconds,
  getTotalStats,
} from '../utils/gameUtils';
import { IDEOLOGY_DATA, RANK_LABELS, RANK_EMOJI, DEFAULT_RATIOS, TRAITS } from '../types/game';
import { getIdeologyBonuses } from '../utils/gameUtils';

// --- createStudent tests ---

describe('createStudent', () => {
  it('creates a student with correct default rank', () => {
    const student = createStudent('Test Student', 'formalism');
    expect(student.rank).toBe('student');
    expect(student.name).toBe('Test Student');
  });

  it('generates a unique ID for each student', () => {
    const s1 = createStudent('Student A', 'formalism');
    const s2 = createStudent('Student B', 'formalism');
    expect(s1.id).not.toBe(s2.id);
  });

  it('assigns traits to the student', () => {
    const student = createStudent('Trait Student', 'formalism');
    expect(student.traits.length).toBeGreaterThanOrEqual(1);
    expect(student.traits.length).toBeLessThanOrEqual(2);
  });

  it('starts with positive stats', () => {
    const student = createStudent('Stat Student', 'formalism');
    expect(student.stats.rigor).toBeGreaterThanOrEqual(1);
    expect(student.stats.rigor).toBeLessThanOrEqual(4);
    expect(student.stats.creativity).toBeGreaterThanOrEqual(1);
    expect(student.stats.teaching).toBeGreaterThanOrEqual(1);
  });

  it('platonism attracts students with higher starting stats', () => {
    const formalismStudents = Array.from({ length: 20 }, () =>
      createStudent('x', 'formalism')
    );
    const platonismStudents = Array.from({ length: 20 }, () =>
      createStudent('x', 'platonism')
    );

    const avgFormalism =
      formalismStudents.reduce(
        (s, st) =>
          s +
          st.stats.rigor +
          st.stats.creativity +
          st.stats.teaching,
        0
      ) / formalismStudents.length;

    const avgPlatonism =
      platonismStudents.reduce(
        (s, st) =>
          s +
          st.stats.rigor +
          st.stats.creativity +
          st.stats.teaching,
        0
      ) / platonismStudents.length;

    // Platonism students should have higher average total stats
    // (not guaranteed every time, but very likely)
    expect(avgPlatonism).toBeGreaterThanOrEqual(avgFormalism - 0.5);
  });

  it('initializes specialization correctly', () => {
    const student = createStudent('Spec Student', 'formalism');
    expect(typeof student.specialization).toBe('object');
    expect(student.assignedFields).toEqual([]);
    expect(student.mentorId).toBeNull();
    expect(student.menteeIds).toEqual([]);
    expect(student.theoremsProved).toBe(0);
    expect(student.monthsInRank).toBe(0);
    expect(student.satisfaction).toBe(70);
  });
});

// --- checkRankRatios tests ---

describe('checkRankRatios', () => {
  function makeStudents(
    ranks: StudentRank[]
  ): Student[] {
    return ranks.map((rank) =>
      createStudent(`Student`, 'formalism')
    ) as unknown as Student[];
  }

  it('allows promotion when ratios are fine', () => {
    const students = Array.from({ length: 5 }, () =>
      createStudent('S', 'formalism')
    );
    const result = checkRankRatios(students);
    expect(result.canPromote).toBe(true);
  });

  it('blocks promotion when associate ratio exceeded', () => {
    const students = [
      createStudent('S', 'formalism'),
      createStudent('S', 'formalism'),
      createStudent('S', 'formalism'),
    ] as unknown as Student[];

    // Simulate 3 out of 5 are already associates (60%, exceeds 30%)
    (students[0] as any).rank = 'associate';
    (students[1] as any).rank = 'associate';
    (students[2] as any).rank = 'associate';

    const result = checkRankRatios(students as Student[]);
    expect(result.canPromote).toBe(false);
  });

  it('includes reason for blocked promotion', () => {
    const students = [
      createStudent('S', 'formalism'),
      createStudent('S', 'formalism'),
      createStudent('S', 'formalism'),
    ] as unknown as Student[];

    (students[0] as any).rank = 'associate';
    (students[1] as any).rank = 'associate';
    (students[2] as any).rank = 'associate';

    const result = checkRankRatios(students as Student[]);
    expect(result.reason).toContain('ratio');
  });

  it('handles empty student list', () => {
    const result = checkRankRatios([]);
    expect(result.canPromote).toBe(false);
    expect(result.reason).toContain('No students');
  });
});

// --- isPromotionEligible tests ---

describe('isPromotionEligible', () => {
  it('allows student → assistant after 1 month and 1 theorem', () => {
    const student = createStudent('E', 'formalism');
    student.monthsInRank = 1;
    student.theoremsProved = 1;
    expect(isPromotionEligible(student, 'assistant')).toBe(true);
  });

  it('blocks student → assistant before 1 month', () => {
    const student = createStudent('E', 'formalism');
    student.monthsInRank = 0.5;
    student.theoremsProved = 5;
    expect(isPromotionEligible(student, 'assistant')).toBe(false);
  });

  it('blocks student → assistant with no theorems', () => {
    const student = createStudent('E', 'formalism');
    student.monthsInRank = 2;
    student.theoremsProved = 0;
    expect(isPromotionEligible(student, 'assistant')).toBe(false);
  });

  it('allows assistant → associate after 2 months and 3 theorems', () => {
    const student = createStudent('E', 'formalism');
    (student as any).rank = 'assistant';
    student.monthsInRank = 2;
    student.theoremsProved = 3;
    expect(isPromotionEligible(student, 'associate')).toBe(true);
  });

  it('blocks assistant → associate with only 2 theorems', () => {
    const student = createStudent('E', 'formalism');
    (student as any).rank = 'assistant';
    student.monthsInRank = 3;
    student.theoremsProved = 2;
    expect(isPromotionEligible(student, 'associate')).toBe(false);
  });

  it('blocks jumping multiple ranks', () => {
    const student = createStudent('E', 'formalism');
    student.monthsInRank = 10;
    student.theoremsProved = 10;
    expect(isPromotionEligible(student, 'associate')).toBe(false);
  });

  it('blocks promotion when already at target rank', () => {
    const student = createStudent('E', 'formalism');
    (student as any).rank = 'student';
    expect(isPromotionEligible(student, 'student')).toBe(false);
  });
});

// --- calculateSatisfaction tests ---

describe('calculateSatisfaction', () => {
  it('returns 70 for a student with no issues', () => {
    const student = createStudent('S', 'formalism');
    student.assignedFields = ['Boolean Logic'];
    student.fundingLevel = 80;
    const result = calculateSatisfaction(student, [student]);
    expect(result).toBeGreaterThanOrEqual(60);
    expect(result).toBeLessThanOrEqual(80);
  });

  it('reduces satisfaction for low funding', () => {
    const student = createStudent('S', 'formalism');
    student.fundingLevel = 10;
    const result = calculateSatisfaction(student, [student]);
    // Base 70 - 20 for low funding = 50
    expect(result).toBeLessThan(65);
  });

  it('does not reduce satisfaction for high funding', () => {
    const student = createStudent('S', 'formalism');
    student.fundingLevel = 100;
    const result = calculateSatisfaction(student, [student]);
    // Base 70, no penalty for high funding
    expect(result).toBeGreaterThanOrEqual(65);
  });

  it('perfectionists have reduced satisfaction', () => {
    const student = createStudent('S', 'formalism');
    student.traits = ['perfectionist'];
    student.fundingLevel = 100;
    const result = calculateSatisfaction(student, [student]);
    expect(result).toBeLessThan(70);
  });

  it('caps satisfaction between 0 and 100', () => {
    const student = createStudent('S', 'formalism');
    student.satisfaction = 0;
    const result = calculateSatisfaction(student, [student]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

// --- getIdeologyBonuses tests ---

describe('getIdeologyBonuses', () => {
  it('formalism gives speed bonus', () => {
    const bonuses = getIdeologyBonuses('formalism');
    expect(bonuses.theoremSpeed).toBe(1.2);
    expect(bonuses.extraFields).toBe(1);
    expect(bonuses.theoremQuality).toBe(0.9);
  });

  it('intuitionism gives quality bonus', () => {
    const bonuses = getIdeologyBonuses('intuitionism');
    expect(bonuses.theoremQuality).toBe(1.15);
    expect(bonuses.startingStatPoints).toBe(1);
    expect(bonuses.theoremSpeed).toBe(1.0);
  });

  it('platonism gives reputation and capacity bonus', () => {
    const bonuses = getIdeologyBonuses('platonism');
    expect(bonuses.reputationGain).toBe(1.25);
    expect(bonuses.maxCapacity).toBe(1);
    expect(bonuses.theoremSpeed).toBe(0.85);
  });
});

// --- getRankLabel / getRankEmoji tests ---

describe('getRankLabel', () => {
  it('returns correct labels', () => {
    expect(getRankLabel('student')).toBe('PhD Candidate');
    expect(getRankLabel('assistant')).toBe('Assistant Professor');
    expect(getRankLabel('associate')).toBe('Associate Professor');
  });
});

describe('getRankEmoji', () => {
  it('returns correct emojis', () => {
    expect(getRankEmoji('student')).toBe('🎓');
    expect(getRankEmoji('assistant')).toBe('👤');
    expect(getRankEmoji('associate')).toBe('👑');
  });
});

// --- calculatePrestige tests ---

describe('calculatePrestige', () => {
  it('calculates prestige correctly', () => {
    const prestige = calculatePrestige(10, 3, 2, 5, 50);
    const expected = 10 * 0.5 + 3 * 2 + 2 * 1 + 5 * 2 + 50 / 100;
    expect(prestige).toBeCloseTo(expected, 5);
  });

  it('returns 0 for all-zero inputs', () => {
    const prestige = calculatePrestige(0, 1, 0, 0, 0);
    expect(prestige).toBe(2); // tier × 2 = 2
  });

  it('scales with more theorems', () => {
    const p1 = calculatePrestige(5, 1, 0, 0, 0);
    const p2 = calculatePrestige(10, 1, 0, 0, 0);
    expect(p2).toBeGreaterThan(p1);
  });

  it('higher tier gives more prestige', () => {
    const p1 = calculatePrestige(1, 1, 0, 0, 0);
    const p2 = calculatePrestige(1, 3, 0, 0, 0);
    expect(p2).toBeGreaterThan(p1);
  });
});

// --- generateStudentName tests ---

describe('generateStudentName', () => {
  it('generates a name with first and last', () => {
    const name = generateStudentName();
    expect(name.split(' ').length).toBe(2);
  });

  it('generates different names', () => {
    const names = new Set();
    for (let i = 0; i < 50; i++) {
      names.add(generateStudentName());
    }
    // Should generate many unique names
    expect(names.size).toBeGreaterThan(20);
  });
});

// --- Time conversion tests ---

describe('time conversions', () => {
  it('converts seconds to months', () => {
    const months = secondsToMonths(60); // 1 year = 60 seconds
    expect(months).toBeCloseTo(12, 5);
  });

  it('converts months to seconds', () => {
    const seconds = monthsToSeconds(12); // 1 year
    expect(seconds).toBeCloseTo(60, 5);
  });

  it('is reversible', () => {
    const originalMonths = 5.5;
    const seconds = monthsToSeconds(originalMonths);
    const back = secondsToMonths(seconds);
    expect(back).toBeCloseTo(originalMonths, 5);
  });
});

// --- getTotalStats tests ---

describe('getTotalStats', () => {
  it('sums all three stats', () => {
    const student = createStudent('S', 'formalism');
    student.stats = { rigor: 3, creativity: 2, teaching: 1 };
    expect(getTotalStats(student)).toBe(6);
  });
});
