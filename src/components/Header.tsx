import { TicketIcon, TrophyIcon, CloseIcon } from './Icons';
import { AppStickyHeader } from './AppStickyHeader';

interface HeaderProps {
  completedCount?: number;
  isWinner?: boolean;
  onOpenPassport?: () => void;
  isPassportActive?: boolean;
}

export function Header({
  completedCount = 0,
  isWinner = false,
  onOpenPassport,
  isPassportActive = false,
}: HeaderProps) {
  return (
    <AppStickyHeader
      subtitle="Innovation Showcase 2026"
      rightAction={
        onOpenPassport ? (
          <button
            type="button"
            className="app-tag-pill"
            onClick={onOpenPassport}
            title="View your challenge passport and booth progress"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: isWinner ? 'var(--app-success-light)' : 'var(--app-primary-light)',
              border: `1px solid ${isWinner ? 'var(--app-success)' : 'rgba(37, 99, 235, 0.25)'}`,
              color: isWinner ? 'var(--app-success)' : 'var(--app-primary)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {isPassportActive ? <CloseIcon size={14} /> : isWinner ? <TrophyIcon size={14} /> : <TicketIcon size={14} />}
            </span>
            <span>
              {isPassportActive
                ? 'Close'
                : isWinner
                ? `Winner (${completedCount}/9)`
                : `Passport (${completedCount}/4)`}
            </span>
          </button>
        ) : undefined
      }
    />
  );
}
