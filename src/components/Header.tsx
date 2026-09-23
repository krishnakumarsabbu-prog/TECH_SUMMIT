export function Header() {
  return (
    <header className="ts-header" role="banner">
      <div className="ts-header__inner">
        <div className="ts-header__brand">
          <span className="ts-header__accent" aria-hidden="true" />
          <div className="ts-header__copy">
            <span className="ts-header__company">WELLSFARGO</span>
            <span className="ts-header__title">Technology Summit <strong>- 2026</strong></span>
          </div>
        </div>
        <span className="ts-header__tagline">INNOVATION <i aria-hidden="true" /> CONNECTION <i aria-hidden="true" /> IMPACT</span>
      </div>
    </header>
  );
}
