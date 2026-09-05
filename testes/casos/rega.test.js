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

// ---------------------------------------------------------------------
// Loops de invariante — o objetivo é pegar bugs que os casos canônicos
// acima não cobrem, não repetir o que eles já verificam.
// ---------------------------------------------------------------------
assert.grupo('rega — invariantes', function () {
  var IDS_PERFIS = ['sempre-umido', 'secar-entre-regas', 'secar-completo', 'nem-secar-nem-encharcar', 'umido-vigiado'];

  // 1. Para toda árvore do seed, perfilEfetivo devolve um dos 5 ids
  // conhecidos, com instrucao e teste não vazios.
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    db.arvores.forEach(function (a) {
      var especie = db.especies.filter(function (e) { return e.id === a.especieId; })[0];
      var p = Bonsai.rega.perfilEfetivo(a, especie);
      assert.ok(IDS_PERFIS.indexOf(p.id) >= 0, a.id + ': perfil efetivo é um dos 5 ids conhecidos (recebi ' + p.id + ')');
      assert.ok(typeof p.instrucao === 'string' && p.instrucao.length > 0, a.id + ': instrucao não vazia');
      assert.ok(typeof p.teste === 'string' && p.teste.length > 0, a.id + ': teste não vazio');
      assert.ok(p.origem === 'override' || p.origem === 'especie', a.id + ': origem é override ou especie');
    });
  })();

  // 2. Nenhuma linha do checklist manda regar — só manda testar. Isso
  // vale para qualquer data, não só para a data do caso canônico.
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    // Marca todas as árvores como ativas para que nenhuma fique de fora
    // e o loop cubra todos os perfis, inclusive o das a-chegar.
    db.arvores.forEach(function (a) { a.status = 'ativa'; });
    ['2026-09-05', '2027-01-15', '2026-12-25', '2026-02-01'].forEach(function (hoje) {
      var lista = Bonsai.rega.checklist(db, hoje);
      lista.forEach(function (linha) {
        // Cobre a linha inteira do checklist como o usuário a lê, inclusive
        // o aviso de estação — ele faz parte da mesma linha e uma edição
        // futura poderia introduzir ali a ordem que o resto do texto evita.
        var textoCompleto = linha.perfil.instrucao + ' ' + linha.perfil.teste + ' ' +
          (linha.perfil.nota || '') + ' ' + (linha.avisoEstacao || '');
        // "regue" (imperativo positivo, "regue agora") é a instrução
        // proibida — o checklist nunca manda regar hoje. "não regue" /
        // "nunca regue" (aviso negado, ex.: a nota da azaleia "não regue
        // sem testar") é o oposto disso — um alerta de risco, exigido pelo
        // caso canônico — e continua permitido, então é removido antes de
        // checar o restante do texto. "regar"/"regando" (infinitivo,
        // descrevendo a política do perfil) também continuam permitidos.
        var semAvisosNegados = textoCompleto.replace(/n[ãa]o\s+regue\b/gi, '').replace(/nunca\s+regue\b/gi, '');
        assert.ok(!/\bregue\b/i.test(semAvisosNegados),
          linha.arvore.id + ' em ' + hoje + ': checklist não manda "regue" fora de um aviso negado (recebi: ' + textoCompleto + ')');
      });
    });
  })();

  // 3. registrar 40 vezes com datas distintas deixa exatamente 30, mais
  // recente na frente; chamar de novo com a mesma data não muda nada.
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    var a = db.arvores[0];
    for (var i = 0; i < 40; i++) Bonsai.rega.registrar(a, Bonsai.datas.somarDias('2026-01-01', i));
    assert.eq(a.historicoRega.length, 30, 'registrar 40x deixa exatamente 30');
    var antes = a.historicoRega.slice();
    Bonsai.rega.registrar(a, antes[0]);
    assert.eq(a.historicoRega, antes, 'registrar de novo a data mais recente não muda nada');
    Bonsai.rega.registrar(a, antes[15]);
    assert.eq(a.historicoRega, antes, 'registrar de novo uma data do meio não muda nada');
  })();

  // 4. O override lapsa quando o estado muda e volta quando o estado
  // volta — e o objeto regaOverride nunca é apagado nesse processo.
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    var az = db.arvores.filter(function (a) { return a.id === 'azaleia'; })[0];
    var especie = db.especies.filter(function (e) { return e.id === 'rhododendron'; })[0];

    assert.eq(Bonsai.rega.perfilEfetivo(az, especie).origem, 'override', 'recuperacao: override ativo');
    assert.ok(az.regaOverride, 'override presente enquanto ativo');

    az.estado = 'saudavel';
    assert.eq(Bonsai.rega.perfilEfetivo(az, especie).origem, 'especie', 'saudavel: override lapsado');
    assert.ok(az.regaOverride, 'override continua presente mesmo lapsado');

    az.estado = 'adaptacao';
    assert.eq(Bonsai.rega.perfilEfetivo(az, especie).origem, 'especie', 'adaptacao: override ainda lapsado');
    assert.ok(az.regaOverride, 'override continua presente');

    az.estado = 'recuperacao';
    assert.eq(Bonsai.rega.perfilEfetivo(az, especie).origem, 'override', 'de volta a recuperacao: override reativado');
    assert.eq(Bonsai.rega.perfilEfetivo(az, especie).id, 'umido-vigiado', 'perfil correto ao reativar');
  })();

  // 5. null significa "não informado": histórico vazio nunca vira 0 ou
  // uma data fabricada.
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    var lista = Bonsai.rega.checklist(db, '2026-09-05');
    lista.forEach(function (linha) {
      if (linha.arvore.historicoRega.length === 0) {
        assert.eq(linha.ultimaRega, null, linha.arvore.id + ': sem histórico, ultimaRega é null');
        assert.eq(linha.diasDesde, null, linha.arvore.id + ': sem histórico, diasDesde é null');
      }
    });
    assert.eq(Bonsai.rega.intervaloMedioDias({ historicoRega: [] }), null, 'zero datas: null');
    assert.eq(Bonsai.rega.intervaloMedioDias({ historicoRega: ['2026-01-01'] }), null, 'uma data só: null');
  })();

  // 6. avisoEstacao é dez/jan/fev, nada além disso, e nunca vira uma
  // instrução de frequência fixa.
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    db.arvores.forEach(function (a) { a.status = 'ativa'; });
    var comAviso = ['2026-12-01', '2027-01-01', '2027-02-28'];
    var semAviso = ['2026-03-01', '2026-06-15', '2026-09-05', '2026-11-30'];
    comAviso.forEach(function (hoje) {
      var lista = Bonsai.rega.checklist(db, hoje);
      lista.forEach(function (l) {
        assert.ok(l.avisoEstacao !== null, hoje + ' (' + l.arvore.id + '): aviso de estação presente');
      });
    });
    semAviso.forEach(function (hoje) {
      var lista = Bonsai.rega.checklist(db, hoje);
      lista.forEach(function (l) {
        assert.eq(l.avisoEstacao, null, hoje + ' (' + l.arvore.id + '): sem aviso de estação');
      });
    });
  })();

  // 7. A nota de risco da Azaleia aparece dentro do checklist, não só na
  // ficha — é ali que a decisão errada seria tomada.
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    var lista = Bonsai.rega.checklist(db, '2026-09-05');
    var linhaAz = lista.filter(function (l) { return l.arvore.id === 'azaleia'; })[0];
    assert.ok(linhaAz, 'azaleia aparece no checklist');
    assert.ok(/n[ãa]o regue sem testar/i.test(linhaAz.perfil.nota || ''),
      'a nota de risco da azaleia aparece na linha do checklist');
  })();

  // 8. Checklist só cobre status 'ativa'.
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    var lista = Bonsai.rega.checklist(db, '2026-09-05');
    lista.forEach(function (l) {
      assert.eq(l.arvore.status, 'ativa', l.arvore.id + ': só árvores ativas entram no checklist');
    });
  })();

  // 9. Nenhum texto de rega ancora na superfície (spec 4.6 pós fix round
  // 2: o teste do dedo é a 2–3 cm nos cinco perfis, sem exceção, e o que
  // muda de um perfil para o outro é o que aquele resultado significa,
  // nunca onde o dedo entra). Uma `instrucao` pode citar "superfície"
  // desde que a mesma frase negue explicitamente julgar só por cima —
  // sem essa negação, é exatamente o falso positivo que faz o app
  // ensinar na tela de rega o erro que o guia lista como erro clássico.
  (function () {
    IDS_PERFIS.forEach(function (id) {
      var perfil = Bonsai.rega.PERFIS[id];
      var mencionaSuperficie = /superf[íi]cie/i.test(perfil.instrucao);
      if (mencionaSuperficie) {
        var negaJulgamentoPorCima = /sem confiar|n[ãa]o confi|n[ãa]o (s[oó]|apenas)\b/i.test(perfil.instrucao);
        assert.ok(negaJulgamentoPorCima,
          id + ': instrucao cita superfície mas nega o julgamento por cima (recebi: "' + perfil.instrucao + '")');
      } else {
        assert.ok(true, id + ': instrucao não ancora na superfície');
      }
    });
  })();
});
