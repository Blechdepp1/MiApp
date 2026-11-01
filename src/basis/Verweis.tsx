import type { MouseEvent, ReactNode } from 'react';
import { navigiere, pfad, type Ziel } from './navigation.ts';

// Link innerhalb der App: echtes <a href> (Barrierefreiheit), aber mit flachem Verlauf
export function Verweis({
  ziel,
  className,
  children,
  ...rest
}: {
  ziel: Ziel;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}) {
  function klick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigiere(ziel);
  }
  return (
    <a href={pfad(ziel)} className={className} onClick={klick} {...rest}>
      {children}
    </a>
  );
}
