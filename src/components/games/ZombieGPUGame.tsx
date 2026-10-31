import { useState, useEffect, useRef } from 'react';
import { playZapSound, playFailBuzz, playSuccessChime } from '../../utils/qrHelper';

interface ZombieGPUGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    targetCount?: number;
  };
}

interface Target {
  id: number;
  label: string;
  cost: string;
  isRogue: boolean;
  x: number;
  y: number;
  icon: string;
}

const ROGUE_TEMPLATES = [
  { label: 'Idle H100 GPU Cluster', cost: '$85/hr', icon: '🔥' },
  { label: 'Zombie Dev Cluster', cost: '$42/hr', icon: '🧟' },
  { label: 'Forgotten Staging Redis', cost: '$68/hr', icon: '💸' },
  { label: 'Unattached EBS 20TB', cost: '$55/hr', icon: '💾' },
  { label: 'Rogue Bitcoin Miner', cost: '$190/hr', icon: '⛏️' },
  { label: 'Abandoned GPU Worker', cost: '$95/hr', icon: '⚡' },
];

const SAFE_TEMPLATES = [
  { label: 'Prod Database (DO NOT TOUCH)', cost: 'CRITICAL', icon: '🛡️' },
  { label: 'Auth Gateway (CRITICAL)', cost: 'ACTIVE', icon: '🔐' },
  { label: 'Customer Payment API', cost: 'LIVE', icon: '💳' },
];

export function ZombieGPUGame({ onFinish, gameData }: ZombieGPUGameProps) {
  const targetKills = gameData?.targetCount ?? 5;
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const nextTargetId = useRef(1);

  // Spawner: keeps 2-3 targets floating on screen
  useEffect(() => {
    if (gameOver) return;

    const spawnTarget = () => {
      const isRogue = Math.random() < 0.75;
      const template = isRogue
        ? ROGUE_TEMPLATES[Math.floor(Math.random() * ROGUE_TEMPLATES.length)]
        : SAFE_TEMPLATES[Math.floor(Math.random() * SAFE_TEMPLATES.length)];

      const newTarget: Target = {
        id: nextTargetId.current++,
        label: template.label,
        cost: template.cost,
        isRogue,
        icon: template.icon,
        x: Math.floor(Math.random() * 46) + 27,
        y: Math.floor(Math.random() * 50) + 22,
      };

      setTargets((prev) => [...prev.slice(-2), newTarget]);
    };

    spawnTarget();
    spawnTarget();
    const spawnTimer = setInterval(spawnTarget, 1200);
    return () => clearInterval(spawnTimer);
  }, [gameOver]);

  // Check victory
  useEffect(() => {
    if (score >= targetKills && !gameOver) {
      setGameOver(true);
      playSuccessChime();
      setTimeout(() => onFinish(true), 1200);
    }
  }, [score, targetKills, gameOver, onFinish]);

  const handleTap = (target: Target) => {
    if (gameOver) return;

    if (target.isRogue) {
      playZapSound();
      setScore((s) => s + 1);
      setBursts((b) => [...b, { id: target.id, x: target.x, y: target.y, text: `TERMINATED! 💥` }]);
      setTargets((prev) => prev.filter((t) => t.id !== target.id));
    } else {
      playFailBuzz();
      setBursts((b) => [...b, { id: target.id, x: target.x, y: target.y, text: `PROD DB ALARM! ⚠️` }]);
    }

    setTimeout(() => {
      setBursts((b) => b.filter((item) => item.id !== target.id));
    }, 700);
  };

  return (
    <div className="ts-arcade-game ts-arcade-game--cloud">
      {/* Game HUD */}
      <div className="ts-arcade-hud">
        <div className="ts-arcade-hud__mission">
          <span className="ts-arcade-hud__icon">🧟</span>
          <span>Tap <strong>rogue GPU pods & idle servers</strong> to save cloud budget!</span>
        </div>
        <div className="ts-arcade-hud__progress">
          <span className="ts-arcade-hud__label">TERMINATED</span>
          <span className="ts-arcade-hud__value">{score}/{targetKills} 💥</span>
        </div>
      </div>

      {/* Sci-Fi Radar Arena */}
      <div className="ts-radar-arena">
        <div className="ts-radar-grid" />
        <div className="ts-radar-sweep" />

        {targets.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ts-cloud-node ${t.isRogue ? 'ts-cloud-node--rogue' : 'ts-cloud-node--safe'}`}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            onClick={() => handleTap(t)}
          >
            <span className="ts-cloud-node__icon">{t.icon}</span>
            <div className="ts-cloud-node__info">
              <span className="ts-cloud-node__title">{t.label}</span>
              <span className="ts-cloud-node__cost">{t.cost}</span>
            </div>
            <span className="ts-cloud-node__badge">{t.isRogue ? 'TERMINATE 💥' : 'KEEP 🛡️'}</span>
          </button>
        ))}

        {bursts.map((b) => (
          <div
            key={b.id}
            className="ts-cloud-burst"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          >
            {b.text}
          </div>
        ))}
      </div>

      {score >= targetKills && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🎉</span>
            <h3>Cloud Budget Saved!</h3>
            <p>You terminated {score} rogue instances and defended corporate spend!</p>
          </div>
        </div>
      )}
    </div>
  );
}
