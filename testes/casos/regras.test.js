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

// fix round 2 — R18: regar, observar e medir são cuidado básico, sempre ✅,
// em qualquer fase (inclusive null) e qualquer estado, sem exceção. Antes
// desta correção, uma árvore com fase: null não tinha de quem herdar essas
// três ações, e a Serissa/Azaleia ficavam sem `medir`.
assert.grupo('regras - cuidado basico (regar, observar, medir) sempre permitido (R18)', function () {
  var db = Bonsai.dadosIniciais.montar();
  var especieBase = db.especies.filter(function (e) { return e.id === 'jabuticaba'; })[0];
  var FASES = ['engorda', 'decepe', 'estrutura', 'refino', null];
  var ESTADOS = ['saudavel', 'adaptacao', 'recuperacao', 'pos-transplante'];
  var NUCLEO = ['regar', 'observar', 'medir'];

  FASES.forEach(function (fase) {
    ESTADOS.forEach(function (estado) {
      var arvore = {
        id: 'nucleo-' + fase + '-' + estado,
        fase: fase,
        estado: estado,
        estadoAte: estado === 'pos-transplante' ? '2099-01-01' : null
      };
      var res = Bonsai.regras.paraArvore(arvore, especieBase, '2026-09-05');
      var acoesPermitido = res.permitido.map(function (i) { return i.acao; });
      var rotulo = 'fase=' + fase + ' estado=' + estado;

      NUCLEO.forEach(function (acaoNucleo) {
        assert.ok(acoesPermitido.indexOf(acaoNucleo) >= 0, rotulo + ': ' + acaoNucleo + ' está em permitido');
      });

      // dedupe: nenhuma das três aparece duas vezes em permitido
      NUCLEO.forEach(function (acaoNucleo) {
        var vezes = acoesPermitido.filter(function (a) { return a === acaoNucleo; }).length;
        assert.eq(vezes, 1, rotulo + ': ' + acaoNucleo + ' aparece exatamente uma vez em permitido (achou ' + vezes + ')');
      });
    });
  });
});

// fix round 2 — nenhuma tabela crua pode proibir cuidado básico; se alguma
// colocar, é bug de tabela e o teste tem que gritar.
assert.grupo('regras - regar, observar e medir nunca aparecem em proibido em tabela alguma', function () {
  var NUCLEO = ['regar', 'observar', 'medir'];

  Object.keys(Bonsai.regras.POR_FASE).forEach(function (fase) {
    (Bonsai.regras.POR_FASE[fase].proibido || []).forEach(function (item) {
      assert.eq(NUCLEO.indexOf(item.acao), -1, 'POR_FASE.' + fase + '.proibido não pode conter ' + item.acao);
    });
  });

  Object.keys(Bonsai.regras.POR_ESTADO).forEach(function (estado) {
    (Bonsai.regras.POR_ESTADO[estado].proibido || []).forEach(function (item) {
      assert.eq(NUCLEO.indexOf(item.acao), -1, 'POR_ESTADO.' + estado + '.proibido não pode conter ' + item.acao);
    });
  });
});

// Correção de dados reais (06/09/2026) — nenhuma raiz foi cortada nos três
// transplantes de 2026 (Jabuticaba, Serissa, Primavera; ver seed.test.js e
// CONTEXTO.md invariante 1), e a Jabuticaba é explicitamente incerta sobre
// isso. Nenhum texto de regra em lugar nenhum pode presumir corte de raiz —
// a varredura cobre POR_FASE e POR_ESTADO inteiros, não só pos-transplante,
// porque uma frase assim poderia vazar em qualquer fase futura também.
assert.grupo('regras - nenhum texto de regra presume corte de raiz (correção 06/09/2026)', function () {
  var PADRAO_CORTE = /raiz\s+(j[áa]\s+)?cortada|cortar?a?\s+de\s+novo|corte\s+anterior|reconstruir\s+raiz\s+cortad/i;

  function varrer(tabela, nomeTabela) {
    Object.keys(tabela).forEach(function (chave) {
      ['permitido', 'proibido', 'atencao'].forEach(function (lista) {
        (tabela[chave][lista] || []).forEach(function (item) {
          assert.eq(PADRAO_CORTE.test(item.texto), false,
            nomeTabela + '.' + chave + '.' + lista + '[' + item.acao + '].texto não presume corte de raiz');
          assert.eq(PADRAO_CORTE.test(item.porque), false,
            nomeTabela + '.' + chave + '.' + lista + '[' + item.acao + '].porque não presume corte de raiz');
        });
      });
    });
  }

  varrer(Bonsai.regras.POR_FASE, 'POR_FASE');
  varrer(Bonsai.regras.POR_ESTADO, 'POR_ESTADO');

  // Caso concreto: pos-transplante continua explicando a carência, só que
  // pela raiz ainda não ter se firmado no substrato novo, não por um corte.
  var jt = Bonsai.regras.paraArvore(
    Bonsai.dadosIniciais.montar().arvores.filter(function (a) { return a.id === 'jabuticaba'; })[0],
    Bonsai.dadosIniciais.montar().especies.filter(function (e) { return e.id === 'jabuticaba'; })[0],
    '2026-09-05'
  );
  var itemAdubo = jt.proibido.filter(function (i) { return i.acao === 'adubar'; })[0];
  assert.ok(itemAdubo, 'pré-condição: jabuticaba tem adubo bloqueado em pós-transplante');
  assert.ok(/firm|restabele/i.test(itemAdubo.porque),
    'a explicação da carência fala em raiz se firmando, não em corte cicatrizando');
});

// fix round 2 — R19: em estado restritivo (adaptacao, recuperacao,
// pos-transplante), uma permissão que vem só da fase (origem: 'fase') e que
// o estado não re-autoriza explicitamente nunca fica ✅ por herança — ela
// tem que virar ⚠️. saudavel não é restritivo: nele a fase manda sozinha.
assert.grupo('regras - estado restritivo nega por omissao, nunca herda ✅ da fase (R19)', function () {
  var db = Bonsai.dadosIniciais.montar();
  var especieBase = db.especies.filter(function (e) { return e.id === 'jabuticaba'; })[0];
  var FASES = ['engorda', 'decepe', 'estrutura', 'refino', null];
  var RESTRITIVOS = ['adaptacao', 'recuperacao', 'pos-transplante'];

  FASES.forEach(function (fase) {
    RESTRITIVOS.forEach(function (estado) {
      var arvore = {
        id: 'restritivo-' + fase + '-' + estado,
        fase: fase,
        estado: estado,
        estadoAte: estado === 'pos-transplante' ? '2099-01-01' : null
      };
      var res = Bonsai.regras.paraArvore(arvore, especieBase, '2026-09-05');
      var vazaram = res.permitido.filter(function (i) { return i.origem === 'fase'; }).map(function (i) { return i.acao; });
      assert.eq(vazaram.length, 0,
        'fase=' + fase + ' estado=' + estado + ': nenhuma permissão de fase escapa por herança silenciosa (achou: ' + vazaram.join(', ') + ')');
    });
  });

  // caso concreto: decepe tem "decepar" permitido só na fase; numa árvore
  // em adaptação isso precisa virar atenção, mencionando o estado.
  var arvoreDecepeAdaptacao = { id: 'decepe-adaptacao', fase: 'decepe', estado: 'adaptacao', estadoAte: null };
  var resDecepe = Bonsai.regras.paraArvore(arvoreDecepeAdaptacao, especieBase, '2026-09-05');
  assert.eq(resDecepe.permitido.filter(function (i) { return i.acao === 'decepar'; }).length, 0,
    'decepar não fica ✅ numa árvore em adaptação só porque a fase permite');
  var itemRebaixado = resDecepe.atencao.filter(function (i) { return i.acao === 'decepar'; })[0];
  assert.ok(itemRebaixado, 'decepar rebaixado aparece em atenção');
  assert.ok(itemRebaixado && (/adapta/i.test(itemRebaixado.texto) || /adapta/i.test(itemRebaixado.porque)),
    'o texto do rebaixamento diz qual estado (adaptação) causou isso');

  // saudavel não é restritivo — a fase continua mandando sozinha
  var arvoreDecepeSaudavel = { id: 'decepe-saudavel', fase: 'decepe', estado: 'saudavel', estadoAte: null };
  var resDecepeSaudavel = Bonsai.regras.paraArvore(arvoreDecepeSaudavel, especieBase, '2026-09-05');
  assert.ok(resDecepeSaudavel.permitido.some(function (i) { return i.acao === 'decepar'; }),
    'saudavel não é restritivo: decepar continua ✅ vindo da fase');
});
