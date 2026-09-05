// Task 6 — brief canônico (verbatim, ver task-6-brief.md).
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

// ---------------------------------------------------------------------
// Loops de invariante — não repetem os casos canônicos acima, tentam
// pegar o bug que ninguém pensou em nomear (os dois fix rounds anteriores
// passaram no verde com testes só de caso canônico).
// ---------------------------------------------------------------------
assert.grupo('alertas — invariantes', function () {
  var NIVEIS = ['info', 'atencao', 'bloqueio'];
  var DATAS_DO_ANO = [
    '2026-01-15', '2026-02-15', '2026-03-15', '2026-04-15', '2026-05-15',
    '2026-06-15', '2026-07-15', '2026-08-15', '2026-09-05', '2026-09-15',
    '2026-10-15', '2026-11-15', '2026-12-15', '2027-01-15'
  ];

  // 1. Para toda árvore do seed e várias datas do ano: todo alerta tem
  // guiaAncora não vazio, nivel dentre os três permitidos, e um id que não
  // muda entre duas chamadas com os mesmos argumentos (dispensa é gravada
  // por id — um id instável faria a dispensa falhar silenciosamente).
  (function () {
    DATAS_DO_ANO.forEach(function (hoje) {
      var db = Bonsai.dadosIniciais.montar();
      var a1 = Bonsai.alertas.gerar(db, hoje);
      var a2 = Bonsai.alertas.gerar(db, hoje);

      assert.eq(a1.map(function (a) { return a.id; }), a2.map(function (a) { return a.id; }),
        hoje + ': gerar() duas vezes com os mesmos argumentos devolve os mesmos ids, na mesma ordem');

      a1.forEach(function (a) {
        assert.ok(a.guiaAncora && a.guiaAncora.length > 0, hoje + ': alerta ' + a.id + ' tem guiaAncora não vazio');
        assert.ok(NIVEIS.indexOf(a.nivel) >= 0, hoje + ': alerta ' + a.id + ' tem nivel válido (recebi ' + a.nivel + ')');
        assert.ok(a.id && typeof a.id === 'string' && a.id.length > 0, hoje + ': alerta tem id não vazio');
      });
    });
  })();

  // 2. Nenhum alerta de árvore sem medicao mostra percentual — o gráfico
  // de progresso não pode inventar número (CONTEXTO invariante 1).
  (function () {
    DATAS_DO_ANO.forEach(function (hoje) {
      var db = Bonsai.dadosIniciais.montar();
      var idsComMedicao = {};
      db.eventos.filter(function (e) { return e.tipo === 'medicao'; }).forEach(function (e) {
        idsComMedicao[e.arvoreId] = true;
      });
      Bonsai.alertas.gerar(db, hoje).forEach(function (a) {
        if (a.arvoreId && !idsComMedicao[a.arvoreId]) {
          assert.eq(/%/.test(a.corpo), false,
            hoje + ': alerta ' + a.id + ' (árvore sem medição) não tem percentual no corpo (recebi: "' + a.corpo + '")');
          assert.eq(a.progresso, null,
            hoje + ': alerta ' + a.id + ' (árvore sem medição) tem progresso null');
        }
      });
    });
  })();

  // 3. R21 — para toda árvore cuja regra diz que transplantar é ⛔, nunca
  // existe um alerta de janela de transplante para ela. É o teste que
  // pegaria a contradição Serissa/Azaleia (adaptacao/recuperacao bloqueiam
  // transplantar, mas a janela de agosto/setembro continuaria "aberta"
  // aos olhos deste módulo se ele reimplementasse a tabela de estados em
  // vez de perguntar para Bonsai.regras).
  (function () {
    DATAS_DO_ANO.forEach(function (hoje) {
      var db = Bonsai.dadosIniciais.montar();
      var especiePor = function (id) { return db.especies.filter(function (e) { return e.id === id; })[0]; };
      var alertas = Bonsai.alertas.gerar(db, hoje);
      var idsAlertas = {};
      alertas.forEach(function (a) { idsAlertas[a.id] = true; });

      db.arvores.forEach(function (arvore) {
        var especie = especiePor(arvore.especieId);
        var res = Bonsai.regras.paraArvore(arvore, especie, hoje);
        var transplantarBloqueado = res.proibido.some(function (i) { return i.acao === 'transplantar'; });
        if (transplantarBloqueado) {
          assert.eq(idsAlertas['janela-transplante-' + arvore.id], undefined,
            hoje + ': ' + arvore.id + ' tem transplantar ⛔, não pode existir alerta de janela de transplante para ela');
        }
      });
    });
  })();

  // 4. Dispensa: some enquanto a dispensa vale, reaparece no dia seguinte
  // a ateData — testado num alerta de verdade (o de arame do ficus-b),
  // não só no cenário do caso canônico (sol pós-transplante).
  (function () {
    var db = Bonsai.dadosIniciais.montar();
    db.eventos.push({
      id: 'e-arame-loop', arvoreId: 'ficus-b', data: '2026-01-01', tipo: 'aramacao',
      nota: '', dados: { ramos: 'primários', bitolaMm: 2 }, fotoId: null
    });
    var hoje = '2026-06-01'; // bem além dos 30 dias
    var alertaArame = Bonsai.alertas.gerar(db, hoje).filter(function (a) { return /arame.*ficus-b/.test(a.id); })[0];
    assert.ok(alertaArame, 'pré-condição: existe alerta de arame do ficus-b nesta data');

    Bonsai.alertas.dispensar(db, alertaArame.id, '2026-06-10');

    var achaArame = function (lista) { return lista.filter(function (a) { return a.id === alertaArame.id; }); };
    assert.eq(achaArame(Bonsai.alertas.ativos(db, '2026-06-01')).length, 0, 'dispensado no dia seguinte à geração: some');
    assert.eq(achaArame(Bonsai.alertas.ativos(db, '2026-06-10')).length, 0, 'ainda dentro do prazo de dispensa: some');
    assert.ok(achaArame(Bonsai.alertas.ativos(db, '2026-06-11')).length > 0, 'um dia depois de ateData: reaparece');
  })();
});

// ---------------------------------------------------------------------
// Fix round 1 — item "Important" da revisão: a escalada do cartão de
// gatilho por medida para nivel: 'atencao' ao atingir o alvo de 80 mm não
// tinha nenhum dado de teste chegando lá. Sem isso, aquele ramo do código
// só ia rodar de verdade daqui a anos (quando o tronco real da jabuticaba
// chegasse a 80 mm), com cobertura zero até lá — o mesmo padrão que já
// custou duas rodadas na Task 4 (fases decepe/estrutura sem árvore no
// seed que as alcançasse).
// ---------------------------------------------------------------------
assert.grupo('alertas — gatilho por medida atinge e ultrapassa o alvo de 80 mm', function () {
  var achar = function (lista, re) { return lista.filter(function (a) { return re.test(a.id); }); };

  // Atinge o alvo exatamente (80 mm).
  var dbAtinge = Bonsai.dadosIniciais.montar();
  dbAtinge.eventos.push({
    id: 'e-atinge', arvoreId: 'jabuticaba', data: '2026-09-10', tipo: 'medicao', nota: '',
    dados: { diametroMm: 80, alturaDaMedidaCm: 5, metodo: 'fita' }, fotoId: null
  });
  var gAtinge = achar(Bonsai.alertas.gerar(dbAtinge, '2026-09-11'), /gatilho.*jabuticaba/)[0];
  assert.ok(gAtinge, 'existe o card de gatilho ao atingir exatamente o alvo');
  assert.eq(gAtinge.nivel, 'atencao', 'ao atingir 80 mm o nivel sobe para atencao');
  assert.ok(/alvo/i.test(gAtinge.titulo), 'o titulo menciona o alvo atingido');
  assert.ok(/80 mm/.test(gAtinge.corpo), 'o corpo cita o valor atingido');
  assert.ok(/decepe/i.test(gAtinge.corpo), 'o corpo remete à orientação de decepe, sem afirmar que já está liberado');
  assert.eq(/liberad[oa]|autorizad[oa]/i.test(gAtinge.corpo), false,
    'o corpo não afirma que o decepe já está liberado — só remete à orientação do guia');
  assert.eq(gAtinge.guiaAncora, 'guia#decepe-corte', 'a ancora aponta para a orientação de decepe');
  assert.eq(gAtinge.progresso.atualMm, 80, 'progresso reflete a medição real');
  assert.eq(gAtinge.progresso.alvoMm, 80, 'alvo continua 80');

  // Ultrapassa o alvo (95 mm), numa medição mais recente ainda.
  var dbUltrapassa = Bonsai.dadosIniciais.montar();
  dbUltrapassa.eventos.push({
    id: 'e-antes', arvoreId: 'jabuticaba', data: '2026-09-10', tipo: 'medicao', nota: '',
    dados: { diametroMm: 80, alturaDaMedidaCm: 5, metodo: 'fita' }, fotoId: null
  });
  dbUltrapassa.eventos.push({
    id: 'e-depois', arvoreId: 'jabuticaba', data: '2026-10-01', tipo: 'medicao', nota: '',
    dados: { diametroMm: 95, alturaDaMedidaCm: 5, metodo: 'fita' }, fotoId: null
  });
  var gUltrapassa = achar(Bonsai.alertas.gerar(dbUltrapassa, '2026-10-05'), /gatilho.*jabuticaba/)[0];
  assert.ok(gUltrapassa, 'existe o card de gatilho ao ultrapassar o alvo');
  assert.eq(gUltrapassa.nivel, 'atencao', 'ao ultrapassar 80 mm o nivel continua atencao');
  assert.eq(gUltrapassa.progresso.atualMm, 95, 'usa a última medição, não a primeira que já tinha atingido o alvo');
  assert.eq(gUltrapassa.progresso.alvoMm, 80, 'alvo continua 80');
  assert.eq(gUltrapassa.guiaAncora, 'guia#decepe-corte', 'a ancora continua a de decepe ao ultrapassar o alvo');
  assert.ok(gUltrapassa.guiaAncora && gUltrapassa.guiaAncora.length > 0, 'guiaAncora não vazio');
});
