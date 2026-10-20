interface HeaderProps {
  completedCount?: number;
  isWinner?: boolean;
  onOpenPassport?: () => void;
  isPassportActive?: boolean;
  onGoHome?: () => void;
  onOpenAdmin?: () => void;
}

export function Header({
  completedCount = 0,
  isWinner = false,
  onOpenPassport,
  isPassportActive = false,
  onGoHome,
  onOpenAdmin,
}: HeaderProps) {
  return (
    <header className="ts-header" role="banner">
      <div className="ts-header__inner">
        <div
          className="ts-header__brand"
          onClick={onGoHome}
          style={onGoHome ? { cursor: 'pointer' } : undefined}
          title={onGoHome ? 'Go to Innovation Showcase 2026 landing page' : undefined}
        >
          <span className="ts-header__accent" aria-hidden="true" />
          <div className="ts-header__copy">
            <span className="ts-header__company">WELLSFARGO</span>
            <span className="ts-header__title">
              Innovation Showcase <strong>- 2026</strong>
            </span>
          </div>
        </div>

        <div className="ts-header__right">
          <span className="ts-header__tagline">
            INNOVATE <i aria-hidden="true" /> ADOPT <i aria-hidden="true" /> REUSE
          </span>

          {onOpenPassport && (
            <button
              type="button"
              className={`ts-header__passport-btn ${isWinner ? 'ts-header__passport-btn--winner' : ''}`}
              onClick={onOpenPassport}
              title="View your challenge passport and booth progress"
            >
              <span className="ts-header__passport-icon">{isWinner ? '🏆' : '🏅'}</span>
              <span className="ts-header__passport-text">
                {isPassportActive
                  ? 'Close Passport'
                  : isWinner
                  ? `Winner (${completedCount}/9)`
                  : `Passport (${completedCount}/4)`}
              </span>
            </button>
          )}

          {onOpenAdmin && (
            <button
              type="button"
              className="ts-header__admin-icon-btn"
              onClick={onOpenAdmin}
              title="Organizer Admin Portal & Dashboard Sync"
              aria-label="Organizer Login and Sync"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
                <path d="M12 17.2v1.8" strokeWidth="2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
