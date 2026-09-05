# App de Bonsai — Plano de Implementação

> **Para executores agênticos:** SUB-SKILL OBRIGATÓRIA: usar
> `superpowers:subagent-driven-development` (recomendado) ou
> `superpowers:executing-plans` para implementar tarefa a tarefa.
> Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Goal:** App web estático, offline e em PT-BR que registra 7 bonsais em
formação e ensina bonsai a um iniciante completo, mostrando em cada tela o que é
permitido, o que é proibido e por quê.

**Architecture:** JS vanilla em `<script>` clássicos sobre um namespace global
`Bonsai`, sem build step e sem ES modules (para funcionar também via `file://`).
Camada de lógica pura (`datas`, `db`, `regras`, `rega`, `alertas`, `grafico`)
separada da camada de render (`app.js` + telas), o que permite testar toda a
regra de bonsai headless no Node sem DOM. Persistência em localStorage para o
JSON estruturado e IndexedDB para blobs de imagem.

**Tech Stack:** HTML5, CSS3, JavaScript ES2020 sem dependências. Node 24 apenas
como executor de testes. Python 3 apenas como servidor estático local.

**Spec:** `docs/superpowers/specs/2026-09-05-bonsai-app-design.md`

---

## Global Constraints

Valem para **toda** tarefa. Copiadas da spec.

- **R1** Sem backend, sem login, sem dependência de rede em runtime.
- **R2** Persistência local apenas: localStorage (chave `bonsai.db.v1`) + IndexedDB (base `bonsai-fotos`).
- **R3** Funciona offline após o primeiro carregamento.
- **R4** Mobile-first. Alvo de toque mínimo **44×44 px**.
- **R5** Todo texto de interface e de conteúdo em **PT-BR**.
- **R6** `color-scheme: light` forçado no `<html>` e em CSS. Nenhum bloco `prefers-color-scheme: dark`.
- **R7** Toda página de referência imprime em A4.
- **R8** Zero hotlink. Todo asset é local, em `assets/`.
- **R9** Nenhum prazo fixo inventado onde a regra real é por medida ou por época. Única exceção autorizada: conferência mensal de arame.
- **R10** **Nenhuma menção a Adenium obesum / rosa do deserto vinculada a árvore do usuário.** A mistura para suculentas existe no guia como referência geral e nada mais.
- **P1 (princípio)** **Campo vazio com tarefa aberta é melhor que número plausível.** Nada entra no seed que o usuário não tenha fornecido de fato.
- **Imagens** IA permitida **apenas** nos 5 slots de espécie formada, sempre rotulada "ilustração — não é foto". Os 6 slots técnicos vão de foto livre → diagrama SVG → slot pendente. Nunca IA.
- **Sem ES modules.** Todo arquivo `js/` é `<script>` clássico que estende `var Bonsai = window.Bonsai || {}`.
- **Sem dependências externas.** Nenhum `npm install`, nenhuma CDN.
- **Commits pequenos e descritivos**, um por tarefa no mínimo. Nunca um commit gigante no final.

### Convenções de nomes travadas

Datas são sempre strings ISO `'AAAA-MM-DD'`. Nunca objetos `Date` persistidos.
Diâmetro sempre em **milímetros inteiros** (`diametroMm`). Meses são números
**1–12**. IDs de árvore são slugs (`'jabuticaba'`, `'ficus-a'`).

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Casca, `<script>` na ordem, meta viewport, `color-scheme` |
| `css/app.css` | Layout mobile-first, abas, cards, blocos de regra |
| `css/print.css` | A4, escala de cinza, quebras, ocultar fotos |
| `js/datas.js` | Aritmética de datas ISO. Zero dependências |
| `js/db.js` | localStorage, `schemaVersion`, migração, export/import |
| `js/dados-iniciais.js` | Seed: 5 espécies, 7 árvores, 7 tarefas, slots de foto |
| `js/regras.js` | `fase` × `estado` → permitido / proibido / atenção |
| `js/rega.js` | Perfis, `regaOverride`, histórico circular de 30, checklist |
| `js/alertas.js` | Janela de época, gatilho por medida, arame, bloqueio |
| `js/grafico.js` | Gráfico SVG de tronco + estado vazio |
| `js/svg.js` | Diagramas desenhados |
| `js/fotos.js` | IndexedDB, redimensionamento, resolução de slot |
| `js/guia/*.js` | Uma seção do guia por arquivo |
| `js/app.js` | Roteador hash + casca das 4 abas |
| `js/telas/*.js` | Uma tela por arquivo |
| `testes/run.js` | Executor Node headless |
| `testes/assert.js` | Asserções mínimas |
| `testes/casos/*.test.js` | Um arquivo de casos por módulo |
| `testes.html` | Mesmos testes no navegador |
| `sw.js`, `manifest.webmanifest` | PWA; inertes sob `file://` |
| `assets/fotos/` | Imagens otimizadas + `creditos.json` |
| `prompts-imagens.md` | Prompts em inglês, só Grupo A |

**Ordem dos `<script>` em `index.html`** (dependência é linear, sem ciclos):

```
datas → db → dados-iniciais → regras → rega → alertas → grafico → svg → fotos
      → guia/*.js → telas/*.js → app
```

---

## Task 1: Esqueleto, namespace e executor de testes

Nada de bonsai aqui. Entrega: `node testes/run.js` roda e o app abre em branco.

**Files:**
- Create: `index.html`, `css/app.css`, `css/print.css`
- Create: `js/datas.js`
- Create: `testes/assert.js`, `testes/run.js`, `testes/casos/datas.test.js`
- Create: `testes.html`

**Interfaces:**
- Produces:
  - `Bonsai` — namespace global, criado por cada arquivo com `var Bonsai = (typeof window !== 'undefined' ? (window.Bonsai = window.Bonsai || {}) : (globalThis.Bonsai = globalThis.Bonsai || {}));`
  - `Bonsai.datas.hoje(): string` — ISO local, **não** UTC
  - `Bonsai.datas.somarDias(iso, n): string`
  - `Bonsai.datas.diasEntre(isoA, isoB): number` — B − A, inteiro
  - `Bonsai.datas.mes(iso): number` — 1–12
  - `Bonsai.datas.formatarBR(iso): string` — `'01/09/2026'`
  - `Bonsai.datas.valida(iso): boolean`
  - `assert.eq(a, b, msg)`, `assert.ok(v, msg)`, `assert.lanca(fn, msg)`, `assert.grupo(nome, fn)`

- [ ] **Passo 1: Escrever o teste que falha**

`testes/casos/datas.test.js`:

```js
assert.grupo('datas', function () {
  assert.eq(Bonsai.datas.somarDias('2026-09-01', 32), '2026-10-03', 'soma atravessa o mês');
  assert.eq(Bonsai.datas.somarDias('2026-12-31', 1), '2027-01-01', 'soma atravessa o ano');
  assert.eq(Bonsai.datas.diasEntre('2026-09-01', '2026-09-05'), 4, 'diferença simples');
  assert.eq(Bonsai.datas.diasEntre('2026-09-05', '2026-09-01'), -4, 'diferença negativa');
  assert.eq(Bonsai.datas.mes('2026-09-05'), 9, 'mês é 1-12');
  assert.eq(Bonsai.datas.formatarBR('2026-09-05'), '05/09/2026', 'formato BR');
  assert.eq(Bonsai.datas.valida('2026-13-01'), false, 'mês 13 é inválido');
  assert.eq(Bonsai.datas.valida('2026-02-30'), false, '30 de fevereiro é inválido');
  assert.eq(Bonsai.datas.valida('2026-09-05'), true, 'data boa');
});
```

- [ ] **Passo 2: Escrever o executor**

`testes/assert.js`:

```js
var assert = (function () {
  var falhas = [], grupoAtual = '', total = 0;
  function reg(ok, msg) {
    total++;
    if (!ok) falhas.push(grupoAtual + ' → ' + msg);
  }
  return {
    grupo: function (nome, fn) { grupoAtual = nome; fn(); },
    eq: function (a, b, msg) {
      var ok = JSON.stringify(a) === JSON.stringify(b);
      reg(ok, msg + (ok ? '' : '  (recebi ' + JSON.stringify(a) + ', esperava ' + JSON.stringify(b) + ')'));
    },
    ok: function (v, msg) { reg(!!v, msg); },
    lanca: function (fn, msg) {
      var lancou = false;
      try { fn(); } catch (e) { lancou = true; }
      reg(lancou, msg);
    },
    relatorio: function () { return { total: total, falhas: falhas }; }
  };
})();
if (typeof module !== 'undefined') module.exports = assert;
```

`testes/run.js`:

```js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');

// Ordem de carga: igual à do index.html.
const FONTES = [
  'js/datas.js', 'js/db.js', 'js/dados-iniciais.js', 'js/regras.js',
  'js/rega.js', 'js/alertas.js', 'js/grafico.js'
];

const contexto = vm.createContext({
  console,
  globalThis: null,
  localStorage: (function () {
    let m = {};
    return {
      getItem: k => (k in m ? m[k] : null),
      setItem: (k, v) => { m[k] = String(v); },
      removeItem: k => { delete m[k]; },
      clear: () => { m = {}; }
    };
  })()
});
contexto.globalThis = contexto;

function carregar(rel) {
  const p = path.join(raiz, rel);
  if (!fs.existsSync(p)) return;           // módulo ainda não escrito
  vm.runInContext(fs.readFileSync(p, 'utf8'), contexto, { filename: rel });
}

FONTES.forEach(carregar);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'assert.js'), 'utf8'), contexto, { filename: 'assert.js' });

const dirCasos = path.join(__dirname, 'casos');
const casos = fs.existsSync(dirCasos)
  ? fs.readdirSync(dirCasos).filter(f => f.endsWith('.test.js')).sort()
  : [];
casos.forEach(f => vm.runInContext(
  fs.readFileSync(path.join(dirCasos, f), 'utf8'), contexto, { filename: 'casos/' + f }
));

const r = vm.runInContext('assert.relatorio()', contexto);
if (r.falhas.length) {
  console.error('\nFALHAS (' + r.falhas.length + ' de ' + r.total + '):');
  r.falhas.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('OK — ' + r.total + ' asserções, ' + casos.length + ' arquivo(s).');
```

- [ ] **Passo 3: Rodar e confirmar que falha**

```
node testes/run.js
```
Esperado: FALHA com `Bonsai is not defined` (ainda não existe `js/datas.js`).

- [ ] **Passo 4: Implementar `js/datas.js`**

```js
var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.datas = (function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function partes(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    return { a: +m[1], m: +m[2], d: +m[3] };
  }

  function valida(iso) {
    var p = partes(iso);
    if (!p) return false;
    if (p.m < 1 || p.m > 12 || p.d < 1) return false;
    var dt = new Date(p.a, p.m - 1, p.d);
    return dt.getFullYear() === p.a && dt.getMonth() === p.m - 1 && dt.getDate() === p.d;
  }

  function paraDate(iso) {
    var p = partes(iso);
    return new Date(p.a, p.m - 1, p.d);   // meia-noite local, não UTC
  }

  function deDate(dt) {
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  }

  return {
    hoje: function () { return deDate(new Date()); },
    somarDias: function (iso, n) {
      var dt = paraDate(iso);
      dt.setDate(dt.getDate() + n);
      return deDate(dt);
    },
    diasEntre: function (a, b) {
      return Math.round((paraDate(b) - paraDate(a)) / 86400000);
    },
    mes: function (iso) { return partes(iso).m; },
    formatarBR: function (iso) {
      var p = partes(iso);
      return pad(p.d) + '/' + pad(p.m) + '/' + p.a;
    },
    valida: valida,
    deDate: deDate
  };
})();
```

- [ ] **Passo 5: Rodar e confirmar que passa**

```
node testes/run.js
```
Esperado: `OK — 9 asserções, 1 arquivo(s).`

- [ ] **Passo 6: Criar a casca HTML/CSS**

`index.html` — `<html lang="pt-BR">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
`<meta name="color-scheme" content="light">`, `<link rel="stylesheet" href="css/app.css">`,
`<link rel="stylesheet" href="css/print.css" media="print">`, um `<main id="tela">` vazio,
um `<nav id="abas">` com os quatro botões (`#/hoje`, `#/arvores`, `#/guia`, `#/mais`),
e os `<script src>` na ordem da tabela acima.

`css/app.css` começa obrigatoriamente com:

```css
:root { color-scheme: light; }
html { color-scheme: light; background: #fff; }
/* Nenhum bloco prefers-color-scheme: dark neste projeto. Ver R6. */
* { box-sizing: border-box; -webkit-text-size-adjust: 100%; }
body { margin: 0; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
       color: #1a1a1a; background: #fff; padding-bottom: 72px; }
#abas button { min-height: 56px; min-width: 44px; }
```

`testes.html` carrega os mesmos `js/` + `testes/assert.js` + os `casos/*.test.js` e
imprime `assert.relatorio()` num `<pre>`.

- [ ] **Passo 7: Commit**

```bash
git add index.html css js/datas.js testes testes.html
git commit -m "Esqueleto do app, namespace Bonsai e executor de testes headless"
```

---

## Task 2: Persistência (`js/db.js`)

**Files:**
- Create: `js/db.js`, `testes/casos/db.test.js`

**Interfaces:**
- Consumes: `Bonsai.datas`
- Produces:
  - `Bonsai.db.VERSAO_SCHEMA = 1`, `Bonsai.db.CHAVE = 'bonsai.db.v1'`
  - `Bonsai.db.uid(prefixo): string`
  - `Bonsai.db.novo(): DB` — clona `Bonsai.dadosIniciais.montar()`
  - `Bonsai.db.carregar(): { db, somenteLeitura, motivo }`
  - `Bonsai.db.salvar(db): void` — no-op se `somenteLeitura`
  - `Bonsai.db.exportar(db): string` — JSON indentado 2
  - `Bonsai.db.importar(texto): { ok, db, erro }`
  - `Bonsai.db.migrar(bruto): { db, somenteLeitura, motivo }`

- [ ] **Passo 1: Escrever o teste que falha**

`testes/casos/db.test.js`:

```js
assert.grupo('db', function () {
  localStorage.clear();

  var r1 = Bonsai.db.carregar();
  assert.eq(r1.somenteLeitura, false, 'banco novo é gravável');
  assert.eq(r1.db.schemaVersion, 1, 'banco novo nasce na versão 1');
  assert.eq(r1.db.arvores.length, 7, 'banco novo tem as 7 árvores');

  // ida e volta
  var texto = Bonsai.db.exportar(r1.db);
  var r2 = Bonsai.db.importar(texto);
  assert.eq(r2.ok, true, 'importa o que exportou');
  assert.eq(JSON.stringify(r2.db), JSON.stringify(r1.db), 'ida e volta preserva tudo');

  // lixo não derruba o app
  var r3 = Bonsai.db.importar('{isso nao e json');
  assert.eq(r3.ok, false, 'JSON inválido é rejeitado');
  assert.ok(r3.erro, 'JSON inválido explica o erro');

  // versão do futuro entra em somente-leitura em vez de destruir dados
  var r4 = Bonsai.db.migrar({ schemaVersion: 99, arvores: [], eventos: [], tarefas: [] });
  assert.eq(r4.somenteLeitura, true, 'versão futura vira somente-leitura');
  assert.ok(r4.motivo, 'somente-leitura explica o motivo');

  // salvar respeita somente-leitura
  var db = r1.db;
  db.somenteLeitura = true;
  db.arvores[0].apelido = 'NAO DEVE GRAVAR';
  Bonsai.db.salvar(db);
  assert.eq(Bonsai.db.carregar().db.arvores[0].apelido, 'Jabuticaba', 'somente-leitura não grava');

  localStorage.clear();
});
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```
node testes/run.js
```
Esperado: FALHA — `Cannot read properties of undefined (reading 'carregar')`.

- [ ] **Passo 3: Implementar `js/db.js`**

Regras de implementação, nesta ordem dentro de `carregar()`:
1. Ler `localStorage[CHAVE]`. Ausente ou vazio → `{ db: novo(), somenteLeitura: false, motivo: null }` e **grava** o banco novo.
2. `JSON.parse` dentro de `try/catch`. Erro → `{ db: novo(), somenteLeitura: true, motivo: 'Dados corrompidos. Exporte antes de qualquer coisa.' }` e **não grava**.
3. Passar por `migrar()`.

`migrar(bruto)`:
- `bruto.schemaVersion > VERSAO_SCHEMA` → `somenteLeitura: true`, motivo `'Estes dados vieram de uma versão mais nova do app (v' + bruto.schemaVersion + '). Atualize o app antes de gravar, senão você perde informação.'`
- `bruto.schemaVersion < VERSAO_SCHEMA` → aplicar migrações em cadeia num objeto `MIGRACOES = { 1: fn, 2: fn }`. Na v1 o objeto está vazio; deixe a cadeia pronta, não um `TODO`.
- Igual → devolve como está.

`salvar(db)` retorna sem fazer nada se `db.somenteLeitura === true`.
`uid(prefixo)` → `prefixo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)`.

- [ ] **Passo 4: Rodar e confirmar que passa**

```
node testes/run.js
```
Esperado: PASSA. (Depende da Task 3 estar feita; se `Bonsai.dadosIniciais` ainda não existir, faça a Task 3 antes deste passo — as duas são um par e podem ser um único ciclo.)

- [ ] **Passo 5: Commit**

```bash
git add js/db.js testes/casos/db.test.js
git commit -m "Persistencia: localStorage, migracao em cadeia e export/import JSON"
```

---

## Task 3: Seed (`js/dados-iniciais.js`)

Esta é a tarefa onde **P1** é mais fácil de violar. Reveja a seção 8 da spec
linha a linha. Se um número não estiver escrito lá, ele não entra.

**Files:**
- Create: `js/dados-iniciais.js`, `testes/casos/seed.test.js`

**Interfaces:**
- Produces: `Bonsai.dadosIniciais.montar(): DB` — objeto novo a cada chamada, sem estado compartilhado.

- [ ] **Passo 1: Escrever o teste que falha**

`testes/casos/seed.test.js`:

```js
assert.grupo('seed', function () {
  var db = Bonsai.dadosIniciais.montar();
  var por = function (id) { return db.arvores.filter(function (a) { return a.id === id; })[0]; };

  assert.eq(db.arvores.length, 7, 'exatamente 7 árvores');
  assert.eq(db.especies.length, 5, 'exatamente 5 perfis de espécie');

  // R10 — nenhuma rosa do deserto em lugar nenhum do banco
  var tudo = JSON.stringify(db).toLowerCase();
  assert.eq(tudo.indexOf('adenium'), -1, 'sem Adenium no banco');
  assert.eq(tudo.indexOf('rosa do deserto'), -1, 'sem rosa do deserto no banco');

  // P1 — nada de medição fabricada
  assert.eq(db.eventos.filter(function (e) { return e.tipo === 'medicao'; }).length, 0,
    'nenhuma medição no seed');
  assert.eq(tudo.indexOf('2,5 cm'), -1, 'a estimativa de 2,5 cm não virou dado');

  var jab = por('jabuticaba');
  assert.eq(jab.fase, 'engorda', 'jabuticaba em engorda');
  assert.eq(jab.estado, 'pos-transplante', 'jabuticaba pós-transplante');
  assert.eq(jab.estadoDesde, '2026-09-01', 'transplante em 01/09/2026');
  assert.eq(jab.estadoAte, '2026-10-03', 'carência termina em 03/10/2026');
  assert.eq(jab.gatilhoFase.alvoMm, 80, 'gatilho do decepe é 80 mm');
  assert.eq(jab.gatilhoFase.medidoACm, 5, 'medido a 5 cm do solo');

  assert.eq(por('serissa').fase, null, 'fase da serissa não é chutada');
  assert.eq(por('serissa').estado, 'adaptacao', 'serissa em adaptação');

  var az = por('azaleia');
  assert.eq(az.fase, null, 'fase da azaleia não é chutada');
  assert.eq(az.estado, 'recuperacao', 'azaleia em recuperação');
  assert.eq(az.dataAquisicao, null, 'azaleia sem data de aquisição');
  assert.eq(az.regaOverride.perfil, 'umido-vigiado', 'azaleia com override de rega');
  assert.eq(az.regaOverride.enquantoEstado, 'recuperacao', 'override amarrado ao estado');

  ['ficus-a', 'ficus-b', 'ficus-c'].forEach(function (id) {
    assert.eq(por(id).status, 'a-chegar', id + ' está a chegar');
    assert.eq(por(id).fase, 'engorda', id + ' em engorda');
    assert.eq(por(id).grupo, 'experimento-ficus', id + ' no grupo do experimento');
    assert.eq(por(id).substrato.length, 0, id + ' sem substrato inventado');
  });

  assert.eq(db.tarefas.length, 7, 'as 7 tarefas abertas do seed');
  assert.eq(db.tarefas.filter(function (t) { return t.concluidaEm !== null; }).length, 0,
    'nenhuma tarefa nasce concluída');
  assert.ok(db.tarefas.some(function (t) { return /3,1416|3\.1416/.test(t.comoFazer); }),
    'a tarefa de medir ensina o método da fita');

  // instâncias independentes
  Bonsai.dadosIniciais.montar().arvores[0].apelido = 'X';
  assert.eq(Bonsai.dadosIniciais.montar().arvores[0].apelido, 'Jabuticaba', 'montar() não compartilha estado');
});
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```
node testes/run.js
```
Esperado: FALHA — `Bonsai.dadosIniciais is undefined`.

- [ ] **Passo 3: Implementar o seed**

Transcrever a seção 8 da spec. Cuidados:
- `montar()` devolve `JSON.parse(JSON.stringify(MODELO))` para não compartilhar estado.
- Componentes de substrato usam o rótulo **"substrato comercial"**, nunca só "substrato" (premissa 5 da spec).
- Ficus: `substrato: []`, `dataAquisicao: null`, `planoExperimento` com as duas fases em texto.
- Azaleia: `notas` inclui *"Dano severo. Câmbio verde na base testado com a unha. Aguardando broto novo."*
- Espécies: `jabuticaba`, `bougainvillea`, `serissa`, `rhododendron`, `ficus-panda`.
- `slotsFoto`: 11 entradas com `permiteIA: true` só nos 5 de espécie formada.

- [ ] **Passo 4: Rodar e confirmar que passa**

```
node testes/run.js
```
Esperado: PASSA, incluindo os testes da Task 2.

- [ ] **Passo 5: Commit**

```bash
git add js/dados-iniciais.js testes/casos/seed.test.js
git commit -m "Seed das 7 arvores, 5 especies e 7 tarefas abertas, sem dado fabricado"
```

---

## Task 4: Motor de regras (`js/regras.js`)

**Files:**
- Create: `js/regras.js`, `testes/casos/regras.test.js`

**Interfaces:**
- Produces:
  - `Bonsai.regras.POR_FASE` / `Bonsai.regras.POR_ESTADO` — tabelas de dados
  - `Bonsai.regras.paraArvore(arvore, especie, hoje): { permitido: Item[], proibido: Item[], atencao: Item[] }`
  - `Item = { acao, texto, porque, guiaAncora, origem: 'fase'|'estado' }`
  - `acao` ∈ `'podar-copa' | 'podar' | 'aramar' | 'adubar' | 'transplantar' | 'medir' | 'regar' | 'mudar-lugar' | 'decepar'`

**Regra do motor:** montar primeiro pela fase, depois aplicar o estado. Quando a
mesma `acao` aparece nos dois, **o item do estado vence e o da fase é removido**.

- [ ] **Passo 1: Escrever o teste que falha**

`testes/casos/regras.test.js`:

```js
assert.grupo('regras', function () {
  var db = Bonsai.dadosIniciais.montar();
  var arv = function (id) { return db.arvores.filter(function (a) { return a.id === id; })[0]; };
  var esp = function (id) { return db.especies.filter(function (e) { return e.id === id; })[0]; };
  var acoes = function (lista) { return lista.map(function (i) { return i.acao; }); };

  // engorda: podar copa é proibido
  var j = Bonsai.regras.paraArvore(arv('jabuticaba'), esp('jabuticaba'), '2026-09-05');
  assert.ok(acoes(j.proibido).indexOf('podar-copa') >= 0, 'engorda proíbe podar a copa');

  // aramar em engorda é ATENÇÃO, nunca proibido
  var f = Bonsai.regras.paraArvore(arv('ficus-a'), esp('ficus-panda'), '2026-09-05');
  assert.ok(acoes(f.atencao).indexOf('aramar') >= 0, 'aramar em engorda é atenção');
  assert.eq(acoes(f.proibido).indexOf('aramar'), -1, 'aramar em engorda NÃO é proibido');
  assert.ok(f.atencao.some(function (i) { return /l[áa]pis/i.test(i.texto); }),
    'a nota do arame fala em consistência de lápis');

  // estado vence fase: azaleia em engorda adubaria; em recuperação, não
  var a = arv('azaleia');
  a.fase = 'engorda';
  var r = Bonsai.regras.paraArvore(a, esp('rhododendron'), '2026-09-05');
  assert.ok(acoes(r.proibido).indexOf('adubar') >= 0, 'recuperação proíbe adubar');
  assert.eq(acoes(r.permitido).indexOf('adubar'), -1, 'adubar não aparece nos dois lados');
  assert.eq(r.proibido.filter(function (i) { return i.acao === 'adubar'; })[0].origem, 'estado',
    'a proibição de adubar vem do estado, não da fase');

  // pós-transplante bloqueia adubo e diz até quando
  var jt = Bonsai.regras.paraArvore(arv('jabuticaba'), esp('jabuticaba'), '2026-09-05');
  assert.ok(jt.proibido.some(function (i) { return i.acao === 'adubar' && /03\/10\/2026/.test(i.texto); }),
    'pós-transplante mostra a data de liberação');

  // depois da carência, adubar volta a ser permitido
  var jd = Bonsai.regras.paraArvore(arv('jabuticaba'), esp('jabuticaba'), '2026-10-10');
  assert.ok(acoes(jd.permitido).indexOf('adubar') >= 0, 'passada a carência, adubar libera');

  // fase null não quebra
  var s = Bonsai.regras.paraArvore(arv('serissa'), esp('serissa'), '2026-09-05');
  assert.ok(s.atencao.some(function (i) { return /fase ainda n[ãa]o definida/i.test(i.texto); }),
    'fase null vira aviso, não erro');

  // todo item explica o porquê e aponta para o guia
  [j, f, r, s].forEach(function (res) {
    ['permitido', 'proibido', 'atencao'].forEach(function (k) {
      res[k].forEach(function (i) {
        assert.ok(i.porque && i.porque.length > 10, 'item "' + i.acao + '" explica o porquê');
        assert.ok(i.guiaAncora, 'item "' + i.acao + '" aponta para o guia');
      });
    });
  });
});
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```
node testes/run.js
```
Esperado: FALHA — `Bonsai.regras is undefined`.

- [ ] **Passo 3: Implementar**

Transcrever as duas tabelas da seção 5.1 da spec como dados, não como `if`.
`paraArvore` faz: (a) copiar itens de `POR_FASE[arvore.fase]` com `origem: 'fase'`;
(b) copiar itens de `POR_ESTADO[arvore.estado]` com `origem: 'estado'`, expandindo
`{ate}` com `Bonsai.datas.formatarBR(arvore.estadoAte)`; (c) remover de todas as
listas qualquer item de `origem: 'fase'` cuja `acao` também exista em `origem: 'estado'`;
(d) se `arvore.fase === null`, empurrar o aviso de fase indefinida em `atencao`;
(e) se `estado === 'pos-transplante'` e `hoje > estadoAte`, ignorar o estado.

Adubo em `permitido` só entra se `Bonsai.datas.mes(hoje)` estiver em
`especie.adubo.temporada`; fora da temporada vira `atencao` com o motivo.

- [ ] **Passo 4: Rodar e confirmar que passa**

```
node testes/run.js
```

- [ ] **Passo 5: Commit**

```bash
git add js/regras.js testes/casos/regras.test.js
git commit -m "Motor de regras: estado vence fase, aramar em engorda e atencao"
```

---

## Task 5: Rega (`js/rega.js`)

**Files:**
- Create: `js/rega.js`, `testes/casos/rega.test.js`

**Interfaces:**
- Produces:
  - `Bonsai.rega.PERFIS` — 5 chaves, cada uma `{ rotulo, instrucao, teste }`
  - `Bonsai.rega.perfilEfetivo(arvore, especie): { id, rotulo, instrucao, teste, nota, origem }`
  - `Bonsai.rega.registrar(arvore, isoData): void`
  - `Bonsai.rega.intervaloMedioDias(arvore): number|null`
  - `Bonsai.rega.checklist(db, hoje): Linha[]`
  - `Linha = { arvore, perfil, ultimaRega, diasDesde, avisoEstacao }`

- [ ] **Passo 1: Escrever o teste que falha**

`testes/casos/rega.test.js`:

```js
assert.grupo('rega', function () {
  var db = Bonsai.dadosIniciais.montar();
  var arv = function (id) { return db.arvores.filter(function (a) { return a.id === id; })[0]; };
  var esp = function (id) { return db.especies.filter(function (e) { return e.id === id; })[0]; };

  assert.eq(Object.keys(Bonsai.rega.PERFIS).length, 5, 'são 5 perfis de rega');

  // override vence a espécie enquanto o estado bate
  var az = arv('azaleia');
  var p = Bonsai.rega.perfilEfetivo(az, esp('rhododendron'));
  assert.eq(p.id, 'umido-vigiado', 'azaleia em recuperação usa o perfil vigiado');
  assert.eq(p.origem, 'override', 'o perfil veio do override');
  assert.ok(/n[ãa]o regue sem testar/i.test(p.nota), 'a nota do risco aparece');

  // e expira sozinho quando o estado muda
  az.estado = 'saudavel';
  var p2 = Bonsai.rega.perfilEfetivo(az, esp('rhododendron'));
  assert.eq(p2.origem, 'especie', 'com estado saudável, volta ao perfil da espécie');
  assert.eq(p2.nota, null, 'sem estado de recuperação, sem nota de risco');
  assert.ok(az.regaOverride, 'o override não é apagado, só fica inerte');
  az.estado = 'recuperacao';

  // histórico circular de 30
  var j = arv('jabuticaba');
  for (var i = 0; i < 40; i++) Bonsai.rega.registrar(j, Bonsai.datas.somarDias('2026-08-01', i));
  assert.eq(j.historicoRega.length, 30, 'o histórico para em 30');
  assert.eq(j.historicoRega[0], '2026-09-09', 'mais recente na frente');
  assert.eq(j.historicoRega[29], '2026-08-11', 'o mais antigo caiu fora');

  // mesma data duas vezes não duplica
  Bonsai.rega.registrar(j, '2026-09-09');
  assert.eq(j.historicoRega[0], '2026-09-09', 'sem duplicata');
  assert.eq(j.historicoRega.length, 30, 'sem crescer por duplicata');

  assert.eq(Bonsai.rega.intervaloMedioDias(j), 1, 'intervalo médio de regas diárias é 1');
  assert.eq(Bonsai.rega.intervaloMedioDias(arv('ficus-a')), null, 'sem histórico, sem média');

  // checklist ignora as que não chegaram
  var lista = Bonsai.rega.checklist(db, '2026-09-05');
  assert.eq(lista.length, 4, 'as 3 a-chegar ficam de fora do checklist');
  assert.eq(lista.filter(function (l) { return l.arvore.id === 'azaleia'; })[0].perfil.id,
    'umido-vigiado', 'o checklist usa o perfil efetivo, não o da espécie');

  // aviso de estação
  assert.eq(Bonsai.rega.checklist(db, '2027-01-15')[0].avisoEstacao !== null, true,
    'dez–fev avisa rega dobrada');
  assert.eq(lista[0].avisoEstacao, null, 'setembro não avisa rega dobrada');
});
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```
node testes/run.js
```

- [ ] **Passo 3: Implementar**

`registrar` faz `unshift` só se a data ainda não estiver no array, depois
`arvore.historicoRega = arvore.historicoRega.slice(0, 30)`.
`intervaloMedioDias` devolve `null` com menos de 2 datas; senão
`diasEntre(maisAntiga, maisRecente) / (n - 1)`, arredondado.
`checklist` filtra `status === 'ativa'`. `avisoEstacao` é a string de rega dobrada
quando `mes(hoje)` ∈ `[12, 1, 2]`, senão `null`.
Texto de `umido-vigiado`: *"Teste do dedo a 2–3 cm antes de cada rega, sem exceção.
Nunca ressecar por completo, nunca regar por rotina."*

- [ ] **Passo 4: Rodar e confirmar que passa**

```
node testes/run.js
```

- [ ] **Passo 5: Commit**

```bash
git add js/rega.js testes/casos/rega.test.js
git commit -m "Rega: 5 perfis, override amarrado ao estado e historico circular de 30"
```

---

## Task 6: Alertas (`js/alertas.js`)

**Files:**
- Create: `js/alertas.js`, `testes/casos/alertas.test.js`

**Interfaces:**
- Produces:
  - `Bonsai.alertas.gerar(db, hoje): Alerta[]`
  - `Bonsai.alertas.ativos(db, hoje): Alerta[]` — `gerar` menos os dispensados
  - `Bonsai.alertas.dispensar(db, alertaId, ateIso): void`
  - `Alerta = { id, nivel: 'info'|'atencao'|'bloqueio', titulo, corpo, arvoreId, guiaAncora, progresso }`
  - `progresso = { atualMm, alvoMm } | null` — **`null` sempre que não houver medição**

- [ ] **Passo 1: Escrever o teste que falha**

`testes/casos/alertas.test.js`:

```js
assert.grupo('alertas', function () {
  var db = Bonsai.dadosIniciais.montar();
  var achar = function (lista, re) { return lista.filter(function (a) { return re.test(a.id); }); };

  // 1. sem medição: nada de barra de progresso, nem percentual no texto
  var ini = Bonsai.alertas.gerar(db, '2026-09-05');
  var g = achar(ini, /gatilho.*jabuticaba/)[0];
  assert.ok(g, 'existe um card de gatilho para a jabuticaba');
  assert.eq(g.progresso, null, 'sem medição não há progresso');
  assert.ok(/80 mm/.test(g.corpo), 'mostra o alvo');
  assert.ok(/3,1416|fita/.test(g.corpo), 'mostra o método de medir');
  assert.eq(/%/.test(g.corpo), false, 'nenhum percentual inventado');

  // 2. com medição real, a barra aparece
  db.eventos.push({
    id: 'e1', arvoreId: 'jabuticaba', data: '2026-09-10', tipo: 'medicao', nota: '',
    dados: { diametroMm: 26, alturaDaMedidaCm: 5, metodo: 'fita' }, fotoId: null
  });
  var g2 = achar(Bonsai.alertas.gerar(db, '2026-09-11'), /gatilho.*jabuticaba/)[0];
  assert.eq(g2.progresso.atualMm, 26, 'usa a última medição');
  assert.eq(g2.progresso.alvoMm, 80, 'contra o alvo de 80');

  // 3. carência suprime o alerta de adubo e explica
  var adubo = achar(ini, /adubo.*jabuticaba/);
  assert.eq(adubo.length, 1, 'há exatamente um card de adubo');
  assert.eq(adubo[0].nivel, 'bloqueio', 'em carência o adubo é bloqueio, não lembrete');
  assert.ok(/03\/10\/2026/.test(adubo[0].corpo), 'diz a data de liberação');

  // 4. janela de época: aparece em junho, não em maio
  assert.eq(achar(Bonsai.alertas.gerar(db, '2026-05-15'), /janela-transplante/).length, 0,
    'em maio a janela ainda não é assunto');
  assert.ok(achar(Bonsai.alertas.gerar(db, '2026-06-15'), /janela-transplante/).length > 0,
    'em junho a janela de agosto já aparece');

  // 5. arame: conferência mensal
  db.eventos.push({ id: 'e2', arvoreId: 'ficus-b', data: '2026-06-01', tipo: 'aramacao',
    nota: '', dados: { ramos: 'primários', bitolaMm: 2 }, fotoId: null });
  assert.ok(achar(Bonsai.alertas.gerar(db, '2026-09-05'), /arame.*ficus-b/).length > 0,
    'arame sem conferência há meses gera alerta');
  db.eventos.push({ id: 'e3', arvoreId: 'ficus-b', data: '2026-09-04', tipo: 'remocao-arame',
    nota: '', dados: { ramos: 'primários' }, fotoId: null });
  assert.eq(achar(Bonsai.alertas.gerar(db, '2026-09-05'), /arame.*ficus-b/).length, 0,
    'arame removido encerra o alerta');

  // 6. sol depois do transplante: pergunta, não acusação
  var sol = achar(ini, /sol-pos-transplante.*jabuticaba/)[0];
  assert.ok(sol, 'levanta o conflito entre 6 h de sol e a sombra pós-transplante');
  assert.eq(sol.nivel, 'atencao', 'é atenção, não bloqueio');
  assert.ok(/\?/.test(sol.corpo), 'é formulado como pergunta');

  // 7. dispensar funciona e expira
  Bonsai.alertas.dispensar(db, sol.id, '2026-09-20');
  assert.eq(achar(Bonsai.alertas.ativos(db, '2026-09-06'), /sol-pos-transplante/).length, 0,
    'dispensado some');
  assert.ok(achar(Bonsai.alertas.ativos(db, '2026-09-21'), /sol-pos-transplante/).length > 0,
    'dispensa expira na data');

  // 8. todo alerta aponta para o guia
  Bonsai.alertas.gerar(db, '2026-09-05').forEach(function (a) {
    assert.ok(a.guiaAncora, 'alerta ' + a.id + ' aponta para o guia');
  });
});
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```
node testes/run.js
```

- [ ] **Passo 3: Implementar**

Quatro geradores puros, cada um `function(db, hoje): Alerta[]`, concatenados por
`gerar`. IDs determinísticos (`'gatilho-jabuticaba'`, `'arame-ficus-b'`), porque a
dispensa é gravada por ID.

Janela de época: para cada árvore ativa, se `mes(hoje)` estiver de 2 meses antes
do início da janela até o fim dela, emitir alerta contando por mês, nunca por dia.

Arame: último `aramacao` sem `remocao-arame` posterior; se `diasEntre > 30`,
emitir. Este é o único intervalo fixo do app — comentar no código citando R9.

- [ ] **Passo 4: Rodar e confirmar que passa**

```
node testes/run.js
```

- [ ] **Passo 5: Commit**

```bash
git add js/alertas.js testes/casos/alertas.test.js
git commit -m "Alertas por janela de epoca, medida e condicao, sem prazo inventado"
```

---

## Task 7: Gráfico de tronco (`js/grafico.js`)

**Files:**
- Create: `js/grafico.js`, `testes/casos/grafico.test.js`

**Interfaces:**
- Produces: `Bonsai.grafico.tronco(medicoes, gatilho): string` — markup SVG ou bloco de estado vazio. `medicoes` é `Evento[]` de tipo `medicao`, ordem irrelevante.

- [ ] **Passo 1: Escrever o teste que falha**

```js
assert.grupo('grafico', function () {
  var gat = { tipo: 'diametro', alvoMm: 80, medidoACm: 5,
              metodo: 'fita métrica em volta a 5 cm do solo, dividir por 3,1416' };

  var vazio = Bonsai.grafico.tronco([], gat);
  assert.ok(/Sem medições ainda/.test(vazio), 'estado vazio é explícito');
  assert.ok(/3,1416/.test(vazio), 'estado vazio ensina o método');
  assert.eq(/<polyline/.test(vazio), false, 'estado vazio não desenha linha');
  assert.eq(/%/.test(vazio), false, 'estado vazio não mostra percentual');

  var med = [
    { data: '2026-09-10', dados: { diametroMm: 26 } },
    { data: '2027-03-10', dados: { diametroMm: 34 } }
  ];
  var svg = Bonsai.grafico.tronco(med, gat);
  assert.ok(/<svg/.test(svg), 'com medições, desenha');
  assert.ok(/<polyline/.test(svg), 'liga os pontos');
  assert.ok(/80/.test(svg), 'mostra a linha do alvo');

  var um = Bonsai.grafico.tronco([med[0]], gat);
  assert.ok(/<circle/.test(um), 'uma medição só desenha o ponto');
  assert.eq(/<polyline/.test(um), false, 'uma medição não vira linha');
});
```

- [ ] **Passo 2: Rodar e confirmar que falha** — `node testes/run.js`

- [ ] **Passo 3: Implementar** — SVG com `viewBox="0 0 320 180"`, `preserveAspectRatio="none"` **não** (distorce texto). Eixo Y de 0 ao maior entre `alvoMm` e a maior medição, com folga de 10%. Linha tracejada horizontal no alvo, rotulada. Escapar todo texto interpolado.

- [ ] **Passo 4: Rodar e confirmar que passa** — `node testes/run.js`

- [ ] **Passo 5: Commit**

```bash
git add js/grafico.js testes/casos/grafico.test.js
git commit -m "Grafico SVG de tronco com estado vazio honesto"
```

---

## Task 8: Roteador e casca das 4 abas (`js/app.js`)

**Files:**
- Create: `js/app.js`, `js/telas/hoje.js` (esqueleto), `js/telas/arvores.js` (esqueleto), `js/telas/guia.js` (esqueleto), `js/telas/mais.js` (esqueleto)
- Modify: `index.html`, `css/app.css`

**Interfaces:**
- Produces:
  - `Bonsai.app.iniciar(): void`
  - `Bonsai.app.estado` — `{ db, somenteLeitura, hoje }`
  - `Bonsai.app.salvar(): void` — persiste e re-renderiza
  - `Bonsai.app.ir(rota): void`
  - `Bonsai.telas.<nome>.render(params): string` — devolve HTML; **nunca** toca no DOM direto
  - `Bonsai.telas.<nome>.ligar(raiz)` — opcional, liga eventos depois do render

Rotas: `#/hoje`, `#/arvores`, `#/arvore/:id`, `#/guia`, `#/guia/:secao`, `#/mais`.
Rota desconhecida ou vazia → `#/hoje`.

- [ ] **Passo 1: Teste manual (não há DOM no Node)**

Servir e abrir:
```bash
python -m http.server 8000
```
Abrir `http://localhost:8000`, verificar: as 4 abas navegam, a aba ativa fica
marcada, o botão voltar do navegador funciona, recarregar em `#/guia` cai no guia.

- [ ] **Passo 2: Implementar o roteador**

`window.addEventListener('hashchange', renderizar)`. `renderizar()` lê
`location.hash`, casa contra a tabela de rotas, chama `render(params)`,
joga em `#tela.innerHTML`, chama `ligar` se existir, e move o foco para o
`<h1>` da tela (acessibilidade e leitor de tela).

Se `Bonsai.app.estado.somenteLeitura`, renderizar uma faixa vermelha fixa no topo
com o motivo e um botão "Exportar agora".

- [ ] **Passo 3: Verificar no navegador** — repetir o Passo 1.

- [ ] **Passo 4: Commit**

```bash
git add js/app.js js/telas index.html css/app.css
git commit -m "Roteador por hash e casca das 4 abas"
```

---

## Task 9: Tela Hoje

**Files:**
- Modify: `js/telas/hoje.js`, `css/app.css`

**Interfaces:**
- Consumes: `Bonsai.alertas.ativos`, `Bonsai.rega.checklist`, `Bonsai.db`
- Produces: `Bonsai.telas.hoje.render()`, `.ligar(raiz)`

Ordem na tela: **bloqueios → atenções → infos → tarefas abertas → checklist de
rega → botão "Registrar evento"**.

- [ ] **Passo 1: Implementar os alertas** — card por alerta, cor por nível, botão "por quê?" que navega para `#/guia/<ancora>`, botão "dispensar" que chama `Bonsai.alertas.dispensar(db, id, somarDias(hoje, 14))`.

- [ ] **Passo 2: Implementar o checklist de rega** — agrupado pelo **perfil efetivo**. Cada linha: apelido, instrução do perfil, "última rega há N dias", e — quando houver — a `nota` do override em destaque. Botão "regada" chama `Bonsai.rega.registrar`. Nunca escrever "regue hoje".

- [ ] **Passo 3: Implementar as tarefas abertas** — título, `comoFazer`, botão "concluir". Se a tarefa tiver `eventoAoConcluir`, concluir abre o formulário daquele tipo já com a árvore preenchida.

- [ ] **Passo 4: Verificar no navegador** — com o seed limpo, a tela Hoje deve mostrar: o bloqueio de adubo da Jabuticaba com a data 03/10/2026, a atenção do sol pós-transplante como pergunta, o card de gatilho **sem barra**, as 7 tarefas, e o checklist com 4 árvores — a Azaleia com a nota "não regue sem testar".

- [ ] **Passo 5: Commit**

```bash
git add js/telas/hoje.js css/app.css
git commit -m "Tela Hoje: alertas, tarefas abertas e checklist de rega"
```

---

## Task 10: Tela Árvores e ficha

**Files:**
- Modify: `js/telas/arvores.js`, `css/app.css`

Lista: cards com foto (ou inicial), apelido, espécie, fase + estado, próximo marco.
As `a-chegar` num grupo separado no fim, com o botão **"Registrar chegada"** que
faz o fluxo da spec: `status → 'ativa'`, pede data de aquisição, e grava
`estado: 'adaptacao'` com `estadoAte = somarDias(data, 14)`.

Ficha, nesta ordem: cabeçalho (apelido, espécie, fase, estado com data) → **blocos
permitido / proibido / atenção** → gráfico de tronco → faixa de rega de 30 dias →
linha do tempo de eventos → vaso, substrato, posição → notas → plano do
experimento (só se `grupo === 'experimento-ficus'`).

- [ ] **Passo 1: Lista + fluxo de chegada dos Ficus**
- [ ] **Passo 2: Ficha — cabeçalho e blocos de regra** (⛔ vermelho, ⚠️ âmbar, ✅ verde; cada item com o "por quê?" expansível)
- [ ] **Passo 3: Ficha — gráfico, faixa de rega, linha do tempo**
- [ ] **Passo 4: Verificar no navegador** — abrir a ficha da Jabuticaba (proibido podar copa, gráfico vazio), do Ficus A (aramar em âmbar, plano do experimento visível), da Azaleia (bloco de recuperação, nota de rega).
- [ ] **Passo 5: Commit**

```bash
git add js/telas/arvores.js css/app.css
git commit -m "Tela Arvores e ficha completa com blocos de regra"
```

---

## Task 11: Formulários de evento

**Files:**
- Create: `js/telas/evento.js`
- Modify: `js/app.js` (rota `#/evento/:arvoreId/:tipo`)

Um formulário por tipo, campos conforme a tabela 4.3 da spec. Campos numéricos com
`inputmode="decimal"`. O de `medicao` tem duas entradas: **diâmetro em mm** ou
**circunferência em cm** (que o app divide por 3,1416 e mostra o resultado antes de salvar) —
porque fita métrica é o que o usuário tem.

- [ ] **Passo 1: Formulário genérico + campos por tipo**
- [ ] **Passo 2: Conversão de circunferência → diâmetro, com o resultado visível antes de salvar**
- [ ] **Passo 3: Teste no navegador** — registrar uma medição de 8,2 cm de circunferência na Jabuticaba deve gravar `diametroMm: 26` e fazer a barra de progresso **aparecer** na tela Hoje.
- [ ] **Passo 4: Commit**

```bash
git add js/telas/evento.js js/app.js
git commit -m "Formularios de evento, com conversao de circunferencia para diametro"
```

---

## Task 12: Diagramas SVG (`js/svg.js`)

**Files:**
- Create: `js/svg.js`, `testes/casos/svg.test.js`

**Interfaces:**
- Produces: `Bonsai.svg.<nome>(): string`, e `Bonsai.svg.LISTA` com `{ id, titulo, legenda, fn }`

Base obrigatória (6):
`cincoPartes`, `corteCerto`, `clipAndGrow`, `anguloArame`, `raizes`, `linhaFases`.

Fallback do Grupo B, **só para os slots que a Task 17 não conseguir preencher com
foto livre**: `nebariBomRuim`, `conicidade`, `decepeAntesDepois`, `arameEncravado`,
`raizCirculante`, `substratoVsTerra`.

- [ ] **Passo 1: Teste que falha**

```js
assert.grupo('svg', function () {
  Bonsai.svg.LISTA.forEach(function (d) {
    var s = Bonsai.svg[d.fn]();
    assert.ok(/^<svg/.test(s.trim()), d.id + ' devolve SVG');
    assert.ok(/viewBox/.test(s), d.id + ' tem viewBox e escala');
    assert.ok(/<title>/.test(s), d.id + ' tem <title> para leitor de tela');
    assert.eq(/<image|xlink:href/.test(s), false, d.id + ' é desenhado, não foto embutida');
    assert.ok(d.legenda && d.legenda.length > 20, d.id + ' tem legenda que diz o que olhar');
  });
  assert.ok(Bonsai.svg.LISTA.length >= 6, 'pelo menos os 6 diagramas base');
});
```

- [ ] **Passo 2: Rodar e confirmar que falha** — `node testes/run.js`
- [ ] **Passo 3: Desenhar os 6 diagramas base** — traço preto sobre branco, sem depender de cor para o significado (imprime em cinza), rótulos em PT-BR dentro do próprio SVG.
- [ ] **Passo 4: Rodar e confirmar que passa** — `node testes/run.js`
- [ ] **Passo 5: Commit**

```bash
git add js/svg.js testes/casos/svg.test.js
git commit -m "Seis diagramas SVG desenhados, legiveis em preto e branco"
```

---

## Task 13: Conteúdo do guia (`js/guia/*.js`)

Um arquivo por seção: `01-vocabulario.js` … `11-erros.js`.

**Interfaces:**
- Produces: cada arquivo empurra em `Bonsai.guia.secoes` um `{ id, numero, titulo, resumo, ancoras: [], html: function(): string }`

Conteúdo obrigatório: a seção 9 da spec, item por item. Pontos que **não** podem
ser suavizados na redação:

- Seção 3: *"Gatilho de fase é medida de tronco, não calendário."*
- Seção 7: a mistura para suculentas aparece como referência geral e **não é
  vinculada a nenhuma árvore do usuário** (R10).
- Seção 8: *"Folha murcha pode ser falta OU excesso — checar antes de regar."*
- Seção 9: caixa de alerta com o caso real, **sem nome de marca** — produto
  vendido como "fertilizante líquido" contendo apenas cálcio, magnésio, enxofre e
  cobalto, zero N-P-K; é complemento, não adubo base; a palavra "fertilizante" na
  embalagem não garante NPK, ler a análise garantida.

- [ ] **Passo 1: Teste que falha**

```js
assert.grupo('guia', function () {
  assert.eq(Bonsai.guia.secoes.length, 11, 'as 11 seções');
  var html = Bonsai.guia.secoes.map(function (s) { return s.html(); }).join('\n').toLowerCase();

  assert.eq(html.indexOf('adenium'), -1, 'sem Adenium no guia');
  assert.eq(html.indexOf('rosa do deserto'), -1, 'sem rosa do deserto no guia');
  assert.ok(html.indexOf('cobalto') >= 0, 'o caso do falso fertilizante está no guia');
  assert.ok(/medida de tronco, n[ãa]o calend[áa]rio/.test(html), 'gatilho por medida, não por calendário');
  assert.ok(/falta ou excesso/i.test(html), 'folha murcha: falta ou excesso');

  ['nebari', 'conicidade', 'decepe', 'clip-and-grow', 'pinçagem', 'alporquia',
   'jin', 'shari', 'yamadori', 'akadama', 'desfolha', 'pré-bonsai'
  ].forEach(function (t) { assert.ok(html.indexOf(t) >= 0, 'vocabulário traz ' + t); });

  Bonsai.guia.secoes.forEach(function (s) {
    assert.ok(s.id && s.titulo && s.resumo, 'seção ' + s.numero + ' tem id, título e resumo');
    assert.ok(s.html().length > 400, 'seção ' + s.numero + ' tem conteúdo de verdade');
  });
});
```

- [ ] **Passo 2: Rodar e confirmar que falha** — `node testes/run.js`
- [ ] **Passo 3: Escrever as seções 1–6** — commit
- [ ] **Passo 4: Escrever as seções 7–11** — commit
- [ ] **Passo 5: Rodar e confirmar que passa** — `node testes/run.js`

```bash
git add js/guia testes/casos/guia.test.js
git commit -m "Guia: 11 secoes, vocabulario e caixa do falso fertilizante"
```

---

## Task 14: Tela Guia, busca e âncoras

**Files:**
- Modify: `js/telas/guia.js`
- Modify: `js/app.js` (rota `#/guia/:secao`)

Índice das 11 seções + vocabulário. Busca simples: filtra por `titulo`, `resumo` e
texto do `html()`, sem índice invertido. Cada diagrama SVG e cada slot de foto
aparecem dentro da seção correspondente, com a legenda de "o que olhar".

- [ ] **Passo 1: Índice e navegação por seção**
- [ ] **Passo 2: Busca**
- [ ] **Passo 3: Encaixar diagramas e slots nas seções**
- [ ] **Passo 4: Verificar no navegador** — clicar "por quê?" num alerta da tela Hoje deve cair na seção certa.
- [ ] **Passo 5: Commit**

```bash
git add js/telas/guia.js js/app.js
git commit -m "Tela Guia com indice, busca e ancoras vindas dos alertas"
```

---

## Task 15: Fotos e slots (`js/fotos.js`)

**Files:**
- Create: `js/fotos.js`, `assets/fotos/creditos.json`
- Create: `assets/fotos/originais/.gitkeep` (a pasta é ignorada; o `.gitkeep` precisa de `git add -f`)

**Interfaces:**
- Produces:
  - `Bonsai.fotos.resolver(slotId): Promise<{ url, origem, credito, legenda } | null>`
  - `Bonsai.fotos.salvarDoUsuario(slotId, File): Promise<void>`
  - `Bonsai.fotos.redimensionar(File, maxLargura = 1400): Promise<Blob>` — canvas, JPEG q0.82

Ordem de resolução por slot: `usuario` (IndexedDB) → `livre`/`ia` (`assets/fotos/`)
→ `svg` (`Bonsai.svg`) → **pendente**.

O slot pendente renderiza caixa tracejada com o texto **"foto pendente — <nome>"**,
a legenda do que olhar já escrita, e um `<input type="file" accept="image/*" capture="environment">`.

Toda imagem de origem `ia` renderiza com a tarja **"ilustração — não é foto"**.
Toda imagem de origem `livre` renderiza autor + licença + link no rodapé da legenda.

- [ ] **Passo 1: IndexedDB (abrir, `put`, `get`) e redimensionamento por canvas**
- [ ] **Passo 2: Resolução de slot na ordem acima, com fallback para SVG**
- [ ] **Passo 3: Componente de slot pendente com botão de câmera**
- [ ] **Passo 4: Verificar no navegador** — subir uma foto qualquer num slot pendente, recarregar a página e confirmar que ela persiste.
- [ ] **Passo 5: Commit**

```bash
git add js/fotos.js assets/fotos/creditos.json
git add -f assets/fotos/originais/.gitkeep
git commit -m "Slots de foto: IndexedDB, redimensionamento e fallback para SVG"
```

---

## Task 16: Tela Mais — backup, calendário, ajustes

**Files:**
- Modify: `js/telas/mais.js`

- **Exportar**: `Bonsai.db.exportar` → `Blob` → `<a download="bonsai-AAAA-MM-DD.json">`.
- **Importar**: `<input type="file">` → `Bonsai.db.importar` → **confirmação explícita** mostrando quantas árvores e quantos eventos vão substituir os atuais.
- **Calendário de Naviraí**: os 4 blocos da seção 10 do guia, com o trimestre atual destacado.
- **Ajustes**: `ocultarFotosNaImpressao`.
- **Imprimir**: chama `window.print()`.

- [ ] **Passo 1: Exportar**
- [ ] **Passo 2: Importar com confirmação**
- [ ] **Passo 3: Calendário e ajustes**
- [ ] **Passo 4: Verificar no navegador** — exportar, apagar o localStorage, importar de volta, confirmar as 7 árvores.
- [ ] **Passo 5: Commit**

```bash
git add js/telas/mais.js
git commit -m "Tela Mais: backup JSON, calendario de Navirai e ajustes"
```

---

## Task 17: Impressão A4 (`css/print.css`)

**Files:**
- Modify: `css/print.css`

```css
@page { size: A4; margin: 15mm; }
```

- `#abas`, botões e campos de formulário: `display: none`.
- Cor: preto sobre branco. Blocos de regra viram borda + rótulo textual (⛔/⚠️/✅ impressos como texto), porque cor não sobrevive.
- `img, svg { filter: grayscale(100%); }` e `page-break-inside: avoid`.
- `h2 { page-break-after: avoid; }`, `section { page-break-inside: auto; }`.
- Links viram `a[href^="http"]::after { content: " (" attr(href) ")"; }`.
- Quando `ocultarFotosNaImpressao` estiver ligado, o `<body>` ganha a classe
  `sem-fotos` e `.sem-fotos img { display: none }`.

- [ ] **Passo 1: Escrever o CSS**
- [ ] **Passo 2: Verificar** — pré-visualização de impressão de 3 seções do guia + uma ficha de árvore. Nenhum corte no meio de um diagrama, nenhum texto branco sumido.
- [ ] **Passo 3: Commit**

```bash
git add css/print.css
git commit -m "Impressao A4: escala de cinza, quebras e opcao de ocultar fotos"
```

---

## Task 18: PWA e offline

**Files:**
- Create: `sw.js`, `manifest.webmanifest`, `assets/icone-192.png`, `assets/icone-512.png`
- Modify: `index.html`

`sw.js`: cache estático nomeado `bonsai-v1` com a lista explícita de arquivos
(nada de cache dinâmico), estratégia **cache-first**, e limpeza das versões
antigas no `activate`.

Registro em `index.html` **guardado**, para não estourar em `file://`:

```js
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js');
}
```

- [ ] **Passo 1: Manifest e ícones**
- [ ] **Passo 2: Service worker com lista explícita**
- [ ] **Passo 3: Verificar** — `python -m http.server 8000`, carregar, ir a offline no DevTools, recarregar: o app abre. Depois abrir `index.html` como arquivo local e confirmar que **não** há erro no console.
- [ ] **Passo 4: Commit**

```bash
git add sw.js manifest.webmanifest assets/icone-192.png assets/icone-512.png index.html
git commit -m "PWA instalavel, cache-first, inerte sob file://"
```

---

## Task 19: Imagens — busca livre e prompts

Feita **fora da ordem**, antes das telas, porque o usuário gera as imagens em
paralelo. Ver a seção 7 da spec.

**Files:**
- Create: `prompts-imagens.md`
- Modify: `assets/fotos/creditos.json`

- [ ] **Passo 1: Buscar foto livre para os 11 slots** — só licença verificável (CC0, CC BY, CC BY-SA, domínio público). Registrar autor, licença e URL. Baixar para `assets/fotos/originais/`, otimizar para `assets/fotos/`.
- [ ] **Passo 2: Escrever `prompts-imagens.md`** — **só os 5 slots do Grupo A** (ficus, jabuticaba, serissa, primavera, azaleia formados). Cada entrada: prompt em inglês, "o que precisa estar visível", e a legenda PT-BR de "o que olhar".
- [ ] **Passo 3: Marcar os slots do Grupo B sem foto livre** como `svg` (se a Task 12 cobriu) ou `pendente`. **Nunca** `ia`.
- [ ] **Passo 4: Commit**

```bash
git add prompts-imagens.md assets/fotos
git commit -m "Fotos livres com creditos e prompts em ingles das especies formadas"
```

---

## Task 20: Fechamento

- [ ] **Passo 1:** `node testes/run.js` — tudo verde
- [ ] **Passo 2:** Abrir `testes.html` no navegador — mesmo resultado
- [ ] **Passo 3:** Varredura de R10 — `grep -ri "adenium\|rosa do deserto" . --exclude-dir=.git` deve voltar vazio
- [ ] **Passo 4:** Varredura de R6 — `grep -r "prefers-color-scheme" css/` deve voltar vazio
- [ ] **Passo 5:** Testar num celular de verdade, no quintal, com uma mão só
- [ ] **Passo 6:** `README.md` curto: como abrir, como fazer backup, como publicar no GitHub Pages
- [ ] **Passo 7: Commit**

```bash
git add README.md
git commit -m "README e varredura final de restricoes"
```

---

## Autorrevisão do plano

**Cobertura da spec:** §3 stack → Task 1, 18. §4 modelo de dados → Tasks 2, 3, 5.
§4.6.1 `regaOverride` → Task 5. §5.1 regras → Task 4. §5.2 alertas → Task 6.
§5.3 checklist → Tasks 5, 9. §6 navegação → Tasks 8–11, 14, 16. §6 gráfico →
Tasks 7, 10. §6 impressão → Task 17. §7 imagens → Tasks 12, 15, 19. §8 seed →
Task 3. §9 guia → Task 13. §10 arquivos → todas. §11 testes → Tasks 1–7, 12, 13, 20.

**Lacuna encontrada e corrigida:** a spec descreve o fluxo de chegada dos Ficus
(status → data → `adaptacao` por 2 semanas) mas nenhuma tarefa o implementava.
Foi dobrado na Task 10, Passo 1.

**Consistência de tipos:** `Bonsai.rega.perfilEfetivo` devolve objeto com `.id`,
usado como `linha.perfil.id` na Task 5 e na Task 9 — bate. `Alerta.progresso` é
`null` ou `{ atualMm, alvoMm }` nas Tasks 6, 9 e 10 — bate.
`Bonsai.grafico.tronco(medicoes, gatilho)` tem a mesma assinatura nas Tasks 7 e 10.

**Ordem de execução recomendada:** 1 → 3 → 2 → 4 → 5 → 6 → 7 → 12 → 19 → 8 → 9 →
10 → 11 → 13 → 14 → 15 → 16 → 17 → 18 → 20. As Tasks 2 e 3 são um par (o teste da
2 usa o seed da 3); a 19 sobe cedo para o usuário gerar imagens em paralelo.
