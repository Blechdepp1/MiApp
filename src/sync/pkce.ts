// PKCE (RFC 7636): Anmeldung ohne App-Secret, geeignet für Apps im Browser

function base64url(bytes: Uint8Array): string {
  let binaer = '';
  for (const b of bytes) binaer += String.fromCharCode(b);
  return btoa(binaer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function zufallsText(laenge = 64): string {
  const bytes = new Uint8Array(laenge);
  crypto.getRandomValues(bytes);
  return base64url(bytes).slice(0, laenge);
}

export async function codeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(hash));
}
