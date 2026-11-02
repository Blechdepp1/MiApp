import { useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'> & {
  value: string;
  onChange: (wert: string) => void;
};

// Einzeiliger Eintrag, der bei langem Text umbricht und in die Höhe wächst, statt ihn abzuschneiden
// (z. B. „to be (am/is/are)“ auf dem Handy). Zeilenumbrüche gibt es keine: Enter fügt nichts ein.
export function MitwachsendesFeld({ value, onChange, onKeyDown, ...rest }: Props) {
  const feld = useRef<HTMLTextAreaElement>(null);

  function anpassen() {
    const f = feld.current;
    if (!f) return;
    f.style.height = 'auto';
    // scrollHeight ohne Rahmen; der Rahmen kommt dazu, sonst erscheint ein Scrollbalken
    f.style.height = `${f.scrollHeight + f.offsetHeight - f.clientHeight}px`;
  }

  useLayoutEffect(anpassen, [value]);
  useEffect(() => {
    // Beim Drehen des Handys ändert sich die Breite und damit die nötige Höhe
    window.addEventListener('resize', anpassen);
    return () => window.removeEventListener('resize', anpassen);
  }, []);

  return (
    <textarea
      ref={feld}
      rows={1}
      className="mitwachsend"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\s*\n\s*/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
        onKeyDown?.(e);
      }}
      {...rest}
    />
  );
}
