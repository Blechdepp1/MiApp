// Live-App für Milena unter /MiApp/ oder Testkanal für die Eltern unter /MiApp/vorschau/.
// Der Testkanal ist eine eigene Installation mit eigenen Daten auf dem Gerät und in Dropbox.
export const IST_VORSCHAU = import.meta.env.BASE_URL.endsWith('/vorschau/');

export const KANAL = IST_VORSCHAU
  ? { datenbank: 'miapp-vorschau', dropboxOrdner: '/vorschau', speicherPraefix: 'miapp-vorschau' }
  : { datenbank: 'miapp', dropboxOrdner: '', speicherPraefix: 'miapp' };
