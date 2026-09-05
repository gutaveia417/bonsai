// Testes de Bonsai.svg — Task 12. Diagramas desenhados (não fotos) para
// geometria e sequência que uma foto não ensina: as cinco partes julgadas,
// a sequência de um corte, clip-and-grow, o ângulo do arame, as duas
// arquiteturas de raiz, a linha do tempo das quatro fases, e o substituto
// desenhado para o slot "tronco cilíndrico" (Grupo B, sem foto livre —
// ver assets/fotos/creditos.json, slot "tronco-cilindrico").
//
// Precisam sobreviver a: impressão em P&B numa folha A4 (Invariante 2 e
// restrições técnicas do CONTEXTO.md) e leitura na tela de um celular.

// ---------------------------------------------------------------------
// Paleta permitida: preto, branco, cinzas (hex com R=G=B), 'none' e
// 'currentColor'. Qualquer outra cor é um defeito de impressão — o
// significado nunca pode depender de cor, porque a folha sai em cinza.
// ---------------------------------------------------------------------
function corPermitida(cor) {
  cor = cor.toLowerCase().trim();
  if (cor === 'none' || cor === 'currentcolor' || cor === 'transparent') return true;
  if (/^(black|white|gray|grey)[0-9]*$/.test(cor)) return true;
  var hex6 = cor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
  if (hex6) return hex6[1] === hex6[2] && hex6[2] === hex6[3];
  var hex3 = cor.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (hex3) return hex3[1] === hex3[2] && hex3[2] === hex3[3];
  return false;
}

function coresForaDaPaleta(svg) {
  var re = /(?:fill|stroke|stop-color)\s*=\s*"([^"]*)"/g;
  var m, ruins = [];
  while ((m = re.exec(svg))) {
    if (m[1] === '') continue;
    if (!corPermitida(m[1])) ruins.push(m[1]);
  }
  return ruins;
}

assert.grupo('svg - LISTA existe e é bem formada', function () {
  assert.ok(Bonsai.svg && typeof Bonsai.svg === 'object', 'Bonsai.svg existe');
  assert.ok(Array.isArray(Bonsai.svg.LISTA), 'Bonsai.svg.LISTA é array');
  assert.ok(Bonsai.svg.LISTA.length >= 7, 'pelo menos os 7 diagramas (6 base + fallback do Grupo B)');

  var idsVistos = {};
  Bonsai.svg.LISTA.forEach(function (d) {
    assert.ok(typeof d.id === 'string' && d.id.length > 0, 'id não vazio (' + d.id + ')');
    assert.ok(typeof d.titulo === 'string' && d.titulo.length > 0, 'titulo não vazio (' + d.id + ')');
    assert.ok(typeof d.legenda === 'string' && d.legenda.length > 20,
      d.id + ' tem legenda com mais de 20 caracteres dizendo o que olhar');
    assert.eq(idsVistos[d.id], undefined, 'id único: ' + d.id);
    idsVistos[d.id] = true;

    assert.ok(typeof d.fn === 'string' && d.fn.length > 0, d.id + ' tem nome de função');
    assert.ok(typeof Bonsai.svg[d.fn] === 'function', 'Bonsai.svg.' + d.fn + ' é uma função');
  });
});

assert.grupo('svg - invariantes de cada diagrama', function () {
  Bonsai.svg.LISTA.forEach(function (d) {
    var s = Bonsai.svg[d.fn]();

    assert.ok(typeof s === 'string' && s.length > 0, d.id + ' devolve string não vazia');
    assert.ok(/^<svg/.test(s.trim()), d.id + ' começa com <svg');
    assert.ok(/viewBox\s*=\s*"[^"]+"/.test(s), d.id + ' tem viewBox');
    assert.eq(/preserveAspectRatio\s*=\s*"none"/.test(s), false,
      d.id + ' não usa preserveAspectRatio="none" (distorceria o texto)');
    assert.ok(/<title>[^<]+<\/title>/.test(s), d.id + ' tem <title> não vazio para leitor de tela');
    assert.eq(/<image/.test(s), false, d.id + ' não embute <image>');
    assert.eq(/xlink:href/.test(s), false, d.id + ' não usa xlink:href');

    var ruins = coresForaDaPaleta(s);
    assert.eq(ruins.length, 0, d.id + ' só usa preto/branco/cinza (achei: ' + ruins.join(', ') + ')');

    var repetida = Bonsai.svg[d.fn]();
    assert.eq(repetida, s, d.id + ' é determinístico (mesma chamada, mesma saída)');
  });
});

assert.grupo('svg - diagramas nomeados no brief existem', function () {
  ['cincoPartes', 'corteCerto', 'clipAndGrow', 'anguloArame', 'raizes', 'linhaFases',
    'conicidadeVsCilindrico'
  ].forEach(function (nome) {
    assert.ok(typeof Bonsai.svg[nome] === 'function', 'Bonsai.svg.' + nome + ' existe');
  });
});

assert.grupo('svg - conteúdo de cada diagrama tem rótulos PT-BR esperados', function () {
  var cinco = Bonsai.svg.cincoPartes();
  ['nebari', 'coni', 'tronco', 'ramifica', 'copa'].forEach(function (pedaco) {
    assert.ok(cinco.toLowerCase().indexOf(pedaco) !== -1, 'cincoPartes menciona "' + pedaco + '"');
  });

  var corte = Bonsai.svg.corteCerto();
  ['toco', 'rente'].forEach(function (palavra) {
    assert.ok(corte.toLowerCase().indexOf(palavra) !== -1, 'corteCerto menciona "' + palavra + '"');
  });

  var clip = Bonsai.svg.clipAndGrow();
  assert.ok(/2/.test(clip), 'clipAndGrow menciona o corte para 2 gemas/folhas');

  var angulo = Bonsai.svg.anguloArame();
  assert.ok(/45/.test(angulo), 'anguloArame marca o ângulo de 45°');

  var raizes = Bonsai.svg.raizes();
  ['pivotante', 'radial'].forEach(function (palavra) {
    assert.ok(raizes.toLowerCase().indexOf(palavra) !== -1, 'raizes menciona "' + palavra + '"');
  });

  var fases = Bonsai.svg.linhaFases();
  ['engorda', 'decepe', 'estrutura', 'refino'].forEach(function (palavra) {
    assert.ok(fases.toLowerCase().indexOf(palavra) !== -1, 'linhaFases menciona "' + palavra + '"');
  });

  var trocos = Bonsai.svg.conicidadeVsCilindrico();
  ['cônic', 'cilín'].forEach(function (pedaco) {
    assert.ok(trocos.toLowerCase().indexOf(pedaco) !== -1, 'conicidadeVsCilindrico menciona "' + pedaco + '"');
  });
});

assert.grupo('svg - nenhum diagrama lança exceção nem usa aleatoriedade perceptível', function () {
  // Chama cada função três vezes e compara todas — se houvesse
  // Math.random() ou timestamp, ao menos uma das três divergiria.
  Bonsai.svg.LISTA.forEach(function (d) {
    var a = Bonsai.svg[d.fn]();
    var b = Bonsai.svg[d.fn]();
    var c = Bonsai.svg[d.fn]();
    assert.eq(a, b, d.id + ' 1ª e 2ª chamada iguais');
    assert.eq(b, c, d.id + ' 2ª e 3ª chamada iguais');
  });
});
