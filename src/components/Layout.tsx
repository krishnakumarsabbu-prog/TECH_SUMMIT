import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="ts-layout">
      <main className="ts-layout__main">{children}</main>
    </div>
  );
}
