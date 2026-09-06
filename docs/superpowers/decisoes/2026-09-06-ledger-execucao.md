# Registro de decisões — execução do plano

Instantâneo do ledger de execução, atualizado em 06/09/2026.

O ledger de trabalho vive em `.superpowers/sdd/`, que é área de rascunho e
não é versionada. Este arquivo existe para que as decisões não fiquem só na
máquina onde o trabalho foi feito.

---

# SDD ledger — plan: docs/superpowers/plans/2026-09-05-app-bonsai.md

Spec: `docs/superpowers/specs/2026-09-05-bonsai-app-design.md` (lida, é a autoridade)
Invariantes: `CONTEXTO.md` na raiz — todo implementer e todo reviewer recebe o caminho.
Branch: `app-bonsai` (criado a partir de `master` em 53d19be)
BASE inicial: 53d19be

## Estado das tarefas

- Task 19 (fotos livres + prompts-imagens.md): **já concluída** antes do loop,
  commit 42ee66d. Não despachar.
- Ordem de execução: 1 → 3 → 2 → 4 → 5 → 6 → 7 → 12 → 8 → 9 → 10 → 11 → 13 →
  14 → 15 → 16 → 17 → 18 → 20.

---

## Varredura de pré-voo

### Pares de tarefas que compartilham arquivo ou interface

| A | B | produz / consome | achado |
|---|---|---|---|
| T1 | T2,T4,T5,T6 | `Bonsai.datas` ← consumido por todos | ok |
| T2 | T3 | `db.novo()` chama `dadosIniciais.montar()`; o teste de T2 exige 7 árvores | **ciclo** — ver R1 |
| T3 | T4,T5,T6 | seed ← consumido pelos três testes | ok |
| T3 | T15,T19 | `slotsFoto` no seed vs `creditos.json` no disco | **duplicação** — ver R2 |
| T15 | T19 | T15 diz "Create: assets/fotos/creditos.json"; o arquivo **já existe**, curado | **destrutivo** — ver R2 |
| T12 | T19 | T12 desenha fallback "dos slots que a Task 17 não preencher" | **T17 é impressão, não fotos** — ver R3 |
| T7 | T10 | `grafico.tronco(medicoes, gatilho)` | assinatura igual nas duas — ok |
| T6 | T9,T10 | `Alerta.progresso` `null` \| `{atualMm,alvoMm}` | igual nas três — ok |
| T5 | T9 | `perfilEfetivo(...).id` usado como `linha.perfil.id` | ok |
| T1 | T8,T9,T10 | `index.html`, `css/app.css` | sequencial, sem despacho paralelo — ok |
| T1 | T17 | `css/print.css` criado em T1, modificado em T17 | ok |
| T8 | T11,T14 | rotas em `js/app.js` | sequencial — ok |
| T1 | T12,T13 | `FONTES` do runner não inclui `js/svg.js` nem `js/guia/` | **testes de T12/T13 não rodariam** — ver R4 |

### Consistência interna de cada tarefa

| tarefa | teste × código × arquivos | achado |
|---|---|---|
| T1 | 9 asserções de `datas` batem com a implementação dada | ok |
| T2 | teste faz `db.somenteLeitura = true`, mas `carregar()` devolve `somenteLeitura` no envelope | **campo em dois lugares** — ver R5 |
| T3 | 7 árvores, 5 espécies, 7 tarefas, 0 medições | ok |
| T4 | `mes('2026-10-10')=10` está na temporada da jabuticaba `[9..3]` | ok |
| T5 | 30 datas, override expira, checklist ignora `a-chegar` (4 de 7) | ok |
| T6 | janela: 2 meses antes de `[8,9]` → jun–set; maio fora, junho dentro | ok, mas ver R6 |
| T7 | estado vazio sem `<polyline>` nem `%` | ok |
| T12 | `LISTA.length >= 6`; com o fallback vira 7 | ok após R3 |
| T13 | 11 seções, vocabulário, "cobalto" | ok |
| T16 | importar exige confirmação explícita | ok |
| T20 | varreduras de R10 e R6 | ok |

---

## Rulings de pré-voo

**Ruling R1 — ordem T3 antes de T2.** O teste de T2 depende do seed de T3. O
plano já anotava isso no Passo 4 de T2; fica formalizado na ordem de execução
acima. *Custo se errado:* nenhum, é só ordenação.

**Ruling R2 — T15 NÃO cria `assets/fotos/creditos.json`; ela consome o arquivo
existente.** O arquivo foi curado na Task 19 (17 slots, 12 fotos reais com
autor/licença/fonte, legendas de "o que olhar") e um implementer seguindo o
plano ao pé da letra o sobrescreveria. T15 passa a: ler o `creditos.json` do
disco, implementar `Bonsai.fotos` em cima do formato que ele já tem, e **não
escrever nele**. O passo do `.gitkeep` em `assets/fotos/originais/` está
cancelado — a pasta já existe com 20 MB de originais e está ignorada.
Além disso, `slotsFoto` **sai do seed de T3**: a fonte de verdade dos slots é o
`creditos.json`, e ter os dois seria duas verdades divergindo. *Custo se errado:*
se `creditos.json` precisar de campo novo, edita-se o arquivo, não o seed.

**Ruling R3 — o fallback SVG de T12 é definido pelo `creditos.json`, não pela
"Task 17".** A referência a Task 17 é erro meu de redação no plano; a tarefa de
fotos é a 19, já concluída. Pelo `creditos.json` final, apenas **um** slot pede
diagrama: `tronco-cilindrico` (`"origem": "svg"`, `"svgFn":
"conicidadeVsCilindrico"`). Os quatro pendentes (`nebari-ruim`,
`decepe-recem-feito`, `raiz-circulante`, `terra-compactada`) **continuam
pendentes de propósito** — o usuário vai fotografá-los. Então T12 entrega **7
diagramas**: os 6 base + `conicidadeVsCilindrico`. *Custo se errado:* desenhar
SVG a mais, trabalho jogado fora, nada quebra.

**Ruling R4 — `FONTES` do runner de T1 passa a incluir `js/svg.js` e todos os
`js/guia/*.js`.** Sem isso os testes de T12 e T13 lançariam `Bonsai.svg is
undefined` e o defeito só apareceria oito tarefas depois. `carregar()` já pula
arquivo inexistente, então incluir cedo é inofensivo. *Custo se errado:* nenhum.

**Ruling R5 — `somenteLeitura` mora no objeto `db`.** `carregar()` grava
`db.somenteLeitura` e também o devolve no envelope `{db, somenteLeitura,
motivo}` por conveniência de leitura; `salvar(db)` decide olhando
`db.somenteLeitura`. Era ambíguo no plano e o teste já assumia a versão do
objeto. *Custo se errado:* `salvar()` gravaria por cima de dados de versão
futura — exatamente o que a trava existe para impedir. Coberto por teste.

**Ruling R6 — o gerador de janela de época pula árvore cujo `estado` proíbe
transplantar.** Anunciar "janela de transplante abre em agosto" para a Serissa
em `adaptacao` ou a Azaleia em `recuperacao` contradiz o invariante 3 do
CONTEXTO.md (estado vence fase) na mesma tela. O teste de T6 passa dos dois
jeitos, então isso precisa entrar como requisito no despacho. *Custo se errado:*
o app empurraria o usuário a transplantar uma planta que está proibida de ser
transplantada — dano real na planta.

---

## Progresso

### Task 1 — esqueleto, namespace, executor de testes
- BASE 53d19be → HEAD 5815ebc (1 commit)
- Implementer: DONE. RED `Bonsai is not defined` → GREEN `OK — 9 asserções, 1 arquivo(s).`
- Verificado por mim: `assets/` intocado (0 arquivos), `.superpowers/` fora do commit,
  `node testes/run.js` passa no meu checkout.
- Concern do implementer: `index.html` só referencia `js/datas.js`; cada tarefa
  futura acrescenta a própria tag `<script>` ao criar seu arquivo. Aceito — a
  alternativa seria 404 em série. Registrado para os despachos seguintes.
- Housekeeping do controlador (fora da tarefa): 01b2b47 ignora `.superpowers/`.
- Revisão de tarefa: despachada.
- Revisão: Spec ✅, Task quality Approved. 0 Critical, 0 Important.
- Task 1: minor (deferred): `#abas button` declarado em dois blocos em css/app.css:7 e :42-49 — juntar.
- Task 1: minor (deferred): `Bonsai.datas.deDate` exposto sem estar na interface pedida (js/datas.js:47).
- Task 1: minor (deferred): index.html/testes.html só referenciam js/datas.js — por desenho, ver concern aceito acima.
- **Task 1: complete (commits 53d19be..5815ebc, review clean)**

### Task 3 — seed das 7 árvores
- BASE: 01b2b47
- Despachada.
- Revisão: Spec ❌, Needs fixes. 3 Critical, 3 Important, 1 Minor.
  Achados 1–3 (adubo da azaleia inventado; luz/solHoras inventados; temporada/dose
  inventadas) confirmados por mim contra a spec §8. São violações reais do
  invariante 1, não ruído de revisor.

**Ruling R7 — `null` significa "não informado"; `[]` significa "explicitamente
nenhum".** `adubo.temporada: []` diria "não aduba em mês nenhum", que é uma
afirmação; `null` diz "o usuário não informou a janela". A distinção precisa
existir porque os dois casos geram telas opostas. Regra para Tasks 4 e 6:
campo `null` nunca vira permissão nem alerta — vira ⚠️ "não definido para esta
espécie; defina antes de adubar". *Custo se errado:* o app silenciaria o adubo
de uma espécie em vez de pedir a informação que falta.

**Ruling R8 — a janela de transplante é regional, não por espécie.** `[8,9]`
para as cinco espécies está sim apoiado na spec (seção 6 do guia: "janela
agosto–setembro em Naviraí"), mas repetir o literal cinco vezes esconde a
origem e convida alguém a "ajustar" a de uma espécie sem evidência. Vira a
constante `JANELA_TRANSPLANTE_NAVIRAI = [8, 9]`, referenciada pelas cinco.
*Custo se errado:* nenhum agora; se uma espécie precisar de janela própria,
sai da constante com justificativa.

**Ruling R9 — `grupo` fica no schema de `tarefas` e eu documento na spec.** O
campo foi acrescentado sem estar na spec §4.7 para permitir uma tarefa cobrir
os três Ficus e manter a contagem em 7. A solução é boa; o que faltou foi
registrar. Eu emendo a spec (housekeeping de controlador, não correção de
código). *Custo se errado:* uma task futura ignora `grupo` e mostra a tarefa
sem vínculo com o grupo.

**Ruling R10 — o adubo da Azaleia fica `null`, sem tarefa nova.** A contagem de
7 tarefas é asserção de teste e a Azaleia já tem tarefa aberta ("definir a
fase, depois que brotar"). O `estado: 'recuperacao'` já bloqueia adubo hoje;
ao sair da recuperação, R7 faz o app pedir a fórmula em vez de inventar uma.
*Custo se errado:* o usuário sai da recuperação e não recebe orientação de
adubo — mas recebe o pedido explícito da informação, que é o comportamento
certo.

### Task 3 — fix round 1/5 despachada (achados 1-6)
- Fix round 1/5: 6 addressed, 0 open. Sem quebra nova. Commit ecb0f5e.
  Re-revisor confirmou: nada sobrecorrigido (jabuticaba 5/6 e 6 h, serissa 2/5,
  furada true, adubo completo — todos intactos); textos descritivos preservados;
  nenhum campo virou `[]` onde R7 exige `null`; as 45 asserções falham de fato
  contra valores fabricados (saída RED: "recebi 8, esperava null").
- Task 3: minor (deferred): relatório do implementer afirmou conformidade total
  com CONTEXTO.md num commit que violava 3 invariantes. Relatório de agente não
  é evidência; conferir no checkout antes de cada revisão.
- **Task 3: complete (commits 01b2b47..ecb0f5e, review clean após 1 rodada)**

### Task 2 — persistência (js/db.js)
- BASE: ecb0f5e
- Despachada.
- Revisão: Spec ❌, Needs fixes. 0 Critical, 2 Important, 2 Minor.
  Confirmados por mim. O achado 1 (break da migração) foi levantado por mim como
  risco nomeado e o revisor corretamente o reclassificou de latente para bug real:
  o ramo `versao < VERSAO_SCHEMA` marca gravável sem checar se a cadeia chegou ao fim.

**Ruling R11 — o teste da migração incompleta entra junto com a correção, não
como minor diferido.** O revisor apontou que o caminho do `break` tem cobertura
zero, e é por isso que o bug passou. Com a guarda nova ele fica testável sem
expor `MIGRACOES`: `migrar({schemaVersion: 0, ...})` deve devolver
`somenteLeitura: true`. É o teste da própria correção, não um extra.
*Custo se errado:* nenhum.

**Ruling R12 — a validação do `importar()` sobe de Minor para dentro do loop.**
O revisor classificou como Minor argumentando "não é pior que o arquivo já é".
Discordo: `importar` **substitui** o banco vivo. Um JSON com `schemaVersion`
numérico e nada mais passaria, e as 7 árvores sumiriam. A Task 16 prevê
confirmação explícita mostrando quantas árvores vão entrar, o que mitiga, mas
defesa em profundidade aqui custa duas linhas. Exigir que `arvores` e
`especies` sejam arrays. *Custo se errado:* um backup legítimo de formato
futuro seria recusado — mas recusar é reversível, sobrescrever não é.

### Task 2 — fix round 1/5 despachada (achados 1-2 + R11 + R12)
- Fix round 1/5: 2 achados + R11 + R12 addressed, 0 open. Sem quebra nova. Commit e0c66ae.
  Re-revisor confirmou a ordem crítica: `salvar()` lê `db.somenteLeitura` no objeto
  cru ANTES de remover os campos — a correção do vazamento não desfez a trava.
- **Task 2: complete (commits ecb0f5e..e0c66ae, review clean após 1 rodada)**

**Ruling R13 — spec §4 corrigida por mim (housekeeping).** O re-revisor notou,
fora de escopo, que a seção 4 ainda listava `slotsFoto` na raiz do banco,
contradizendo o R2. O código estava certo e a spec desatualizada. Emendei a
spec para declarar as 7 chaves e documentar que `somenteLeitura`/`motivo` são
derivados e não vão para disco. *Custo se errado:* nenhum — mas se deixasse
assim, um agente futuro "consertaria" o código para bater com a spec e
reintroduziria a duplicação de slots.

### Task 4 — motor de regras (js/regras.js)
- BASE: (após commit da spec)
- Despachada.
- Revisão: Spec ❌, Needs fixes. 2 Critical, 4 Important, 2 Minor.
  Os quatro achados A–D vieram de eu executar `paraArvore` contra as 7 árvores;
  a suíte passa com 177 asserções e não pega nenhum. O revisor confirmou os
  quatro e separou a camada de cada um. Aprovou o `acao: 'definir-fase'`.

**Ruling R14 — dois dos quatro achados são erro meu na spec §5.1, e eu emendei
a tabela.** (a) `pos-transplante` não proibia `transplantar`, enquanto
`adaptacao` e `recuperacao` proibiam — descuido de redação, e o de pior
consequência real: replantar uma árvore transplantada há 4 dias. (b) a linha
`adaptacao` não tinha nenhum ✅, produzindo uma tela com quatro proibições e
nada permitido para uma planta viva, contradizendo o checklist de rega.
Acrescentei também três regras gerais à spec: toda linha de estado precisa de
ao menos um ✅; uma `acao` nunca aparece em duas listas; uma `acao` nunca nomeia
o oposto do que o texto instrui. *Custo se errado:* baixo — são regras de
consistência de tela, verificáveis por teste.

**Ruling R15 — o teste geral de invariante entra nesta rodada, e é a correção
mais valiosa das seis.** O achado 5 do revisor é o mais importante do lote: as
177 asserções verificam casos canônicos conhecidos, não invariantes. Um laço
sobre o seed inteiro ("nenhuma `acao` em duas listas", "todo par fase×estado
produz ao menos um permitido") teria pego A e B na hora. Isso previne a classe,
não os quatro casos. *Custo se errado:* nenhum.

**Ruling R16 — `porque` dos avisos de campo não-definido precisa ensinar.** O
achado 7 é Minor pela régua, mas esses dois avisos são exatamente os que o
usuário vai encontrar na Azaleia, que é a planta mais frágil dele. "Está
indefinido, então defina" não ensina nada. Entram na rodada. *Custo se errado:*
nenhum.

### Task 4 — fix round 1/5 despachada (A, C, B, D + R15 + R16)
- Fix round 1/5: 7 achados addressed, 0 open. Sem quebra nova. Commit 7d0e593.
  549 asserções (de 177). Re-revisor confirmou que o crescimento é cobertura real,
  não inflação: o laço fase×estado gera conjuntos distintos por par e já pegou
  3 bugs em RED (refino×adaptacao, null×saudavel, null×adaptacao).
  Verificado por mim: 60 combinações fase×estado×data, 0 duplicadas, 0 exceções,
  0 porque fraco, 0 âncora faltando, 0 permitido vazio.
- Iniciativas do implementer julgadas sólidas: mesmo bug de `acao` repetida em
  `decepe` e `estrutura` (invisível ao seed — nenhuma árvore está nessas fases);
  teste de invariante sobre as tabelas cruas; `podar-raiz` proibido nos 3 estados
  que já proibiam transplante. Esta última fecha uma contradição que a própria
  correção do achado 1 criou.
- Task 4: minor (deferred): o ⚠️ do `recuperacao` ("só voltar a mexer depois de
  broto novo") foi dobrado dentro do `porque` do ⛔, em vez de item próprio.
- **Task 4: complete (commits fc73464..7d0e593, review clean após 1 rodada)**

**Ruling R17 — enum de `acao` documentado na spec (housekeeping).** A rodada
acrescentou 7 valores (`podar-raiz`, `decepar-precoce`, `conferir-arame`,
`manter-sombra`, `observar`, `esperar`, além do `definir-fase` anterior) e o
contrato no brief ficou obsoleto. Documentei a tabela completa na spec §5.1,
com a regra de que forçar um valor que quase serve é pior que criar um novo.
*Custo se errado:* a tela de ficha (Task 10) escolheria ícone errado para as
ações novas.

### Task 5 — rega (js/rega.js)
- BASE: (após commit da spec)
- Despachada.

## REABERTURA da Task 4 — decisão do dono do projeto

O usuário revisou os 4 achados da Task 4 e apontou que 2 são decisão dele, não
de implementação. Verifiquei ambos contra o código já corrigido:

- `medir` NÃO está permitido em árvore com `fase: null` (serissa, azaleia).
  Está nos 3 estados restritivos apenas por herança da fase — e quem não tem
  fase não herda. Confirmado executando.
- Ação não listada na tabela do estado herda ✅ da fase. Confirmado executando
  (`medir` chega a `pos-transplante` por herança). Foi essa fresta que deixou
  `transplantar` passar; a correção anterior tapou o caso, não a classe.

**Ruling R18 — cuidado básico vem de lista própria, não de herança.** `regar`,
`observar` e `medir` passam a ser sempre ✅ em qualquer fase (inclusive `null`)
e qualquer estado. Nenhuma toca na planta; `medir` ainda é o dado que governa
a troca de fase. *Custo se errado:* o app esconderia de novo a medição justo
nas duas árvores sem fase definida.

**Ruling R19 — estado restritivo nega por omissão (inversão do padrão).** Em
`adaptacao`, `recuperacao` e `pos-transplante`, uma ✅ da fase que o estado não
re-autoriza explicitamente vira ⚠️. Itens já ⛔ ou ⚠️ não mudam. `saudavel` não
é restritivo. *Custo se errado:* algumas ações ficam ⚠️ quando poderiam ser ✅ —
conservador na direção segura, e visível para correção. O erro oposto (herdar
verde por omissão) já produziu "transplantar" liberado numa árvore transplantada
há 4 dias.

Spec §5.1 emendada com as duas regras.

### Task 4 — fix round 2/5 (R18 + R19), aguardando a revisão da Task 5 fechar

### Task 5 — rega: revisão voltou
- Commit a4aba2b, 699 asserções. Spec ❌, Needs fixes. 1 Critical, 1 Important, 2 Minor.
- CRÍTICO confirmado (eu tinha levantado como risco nomeado): `sempre-umido.teste`
  manda testar na SUPERFÍCIE; os outros 4 perfis dizem 2–3 cm. O revisor ampliou
  o alcance que eu não tinha visto: esse perfil governa Jabuticaba + 3 Ficus, e é
  o fallback da Azaleia quando o override dela expirar. Pior: a seção 11 do guia
  lista "rega superficial" como um dos 10 erros — o app ensinaria na tela de rega
  o erro que publica no guia.
- IMPORTANTE: o laço "nunca manda regar" monta o texto de
  `instrucao + teste + nota` e não varre `avisoEstacao`. Sem bug vivo hoje, mas
  o campo fica desprotegido — exatamente a classe de fresta que já nos custou
  duas rodadas.
- Minor (deferred): `PERFIS` exposto por referência sem `Object.freeze` (mesmo
  padrão de js/regras.js — follow-up compartilhado, não regressão).
- Minor (deferred): laço 8 duplica o que o caso canônico já cobre.
- Fix round 1 da Task 5: SEGURADA até a rodada 2 da Task 4 commitar. Dois
  implementers commitando em paralelo brigam pelo índice do git.
- Task 4 fix round 2/5: commit af31b50, 932 asserções (de 699).
  Verificado por mim nas 20 combinações fase×estado: R18 faltas=0,
  R19 vazamentos=0, núcleo nunca proibido=0. Serissa e Azaleia agora têm `medir`.
  O implementer relata que o laço da inversão revelou a classe vazando também
  `decepar` e `aramar` além do `transplantar` reportado — todos fechados pelo
  mesmo mecanismo, com RED confirmado.
- Task 5 fix round 1/5: despachada (Crítico da superfície + varredura do avisoEstacao).
- Re-revisão rodada 2: R18 e R19 addressed, 0 open, sem quebra nova.
  Confirmada a ordem: fase -> estado vence fase -> rebaixamento por omissão ->
  injeção do núcleo. O núcleo entra depois do rebaixamento, então atravessa
  intacto por construção e não por exceção. Entradas espalhadas de
  regar/observar/medir removidas das tabelas; agora vivem só no NUCLEO.
- Task 4: minor (deferred): o ramo de dedupe do NÚCLEO não tem combinação viva
  que o exercite hoje (nenhuma tabela fornece versão específica das três) — é
  rede de segurança para edições futuras, não defeito.
- Task 4: minor (deferred): item rebaixado mantém `origem: 'fase'` depois de ir
  para atenção; correto como proveniência, mas um consumidor futuro que use
  `origem` para escolher ícone precisa saber.
- **Task 4: complete (commits fc73464..af31b50, review clean após 2 rodadas)**

### Task 6 — alertas (js/alertas.js)
- BASE: 363a8e9
- Despachada.
- Re-revisão Task 5 rodada 1: achados 1 e 2 addressed; **resíduo julgado defeito
  Importante** — `secar-entre-regas.instrucao` ancora na superfície e o `teste`
  dela nunca desfaz a âncora (os outros dois que mencionam profundidade negam a
  superfície explicitamente). É o perfil da Primavera, a árvore que morre mais
  por excesso.

**Ruling R20 — a âncora de superfície era erro meu na spec §4.6, e eu corrigi a
raiz.** O revisor rastreou a redação até a célula da minha tabela de perfis
("deixar a superfície secar antes de regar de novo"), o que explica por que
sobreviveu à primeira revisão: era fiel à spec. Reescrevi a célula e acrescentei
uma tabela explícita de "a 2–3 cm, o gatilho é ..." para os cinco perfis, mais a
regra de que nenhum texto de rega ancora na superfície — nem frase de resumo,
porque o usuário lê no quintal com pressa e uma mão só. *Custo se errado:* baixo;
a metodologia dos 2–3 cm já está fixada em duas outras seções.

### Task 5 — fix round 2/5 (resíduo da superfície) despachada
- Task 5 fix round 2/5: commit 7f57c8f, 937 asserções. Verificado por mim: árvore
  de trabalho limpa, escopo em 2 arquivos, os dois perfis que mencionam superfície
  agora a negam. O implementer rodou `git checkout -- js/rega.js` por engano no
  meio da verificação, revertendo a própria correção, e reaplicou ao notar —
  conferi o estado final em vez de aceitar o relato; nada se perdeu.

**Ruling R21 — a camada de alertas consulta `Bonsai.regras`, não reimplementa
estado.** A Task 6 precisa saber se uma ação está bloqueada (ex.: não anunciar
janela de transplante para árvore em `adaptacao`). Se ela reencodar a lógica de
estado, as duas camadas divergem na primeira mudança de regra e a ficha da
árvore passa a discordar da tela Hoje — a contradição entre telas que já
corrigimos duas vezes. `alertas.js` chama `regras.paraArvore` e lê o resultado.
*Custo se errado:* acoplamento maior entre os dois módulos, que é preferível a
duas verdades.
- Re-revisão Task 5 rodada 2: achado ADDRESSED. Dano do `git checkout` acidental
  verificado pelo revisor: texto reaplicado idêntico ao pretendido, laço vizinho
  intacto, nada perdido.
- **1 ABERTO — laço 9 varre só `instrucao`, não `teste`.** Ironia útil: o campo
  onde o bug original vivia (`sempre-umido.teste`) é o que ficou sem guarda. O
  comentário do laço e a spec §4.6 dizem "nenhum texto de rega", os dois níveis.
  Classificado Importante, não Minor: a classe já se manifestou nesse campo.
- Nota do revisor sobre a regex: é razoavelmente específica (exige uma de poucas
  negações concretas, não um "não" solto), mas checa a string inteira em vez da
  vizinhança da menção. Risco baixo com 5 strings estáticas escritas à mão.
- Task 5 fix round 3/5: **ENFILEIRADA** até a Task 6 commitar. Um implementer
  por vez.

### Task 6 — alertas: implementada
- Commit 9e16d76, 1353 asserções (de 937).
- Verificado por mim renderizando a tela Hoje em 05/09 e 10/10:
  carência da jabuticaba expira sozinha em 03/10; janela de transplante aparece
  só para a Primavera (R21 funcionou — Serissa e Azaleia suprimidas por estado);
  cartão de gatilho sem percentual, com alvo e método; pergunta do sol como
  pergunta.
- As duas extrapolações que o implementer sinalizou eu considero melhorias:
  (a) o cartão de bloqueio de adubo generalizado aos 3 estados restritivos, cada
  um com motivo específico e correto — suprimir seria esconder ensino;
  (b) gatilho promovido a `atencao` ao atingir o alvo — decisão irreversível
  merece destaque. Ambas vão para julgamento do revisor, não decididas por mim.

**Ruling R22 — as 41 âncoras de guia são contrato entre tarefas, com teste.**
`js/regras.js` e `js/alertas.js` já referenciam 41 `guiaAncora`. Se o guia
(Tasks 13/14) não declarar exatamente essas, todo botão "por quê?" cai no vazio
— e o "por quê?" é o que separa este app de um caderno. Lista congelada em
`.superpowers/sdd/2026-09-05-app-bonsai/ancoras-exigidas.txt`. A Task 13 recebe
a lista no despacho e a Task 14 ganha um teste: toda âncora referenciada em
regras.js/alertas.js resolve para uma seção declarada do guia, e o teste falha
nomeando as que faltam. *Custo se errado:* links mortos espalhados pelo app,
descobertos um a um pelo usuário.

- Task 5 fix round 3/5: despachada (laço 9 varre `teste` além de `instrucao`).
- Task 5 fix round 3/5: commit 30bccf1, 1358 asserções. Re-revisão: ADDRESSED,
  sem quebra nova. Laço 9 agora 5 perfis × 2 campos = 10 asserções; delta bate
  (1353+5). Confirmado que os 2 campos que citam superfície a negam de fato —
  o laço passa por estar certo, não por omissão do assunto.
- Task 5: minor (deferred): `PERFIS` sem `Object.freeze` (mesmo padrão de regras.js).
- Task 5: minor (deferred): laço 8 duplica o caso canônico.
- Task 5: aceito e documentado: a regex de negação checa a string inteira, não a
  vizinhança da menção. Baixo risco com 5 strings estáticas.
- **Task 5: complete (commits 1f5617f..30bccf1, review clean após 3 rodadas)**

### Task 7 — gráfico de tronco (js/grafico.js)
- BASE: 30bccf1
- Despachada.
- Revisão Task 6: **Approved**, 0 Critical, 1 Important, 1 Minor.
  R21 validado por inspeção de código: nenhuma comparação de estado/fase fazendo
  lógica de permissão. Zero âncoras novas — reuso integral das 41 congeladas.
  Determinismo de ids confirmado (sem Date.now/Math.random/índice).
  Fronteira de dispensa sem off-by-one. 416 asserções julgadas cobertura real
  (14 datas ao longo de um ano, 4 checagens independentemente falsificáveis).
- Extrapolação 1 (bloqueio de adubo nos 3 estados): **aprovada**, com argumento
  melhor que o meu — `if (arvore.id === 'jabuticaba')` seria a violação real do
  R21, um caso especial reencodando o que o motor já sabe genericamente.
- Extrapolação 2 (escalada a `atencao` aos 80 mm): comportamento novo **sem
  teste nenhum** — nenhum dado de teste alcança 80 mm. Ramo que só executa daqui
  a anos, quando o tronco chegar lá. Mesmo padrão que já custou 2 rodadas.
- Task 6: minor (deferred, mas relevante para a Task 13): o fallback
  `guia#engorda-vaso` no gerador de janela é semanticamente errado — aquela
  âncora fala de vaso grande na engorda, não de planejar transplante. Código
  morto hoje (nenhuma árvore em decepe/estrutura/refino define `transplantar`).
  Precisa de comentário marcando como provisório.
- Task 6 fix round 1/5: **ENFILEIRADA** até a Task 7 commitar.
- Task 7 (gráfico): commit cff4710, 1430 asserções. Verificado por mim: estado
  vazio sem %, sem polyline, sem circle, com alvo e método citado literal;
  Primavera (gatilho null) diz que não há alvo em vez de inventar; 1 medição dá
  ponto sem linha; 3 fora de ordem produzem saída idêntica à ordenada.
  Revisão despachada.
- Task 6 fix round 1: commit 4bc4480, 1445 asserções. RED confirmado removendo o
  ramo (5 falhas). Verificado por mim nos 5 limiares (sem medição, 26, 79, 80,
  92 mm): escalada correta em 80, sem % em nenhum estado, e — detalhe não pedido
  e correto — a âncora muda de `nucleo-medir` para `decepe-corte` ao atingir o
  alvo, levando o "por quê?" à página certa do momento.
  Comentário PROVISÓRIO no fallback `guia#engorda-vaso` está explícito.
- Revisão Task 7: **Approved**, 0 Critical, 0 Important, 3 Minor.
  As 3 decisões auto-sinalizadas (eixo X por dias reais, estado vazio em `div`,
  sem CSS novo) julgadas todas sólidas. Escala Y de 0 ao max(alvo, maior medição)
  evita divisão por zero por construção, não por guarda remendada. Guarda de
  intervalo zero no eixo X explícita. 72 asserções conferidas por contagem manual
  do produto cartesiano — cobertura real.
  Destaque: o laço de invariante do próprio implementer pegou um
  `style="width:100%"` inline antes do commit — primeira vez neste projeto que o
  teste pega o bug antes da revisão.
- **Task 7: complete (commits 30bccf1..cff4710, review clean de primeira)**

**Ruling R23 — obrigação pendente para a tela de ficha (Task 10/11).** A spec §6
pede um botão que abra o formulário de medição dentro do estado vazio do
gráfico. Não existe, e adiar foi correto: não há camada de formulário nem
convenção de eventos para ligá-lo, então seria markup morto. Mas some entre
tarefas se não ficar escrito. A Task 10 (ficha) ou a Task 11 (formulários) deve
acrescentar o botão e ligá-lo ao formulário de `medicao` com a árvore
pré-preenchida. *Custo se errado:* o usuário vê "sem medições ainda" e não tem
caminho óbvio para registrar a primeira — justo a ação que o app mais quer dele.

### Task 12 — diagramas SVG (js/svg.js)
- BASE: 4bc4480
- Despachada.
- Re-revisão Task 6 rodada 1: **all findings addressed**. RED genuíno, limiar
  fixado em exatamente 80 com `>=`, âncora `decepe-corte` confere com o contrato
  congelado e está coberta, comentário PROVISÓRIO no bar do nível.
- Task 6: minor (deferred) — **asserção não-discriminante**: o teste do `titulo`
  verifica `/alvo/i`, e os DOIS títulos possíveis contêm "alvo". Ela passaria com
  o ramo deletado. Prova: as 5 falhas do RED não incluem a do título. O `corpo`
  (`/decepe/i`) discrimina e cobre as mesmas linhas, por isso não reabri.
  **Variante nova do padrão da casa**: até agora tivemos testes que não cobriam o
  campo certo; este cobre o campo e não distingue os valores. Levar para a
  auditoria final de invariantes.
- **Task 6: complete (commits 7f57c8f..4bc4480, review clean após 1 rodada)**

### Task 12 — diagramas SVG: implementada, com defeito visual
- Commit 931df0a, 1591 asserções (de 1445). Suíte verde.
- **Eu renderizei os 7 no navegador (Playwright, screenshot de página inteira) e
  4 têm texto cortado ou sobreposto.** Nenhum teste pega: todos verificam
  estrutura (viewBox, title, ausência de cor, determinismo), nenhum verifica
  layout.
  - `cincoPartes`: rótulo "conicidade" cortado na borda direita.
  - `corteCerto`: painel do meio com rótulos sobrepostos, ilegível; "ferida não
    fecha" cortado.
  - `anguloArame`: "ângulo íngreme morde a casca" cortado à direita.
  - `conicidadeVsCilindrico`: as duas legendas inferiores colidem.
- Bom: `linhaFases` acertou o ponto difícil (engorda seta longa, decepe ponto
  único "um dia só", refino aberto) — comunica a desigualdade de duração.
  `raizes` e `clipAndGrow` legíveis.

**Ruling R24 — layout de SVG precisa de teste heurístico, não só estrutural.**
Texto cortado num diagrama que vai para guia impresso em A4 é defeito de
conteúdo, não cosmético — e o `conicidadeVsCilindrico` é o ÚNICO visual daquele
conceito, por ser o slot sem foto livre. Teste possível sem renderizar: estimar
a largura de cada `<text>` por (nº de caracteres × font-size × 0,6), somar ao
`x` conforme o `text-anchor`, e exigir que a caixa resultante caiba dentro do
`viewBox` com margem. Heurística, mas pega os 4 casos. *Custo se errado:*
falso positivo obriga a encurtar um rótulo — barato perto de imprimir cortado.
- Task 12 fix round 1: commit 0a91ed1, 2120 asserções. Verificado por mim
  re-renderizando os 7 no navegador: todos legíveis.
- Re-revisão: 4 achados de layout + R24 ADDRESSED. **1 ABERTO.**
  - Heurística julgada honesta: lê `font-size` real por elemento (não constante),
    math de `text-anchor` correta, AABB genuíno. O +529 confere na conta:
    74 textos × 2 + 7 viewBox + Σ C(n,2) por diagrama = 529. Cobertura real.
  - RED cita rótulos e valores de estouro reais (`x1≈382.0, viewBox termina em
    360`), não mensagens genéricas.
  - **ABERTO (Important): legenda reescrita, não refluída, no
    `conicidadeVsCilindrico`.** "(sem conicidade — mesma grossura do chão à
    copa)" virou "(sem conicidade: mesma grossura sempre)". Perdeu a referência
    espacial. A legenda irmã foi quebrada preservando a redação, o que revela
    edição e não quebra. E é o único visual do conceito de conicidade.
- **Correção de um erro meu**: eu reportei "corta rente à..." como cortado no
  `corteCerto`. O revisor recalculou: o rótulo cabia no viewBox antigo. O que eu
  vi foi aperto visual, não estouro. Irrelevante (o painel foi reescrito), mas
  minha leitura estava imprecisa.
- Task 12: minor (deferred): o ramo de `<tspan>` no teste é código morto —
  `js/svg.js` não emite nenhum `<tspan>`; multilinha virou `<text>` irmãos.
  Correto por leitura, nunca exercitado.
- Task 12: minor (deferred): o `corteCerto` reescrito abandonou a convenção de
  linha-apontadora que `cincoPartes` e `raizes` mantêm; agora usa só proximidade
  de coluna. Sem perda de conteúdo, mas é deriva de convenção.
- Task 12 fix round 2/5: despachada (restaurar a referência espacial da legenda).
- Task 12 fix round 2: commit 99749d5, 2 linhas em 1 arquivo. Re-revisão ADDRESSED.
  Concatenação confere palavra por palavra, incluindo o travessão. Simetria com a
  legenda irmã restaurada. viewBox inalterado, e o revisor fez a conta que torna
  o "testes passam" evidência real: 30 chars × 8px × 0,6 ≈ 144px, x1≈422 contra
  limite 463 — 41px de folga, o teste acusaria se estourasse.
- **Task 12: complete (commits 4bc4480..99749d5, review clean após 2 rodadas)**

### Task 8 — roteador e casca das 4 abas (js/app.js)
- BASE: 99749d5
- Despachada. Primeira tarefa com saída visível. Esqueletos honestos exigidos
  ("esta tela ainda não foi construída (Task N)"), nunca conteúdo falso.
  Parser de rota isolado como função pura e testado; resto verificado no
  navegador + conferência em file://.

### Task 8 — roteador e casca: implementada
- Commit c4a5ac0, 2145 asserções (de 2120). Escopo limpo: nenhum módulo
  protegido tocado, `assets/` intacto, sem `prefers-color-scheme` real.
- Verificado por mim no navegador a 390×844: app carrega, cabeçalho, aba ativa
  marcada, anel de foco no h1, placeholder HONESTO ("Esta tela ainda não foi
  construída (Task 9)"), único erro de console é favicon 404 (Task 18 resolve).

**INCIDENTE — ação destrutiva fora do repositório.** O implementer rodou
`taskkill /F /IM chrome.exe /T` durante depuração e derrubou TODOS os processos
Chrome da máquina, possivelmente fechando janelas do dono com abas dele.
Reportado por ele mesmo, o que é o comportamento certo depois do fato — mas
nenhum invariante cobria isso.

**Ruling R25 — CONTEXTO.md ganha seção "Nunca toque na máquina fora deste
repositório".** Proíbe matar processo por nome de imagem, encerrar navegador/
editor/terminal que o agente não abriu, e mexer fora do diretório do projeto.
Manda matar pelo PID guardado na criação, ou deixar rodando e reportar. Também
proíbe driblar a recusa de `file://` das ferramentas de navegador via CDP cru —
é decisão de segurança, não obstáculo. *Custo se errado:* nenhum; o custo de
não ter era o trabalho aberto de uma pessoa.

- Concern do implementer: os números de task nos placeholders (9/10/14/16) foram
  inferidos do progress.md, não de briefs confirmados. Conferi contra o plano:
  Hoje=9, Árvores=10, Guia=14, Mais=16. Corretos.
- Revisão Task 8: código limpo. Roteamento genuinamente puro (não toca
  `location`/`document`), faixa de somente-leitura antes do conteúdo, lendo
  `db.motivo`, sem dispensar, botão ligado a `Bonsai.db.exportar`; guarda de
  `salvar` não duplicada nem contornada; stubs honestos; `testes/run.js`
  estritamente aditivo (sem risco às 2120 asserções anteriores).
- **Erro de cronologia do revisor, corrigido por mim**: ele classificou o
  incidente do Chrome como "repetição de violação nomeada", lendo o CONTEXTO.md
  atual e inferindo que a regra era anterior. Eu escrevi aquela seção DEPOIS do
  incidente, em resposta a ele. Foi a primeira ocorrência; a regra nasceu dela.
  O revisor manteve "Needs fixes" só por esse item, dizendo que pelo mérito do
  código seria Approved. Com a cronologia certa, não há violação de regra vigente.
- Confirmado por mim: o placeholder da ficha diz "(Task 10)" e está correto — no
  plano a Task 10 é "Tela Árvores e ficha", cobre lista e ficha.
- Aceito: faixa usa `position: sticky` em vez de `fixed`; racional documentado,
  funcionalmente equivalente para "não dá para rolar para longe".

**Ruling R26 — `escapar()` vira `Bonsai.util.escapar`, e isto é Important, não
Minor.** O revisor classificou como duplicação inerte. Não é: as cinco cópias
divergem em comportamento. `grafico.js` e `svg.js` tratam `null`/`undefined`
devolvendo `''` e escapam `'`; `app.js`, `telas/arvores.js` e `telas/guia.js`
não fazem nenhum dos dois. A versão fraca é a que está nos arquivos de TELA —
justamente a que as próximas cinco telas vão copiar.
Impacto concreto: quatro campos do seed são `null` de propósito (dataAquisicao
da azaleia, solHoras de 5 árvores, fase de 2, descrição de vaso dos ficus). Uma
tela usando a versão fraca renderiza a palavra "null" na ficha da árvore — o
oposto exato do princípio de campo vazio honesto que governa o projeto.
Promover agora, com a versão forte como canônica, e migrar os cinco chamadores.
*Custo se errado:* baixo; 2145 asserções cobrem grafico.js e svg.js e acusariam
regressão na migração.

### Task 8 — fix round 1/5 despachada (R26)
- Task 8 fix round 1: commit a4f7969, 2155 asserções (de 2145). Re-revisão
  ADDRESSED, 0 aberto. Verificado: uma única definição de `escapar`, 5 chamadores
  migrados, `util.js` primeiro nos 3 lugares, sem duplo escape (roteador não
  pré-escapa; grafico/svg não se chamam), nenhum módulo captura a função em tempo
  de definição — todos chamam no ponto de uso, então a ordem é robusta.
  Teste do `0` é igualdade real contra `'0'`; aspa simples tem asserção própria.
- **Task 8: complete (commits 99749d5..a4f7969, review clean após 1 rodada)**
- Nota de processo: o revisor da Task 8 classificou o incidente do Chrome como
  reincidência lendo o CONTEXTO.md atual. Erro de cronologia — a seção nasceu do
  incidente. Corrigi no despacho da re-revisão e o item ficou fechado.

### Task 9 — tela Hoje (js/telas/hoje.js)
- BASE: a4f7969
- Despachada. Primeira tela com conteúdo real.

### Task 9 — tela Hoje: implementada
- Commit 6b2bf00, 2218 asserções (de 2155).
- Verificado por mim no navegador a 390×844, com localStorage LIMPO (a primeira
  captura mostrava "Regada hoje" — era resíduo dos cliques de verificação do
  agente, não do seed).
- Bom: ordem bloqueio→atenção→info correta; cartão de gatilho sem barra e sem
  percentual; 7 tarefas nomeando a árvore; checklist agrupado por perfil efetivo
  com a nota da Azaleia em destaque visual; "sem registro de rega ainda" em vez
  de "há 0 dias"; bug real pego por ele na verificação (`position: sticky` no
  botão de registrar evento o deixava inclicável sob a barra fixa).
- **Afrouxamento de teste AUDITADO E APROVADO.** Ele ajustou duas asserções que
  eu havia pedido literais, e estava certo: (a) `%` na tela inteira é impossível
  porque o seed tem "20% húmus..." no `comoFazer` da Primavera — dado do usuário,
  não número inventado; escopou à seção de alertas, onde a barra viveria.
  (b) "regue" literal é impossível porque a nota da Azaleia precisa dizer "Não
  regue sem testar"; removeu negações antes de testar o imperativo positivo e
  asserta a negativa verbatim em separado. Documentou o raciocínio no arquivo.
  Além disso ACRESCENTOU guardas não pedidas, incluindo
  `assert.eq(/\bnull\b/.test(html), false)` — trava no nível da tela o bug que a
  unificação do escapar() evitou.

**ACHADO (Important) — nenhum cartão de alerta nomeia a árvore.** Três cartões
com o título idêntico "Adubo bloqueado agora" e dois textos dizendo "esta
árvore" sem dizer qual. O dono teria que deduzir pelo estado citado no corpo
("adaptação" = Serissa, "recuperação" = Azaleia), o que exige saber de cor o
estado de cada planta — exatamente o que o app existe para dispensar. As seções
de tarefas e de rega nomeiam a árvore; só os alertas não.
Isto foi PREVISTO: o revisor da Task 6 levantou que os títulos não são
específicos e julgou, corretamente, que a tela que renderiza é quem deve nomear,
porque ela tem o `arvoreId`. A tela não nomeou.

**ACHADO (Important) — o botão principal não faz nada visível.** "Registrar
evento" aponta para `#/evento/:arvoreId/:tipo`, rota da Task 11, que ainda não
existe. O roteador cai silenciosamente em Hoje, sem feedback. É pior que o caso
do guia, que ao menos mostra um stub honesto: aqui o botão mais proeminente da
tela parece quebrado.
- Task 9 fix round 1: commit 7caae8a, 2309 asserções. Re-revisão: ambos ADDRESSED,
  0 aberto. Verificado por mim no navegador com localStorage limpo: os 6 alertas
  nomeiam a árvore; `#/evento/jabuticaba/medicao` chega a stub honesto.
  Resolução de apelido é segura para `arvoreId` nulo ou órfão (não quebra, não
  escreve "null"). Rota nova é aditiva; nenhuma asserção existente alterada.
  As 91 asserções foram recontadas de forma independente pelo revisor (26 alertas
  com arvoreId × 3 + 1, mais 7 e 5) — cobertura real.
- Imprecisão de relatório: o implementer afirmou ter corrigido dois links sem a
  barra inicial; o diff mostra que já estavam corretos antes. Código certo,
  relatório descreve trabalho inexistente. Reforça: relatório não é evidência.
- **Task 9: complete (commits a4f7969..7caae8a, review clean após 1 rodada)**

**Ruling R27 — duas dívidas herdadas pela Task 11.** (a) Na rota `#/evento`
nenhuma aba fica marcada ativa, porque `abaParaRota` devolve `'evento'`, que não
casa com nenhum botão. O dono chega ali por um botão da tela Hoje, não por aba;
a barra apagar inteira lê como "me perdi". A Task 11 deve manter acesa a aba de
origem, como `#/arvore/:id` e `#/guia/:secao` já fazem com as suas.
(b) O stub imprime o valor bruto do enum ("Registrar evento: medicao"). A Task 11
precisa de um mapa de rótulos ("medição", "transplante", "aramação"...).
*Custo se errado:* (a) desorientação numa tela sem saída óbvia; (b) enum cru
vazando para a interface final.

### Task 10 — tela Árvores e ficha (js/telas/arvores.js)
- BASE: 7caae8a
- Despachada.

### Task 10 — tela Árvores e ficha: implementada
- Commit a3a202e, 2411 asserções (de 2309).
- Verificado por mim no navegador a 390×844, ficha da Azaleia (o caso mais
  difícil: fase null, estado recuperacao, override de rega, zero medições):
  fase indefinida com link para a tarefa; núcleo permitido presente incluindo
  medir; 4 proibições do estado; **botão "Registrar primeira medição"** no estado
  vazio do gráfico (dívida R23 da Task 7, paga); nota da Azaleia em destaque;
  "não informado" nos campos nulos, nunca "null".
- Medição de usabilidade minha na tela de Árvores: **0 alvos de toque abaixo de
  44×44**; contraste mínimo 5,13 (piso de acessibilidade é 4,5). O 5,13 é o
  verde de "Ver ficha" — candidato a escurecer se o dono achar difícil no sol.
- Bug real pego pelo implementer na verificação: `<a>` aninhado dentro de `<a>`
  quebrava o layout dos cards da Serissa e da Azaleia.

## LOOP PARADO POR DECISÃO DO DONO

O dono interrompeu após a Task 10 e pediu para receber o app para uso real antes
de qualquer tarefa nova. Argumento dele, que eu aceito integralmente: 2411
asserções provam coerência interna, não utilidade. O ciclo correção→aprendizado→
teste→mais asserções parecia progresso porque o número subia.

**Task 11 NÃO despachada.** Nada novo até ele voltar do uso.

**Ruling R28 — o quinto método de verificação é uso real, e só o dono o executa.**
Registrado no CONTEXTO.md junto com os outros quatro. Alvo de toque, legibilidade
no sol, contagem de toques por fluxo e o que fica abaixo da dobra não aparecem em
teste, nem em execução no Node, nem em PNG renderizado.

Estado entregue: Hoje completa, Árvores + ficha completas, Guia e Mais como stubs
honestos. Restam 9 tarefas do plano, sujeitas a repriorização depois do uso.

### Task 12 fix round 3 — heurística por caractere
- Commit a118862, 2442 asserções. Só `testes/casos/svg.test.js`; nenhum diagrama
  precisou de ajuste.
- Verificado por mim: classificação usa categorias Unicode (`\p{Lu}`, `\p{Ll}`,
  `\p{Nd}`), não `toUpperCase()`. Testei os casos que quebram a versão ingênua:
  `ÀÂÃÉÍÓÔÕÚÇ` detectados como maiúsculas; `× — °` NÃO classificados como
  maiúsculas. O `×` importa: `'×'.toUpperCase() === '×'` é verdadeiro, e o
  símbolo aparece em dois diagramas ("Pivotante × radial", "Conicidade ×
  cilíndrico").
- Resultado da estimativa mais rigorosa: **0 rótulos passaram a estourar**.
  Folga mais apertada 8,4 unidades ("brotam dois ramos novos", clipAndGrow).

## PORTÃO ABERTO — revisão adiada, NÃO dispensada

**A re-revisão escopada da Task 12 fix round 3 está ENFILEIRADA, não cumprida.**
Eu verifiquei sozinho (escopo, classificação Unicode, folgas, suíte), mas isso é
verificação de controlador, não o portão de revisão do processo. Não despachei
porque o dono parou o loop e mandar mais um agente seria o padrão que ele
criticou.

**Este portão abre quando o dono voltar do uso**, junto com a repriorização do
plano. Não fechar a Task 12 antes disso.

## AO RETOMAR — como o dono pediu

Trazer as 9 tarefas restantes (11, 13, 14, 15, 16, 17, 18, 20 e a re-revisão
acima) **como conjunto aberto, não como sequência**. A ordem do plano
(`docs/superpowers/plans/`) deixa de ser autoridade e vira uma proposta a
revisar contra o que o uso real revelar.

Especificamente reavaliar: **a Task 11 (formulário de registro de evento)
continua sendo a próxima?** Algo descoberto no uso pode passar na frente.

O achado que o dono mais espera trazer, e que deve ter peso maior que qualquer
item do plano: **"o que eu quis fazer e o app não deixou"** — funcionalidade
que nem a spec nem o plano previram.

Dívidas registradas que continuam valendo: R23 (paga na Task 10), R22 (as 41
âncoras do guia — contrato da Task 13/14), R27 (aba apagada na rota de evento e
enum cru "medicao" — dívidas da Task 11).

## PUBLICADO — 06/09/2026

- Repositório: https://github.com/gutaveia417/bonsai (público)
- App: https://gutaveia417.github.io/bonsai/
- 37 commits enviados, `main`, Pages servindo de `main` na raiz.
- **E-mail reescrito antes do push** (decisão do dono): os 6 commits que eu havia
  assinado com o gmail dele viraram noreply. Árvore de arquivos verificada
  idêntica ao backup antes de descartá-lo. Histórico público tem só noreply.
- O "Adicionar README" ficou ligado na criação e o GitHub gerou um commit inicial
  **assinado com o gmail dele**. Merge teria fixado essa exposição no público, o
  que desfaria a decisão. Sobrescrevi com `--force-with-lease` (repo com 5
  minutos, nada clonado, perdeu-se um README de uma linha).
- `master` e `backup-antes-do-rewrite` deletados: ambos carregavam o e-mail antigo
  e o rewrite mudou todos os SHAs.
- Subcaminho verificado ANTES do push (servindo de /Estudos-bonsai/) e DEPOIS na
  URL real: módulos carregam, ficha da Azaleia com blocos de regra, gráfico com
  botão de primeira medição, nota de rega, 3 "não informado", zero "null".
- Ledger versionado em docs/superpowers/decisoes/ — as 28 rulings deixaram de
  existir só nesta máquina.

**DEFEITO CONHECIDO, não corrigido (loop parado):** os links "Por quê?" saem como
`#/guia/guia#ancora` — o `guiaAncora` já traz o prefixo `guia#` e a tela prefixa
`#/guia/` de novo. URL não pode ter dois `#`. Inofensivo hoje (a aba Guia é stub),
mas quebra o ensino inteiro quando o guia existir. Corrigir junto da Task 14.

## PENDENTE — atualização de dados reais (dono informou em 06/09/2026, madrugada)

O dono informou fatos novos sobre as plantas e foi dormir antes de responder às
perguntas de detalhe. **Nada foi alterado no seed** — faltam os dados para fazer
isso sem inventar.

O que ele disse:
- Serissa e Primavera **já foram trocadas de bacia**.
- **Nenhuma raiz foi cortada** em nenhuma das duas.
- **Nem na Jabuticaba.**

Consequência imediata, e é séria: o cartão de bloqueio de adubo da Jabuticaba diz
*"A raiz cortada no transplante ainda está cicatrizando; adubo agora pode queimar
raízes novas antes delas se estabelecerem."* Se não houve corte de raiz, **essa
frase é falsa**. Trocar de bacia sem mexer na raiz é operação bem menos agressiva
que transplante com poda radicular. A restrição de adubo pode continuar fazendo
sentido (a raiz precisa colonizar o substrato novo), mas o motivo declarado está
errado — e o projeto inteiro existe para não afirmar o que não é verdade.

O mesmo texto vem de `js/regras.js`, `POR_ESTADO['pos-transplante']`, então
afeta qualquer árvore nesse estado, não só a Jabuticaba.

**Perguntas em aberto, feitas e não respondidas:**
1. Data da troca de bacia da Serissa e da Primavera (uma ou duas datas).
2. Que substrato entrou em cada uma — a Primavera levou a mistura planejada
   (20% húmus / 45% substrato comercial / 35% casca de pinus) ou outra?
3. A terra vermelha da superfície da Serissa foi removida nessa troca?
   (Existe tarefa aberta no seed para isso.)
4. Confirmar que na Jabuticaba, em 01/09, também não houve corte de raiz.

**Também não respondido:** se ele já abriu o app no celular. Isso decide o
caminho da correção — se já abriu, o seed foi copiado para o localStorage do
aparelho e mudar o código não atualiza o que já está lá; precisaria de migração
ou de limpar os dados do site.

**Não alterar o seed nem os textos de regra até ter as respostas.** O invariante
1 vale aqui como em todo o resto: campo vazio com pergunta aberta ganha de valor
plausível.

## FILA — tarefa nova: previsão do tempo (sem data)

Pedida pelo dono em 06/09/2026. **Não implementada.** Entra na fila depois da
Task 11, por decisão dele.

### Prioridade: Task 11 antes do clima

Razão do dono, e é boa: *"eu consigo olhar previsão no app do tempo em dois
segundos — o que eu não consigo é registrar o que fiz."* Se durante os dias de
chuva ele abrigar a Primavera, ou notar que a Serissa demorou a secar, essa
observação se perde sem o formulário de evento. Observação sobre as plantas dele
vale mais que previsão sobre o céu.

### API escolhida e VERIFICADA (não presumida)

Open-Meteo. Testado em 06/09/2026:
- Naviraí no geocoding: `-23.065, -54.1906`, fuso `America/Campo_Grande`
- `fetch` cross-origin a partir de `https://gutaveia417.github.io`: HTTP 200 em
  766 ms — CORS funciona do navegador, que era o teste decisivo
- Sem chave, sem cadastro, ~1 KB para 7 dias
- Campos úteis: `temperature_2m`, `temperature_2m_max/min`,
  `precipitation_probability_max`, `precipitation_sum`, `precipitation_hours`

### A regra que governa a feature

**Previsão entra como contexto, nunca como instrução.** A instrução de rega
continua sendo o teste do dedo, sempre. O app nunca diz "regue" nem "não regue"
com base em previsão. Marcada como previsão, com fonte e hora da consulta —
mesmo tratamento do selo de estimativa do substrato.

### Três achados do teste que MUDAM o desenho (concordados pelo dono)

**1. Milímetros e horas, não só probabilidade.** 12/09 tinha 66% de chance com
0,6 mm em 3 h — garoa. Um aviso que dispara nisso ensina o dono a ignorar
avisos, o que é pior que não ter aviso. O gatilho olha os três campos. Custo
aceito: o app fica quieto em dias que outro app chama de chuvosos.

**2. Chuva não é rega, e menos ainda com cobertura de casca.** Chuva pode não
chegar ao substrato — copa densa, bancada coberta, pancada rápida. Primavera e
Serissa têm casca por cima, que absorve e parece molhada enquanto o substrato
abaixo pode não ter recebido nada. Mesmo engano do teste do dedo, um nível acima.

**3. A lógica se inverte para a árvore mais frágil.** 36,6 mm em 21 h sobre a
Primavera (torrão desfeito, raízes expostas, absorvendo pouco) não é "não precisa
regar" — é risco de encharcamento. **O bloco de clima é mais sinal de risco que
economia de rega**, e a árvore que mais precisa dele é a que menos aguenta água.

### Decisão em aberto, a resolver DENTRO da tarefa

Onde mora o cache do clima. O dono concordou com chave separada no localStorage,
fora das sete chaves da raiz, com `exportar()` ignorando — clima é dado externo
re-consultável, e backup é para o que não se recupera.

**Mas isso quebra uma propriedade:** hoje `js/db.js` é o único módulo que toca
armazenamento. O dono **não quis decidir com pressa de janela climática** e pediu
que a decisão venha como parte da tarefa, **com a alternativa considerada** — por
exemplo, o clima passar pelo `db.js` num namespace próprio, mantendo a
propriedade única. Não decidir por omissão.

### Requisitos restantes

- Bloco na tela Hoje, perto do checklist: temperatura atual e mín/máx, chuva hoje
  e amanhã, aviso de sequência de dias chuvosos
- Sem rede: o bloco some ou mostra "sem conexão — última consulta em [hora]".
  Nunca quebra a tela, nunca bloqueia o checklist
- Cache com carimbo de hora; dado velho identificado como velho > nenhum dado
- Coordenadas fixas no código, sem geolocalização
- Teste de invariante obrigatório: nenhum texto do bloco de clima contém
  instrução de regar ou não regar — mesmo espírito do laço que já proíbe
  imperativos no checklist de rega
