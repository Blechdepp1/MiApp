import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHinweis } from './AppHinweis.tsx';
import { beobachteInstallation, installierbar } from './installieren.ts';

describe('Hinweis „Als App installieren“', () => {
  beforeEach(() => localStorage.clear());

  it('erscheint nicht in der installierten App', () => {
    render(<AppHinweis alsApp />);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('erklärt im Browser, wie es ins Vollbild geht, und lässt sich ausblenden', async () => {
    const { unmount } = render(<AppHinweis alsApp={false} />);
    expect(screen.getByText(/Zum Startbildschirm hinzufügen/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Nicht mehr zeigen' }));
    expect(screen.queryByRole('complementary')).toBeNull();
    unmount();
    render(<AppHinweis alsApp={false} />);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('bietet die Installation an, wenn Chrome sie erlaubt', async () => {
    const fenster = new EventTarget() as unknown as Window;
    beobachteInstallation(fenster);
    const prompt = vi.fn(async () => {});
    render(<AppHinweis alsApp={false} />);
    act(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(e, { prompt });
      fenster.dispatchEvent(e);
    });
    expect(installierbar()).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: '📲 Als App installieren' }));
    expect(prompt).toHaveBeenCalled();
    expect(installierbar()).toBe(false);
  });
});
