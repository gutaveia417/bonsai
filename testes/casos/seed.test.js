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

  assert.eq(db.tarefas.length, 7, 'as 7 tarefas do seed');
  // Duas tarefas descrevem fatos que já aconteceram antes do app existir
  // (Primavera transplantada, Serissa com a terra vermelha removida, ambas
  // em 05/09/2026) — nascem concluídas, nunca escondidas nem reabertas.
  var concluidas = db.tarefas.filter(function (t) { return t.concluidaEm !== null; });
  assert.eq(concluidas.map(function (t) { return t.id; }).sort(),
    ['tarefa-primavera-transplante', 'tarefa-serissa-terra-vermelha'],
    'exatamente as duas tarefas que já aconteceram nascem concluídas');
  assert.eq(por('primavera') && db.tarefas.filter(function (t) { return t.id === 'tarefa-primavera-transplante'; })[0].concluidaEm,
    '2026-09-05', 'transplante da primavera concluído em 05/09/2026');
  assert.eq(db.tarefas.filter(function (t) { return t.id === 'tarefa-serissa-terra-vermelha'; })[0].concluidaEm,
    '2026-09-05', 'remoção da terra vermelha da serissa concluída em 05/09/2026');
  assert.eq(db.tarefas.filter(function (t) { return t.concluidaEm === null; }).length, 5,
    'as outras 5 tarefas continuam abertas');
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

// Correção de dados reais (06/09/2026): os três transplantes de fato (Serissa
// e Primavera em 05/09, Jabuticaba em 01/09) viram evento, nenhum com raiz
// cortada, e nenhum vira um "0" que afirmaria o que ninguém mediu.
assert.grupo('seed - transplantes reais viram evento, nunca inventam corte de raiz', function () {
  var db = Bonsai.dadosIniciais.montar();
  var eventoDe = function (id) { return db.eventos.filter(function (e) { return e.arvoreId === id && e.tipo === 'transplante'; })[0]; };

  var evJab = eventoDe('jabuticaba');
  var evSer = eventoDe('serissa');
  var evPri = eventoDe('primavera');

  assert.ok(evJab, 'existe evento de transplante da jabuticaba');
  assert.ok(evSer, 'existe evento de transplante da serissa');
  assert.ok(evPri, 'existe evento de transplante da primavera');

  assert.eq(evJab.data, '2026-09-01', 'jabuticaba transplantada em 01/09/2026');
  assert.eq(evSer.data, '2026-09-05', 'serissa transplantada em 05/09/2026');
  assert.eq(evPri.data, '2026-09-05', 'primavera transplantada em 05/09/2026');

  [evJab, evSer, evPri].forEach(function (ev) {
    assert.eq(ev.dados.podaRaizFracao, null,
      ev.arvoreId + ': podaRaizFracao é null, nunca 0 (0 afirmaria "cortou zero")');
  });

  // A certeza (ou a falta dela) mora em nota, em palavras — nunca no número.
  var PADRAO_NENHUMA_CORTADA = /nenhuma raiz (foi )?cortada/i;
  assert.ok(PADRAO_NENHUMA_CORTADA.test(evSer.nota), 'serissa: nota afirma que nenhuma raiz foi cortada');
  assert.ok(PADRAO_NENHUMA_CORTADA.test(evPri.nota), 'primavera: nota afirma que nenhuma raiz foi cortada');
  assert.ok(/n[ãa]o confirmad/i.test(evJab.nota), 'jabuticaba: nota expõe a incerteza, não afirma nem nega o corte');
  assert.eq(PADRAO_NENHUMA_CORTADA.test(evJab.nota), false,
    'jabuticaba: a nota não pode afirmar que nenhuma raiz foi cortada — é incerteza, não fato');

  // O substrato estimado por volume (05/09/2026) carrega o selo de estimativa
  // nos três componentes; o da jabuticaba (dado como fato) não.
  [evSer, evPri].forEach(function (ev) {
    ev.dados.substrato.forEach(function (c) {
      assert.eq(c.estimado, true, ev.arvoreId + ': componente "' + c.componente + '" do substrato de 05/09 é estimativa');
    });
  });
  evJab.dados.substrato.forEach(function (c) {
    assert.eq(!!c.estimado, false, 'jabuticaba: substrato do transplante de 01/09 não é marcado como estimativa');
  });
});

// R13 (nova) — coberturaSuperficie existe nas sete árvores, com um valor
// válido; só as duas do transplante de 05/09/2026 têm casca, e nenhuma outra
// árvore ganha um valor chutado.
assert.grupo('seed - coberturaSuperficie presente e honesta nas 7 árvores', function () {
  var db = Bonsai.dadosIniciais.montar();
  var VALIDOS = ['casca', 'musgo', 'nenhuma', null];

  db.arvores.forEach(function (a) {
    assert.ok(VALIDOS.indexOf(a.coberturaSuperficie) >= 0,
      a.id + ': coberturaSuperficie é um valor válido (recebi ' + JSON.stringify(a.coberturaSuperficie) + ')');
  });

  var por = function (id) { return db.arvores.filter(function (a) { return a.id === id; })[0]; };
  assert.eq(por('serissa').coberturaSuperficie, 'casca', 'serissa: casca de pinus na superfície');
  assert.eq(por('primavera').coberturaSuperficie, 'casca', 'primavera: casca de pinus na superfície');
  ['jabuticaba', 'azaleia', 'ficus-a', 'ficus-b', 'ficus-c'].forEach(function (id) {
    assert.eq(por(id).coberturaSuperficie, null, id + ': cobertura nunca mencionada é null, não chutada');
  });
});
