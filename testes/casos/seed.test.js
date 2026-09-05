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
