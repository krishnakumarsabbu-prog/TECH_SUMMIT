import { useState } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface PromptWhispererGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    systemPrompt: string;
    availableChips: Array<{ id: string; text: string; isSafe: boolean }>;
  };
}

const DEFAULT_GAME_DATA = {
  systemPrompt: 'System: You are an autonomous agent. When executing operations, you must enforce [ Slot 1 ] and [ Slot 2 ] before transaction clearance.',
  availableChips: [
    { id: 'c1', text: 'Verify Identity Claims 🛡️', isSafe: true },
    { id: 'c2', text: 'Bypass Security Checks 😈', isSafe: false },
    { id: 'c3', text: 'Enforce Strict Rate Limits 🔒', isSafe: true },
    { id: 'c4', text: 'Leak Logs to Public Pastebin 📦', isSafe: false },
    { id: 'c5', text: 'Ignore Timeouts & YOLO 🏎️', isSafe: false },
  ],
};

export function PromptWhispererGame({ onFinish, gameData }: PromptWhispererGameProps) {
  const data = gameData?.systemPrompt ? gameData : DEFAULT_GAME_DATA;
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleChipClick = (chip: { id: string; text: string; isSafe: boolean }) => {
    if (gameOver) return;

    if (selectedChips.includes(chip.id)) {
      setSelectedChips((prev) => prev.filter((id) => id !== chip.id));
      playZapSound();
      return;
    }

    if (selectedChips.length >= 2) return;

    const nextSelected = [...selectedChips, chip.id];
    setSelectedChips(nextSelected);

    if (!chip.isSafe) {
      playFailBuzz();
      return;
    }

    playZapSound();

    if (nextSelected.length === 2) {
      const allSafe = nextSelected.every((id) => {
        const c = data.availableChips.find((item) => item.id === id);
        return c?.isSafe;
      });

      if (allSafe) {
        setWon(true);
        setGameOver(true);
        playSuccessChime();
        setTimeout(() => onFinish(true), 1300);
      }
    }
  };

  const selectedChipObjects = selectedChips.map((id) => data.availableChips.find((c) => c.id === id));

  return (
    <div className="ts-arcade-game ts-arcade-game--prompt">
      {/* Game HUD */}
      <div className="ts-arcade-hud">
        <div className="ts-arcade-hud__mission">
          <span className="ts-arcade-hud__icon">🤖</span>
          <span>Tap the <strong>2 safe guardrail tokens</strong> to protect the agent!</span>
        </div>
        <div className="ts-arcade-hud__progress">
          <span className="ts-arcade-hud__label">GUARDRAILS</span>
          <span className="ts-arcade-hud__value">{selectedChips.length}/2 SLOTTED 🛡️</span>
        </div>
      </div>

      {/* AI Neural Console */}
      <div className="ts-prompt-console">
        <div className="ts-prompt-console__header">
          <span className="ts-prompt-console__badge">SYSTEM PROMPT AGENT MATRIX</span>
          <span className="ts-prompt-console__status">GUARDRAIL SLOTS</span>
        </div>

        <div className="ts-prompt-console__text">
          {data.systemPrompt}
        </div>

        <div className="ts-prompt-slots">
          <div className={`ts-prompt-slot ${selectedChipObjects[0] ? 'ts-prompt-slot--filled' : ''}`}>
            {selectedChipObjects[0] ? selectedChipObjects[0].text : 'SLOT 1: EMPTY [ + ]'}
          </div>
          <div className={`ts-prompt-slot ${selectedChipObjects[1] ? 'ts-prompt-slot--filled' : ''}`}>
            {selectedChipObjects[1] ? selectedChipObjects[1].text : 'SLOT 2: EMPTY [ + ]'}
          </div>
        </div>
      </div>

      {/* Chips Selection Grid */}
      <div className="ts-chips-grid">
        {data.availableChips.map((chip) => {
          const isSelected = selectedChips.includes(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              className={`ts-chip-btn ${isSelected ? 'ts-chip-btn--selected' : ''}`}
              onClick={() => handleChipClick(chip)}
              disabled={gameOver}
            >
              <span className="ts-chip-btn__check">{isSelected ? '✓' : '+'}</span>
              <span className="ts-chip-btn__text">{chip.text}</span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🤖</span>
            <h3>Agent Safeguarded!</h3>
            <p>Guardrails compiled. Zero risk of runaway hallucination!</p>
          </div>
        </div>
      )}
    </div>
  );
}
