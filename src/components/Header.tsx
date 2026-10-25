interface HeaderProps {
  completedCount?: number;
  isWinner?: boolean;
  onOpenPassport?: () => void;
  isPassportActive?: boolean;
  onGoHome?: () => void;
}

export function Header({
  completedCount = 0,
  isWinner = false,
  onOpenPassport,
  isPassportActive = false,
  onGoHome,
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
              <span className="ts-header__passport-text ts-header__passport-text--full">
                {isPassportActive
                  ? 'Close Passport'
                  : isWinner
                  ? `Winner (${completedCount}/9)`
                  : `Passport (${completedCount}/4)`}
              </span>
              <span className="ts-header__passport-text ts-header__passport-text--compact">
                {isPassportActive
                  ? 'Close'
                  : isWinner
                  ? `Winner (${completedCount})`
                  : `${completedCount}/4`}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
