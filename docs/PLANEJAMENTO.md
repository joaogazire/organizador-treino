# Planejamento — Organizador de Treino (nome provisório: **Coach Híbrido**)

> Coach diário de treinos para celular, baseado em [`treino-hibrido.md`](./treino-hibrido.md).
> Versão do plano: 2026-10-11 · Status: MVP (v0.1) implementado e publicado no GitHub Pages.

---

## 1. Objetivo

Um site, usado **só no celular**, que:

1. Sabe qual treino fazer em cada dia da semana, a partir de onde vou estar (casa/escritório) e da semana do ciclo de 8 semanas.
2. Ao escolher o dia (o padrão é hoje), mostra o treino completo daquele dia (manhã e noite).
3. Ao apertar **Começar**, ocupa a tela inteira com o exercício atual, um **countdown** grande, e me guia passo a passo (série → descanso → próxima série…).
4. Registra o que eu fiz (cargas, reps, sensação) e sugere progressão.
5. No fim da semana **mostra e envia** um relatório da semana.

Fora do escopo agora: nome definitivo, identidade visual e UX final (decididos depois), contas de usuário, sincronização entre aparelhos.

---

## 2. Decisões de arquitetura

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Tipo de app | **SPA estática + PWA** (instalável, funciona offline) | GitHub Pages só serve arquivos estáticos; academia costuma ter sinal ruim; "Adicionar à tela inicial" deixa com cara de app. |
| Linguagem | **TypeScript** | As regras de atribuição de treino e progressão têm muitos casos; tipos + testes evitam erro silencioso. |
| UI | **Preact** (~4 kB) com hooks | API de React (fácil de evoluir/achar ajuda) com bundle mínimo, ótimo para celular. Sem framework pesado. |
| Build | **Vite** | Build rápido, base relativa para o Pages, dev server acessível pelo celular na rede local (`npm run dev`). |
| Testes | **Vitest** | Motor de regras (agenda da semana, ciclo, passos do player, relatório) é função pura e 100% testável. |
| Estado / dados | **localStorage** (JSON versionado) + **exportar/importar backup** | Sem backend; dado é só meu. Backup manual protege contra limpeza do navegador (principalmente iOS). |
| Offline | **Service worker escrito à mão** (`public/sw.js`) | Network-first para a página, stale-while-revalidate para assets. Sem dependência extra (Workbox). |
| Deploy | **GitHub Actions → branch `gh-pages`** | A cada push na `main`: testes, typecheck, build e publicação. |
| Estilo | CSS puro com **tokens** (`:root` vars), tema escuro | Design será trocado depois: basta mexer nos tokens/componentes, sem tocar no motor. |

### Separação em camadas

```
src/
  data/plan.ts        ← o "conteúdo" do método (treinos, exercícios, progressão 8 semanas). Trocar o plano = mexer só aqui.
  engine/             ← regras puras, sem DOM (testadas)
    dates.ts          ← datas locais, semana seg–dom, chaves YYYY-MM-DD
    cycle.ts          ← semana do ciclo (1–8, depois recomeça da 3)
    schedule.ts       ← casa/escritório → tipo de dia de cada dia da semana
    steps.ts          ← transforma um treino em passos do player (trabalho/descanso/tempo)
    progression.ts    ← sugestão de carga com base no último registro
    report.ts         ← relatório semanal (números + texto para compartilhar)
  store/storage.ts    ← persistência, migração de versão, backup
  lib/                ← efeitos do navegador: wake lock, bipe/vibração, compartilhar
  ui/                 ← telas e componentes (descartáveis quando vier o design final)
```

Regra de ouro do código: **UI nunca decide treino**. Toda regra do método fica em `engine/` + `data/`, com teste.

---

## 3. Fluxos de uso (UX provisória)

Navegação inferior com 4 abas: **Hoje · Semana · Relatório · Ajustes**.

### 3.1 Primeiro acesso
- Pergunta a **data de início do ciclo** (padrão: segunda desta semana), velocidade atual dos tiros (padrão 12 km/h) e da rodagem (9,25 km/h).

### 3.2 Hoje (tela principal)
- Faixa com os 7 dias (Seg…Dom); hoje vem selecionado. Tocar em outro dia mostra o treino dele.
- Cabeçalho: semana do ciclo ("Semana 3 de 8 · RIR 1–2"), tipo do dia ("Casa 1").
- Para dias úteis: botão casa/escritório para trocar ali mesmo (recalcula a semana).
- Cards por sessão (Manhã / Noite) com lista de exercícios/blocos, duração estimada e botão **Começar**.
- Status ✓ quando a sessão foi concluída.
- Dias de escritório: opção "Versão 25 min" (3 primeiros exercícios, 3 séries).
- `flexivel`: Peito extra marcado como opcional, com botão "Descansar hoje".

### 3.3 Player (tela cheia)
- Tela inteira, tela **não apaga** (Wake Lock), texto enorme.
- Topo: progresso (barra + "Exercício 2/6 · Série 3/4"), botão sair/pausar.
- **Série de musculação**: nome do exercício, alvo (ex.: "6–8 reps · RIR 2"), equipamento, dica de carga ("Última: 40 kg × 8/8/8 → suba para 42 kg"), cronômetro da série. Botão **Feito**.
- **Descanso**: countdown gigante, +15 s / −15 s, pular; enquanto descansa, registra carga e reps da série que acabou (pré-preenchido com o último valor). Bipe nos 3 s finais + vibração; ao zerar, avança sozinho.
- **Bloco com tempo** (aquecimento, tiro, rodagem, prancha, mobilidade): countdown com velocidade alvo da esteira ("12,0 km/h · inclinação 1%"); avança sozinho ao zerar.
- **Teste de 5 km** (semana 8): cronômetro progressivo; registro do tempo final.
- Final: resumo, sensação (1–5), observação; nos tiros, "Último tiro foi: fácil / ok / não terminei" → ajusta ±0,5 km/h para a próxima semana (regra do método).
- Estado do player é salvo a cada passo: fechar o navegador e voltar retoma de onde parou. Countdown é baseado em horário absoluto (não perde tempo com a tela bloqueada).

### 3.4 Semana
- Toggle casa/escritório de seg a sex com prévia ao vivo da atribuição (regras da seção 1 do método), incluindo os casos fora do padrão.
- Metas da semana do ciclo: tiros, km de rodagem, longo, total, intensidade da musculação.

### 3.5 Relatório
- Abre em qualquer semana (setas ← →); no **domingo**, a aba Hoje mostra um banner "Sua semana acabou — ver relatório".
- Conteúdo: sessões feitas × planejadas, km corridos × meta, séries de musculação, séries de peito, sensação média, recordes de carga, sugestões de progressão, ajuste de velocidade dos tiros, prévia da próxima semana.
- **Enviar**: botão usa o compartilhamento nativo do celular (WhatsApp, e-mail, Notas…) com o relatório em texto; fallback: copiar. Também baixa um `.md`.

### 3.6 Ajustes
- Data de início do ciclo, velocidades, descansos padrão, som/vibração.
- Exportar / importar backup (JSON). Apagar dados.

---

## 4. Modelo de dados (localStorage `coach-hibrido:v1`)

```ts
interface AppState {
  version: 1;
  settings: {
    cycleStart: string;        // 'YYYY-MM-DD' (segunda-feira)
    tiroSpeed: number;         // km/h, ajustado pelo feedback dos tiros
    easySpeed: number;         // km/h, rodagem/longo
    restCompoundSec: number;   // 150
    restIsolationSec: number;  // 75
    sound: boolean; vibrate: boolean;
  };
  weeks: Record<string /*segunda YYYY-MM-DD*/, { locations: Record<'seg'|'ter'|'qua'|'qui'|'sex', 'casa'|'escritorio'> }>;
  logs: SessionLog[];          // uma entrada por sessão concluída
  active?: PlayerState;        // treino em andamento (para retomar)
}

interface SessionLog {
  id: string; date: string; dayType: DayTypeId; slot: 'manha'|'noite'|'tarde';
  workoutId: WorkoutId; cycleWeek: number; startedAt: number; finishedAt: number;
  skipped?: boolean;                       // "descansar hoje"
  sets: { exerciseId: string; set: number; kg?: number; reps?: number }[];
  runKm?: number; runSec?: number;         // corrida feita
  feeling?: 1|2|3|4|5; notes?: string;
  tiroFeedback?: 'facil'|'ok'|'nao-terminei';
}
```

---

## 5. Motor de regras (resumo)

- **Semana do ciclo**: `n = semanas desde cycleStart` → `n < 8 ? n+1 : 3 + ((n-8) mod 6)` (depois da 8, recomeça pela 3).
- **Atribuição** (`schedule.ts`): implementa literalmente a seção 1 do método — 1º dia casa → `casa-1`; 2º dia casa → `casa-2` ou `casa-2-consecutivo`; fila do escritório; fim de semana; casos 0, 1 e 3+ dias em casa. Coberto por testes com o exemplo do documento e cada caso especial.
- **Passos do player** (`steps.ts`): musculação vira `trabalho → descanso` por série (descanso composto/isolado); semanas 4 e 8 = metade das séries; versão 25 min; tiros = aquecimento + 2 acelerações + N tiros (duração = distância ÷ velocidade) + caminhadas + desaquecimento; rodagem/longo = distância ÷ velocidade; teste 5 km = cronômetro.
- **Progressão** (`progression.ts`): bateu o topo da faixa em todas as séries → +2,5% arredondado para cima em 1 kg. Se +1 kg passar de 5% (cargas < 20 kg) ou for kettlebell → progride por reps/tempo. Halteres no limite de 10 kg → "mais reps (até 20), descida 3 s, pausa 1–2 s; depois troque por barra".
- **Regra de ouro perna × corrida**: como a corrida sobe um pouco quase toda semana, a carga de perna só é segurada quando o km semanal salta mais de 10% (transições 4→5 e 8→3). Mesma regra no player e no relatório.
- **Tiros**: feedback "fácil" → +0,5 km/h; "não terminei" → −0,5 km/h.
- **Teste de 5 km (semana 8)**: o tempo registrado recalibra as velocidades (base do método: 5 km em 30 min → tiros 12–12,5 e rodagem 9–9,5 km/h, escaladas proporcionalmente).

### Decisões tomadas na revisão de QA
Um revisor independente comparou o motor com o `.md` e testou as 32 combinações casa/escritório (nenhuma põe perna ou corrida em dia de escritório). Achados corrigidos: perna nunca progredia, player e relatório discordavam, incremento acima de 5% em cargas leves, próxima semana errada antes do início do ciclo e teste de 5 km sem efeito. Casos literais da spec que ficam pesados (0 dias em casa ou 1 dia em casa na sexta geram pernas em dias seguidos) foram mantidos como estão no método.

---

## 6. Divisão de trabalho (papéis do time)

Como o escopo inicial é pequeno, o "tech lead" (eu) quebrou o trabalho em frentes independentes que se encaixam pelas interfaces da seção 2:

| Frente | Responsável | Entregável |
| --- | --- | --- |
| Conteúdo do método | Tech lead | `data/plan.ts` fiel ao `.md` |
| Motor de regras + testes | Dev de domínio | `engine/*` + `tests/*` |
| Player e telas | Dev front-end | `ui/*`, `lib/*` |
| PWA + CI/CD | DevOps | `sw.js`, manifest, ícones, workflow do Pages |
| Revisão de regras | QA | Conferência independente do motor contra o `.md` |

---

## 7. Roadmap

### v0.1 — MVP (este commit)
- [x] Estrutura, build, testes e deploy automático no GitHub Pages
- [x] Motor de agenda da semana + ciclo de 8 semanas
- [x] Tela Hoje com seletor de dia e casa/escritório
- [x] Player tela cheia com countdown, bipe, vibração, wake lock e retomada
- [x] Registro de cargas/reps/sensação e sugestão de progressão
- [x] Relatório semanal com compartilhamento nativo
- [x] PWA instalável e offline, backup JSON

### v0.2 — Design e nome
- [ ] Escolher nome definitivo e identidade (cores, tipografia, ícone)
- [ ] Refinar UX do player com uso real na academia (tamanhos, gestos: deslizar para pular)
- [ ] Animações de transição entre passos

### v0.3 — Inteligência e histórico
- [ ] Gráficos de evolução por exercício e de km/semana
- [ ] Trocar treino de um dia manualmente (override) e mover treino perdido
- [ ] Sugestão automática "dia pesado no escritório → versão 25 min"
- [ ] Regras de ouro como alertas (ex.: não subir corrida e carga de perna na mesma semana)

### v0.4 — Envio automático e sync (exige backend leve)
- [ ] Relatório enviado sozinho no domingo (e-mail/Telegram) — opções: Cloudflare Worker / Supabase + cron
- [ ] Sincronizar entre aparelhos (Supabase ou Firebase com login)
- [ ] Notificação push de lembrete do treino

---

## 8. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| iOS apaga localStorage de sites pouco usados | Instalar na tela inicial (PWA) + backup JSON em Ajustes |
| Countdown para com a tela bloqueada | Tempo calculado por horário absoluto; ao voltar, o player se corrige. Wake lock mantém a tela acesa. |
| Áudio bloqueado no iOS | Áudio é "destravado" no toque do botão Começar |
| `navigator.vibrate` não existe no iOS | Vibração é opcional; o bipe cobre |
| Envio "automático" impossível sem servidor | v0.1 usa compartilhamento nativo; automação fica para a v0.4 |
