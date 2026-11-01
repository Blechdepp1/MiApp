import { NEU, VERSION_TEXT } from './version.ts';
import { VorleseKnopf } from './VorleseKnopf.tsx';
import './Version.css';

// Versionsnummer und „Was ist neu?“ in einfachen Worten
export function Version() {
  return (
    <section className="version" aria-label="Version">
      <p>
        MiApp Version <strong>{VERSION_TEXT}</strong>
      </p>
      {NEU.length > 0 && (
        <details>
          <summary>Was ist neu?</summary>
          <div className="version-neu">
            <VorleseKnopf text={`Was ist neu? ${NEU.join(' ')}`} />
            <ul>
              {NEU.map((punkt) => (
                <li key={punkt}>{punkt}</li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </section>
  );
}
