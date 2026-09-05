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
