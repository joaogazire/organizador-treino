# Coach Híbrido (nome provisório)

Coach diário de treino para celular: escolhe o dia, mostra o treino, e ao tocar em **Começar** guia cada série, descanso e tiro em tela cheia com countdown. No fim da semana, mostra e envia um relatório.

Baseado no plano [`docs/treino-hibrido.md`](docs/treino-hibrido.md) (4 musculações + 3 corridas por semana, ciclo de 8 semanas).
Planejamento completo, arquitetura e roadmap: [`docs/PLANEJAMENTO.md`](docs/PLANEJAMENTO.md).

**Site:** https://joaogazire.github.io/organizador-treino/

## Usar no celular

1. Abra o site no navegador do celular.
2. iPhone: Compartilhar → *Adicionar à Tela de Início*. Android: menu → *Instalar app*.
3. Abre como app, funciona offline e a tela não apaga durante o treino.

Os dados ficam só no aparelho (localStorage). Faça backup em **Ajustes → Exportar backup**.

## Desenvolvimento

```bash
npm install
npm run dev        # abre na rede local: acesse pelo IP no celular
npm test           # testes do motor de regras
npm run build      # typecheck + build em dist/
npm run icons      # regenera os PNGs do ícone
```

Stack: TypeScript + Preact + Vite, PWA com service worker próprio, Vitest. Deploy automático no GitHub Pages a cada push na `main` (`.github/workflows/deploy.yml`).

```
src/data/plan.ts     conteúdo do método (treinos, progressão)
src/engine/          regras puras e testadas (agenda, ciclo, passos, progressão, relatório)
src/store/           estado + localStorage + backup
src/lib/             wake lock, bipes/vibração, compartilhar
src/ui/              telas (provisórias até o design final)
```
