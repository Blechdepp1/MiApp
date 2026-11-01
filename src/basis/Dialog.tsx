import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

// Echter modaler Dialog (<dialog> mit showModal): Der Fokus bleibt im Dialog, der Hintergrund
// ist für Tastatur und Screenreader gesperrt, Escape bzw. die Zurück-Geste löst onAbbrechen aus,
// und nach dem Schließen springt der Fokus dorthin zurück, wo er vorher war.
export function Dialog({
  className,
  label,
  beschriftetVon,
  startFokus,
  onAbbrechen,
  children,
}: {
  className: string;
  label?: string;
  beschriftetVon?: string;
  startFokus?: RefObject<HTMLElement | null>;
  onAbbrechen: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const vorher = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!d.open) {
      try {
        d.showModal();
      } catch {
        // Ältere Browser oder Testumgebung ohne showModal: wenigstens anzeigen
        d.setAttribute('open', '');
      }
    }
    startFokus?.current?.focus();
    return () => {
      if (d.open && typeof d.close === 'function') d.close();
      vorher?.focus();
    };
    // Nur beim Öffnen; startFokus ist eine Ref und ändert sich nicht
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog
      ref={dialog}
      className={className}
      aria-label={label}
      aria-labelledby={beschriftetVon}
      onCancel={(e) => {
        e.preventDefault();
        onAbbrechen();
      }}
    >
      {children}
    </dialog>
  );
}
