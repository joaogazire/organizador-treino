# Treino Híbrido — Método Victor Pareto (adaptado)

> Plano de 8 semanas: 4 musculações + 3 corridas por semana, com foco extra em peitoral.
> Base: método do @victorpareto (corrida + musculação, perna isolada dos treinos intensos de corrida, progressão gradual de volume).
> Versão: 2026-10-11

---

## 1. Como o site decide o treino do dia

### Entrada do usuário

Antes da semana, o usuário marca cada dia útil como `casa` ou `escritorio`.
Padrão esperado: **2 dias em casa e 3 no escritório**.

```
segunda: casa | escritorio
terca:   casa | escritorio
quarta:  casa | escritorio
quinta:  casa | escritorio
sexta:   casa | escritorio
```

Também é preciso saber a **semana do ciclo (1–8)** para mostrar distâncias, tiros e intensidade da musculação. Sugestão: o usuário define a data de início e o site calcula.

### Regras de atribuição

Aplicar na ordem:

1. **Primeiro dia `casa`** da semana → `casa-1`.
2. **Segundo dia `casa`**:
   - Se **não** for o dia seguinte ao primeiro → `casa-2`.
   - Se **for** o dia seguinte ao primeiro → `casa-2-consecutivo` (rodagem leve + Superior A), e `pernas-b` vai para o sábado à tarde (`sabado-com-pernas`).
3. **Dias `escritorio`**, na ordem da semana, recebem os itens desta fila:
   - Caso normal: `escritorio-1` → `escritorio-2` → `flexivel`
   - Caso consecutivo (Superior A já foi usado em casa): `escritorio-2` → `flexivel` → `descanso`
4. **Fim de semana**:
   - Se `casa-2` caiu na **sexta** → `sabado` = `descanso` e `domingo` = `longo`.
   - Se houve caso consecutivo → `sabado` = `sabado-com-pernas` e `domingo` = `descanso`.
   - Senão → `sabado` = `longo` e `domingo` = `descanso`.

### Semanas fora do padrão

| Situação | O que fazer |
| --- | --- |
| Só 1 dia `casa` | Esse dia vira `casa-1`. Escritório recebe a fila `escritorio-1` → `escritorio-2` → `flexivel` → `descanso`. Sábado = `sabado-com-pernas`. A rodagem leve da semana é pulada. |
| 0 dias `casa` | Escritório recebe a fila `escritorio-1` → `escritorio-2` → `flexivel` → `descanso` → `descanso`. Sábado = `sabado-com-pernas`. Domingo = `casa-1` (tiros + Pernas A). |
| 3+ dias `casa` | Os dois primeiros seguem as regras acima. Os dias `casa` extras entram na fila do escritório como se fossem escritório. |

### Exemplo

Entrada: seg `escritorio`, ter `casa`, qua `escritorio`, qui `casa`, sex `escritorio`

| Dia | Treino |
| --- | --- |
| Segunda | `escritorio-1` — Superior A (peito em foco) |
| Terça | `casa-1` — Tiros + Pernas A |
| Quarta | `escritorio-2` — Superior B (puxar + peito) |
| Quinta | `casa-2` — Rodagem leve + Pernas B |
| Sexta | `flexivel` — Peito extra (opcional) ou descanso |
| Sábado | `longo` |
| Domingo | `descanso` |

---

## 2. Tipos de dia

| ID | Nome | Manhã | Noite |
| --- | --- | --- | --- |
| `casa-1` | Casa 1 | [Tiros](#tiros) | [Pernas A](#pernas-a) |
| `casa-2` | Casa 2 | [Rodagem leve](#rodagem-leve) | [Pernas B](#pernas-b) |
| `casa-2-consecutivo` | Casa 2 (dia seguido) | [Rodagem leve](#rodagem-leve) | [Superior A](#superior-a) |
| `escritorio-1` | Escritório 1 | — | [Superior A](#superior-a) |
| `escritorio-2` | Escritório 2 | — | [Superior B](#superior-b) |
| `flexivel` | Flexível | — | [Peito extra](#peito-extra) (opcional) ou descanso |
| `longo` | Longo | [Longo](#longo) | — |
| `sabado-com-pernas` | Sábado com pernas | [Longo](#longo) | [Pernas B](#pernas-b) (tarde) |
| `descanso` | Descanso | Mobilidade 20 min (opcional) | — |

**Dia de escritório pesado demais?** Versão de 25 min: só os 3 primeiros exercícios do treino, 3 séries cada.

---

## 3. Musculação

Regras gerais:

- Termine as séries deixando 1–2 repetições "no tanque" (RIR 1–2), salvo indicação da semana.
- Descanso: 2–3 min nos compostos, 60–90 s nos isolados.
- Progressão: bateu o topo da faixa de reps em todas as séries com boa técnica → +2–5% de carga na próxima sessão.
- Halteres vão só até 10 kg: quando ficar leve, progrida com mais reps (até 20), descida em 3 s, pausa de 1–2 s, e depois troque por barra.

### Superior A

**Peito em foco — 50 min.** Usado em `escritorio-1` e `casa-2-consecutivo`.

| # | Exercício | Equipamento | Séries × reps |
| --- | --- | --- | --- |
| 1 | Supino inclinado com barra | Rack + banco livre a 30° + barra longa | 4 × 6–8 |
| 2 | Supino reto com barra | Rack + banco livre + barra longa | 3 × 6–8 |
| 3 | Crucifixo com halteres (descida em 3 s) | Banco livre plano + halteres | 3 × 12–15 |
| 4 | Desenvolvimento | Supino máquina a 90° | 2 × 8–10 |
| 5 | Elevação lateral | Halteres | 3 × 12–20 |
| 6 | Tríceps na polia | Puxada alta + corda | 3 × 10–15 |

### Superior B

**Puxar + peito — 50 min.** Usado em `escritorio-2`.

| # | Exercício | Equipamento | Séries × reps |
| --- | --- | --- | --- |
| 1 | Puxada alta pegada aberta | Polia + barra reta | 4 × 8–10 |
| 2 | Supino máquina inclinado | Supino máquina a 30–45° | 3 × 8–12 |
| 3 | Remada baixa | Polia + triângulo | 3 × 8–12 |
| 4 | Remada curvada | Barra livre + anilhas | 3 × 8–10 |
| 5 | Face pull | Polia alta + corda | 3 × 12–15 |
| 6 | Rosca direta | Barra curta + anilhas | 3 × 8–12 |

### Peito extra

**Opcional — 25–30 min.** Usado em `flexivel`. Só se tiver energia; senão, descanso.

| # | Exercício | Equipamento | Séries × reps |
| --- | --- | --- | --- |
| 1 | Supino máquina | Supino máquina a 30° | 3 × 10–12 |
| 2 | Flexão declinada (pés no banco) | Banco livre | 3 × até faltar 2 reps |
| 3 | Crucifixo inclinado com halteres | Banco livre a 30° + halteres | 2 × 15 |

Volume de peito: ~13 séries/semana em 2 treinos, ou ~21 em 3 com o Peito extra.

### Pernas A

**Força, quadríceps — 55–65 min.** Usado em `casa-1` (noite).

| # | Exercício | Equipamento | Séries × reps |
| --- | --- | --- | --- |
| 1 | Agachamento livre | Rack + barra longa | 4 × 5–7 |
| 2 | Afundo búlgaro | Banco + halteres de 10 kg (ficou fácil: barra nas costas) | 3 × 10–12 por perna |
| 3 | Agachamento goblet com pausa de 2 s embaixo | Kettlebell | 3 × 12–15 |
| 4 | Mesa flexora | Máquina | 3 × 10–12 |
| 5 | Panturrilha unilateral em degrau | Halter de 10 kg | 4 × 12–15 por perna |
| 6 | Prancha | Estofado | 3 × 40–60 s |

### Pernas B

**Posterior, glúteo, core — 55–65 min.** Usado em `casa-2` (noite) e `sabado-com-pernas` (tarde).

| # | Exercício | Equipamento | Séries × reps |
| --- | --- | --- | --- |
| 1 | Levantamento terra romeno | Barra longa + anilhas | 4 × 6–8 |
| 2 | Elevação pélvica (hip thrust) | Banco livre + barra + estofado no quadril | 3 × 8–10 |
| 3 | Cadeira ou mesa flexora | Máquina | 3 × 10–12 |
| 4 | Abdutora | Máquina | 3 × 15–20 |
| 5 | Kettlebell swing | Kettlebell | 3 × 15 |
| 6 | Abdominal declinado + abdominal na polia | Banco negativo / polia + corda | 3 × 12 cada |

---

## 4. Corrida

Tudo funciona na esteira com inclinação em 1%. Velocidades calibradas a partir de 5 km em 30 min (6:00/km). Sem relógio cardíaco: na Z2 dá para conversar em frases completas.

### Tiros

Usado em `casa-1` (manhã).

- Aquecimento: 10 min de trote + 2 acelerações de 30 s.
- Série de tiros da semana (ver tabela da seção 5).
- Descanso entre tiros: caminhada a 5–6 km/h.
- Desaquecimento: 10 min de trote.
- Velocidade inicial: **12–12,5 km/h** (4:50–5:00/km), Z4 — só dá para falar palavras soltas.
- Ajuste: último tiro fácil → +0,5 km/h na semana seguinte; não terminou → −0,5 km/h.

### Rodagem leve

Usado em `casa-2` e `casa-2-consecutivo` (manhã).

- Distância da semana (seção 5), em velocidade fixa.
- Velocidade: **9–9,5 km/h** (6:20–6:40/km), Z2.
- Canela ou joelho reclamando: troque por 40–50 min de elíptico ou bicicleta na mesma zona.

### Longo

Usado em `longo` e `sabado-com-pernas` (manhã).

- Distância da semana (seção 5), esteira ou rua.
- Velocidade: **9–9,5 km/h**, Z2, sem passar da Z3.

---

## 5. Progressão de 8 semanas

| Semana | Tiros | Rodagem leve | Longo | Total aprox. | Musculação |
| --- | --- | --- | --- | --- | --- |
| 1 | 6 × 600 m, desc. 2 min | 6 km | 7 km | 20,5 km | Cargas atuais, RIR 2 |
| 2 | 5 × 800 m, desc. 2 min | 6 km | 8 km | 22 km | RIR 2 |
| 3 | 4 × 1000 m, desc. 3 min | 7 km | 9 km | 24 km | RIR 1–2 |
| 4 (leve) | 6 × 400 m, desc. 90 s | 5 km | 6 km | 17,5 km | Metade das séries, mesma carga |
| 5 | 6 × 800 m, desc. 2 min | 7 km | 10 km | 26 km | Cargas acima da semana 3 |
| 6 | 5 × 1000 m, desc. 3 min | 7,5 km | 11 km | 27,5 km | RIR 1–2 |
| 7 | 3 × 1600 m, desc. 3 min | 8 km | 12 km | 29 km | RIR 1 nos compostos |
| 8 (teste) | Teste: 5 km no melhor ritmo | 5 km | 7 km | 20 km | Metade das séries; anotar cargas máximas da semana 7 |

Totais incluem ~4 km de aquecimento e desaquecimento dos tiros. Depois da semana 8, recomeçar pela semana 3 usando o tempo do teste de 5 km como novo parâmetro.

---

## 6. Regras de ouro

- Nunca aumentar corrida e carga de perna na mesma semana.
- Leve é leve: a maior parte da corrida em Z2.
- Perna nunca em dia de escritório.
- Dor de lado: reduzir o ritmo e controlar a respiração.
- Dor que piora durante a corrida ou muda a pisada: parar e procurar um profissional.
- Sono de 7–9 h.
- Proteína de 1,6–2,2 g/kg por dia, carboidrato antes dos tiros e do longo, boa hidratação.
- Registrar cargas, distâncias e sensação de cada treino.

---

## 7. Fontes

- [Instagram @victorpareto](https://www.instagram.com/victorpareto/)
- [YouTube — Victor Pareto](https://www.youtube.com/@VictorPareto/videos)
- [FISIculturismo — O treino híbrido de Victor Pareto](https://fisiculturismo.com.br/mat%C3%A9rias/treinamento/o-treino-h%C3%ADbrido-cardio-muscula%C3%A7%C3%A3o-de-victor-pareto-aprenda-a-montar-seu-treino-r866/)
- [Manual do Treino Híbrido (Scribd)](https://pt.scribd.com/document/872352541/MTH-Manual-do-Treino-Hi-brido)
- [TikTok @victorpareto](https://www.tiktok.com/discover/treino-hibrido-victor-pareto-vale-a-pena)
