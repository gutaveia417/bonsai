# Bonsai — app pessoal de acompanhamento

**Data:** 2026-09-05
**Autor:** Gustavo (Naviraí/MS) + Claude
**Status:** aprovado para implementação

---

## 1. Objetivo

App web pessoal, estático e offline, para acompanhar 7 árvores em formação e
**ensinar bonsai a um iniciante completo**. Registrar é metade; a outra metade é
o app dizer, em cada tela, o que é permitido, o que é proibido e por quê.

Uso principal: celular, no quintal, com a mão suja. PT-BR. Toda página de
referência precisa imprimir em A4.

### Princípio que governa o resto da spec

> **Campo vazio com tarefa aberta é melhor que número plausível.**

Nada entra no seed que o usuário não tenha fornecido de fato. Estimativa por
olho não vira dado. Isso vale para medições, datas, fases e substratos.
Onde falta informação, o app mostra o que falta e como obtê-la.

---

## 2. Restrições

| # | Restrição |
|---|---|
| R1 | Sem backend, sem login, sem dependência de rede em runtime |
| R2 | Persistência local apenas (localStorage + IndexedDB) |
| R3 | Funciona offline após o primeiro carregamento |
| R4 | Mobile-first; alvos de toque grandes |
| R5 | PT-BR em toda a interface e todo o conteúdo |
| R6 | `color-scheme: light` forçado (iOS inverte e quebra o layout) |
| R7 | Toda página de referência imprime bem em A4 |
| R8 | Zero hotlink de imagem — todo asset é local |
| R9 | Sem prazo fixo inventado onde a regra real é por medida ou por época |
| R10 | **Nenhuma menção a Adenium obesum / rosa do deserto vinculada a árvore do usuário.** A mistura para suculentas pode existir no guia como referência geral e nada mais |

---

## 3. Stack

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | JS vanilla, sem build step | Editar e recarregar. Nada a reinstalar em 6 meses |
| Carregamento | `<script>` clássicos, **sem ES modules** | Módulos ES não carregam via `file://` |
| Dados estruturados | localStorage, chave `bonsai.db.v1` | Pequeno, síncrono, universal |
| Imagens do usuário | IndexedDB (`bonsai-fotos`), blobs | localStorage estoura em ~5 MB |
| Offline | `sw.js` + `manifest.webmanifest`, inertes sob `file://` | Hospedado vira PWA instalável; local continua funcionando |
| Backup | Export/import JSON | localStorage some se limpar o navegador. Única rede de proteção |

Roteamento por hash (`#/arvore/jabuticaba`), para que voltar/avançar do celular
funcione e seções sejam linkáveis.

---

## 4. Modelo de dados

Raiz em localStorage:

```js
{
  schemaVersion: 1,
  ajustes: { ocultarFotosNaImpressao: false },
  especies: [...],
  arvores: [...],
  eventos: [...],
  tarefas: [...],
  alertasDispensados: [...]   // { alertaId, ateData }
}
```

**Sete chaves na raiz, exatamente estas.** `slotsFoto` **não** vive no banco:
`assets/fotos/creditos.json` é a fonte de verdade dos slots de imagem, e manter
as duas listas garantiria que divergissem na primeira alteração. Fotos que o
usuário tirar ficam no IndexedDB, indexadas pelo próprio `slotId` — não é
preciso registro no banco para saber quais existem.

Os campos `somenteLeitura` e `motivo` são **derivados**: `carregar()` os anexa
ao objeto em memória e `salvar()` decide por eles, mas ambos são removidos
antes de gravar em disco ou exportar. Backup e localStorage têm as sete chaves
acima e nada mais. A trava é recalculada a partir do `schemaVersion` em toda
entrada, nunca lida do arquivo — senão um backup feito durante uma corrupção
nasceria permanentemente não-gravável.

### 4.1 `especies` — o perfil que ensina

```js
{
  id: 'jabuticaba',
  nomeComum: 'Jabuticaba',
  nomeCientifico: 'Plinia cauliflora',
  rega: 'sempre-umido',            // enum, ver 4.6
  regaNota: 'Nunca deixar secar.',
  luz: { horasMin: 5, horasMax: 6, descricao: 'sol da manhã até ~13h' },
  adubo: {
    formula: '20-05-20',
    frequencia: 'quinzenal',
    temporada: [9,10,11,12,1,2,3],   // meses; [] = nenhum
    dose: 'cheia',                    // 'cheia' | 'meia' | 'zero'
    carencia: 'só 3–4 semanas depois do transplante',
    notas: [...]
  },
  janelaTransplante: [8, 9],
  podaQuando: null,                  // ex. azaleia: 'só depois da floração'
  cuidados: [...],                   // fatos operacionais
  armadilhas: [...]                  // erros comuns dessa espécie
}
```

### 4.2 `arvores`

```js
{
  id: 'jabuticaba',
  apelido: 'Jabuticaba',
  especieId: 'jabuticaba',
  status: 'ativa',                  // 'ativa' | 'a-chegar' | 'perdida'
  dataAquisicao: null,              // ISO ou null

  fase: 'engorda',                  // 'engorda'|'decepe'|'estrutura'|'refino'|null
  faseDefinidaEm: '2026-09-05',
  estado: 'pos-transplante',        // ver 4.5
  estadoDesde: '2026-09-01',
  estadoAte: '2026-10-03',          // null = indeterminado

  vaso: { descricao: 'bacia grande', furada: true, geotextil: '130 g/m²' },
  substrato: [ { componente: 'terra vegetal', pct: 40 }, ... ],  // [] = desconhecido
  posicao: 'sol da manhã até ~13h',
  solHoras: 6,

  gatilhoFase: {
    tipo: 'diametro', alvoMm: 80, medidoACm: 5,
    proximaFase: 'decepe',
    metodo: 'fita métrica em volta do tronco a 5 cm do solo, dividir por 3,1416'
  },                                // null quando não há gatilho definido

  historicoRega: [],                // ver 4.4
  regaOverride: null,               // ver 4.6.1
  notas: 'Tronco único com bifurcação em Y baixa.',
  grupo: null                       // ex. 'experimento-ficus'
}
```

`fase: null` é um estado legítimo e esperado, não um bug. Renderiza como
**"fase ainda não definida"** com link para a tarefa aberta correspondente.

### 4.3 `eventos`

```js
{ id, arvoreId, data: '2026-09-01', tipo, nota, dados: {}, fotoId: null }
```

| tipo | `dados` |
|---|---|
| `transplante` | `{ vaso, substrato[], podaRaizFracao }` |
| `poda` | `{ subtipo: 'radical'\|'estruturacao'\|'manutencao'\|'pincamento', fracaoRemovida }` |
| `aramacao` | `{ ramos, bitolaMm }` |
| `remocao-arame` | `{ ramos }` |
| `adubacao` | `{ formula, dose }` |
| `medicao` | `{ diametroMm, alturaDaMedidaCm, metodo }` |
| `foto` | `{ fotoId, legenda }` |
| `observacao` | `{}` (usa `nota`) |

### 4.4 `historicoRega` — array circular de 30

Rega **não** é evento: 300 linhas por ano afogariam a linha do tempo. Mas só a
última data perde o padrão. Portanto, por árvore:

```js
historicoRega: ['2026-09-05', '2026-09-03', '2026-09-01', ...]  // máx. 30, mais recente primeiro
```

Novo registro entra na frente; o 31º cai fora. Não aparece na linha do tempo.
Aparece na ficha como uma faixa de 30 dias com marcas, mais o intervalo médio,
para diagnosticar definhamento por excesso ou por falta.

### 4.5 `fase` × `estado` — a decisão central

**`fase`** é doutrina de bonsai: as 4 fases, permanentes, avançam por medida.
**`estado`** é um modificador temporário da situação da planta.

| estado | significado |
|---|---|
| `saudavel` | nada se sobrepõe |
| `adaptacao` | recém-chegada ou recém-mudada de lugar |
| `recuperacao` | dano severo, esperando broto novo |
| `pos-transplante` | dentro das 3–4 semanas após transplante |

**Regra do motor: estado vence fase quando conflitam.** A Azaleia em `engorda`
normalmente liberaria adubo; em `recuperacao`, o app mostra adubo ⛔ bloqueado e
explica por quê. Sem essa separação seria preciso inventar uma quinta fase falsa.

### 4.6 Perfis de rega (enum, 5 valores)

| perfil | instrução |
|---|---|
| `sempre-umido` | não deixar secar |
| `secar-entre-regas` | deixar a superfície secar antes de regar de novo |
| `secar-completo` | deixar secar por completo |
| `nem-secar-nem-encharcar` | meio-termo, sem extremos |
| `umido-vigiado` | **teste do dedo a 2–3 cm antes de cada rega, sem exceção.** Nunca ressecar por completo, nunca regar por rotina |

`umido-vigiado` existe para planta cuja causa de dano não foi confirmada e
inclui excesso de água entre as hipóteses. Ele nunca é o padrão de uma espécie —
é sempre um override de árvore.

### 4.6.1 `regaOverride` — perfil amarrado ao estado

Campo opcional em `arvores`:

```js
regaOverride: {
  perfil: 'umido-vigiado',
  nota: 'Causa do dano não confirmada — excesso de água é uma das hipóteses. Não regue sem testar.',
  enquantoEstado: 'recuperacao'    // expira sozinho quando o estado muda
}
```

**Resolução do perfil efetivo:**

```
if (regaOverride && arvore.estado === regaOverride.enquantoEstado)
    → regaOverride.perfil  (+ nota exibida na ficha e no checklist)
else
    → especie.rega
```

O override não é apagado quando expira: fica inerte e volta a valer se a árvore
recair no mesmo estado. `nota` aparece em destaque na ficha **e** dentro do
checklist de rega, porque é lá que a decisão errada seria tomada.

### 4.7 `tarefas`

```js
{ id, arvoreId, titulo, comoFazer, origem: 'seed'|'usuario',
  criadaEm, concluidaEm: null, eventoAoConcluir: null, grupo: null }
```

`eventoAoConcluir` permite que concluir "transplantar a Primavera" abra
direto o formulário de evento `transplante`.

`grupo` cobre a tarefa que vale para várias árvores de uma vez — a chegada dos
três Ficus é uma tarefa só, com `arvoreId: null` e `grupo:
'experimento-ficus'`. Quando `grupo` está preenchido, a tarefa aparece na ficha
de todas as árvores daquele grupo.

### 4.7.1 `null` × `[]` — a diferença é semântica, não estilística

Em todo o modelo de dados:

- **`null` significa "o usuário não informou".** A tela pede a informação.
- **`[]` ou `'zero'` significa "explicitamente nenhum".** A tela afirma a ausência.

`adubo.temporada: []` diria *"não aduba em mês nenhum"*, que é uma afirmação
sobre a planta. `adubo.temporada: null` diz *"não sei em que meses"*. Os dois
casos geram telas opostas, e confundi-los é a forma mais fácil de o app
inventar informação. **Campo `null` nunca vira permissão nem alerta** — vira
⚠️ "não definido para esta espécie; defina antes de adubar".

### 4.8 `slotsFoto`

```js
'nebari-ruim': {
  origem: 'pendente',        // 'livre' | 'ia' | 'svg' | 'pendente' | 'usuario'
  arquivo: null,             // caminho em assets/fotos/ ou id no IndexedDB
  credito: null,             // { autor, licenca, fonteUrl }
  legenda: 'O que olhar: ...',
  permiteIA: false           // ver seção 7
}
```

### 4.9 Migração

`db.js` guarda `schemaVersion` e aplica migrações em cadeia na carga. Se a
versão do arquivo for maior que a do código, o app entra em modo somente-leitura
e oferece exportar, em vez de destruir dados.

---

## 5. Motor de regras

Três funções puras, testáveis isoladamente.

### 5.1 `regras(arvore, especie, hoje) → { permitido[], proibido[], atencao[] }`

Cada item: `{ acao, texto, porque, guiaAncora }`. A ficha mostra três blocos
coloridos, e cada item leva a uma seção do guia.

**Por fase:**

| fase | ✅ permitido | ⛔ proibido | ⚠️ atenção |
|---|---|---|---|
| `engorda` | adubar na temporada, regar farto, vaso/bacia máximo, medir tronco, deixar crescer solto, podar raiz na janela | **podar a copa**, encurtar o líder, vaso de bonsai | **aramação** — "ramo verde não segura curva; espere consistência de lápis"; ramo baixo engrossando demais vira cicatriz |
| `decepe` | corte baixo, selar o corte, escolher novo líder | decepar antes do alvo de diâmetro; decepar fora da brotação | 1 dia de trabalho, anos de consequência |
| `estrutura` | selecionar primários, aramar, poda de estruturação | remover mais de 1/3 da folhagem de uma vez | conferir arame mensalmente |
| `refino` | clip-and-grow, pinçagem, desfolha parcial | cortes grandes que quebram a ramificação | adubo mais fraco para não engrossar |
| `null` | — | — | "Fase ainda não definida — [ver tarefa]" |

**Por estado (sobrepõe a fase):**

| estado | efeito |
|---|---|
| `adaptacao` | ⛔ adubar, podar, transplantar, mudar de lugar. **✅ regar** (pelo perfil da espécie), observar. ⚠️ queda de folha é normal |
| `recuperacao` | ⛔ adubar, podar, aramar, transplantar. ✅ manter à sombra sem mudar de lugar, regar, esperar. ⚠️ só voltar a mexer depois de broto novo |
| `pos-transplante` | ⛔ adubar até `estadoAte`, podar, **transplantar**. ⚠️ sombra por 3–4 semanas. ✅ regar |

**Toda linha de estado precisa de pelo menos um ✅.** Uma tela que lista quatro
proibições e nenhuma permissão diz a um iniciante que não há nada a fazer por
uma planta viva — e contradiz o checklist de rega, que vai listá-la na mesma
hora. Regar é quase sempre a permissão que sobra.

**`pos-transplante` proíbe transplantar.** Faltava na primeira redação desta
tabela, por descuido: as linhas `adaptacao` e `recuperacao` proibiam, e esta
não. Uma árvore transplantada há quatro dias é a que *menos* pode ser
transplantada de novo.

**Uma `acao` nunca aparece em duas listas ao mesmo tempo.** Isso vale dentro da
mesma tabela, não só entre fase e estado. Quando dois itens falam de atos
físicos diferentes, eles precisam de `acao` diferentes — `podar-raiz` (permitida
na engorda, na janela) não é `podar` (galho), do mesmo modo que `podar-copa` já
é separada. E uma `acao` nunca nomeia o oposto do que o texto instrui: um item
que diz "mantenha onde está" não se chama `mudar-lugar`.

Nota de desenho: aramar em `engorda` é ⚠️, **não** ⛔ — não é erro doutrinário,
é prematuro. O que é proibido em engorda é podar a copa.

### 5.2 `alertas(hoje, db) → []`

Quatro geradores. Nenhum inventa prazo.

1. **Janela de época** — deriva de `especie.janelaTransplante`. "Janela de
   transplante abre em agosto" aparece a partir de junho, contando por mês.
2. **Gatilho por medida** — compara a última `medicao` com `gatilhoFase.alvoMm`.
   **Sem nenhuma medição, não há barra de progresso nem percentual**: o card
   mostra o alvo, o método e o link para a tarefa de medir.
3. **Condição registrada** — `aramacao` sem `remocao-arame` nem conferência há
   ≥ 1 mês → "hora de conferir arame". Único intervalo fixo do app, e existe
   porque conferência mensal foi um requisito explícito.
4. **Carência / bloqueio** — enquanto `estado` bloqueia uma ação, o alerta dela
   não é gerado; no lugar vai o motivo e a data de liberação.

Todo alerta tem `guiaAncora` ("por quê?") e pode ser dispensado até uma data.

**Alerta previsto no seed:** Jabuticaba transplantada em 01/09/2026 está em
posição de 6 h de sol, e o guia pede sombra por 3–4 semanas após transplante.
O app levanta isso como ⚠️ em forma de pergunta ("ela já está na sombra? isso é
intencional?"), dispensável — não como acusação.

### 5.3 `checklistRega(hoje, db)`

Agrupa as árvores pelo **perfil efetivo** (`regaOverride` resolvido contra o
estado, ver 4.6.1 — nunca o perfil bruto da espécie) e mostra **o que testar
antes de regar**
(dedo a 2–3 cm), nunca "regue hoje". Modificador de estação: dez–fev exibe o
aviso de rega dobrada. Marcar como regada empurra a data em `historicoRega`.

---

## 6. Navegação

Barra inferior fixa, 4 abas:

```
🌱 Hoje        🪴 Árvores       📖 Guia        ⋯ Mais
```

| Aba | Conteúdo |
|---|---|
| **Hoje** | Alertas ativos · tarefas abertas · checklist de rega · botão grande "registrar evento" (árvore → tipo → salvar, 3 toques) |
| **Árvores** | Cards com foto, fase/estado, próximo marco. Toque → **ficha**: cabeçalho fase+estado · blocos permitido/proibido/atenção · gráfico de tronco · faixa de rega 30 dias · linha do tempo de eventos · vaso/substrato/posição · notas |
| **Guia** | 11 seções + vocabulário + galeria de imagens. Busca simples no topo |
| **Mais** | Calendário anual de Naviraí · imprimir · backup exportar/importar · ajustes |

**Gráfico de tronco:** SVG puro, sem biblioteca. Linha horizontal no alvo
(80 mm para a Jabuticaba). Estado vazio explícito: *"Sem medições ainda"* +
o método + botão que abre o formulário de medição.

**Impressão (`print.css`):** navegação some, cor vira preto no branco, quebras
entre seções, fotos em escala de cinza, e a opção `ocultarFotosNaImpressao`
as remove por completo.

---

## 7. Imagens — política por tipo de slot

Decisão revista: **imagem gerada por IA não pode servir de gabarito visual para
detalhe técnico.** O usuário é leigo; se a anatomia estiver errada, ele aprende
errado e não tem como saber. Uma verificação feita pelo mesmo modelo que
escreveu o prompt não é verificação.

### Grupo A — IA permitida (erro de anatomia é cosmético)

Exemplos de espécies formadas: **ficus, jabuticaba, serissa, primavera, azaleia.**
Ordem: foto livre → IA → pendente.
Sempre rotuladas no app como **"ilustração — não é foto"**.
Só estes cinco slots entram em `prompts-imagens.md` (prompts em inglês, para
o usuário gerar e devolver).

### Grupo B — IA proibida

1. nebari bom vs. nebari ruim
2. tronco com conicidade vs. tronco cilíndrico
3. decepe recém-feito vs. o mesmo corte anos depois
4. arame encravado na casca
5. raiz circulante num torrão desenrolado
6. substrato de bonsai vs. terra compactada

Ordem: **foto livre → diagrama SVG desenhado → slot pendente com botão de câmera.**
O usuário pretende fotografar nebari, raiz circulante e substrato no próximo
transplante; esses três permanecem pendentes de propósito se não houver foto livre.

### Requisitos de todas as imagens

- Salvas em `assets/fotos/`; nada de hotlink
- Legenda diz **o que olhar**, não só o nome da coisa
- Fotos livres registram autor, licença e URL de origem em `creditos.json`
- Otimizadas para celular (largura máx. ~1400 px, JPEG/WebP)

### Diagramas SVG (base)

1. As 5 partes anotadas
2. Corte certo vs. toco vs. rente demais
3. Clip-and-grow em 3 passos
4. Ângulo de arame 45° vs. frouxo vs. apertado
5. Raiz pivotante vs. raiz radial
6. As 4 fases numa linha do tempo

Mais os do Grupo B que não tiverem foto livre.

---

## 8. Seed — 7 árvores

Nenhuma outra espécie entra. Ver R10.

### Jabuticaba (*Plinia cauliflora*)
- fase `engorda` · estado `pos-transplante` desde 01/09/2026, até 03/10/2026
  (o fim do estado e a liberação do adubo são a mesma data, de propósito)
- Transplantada 01/09/2026 → bacia grande furada, geotêxtil 130 g/m²
- Substrato: 40% terra vegetal, 40% substrato, 20% casca de pinus
- Posição: sol da manhã até ~13h (6 h)
- Rega: `sempre-umido` — nunca deixar secar
- Adubo: NPK 20-05-20 quinzenal, set–mar. **Liberado a partir de ~03/10/2026**
  (extremo conservador da janela de 3–4 semanas após o transplante)
- Notas: tronco único com bifurcação em Y baixa
- Gatilho: diâmetro 80 mm medido a 5 cm do solo → `decepe`
- **Sem nenhuma medição.** Gráfico vazio, sem barra de progresso
- ⛔ podar a copa

### Primavera (*Bougainvillea*)
- fase `engorda` · estado `saudavel`
- Transplante **pendente** (tarefa aberta), destino bacia
- Substrato planejado: 20% húmus, 45% substrato, 35% casca de pinus
- Sol pleno desde o primeiro dia
- Rega: `secar-entre-regas` — morre mais por excesso que por falta
- Adubo: NPK 10-10-10
- Floração se induz por **estresse hídrico** (reduzir rega 2–3 semanas), não por adubo
- Cuidado: espinhos nas axilas das folhas

### Serissa (*Serissa foetida* variegata)
- fase **`null`** (tarefa aberta para definir) · estado `adaptacao`
- Torrão original bom. Terra vermelha na superfície a remover → **tarefa aberta**
- Meia-sombra, 2–5 h de sol da manhã
- Rega: `nem-secar-nem-encharcar`
- Adubo: NPK 10-10-10 em **meia dose**, quinzenal
- Sensível a sal no substrato · derruba folha a cada mudança de lugar

### Azaleia (*Rhododendron*)
- fase **`null`** (tarefa aberta para definir) · estado `recuperacao`
- `dataAquisicao: null`, editável
- Dano severo confirmado: perdeu quase toda a folhagem.
  **Câmbio verde na base testado com a unha.** Aguardando broto novo
- Rega: **`regaOverride: 'umido-vigiado'` enquanto `estado === 'recuperacao'`**.
  A causa do dano nunca foi confirmada; as hipóteses em aberto são queima de sol,
  falta d'água e **raiz apodrecida por excesso**, e havia musgo verde na
  superfície do substrato — indício de umidade constante. Instruir "sempre úmido"
  poderia repetir exatamente o que a machucou. Nota fixa na ficha e no checklist:
  *"Causa do dano não confirmada — excesso de água é uma das hipóteses.
  Não regue sem testar."* Ao mudar para `saudavel`, o override expira sozinho
- Sombra, **ZERO adubo, ZERO poda** até aparecer broto novo
- Poda só depois da floração — forma os botões do ano seguinte logo após florir
- Substrato ácido com casca de pinus

### Ficus A / B / C (*Ficus microcarpa* 'Panda')
- fase `engorda` · status `a-chegar` · `grupo: 'experimento-ficus'`
- Compra feita, aguardando entrega
- Sol pleno, água constante (`sempre-umido`), NPK 10-10-10 quinzenal
- Substrato: **vazio** até chegarem
- **Fluxo de chegada:** status → `ativa`, pedir data de aquisição, e o app abre
  automaticamente estado `adaptacao` por 2 semanas
- **Plano do experimento, exibido na ficha dos três:**
  - Fase 1 (6–12 meses): os três soltos, tratamento idêntico, sem arame
  - Fase 2: quando os ramos tiverem consistência de lápis, aramar B e C com
    abordagens diferentes; **A é o controle, sem arame**
  - Qualquer diferença de tratamento entre os três **precisa** virar evento
- Aramação em engorda aparece como ⚠️, não ⛔

### Tarefas abertas no seed

| # | Árvore | Tarefa |
|---|---|---|
| 1 | Jabuticaba | Medir o tronco pela primeira vez — fita em volta a 5 cm do solo, dividir por 3,1416 |
| 2 | Primavera | Transplantar para bacia (20% húmus / 45% substrato / 35% casca) |
| 3 | Serissa | Remover a terra vermelha da superfície e substituir por substrato com casca |
| 4 | Serissa | Definir a fase, depois da adaptação |
| 5 | Azaleia | Definir a fase, depois que brotar |
| 6 | Azaleia | Preencher a data de aquisição |
| 7 | Ficus A/B/C | Registrar a chegada (status, data, substrato) |

---

## 9. Guia — 11 seções

1. **Vocabulário** — nebari, conicidade, decepe (trunk chop), pré-bonsai,
   clip-and-grow, pinçagem, alporquia, jin, shari, yamadori, akadama, desfolha
2. **As 5 partes que se julgam** — nebari, conicidade, tronco, ramificação, copa.
   Trabalhar de baixo para cima; nebari e conicidade são quase irreversíveis,
   copa se refaz sempre
3. **As 4 fases** — engorda (anos, vaso máximo, sem poda de copa), decepe (1 dia,
   corte baixo, cria conicidade), estrutura (2–4 anos, primários + aramação),
   refino (contínuo, clip-and-grow). **Gatilho é medida de tronco, não calendário**
4. **Poda** — os 4 tipos. Corte no colar do galho, ângulo leve, ferramenta afiada,
   nunca mais de 1/3 da folhagem. Clip-and-grow: deixa 5–6 folhas, corta pra 2,
   um ramo vira dois
5. **Aramação** — espessura ~1/3 do ramo, ângulo 45°, espaçamento uniforme,
   ancorar no tronco, dobrar depois de aramar, conferir mensalmente, cortar em
   pedaços para remover
6. **Raiz e nebari** — cortar a pivotante, espalhar as radiais; transplante 1–2
   anos em formação, 3–5 em manutenção; até 1/3 da raiz; janela ago–set em
   Naviraí; sombra 3–4 semanas depois e zero adubo
7. **Substrato** — terra de jardim mata bonsai; misturas por uso (engorda,
   manutenção, acidófilas, **suculentas — referência geral, sem vínculo com
   árvore do usuário**); função de cada componente; nunca fazer camadas separadas
8. **Rega** — teste do dedo a 2–3 cm, regar até sair pelos furos, jato fino,
   manhã ou fim de tarde, imersão quando o substrato repele água.
   **Folha murcha pode ser falta OU excesso — checar antes de regar**
9. **Adubação** — o que N, P e K fazem; fórmula por fase (20-05-20 engorda,
   10-10-10 manutenção, 04-14-08 floração); quinzenal e diluído; nunca em planta
   recém-transplantada, doente ou florida.
   **Caixa de alerta com caso real, sem nome de marca:** produto vendido como
   "fertilizante líquido" contendo apenas cálcio, magnésio, enxofre e cobalto —
   zero N, P e K. É complemento, não adubo base. A palavra "fertilizante" na
   embalagem não garante NPK; ler a análise garantida
10. **Calendário de Naviraí** — set–nov brotação e início de adubo; dez–fev
    crescimento máximo e rega dobrada; mar–mai desaceleração e última adubação
    em abril; jun–ago descanso, medição de tronco, abertura da janela de transplante
11. **Os 10 erros** — podar na engorda · vaso de bonsai cedo demais · terra de
    jardim · rega superficial · adubar recém-transplantada · transplantar fora de
    época · arame esquecido · semente "para bonsai" · espécie errada pro clima · pressa

---

## 10. Arquivos

```
index.html
css/app.css              css/print.css
js/db.js                 persistência, migração, export/import
js/dados-iniciais.js     seed: 5 perfis de espécie, 7 árvores, 7 tarefas
js/regras.js             fases, estados, permitido/proibido
js/alertas.js            janelas, gatilhos, condições, carências
js/rega.js               checklist + histórico circular de 30
js/grafico.js            gráfico SVG de tronco
js/svg.js                diagramas desenhados
js/guia/*.js             uma seção por arquivo
js/app.js                roteador + telas
assets/fotos/            imagens + creditos.json
prompts-imagens.md       prompts em inglês, só espécies formadas (Grupo A)
manifest.webmanifest     sw.js
```

---

## 11. Testes

Sem framework. `testes.html` carrega os mesmos scripts e roda asserções em
console para as funções puras:

- `regras()` — estado vence fase; aramar em engorda é ⚠️ e não ⛔; `fase: null`
  não quebra
- `alertas()` — sem medição não há barra de progresso; carência suprime o alerta
  de adubo; janela de agosto aparece em junho e não em maio
- `historicoRega` — nunca passa de 30; ordem preservada
- `db` — export → import → estado idêntico; migração de versão futura entra em
  somente-leitura

---

## 12. Fora de escopo

Backend · login · sincronização entre dispositivos · clima por API · reconhecimento
de espécie por foto · qualquer árvore além das 7 listadas.

---

## 13. Premissas a confirmar durante a implementação

1. ~~Perfil de rega da Azaleia~~ — **resolvido pelo usuário.** A inferência
   `sempre-umido` foi rejeitada: vale para azaleia saudável, não para uma planta
   cuja causa de dano é desconhecida e inclui excesso de água. Agora é
   `umido-vigiado` via `regaOverride`. Ver 4.6.1 e seção 8.
2. **Data de liberação do adubo da Jabuticaba** — 03/10/2026, confirmada pelo
   usuário; corresponde ao extremo conservador da janela de 3–4 semanas.
3. **Substrato dos Ficus** — vazio até a entrega, por decisão.
4. **Fase da Serissa e da Azaleia** — `null` por decisão; não inferir.
5. **A palavra "substrato" dentro das misturas** — nas receitas ("40% terra
   vegetal, 40% substrato, 20% casca de pinus") ela significa substrato
   comercial de saco, não a mistura inteira. A interface escreve
   **"substrato comercial"** para não colidir com o nome do campo.
