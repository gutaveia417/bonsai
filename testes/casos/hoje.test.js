// Task 9 — tela Hoje (js/telas/hoje.js). Testa a parte pura, separável do DOM:
// ordenação de alertas, filtro de tarefas abertas, agrupamento do checklist de
// rega pelo perfil efetivo, e os invariantes do texto renderizado (nunca
// inventar percentual, nunca mandar regar hoje).

assert.grupo('hoje.ordenarAlertas — ordem bloqueio > atencao > info', function () {
  var a = { id: 'a', nivel: 'info' };
  var b = { id: 'b', nivel: 'bloqueio' };
  var c = { id: 'c', nivel: 'atencao' };
  var d = { id: 'd', nivel: 'bloqueio' };
  var e = { id: 'e', nivel: 'info' };
  var f = { id: 'f', nivel: 'atencao' };

  var ordenado = Bonsai.telas.hoje.ordenarAlertas([a, b, c, d, e, f]);
  assert.eq(ordenado.map(function (x) { return x.nivel; }),
    ['bloqueio', 'bloqueio', 'atencao', 'atencao', 'info', 'info'],
    'todo bloqueio vem antes de toda atencao, que vem antes de todo info');

  // Estabilidade: dentro do mesmo nível, a ordem relativa de entrada é preservada.
  assert.eq(ordenado.map(function (x) { return x.id; }), ['b', 'd', 'c', 'f', 'a', 'e'],
    'ordem relativa dentro do mesmo nível é preservada (sort estável)');

  // Não modifica o array original.
  var original = [a, b, c];
  var copia = original.slice();
  Bonsai.telas.hoje.ordenarAlertas(original);
  assert.eq(original, copia, 'ordenarAlertas não muta o array recebido');

  // Já ordenado continua igual; lista vazia não quebra; lista de 1 não quebra.
  assert.eq(Bonsai.telas.hoje.ordenarAlertas([b, d]).map(function (x) { return x.id; }), ['b', 'd'],
    'lista já ordenada permanece igual');
  assert.eq(Bonsai.telas.hoje.ordenarAlertas([]), [], 'lista vazia devolve lista vazia');
  assert.eq(Bonsai.telas.hoje.ordenarAlertas([a]).map(function (x) { return x.id; }), ['a'],
    'lista de um elemento devolve o mesmo elemento');

  // Só um nível presente.
  assert.eq(Bonsai.telas.hoje.ordenarAlertas([a, e]).map(function (x) { return x.id; }), ['a', 'e'],
    'só infos: ordem de entrada preservada');
});

assert.grupo('hoje.tarefasAbertas — só concluidaEm === null', function () {
  var db1 = { tarefas: [
    { id: 't1', concluidaEm: null },
    { id: 't2', concluidaEm: '2026-09-01' },
    { id: 't3', concluidaEm: null }
  ] };
  var abertas1 = Bonsai.telas.hoje.tarefasAbertas(db1);
  assert.eq(abertas1.map(function (t) { return t.id; }), ['t1', 't3'],
    'filtra exatamente as tarefas com concluidaEm null, preservando a ordem');

  var dbTodasConcluidas = { tarefas: [
    { id: 't1', concluidaEm: '2026-09-01' },
    { id: 't2', concluidaEm: '2026-09-02' }
  ] };
  assert.eq(Bonsai.telas.hoje.tarefasAbertas(dbTodasConcluidas), [], 'todas concluídas: lista vazia');

  var dbNenhuma = { tarefas: [] };
  assert.eq(Bonsai.telas.hoje.tarefasAbertas(dbNenhuma), [], 'sem tarefas: lista vazia');

  var dbTodasAbertas = { tarefas: [
    { id: 't1', concluidaEm: null },
    { id: 't2', concluidaEm: null }
  ] };
  assert.eq(Bonsai.telas.hoje.tarefasAbertas(dbTodasAbertas).length, 2, 'todas abertas: as duas voltam');

  // Contra o seed real: exatamente as 7 tarefas do seed estão abertas.
  var dbSeed = Bonsai.dadosIniciais.montar();
  assert.eq(Bonsai.telas.hoje.tarefasAbertas(dbSeed).length, 7, 'seed limpo tem 7 tarefas abertas');
});

assert.grupo('hoje.agruparChecklistPorPerfil — agrupa pelo perfil efetivo', function () {
  var perfilA = { id: 'sempre-umido', rotulo: 'Sempre úmido' };
  var perfilB = { id: 'secar-completo', rotulo: 'Secar completo' };

  var linhas = [
    { arvore: { id: 'x' }, perfil: perfilA },
    { arvore: { id: 'y' }, perfil: perfilB },
    { arvore: { id: 'z' }, perfil: perfilA }
  ];
  var grupos = Bonsai.telas.hoje.agruparChecklistPorPerfil(linhas);
  assert.eq(grupos.length, 2, 'duas árvores com o mesmo perfil viram um grupo só (2 grupos, não 3)');
  assert.eq(grupos[0].perfil.id, 'sempre-umido', 'primeiro grupo é o perfil que apareceu primeiro');
  assert.eq(grupos[0].linhas.map(function (l) { return l.arvore.id; }), ['x', 'z'],
    'grupo reúne todas as árvores daquele perfil, na ordem de entrada');
  assert.eq(grupos[1].perfil.id, 'secar-completo', 'segundo grupo é o outro perfil');
  assert.eq(grupos[1].linhas.map(function (l) { return l.arvore.id; }), ['y'], 'grupo com uma árvore só');

  // Nenhuma linha: nenhum grupo.
  assert.eq(Bonsai.telas.hoje.agruparChecklistPorPerfil([]), [], 'lista vazia não gera grupos');

  // Todas as linhas com perfis diferentes: um grupo por árvore.
  var perfilC = { id: 'nem-secar-nem-encharcar' };
  var todasDiferentes = [
    { arvore: { id: 'x' }, perfil: perfilA },
    { arvore: { id: 'y' }, perfil: perfilB },
    { arvore: { id: 'z' }, perfil: perfilC }
  ];
  assert.eq(Bonsai.telas.hoje.agruparChecklistPorPerfil(todasDiferentes).length, 3,
    'perfis todos distintos: um grupo por árvore');

  // Todas as linhas com o mesmo perfil: um grupo só, com todas dentro.
  var todasIguais = [
    { arvore: { id: 'x' }, perfil: perfilA },
    { arvore: { id: 'y' }, perfil: perfilA },
    { arvore: { id: 'z' }, perfil: perfilA }
  ];
  var gruposIguais = Bonsai.telas.hoje.agruparChecklistPorPerfil(todasIguais);
  assert.eq(gruposIguais.length, 1, 'perfis todos iguais: um grupo só');
  assert.eq(gruposIguais[0].linhas.length, 3, 'o grupo único contém as três linhas');

  // Contra o seed real, hoje 2026-09-05: 4 árvores ativas, 4 perfis efetivos
  // distintos (a Azaleia usa o override umido-vigiado, não sempre-umido).
  var dbSeed = Bonsai.dadosIniciais.montar();
  var checklistSeed = Bonsai.rega.checklist(dbSeed, '2026-09-05');
  var gruposSeed = Bonsai.telas.hoje.agruparChecklistPorPerfil(checklistSeed);
  assert.eq(checklistSeed.length, 4, 'pré-condição: 4 árvores ativas no checklist do seed');
  assert.eq(gruposSeed.length, 4, 'seed: 4 perfis efetivos distintos, um grupo por árvore');
  var idsPerfil = gruposSeed.map(function (g) { return g.perfil.id; });
  assert.ok(idsPerfil.indexOf('umido-vigiado') >= 0, 'o override da Azaleia aparece como grupo próprio');
});

assert.grupo('hoje.textoUltimaRega — nunca "há 0 dias", null é o normal de hoje', function () {
  assert.eq(Bonsai.telas.hoje.textoUltimaRega(null), 'Sem registro de rega ainda.',
    'diasDesde null vira "sem registro", nunca "há 0 dias"');
  assert.eq(/há 0/i.test(Bonsai.telas.hoje.textoUltimaRega(null)), false,
    'o texto de null jamais contém "há 0"');
  assert.eq(Bonsai.telas.hoje.textoUltimaRega(0), 'Regada hoje.', 'diasDesde 0 é regado hoje, não "há 0 dias"');
  assert.eq(Bonsai.telas.hoje.textoUltimaRega(1), 'Última rega há 1 dia.', 'singular para 1 dia');
  assert.eq(Bonsai.telas.hoje.textoUltimaRega(2), 'Última rega há 2 dias.', 'plural para 2 dias');
  assert.eq(Bonsai.telas.hoje.textoUltimaRega(30), 'Última rega há 30 dias.', 'plural para 30 dias');
});

// ---------------------------------------------------------------------
// render() — invariantes do texto renderizado contra o seed limpo. Estes
// dois guardas protegem exigências explícitas do CONTEXTO.md e do brief:
// nenhum número inventado (nenhuma medição hoje => sem barra, sem %) e
// nenhuma instrução de regar por rotina (o app manda testar, não regar).
//
// O "%" é proibido especificamente no que o app CALCULARIA (a seção de
// alertas, onde viveria uma barra de progresso) — não na tela inteira: o
// seed tem "%" legítimo dentro do `comoFazer` da tarefa da Primavera
// ("20% húmus, 45% substrato comercial, 35% casca de pinus"), que é plano
// de substrato já registrado pelo usuário, não número inventado pelo app.
// Da mesma forma, "regue" só é proibido como instrução POSITIVA: a nota da
// Azaleia é a negativa "Não regue sem testar", que precisa aparecer
// verbatim (é o requisito mais importante desta tela).
// ---------------------------------------------------------------------
function secaoAlertas(html) {
  var inicio = html.indexOf('id="titulo-alertas"');
  var fim = html.indexOf('id="titulo-tarefas"');
  return html.slice(inicio, fim);
}
function semNegacoesDeRegar(html) {
  return html.replace(/não\s+regue/gi, '');
}

assert.grupo('hoje.render — invariantes contra o seed limpo (2026-09-05)', function () {
  Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
  Bonsai.app.estado.hoje = '2026-09-05';

  var html = Bonsai.telas.hoje.render({});

  assert.eq(/%/.test(secaoAlertas(html)), false,
    'nenhuma árvore tem medição hoje: a seção de alertas não contém "%" (sem percentual inventado)');
  assert.eq(/\bregue\b/i.test(semNegacoesDeRegar(html)), false,
    'nenhuma instrução POSITIVA "regue" (a negativa "não regue" da Azaleia é esperada e testada abaixo)');
  assert.eq(/regar hoje/i.test(html), false, 'nenhuma instrução imperativa "regar hoje"');
  assert.eq(/há 0 dias?/i.test(html), false, 'nenhuma árvore aparece com "há 0 dia(s)"');

  assert.ok(/03\/10\/2026/.test(html), 'o bloqueio de adubo da Jabuticaba cita a data de liberação');
  assert.ok(/Não regue sem testar/.test(html), 'a nota da Azaleia aparece na tela, verbatim');
  assert.ok(/sem registro de rega ainda/i.test(html), 'nenhuma árvore tem histórico de rega ainda');
  assert.ok(/Registrar evento/.test(html), 'existe o botão de registrar evento');

  // As 7 tarefas do seed aparecem (pelo título).
  ['Medir o tronco pela primeira vez', 'Transplantar para bacia',
   'Remover a terra vermelha da superfície', 'Definir a fase',
   'Preencher a data de aquisição', 'Registrar a chegada dos Ficus A/B/C'
  ].forEach(function (titulo) {
    assert.ok(html.indexOf(Bonsai.util.escapar(titulo)) >= 0, 'a tarefa "' + titulo + '" aparece na tela');
  });

  // Nenhum valor null vaza como a palavra "null" na tela (Bonsai.util.escapar
  // trata null como string vazia — ver js/util.js).
  assert.eq(/\bnull\b/.test(html), false, 'a palavra "null" nunca aparece na tela renderizada');
});

// ---------------------------------------------------------------------
// Fix round 1 — item 1: três alertas de bloqueio de adubo têm o título
// idêntico ("Adubo bloqueado agora"); sem o apelido da árvore no cartão, o
// dono só sabe de qual árvore é lendo o estado citado no corpo. Testa a
// classe (todo alerta com arvoreId, em várias datas do ano), não um único
// exemplo — extrai o fragmento de CADA cartão pelo `data-alerta-id` e exige
// que o apelido apareça DENTRO daquele cartão específico, não só em algum
// lugar da página.
// ---------------------------------------------------------------------
function cardAlerta(html, id) {
  var marcador = html.indexOf('data-alerta-id="' + id + '"');
  if (marcador === -1) return null;
  var abreArticle = html.lastIndexOf('<article', marcador);
  var fechaArticle = html.indexOf('</article>', marcador);
  if (abreArticle === -1 || fechaArticle === -1) return null;
  return html.slice(abreArticle, fechaArticle);
}

assert.grupo('hoje.render — cada cartão de alerta nomeia a árvore (fix round 1)', function () {
  var DATAS = ['2026-01-15', '2026-06-15', '2026-09-05', '2026-10-05', '2026-12-15', '2027-01-15'];
  var totalAlertasComArvoreVerificados = 0;

  DATAS.forEach(function (hoje) {
    var db = Bonsai.dadosIniciais.montar();
    Bonsai.app.estado.db = db;
    Bonsai.app.estado.hoje = hoje;
    var html = Bonsai.telas.hoje.render({});
    var ativos = Bonsai.alertas.ativos(db, hoje);

    ativos.forEach(function (alerta) {
      if (!alerta.arvoreId) return;
      var arvore = db.arvores.filter(function (a) { return a.id === alerta.arvoreId; })[0];
      assert.ok(arvore, hoje + ': alerta ' + alerta.id + ' referencia uma árvore que existe no seed');
      if (!arvore) return;

      var card = cardAlerta(html, alerta.id);
      assert.ok(card, hoje + ': o cartão do alerta ' + alerta.id + ' aparece na tela');
      if (!card) return;

      assert.ok(card.indexOf(Bonsai.util.escapar(arvore.apelido)) >= 0,
        hoje + ': o cartão do alerta ' + alerta.id + ' mostra o apelido "' + arvore.apelido + '"');
      totalAlertasComArvoreVerificados++;
    });
  });

  assert.ok(totalAlertasComArvoreVerificados > 0,
    'pré-condição: pelo menos um alerta com arvoreId foi de fato verificado nas datas testadas');
});

assert.grupo('hoje.render — três bloqueios de adubo com título idêntico ficam distinguíveis (seed limpo)', function () {
  Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
  Bonsai.app.estado.hoje = '2026-09-05';
  var html = Bonsai.telas.hoje.render({});

  var jabuticaba = cardAlerta(html, 'bloqueio-adubo-jabuticaba');
  var serissa = cardAlerta(html, 'bloqueio-adubo-serissa');
  var azaleia = cardAlerta(html, 'bloqueio-adubo-azaleia');

  assert.ok(jabuticaba && serissa && azaleia, 'pré-condição: os três cartões de bloqueio de adubo existem hoje');
  assert.ok(jabuticaba.indexOf('Jabuticaba') >= 0, 'o cartão da Jabuticaba diz "Jabuticaba"');
  assert.ok(serissa.indexOf('Serissa') >= 0, 'o cartão da Serissa diz "Serissa"');
  assert.ok(azaleia.indexOf('Azaleia') >= 0, 'o cartão da Azaleia diz "Azaleia"');

  // E cada um NÃO contém o nome dos outros dois — descarta o caso em que o
  // apelido aparece na página inteira mas não no cartão certo.
  assert.eq(jabuticaba.indexOf('Serissa') >= 0 || jabuticaba.indexOf('Azaleia') >= 0, false,
    'o cartão da Jabuticaba não menciona as outras duas árvores');
  assert.eq(serissa.indexOf('Jabuticaba') >= 0 || serissa.indexOf('Azaleia') >= 0, false,
    'o cartão da Serissa não menciona as outras duas árvores');
  assert.eq(azaleia.indexOf('Jabuticaba') >= 0 || azaleia.indexOf('Serissa') >= 0, false,
    'o cartão da Azaleia não menciona as outras duas árvores');
});

assert.grupo('hoje.render — datas variadas não introduzem percentual nem "regue"', function () {
  var DATAS = ['2026-01-15', '2026-06-15', '2026-09-05', '2026-10-05', '2026-12-15', '2027-01-15'];
  DATAS.forEach(function (hoje) {
    Bonsai.app.estado.db = Bonsai.dadosIniciais.montar();
    Bonsai.app.estado.hoje = hoje;
    var html = Bonsai.telas.hoje.render({});
    assert.eq(/%/.test(secaoAlertas(html)), false, hoje + ': sem medição registrada, então sem percentual na seção de alertas');
    assert.eq(/\bregue\b/i.test(semNegacoesDeRegar(html)), false, hoje + ': nunca manda "regue" (positivo)');
    assert.eq(/regar hoje/i.test(html), false, hoje + ': nunca manda "regar hoje"');
  });
});
