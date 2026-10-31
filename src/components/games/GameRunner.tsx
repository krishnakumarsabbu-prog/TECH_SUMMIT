import { useState, useEffect, useRef, useCallback } from 'react';
import type { QuizQuestion } from '../../types';
import { playZapSound, playFailBuzz, playSuccessChime } from '../../utils/qrHelper';

// ═══════════════════════════════════════════
// GAME RUNNER — Central router for all games
// ═══════════════════════════════════════════

interface GameRunnerProps {
  question: QuizQuestion;
  onDone: (won: boolean) => void;
}

export function GameRunner({ question, onDone }: GameRunnerProps) {
  const d = question.gameData;
  const [result, setResult] = useState<'playing' | 'won' | 'lost'>('playing');

  const handleFinish = useCallback((won: boolean) => {
    if (result !== 'playing') return;
    setResult(won ? 'won' : 'lost');
    if (won) playSuccessChime();
    else playFailBuzz();
    setTimeout(() => onDone(won), 1400);
  }, [result, onDone]);

  if (result !== 'playing') {
    const msg = result === 'won' ? (d?.winMsg || '🎉 Amazing!') : (d?.loseMsg || 'Even robots miss sometimes 🤖');
    return (
      <div className="emoji-game-result">
        <div className={`emoji-game-result__card ${result === 'won' ? 'emoji-game-result__card--won' : 'emoji-game-result__card--lost'}`}>
          <span className="emoji-game-result__icon">{result === 'won' ? '🎉' : '😅'}</span>
          <p className="emoji-game-result__msg">{msg}</p>
        </div>
      </div>
    );
  }

  switch (question.gameType) {
    case 'memory_missing': return <MemoryMissing d={d} onDone={handleFinish} />;
    case 'grid_tap':       return <GridTap d={d} onDone={handleFinish} />;
    case 'odd_one':        return <OddOne d={d} onDone={handleFinish} />;
    case 'pair_match':     return <PairMatch d={d} onDone={handleFinish} />;
    case 'sequence':       return <Sequence d={d} onDone={handleFinish} />;
    case 'timer_stop':     return <TimerStop d={d} onDone={handleFinish} />;
    case 'luck_pick':      return <LuckPick d={d} onDone={handleFinish} />;
    case 'sort_bucket':    return <SortBucket d={d} onDone={handleFinish} />;
    case 'pattern_quiz':   return <PatternQuiz d={d} onDone={handleFinish} />;
    case 'crowd_judge':    return <CrowdJudge d={d} onDone={handleFinish} />;
    default: return null;
  }
}


// ═══════════════════════════════════════════
// 🧠 MEMORY MISSING
// ═══════════════════════════════════════════
function MemoryMissing({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [phase, setPhase] = useState<'show' | 'ask'>('show');
  const [tries, setTries] = useState(d.attempts || 2);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPhase('ask'), d.showMs || 3000);
    return () => clearTimeout(t);
  }, [d.showMs]);

  if (phase === 'show') {
    return (
      <div className="emoji-game emoji-game--memory">
        <div className="emoji-game__instruction">
          <span className="emoji-game__pulse">👁️</span> Memorise these emojis…
        </div>
        <div className="emoji-grid emoji-grid--3col">
          {(d.shown as string[]).map((e: string, i: number) => (
            <div key={i} className="emoji-cell emoji-cell--glow">{e}</div>
          ))}
        </div>
        <div className="emoji-game__timer-bar" style={{ animationDuration: `${(d.showMs || 3000) / 1000}s` }} />
      </div>
    );
  }

  const remaining = (d.shown as string[]).filter((e: string) => e !== d.missing);

  const pick = (e: string) => {
    if (e === d.missing) return onDone(true);
    playFailBuzz();
    setShake(true);
    setTimeout(() => setShake(false), 500);
    if (tries - 1 > 0) {
      setTries(tries - 1);
    } else {
      onDone(false);
    }
  };

  return (
    <div className={`emoji-game emoji-game--memory ${shake ? 'emoji-game--shake' : ''}`}>
      <div className="emoji-game__instruction">
        Which emoji vanished? <span className="emoji-game__tries">({tries} {tries === 1 ? 'try' : 'tries'} left)</span>
      </div>
      <div className="emoji-game__remaining">
        {remaining.slice(0, 5).map((e: string, i: number) => (
          <span key={i} className="emoji-cell emoji-cell--small">{e}</span>
        ))}
        <span className="emoji-cell emoji-cell--missing">❓</span>
      </div>
      <div className="emoji-game__options">
        {(d.options as string[]).map((e: string, i: number) => (
          <button key={i} className="emoji-btn emoji-btn--choice" onClick={() => pick(e)}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🎯 GRID TAP
// ═══════════════════════════════════════════
function GridTap({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(d.lives || 3);
  const [cells, setCells] = useState<string[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const intervalRef = useRef<any>(null);
  const goal = d.goal || 5;

  const generateGrid = useCallback(() => {
    const grid: string[] = [];
    for (let i = 0; i < (d.size || 9); i++) {
      grid.push(Math.random() < 0.6 ? d.target : d.decoy);
    }
    // Ensure at least 2 targets
    if (!grid.includes(d.target)) {
      grid[0] = d.target;
      grid[Math.floor(Math.random() * grid.length)] = d.target;
    }
    setCells(grid);
  }, [d.target, d.decoy, d.size]);

  useEffect(() => {
    generateGrid();
    intervalRef.current = setInterval(generateGrid, 2000);
    return () => clearInterval(intervalRef.current);
  }, [generateGrid]);

  useEffect(() => {
    if (score >= goal) {
      clearInterval(intervalRef.current);
      onDone(true);
    }
  }, [score, goal, onDone]);

  useEffect(() => {
    if (lives <= 0) {
      clearInterval(intervalRef.current);
      onDone(false);
    }
  }, [lives, onDone]);

  const handleTap = (idx: number) => {
    if (cells[idx] === '💥' || cells[idx] === '💨') return;
    setFlash(idx);
    setTimeout(() => setFlash(null), 300);
    if (cells[idx] === d.target) {
      playZapSound();
      setScore((s: number) => s + 1);
      setCells(prev => {
        const next = [...prev];
        next[idx] = '💥';
        return next;
      });
    } else {
      playFailBuzz();
      setLives((l: number) => l - 1);
      setCells(prev => {
        const next = [...prev];
        next[idx] = '💨';
        return next;
      });
    }
  };

  return (
    <div className="emoji-game emoji-game--grid">
      <div className="emoji-game__hud">
        <span>🎯 {score}/{goal}</span>
        <span>{'❤️'.repeat(Math.max(0, lives))}</span>
      </div>
      <div className="emoji-game__instruction">
        Tap <span className="emoji-game__highlight">{d.target}</span> avoid <span className="emoji-game__danger">{d.decoy}</span>
      </div>
      <div className="emoji-grid emoji-grid--3col">
        {cells.map((emoji, idx) => (
          <button
            key={idx}
            className={`emoji-cell emoji-cell--tappable ${flash === idx ? 'emoji-cell--flash' : ''}`}
            onClick={() => handleTap(idx)}
            disabled={emoji === '💥' || emoji === '💨'}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🔍 ODD ONE
// ═══════════════════════════════════════════
function OddOne({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [tries, setTries] = useState(d.attempts || 2);
  const [shake, setShake] = useState(false);
  const [missedCells, setMissedCells] = useState<number[]>([]);
  const cellCount = d.cells || 12;

  const tap = (i: number) => {
    if (missedCells.includes(i)) return;
    if (i === d.oddIndex) {
      playZapSound();
      return onDone(true);
    }
    playFailBuzz();
    setShake(true);
    setMissedCells(prev => [...prev, i]);
    setTimeout(() => setShake(false), 500);
    if (tries - 1 > 0) {
      setTries(tries - 1);
    } else {
      onDone(false);
    }
  };

  return (
    <div className={`emoji-game emoji-game--odd ${shake ? 'emoji-game--shake' : ''}`}>
      <div className="emoji-game__instruction">
        🔍 Find the odd one out! <span className="emoji-game__tries">({tries} {tries === 1 ? 'try' : 'tries'} left)</span>
      </div>
      <div className="emoji-grid emoji-grid--4col">
        {Array.from({ length: cellCount }, (_, i) => (
          <button
            key={i}
            className={`emoji-cell emoji-cell--tappable ${missedCells.includes(i) ? 'emoji-cell--missed' : ''}`}
            onClick={() => tap(i)}
            disabled={missedCells.includes(i)}
            style={missedCells.includes(i) ? { opacity: 0.3, transform: 'scale(0.85)' } : undefined}
          >
            {missedCells.includes(i) ? '❌' : (i === d.oddIndex ? d.odd : d.base)}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🃏 PAIR MATCH
// ═══════════════════════════════════════════
function PairMatch({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const faces: string[] = d.faces || ['🐶', '🐱', '🐼'];
  // Create pairs from first 2 faces
  const pairEmojis = [faces[0], faces[0], faces[1], faces[1]];
  const [cards] = useState(() => {
    const shuffled = [...pairEmojis].sort(() => Math.random() - 0.5);
    return shuffled.map((emoji, i) => ({ id: i, emoji, flipped: true }));
  });
  const [phase, setPhase] = useState<'peek' | 'play'>('peek');
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [tries, setTries] = useState(d.attempts || 2);
  const lockRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setPhase('play'), d.peekMs || 2000);
    return () => clearTimeout(t);
  }, [d.peekMs]);

  useEffect(() => {
    if (matched.length === cards.length && phase === 'play') {
      onDone(true);
    }
  }, [matched, cards.length, phase, onDone]);

  const handleFlip = (idx: number) => {
    if (phase !== 'play' || lockRef.current || flipped.includes(idx) || matched.includes(idx)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      const [a, b] = newFlipped;
      if (cards[a].emoji === cards[b].emoji) {
        playZapSound();
        setMatched(prev => [...prev, a, b]);
        setFlipped([]);
        lockRef.current = false;
      } else {
        playFailBuzz();
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
          if (tries - 1 <= 0) onDone(false);
          else setTries(tries - 1);
        }, 800);
      }
    }
  };

  const isVisible = (idx: number) => phase === 'peek' || flipped.includes(idx) || matched.includes(idx);

  return (
    <div className="emoji-game emoji-game--pairs">
      <div className="emoji-game__instruction">
        {phase === 'peek' ? '👁️ Memorise the cards…' : `🃏 Find the pairs! (${tries} ${tries === 1 ? 'miss' : 'misses'} left)`}
      </div>
      <div className="emoji-grid emoji-grid--2col">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            className={`emoji-cell emoji-cell--card ${isVisible(idx) ? 'emoji-cell--card-up' : 'emoji-cell--card-down'} ${matched.includes(idx) ? 'emoji-cell--matched' : ''}`}
            onClick={() => handleFlip(idx)}
          >
            {isVisible(idx) ? card.emoji : '❓'}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🎨 SEQUENCE (Simon-style)
// ═══════════════════════════════════════════
function Sequence({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const colors: string[] = d.colors || ['🔴', '🔵', '🟢', '🟡'];
  const seqLength = d.length || 3;
  const [seq] = useState(() => {
    const s: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      s.push(Math.floor(Math.random() * colors.length));
    }
    return s;
  });
  const [phase, setPhase] = useState<'show' | 'play'>('show');
  const [showIdx, setShowIdx] = useState(0);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [tries, setTries] = useState(d.attempts || 2);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);

  // Show sequence one by one
  useEffect(() => {
    if (phase !== 'show') return;
    if (showIdx >= seqLength) {
      setTimeout(() => setPhase('play'), 500);
      return;
    }
    const t = setTimeout(() => {
      setActiveBtn(seq[showIdx]);
      setTimeout(() => {
        setActiveBtn(null);
        setShowIdx(showIdx + 1);
      }, 400);
    }, 600);
    return () => clearTimeout(t);
  }, [phase, showIdx, seq, seqLength]);

  const handleTap = (colorIdx: number) => {
    if (phase !== 'play') return;
    const nextIdx = playerSeq.length;
    if (colorIdx === seq[nextIdx]) {
      playZapSound();
      const newSeq = [...playerSeq, colorIdx];
      setPlayerSeq(newSeq);
      if (newSeq.length === seqLength) {
        onDone(true);
      }
    } else {
      playFailBuzz();
      if (tries - 1 > 0) {
        setTries(tries - 1);
        setPlayerSeq([]);
        setShowIdx(0);
        setPhase('show');
      } else {
        onDone(false);
      }
    }
  };

  return (
    <div className="emoji-game emoji-game--sequence">
      <div className="emoji-game__instruction">
        {phase === 'show'
          ? '👁️ Watch the sequence…'
          : `🎨 Now repeat it! (${tries} ${tries === 1 ? 'try' : 'tries'} left)`
        }
      </div>
      <div className="emoji-game__progress">
        {seq.map((_, i) => (
          <span key={i} className={`emoji-game__dot ${i < playerSeq.length ? 'emoji-game__dot--filled' : ''}`} />
        ))}
      </div>
      <div className="emoji-grid emoji-grid--2col">
        {colors.map((color, idx) => (
          <button
            key={idx}
            className={`emoji-cell emoji-cell--sequence ${activeBtn === idx ? 'emoji-cell--active-flash' : ''}`}
            onClick={() => handleTap(idx)}
            disabled={phase !== 'play'}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// ⏱️ TIMER STOP
// ═══════════════════════════════════════════
function TimerStop({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [position, setPosition] = useState(0);
  const [running, setRunning] = useState(true);
  const [tries, setTries] = useState(d.attempts || 2);
  const animRef = useRef<any>(null);
  const startRef = useRef(Date.now());
  const speed = d.speed || 1.2;
  const zoneStart = d.zoneStart || 30;
  const zoneEnd = d.zoneEnd || 60;

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      // Oscillate 0-100 using sine wave
      const pos = (Math.sin(elapsed * speed * Math.PI) * 0.5 + 0.5) * 100;
      setPosition(pos);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, speed]);

  const handleStop = () => {
    if (!running) return;
    setRunning(false);
    cancelAnimationFrame(animRef.current);
    
    if (position >= zoneStart && position <= zoneEnd) {
      playZapSound();
      onDone(true);
    } else {
      playFailBuzz();
      if (tries - 1 > 0) {
        setTries(tries - 1);
        startRef.current = Date.now();
        setRunning(true);
      } else {
        onDone(false);
      }
    }
  };

  return (
    <div className="emoji-game emoji-game--timer">
      <div className="emoji-game__instruction">
        ⏱️ Tap STOP when the slider is in the <span className="emoji-game__highlight" style={{ color: '#22c55e' }}>green zone</span>!
        <span className="emoji-game__tries">({tries} {tries === 1 ? 'try' : 'tries'} left)</span>
      </div>
      <div className="emoji-timer-bar">
        <div className="emoji-timer-bar__track">
          <div
            className="emoji-timer-bar__zone"
            style={{ left: `${zoneStart}%`, width: `${zoneEnd - zoneStart}%` }}
          />
          <div
            className="emoji-timer-bar__cursor"
            style={{ left: `${position}%` }}
          />
        </div>
      </div>
      <button className="emoji-btn emoji-btn--stop" onClick={handleStop}>
        ✋ STOP!
      </button>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🎁 LUCK PICK
// ═══════════════════════════════════════════
function LuckPick({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const slots = d.slots || 3;
  const icon = d.icon || '🎁';
  const [prizeSlot] = useState(() => Math.floor(Math.random() * slots));
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [misses, setMisses] = useState(0);
  const rigAfterMisses = d.rigAfterMisses ?? 1;

  const handlePick = (idx: number) => {
    if (revealed) return;
    setPicked(idx);
    setRevealed(true);

    // Gently rigged: after X misses, next pick always wins
    const isWinner = idx === prizeSlot || misses >= rigAfterMisses;

    if (isWinner) {
      playZapSound();
      setTimeout(() => onDone(true), 800);
    } else {
      playFailBuzz();
      setMisses(m => m + 1);
      setTimeout(() => {
        setRevealed(false);
        setPicked(null);
      }, 1200);
    }
  };

  return (
    <div className="emoji-game emoji-game--luck">
      <div className="emoji-game__instruction">
        🎁 One of these hides a prize! Tap to reveal!
      </div>
      <div className="emoji-grid emoji-grid--luck">
        {Array.from({ length: slots }, (_, i) => {
          const isThisSlot = picked === i && revealed;
          const isWinner = i === prizeSlot || (picked === i && misses >= rigAfterMisses);
          return (
            <button
              key={i}
              className={`emoji-cell emoji-cell--luck ${isThisSlot ? (isWinner ? 'emoji-cell--prize-won' : 'emoji-cell--prize-empty') : ''}`}
              onClick={() => handlePick(i)}
              disabled={revealed}
            >
              {isThisSlot ? (isWinner ? `🏆${d.prize || '🎉'}` : '💨') : icon}
            </button>
          );
        })}
      </div>
      {revealed && picked !== null && (picked === prizeSlot || misses >= rigAfterMisses) && (
        <div className="emoji-game__celebration">🎉 You found the prize!</div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════
// 🗂️ SORT BUCKET
// ═══════════════════════════════════════════
function SortBucket({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [items] = useState(() => [...(d.items as [string, number][])].sort(() => Math.random() - 0.5));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const maxMistakes = d.mistakes || 2;
  const [sorted, setSorted] = useState(0);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [locked, setLocked] = useState(false);

  const handleSort = (bucketIdx: number) => {
    if (locked || currentIdx >= items.length) return;
    setLocked(true);
    const [, correctBucket] = items[currentIdx];

    if (bucketIdx === correctBucket) {
      playZapSound();
      setLastResult('correct');
      setSorted(s => s + 1);
      const nextIdx = currentIdx + 1;
      if (nextIdx >= items.length) {
        onDone(true);
      } else {
        setTimeout(() => {
          setCurrentIdx(nextIdx);
          setLastResult(null);
          setLocked(false);
        }, 500);
      }
    } else {
      playFailBuzz();
      setLastResult('wrong');
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= maxMistakes) {
        onDone(false);
      } else {
        setTimeout(() => {
          setLastResult(null);
          setLocked(false);
        }, 600);
      }
    }
  };

  const currentItem = items[currentIdx];

  return (
    <div className="emoji-game emoji-game--sort">
      <div className="emoji-game__hud">
        <span>✅ {sorted}/{items.length}</span>
        <span>❌ {mistakes}/{maxMistakes}</span>
      </div>
      {currentItem && (
        <div className={`emoji-game__sort-item ${lastResult === 'correct' ? 'emoji-game__sort-item--correct' : ''} ${lastResult === 'wrong' ? 'emoji-game__sort-item--wrong' : ''}`}>
          <span className="emoji-game__sort-emoji">{currentItem[0]}</span>
          <span className="emoji-game__sort-label">Where does this belong?</span>
        </div>
      )}
      <div className="emoji-game__buckets">
        {(d.buckets as string[]).map((bucket: string, idx: number) => (
          <button
            key={idx}
            className="emoji-btn emoji-btn--bucket"
            onClick={() => handleSort(idx)}
            disabled={locked}
          >
            {bucket}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🔢 PATTERN QUIZ
// ═══════════════════════════════════════════
function PatternQuiz({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [shake, setShake] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handlePick = (option: string) => {
    if (answered) return;
    setAnswered(true);
    if (option === d.answer) {
      playZapSound();
      onDone(true);
    } else {
      playFailBuzz();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      onDone(false);
    }
  };

  return (
    <div className={`emoji-game emoji-game--pattern ${shake ? 'emoji-game--shake' : ''}`}>
      <div className="emoji-game__instruction">
        Complete the pattern!
      </div>
      <div className="emoji-game__pattern-display">
        {(d.pattern as string[]).map((p: string, i: number) => (
          <span key={i} className="emoji-cell emoji-cell--pattern">{p}</span>
        ))}
        <span className="emoji-cell emoji-cell--pattern emoji-cell--missing">❓</span>
      </div>
      <div className="emoji-game__options">
        {(d.options as string[]).map((opt: string, i: number) => (
          <button key={i} className="emoji-btn emoji-btn--choice" onClick={() => handlePick(opt)} disabled={answered}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🎤 CROWD JUDGE
// ═══════════════════════════════════════════
function CrowdJudge({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [timer, setTimer] = useState<number>(d.durationSec || 8);
  const [started, setStarted] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!started || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t: number) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, timer]);

  const handleVote = (win: boolean) => {
    if (voted) return;
    setVoted(true);
    onDone(win);
  };

  return (
    <div className="emoji-game emoji-game--crowd">
      <div className="emoji-game__instruction">
        <span className="emoji-game__big-icon">{d.icon || '🎤'}</span>
        <p className="emoji-game__challenge-text">{d.challenge}</p>
      </div>
      {!started ? (
        <button className="emoji-btn emoji-btn--start" onClick={() => setStarted(true)}>
          🎬 Start Challenge!
        </button>
      ) : timer > 0 ? (
        <div className="emoji-game__countdown">
          <div className="emoji-game__countdown-number">{timer}</div>
          <div className="emoji-game__countdown-label">seconds remaining</div>
          <div className="emoji-game__timer-bar" style={{ animationDuration: `${d.durationSec || 8}s` }} />
        </div>
      ) : (
        <div className="emoji-game__crowd-vote">
          <p className="emoji-game__vote-prompt">Did the crowd approve? 🎉</p>
          <div className="emoji-game__vote-buttons">
            <button className="emoji-btn emoji-btn--approve" onClick={() => handleVote(true)} disabled={voted}>
              👏 Nailed It!
            </button>
            <button className="emoji-btn emoji-btn--retry" onClick={() => handleVote(false)} disabled={voted}>
              😂 Almost!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
