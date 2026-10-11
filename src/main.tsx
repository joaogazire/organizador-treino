import { render } from 'preact';
import { unlockAudio } from './lib/feedback';
import { App } from './ui/App';
import './styles.css';

render(<App />, document.getElementById('app')!);

// Destrava o áudio no primeiro toque (exigência do iOS) para os bipes do countdown.
document.addEventListener('pointerdown', unlockAudio, { once: false, passive: true });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
