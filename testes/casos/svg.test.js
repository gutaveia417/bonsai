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

// ===========================================================================
// R24 — heurística de layout (fix round 1). A suíte acima só verifica
// estrutura (viewBox, <title>, paleta, determinismo) — nenhuma dessas
// asserções pega texto cortado na borda ou rótulos empilhados uns sobre os
// outros, e foi exatamente essa a classe de defeito encontrada ao renderizar
// os sete diagramas de verdade num navegador.
//
// A técnica: estimar a caixa ocupada por cada <text>/<tspan> a partir do
// font-size e do text-anchor (sem precisar de DOM nem de medir glifo de
// verdade). Depois:
//   1. nenhuma caixa pode passar da borda do viewBox (com folga de margem);
//   2. dentro do mesmo diagrama, nenhuma caixa pode cruzar outra.
//
// Fix round 3: a versão original usava uma média única de 0,6 × font-size
// por caractere — boa para texto minúsculo comum, mas otimista para
// maiúsculas (um "M" ocupa perto de 0,9 do tamanho da fonte, não 0,6) e
// para os rótulos deste projeto especificamente, que têm cabeçalhos em
// Caixa Alta Inicial e acentuação portuguesa pesada ("Conicidade ×
// cilíndrico", "ângulo íngreme"). Uma média única subestima exatamente os
// rótulos mais largos — os que estouram. Agora a largura é somada
// caractere a caractere, classificando por categoria Unicode (não por
// `.toUpperCase() === char`, que classificaria símbolos sem caixa — como
// "×", "—", "°" — como maiúsculos, porque nesses casos toUpperCase() é
// idempotente):
//   - \p{Lu} (maiúscula, inclusive acentuada: À Â Ã É Í Ó Ô Õ Ú Ç)  → 0,72
//   - \p{Ll} (minúscula, inclusive acentuada)                        → 0,60
//   - \p{Nd} (dígito)                                                → 0,50
//   - espaço em branco                                               → 0,28
//   - qualquer outro símbolo/pontuação (×, —, °, parênteses, etc.)    → 0,50
// Não é medição real de glifo — é conservadora onde a média antiga era
// otimista, que é a direção que importa para não deixar passar corte de
// texto.
// ===========================================================================
var MARGEM_VIEWBOX = 3;

function larguraCaractere(ch, tamanho) {
  if (/\s/.test(ch)) return tamanho * 0.28;
  if (/\p{Lu}/u.test(ch)) return tamanho * 0.72;
  if (/\p{Ll}/u.test(ch)) return tamanho * 0.60;
  if (/\p{Nd}/u.test(ch)) return tamanho * 0.50;
  return tamanho * 0.50;
}

function larguraTexto(texto, tamanho) {
  var total = 0;
  for (var i = 0; i < texto.length; i++) total += larguraCaractere(texto[i], tamanho);
  return total;
}

function analisarViewBox(svg) {
  var m = svg.match(/viewBox\s*=\s*"([^"]+)"/);
  if (!m) return null;
  var partes = m[1].trim().split(/\s+/).map(Number);
  return { x: partes[0], y: partes[1], largura: partes[2], altura: partes[3] };
}

function atributosDe(strAttrs) {
  var attrs = {};
  var re = /([a-zA-Z_:][\w:-]*)\s*=\s*"([^"]*)"/g;
  var m;
  while ((m = re.exec(strAttrs))) attrs[m[1]] = m[2];
  return attrs;
}

// Remove marcação interna (ex.: <tspan>) para sobrar só o texto visível,
// usado apenas para medir comprimento de caracteres.
function textoVisivel(html) {
  return html.replace(/<[^>]+>/g, '');
}

function caixaDe(x, y, texto, tamanho, anchor) {
  var largura = larguraTexto(texto, tamanho);
  var x0, x1;
  if (anchor === 'middle') { x0 = x - largura / 2; x1 = x + largura / 2; }
  else if (anchor === 'end') { x0 = x - largura; x1 = x; }
  else { x0 = x; x1 = x + largura; }
  // Caixa vertical aproximada em torno da linha de base (y): a maior parte
  // da altura do glifo fica acima dela, com uma pequena descida abaixo.
  var y0 = y - tamanho * 0.8;
  var y1 = y + tamanho * 0.3;
  return { x0: x0, x1: x1, y0: y0, y1: y1, texto: texto };
}

// Devolve uma caixa estimada por <text> (ou por <tspan> com x/y/dy próprio
// dentro dele) de um SVG.
function caixasDeTexto(svg) {
  var caixas = [];
  var reText = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  var mt;
  while ((mt = reText.exec(svg))) {
    var attrsPai = atributosDe(mt[1]);
    var conteudoPai = mt[2];
    var tamanhoPai = parseFloat(attrsPai['font-size'] || '12');
    var anchorPai = attrsPai['text-anchor'] || 'start';
    var xPai = parseFloat(attrsPai.x || '0');
    var yPai = parseFloat(attrsPai.y || '0');

    var reTspan = /<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/g;
    var achouTspan = false;
    var mts;
    while ((mts = reTspan.exec(conteudoPai))) {
      achouTspan = true;
      var attrsFilho = atributosDe(mts[1]);
      var texto = textoVisivel(mts[2]);
      if (!texto.trim()) continue;
      var tamanho = attrsFilho['font-size'] ? parseFloat(attrsFilho['font-size']) : tamanhoPai;
      var anchor = attrsFilho['text-anchor'] || anchorPai;
      var x = attrsFilho.x !== undefined ? parseFloat(attrsFilho.x) : xPai;
      var y = attrsFilho.y !== undefined
        ? parseFloat(attrsFilho.y)
        : yPai + (attrsFilho.dy !== undefined ? parseFloat(attrsFilho.dy) : 0);
      caixas.push(caixaDe(x, y, texto, tamanho, anchor));
    }
    if (!achouTspan) {
      var textoSimples = textoVisivel(conteudoPai);
      if (textoSimples.trim().length > 0) {
        caixas.push(caixaDe(xPai, yPai, textoSimples, tamanhoPai, anchorPai));
      }
    }
  }
  return caixas;
}

function seSobrepoe(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

// ---------------------------------------------------------------------
// Fix round 3 — confirma que a classificação por categoria Unicode trata
// maiúsculas acentuadas como maiúsculas (não como "sem classificação" nem
// como símbolo), e que símbolos sem caixa (que um `.toUpperCase() ===
// caractere` ingênuo classificaria como maiúsculos, por serem idempotentes
// sob toUpperCase) caem na categoria neutra em vez de inflar a largura.
// ---------------------------------------------------------------------
function quaseIgual(a, b) {
  return Math.abs(a - b) < 1e-9;
}

assert.grupo('svg - R24: classificação de largura por caractere', function () {
  var maiusculasAcentuadas = ['À', 'Â', 'Ã', 'É', 'Í', 'Ó', 'Ô', 'Õ', 'Ú', 'Ç'];
  maiusculasAcentuadas.forEach(function (c) {
    assert.ok(quaseIgual(larguraCaractere(c, 10), 7.2), 'maiúscula acentuada "' + c + '" pesa 0,72 × tamanho');
  });

  var minusculasAcentuadas = ['à', 'â', 'ã', 'é', 'í', 'ó', 'ô', 'õ', 'ú', 'ç'];
  minusculasAcentuadas.forEach(function (c) {
    assert.ok(quaseIgual(larguraCaractere(c, 10), 6.0), 'minúscula acentuada "' + c + '" pesa 0,60 × tamanho');
  });

  // Símbolos sem distinção de caixa: toUpperCase() é idempotente neles, um
  // classificador ingênuo (`c.toUpperCase() === c`) os confundiria com
  // maiúsculas. \p{Lu} corretamente não os reconhece como letra maiúscula.
  ['×', '—', '°', '(', ')', ':', ',', '→'].forEach(function (c) {
    assert.ok(quaseIgual(larguraCaractere(c, 10), 5.0), 'símbolo "' + c + '" não é tratado como maiúscula (pesa 0,50 × tamanho)');
  });

  assert.ok(quaseIgual(larguraCaractere('9', 10), 5.0), 'dígito pesa 0,50 × tamanho');
  assert.ok(quaseIgual(larguraCaractere(' ', 10), 2.8), 'espaço pesa 0,28 × tamanho');

  // Um rótulo em Caixa Alta Inicial mistura categorias — a soma por
  // caractere precisa bater com a soma manual, não com length × constante.
  var esperado = 10 * 0.72 + 10 * 0.60 * 3 + 10 * 0.28; // 'P' + 'ivo' + espaço
  assert.ok(quaseIgual(larguraTexto('Pivo ', 10), esperado), 'largura de string mista é a soma por caractere');
});

assert.grupo('svg - R24: nenhum rótulo estoura o viewBox', function () {
  Bonsai.svg.LISTA.forEach(function (d) {
    var s = Bonsai.svg[d.fn]();
    var vb = analisarViewBox(s);
    assert.ok(vb, d.id + ' tem viewBox parseável');
    if (!vb) return;

    var minX = vb.x - MARGEM_VIEWBOX;
    var maxX = vb.x + vb.largura + MARGEM_VIEWBOX;

    caixasDeTexto(s).forEach(function (c) {
      assert.ok(c.x0 >= minX,
        d.id + ': rótulo "' + c.texto + '" estoura a borda esquerda (x0≈' + c.x0.toFixed(1) + ', viewBox começa em ' + vb.x + ')');
      assert.ok(c.x1 <= maxX,
        d.id + ': rótulo "' + c.texto + '" estoura a borda direita (x1≈' + c.x1.toFixed(1) + ', viewBox termina em ' + (vb.x + vb.largura) + ')');
    });
  });
});

assert.grupo('svg - R24: nenhum rótulo se sobrepõe a outro do mesmo diagrama', function () {
  Bonsai.svg.LISTA.forEach(function (d) {
    var s = Bonsai.svg[d.fn]();
    var caixas = caixasDeTexto(s);
    for (var i = 0; i < caixas.length; i++) {
      for (var j = i + 1; j < caixas.length; j++) {
        assert.eq(seSobrepoe(caixas[i], caixas[j]), false,
          d.id + ': rótulos se sobrepõem — "' + caixas[i].texto + '" × "' + caixas[j].texto + '"');
      }
    }
  });
});
