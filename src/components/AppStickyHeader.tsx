interface AppStickyHeaderProps {
  className?: string;
  // Keep optional props so any call sites don't trigger TypeScript errors
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function AppStickyHeader({ className = '' }: AppStickyHeaderProps = {}) {
  return (
    <header className={`app-sticky-header ${className}`.trim()} aria-label="Wells Fargo Innovation Showcase 2026">
      <img
        src={`${import.meta.env.BASE_URL}summit-banner.png`}
        alt="Wells Fargo Innovation Showcase 2026 — Innovate, Adopt, Reuse. November 2nd, 2026 | Bangalore | Hyderabad"
        className="app-sticky-banner-img"
      />
    </header>
  );
}
