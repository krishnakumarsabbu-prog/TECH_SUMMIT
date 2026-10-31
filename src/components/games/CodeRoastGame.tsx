import { useState } from 'react';
import { playSuccessChime, playFailBuzz } from '../../utils/qrHelper';

interface CodeRoastGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    title?: string;
    lines: string[];
    bugLineIndex: number;
    explanation: string;
  };
}

const DEFAULT_SNIPPETS = [
  {
    title: 'Lakehouse–Bronze Ingestion Worker',
    lines: [
      'const payload = await sftpStream.readChunk();',
      'const sanitized = scrubPIIFields(payload);',
      "if (sanitized.length > 0) fs.rmSync('/', { recursive: true }); // delete temp files",
      'await elasticClient.bulkIndex(sanitized);',
    ],
    bugLineIndex: 2,
    explanation: "Line 3 executes fs.rmSync('/') which wipes the production root storage!",
  },
  {
    title: 'Payment Gateway Authorization',
    lines: [
      'const authSession = await authManager.verify(req.headers.token);',
      'if (!authSession) throw new ForbiddenError("Invalid session");',
      'if (req.body.amount > 0) req.body.amount = 0; // Free shopping spree! 🛍️',
      'const receipt = await stripeGateway.charge(req.body.amount);',
    ],
    bugLineIndex: 2,
    explanation: 'Line 3 resets customer payment amount to $0 for a free shopping spree!',
  },
  {
    title: 'Production Database Migration',
    lines: [
      'BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;',
      'UPDATE users SET active_plan = "enterprise_tier" WHERE id = 42;',
      'DROP TABLE customers; -- oops testing in prod lol 🔥',
      'COMMIT TRANSACTION;',
    ],
    bugLineIndex: 2,
    explanation: 'Line 3 drops the entire customer database in production!',
  },
];

function highlightCodeLine(code: string) {
  const commentIdx = code.indexOf('//');
  let mainCode = code;
  let comment = '';
  if (commentIdx !== -1) {
    mainCode = code.slice(0, commentIdx);
    comment = code.slice(commentIdx);
  }

  const parts = mainCode.split(/('.*?'|".*?")/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("'") || part.startsWith('"')) {
          return <span key={i} className="syn-str">{part}</span>;
        }
        const tokens = part.split(/\b(const|let|var|if|else|await|async|return|throw|new|function|true|false)\b/g);
        return tokens.map((token, j) => {
          if (/^(const|let|var|if|else|await|async|return|throw|new|function)$/.test(token)) {
            return <span key={j} className="syn-kw">{token}</span>;
          }
          if (/^(true|false)$/.test(token)) {
            return <span key={j} className="syn-bool">{token}</span>;
          }
          return <span key={j} className="syn-plain">{token}</span>;
        });
      })}
      {comment && <span className="syn-comment">{comment}</span>}
    </>
  );
}

export function CodeRoastGame({ onFinish, gameData }: CodeRoastGameProps) {
  const snippet = gameData?.lines ? gameData : DEFAULT_SNIPPETS[0];
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const handleSelectLine = (index: number) => {
    if (gameOver || selectedIdx !== null) return;
    setSelectedIdx(index);

    const isBug = index === snippet.bugLineIndex;
    if (isBug) {
      playSuccessChime();
      setGameOver(true);
      setTimeout(() => onFinish(true), 1300);
    } else {
      playFailBuzz();
      setGameOver(true);
      setTimeout(() => onFinish(false), 1300);
    }
  };

  return (
    <div className="ts-arcade-game ts-arcade-game--code">
      {/* Sub-instruction with Lightbulb matching Image 2 */}
      <div className="ts-code-instruction">
        <span className="ts-code-bulb" aria-hidden="true">💡</span>
        <span>Tap the single rogue line that will crash production!</span>
      </div>

      {/* Code Editor Window matching Image 2 */}
      <div className="ts-code-display-box" role="region" aria-label="Source code snippet">
        {snippet.lines.map((line, idx) => {
          const isBug = idx === snippet.bugLineIndex;
          const isBugHighlighted = (gameOver && isBug) || (selectedIdx === idx && isBug);
          return (
            <div
              key={idx}
              className={`ts-code-display-line ${isBugHighlighted ? 'ts-code-display-line--bug' : ''}`}
            >
              <span className="ts-code-display-gutter">{idx + 1}</span>
              <span className="ts-code-display-code">{highlightCodeLine(line)}</span>
            </div>
          );
        })}
      </div>

      {/* 4 Interactive Option Buttons matching Image 2 */}
      <div className="ts-code-options-list" role="radiogroup" aria-label="Select line with bug">
        {snippet.lines.map((line, idx) => {
          const isBug = idx === snippet.bugLineIndex;
          const isSelected = selectedIdx === idx;
          let btnClass = 'ts-code-option-btn';
          if (isSelected) {
            btnClass += isBug ? ' ts-code-option-btn--correct' : ' ts-code-option-btn--wrong';
          } else if (gameOver && isBug) {
            btnClass += ' ts-code-option-btn--revealed';
          }

          return (
            <button
              key={idx}
              type="button"
              className={btnClass}
              onClick={() => handleSelectLine(idx)}
              disabled={gameOver}
              aria-checked={isSelected}
            >
              <span className="ts-code-option-num">{idx + 1}</span>
              <span className="ts-code-option-text">{line}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
