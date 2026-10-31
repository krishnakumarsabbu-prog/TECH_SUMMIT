import { useState } from 'react';
import { playSuccessChime, playFailBuzz } from '../../utils/qrHelper';

interface EmojiDecipherGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    emojis: string;
    clue: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const DEFAULT_PUZZLES = [
  {
    emojis: '🐍 + 🤖 + 📊',
    clue: 'Core stack for predictive AI models',
    options: [
      'Python Machine Learning & Data Analytics 🏆',
      'A cybernetic reptile doing accounting 🦎',
      'Video game development with PyGame 🎮',
      'Automated snake feeding farm 🐍',
    ],
    correctIndex: 0,
    explanation: 'Python + Machine Learning Bot + Data Charts = Modern AI Analytics!',
  },
  {
    emojis: '🐳 + ☸️ + ☁️',
    clue: 'Modern cloud application orchestration',
    options: [
      'An ocean cruise vacation booking app 🚢',
      'Docker Containers & Kubernetes in the Cloud 🏆',
      'Marine wildlife satellite tracking 🐬',
      'Bluetooth wheel alignment system 🚗',
    ],
    correctIndex: 1,
    explanation: 'Docker (Whale) + Kubernetes (Ship Wheel) + Cloud = Cloud Native Orchestration!',
  },
  {
    emojis: '🦀 + ⚡ + 🔒',
    clue: 'Systems programming with strict memory safety',
    options: [
      'Rust High-Performance & Memory-Safe Systems 🏆',
      'Electric seafood barbecue restaurant 🦀',
      'Seaside padlock manufacturer 🔑',
      'Crab-themed arcade lightning game ⚡',
    ],
    correctIndex: 0,
    explanation: 'Rust (Crab Ferris) + Blazing Fast (Lightning) + Memory Safety (Lock) = Rust!',
  },
];

export function EmojiDecipherGame({ onFinish, gameData }: EmojiDecipherGameProps) {
  const puzzle = gameData?.emojis ? gameData : DEFAULT_PUZZLES[Math.floor(Math.random() * DEFAULT_PUZZLES.length)];
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleSelect = (idx: number) => {
    if (gameOver || selectedIdx !== null) return;
    setSelectedIdx(idx);

    if (idx === puzzle.correctIndex) {
      playSuccessChime();
      setWon(true);
      setGameOver(true);
      setTimeout(() => onFinish(true), 1300);
    } else {
      playFailBuzz();
      setGameOver(true);
      setTimeout(() => onFinish(false), 1300);
    }
  };

  return (
    <div className="ts-arcade-game ts-arcade-game--emoji">
      {/* Game HUD */}
      <div className="ts-arcade-hud">
        <div className="ts-arcade-hud__mission">
          <span className="ts-arcade-hud__icon">🧩</span>
          <span>Decipher the <strong>tech stack equation</strong> below!</span>
        </div>
        <div className="ts-arcade-hud__progress">
          <span className="ts-arcade-hud__label">BONUS</span>
          <span className="ts-arcade-hud__value">+1 PTS ⭐</span>
        </div>
      </div>

      {/* Arcade Marquee Stage */}
      <div className="ts-emoji-marquee">
        <div className="ts-emoji-marquee__equation">{puzzle.emojis}</div>
        <div className="ts-emoji-marquee__clue">💡 Clue: {puzzle.clue}</div>
      </div>

      {/* Option Cards */}
      <div className="ts-emoji-grid">
        {puzzle.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === puzzle.correctIndex;
          let btnClass = '';
          if (isSelected) {
            btnClass = isCorrect ? 'ts-emoji-card--correct' : 'ts-emoji-card--wrong';
          } else if (gameOver && isCorrect) {
            btnClass = 'ts-emoji-card--correct';
          }

          return (
            <button
              key={idx}
              type="button"
              className={`ts-emoji-card ${btnClass}`}
              onClick={() => handleSelect(idx)}
              disabled={gameOver}
            >
              <span className="ts-emoji-card__letter">{String.fromCharCode(65 + idx)}</span>
              <span className="ts-emoji-card__text">{opt}</span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🎉</span>
            <h3>Equation Deciphered!</h3>
            <p>{puzzle.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
