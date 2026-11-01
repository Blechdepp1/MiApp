import { useSync } from './SyncKontext.tsx';

// Für den Eltern-Bereich: Wann wurde zuletzt abgeglichen, gab es Probleme?
export function SyncStatus() {
  const { verbunden, laeuft, zuletzt, fehler, abgleichen } = useSync();
  if (!verbunden) return null;
  return (
    <section className="verbinden">
      <h2>Abgleich</h2>
      <p role="status">
        {laeuft
          ? 'Wird gerade abgeglichen …'
          : zuletzt
            ? `Zuletzt abgeglichen um ${zuletzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
            : 'Noch nicht abgeglichen'}
      </p>
      {fehler && !laeuft && (
        <p className="verbinden-fehler" role="alert">
          {fehler}
        </p>
      )}
      <div className="verbinden-knoepfe">
        <button type="button" onClick={abgleichen} disabled={laeuft}>
          Jetzt abgleichen
        </button>
      </div>
    </section>
  );
}
