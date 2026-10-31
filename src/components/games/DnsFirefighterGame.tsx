import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface DnsFirefighterGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    targetWhacks?: number;
  };
}

const FALSE_BLADES = [
  { name: 'Gateway Router', status: 'ONLINE', icon: '🌐' },
  { name: 'Auth Keycloak', status: 'OPTIMAL', icon: '🔐' },
  { name: 'Redis Cache', status: 'HIT 99%', icon: '⚡' },
  { name: 'Postgres DB', status: 'NORMAL', icon: '🗄️' },
];

export function DnsFirefighterGame({ onFinish, gameData }: DnsFirefighterGameProps) {
  const targetWhacks = gameData?.targetWhacks ?? 3;
  const [whackedCount, setWhackedCount] = useState(0);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [gameOver, setGameOver] = useState(false);
  const [tapEffect, setTapEffect] = useState<number | null>(null);

  // Shift overheating DNS blade slot every 900ms to make it an active whacking game
  useEffect(() => {
    if (gameOver) return;
    const slotTimer = setInterval(() => {
      setActiveSlot(Math.floor(Math.random() * 4));
    }, 900);
    return () => clearInterval(slotTimer);
  }, [gameOver]);

  // Check victory
  useEffect(() => {
    if (whackedCount >= targetWhacks && !gameOver) {
      setGameOver(true);
      playSuccessChime();
      setTimeout(() => onFinish(true), 1200);
    }
  }, [whackedCount, targetWhacks, gameOver, onFinish]);

  const handleBladeClick = (slotIdx: number) => {
    if (gameOver) return;

    if (slotIdx === activeSlot) {
      playZapSound();
      setTapEffect(slotIdx);
      setWhackedCount((w) => w + 1);
      setActiveSlot((prev) => (prev + 1 + Math.floor(Math.random() * 3)) % 4);
      setTimeout(() => setTapEffect(null), 350);
    } else {
      playFailBuzz();
    }
  };

  const blades = [0, 1, 2, 3].map((slotIdx) => {
    const isDns = slotIdx === activeSlot;
    if (isDns) {
      return {
        id: slotIdx,
        title: 'DNS RESOLVER',
        status: 'NXDOMAIN 100% 🔥',
        subtext: 'TAP TO FLUSH!',
        isAlarm: true,
        icon: '🚨',
      };
    }
    const falseBlade = FALSE_BLADES[(slotIdx + whackedCount) % FALSE_BLADES.length];
    return {
      id: slotIdx,
      title: falseBlade.name,
      status: falseBlade.status,
      subtext: 'HEALTHY',
      isAlarm: false,
      icon: falseBlade.icon,
    };
  });

  return (
    <div className="ts-arcade-game ts-arcade-game--dns">
      {/* Game HUD Bar */}
      <div className="ts-arcade-hud">
        <div className="ts-arcade-hud__mission">
          <span className="ts-arcade-hud__icon">🚨</span>
          <span>Tap the overheating <strong>DNS RESOLVER</strong> to flush the cache!</span>
        </div>
        <div className="ts-arcade-hud__progress">
          <span className="ts-arcade-hud__label">FLUSHED</span>
          <span className="ts-arcade-hud__value">{whackedCount}/{targetWhacks} 🧯</span>
        </div>
      </div>

      {/* Visual Server Rack */}
      <div className="ts-server-rack">
        <div className="ts-server-rack__header">
          <div className="ts-rack-leds">
            <span className="ts-rack-led ts-rack-led--red" />
            <span className="ts-rack-led ts-rack-led--amber" />
            <span className="ts-rack-led ts-rack-led--green" />
          </div>
          <span className="ts-server-rack__title">MAINFRAME CLUSTER #402 • STATUS: OUTAGE</span>
          <span className="ts-server-rack__ping">ALARM ACTIVE</span>
        </div>

        <div className="ts-rack-blades">
          {blades.map((blade, idx) => (
            <button
              key={idx}
              type="button"
              className={`ts-rack-blade ${blade.isAlarm ? 'ts-rack-blade--alarm' : 'ts-rack-blade--healthy'} ${tapEffect === idx ? 'ts-rack-blade--tapped' : ''}`}
              onClick={() => handleBladeClick(idx)}
              disabled={gameOver}
            >
              <div className="ts-rack-blade__left">
                <span className="ts-rack-blade__icon">{blade.icon}</span>
                <div className="ts-rack-blade__details">
                  <span className="ts-rack-blade__name">{blade.title}</span>
                  <span className="ts-rack-blade__subtext">{blade.subtext}</span>
                </div>
              </div>
              <span className={`ts-rack-blade__status ${blade.isAlarm ? 'ts-rack-blade__status--alarm' : ''}`}>
                {blade.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Victory Celebration Overlay */}
      {whackedCount >= targetWhacks && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🧯</span>
            <h3>DNS Flushed & Resolved!</h3>
            <p>Cluster restored to 100% operational status!</p>
          </div>
        </div>
      )}
    </div>
  );
}
