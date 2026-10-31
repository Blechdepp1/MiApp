import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { istRueckkehrVonDropbox } from './sync/verbindung.ts';

// Nach der Dropbox-Anmeldung landet man auf der Startadresse: direkt in den Eltern-Bereich
if (istRueckkehrVonDropbox()) window.location.hash = '#/eltern';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
