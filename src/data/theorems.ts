// =============================================================================
// Theorem data: fictional plausible names for Tiers 1-4, real names for Tier 5
// =============================================================================

import type { Theorem, ResearchField } from '../types/game';

const FIELDS: ResearchField[] = [
  'Boolean Logic',
  'Number Theory',
  'Set Theory',
  'Category Theory',
  'Proof Theory',
  'Computability Theory',
  'Model Theory',
  'Combinatorics',
];

function fieldForTier(tier: number): ResearchField {
  // Higher tier = more specialized fields available
  const available = FIELDS.slice(0, tier === 1 ? 3 : tier === 2 ? 5 : tier === 3 ? 7 : FIELDS.length);
  return available[Math.floor(Math.random() * available.length)];
}

function multiFieldForTier(tier: number): ResearchField[] {
  const count = tier === 1 ? 1 : tier === 2 ? 1 : tier === 3 ? 2 : 2;
  const available = FIELDS.slice(0, tier === 1 ? 3 : tier === 2 ? 5 : tier === 3 ? 7 : FIELDS.length);
  const result: ResearchField[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * available.length);
    } while (used.has(idx) && used.size < available.length);
    used.add(idx);
    result.push(available[idx]);
  }
  return result;
}

// Tier 1: Basic theorems
const TIER_1_THEOREMS: Omit<Theorem, 'id'>[] = [
  { name: 'The Lemma of Minimal Fixed Points', description: 'Every continuous function on a compact convex set has at least one fixed point.', tier: 1, fields: ['Boolean Logic'], baseTime: 10, theoremValue: 1, moneyValue: 5, reputationValue: 2 },
  { name: 'Pigeon Principle Generalized', description: 'A generalization of the classical pigeonhole principle to infinite sets.', tier: 1, fields: ['Number Theory'], baseTime: 8, theoremValue: 1, moneyValue: 4, reputationValue: 1 },
  { name: 'The Induction Closure Lemma', description: 'Any set closed under the natural operations contains all inductively defined elements.', tier: 1, fields: ['Proof Theory'], baseTime: 12, theoremValue: 1, moneyValue: 6, reputationValue: 3 },
  { name: 'On the Existence of trivial Solutions', description: 'A note on when trivial solutions exist and when they do not.', tier: 1, fields: ['Boolean Logic'], baseTime: 6, theoremValue: 1, moneyValue: 3, reputationValue: 1 },
  { name: 'The Monotonicity Lemma', description: 'Monotone functions preserve ordering in the relevant structures.', tier: 1, fields: ['Number Theory'], baseTime: 10, theoremValue: 1, moneyValue: 5, reputationValue: 2 },
  { name: 'A Decomposition Result for Simple Structures', description: 'Every simple structure admits a canonical decomposition.', tier: 1, fields: ['Proof Theory'], baseTime: 14, theoremValue: 2, moneyValue: 8, reputationValue: 3 },
  { name: 'The Bounded Embedding Lemma', description: 'Bounded structures can be embedded into larger ones while preserving key properties.', tier: 1, fields: ['Boolean Logic'], baseTime: 11, theoremValue: 1, moneyValue: 5, reputationValue: 2 },
  { name: 'On the Convergence of Iterative Refinements', description: 'Under mild conditions, iterative refinement processes converge.', tier: 1, fields: ['Proof Theory'], baseTime: 9, theoremValue: 1, moneyValue: 4, reputationValue: 2 },
];

// Tier 2: Intermediate theorems
const TIER_2_THEOREMS: Omit<Theorem, 'id'>[] = [
  { name: 'The Bounded Embedding Theorem', description: 'Every bounded structure admits a canonical embedding into a universal model.', tier: 2, fields: ['Set Theory'], baseTime: 30, theoremValue: 3, moneyValue: 15, reputationValue: 8 },
  { name: 'Dual Decomposition Lemma', description: 'Dual structures admit a decomposition matching the primal decomposition.', tier: 2, fields: ['Category Theory'], baseTime: 28, theoremValue: 3, moneyValue: 14, reputationValue: 7 },
  { name: 'The Stabilization Result for Iterative Systems', description: 'Iterative refinement systems stabilize after a bounded number of steps.', tier: 2, fields: ['Proof Theory'], baseTime: 35, theoremValue: 4, moneyValue: 18, reputationValue: 10 },
  { name: 'On the Completeness of Weak Arithmetic', description: 'A completeness result for arithmetic systems weaker than Peano arithmetic.', tier: 2, fields: ['Number Theory'], baseTime: 32, theoremValue: 3, moneyValue: 16, reputationValue: 9 },
  { name: 'The Density Theorem for Ordered Structures', description: 'Ordered structures are dense in their completion under natural metrics.', tier: 2, fields: ['Set Theory'], baseTime: 25, theoremValue: 3, moneyValue: 14, reputationValue: 7 },
  { name: 'A Characterization of Canonical Proofs', description: 'We give a structural characterization of proofs that are canonical in nature.', tier: 2, fields: ['Proof Theory'], baseTime: 40, theoremValue: 5, moneyValue: 20, reputationValue: 12 },
  { name: 'The Transfer Principle Generalized', description: 'A generalized transfer principle for a broad class of non-standard models.', tier: 2, fields: ['Model Theory'], baseTime: 38, theoremValue: 4, moneyValue: 18, reputationValue: 10 },
  { name: 'On the Computability of Proof Search', description: 'We analyze the computability boundaries of automated proof search.', tier: 2, fields: ['Computability Theory'], baseTime: 45, theoremValue: 5, moneyValue: 22, reputationValue: 14 },
];

// Tier 3: Advanced theorems
const TIER_3_THEOREMS: Omit<Theorem, 'id'>[] = [
  { name: 'The Recursive Consistency Result', description: 'A consistency proof for a recursive fragment of set theory.', tier: 3, fields: ['Set Theory', 'Proof Theory'], baseTime: 90, theoremValue: 10, moneyValue: 50, reputationValue: 30 },
  { name: 'Transfinite Induction Extension', description: 'Transfinite induction can be extended to certain non-well-founded structures.', tier: 3, fields: ['Set Theory', 'Number Theory'], baseTime: 85, theoremValue: 10, moneyValue: 48, reputationValue: 28 },
  { name: 'The Category Adjunction Characterization', description: 'We characterize which adjunctions arise from categorical limits.', tier: 3, fields: ['Category Theory'], baseTime: 100, theoremValue: 12, moneyValue: 55, reputationValue: 35 },
  { name: 'A Note on the Unprovability of Certain Transfinite Claims', description: 'We establish unprovability results for a class of transfinite statements.', tier: 3, fields: ['Proof Theory'], baseTime: 95, theoremValue: 11, moneyValue: 52, reputationValue: 32 },
  { name: 'The Model-Theoretic Completeness Generalization', description: 'Completeness theorems extend to a broad class of generalized models.', tier: 3, fields: ['Model Theory', 'Set Theory'], baseTime: 110, theoremValue: 13, moneyValue: 60, reputationValue: 40 },
  { name: 'On the Structure of Proof Trees in Weak Systems', description: 'We analyze the structural properties of proof trees in weakened axiom systems.', tier: 3, fields: ['Proof Theory', 'Boolean Logic'], baseTime: 80, theoremValue: 9, moneyValue: 45, reputationValue: 25 },
  { name: 'The Combinatorial Fixed Point Theorem', description: 'A combinatorial fixed point result with applications to game theory.', tier: 3, fields: ['Combinatorics', 'Number Theory'], baseTime: 105, theoremValue: 12, moneyValue: 55, reputationValue: 35 },
  { name: 'Decidability Boundaries for First-Order Fragments', description: 'We map the decidability boundaries for fragments of first-order logic.', tier: 3, fields: ['Computability Theory', 'Boolean Logic'], baseTime: 120, theoremValue: 14, moneyValue: 65, reputationValue: 42 },
];

// Tier 4: Expert theorems
const TIER_4_THEOREMS: Omit<Theorem, 'id'>[] = [
  { name: 'The Unified Completeness Result', description: 'A single completeness theorem unifying multiple previous results across logic systems.', tier: 4, fields: ['Proof Theory', 'Model Theory'], baseTime: 180, theoremValue: 25, moneyValue: 120, reputationValue: 70 },
  { name: 'On the Independence of the Continuum Hypothesis Generalizations', description: 'We generalize Cohen\'s method to show independence results for broad classes of hypotheses.', tier: 4, fields: ['Set Theory'], baseTime: 200, theoremValue: 30, moneyValue: 140, reputationValue: 85 },
  { name: 'The Classification Theorem for Elementary Classes', description: 'A full classification of elementary classes up to elementary equivalence.', tier: 4, fields: ['Model Theory'], baseTime: 220, theoremValue: 35, moneyValue: 160, reputationValue: 95 },
  { name: 'A Structural Theory of Proof Complexity', description: 'We develop a structural theory explaining the complexity landscape of proof systems.', tier: 4, fields: ['Proof Theory', 'Computability Theory'], baseTime: 250, theoremValue: 40, moneyValue: 180, reputationValue: 110 },
  { name: 'The Functorial Representation Theorem', description: 'Every category admits a faithful functorial representation in a canonical setting.', tier: 4, fields: ['Category Theory', 'Set Theory'], baseTime: 240, theoremValue: 38, moneyValue: 170, reputationValue: 105 },
  { name: 'On the Computational Limits of Automated Reasoning', description: 'We establish fundamental computational limits for any automated reasoning system.', tier: 4, fields: ['Computability Theory'], baseTime: 210, theoremValue: 32, moneyValue: 150, reputationValue: 90 },
  { name: 'The Transfinite Recursion Theorem for Non-Well-Founded Structures', description: 'Recursion principles extend beyond well-founded structures to certain non-well-founded domains.', tier: 4, fields: ['Set Theory', 'Combinatorics'], baseTime: 230, theoremValue: 36, moneyValue: 165, reputationValue: 100 },
  { name: 'A New Approach to the Consistency of Arithmetic', description: 'A novel method for establishing consistency results in arithmetic.', tier: 4, fields: ['Proof Theory', 'Number Theory'], baseTime: 260, theoremValue: 42, moneyValue: 190, reputationValue: 120 },
];

// Tier 5: Millennium Problems (real names, real stakes)
const TIER_5_THEOREMS: Omit<Theorem, 'id'>[] = [
  { name: 'P ≠ NP', description: 'Every problem whose solution can be quickly verified can also be quickly solved.', tier: 5, fields: ['Computability Theory'], baseTime: 3600, theoremValue: 1000, moneyValue: 5000, reputationValue: 1000 },
  { name: 'The Riemann Hypothesis', description: 'All non-trivial zeros of the zeta function lie on the critical line.', tier: 5, fields: ['Number Theory'], baseTime: 3600, theoremValue: 1000, moneyValue: 5000, reputationValue: 1000 },
  { name: 'Navier-Stokes Existence and Smoothness', description: 'Smooth solutions exist for the Navier-Stokes equations in three dimensions.', tier: 5, fields: ['Number Theory'], baseTime: 3600, theoremValue: 1000, moneyValue: 5000, reputationValue: 1000 },
  { name: 'The Hodge Conjecture', description: 'Topological cycles on projective varieties are algebraic.', tier: 5, fields: ['Combinatorics'], baseTime: 3600, theoremValue: 1000, moneyValue: 5000, reputationValue: 1000 },
  { name: 'The Poincaré Conjecture', description: 'Every simply connected, closed 3-manifold is homeomorphic to the 3-sphere.', tier: 5, fields: ['Set Theory'], baseTime: 3600, theoremValue: 1000, moneyValue: 5000, reputationValue: 1000 },
  { name: 'The Yang-Mills Mass Gap', description: 'Quantum Yang-Mills theory exists and has a mass gap in four dimensions.', tier: 5, fields: ['Boolean Logic'], baseTime: 3600, theoremValue: 1000, moneyValue: 5000, reputationValue: 1000 },
  { name: 'The Birch and Swinnerton-Dyer Conjecture', description: 'The rank of an elliptic curve is related to the order of zero of its L-function.', tier: 5, fields: ['Number Theory'], baseTime: 3600, theoremValue: 1000, moneyValue: 5000, reputationValue: 1000 },
];

export const ALL_THEOREMS: Theorem[] = [
  ...TIER_1_THEOREMS.map((t, i) => ({ ...t, id: `t1_${i}` })),
  ...TIER_2_THEOREMS.map((t, i) => ({ ...t, id: `t2_${i}` })),
  ...TIER_3_THEOREMS.map((t, i) => ({ ...t, id: `t3_${i}` })),
  ...TIER_4_THEOREMS.map((t, i) => ({ ...t, id: `t4_${i}` })),
  ...TIER_5_THEOREMS.map((t, i) => ({ ...t, id: `t5_${i}` })),
];

export function getAvailableTheorems(provedIds: Set<string>, ideology: string): Theorem[] {
  const available = ALL_THEOREMS.filter((t) => !provedIds.has(t.id));
  
  // Intuitionism: cannot prove excluded-middle-based theorems
  // For now, we restrict Tier 3+ Set Theory theorems for intuitionists
  if (ideology === 'intuitionism') {
    return available.filter((t) => !(t.tier >= 3 && t.fields.includes('Set Theory')));
  }
  
  return available;
}

export function getNextTheorem(
  provedIds: Set<string>,
  ideology: string,
  assignedFields: Set<ResearchField>
): Theorem | null {
  const available = getAvailableTheorems(provedIds, ideology).filter((t) =>
    t.fields.some((f) => assignedFields.has(f))
  );
  
  if (available.length === 0) return null;
  
  // Sort by tier (prefer lower tiers first), then by baseTime (prefer faster)
  available.sort((a, b) => a.baseTime - b.baseTime || a.tier - b.tier);
  return available[0];
}

export function generateTheoremPool(): Set<string> {
  return new Set(ALL_THEOREMS.map((t) => t.id));
}
