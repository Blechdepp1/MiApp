// Kurze Fanfare (C-E-G-C) über die Web Audio API, ohne Audiodateien
export function spieleFanfare(): void {
  const Kontext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Kontext) return;
  try {
    const ctx = new Kontext();
    const start = ctx.currentTime + 0.05;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequenz, i) => {
      const ton = ctx.createOscillator();
      const lautstaerke = ctx.createGain();
      ton.type = 'triangle';
      ton.frequency.value = frequenz;
      const beginn = start + i * 0.13;
      const dauer = i === 3 ? 0.5 : 0.18;
      lautstaerke.gain.setValueAtTime(0.0001, beginn);
      lautstaerke.gain.exponentialRampToValueAtTime(0.25, beginn + 0.02);
      lautstaerke.gain.exponentialRampToValueAtTime(0.0001, beginn + dauer);
      ton.connect(lautstaerke).connect(ctx.destination);
      ton.start(beginn);
      ton.stop(beginn + dauer + 0.05);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Ton ist nur Zugabe
  }
}
