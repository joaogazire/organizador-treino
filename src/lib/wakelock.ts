// Mantém a tela acesa durante o treino (Screen Wake Lock API). Reaquire ao voltar para a aba.

type Sentinel = { release: () => Promise<void> };
let sentinel: Sentinel | null = null;
let wanted = false;

async function acquire() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } };
    if (wanted && nav.wakeLock && document.visibilityState === 'visible') sentinel = await nav.wakeLock.request('screen');
  } catch {
    /* não suportado / negado */
  }
}

function onVisibility() {
  if (document.visibilityState === 'visible') acquire();
}

export function keepAwake() {
  wanted = true;
  acquire();
  document.addEventListener('visibilitychange', onVisibility);
}

export function releaseAwake() {
  wanted = false;
  document.removeEventListener('visibilitychange', onVisibility);
  sentinel?.release().catch(() => {});
  sentinel = null;
}
