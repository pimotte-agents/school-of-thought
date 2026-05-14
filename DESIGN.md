# School of Thought — Game Design Document

> A minimalist grand-strategy idle game about building a mathematical school across generations.

---

## High Concept

You are a professor building a mathematical school. You hire students, promote them through the ranks, assign them to research fields, and fund their work. Theorems prove themselves automatically — your job is managing the *structure* of the school. When you retire, an Associate Professor succeeds you, and you earn **Prestige** to invest in permanent buffs. Your ultimate goal: prove one of the seven Millennium Problems.

**In one sentence:** *Crusader Kings' generational dynasty meets an idle theorem-proving factory, wrapped in a minimalist academic aesthetic.*

---

## Resources

| Resource | Type | Role |
|---|---|---|
| **Formalized Theorems** | Primary currency | The main resource. Unlocked by completing theorems in your assigned fields. Spent on hiring, research, and buffs. |
| **Money** | Supporting currency | Funds operations: hiring, funding research projects, facilities. Earned from theorem publication prestige. |
| **Students** | Population | Workforce. You can only support a limited number based on your school's capacity. |
| **Reputation** | Soft currency | Unlocks new fields, attracts better students. Grows with theorem quality and school prestige. |

---

## Student System

### Stats (Simple)
Each student has 4 stats:

- **Rigor** — Accuracy and precision. Affects theorem quality and speed of formalization.
- **Creativity** — Ability to find novel proof strategies. Increases chance of breakthrough theorems.
- **Teaching** — Mentorship effectiveness. Students with high Teaching boost their mentees' learning speed.
- **Specialization** — A numeric value in each research field (0–10). Determines how fast they work in that field.

### Career Ranks

| Rank | Symbol | Constraints |
|---|---|---|
| **Student (PhD candidate)** | 🎓 | Entry level. Can only prove basic theorems. Assigned to fields by faculty. |
| **Assistant Professor** | 👤 | Requires: ≥ 1 theorem formalized, 1 year minimum, ratio constraint (see below). |
| **Associate Professor** | 👑 | Requires: ≥ 3 theorems formalized, 2 years minimum, ratio constraint. **Only Associate Profs can succeed you.** |

**Ratio Constraint:** The school must maintain a sustainable pyramid:
```
Associate Profs ≤ 30% of total faculty
Assistant Profs ≤ 60% of total faculty
Students ≤ 100% of total faculty
```
*(Percentages are of total people, so if you have 10 people, you can have at most 3 Associate Profs, 6 Assistants, and the rest students.)*

### Personality

Each student has:
- **Traits** (2–3): e.g., `Perfectionist` (rigor +2, speed −20%), `Eccentric` (creativity +2, occasionally distracted), `Team Player` (Teaching +1, mentees get +10%), `Prodigy` (all stats +1, ages faster)
- **Quotes:** Students occasionally say things triggered by events:
  - *"I think there's a way to construct the proof using..."* (after formalizing a theorem)
  - *"The mentor assigned to me has been invaluable..."* (when mentored by someone with high Teaching)
  - *"I've been staring at this lemma for weeks..."* (when stuck on a hard theorem)
  - *"Another year, another proof. When do we get to the interesting stuff?"* (when assigned only to basic theorems)
  - *"Funding got cut from our research group..."* (when money is low)

Quotes appear as floating text or in a log panel. They're flavor — but can hint at mechanical issues (e.g., low funding → slower research).

---

## Time System

- **Real-time.** 1 game year = ~60 seconds (adjustable with pause/speed buttons).
- Students age slowly (optional mechanic — can be toggled off for pure idle).
- Theorems take real time to formalize based on theorem difficulty × student stats.
- Promotions check periodically (every game month).
- Retirement triggers when player clicks "Retire" — not automatic.

---

## Player Actions (Active Management)

The player actively manages:

### 1. **Hire Students**
- Spend Money + Theorems to admit new PhD candidates.
- Better reputation → access to better applicants (higher starting stats).
- Limited by school capacity (starts at 5, grows with reputation).

### 2. **Assign Research Fields**
- Choose which field(s) each student works on.
- A student can work on 1–3 fields simultaneously (weighted).
- Fields available: Boolean Logic, Number Theory, Set Theory, Category Theory, Proof Theory, Computability Theory, Model Theory, Combinatorics.
- New fields unlock via Reputation milestones.

### 3. **Assign Funding**
- Distribute Money among research groups or individual students.
- More funding → faster theorem production.
- Unfunded students work at base speed.
- Can prioritize certain fields (e.g., "pour money into Number Theory").

### 4. **Assign Mentors**
- Pair students with faculty (Assistant or Associate Profs) for mentorship.
- High-Teaching mentors boost mentees' learning speed and stat growth.
- Each mentor can handle 1–3 mentees depending on Teaching stat.

### 5. **Set Promotion Policy**
- Toggle auto-promotion on/off.
- When on, students meeting criteria (time + theorems + ratio) are automatically promoted.
- Can manually override.

### 6. **Retire**
- Click to retire when at least one Associate Professor exists.
- One Associate Prof succeeds you (chosen by you or randomly weighted by stats).
- Earn **Prestige** based on school performance.
- Start a new generation.

---

## School of Thought (Ideology)

At game start, pick a philosophy. It defines your school's identity and provides mechanical trade-offs.

### Formalism
> *"Mathematics is a game of symbol manipulation. If we can prove it, it's true."*

- **+20%** theorem formalization speed
- **+1** slot for concurrent research fields per student
- **−10%** theorem quality (theorems earn slightly less money/reputation)
- **Unlocks:** Automated proof-checking (a passive bonus that reduces errors)

### Intuitionism / Constructivism
> *"A theorem exists only if we can construct it."*

- **+15%** theorem quality
- **+1** starting stat point for all students (distributed by player)
- **Cannot** prove certain theorem types (excluded-middle-based theorems are unavailable)
- **Unlocks:** Intuitionistic lemmas (alternative theorem paths that are easier but less prestigious)

### Platonism
> *"Mathematical objects exist independently. We discover them."*

- **+25%** reputation gain
- **+1** to max school capacity
- Attracts better students (higher average starting stats)
- **−15%** theorem production speed
- **Unlocks:** "Inspiration" events (random stat boosts to creative students)

---

## Theorem System

The proof process is visualized with a **progress bar**. No complex proof tree visualization needed for the prototype.

### Theorem Tiers

| Tier | Name Examples | Difficulty | Formalization Time (base) | Theorem Value |
|---|---|---|---|---|
| 1 (Basic) | *The Lemma of Minimal Fixed Points*, *Pigeon Principle Generalized* | Easy | 10s | Low |
| 2 (Intermediate) | *The Bounded Embedding Theorem*, *Dual Decomposition Lemma* | Medium | 30s | Medium |
| 3 (Advanced) | *The Recursive Consistency Result*, *Transfinite Induction Extension* | Hard | 90s | High |
| 4 (Expert) | *The Category Adjunction Characterization*, *Model-Theoretic Completeness Generalization* | Very Hard | 180s | Very High |
| 5 (Millennium) | **P ≠ NP**, **Riemann Hypothesis**, **Navier-Stokes Existence**, etc. | Impossible (for normal play) | 3600s+ | Victory |

### Theorem Names
- **Fictional theorems** (Tiers 1–4) have plausible academic names:
  - *The Stabilization Lemma for Iterative Refinement*
  - *On the Existence of Canonical Proofs in Weak Arithmetic*
  - *The Density Theorem for Ordered Type Structures*
  - *A Note on the Unprovability of Certain Transfinite Claims*
- **Millennium Problems** (Tier 5) use real names.
- Each theorem has a brief description (1–2 lines) in the UI.

### Theorem Production
- Theorems prove themselves automatically. The faculty (not students directly) work through a pipeline:
  1. **Selection** — faculty pick theorems from the available pool (based on field + difficulty)
  2. **Research** — students assigned to that field contribute (speed depends on stats + specialization + funding)
  3. **Formalization** — the proof is written in the school's formal language (visual flavor: a progress bar with proof tree visuals)
  4. **Verification** — the theorem is checked. Rigor stat affects success rate.
- Once verified, the theorem is added to the school's repository and generates resources.

---

## Prestige & Generational Cycle

### Earning Prestige
When you retire, Prestige is calculated from:

| Factor | Formula |
|---|---|
| Total theorems formalized | `theorems × 0.5` |
| Highest theorem tier proved | `tier × 2` |
| Years the school existed | `years × 1` |
| Number of students promoted during your tenure | `promoted × 2` |
| Reputation at retirement | `reputation / 100` |

### Prestige Buffs (Permanent Across Generations)
Spend Prestige on permanent upgrades. These persist when you retire and are succeeded:

| Upgrade | Cost | Effect |
|---|---|---|
| **Better Facilities** | 10 | +10% base theorem production speed (stacks) |
| **Endowed Chair** | 25 | Attracts students with +1 starting stat |
| **Research Fellowship** | 15 | +20% funding efficiency |
| **Prestigious Journal** | 20 | +15% reputation gain |
| **Summer Program** | 15 | +2 max school capacity |
| **Visiting Scholar Program** | 30 | One-time hire of a student with +2 to all stats |
| **Mathematical Institute** | 100 | Unlocks all fields simultaneously, +25% all production |

### Generation Tracking
The game tracks your school's history across generations:
- Generation number
- Total theorems proved across all generations
- Which ideology each generation chose (can change!)
- The story of your school, told through events

---

## UI Layout (Minimalist, Clean)

### Top Bar
- **Theorems** (primary currency) — large number
- **Money** — smaller number
- **Reputation** — bar or small number
- **Prestige** — shown when available to spend
- **Speed controls**: ⏸️ Pause | ⏩ 1× | ⏩⏩ 5×

### Left Panel — School Hierarchy
Tree or list view of the school:
```
👑 Professor (You, Gen 1)
  ├── 👑 Associate Prof. Maria Chen
  │    └── 🎓 Student: Alex Rivera
  ├── 👤 Assistant Prof. James Park
  │    └── 🎓 Student: Yuki Tanaka
  ├── 👤 Assistant Prof. Sarah Okonkwo
  └── 🎓 Students (3 more)
```
- Click a person to see their stats, traits, assigned field, funding level.
- Drag-and-drop (or button-based) for mentorship assignment.

### Center Panel — Theorem Pipeline
- Shows theorems currently being worked on, in progress, and completed.
- Each theorem has: name, tier, field, progress bar, assigned students.
- Completed theorems generate resources (theorems, money, reputation).
- "Next theorem" queue: player can influence which theorems are tackled next.

### Right Panel — Actions & Log
- **Hire** — button to open hiring panel
- **Assign Funding** — slider/dial interface
- **Assign Fields** — dropdown per person
- **Promote** — available when criteria met
- **Retire** — available when Associate Prof exists
- **Event Log** — scrollable text log of student quotes, promotions, theorem completions, events

### Bottom Bar — School of Thought Selector
- Shows current ideology with description and active bonuses.
- Can switch ideologies at any time (mid-game cost: reputation + slowdown penalty).

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | React + TypeScript | Fast iteration, component-based UI, great ecosystem |
| **State** | Zustand | Lightweight, perfect for idle game state |
| **Testing** | Vitest | Works with Vite, fast, Jest-compatible, for unit testing all game logic |
| **Styling** | CSS Modules or Tailwind | Clean, minimal, no heavy UI library needed |
| **Rendering** | Plain HTML/CSS (no canvas) | Minimalist UI doesn't need canvas; CSS animations for progress bars |
| **Pixel Icons** | Custom SVG sprite or tiny PNG atlas | Simple, performant |
| **Build** | Vite | Fast dev server, easy bundling |
| **Hosting** | GitHub Pages | Free, easy, fits the academic theme |

---

## Milestones (Prototype Roadmap)

### Milestone 1: Core Loop (1–2 weeks)
- [ ] Single student with stats
- [ ] Theorem pipeline (assign field → auto-prove → earn resources)
- [ ] Resource counters (theorems, money, reputation)
- [ ] Real-time progress bars
- [ ] Basic UI layout

### Milestone 2: School Structure (1–2 weeks)
- [ ] Hire multiple students
- [ ] Rank system (PhD → Assistant → Associate)
- [ ] Ratio constraints
- [ ] Assign fields and funding per person
- [ ] Mentorship system

### Milestone 3: Generational Cycle (1 week)
- [ ] Retirement mechanic
- [ ] Prestige calculation
- [ ] Prestige shop (buffs)
- [ ] Generation tracking

### Milestone 4: Polish (1 week)
- [ ] Student quotes and personality
- [ ] School of thought selector
- [ ] Theorem names (fictional + plausible)
- [ ] Pixel icons and visual polish
- [ ] Milestone Problems (Tier 5)

### Milestone 5: Millennium Problems (1 week)
- [ ] Real Millennium Problems as endgame
- [ ] Special conditions / multi-stage proofs
- [ ] Victory screen
- [ ] "New Game+" with carried-over prestige buffs

---

## Faculty Retention

Faculty can leave the school if they feel undervalued. This is triggered by:

- **Rank inversion:** A less talented student (lower total stats) is promoted above a more talented one. The talented person may resign.
- **Chronic underfunding:** If a faculty member's research group receives less than 20% of available funding for 3+ consecutive months, they risk leaving.
- **No mentorship/mentees:** Faculty with high Teaching stats who are never assigned mentees feel unfulfilled and may leave for teaching-focused institutions.
- **Stagnation:** Faculty stuck proving only Tier 1 theorems for 6+ months may leave for "more exciting work."

**Retention mechanic:** The player can prevent departures by:
- Giving them funding boosts
- Assigning them mentees
- Promoting them when they qualify
- Assigning harder theorems (satisfaction from meaningful work)

Departure notifications appear in the event log with a quote:
- *"I've learned all I can here. Time to move on."* (stagnation)
- *"How can [Student] outrank me? This is absurd."* (rank inversion)
- *"The grant money dried up. I can't keep working on this."* (underfunding)

---

## Ideology Switching (Mid-Game)

Players can switch their school's ideology at any time, but it costs **Reputation**:

| Switch | Cost | Effect |
|---|---|---|
| Same category (e.g., Formalism → Platonism) | 50 reputation | One-time penalty: 20% theorem production slowdown for 1 game month |
| Different category (e.g., Intuitionism → Platonism) | 100 reputation | One-time penalty: 30% slowdown for 2 game months |

After the penalty period, the new ideology takes effect. Students adapt — but there's a brief period of confusion and reduced productivity. Switching too often creates a "fashionable but shallow" reputation penalty (−10% reputation gain permanently until corrected).

---

## Save System

- **Auto-save to localStorage** every 30 seconds.
- **Manual save** button available.
- **Load** from localStorage on page refresh.
- **Export/Import** save data (as JSON) for backup or sharing.
- Save includes: all student data, resources, generation history, prestige buffs, current ideology, theorems proved.

---

## Testing Strategy

- **Unit tests** for all game logic (resources, promotions, ratios, theorem production, prestige calculation, ideology effects, faculty retention).
- **No UI tests** in the prototype phase — manual testing is faster for a browser game.
- **Test framework:** Vitest (works with Vite, fast, Jest-compatible).
- Tests cover: pure functions, state transitions, edge cases (ratio violations, empty school, retirement with no Associate Profs).
