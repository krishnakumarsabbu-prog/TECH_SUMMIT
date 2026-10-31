import type { ReactNode } from 'react';
import { EventBanner } from './EventBanner';

interface LayoutProps {
  children: ReactNode;
  wide?: boolean;
  showBanner?: boolean;
}

export function Layout({ children, wide = false, showBanner = true }: LayoutProps) {
  return (
    <div className={`ts-layout${wide ? ' ts-layout--wide' : ''}`}>
      <main className="ts-layout__main">
        {showBanner && <EventBanner />}
        {children}
      </main>
    </div>
  );
}
