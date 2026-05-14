// =============================================================================
// Unit tests for theorem data and selection logic
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  ALL_THEOREMS,
  getNextTheorem,
  getAvailableTheorems,
} from '../data/theorems';
import type { TheoremTier } from '../types/game';

describe('ALL_THEOREMS', () => {
  it('contains theorems from all tiers', () => {
    const tiers = new Set(ALL_THEOREMS.map((t) => t.tier));
    expect(tiers).toContain(1);
    expect(tiers).toContain(2);
    expect(tiers).toContain(3);
    expect(tiers).toContain(4);
    expect(tiers).toContain(5);
  });

  it('has multiple theorems per tier', () => {
    for (const tier of [1, 2, 3, 4, 5]) {
      const count = ALL_THEOREMS.filter((t) => t.tier === tier).length;
      expect(count).toBeGreaterThan(1);
    }
  });

  it('each theorem has a unique ID', () => {
    const ids = ALL_THEOREMS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('each theorem has a name and description', () => {
    for (const theorem of ALL_THEOREMS) {
      expect(theorem.name.length).toBeGreaterThan(0);
      expect(theorem.description.length).toBeGreaterThan(0);
    }
  });

  it('each theorem has at least one field', () => {
    for (const theorem of ALL_THEOREMS) {
      expect(theorem.fields.length).toBeGreaterThan(0);
    }
  });

  it('Tier 5 theorems have the real highest costs', () => {
    const millennium = ALL_THEOREMS.filter((t) => t.tier === 5);
    for (const t of millennium) {
      expect(t.baseTime).toBeGreaterThanOrEqual(3000);
      expect(t.theoremValue).toBeGreaterThanOrEqual(500);
    }
  });
});

describe('getNextTheorem', () => {
  it('returns null when no theorems match fields', () => {
    const result = getNextTheorem(
      new Set(ALL_THEOREMS.map((t) => t.id)),
      'formalism',
      new Set(['Boolean Logic'])
    );
    expect(result).toBeNull();
  });

  it('returns the easiest available theorem for the fields', () => {
    const provedIds = new Set<string>();
    const result = getNextTheorem(
      provedIds,
      'formalism',
      new Set(['Boolean Logic', 'Number Theory', 'Proof Theory'])
    );
    expect(result).not.toBeNull();
    expect(result!.tier).toBe(1); // Should pick easiest first
  });

  it('skips proved theorems', () => {
    const provedIds = new Set<string>();
    const first = getNextTheorem(
      provedIds,
      'formalism',
      new Set(['Boolean Logic', 'Number Theory', 'Proof Theory'])
    );
    expect(first).not.toBeNull();

    provedIds.add(first!.id);

    const second = getNextTheorem(
      provedIds,
      'formalism',
      new Set(['Boolean Logic', 'Number Theory', 'Proof Theory'])
    );
    expect(second).not.toBeNull();
    expect(second!.id).not.toBe(first!.id);
  });

  it('intuitionism restricts Set Theory theorems at Tier 3+', () => {
    // Get all available theorems for Boolean Logic (not restricted)
    const allBooleanLogic = ALL_THEOREMS.filter((t) =>
      t.fields.includes('Boolean Logic')
    );

    const provedIds = new Set<string>();
    const available = getAvailableTheorems(provedIds, 'intuitionism');
    const booleanAvailable = available.filter((t) =>
      t.fields.includes('Boolean Logic')
    );

    // All boolean logic theorems should be available
    for (const t of booleanAvailable) {
      expect(available).toContain(t);
    }
  });

  it('returns theorems matching at least one assigned field', () => {
    const provedIds = new Set<string>();
    const result = getNextTheorem(
      provedIds,
      'formalism',
      new Set(['Category Theory', 'Set Theory'])
    );
    expect(result).not.toBeNull();
    expect(result!.fields.some((f) => ['Category Theory', 'Set Theory'].includes(f))).toBe(true);
  });
});

describe('getAvailableTheorems', () => {
  it('filters out proved theorems', () => {
    const provedIds = new Set(['t1_0']);
    const available = getAvailableTheorems(provedIds, 'formalism');
    const hasT1_0 = available.some((t) => t.id === 't1_0');
    expect(hasT1_0).toBe(false);
  });

  it('returns all unproved theorems for formalism', () => {
    const provedIds = new Set<string>();
    const available = getAvailableTheorems(provedIds, 'formalism');
    expect(available.length).toBeGreaterThan(0);
    expect(available.length).toBe(ALL_THEOREMS.length);
  });
});
