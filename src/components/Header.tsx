export function Header() {
  return (
    <header className="ts-header" role="banner">
      <div className="ts-header__logo-wrap">
        <img
          className="ts-header__logo"
          src="/image.png"
          alt="Wells Fargo"
        />
      </div>
      <div className="ts-header__inner">
        <div className="ts-header__brand">
          <span className="ts-header__mark" aria-hidden="true">TS</span>
          <span className="ts-header__title">TECHNOLOGY SUMMIT</span>
        </div>
        <span className="ts-header__year">2026</span>
      </div>
    </header>
  );
}
