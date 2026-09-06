// Task 10 — tela Árvores (lista) e ficha (js/telas/arvores.js). Testa a parte
// pura (separação por status, próximo marco, fluxo de chegada dos Ficus,
// faixa de rega de 30 dias) e os invariantes do HTML renderizado contra o
// seed real: nunca lança, nunca mostra a palavra "null", sempre nomeia a
// árvore, e nunca inventa percentual onde não há medição.
//
// As sete árvores do seed são o material de teste principal — em especial a
// Serissa e a Azaleia (fase: null) e os três Ficus (status: 'a-chegar'),
// porque é exatamente aí que uma tela escrita só contra o caminho feliz
// quebra (ver CONTEXTO.md e o brief da Task 10).

// ---------------------------------------------------------------------
// separarPorStatus
// ---------------------------------------------------------------------
assert.grupo('arvores.separarPorStatus — a-chegar isolado no fim', function () {
  var db = Bonsai.dadosIniciais.montar();
  var grupos = Bonsai.telas.arvores.separarPorStatus(db.arvores);

  assert.eq(grupos.principal.map(function (a) { return a.id; }),
    ['jabuticaba', 'primavera', 'serissa', 'azaleia'],
    'as quatro árvores ativas ficam no grupo principal, na ordem do seed');
  assert.eq(grupos.aChegar.map(function (a) { return a.id; }),
    ['ficus-a', 'ficus-b', 'ficus-c'],
    'os três Ficus a-chegar ficam no grupo separado, na ordem do seed');

  assert.eq(Bonsai.telas.arvores.separarPorStatus([]).principal, [], 'lista vazia: grupo principal vazio');
  assert.eq(Bonsai.telas.arvores.separarPorStatus([]).aChegar, [], 'lista vazia: grupo a-chegar vazio');
});

// ---------------------------------------------------------------------
// proximoMarco — cada árvore do seed tem um marco não vazio e coerente.
// ---------------------------------------------------------------------
assert.grupo('arvores.proximoMarco — contra o seed real', function () {
  var db = Bonsai.dadosIniciais.montar();
  var por = function (id) { return db.arvores.filter(function (a) { return a.id === id; })[0]; };

  assert.eq(Bonsai.telas.arvores.proximoMarco(por('jabuticaba'), db),
    'Medir o tronco pela primeira vez', 'jabuticaba: a tarefa aberta dela é o marco');
  // Correção de dados reais (06/09/2026): a Primavera já foi transplantada em
  // 05/09/2026 — a tarefa nasce concluída (seed.test.js) e não conta mais
  // como marco; sem gatilho de fase definido, sobra o aviso honesto.
  assert.eq(Bonsai.telas.arvores.proximoMarco(por('primavera'), db),
    'Sem marco definido ainda.', 'primavera: já transplantada, sem tarefa aberta nem gatilho — marco honesto');
  // A Serissa também já teve a terra vermelha removida em 05/09/2026 — a
  // próxima tarefa aberta dela passa a ser "Definir a fase".
  assert.eq(Bonsai.telas.arvores.proximoMarco(por('serissa'), db),
    'Definir a fase', 'serissa: terra vermelha já removida, a próxima tarefa aberta é definir a fase');
  assert.eq(Bonsai.telas.arvores.proximoMarco(por('azaleia'), db),
    'Definir a fase', 'azaleia: a primeira tarefa aberta dela é o marco');
  ['ficus-a', 'ficus-b', 'ficus-c'].forEach(function (id) {
    assert.eq(Bonsai.telas.arvores.proximoMarco(por(id), db),
      'Registrar a chegada dos Ficus A/B/C', id + ': a tarefa de grupo é o marco');
  });

  // Sem tarefa aberta nem gatilho: cai no aviso honesto de que não há marco.
  var semNada = { id: 'x', gatilhoFase: null, grupo: null };
  assert.eq(Bonsai.telas.arvores.proximoMarco(semNada, { tarefas: [] }),
    'Sem marco definido ainda.', 'sem tarefa e sem gatilho: marco explícito de ausência, nunca vazio');

  // Sem tarefa aberta, mas com gatilho: usa o alvo do gatilho, sem inventar
  // percentual nenhum (não há medição real neste teste).
  var comGatilho = {
    id: 'y', grupo: null,
    gatilhoFase: { alvoMm: 80, proximaFase: 'decepe', metodo: 'fita métrica' }
  };
  var marcoGatilho = Bonsai.telas.arvores.proximoMarco(comGatilho, { tarefas: [] });
  assert.ok(/80/.test(marcoGatilho), 'usa o alvo do gatilho quando não há tarefa aberta');
  assert.eq(/%/.test(marcoGatilho), false, 'não inventa percentual no texto do marco');

  // Tarefa concluída não conta como marco.
  var comTarefaConcluida = { id: 'z', gatilhoFase: null, grupo: null };
  var dbTarefaConcluida = { tarefas: [{ id: 't', arvoreId: 'z', concluidaEm: '2026-09-01', titulo: 'Já feita' }] };
  assert.eq(Bonsai.telas.arvores.proximoMarco(comTarefaConcluida, dbTarefaConcluida),
    'Sem marco definido ainda.', 'tarefa já concluída não vira marco');
});

// ---------------------------------------------------------------------
// aplicarChegada — transição de estado pura (spec §8, fluxo de chegada dos
// Ficus): status -> ativa, grava a data recebida, abre adaptação por 14 dias.
// ---------------------------------------------------------------------
assert.grupo('arvores.aplicarChegada — fluxo de chegada como transição pura', function () {
  var db = Bonsai.dadosIniciais.montar();
  var ficusA = db.arvores.filter(function (a) { return a.id === 'ficus-a'; })[0];

  assert.eq(ficusA.status, 'a-chegar', 'pré-condição: ficus-a começa a-chegar');

  var resultado = Bonsai.telas.arvores.aplicarChegada(ficusA, '2026-09-10');

  assert.eq(resultado.status, 'ativa', 'status vira ativa');
  assert.eq(resultado.dataAquisicao, '2026-09-10', 'grava a data de aquisição recebida, exatamente');
  assert.eq(resultado.estado, 'adaptacao', 'estado abre em adaptação');
  assert.eq(resultado.estadoAte, '2026-09-24', 'estadoAte é exatamente 14 dias depois da data recebida');

  // Não inventa uma fase nem mexe no grupo do experimento.
  assert.eq(resultado.fase, 'engorda', 'fase não muda com a chegada');
  assert.eq(resultado.grupo, 'experimento-ficus', 'grupo do experimento não muda com a chegada');

  // Muda o objeto recebido (mesma convenção de Bonsai.rega.registrar) — quem
  // chama não precisa reatribuir o retorno para ver o efeito.
  assert.eq(ficusA.status, 'ativa', 'a mutação aconteceu no próprio objeto recebido');

  // Vira o ano: 20 de dezembro + 14 dias cai em janeiro do ano seguinte.
  var ficusB = db.arvores.filter(function (a) { return a.id === 'ficus-b'; })[0];
  var resultadoB = Bonsai.telas.arvores.aplicarChegada(ficusB, '2026-12-20');
  assert.eq(resultadoB.estadoAte, '2027-01-03', 'soma 14 dias corretamente através da virada do ano');
});

// ---------------------------------------------------------------------
// faixaRega30Dias — sempre 30 dias, do mais antigo ao mais recente (hoje),
// marcando exatamente os dias presentes no histórico.
// ---------------------------------------------------------------------
assert.grupo('arvores.faixaRega30Dias — 30 dias terminando hoje', function () {
  var faixaVazia = Bonsai.telas.arvores.faixaRega30Dias([], '2026-09-05');
  assert.eq(faixaVazia.length, 30, 'sempre 30 dias, mesmo sem histórico');
  assert.eq(faixaVazia[29].data, '2026-09-05', 'o último dia da faixa é hoje');
  assert.eq(faixaVazia[0].data, '2026-08-07', 'o primeiro dia da faixa é 29 dias antes de hoje');
  assert.ok(faixaVazia.every(function (d) { return d.regada === false; }), 'sem histórico: nenhum dia marcado');

  var faixaComHistorico = Bonsai.telas.arvores.faixaRega30Dias(
    ['2026-09-05', '2026-09-03', '2026-09-01'], '2026-09-05');
  var marcados = faixaComHistorico.filter(function (d) { return d.regada; }).map(function (d) { return d.data; });
  assert.eq(marcados, ['2026-09-01', '2026-09-03', '2026-09-05'],
    'marca exatamente as datas do histórico, em ordem crescente na faixa');

  assert.eq(Bonsai.telas.arvores.faixaRega30Dias(null, '2026-09-05').length, 30,
    'historicoRega null (árvore nunca regada) não quebra a faixa');
});

// ---------------------------------------------------------------------
// render() — lista (#/arvores) contra o seed limpo.
// ---------------------------------------------------------------------
assert.grupo('arvores.render lista — invariantes contra o seed limpo (2026-09-05)', function () {
  Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
  Bonsai.app.estado.hoje = '2026-09-05';

  var html = Bonsai.telas.arvores.render({});

  assert.eq(/\bnull\b/.test(html), false, 'a palavra "null" nunca aparece na lista');

  ['Jabuticaba', 'Primavera', 'Serissa', 'Azaleia', 'Ficus A', 'Ficus B', 'Ficus C'].forEach(function (nome) {
    assert.ok(html.indexOf(nome) >= 0, 'a lista nomeia "' + nome + '"');
  });

  assert.ok(/fase ainda n[ãa]o definida/i.test(html), 'a lista mostra a fase indefinida da Serissa/Azaleia honestamente');

  // Grupo a-chegar depois do grupo principal.
  var posicaoAChegar = html.indexOf('id="titulo-a-chegar"');
  var posicaoJabuticaba = html.indexOf('Jabuticaba');
  assert.ok(posicaoAChegar > 0, 'existe a seção "a chegar"');
  assert.ok(posicaoJabuticaba < posicaoAChegar, 'o grupo principal vem antes do grupo a-chegar');

  // Botão de registrar chegada só nos três Ficus.
  ['ficus-a', 'ficus-b', 'ficus-c'].forEach(function (id) {
    assert.ok(html.indexOf('data-registrar-chegada="' + id + '"') >= 0,
      id + ': tem botão de registrar chegada');
  });
  ['jabuticaba', 'primavera', 'serissa', 'azaleia'].forEach(function (id) {
    assert.eq(html.indexOf('data-registrar-chegada="' + id + '"') >= 0, false,
      id + ': não tem botão de registrar chegada (já está ativa)');
  });
});

// ---------------------------------------------------------------------
// render() — ficha (#/arvore/:id). Loop pelas sete árvores: nunca lança,
// nunca mostra "null", sempre nomeia a árvore. As duas com fase null e os
// três a-chegar são justamente onde uma ficha feita só para o caminho feliz
// quebraria primeiro.
// ---------------------------------------------------------------------
function secaoGrafico(html) {
  var inicio = html.indexOf('id="titulo-grafico"');
  var fim = html.indexOf('id="titulo-rega"');
  return html.slice(inicio, fim);
}

assert.grupo('arvores.render ficha — loop pelas 7 árvores do seed (2026-09-05)', function () {
  var TODOS_OS_IDS = ['jabuticaba', 'primavera', 'serissa', 'azaleia', 'ficus-a', 'ficus-b', 'ficus-c'];

  TODOS_OS_IDS.forEach(function (id) {
    Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
    Bonsai.app.estado.hoje = '2026-09-05';
    var arvore = Bonsai.app.estado.db.arvores.filter(function (a) { return a.id === id; })[0];

    var html = null, lancou = false;
    try {
      html = Bonsai.telas.arvores.render({ id: id });
    } catch (e) {
      lancou = true;
    }
    assert.eq(lancou, false, id + ': render da ficha não lança');
    assert.ok(typeof html === 'string' && html.length > 0, id + ': render devolve string não vazia');
    assert.eq(/\bnull\b/.test(html), false, id + ': a palavra "null" nunca aparece na ficha');
    assert.ok(html.indexOf(arvore.apelido) >= 0, id + ': a ficha nomeia a árvore');

    // Nenhuma árvore do seed tem medição real (eventos: []) — a seção do
    // gráfico nunca pode mostrar percentual.
    assert.eq(/%/.test(secaoGrafico(html)), false, id + ': seção do gráfico sem percentual (sem medição real)');

    // Todo item de regra que aparece leva a um "Por quê?" expansível.
    if (/regra-item/.test(html)) {
      assert.ok(/Por quê\?/.test(html), id + ': existe pelo menos um "Por quê?" expansível');
    }
  });
});

assert.grupo('arvores.render ficha — Jabuticaba (2026-09-05)', function () {
  Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
  Bonsai.app.estado.hoje = '2026-09-05';
  var html = Bonsai.telas.arvores.render({ id: 'jabuticaba' });

  assert.ok(/podar a copa/i.test(html), 'proíbe podar a copa (engorda)');
  assert.ok(/Sem medições ainda/.test(html), 'gráfico vazio: nenhuma medição real');
  assert.ok(html.indexOf('#/evento/jabuticaba/medicao') >= 0,
    'o estado vazio do gráfico linka para o formulário de medição (Task 11)');
  assert.eq(/experimento/i.test(html), false, 'jabuticaba não é do experimento-ficus: sem plano do experimento');
});

assert.grupo('arvores.render ficha — Ficus A (2026-09-05, a-chegar)', function () {
  Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
  Bonsai.app.estado.hoje = '2026-09-05';
  var html = Bonsai.telas.arvores.render({ id: 'ficus-a' });

  assert.ok(/aramar/i.test(html), 'menciona aramar (atenção em engorda, não proibido)');
  assert.ok(/Plano do experimento/i.test(html), 'mostra o plano do experimento (grupo experimento-ficus)');
  assert.ok(/controle/i.test(html) || /sem arame/i.test(html), 'o plano cita o papel de controle / sem arame do Ficus A');
});

assert.grupo('arvores.render ficha — Azaleia (2026-09-05, recuperação)', function () {
  Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
  Bonsai.app.estado.hoje = '2026-09-05';
  var html = Bonsai.telas.arvores.render({ id: 'azaleia' });

  assert.ok(/fase ainda n[ãa]o definida/i.test(html), 'azaleia: fase null renderiza honesto, nunca inventado');
  assert.ok(/Não regue sem testar/.test(html), 'a nota do override de rega aparece verbatim na ficha');
  assert.ok(/recupera/i.test(html), 'o estado de recuperação aparece na ficha');
});

// ---------------------------------------------------------------------
// Correção de dados reais (06/09/2026) — a ficha mostra a cobertura de
// superfície (para registro) e marca visualmente o substrato que é
// estimativa do dono, nunca deixando um chute passar por medição.
// ---------------------------------------------------------------------
assert.grupo('arvores.render ficha — cobertura de superfície e substrato estimado (06/09/2026)', function () {
  Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
  Bonsai.app.estado.hoje = '2026-09-05';

  var htmlSerissa = Bonsai.telas.arvores.render({ id: 'serissa' });
  var htmlPrimavera = Bonsai.telas.arvores.render({ id: 'primavera' });
  var htmlJabuticaba = Bonsai.telas.arvores.render({ id: 'jabuticaba' });

  [htmlSerissa, htmlPrimavera].forEach(function (html, i) {
    var nome = i === 0 ? 'serissa' : 'primavera';
    assert.ok(/casca de pinus/i.test(html), nome + ': a ficha mostra a cobertura de casca de pinus');
    assert.ok(/estimativa/i.test(html), nome + ': o substrato marca a estimativa do dono');
    assert.eq(/\bnull\b/.test(html), false, nome + ': sem a palavra "null" na tela');
  });

  // Jabuticaba: cobertura não informada renderiza honesto, nunca "null" cru,
  // e o substrato dela (dado como fato, não estimativa) não ganha o selo.
  assert.ok(/n[ãa]o informado/i.test(htmlJabuticaba), 'jabuticaba: cobertura não informada aparece como tal');
  var secaoVasoJab = htmlJabuticaba.slice(htmlJabuticaba.indexOf('id="titulo-vaso"'));
  assert.eq(/estimativa/i.test(secaoVasoJab), false,
    'jabuticaba: substrato dado como fato não é marcado como estimativa');
});

assert.grupo('arvores.render ficha — árvore inexistente não lança', function () {
  Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
  Bonsai.app.estado.hoje = '2026-09-05';
  var html = null, lancou = false;
  try {
    html = Bonsai.telas.arvores.render({ id: 'nao-existe' });
  } catch (e) {
    lancou = true;
  }
  assert.eq(lancou, false, 'id desconhecido não lança');
  assert.ok(typeof html === 'string' && html.length > 0, 'devolve alguma string honesta');
});
