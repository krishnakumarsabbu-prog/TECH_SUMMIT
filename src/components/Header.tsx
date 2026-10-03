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
    <header className="ts-header" role="banner">
      <div className="ts-header__inner">
        <div className="ts-header__brand">
          <span className="ts-header__accent" aria-hidden="true" />
          <div className="ts-header__copy">
            <span className="ts-header__company">WELLSFARGO</span>
            <span className="ts-header__title">
              Technology Summit <strong>- 2026</strong>
            </span>
          </div>
        </div>

        <div className="ts-header__right">
          <span className="ts-header__tagline">
            INNOVATION <i aria-hidden="true" /> CONNECTION <i aria-hidden="true" /> IMPACT
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
        </div>
      </div>
    </header>
  );
}
