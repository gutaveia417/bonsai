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

// P1 / R7 — null (não informado) nunca vira valor plausível. Só a Jabuticaba
// tem número real de sol por árvore; luz e adubo de cada espécie só têm campo
// preenchido onde a seção 8 da spec deu o dado explicitamente.
assert.grupo('seed - não informado é null, não é chute', function () {
  var db = Bonsai.dadosIniciais.montar();
  var por = function (id) { return db.arvores.filter(function (a) { return a.id === id; })[0]; };
  var especie = function (id) { return db.especies.filter(function (e) { return e.id === id; })[0]; };

  // solHoras por árvore — spec só dá número (6 h) para a Jabuticaba
  assert.eq(por('jabuticaba').solHoras, 6, 'jabuticaba: 6 h de sol, dado explícito');
  ['primavera', 'serissa', 'azaleia', 'ficus-a', 'ficus-b', 'ficus-c'].forEach(function (id) {
    assert.eq(por(id).solHoras, null, id + ': solHoras não informado é null');
  });

  // vaso.furada — só a Jabuticaba tem essa afirmação na spec
  assert.eq(por('jabuticaba').vaso.furada, true, 'jabuticaba: vaso furada, dado explícito');
  ['primavera', 'serissa', 'azaleia'].forEach(function (id) {
    assert.eq(por(id).vaso.furada, null, id + ': furada não informado é null');
  });

  // luz por espécie — só entra número onde a spec deu horas
  assert.eq(especie('jabuticaba').luz.horasMin, 5, 'jabuticaba luz: horasMin dado explícito');
  assert.eq(especie('jabuticaba').luz.horasMax, 6, 'jabuticaba luz: horasMax dado explícito');
  assert.eq(especie('serissa').luz.horasMin, 2, 'serissa luz: intervalo dado explícito (2-5h)');
  assert.eq(especie('serissa').luz.horasMax, 5, 'serissa luz: intervalo dado explícito (2-5h)');
  ['bougainvillea', 'rhododendron', 'ficus-panda'].forEach(function (id) {
    assert.eq(especie(id).luz.horasMin, null, id + ' luz: horasMin não informado é null');
    assert.eq(especie(id).luz.horasMax, null, id + ' luz: horasMax não informado é null');
  });

  // adubo — só entra o que a seção 8 informou por espécie, o resto é null
  var jabAdubo = especie('jabuticaba').adubo;
  assert.eq(jabAdubo.formula, '20-05-20', 'jabuticaba adubo: fórmula dada');
  assert.eq(jabAdubo.frequencia, 'quinzenal', 'jabuticaba adubo: frequência dada');
  assert.eq(jabAdubo.temporada, [9, 10, 11, 12, 1, 2, 3], 'jabuticaba adubo: temporada dada (set-mar)');

  var bouAdubo = especie('bougainvillea').adubo;
  assert.eq(bouAdubo.formula, '10-10-10', 'primavera adubo: só a fórmula foi dada');
  assert.eq(bouAdubo.frequencia, null, 'primavera adubo: frequência não informada é null');
  assert.eq(bouAdubo.temporada, null, 'primavera adubo: temporada não informada é null');
  assert.eq(bouAdubo.dose, null, 'primavera adubo: dose não informada é null');

  var serAdubo = especie('serissa').adubo;
  assert.eq(serAdubo.formula, '10-10-10', 'serissa adubo: fórmula dada');
  assert.eq(serAdubo.frequencia, 'quinzenal', 'serissa adubo: frequência dada');
  assert.eq(serAdubo.dose, 'meia', 'serissa adubo: dose dada (meia)');
  assert.eq(serAdubo.temporada, null, 'serissa adubo: temporada não informada é null');

  // Azaleia: nenhuma fórmula base foi dada na spec — só "ZERO adubo" do
  // estado de recuperação, que não é dado de espécie.
  var azAdubo = especie('rhododendron').adubo;
  assert.eq(azAdubo.formula, null, 'azaleia adubo: fórmula não informada é null');
  assert.eq(azAdubo.frequencia, null, 'azaleia adubo: frequência não informada é null');
  assert.eq(azAdubo.temporada, null, 'azaleia adubo: temporada não informada é null');
  assert.eq(azAdubo.dose, null, 'azaleia adubo: dose não informada é null');

  var ficAdubo = especie('ficus-panda').adubo;
  assert.eq(ficAdubo.formula, '10-10-10', 'ficus adubo: fórmula dada');
  assert.eq(ficAdubo.frequencia, 'quinzenal', 'ficus adubo: frequência dada');
  assert.eq(ficAdubo.dose, null, 'ficus adubo: dose não informada é null');
  assert.eq(ficAdubo.temporada, null, 'ficus adubo: temporada não informada é null');

  // R8 — janela de transplante é regional (Naviraí), não biológica; mesma
  // janela nas 5 espécies, vinda de uma única constante nomeada no seed.
  db.especies.forEach(function (e) {
    assert.eq(e.janelaTransplante, [8, 9], e.id + ': janela de transplante de Naviraí (ago-set)');
  });
});
