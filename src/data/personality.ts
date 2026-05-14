// =============================================================================
// Student names, traits, and quotes for School of Thought
// =============================================================================

export const FIRST_NAMES = [
  'Alex', 'Maria', 'James', 'Yuki', 'Sarah', 'Wei', 'Priya', 'Omar', 'Elena', 'Kai',
  'Amara', 'Lucas', 'Fatima', 'Henrik', 'Zara', 'Nikolai', 'Inès', 'Ravi', 'Clara', 'Dmitri',
  'Aisha', 'Thomas', 'Mei', 'Carlos', 'Anya', 'Raj', 'Sofia', 'Ethan', 'Layla', 'Marco',
  'Hana', 'Oliver', 'Nadia', 'Samuel', 'Freya', 'Ibrahim', 'Chloe', 'Daniel', 'Astrid', 'Liam',
];

export const LAST_NAMES = [
  'Chen', 'Park', 'Okonkwo', 'Rivera', 'Tanaka', 'Müller', 'Singh', 'Hassan', 'Petrov', 'Johansson',
  'Kim', 'Dubois', 'Santos', 'Andersson', 'Nakamura', 'Okafor', 'Moreau', 'Patel', 'Lund', 'Ivanov',
  'Ali', 'Weber', 'Liu', 'García', 'Kuznetsova', 'Sharma', 'Rossi', 'Brown', 'Yılmaz', 'Bianchi',
  'Wang', 'Nilsson', 'Bennett', 'Osei', 'Lindqvist', 'Mbeki', 'Fischer', 'Zhang', 'Eriksson', 'Jones',
];

// --- Student Quotes ---

export interface QuoteEntry {
  texts: string[];
  trigger: QuoteTrigger;
}

export type QuoteTrigger =
  | 'theorem_proved'
  | 'promotion'
  | 'hire'
  | 'mentor_assigned'
  | 'underfunded'
  | 'stagnation'
  | 'rank_inversion'
  | 'idle'
  | 'ideology_switch'
  | 'retirement';

export const QUOTES: QuoteEntry[] = [
  // Theorem proved
  {
    trigger: 'theorem_proved',
    texts: [
      "I think there's a way to construct the proof using...",
      "The formalization is complete. It actually held together!",
      "Another lemma down. The bigger picture is becoming clearer.",
      "I wasn't sure at first, but the structure emerged naturally.",
      "We did it. The proof goes through.",
      "It was simpler than I expected. Sometimes the answer is elegant.",
    ],
  },
  // Promotion
  {
    trigger: 'promotion',
    texts: [
      "I can't believe I'm actually a faculty member now.",
      "From student to Assistant Professor. The journey continues.",
      "This promotion means more than I can express. Thank you.",
      "I'm honored. Now the real work begins.",
      "PhD to faculty. Time to give back to the next generation.",
    ],
  },
  // Hire
  {
    trigger: 'hire',
    texts: [
      "New student joining the school. We need fresh perspectives.",
      "Someone new to mentor. Hopefully they have potential.",
      "The school grows. New energy, new ideas.",
      "Welcome to the department. Let's see where your talents lie.",
    ],
  },
  // Mentor assigned
  {
    trigger: 'mentor_assigned',
    texts: [
      "The mentor assigned to me has been invaluable.",
      "Having someone to guide me makes all the difference.",
      "My advisor's feedback on my latest work was exactly what I needed.",
      "Learning as much from the people around me as from the theorems.",
    ],
  },
  // Underfunded
  {
    trigger: 'underfunded',
    texts: [
      "The grant money dried up. I can't keep working on this.",
      "Without funding, this research will stall. I know it has potential.",
      "We're doing important work but the resources just aren't there.",
      "I'd love to push further on this, but... you know the situation.",
    ],
  },
  // Stagnation
  {
    trigger: 'stagnation',
    texts: [
      "I've been staring at this basic lemma for weeks. When do we get to the interesting stuff?",
      "I've learned all I can here. Time to move on.",
      "There has to be something more challenging for me to work on.",
      "I feel like I'm repeating myself. I need a harder problem.",
      "My peers at other schools are working on things I can only dream about here.",
    ],
  },
  // Rank inversion
  {
    trigger: 'rank_inversion',
    texts: [
      "How can they outrank me? This is absurd.",
      "I've proved more theorems than half the people above me.",
      "The politics in this department are getting out of hand.",
      "Merit should matter. I'm starting to wonder if it does.",
      "They promoted someone with half my output above me. Seriously?",
    ],
  },
  // Idle / general
  {
    trigger: 'idle',
    texts: [
      "The proof won't write itself... well, actually it mostly does now.",
      "I spent three hours on a corner case. Worth it.",
      "Coffee is the real fuel of mathematics.",
      "Sometimes the hardest part is choosing which theorem to tackle next.",
      "I had a breakthrough in the shower. Classic.",
      "The beauty of a clean proof is unmatched.",
      "I keep coming back to this problem. It won't let me go.",
      "Do you think Gödel would have enjoyed this game?",
    ],
  },
  // Ideology switch
  {
    trigger: 'ideology_switch',
    texts: [
      "A new direction for the school. Exciting but unsettling.",
      "So we're changing philosophies now. Interesting choice.",
      "I'll adapt. Every school of thought has something to offer.",
      "This shift in direction will take some getting used to.",
      "A fresh ideological approach. Let's see where it leads.",
    ],
  },
  // Retirement / succession
  {
    trigger: 'retirement',
    texts: [
      "A new era for our school. I'm excited to see what comes next.",
      "They're passing the torch. Let's make sure it stays lit.",
      "The school is in good hands. Time to see what I built.",
      "A new generation of mathematicians. The future looks bright.",
      "I'll be following the school's progress from afar. Proud of what we built.",
    ],
  },
];

export function getQuotesForTrigger(trigger: QuoteTrigger): string[] {
  const entry = QUOTES.find((q) => q.trigger === trigger);
  return entry?.texts ?? [];
}

export function getRandomQuote(trigger: QuoteTrigger): string {
  const quotes = getQuotesForTrigger(trigger);
  if (quotes.length === 0) return '';
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// --- Departure Quotes ---

export const DEPARTURE_QUOTES = [
  "I've learned all I can here. Time to move on.",
  "How can {name} outrank me? This is absurd.",
  "The grant money dried up. I can't keep working on this.",
  "I'm being offered a position at a more... stimulating institution.",
  "My research interests have diverged. I need to go somewhere that can support them.",
  "It's not the theorems. It's the environment. I need a better one.",
  "I've outgrown this school. For everyone's sake.",
];
