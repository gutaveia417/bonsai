// fix round 1 — verificação direta sobre as tabelas cruas: nenhuma acao pode
// repetir entre permitido/proibido/atencao dentro da MESMA linha de fase ou
// de estado (spec 5.1: "isso vale dentro da mesma tabela, não só entre fase
// e estado"). É mais forte que testar só as sete árvores do seed, porque
// nenhuma delas usa decepe/estrutura/refino — foi assim que "decepar" e
// "podar"/"aramar" repetidos dentro de decepe e estrutura escaparam do
// primeiro lote de testes.
assert.grupo('regras - tabelas cruas nao repetem acao na mesma linha', function () {
  function acaoRepetidaNaLinha(linha) {
    var vistas = {};
    var repetidas = [];
    ['permitido', 'proibido', 'atencao'].forEach(function (lista) {
      (linha[lista] || []).forEach(function (item) {
        if (vistas[item.acao]) repetidas.push(item.acao);
        vistas[item.acao] = true;
      });
    });
    return repetidas;
  }

  Object.keys(Bonsai.regras.POR_FASE).forEach(function (fase) {
    var repetidas = acaoRepetidaNaLinha(Bonsai.regras.POR_FASE[fase]);
    assert.eq(repetidas.length, 0, 'POR_FASE.' + fase + ': nenhuma acao repetida na linha (achou: ' + repetidas.join(', ') + ')');
  });

  Object.keys(Bonsai.regras.POR_ESTADO).forEach(function (estado) {
    var repetidas = acaoRepetidaNaLinha(Bonsai.regras.POR_ESTADO[estado]);
    assert.eq(repetidas.length, 0, 'POR_ESTADO.' + estado + ': nenhuma acao repetida na linha (achou: ' + repetidas.join(', ') + ')');
  });
});

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

  // fix round 1 — item 2: pós-transplante também proíbe transplantar de novo
  assert.ok(acoes(jt.proibido).indexOf('transplantar') >= 0,
    'pós-transplante proíbe transplantar de novo');
  assert.ok(jt.proibido.some(function (i) { return i.acao === 'transplantar' && /03\/10\/2026/.test(i.texto); }),
    'a proibição de transplantar também mostra a data de liberação');

  // fix round 1 — item 4: a acao nunca nomeia o oposto do que o texto instrui
  var azRecuperacao = Bonsai.regras.paraArvore(arv('azaleia'), esp('rhododendron'), '2026-09-05');
  assert.eq(acoes(azRecuperacao.permitido).indexOf('mudar-lugar'), -1,
    '"manter no lugar" não pode se chamar mudar-lugar');
  assert.ok(azRecuperacao.permitido.some(function (i) { return i.acao === 'manter-sombra'; }),
    'manter no lugar, à sombra, tem a própria acao: manter-sombra');

  // fix round 1 — item 3: serissa (fase null + adaptação) tem ao menos um permitido
  assert.ok(s.permitido.length > 0, 'serissa em adaptação não fica sem nenhuma ação permitida');
  assert.ok(acoes(s.permitido).indexOf('regar') >= 0, 'serissa em adaptação pode regar');
});

// fix round 1 — item 1: a mesma acao nunca aparece em mais de uma lista, nem
// mesmo dentro da mesma fase — poda de raiz (permitido) e o aviso do ramo
// baixo (atenção) são atos físicos diferentes e precisam de acao diferentes.
assert.grupo('regras - acao nunca aparece em mais de uma lista', function () {
  var db = Bonsai.dadosIniciais.montar();
  var especiePor = function (id) { return db.especies.filter(function (e) { return e.id === id; })[0]; };
  var DATAS = ['2026-09-05', '2026-10-10']; // dentro e fora da carência da jabuticaba

  db.arvores.forEach(function (arvore) {
    DATAS.forEach(function (hoje) {
      var especie = especiePor(arvore.especieId);
      var res = Bonsai.regras.paraArvore(arvore, especie, hoje);
      var vistoEm = {};
      var repetidas = [];
      ['permitido', 'proibido', 'atencao'].forEach(function (lista) {
        var acoesDaLista = {};
        res[lista].forEach(function (i) { acoesDaLista[i.acao] = true; });
        Object.keys(acoesDaLista).forEach(function (acao) {
          if (vistoEm[acao]) repetidas.push(acao);
          vistoEm[acao] = true;
        });
      });
      assert.eq(repetidas.length, 0,
        arvore.id + ' em ' + hoje + ': nenhuma acao repetida entre listas (achou: ' + repetidas.join(', ') + ')');
    });
  });
});

// fix round 1 — item 5: todo par fase x estado tem ao menos um permitido, e
// todo item de todo par explica o porquê e aponta para o guia. Isso troca a
// verificação de casos canônicos por uma verificação de invariante.
assert.grupo('regras - todo par fase x estado tem permitido e explica o porque', function () {
  var db = Bonsai.dadosIniciais.montar();
  var especieBase = db.especies.filter(function (e) { return e.id === 'jabuticaba'; })[0];
  var FASES = ['engorda', 'decepe', 'estrutura', 'refino', null];
  var ESTADOS = ['saudavel', 'adaptacao', 'recuperacao', 'pos-transplante'];

  FASES.forEach(function (fase) {
    ESTADOS.forEach(function (estado) {
      var arvore = {
        id: 'sintetica-' + fase + '-' + estado,
        fase: fase,
        estado: estado,
        estadoAte: estado === 'pos-transplante' ? '2099-01-01' : null
      };
      var res = Bonsai.regras.paraArvore(arvore, especieBase, '2026-09-05');
      var rotulo = 'fase=' + fase + ' estado=' + estado;

      assert.ok(res.permitido.length > 0, rotulo + ': permitido nunca vem vazio');

      ['permitido', 'proibido', 'atencao'].forEach(function (k) {
        res[k].forEach(function (i) {
          assert.ok(i.porque && i.porque.length > 10, rotulo + ' [' + k + '] ' + i.acao + ': explica o porquê');
          assert.ok(i.guiaAncora, rotulo + ' [' + k + '] ' + i.acao + ': aponta para o guia');
        });
      });
    });
  });
});

// fix round 1 — item 6: temporada: [] (proibição explícita) é diferente de
// temporada: null (não informado) — nenhuma espécie do seed tem [], então a
// espécie sintética abaixo existe só para exercitar esse ramo do código.
assert.grupo('regras - temporada vazia proíbe, temporada null vira atenção', function () {
  var arvoreSintetica = { id: 'sintetica', fase: 'engorda', estado: 'saudavel', estadoAte: null };

  var especieNuncaAduba = { id: 'sintetica-nunca-aduba', adubo: { formula: '10-10-10', frequencia: null, temporada: [], dose: null } };
  var resNunca = Bonsai.regras.paraArvore(arvoreSintetica, especieNuncaAduba, '2026-09-05');
  var itemNunca = resNunca.proibido.filter(function (i) { return i.acao === 'adubar'; })[0];
  assert.ok(itemNunca, 'temporada: [] proíbe adubar explicitamente');
  assert.eq(resNunca.atencao.filter(function (i) { return i.acao === 'adubar'; }).length, 0,
    'temporada: [] não aparece como atenção');
  assert.eq(resNunca.permitido.filter(function (i) { return i.acao === 'adubar'; }).length, 0,
    'temporada: [] não aparece como permitido');

  var especieSemInfo = { id: 'sintetica-sem-info', adubo: { formula: '10-10-10', frequencia: null, temporada: null, dose: null } };
  var resSemInfo = Bonsai.regras.paraArvore(arvoreSintetica, especieSemInfo, '2026-09-05');
  var itemSemInfo = resSemInfo.atencao.filter(function (i) { return i.acao === 'adubar'; })[0];
  assert.ok(itemSemInfo, 'temporada: null vira atenção, não proibição');
  assert.eq(resSemInfo.proibido.filter(function (i) { return i.acao === 'adubar'; }).length, 0,
    'temporada: null não aparece como proibido');

  assert.ok(itemNunca.texto !== itemSemInfo.texto,
    'temporada: [] e temporada: null geram mensagens diferentes');
  assert.ok(itemNunca.porque.length > 10 && itemSemInfo.porque.length > 10,
    'os dois avisos explicam o porquê, não só que o campo está vazio');
});
