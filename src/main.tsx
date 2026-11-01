import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { IST_VORSCHAU } from './basis/kanal.ts';
import { beobachteSichtbarenBereich } from './basis/sichtbarerBereich.ts';
import { istRueckkehrVonDropbox } from './sync/verbindung.ts';

// Nach der Dropbox-Anmeldung landet man auf der Startadresse: direkt in den Eltern-Bereich
if (istRueckkehrVonDropbox()) window.location.hash = '#/eltern';

beobachteSichtbarenBereich();

if (IST_VORSCHAU) document.title = `🧪 Test – ${document.title}`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
