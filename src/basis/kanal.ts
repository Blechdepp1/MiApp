// Live-App für Milena unter /MiApp/ oder Testkanal für die Eltern unter /MiApp-Vorschau/
// (eigenes Repository Blechdepp1/MiApp-Vorschau, gleiche Website-Herkunft).
// Der Testkanal ist eine eigene Installation mit eigenen Daten auf dem Gerät und in Dropbox.
export const IST_VORSCHAU = import.meta.env.BASE_URL.endsWith('-Vorschau/');

export const KANAL = IST_VORSCHAU
  ? { datenbank: 'miapp-vorschau', dropboxOrdner: '/vorschau', speicherPraefix: 'miapp-vorschau' }
  : { datenbank: 'miapp', dropboxOrdner: '', speicherPraefix: 'miapp' };

// So heißt der Ordner in der eigenen Dropbox (App-Ordner der Dropbox-App „MiApp-Lernen“)
export const DROPBOX_ORDNER_ANZEIGE = `Apps/MiApp-Lernen${KANAL.dropboxOrdner}`;
