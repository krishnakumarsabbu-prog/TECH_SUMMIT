import type { QuizQuestion, GameType } from '../types';

/**
 * Game Bank Generator for Technology Summit 2026
 * Generates hundreds of fun, emoji-based mini-games per booth.
 * Uses 10 reusable templates — only the emojis, data, and booth skin change.
 *
 * Templates:
 *  1. memory_missing  – 6 emojis flash, one vanishes, pick which
 *  2. grid_tap        – Tap targets, avoid decoys (Whack-a-Bug style)
 *  3. odd_one         – Find the impostor emoji in a crowd
 *  4. pair_match      – Flip 4 cards to find matching pairs
 *  5. sequence        – Simon-style colour/emoji repeat
 *  6. timer_stop      – Stop the slider inside the green zone
 *  7. luck_pick       – Hidden prize under cups/boxes
 *  8. sort_bucket     – Sort items into the right bucket
 *  9. pattern_quiz    – Complete the emoji/number pattern
 * 10. crowd_judge     – Silly physical challenge judged by the crowd
 */

// ────────────────────────────────────────────────
// Emoji pools
// ────────────────────────────────────────────────
const POOLS = {
  animals: ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦁', '🐯', '🐨', '🐙', '🦄', '🐧', '🦉', '🦋', '🦖', '🐬', '🦥', '🦩'],
  food:    ['🍕', '🍔', '🍟', '🍎', '🍌', '🍇', '🍩', '🌮', '🍉', '🥑', '🧁', '🍰', '🍦', '🍿', '🍣', '🍪', '🥞', '🥨'],
  tech:    ['💻', '📱', '🔌', '🔋', '🤖', '🛰️', '💾', '🖱️', '⌨️', '📡', '🎮', '🕹️', '🕶️', '🚀', '📟', '👾', '🎧', '🔬'],
  faces:   ['😀', '😎', '🤓', '😴', '🤯', '🥳', '😡', '🤖', '👻', '😺', '🤡', '🥸', '🤠', '🕵️', '👽', '🤪', '🤫', '🤩'],
  objects: ['⚽', '🎸', '🚗', '⏰', '🎈', '🔑', '📦', '🎁', '🧲', '🔔', '💎', '🎯', '👑', '🏆', '🪄', '📢', '🧰', '💎'],
  nature:  ['🌸', '🌻', '🌵', '🍀', '🌈', '⭐', '🌙', '☀️', '🌊', '🔥', '❄️', '🍂', '⚡', '🌋', '🍄', '🪐', '🌴', '🍁'],
  magic:   ['🧙‍♂️', '🪄', '🔮', '✨', '🗝️', '📜', '🏰', '🐉', '🕯️', '🧪', '🧿', '🦄', '🧞', '🪙', '🦉', '🪞'],
  sports:  ['⚽', '🏀', '🎾', '🏈', '🎱', '🏓', '🥊', '🏹', '🛹', '⛷️', '🏄‍♂️', '🏋️', '🚴', '🏆', '🏅', '⛳'],
};
const POOL_KEYS = Object.keys(POOLS) as (keyof typeof POOLS)[];

// ────────────────────────────────────────────────
// Booth skins: funny win/lose copy per booth
// ────────────────────────────────────────────────
const BOOTH_SKIN: Record<string, { pool: keyof typeof POOLS; win: string[]; lose: string[] }> = {
  'booth-1': { pool: 'tech',    win: ['Zero Trust? Zero mistakes! 🛡️', 'Firewall champion! 🔥', 'Data guardian supreme! 🗄️', 'Vault unlocked! 🔑'], lose: ['Even firewalls blink 🔥', 'Even robots miss sometimes 🤖', 'Try again, security hero! 💪'] },
  'booth-2': { pool: 'magic',   win: ['Agent approved! 🤖', 'Digital identity verified! ✅', 'AI superstar! 🌟', 'Autonomous genius! ⚡'], lose: ['The agent needs coffee ☕', 'Back to the training data! 📊', 'Almost autonomous! 🤖'] },
  'booth-3': { pool: 'objects', win: ['Merged to main! 🚀', 'PR approved with confetti! 🎉', 'Code wizard! 🧙‍♂️', 'Zero build errors! ✨'], lose: ['Works on my machine 😅', 'git reset --hard 💔', 'Compile error in heart 💔'] },
  'booth-4': { pool: 'nature',  win: ['Cloud-native champ ☁️', 'Scaled to infinity! ♾️', 'Migration master! 🦅', 'Kubernetes tamer! 🪐'], lose: ['Cloud bill shock 💸', 'Pod not found 🫣', 'Still on-prem in spirit 🏚️'] },
  'booth-5': { pool: 'tech',    win: ['Tokens saved! 💰', 'Model deployed! 🚀', 'AI ops legend! 🏆', 'Zero hallucination! 🎯'], lose: ['Model hallucinated 🌀', 'GPU went brrrr 🥶', 'Overfitting detected 📉'] },
  'booth-6': { pool: 'sports',  win: ['Automated! ⚡', 'Process perfection! 💎', 'BI brilliance! 📊', 'Workflow speedrun! 🏎️'], lose: ['Back to Excel 📊', 'VLOOKUPs forever 😭', 'Spreadsheet strikes back 📋'] },
  'booth-7': { pool: 'faces',   win: ['Risk cleared! 🏦', 'Fraud busted! 🕵️', 'Compliant king! 👑', 'Ledger balanced! 💰'], lose: ['Flagged for review 🚩', 'Audit incoming 📝', 'Risk tolerance exceeded 😬'] },
  'booth-8': { pool: 'animals', win: ['Zero downtime! 🟢', 'SRE hero badge! 🦸', 'Uptime warrior! ⚔️', 'Four nines achieved! 🛡️'], lose: ['Chaos Monkey won 🐒', 'Pager went off 📟', '500 Internal LOL 😂'] },
  'booth-9': { pool: 'food',    win: ['All tests green ✅', 'Pipeline perfection! 🎯', 'Quality queen! 👸', 'Shipped with pizza! 🍕'], lose: ['Flaky test strikes 🎲', 'Build broke at 5pm 😱', 'Coverage dropped 📉'] },
};

// ────────────────────────────────────────────────
// Seeded pseudo-random number generator
// ────────────────────────────────────────────────
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample<T>(r: () => number, a: T[], n: number): T[] {
  return [...a].sort(() => r() - 0.5).slice(0, n);
}

// ────────────────────────────────────────────────
// Tricky pairs for Grid Tap and Odd One Out
// ────────────────────────────────────────────────
const TRICKY_PAIRS = [
  ['🐱', '🐶'], ['🍎', '🍏'], ['🌝', '🌚'], ['🍩', '🍪'], ['🚗', '🏎️'],
  ['⚡', '💡'], ['🐊', '🦎'], ['🐧', '🦆'], ['🤖', '👾'], ['🍦', '🍧'],
  ['🍕', '🍔'], ['⭐', '🌟'], ['🔥', '💥'], ['🌧️', '⛈️'], ['⚽', '🏀'],
  ['💎', '💣'], ['🚀', '🛸'], ['🍀', '🍂'], ['🎈', '📌'], ['☕', '🥛'],
];

// ────────────────────────────────────────────────
// Rich Sorting Buckets
// ────────────────────────────────────────────────
const SORT_SETS = [
  { buckets: ['🍎 Fruit', '🥕 Veggie'], items: [['🍌', 0], ['🥦', 1], ['🍇', 0], ['🥕', 1], ['🍓', 0], ['🌽', 1]] },
  { buckets: ['☁️ Cloud', '🖥️ On-Prem'], items: [['☁️', 0], ['🖱️', 1], ['💾', 1], ['🌐', 0], ['📡', 0], ['🖨️', 1]] },
  { buckets: ['🌞 Day', '🌙 Night'], items: [['☀️', 0], ['🌟', 1], ['🐓', 0], ['🦉', 1], ['☕', 0], ['🌙', 1]] },
  { buckets: ['🔥 Hot', '❄️ Cold'], items: [['🌶️', 0], ['🧊', 1], ['🏜️', 0], ['⛷️', 1], ['🔥', 0], ['🍦', 1]] },
  { buckets: ['✅ Safe', '🎣 Phish'], items: [['🔒', 0], ['📧', 1], ['🛡️', 0], ['🎁', 1], ['✅', 0], ['⚠️', 1]] },
  { buckets: ['🐱 Cat', '🐶 Dog'], items: [['😺', 0], ['🐕', 1], ['🐈', 0], ['🦮', 1], ['😸', 0], ['🐩', 1]] },
  { buckets: ['🍕 Fast Food', '🥗 Healthy'], items: [['🍔', 0], ['🥦', 1], ['🍟', 0], ['🥗', 1], ['🍕', 0], ['🥑', 1]] },
  { buckets: ['☕ Morning Fuel', '😴 Midnight Snack'], items: [['☕', 0], ['🍿', 1], ['🥐', 0], ['🍪', 1], ['🥞', 0], ['🍫', 1]] },
  { buckets: ['🦸 Hero', '🦹 Villain'], items: [['🦸', 0], ['🦹', 1], ['🛡️', 0], ['💣', 1], ['✨', 0], ['💀', 1]] },
  { buckets: ['🚀 Fast', '🐢 Slow'], items: [['🏎️', 0], ['🐢', 1], ['⚡', 0], ['🦥', 1], ['🚀', 0], ['🐌', 1]] },
  { buckets: ['🏖️ Beach', '🏔️ Mountain'], items: [['🌊', 0], ['⛷️', 1], ['🌴', 0], ['🧗', 1], ['🏖️', 0], ['❄️', 1]] },
  { buckets: ['🎮 Gaming', '💼 Office Work'], items: [['🕹️', 0], ['💼', 1], ['🎮', 0], ['🗂️', 1], ['👾', 0], ['📊', 1]] },
  { buckets: ['💻 Frontend', '🖧 Backend'], items: [['🎨', 0], ['🗄️', 1], ['📱', 0], ['🔌', 1], ['✨', 0], ['💾', 1]] },
  { buckets: ['🟢 Ship to Prod', '🔴 Rollback Now'], items: [['🚀', 0], ['💣', 1], ['✅', 0], ['🔥', 1], ['🎉', 0], ['🚨', 1]] },
  { buckets: ['🤖 AI Agent', '👨‍💼 Real Human'], items: [['🤖', 0], ['👨‍💼', 1], ['🦾', 0], ['☕', 1], ['🧠', 0], ['😴', 1]] },
];

// ────────────────────────────────────────────────
// Hilarious Crowd Challenges
// ────────────────────────────────────────────────
const CROWD_CHALLENGES = [
  { icon: '🎈', challenge: 'Pretend to inflate an invisible balloon until it pops! 💥' },
  { icon: '🗣️', challenge: 'Say "Kubernetes orchestrates containers" 3 times super fast!' },
  { icon: '🤳', challenge: 'Copy this emoji face perfectly: 🤪' },
  { icon: '🙆', challenge: 'Do a 5-second desk stretch! Show us those moves!' },
  { icon: '🤖', challenge: 'Do your best robot dance for 5 seconds!' },
  { icon: '🎤', challenge: 'Sing "Hello World" in an opera voice!' },
  { icon: '🦸', challenge: 'Strike your best superhero pose!' },
  { icon: '🦁', challenge: 'Do your best wild animal impression (meow or roar)!' },
  { icon: '💃', challenge: 'Do the victory floss dance for 5 seconds!' },
  { icon: '🧘', challenge: 'Hold a yoga tree pose for 5 seconds without wobbling!' },
  { icon: '🎭', challenge: 'Act surprised like you just won a billion dollars!' },
  { icon: '🏋️', challenge: 'Pretend to lift an invisible 500kg heavy weight!' },
  { icon: '🎸', challenge: 'Unleash an epic air guitar rock solo for 5 seconds!' },
  { icon: '🕶️', challenge: 'Perform a slow-motion Matrix bullet dodge!' },
  { icon: '✋', challenge: 'Give the nearest attendee an energetic high-five!' },
  { icon: '😉', challenge: 'Wink alternately with both eyes as fast as you can!' },
  { icon: '🍋', challenge: 'Make a face like you just bit into an ultra-sour lemon!' },
  { icon: '🏆', challenge: 'Show us your Olympic slow-motion gold medal celebration!' },
  { icon: '🏎️', challenge: 'Pretend your hands are on a Formula 1 steering wheel!' },
  { icon: '🕺', challenge: 'Do the moonwalk in place for 5 seconds!' },
];

// ────────────────────────────────────────────────
// Builder functions — one per template
// ────────────────────────────────────────────────
type Builder = (r: () => number, pool: string[], i: number) => { q: string; gameData: any };

const BUILDERS: Record<string, Builder> = {
  // 🧠 Memory: 6 emojis flash, one vanishes, pick which
  memory_missing: (r, pool) => {
    const shown = sample(r, pool, 6);
    const missingIdx = Math.floor(r() * 6);
    const missing = shown[missingIdx];
    const distractors = shown.filter(e => e !== missing).slice(0, 3);
    const options = sample(r, [missing, ...distractors], 4);
    return {
      q: '🧠 Memory Master: Watch closely… one emoji will vanish!',
      gameData: { shown, missing, options, showMs: 3000, attempts: 2 },
    };
  },

  // 🎯 Grid Tap: Tap targets, avoid decoys (Whack-a-Bug / Fruits Only)
  grid_tap: (r, pool, i) => {
    const pair = TRICKY_PAIRS[i % TRICKY_PAIRS.length] || sample(r, pool, 2);
    const [target, decoy] = pair;
    return {
      q: `🎯 Quick Tap: Tap all the ${target} and avoid ${decoy}!`,
      gameData: { target, decoy, size: 9, goal: 5, durationSec: 15, lives: 3 },
    };
  },

  // 🔍 Odd One: Find the impostor in a crowd of emojis
  odd_one: (r, pool, i) => {
    const pair = TRICKY_PAIRS[(i * 3 + 1) % TRICKY_PAIRS.length] || sample(r, pool, 2);
    const [base, odd] = pair;
    return {
      q: '🔍 Spot the Impostor: One emoji doesn\'t belong. Find it!',
      gameData: { base, odd, cells: 12, oddIndex: Math.floor(r() * 12), durationSec: 20, attempts: 2 },
    };
  },

  // 🃏 Pair Match: Flip 4 cards to find matching pairs
  pair_match: (r, pool) => ({
    q: '🃏 Match Maker: Peek at the cards, then find the matching pairs!',
    gameData: { faces: sample(r, pool, 3), attempts: 2, peekMs: 2000 },
  }),

  // 🎨 Sequence: Simon-style colour/emoji repeat
  sequence: (r) => ({
    q: '🎨 Copy Cat: Watch the sequence, then repeat it!',
    gameData: { colors: ['🔴', '🔵', '🟢', '🟡'], length: 3 + Math.floor(r() * 2), attempts: 2 },
  }),

  // ⏱️ Timer Stop: Stop the slider inside the green zone
  timer_stop: (r) => {
    const w = 25 + Math.floor(r() * 10); // wide zone = easy
    const start = 20 + Math.floor(r() * 40);
    return {
      q: '⏱️ Stop the Bar: Tap when the slider is inside the green zone!',
      gameData: { zoneStart: start, zoneEnd: start + w, speed: 1.2, attempts: 2 },
    };
  },

  // 🎁 Luck Pick: One has the prize. Trust your gut!
  luck_pick: (r, pool) => ({
    q: '🎁 Lucky Pick: One of these has the prize. Trust your gut!',
    gameData: {
      slots: 3,
      icon: sample(r, ['🎁', '🚪', '🥤', '🎩', '🧳', '🎪'], 1)[0],
      prize: pool[0] || '🏆',
      rigAfterMisses: 1, // gently rigged — second pick always wins
    },
  }),

  // 🗂️ Sort Bucket: Drop items into the right category
  sort_bucket: (r, _pool, i) => {
    const setIdx = (i + Math.floor(r() * SORT_SETS.length)) % SORT_SETS.length;
    return {
      q: '🗂️ Sort It: Tap to drop each item in the right bucket!',
      gameData: { ...SORT_SETS[setIdx], mistakes: 2 },
    };
  },

  // 🔢 Pattern Quiz: Complete the emoji/number pattern
  pattern_quiz: (r, pool) => {
    const [a, b, c] = sample(r, pool, 3);
    const patternType = Math.floor(r() * 3);
    let pattern: string[];
    let answer: string;

    if (patternType === 0) {
      // ABAB → ?
      pattern = [a, b, a, b];
      answer = a;
    } else if (patternType === 1) {
      // AABAA → ?
      pattern = [a, a, b, a, a];
      answer = b;
    } else {
      // ABCABC → ?
      pattern = [a, b, c, a, b];
      answer = c;
    }

    // Build options ensuring no duplicates
    const optionSet = new Set([answer, a, b, c]);
    if (optionSet.size < 4 && pool.length > 3) {
      for (const p of pool) {
        optionSet.add(p);
        if (optionSet.size >= 4) break;
      }
    }
    const options = sample(r, Array.from(optionSet).slice(0, 4), 4);

    return {
      q: `🔢 Pattern Ninja: ${pattern.join(' ')} → ?`,
      gameData: { pattern, options, answer },
    };
  },

  // 🎤 Crowd Judge: Physical challenge judged by crowd applause
  crowd_judge: (r, _pool, i) => {
    const c = CROWD_CHALLENGES[(i + Math.floor(r() * CROWD_CHALLENGES.length)) % CROWD_CHALLENGES.length];
    return {
      q: `🎤 Crowd Challenge: ${c.challenge}`,
      gameData: { ...c, durationSec: 8 },
    };
  },
};

// ────────────────────────────────────────────────
// Main build function
// ────────────────────────────────────────────────

const BUILDER_KEYS = Object.keys(BUILDERS) as GameType[];

export function buildGame(boothKey: string, n: number): QuizQuestion {
  const boothNum = parseInt(boothKey.replace('booth-', ''), 10) || 1;
  const r = rng(n * 9301 + boothNum * 49297 + boothKey.charCodeAt(Math.min(6, boothKey.length - 1)));
  const gameType = BUILDER_KEYS[n % BUILDER_KEYS.length];
  const skin = BOOTH_SKIN[boothKey] ?? BOOTH_SKIN['booth-1'];

  // Mix the booth's own pool with a rotating pool for variety
  const boothPool = POOLS[skin.pool];
  const rotatingPool = POOLS[POOL_KEYS[n % POOL_KEYS.length]];
  const pool = [...new Set([...boothPool, ...rotatingPool])];

  const { q, gameData } = BUILDERS[gameType](r, pool, n);

  // Pick win/lose message
  const winMsg = skin.win[n % skin.win.length];
  const loseMsg = skin.lose[n % skin.lose.length];

  return {
    id: `${boothKey}_mini_${n}`,
    category: 'Mini Game',
    difficulty: 'easy',
    question: q,
    itemType: 'game',
    gameType,
    gameData: { ...gameData, winMsg, loseMsg },
    options: ['Challenge Incomplete', 'Challenge Completed! 🎉'],
    correctAnswer: 1,
  } as QuizQuestion;
}

/**
 * Generate a batch of fun mini-games for a booth.
 * Used by the runtime question engine as an in-memory fallback
 * and also called from the JSON generator script.
 */
export function buildGamesForBooth(boothKey: string, count: number = 100): QuizQuestion[] {
  return Array.from({ length: count }, (_, i) => buildGame(boothKey, i));
}
