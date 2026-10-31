import { useState } from 'react';
import type { QuizQuestion } from '../../types';
import { ZombieGPUGame } from './ZombieGPUGame';
import { PhishSwipeGame } from './PhishSwipeGame';
import { CodeRoastGame } from './CodeRoastGame';
import { DnsFirefighterGame } from './DnsFirefighterGame';
import { PipelineOrderGame } from './PipelineOrderGame';
import { PromptWhispererGame } from './PromptWhispererGame';
import { FraudBlitzGame } from './FraudBlitzGame';
import { EmojiDecipherGame } from './EmojiDecipherGame';
import { GameRunner } from './GameRunner';

// New emoji-based game types handled by GameRunner
const EMOJI_GAME_TYPES = new Set([
  'memory_missing', 'grid_tap', 'odd_one', 'pair_match',
  'sequence', 'timer_stop', 'luck_pick', 'sort_bucket',
  'pattern_quiz', 'crowd_judge',
]);

interface MiniGameCardProps {
  question: QuizQuestion;
  selectedIndex: number | null;
  onComplete: (success: boolean) => void;
}

function getCleanCategoryPill(category: string): { icon: string; label: string } {
  const c = (category || '').toLowerCase();
  if (c.includes('mini game') || c.includes('mini-game')) {
    return { icon: '🎮', label: 'FUN MINI-GAME' };
  }
  if (c.includes('data') || c.includes('govern') || c.includes('security') || c.includes('lineage')) {
    return { icon: '🗄️', label: 'DATA & SECURITY' };
  }
  if (c.includes('cloud') || c.includes('platform') || c.includes('modernization')) {
    return { icon: '☁️', label: 'CLOUD & ARCHITECTURE' };
  }
  if (c.includes('agent') || c.includes('bank') || c.includes('identity')) {
    return { icon: '🤖', label: 'AGENTS & DIGITAL BANKING' };
  }
  if (c.includes('software') || c.includes('dev') || c.includes('developer')) {
    return { icon: '⚡', label: 'DEV PRODUCTIVITY' };
  }
  if (c.includes('enterprise ai') || c.includes('operations')) {
    return { icon: '🧠', label: 'AI PLATFORM & OPS' };
  }
  if (c.includes('bi') || c.includes('process') || c.includes('automation')) {
    return { icon: '📊', label: 'AI BI & AUTOMATION' };
  }
  if (c.includes('risk') || c.includes('teammate')) {
    return { icon: '🛡️', label: 'RISK INTELLIGENCE' };
  }
  if (c.includes('sre') || c.includes('intelligent enterprise')) {
    return { icon: '🖥️', label: 'SRE & PLATFORMS' };
  }
  if (c.includes('quality') || c.includes('accelerat')) {
    return { icon: '🚀', label: 'QUALITY & AUTOMATION' };
  }
  return { icon: '💎', label: (category || 'TECH CHALLENGE').toUpperCase() };
}

export function MiniGameCard({ question, selectedIndex, onComplete }: MiniGameCardProps) {
  // If already answered in persisted state (e.g. reload), show completed badge
  const [completed, setCompleted] = useState<boolean | null>(selectedIndex !== null ? selectedIndex === question.correctAnswer : null);

  const handleGameFinish = (won: boolean) => {
    setCompleted(won);
    onComplete(won);
  };

  const renderGame = () => {
    // Route new emoji-based fun games to the unified GameRunner
    if (question.gameType && EMOJI_GAME_TYPES.has(question.gameType)) {
      return <GameRunner question={question} onDone={handleGameFinish} />;
    }

    // Legacy tech games (kept for backward compatibility with existing JSON data)
    switch (question.gameType) {
      case 'zombie_gpu':
        return <ZombieGPUGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'phish_swipe':
        return <PhishSwipeGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'code_roast':
        return <CodeRoastGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'dns_firefighter':
        return <DnsFirefighterGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'pipeline_order':
        return <PipelineOrderGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'prompt_whisperer':
        return <PromptWhispererGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'fraud_blitz':
        return <FraudBlitzGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'emoji_decipher':
        return <EmojiDecipherGame onFinish={handleGameFinish} gameData={question.gameData} />;
      default:
        // Fallback: try GameRunner for any unknown future game type
        return <GameRunner question={question} onDone={handleGameFinish} />;
    }
  };

  const catPill = getCleanCategoryPill(question.category);

  return (
    <div className="ts-question-card ts-question-card--game">
      <div className="ts-game-card-header">
        <div className="ts-game-badge-group">
          <span className="ts-game-pill ts-game-pill--challenge">
            <span aria-hidden="true">🎮</span> MINI-GAME CHALLENGE
          </span>
          <span className="ts-game-pill ts-game-pill--category">
            <span aria-hidden="true">{catPill.icon}</span> {catPill.label}
          </span>
        </div>

        {completed !== null && (
          <div className={`ts-game-status-pill ${completed ? 'ts-game-status-pill--won' : 'ts-game-status-pill--failed'}`}>
            {completed ? '✓ CHALLENGE COMPLETED (+1 PTS)' : '❌ CHALLENGE FAILED (0 PTS)'}
          </div>
        )}
      </div>

      <h2 className="ts-question-card__text">{question.question}</h2>

      <div className="ts-game-wrapper">
        {renderGame()}
      </div>
    </div>
  );
}

