var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

// ---------------------------------------------------------------------
// Bonsai.svg — Task 12: diagramas desenhados à mão (nunca foto embutida),
// para os pontos onde uma fotografia mostra UMA árvore mas não A IDEIA:
// geometria (onde cortar, que ângulo) e sequência (o que vem depois do quê).
//
// CONTEXTO.md invariante 2: nos slots técnicos, IA é proibida e ordem é
// foto livre → diagrama SVG → pendente. Os diagramas daqui cobrem, além
// dos seis pedidos pelo dono, o slot "tronco-cilíndrico" de
// assets/fotos/creditos.json (origem: "svg", svgFn: "conicidadeVsCilindrico"),
// que existe porque não há foto livre para esse par lado a lado.
//
// Regra dura, porque isto imprime em P&B numa folha A4 e é lido no
// celular: nenhum significado pode depender de cor. Só preto, branco e
// cinza — e cada diagrama carrega os rótulos dentro de si, em PT-BR, com
// linha de indicação até o ponto exato (nunca uma legenda solta embaixo).
// ---------------------------------------------------------------------
Bonsai.svg = (function () {

  // Mesmo escape de js/grafico.js — nenhum texto entra na marcação sem
  // passar por aqui, mesmo quando (como aqui) o texto é sempre um literal
  // do próprio módulo, nunca dado do usuário.
  function escapar(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function abrirSvg(viewBox, titulo) {
    return '<svg viewBox="' + viewBox + '" xmlns="http://www.w3.org/2000/svg" ' +
      'role="img" aria-label="' + escapar(titulo) + '">' +
      '<title>' + escapar(titulo) + '</title>';
  }

  function texto(x, y, conteudo, opts) {
    opts = opts || {};
    var ancora = opts.ancora || 'start';
    var tamanho = opts.tamanho || 12;
    var extra = '';
    if (opts.negrito) extra += ' font-weight="bold"';
    if (opts.italico) extra += ' font-style="italic"';
    return '<text x="' + x + '" y="' + y + '" font-size="' + tamanho +
      '" text-anchor="' + ancora + '" fill="#000"' + extra + '>' +
      escapar(conteudo) + '</text>';
  }

  function linha(x1, y1, x2, y2, opts) {
    opts = opts || {};
    var largura = opts.largura !== undefined ? opts.largura : 1.5;
    var cor = opts.cor || '#000';
    var tracejado = opts.tracejado ? ' stroke-dasharray="' + opts.tracejado + '"' : '';
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + cor + '" stroke-width="' + largura + '"' + tracejado +
      ' stroke-linecap="round" />';
  }

  function caminho(d, opts) {
    opts = opts || {};
    var fill = opts.fill || 'none';
    var cor = opts.cor || '#000';
    var largura = opts.largura !== undefined ? opts.largura : 1.5;
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + cor +
      '" stroke-width="' + largura + '" stroke-linecap="round" stroke-linejoin="round" />';
  }

  function circulo(cx, cy, r, opts) {
    opts = opts || {};
    var fill = opts.fill !== undefined ? opts.fill : 'none';
    var cor = opts.cor || '#000';
    var largura = opts.largura !== undefined ? opts.largura : 1.5;
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill +
      '" stroke="' + cor + '" stroke-width="' + largura + '" />';
  }

  function poligono(pontos, opts) {
    opts = opts || {};
    var fill = opts.fill || 'none';
    var cor = opts.cor || '#000';
    var largura = opts.largura !== undefined ? opts.largura : 1.5;
    return '<polygon points="' + pontos + '" fill="' + fill + '" stroke="' + cor +
      '" stroke-width="' + largura + '" stroke-linejoin="round" />';
  }

  // Linha fina de indicação terminando num ponto preto — "olhe aqui".
  function apontar(x1, y1, x2, y2) {
    return linha(x1, y1, x2, y2, { largura: 1 }) + circulo(x2, y2, 2.2, { fill: '#000', largura: 0 });
  }

  function cabecalho(centroX, texto1) {
    return texto(centroX, 20, texto1, { ancora: 'middle', tamanho: 13, negrito: true });
  }

  // -----------------------------------------------------------------
  // 1. cincoPartes — as cinco partes julgadas, rotuladas sobre o desenho.
  // -----------------------------------------------------------------
  function cincoPartes() {
    var p = [];
    p.push(abrirSvg('0 0 360 340', 'As cinco partes de um bonsai: nebari, conicidade, tronco, ramificação e copa'));
    p.push(cabecalho(180, 'As cinco partes julgadas'));

    // Vaso (contexto) e linha do substrato.
    p.push(poligono('100,300 220,300 233,330 87,330', { cor: '#000', largura: 1.5 }));
    p.push(linha(88, 300, 232, 300, { largura: 1.5 }));

    // Nebari — raízes espalhando na superfície, saindo da base do tronco.
    p.push(caminho('M170,298 Q142,292 100,300', { largura: 2 }));
    p.push(caminho('M170,298 Q152,296 130,304', { largura: 2 }));
    p.push(caminho('M170,298 Q188,296 210,304', { largura: 2 }));
    p.push(caminho('M170,298 Q198,292 240,300', { largura: 2 }));

    // Tronco — trapézio: largo embaixo, fino em cima. Essa própria forma
    // É a conicidade; o rótulo "conicidade" aponta para a lateral dele.
    p.push(poligono('155,300 185,300 174,160 166,160', { fill: '#fff', cor: '#000', largura: 2 }));

    // Ramificação — galho que se divide, e cada parte se divide de novo.
    p.push(linha(174, 195, 228, 166, { largura: 2 }));
    p.push(linha(228, 166, 248, 152, { largura: 1.4 }));
    p.push(linha(228, 166, 240, 180, { largura: 1.4 }));
    p.push(linha(166, 208, 112, 180, { largura: 2 }));
    p.push(linha(112, 180, 92, 168, { largura: 1.4 }));
    p.push(linha(112, 180, 98, 196, { largura: 1.4 }));

    // Copa — massa de folhagem, só contorno (sem depender de cor).
    p.push(circulo(150, 120, 32, { fill: '#fff' }));
    p.push(circulo(188, 110, 29, { fill: '#fff' }));
    p.push(circulo(166, 88, 27, { fill: '#fff' }));
    p.push(circulo(210, 134, 22, { fill: '#fff' }));
    p.push(circulo(122, 140, 20, { fill: '#fff' }));

    // Rótulos com linha de indicação até o ponto exato.
    p.push(apontar(46, 316, 132, 302));
    p.push(texto(20, 316, 'nebari', { tamanho: 13, negrito: true }));

    p.push(apontar(300, 266, 178, 262));
    p.push(texto(304, 270, 'tronco', { tamanho: 13, negrito: true }));

    p.push(apontar(300, 205, 184, 220));
    p.push(texto(304, 209, 'conicidade', { tamanho: 13, negrito: true }));
    p.push(texto(304, 224, '(base larga → topo fino)', { tamanho: 9 }));

    p.push(apontar(272, 118, 234, 168));
    p.push(texto(276, 122, 'ramificação', { tamanho: 13, negrito: true }));

    p.push(apontar(40, 66, 140, 108));
    p.push(texto(14, 66, 'copa', { tamanho: 13, negrito: true }));

    p.push('</svg>');
    return p.join('');
  }

  // -----------------------------------------------------------------
  // 2. corteCerto — três cortes do mesmo galho e o que cada um vira.
  // -----------------------------------------------------------------
  function corteCerto() {
    var p = [];
    p.push(abrirSvg('0 0 480 260', 'Três jeitos de cortar um galho: corte certo, deixando toco, e rente demais'));
    p.push(cabecalho(240, 'O mesmo galho, cortado de três jeitos'));

    var colunas = [
      { x: 80, titulo: 'certo' },
      { x: 240, titulo: 'deixa toco' },
      { x: 400, titulo: 'rente demais' }
    ];
    colunas.forEach(function (col) {
      p.push(texto(col.x, 240, col.titulo, { ancora: 'middle', tamanho: 12, negrito: true }));
    });

    // Coluna 1 — corte certo: rente à crista do colar, ângulo leve.
    // Colar do galho (o inchaço onde o galho encontra o tronco).
    var x1 = 80;
    p.push(linha(x1, 36, x1, 200, { largura: 14 })); // tronco
    p.push(circulo(x1 + 7, 108, 11, { fill: '#fff', largura: 1.6 })); // colar
    p.push(linha(x1 + 17, 100, x1 + 9, 118, { largura: 2.4 })); // corte em ângulo, rente à crista
    p.push(texto(x1 + 24, 105, 'colar', { tamanho: 9 }));
    p.push(apontar(x1 - 30, 80, x1 + 12, 100));
    p.push(texto(x1 - 66, 84, 'corta rente à crista,', { tamanho: 9 }));
    p.push(texto(x1 - 66, 95, 'ângulo leve', { tamanho: 9 }));
    // Resultado: cicatriza — anel fechado.
    p.push(circulo(x1 + 7, 165, 9, { largura: 1.6, tracejado: '2 2' }));
    p.push(texto(x1 + 28, 168, 'fecha com casca nova', { tamanho: 9 }));

    // Coluna 2 — deixa toco: sobra um pedaço de galho morto além do colar.
    var x2 = 240;
    p.push(linha(x2, 36, x2, 200, { largura: 14 }));
    p.push(circulo(x2 + 7, 108, 11, { fill: '#fff', largura: 1.6 })); // colar
    p.push(linha(x2 + 12, 106, x2 + 46, 100, { largura: 8 })); // toco sobrando
    p.push(linha(x2 + 46, 92, x2 + 46, 108, { largura: 2.4 })); // corte reto na ponta do toco
    p.push(texto(x2 + 30, 88, 'toco', { tamanho: 9 }));
    p.push(apontar(x2 + 90, 70, x2 + 47, 96));
    p.push(texto(x2 + 60, 60, 'sobra grossa,', { tamanho: 9 }));
    p.push(texto(x2 + 60, 71, 'colar não fecha', { tamanho: 9 }));
    // Resultado: toco apodrece por dentro — rabiscos internos (oco/podre).
    p.push(circulo(x2 + 46, 160, 10, { largura: 1.6 }));
    p.push(caminho('M' + (x2 + 40) + ',154 l5,5 l-5,5 l5,5 l5,-5 l-5,-5 l5,-5', { largura: 1 }));
    p.push(texto(x2 + 62, 164, 'apodrece por dentro', { tamanho: 9 }));

    // Coluna 3 — rente demais: o corte entra no próprio tronco.
    var x3 = 400;
    p.push(linha(x3, 36, x3, 200, { largura: 14 }));
    // Corte côncavo que morde o tronco (sem sobrar colar nenhum).
    p.push(caminho('M' + (x3 - 8) + ',96 Q' + (x3 + 10) + ',110 ' + (x3 - 8) + ',122', { largura: 2.4 }));
    p.push(apontar(x3 - 70, 90, x3 - 9, 108));
    p.push(texto(x3 - 96, 74, 'corta a crista', { tamanho: 9 }));
    p.push(texto(x3 - 96, 85, 'do colar', { tamanho: 9 }));
    // Resultado: ferida aberta, oval, maior que o galho — não fecha.
    p.push(circulo(x3 - 4, 162, 13, { largura: 1.6 }));
    p.push(circulo(x3 - 4, 162, 6, { largura: 1, tracejado: '1 2' }));
    p.push(texto(x3 + 18, 166, 'ferida não fecha', { tamanho: 9 }));

    p.push('</svg>');
    return p.join('');
  }

  // -----------------------------------------------------------------
  // 3. clipAndGrow — corre até 5–6 folhas, corta para 2, brotam dois.
  // -----------------------------------------------------------------
  function clipAndGrow() {
    var p = [];
    p.push(abrirSvg('0 0 480 220', 'Clip-and-grow em três passos: deixa correr, corta para duas gemas, brotam dois ramos'));
    p.push(cabecalho(240, 'Clip-and-grow: um ramo vira dois'));

    function folha(x, y, angulo) {
      // Pequena elipse inclinada representando uma folha/gema ao longo do galho.
      return '<ellipse cx="' + x + '" cy="' + y + '" rx="7" ry="3" fill="#fff" stroke="#000" ' +
        'stroke-width="1.3" transform="rotate(' + angulo + ' ' + x + ' ' + y + ')" />';
    }

    // Painel 1 — brota até 5–6 folhas.
    p.push(linha(40, 170, 140, 90, { largura: 3 }));
    var pontos1 = [[55, 156], [70, 142], [85, 128], [100, 114], [115, 100], [128, 92]];
    pontos1.forEach(function (pt, i) { p.push(folha(pt[0], pt[1], i % 2 ? 30 : -30)); });
    p.push(texto(90, 195, 'brota até 5–6 folhas', { ancora: 'middle', tamanho: 11 }));

    p.push(texto(168, 130, '→', { ancora: 'middle', tamanho: 22 }));

    // Painel 2 — corta para 2: mantém as duas primeiras, remove o resto
    // (o restante do galho aparece tracejado, como "removido").
    p.push(linha(200, 170, 244, 132, { largura: 3 }));
    p.push(linha(244, 132, 300, 90, { largura: 3, tracejado: '4 3', cor: '#666' }));
    var pontosMantidas = [[215, 156], [230, 142]];
    pontosMantidas.forEach(function (pt, i) { p.push(folha(pt[0], pt[1], i % 2 ? 30 : -30)); });
    p.push(circulo(244, 132, 4.5, { fill: '#000', largura: 0 }));
    p.push(apontar(300, 60, 246, 128));
    p.push(texto(305, 55, 'corte logo', { tamanho: 9 }));
    p.push(texto(305, 66, 'acima da 2ª gema', { tamanho: 9 }));
    p.push(texto(250, 195, 'corta para 2 gemas', { ancora: 'middle', tamanho: 11 }));

    p.push(texto(338, 130, '→', { ancora: 'middle', tamanho: 22 }));

    // Painel 3 — as duas gemas cortadas brotam dois ramos novos (bifurca).
    p.push(linha(370, 170, 404, 138, { largura: 3 }));
    p.push(linha(404, 138, 380, 96, { largura: 2.2 }));
    p.push(linha(404, 138, 434, 100, { largura: 2.2 }));
    p.push(folha(378, 86, -20));
    p.push(folha(390, 80, -40));
    p.push(folha(438, 92, 30));
    p.push(folha(448, 82, 50));
    p.push(circulo(404, 138, 3, { fill: '#000', largura: 0 }));
    p.push(texto(404, 195, 'brotam dois ramos novos', { ancora: 'middle', tamanho: 11 }));

    p.push(texto(240, 40, 'a grossura vem do corte, não de deixar crescer', { ancora: 'middle', tamanho: 10, italico: true }));

    p.push('</svg>');
    return p.join('');
  }

  // -----------------------------------------------------------------
  // 4. anguloArame — mesmo galho, arame em 45° / solto / apertado.
  // -----------------------------------------------------------------
  function anguloArame() {
    var p = [];
    p.push(abrirSvg('0 0 480 240', 'O mesmo galho aramado de três jeitos: 45° correto, solto demais e apertado demais'));
    p.push(cabecalho(240, 'Ângulo do arame no galho'));

    // Volta de arame como um pequeno traço cruzando o galho num ângulo dado.
    function volta(cx, cy, comprimento, anguloGraus) {
      var rad = anguloGraus * Math.PI / 180;
      var dx = Math.cos(rad) * comprimento / 2;
      var dy = Math.sin(rad) * comprimento / 2;
      return linha(cx - dx, cy - dy, cx + dx, cy + dy, { largura: 2 });
    }

    function galho(x, y1, y2) {
      return linha(x, y1, x, y2, { largura: 6 });
    }

    // Painel 1 — correto: ~45°, espaçamento regular.
    var x1 = 90;
    p.push(galho(x1, 190, 50));
    for (var i = 0; i < 6; i++) p.push(volta(x1, 180 - i * 24, 26, 45));
    // Marca o ângulo de 45° explicitamente com um arco e o rótulo.
    p.push(caminho('M' + (x1) + ',132 L' + (x1 + 18) + ',132 A18,18 0 0 0 ' + (x1 + 4.7) + ',120.7', { largura: 1 }));
    p.push(texto(x1 + 24, 128, '45°', { tamanho: 11, negrito: true }));
    p.push(texto(x1, 218, 'certo', { ancora: 'middle', tamanho: 12, negrito: true }));
    p.push(texto(x1, 232, 'espaçamento regular', { ancora: 'middle', tamanho: 9 }));

    // Painel 2 — solto: ângulo raso, voltas mal espaçadas, não segura.
    var x2 = 240;
    p.push(galho(x2, 190, 50));
    var posY = [178, 150, 118, 92];
    posY.forEach(function (y) { p.push(volta(x2, y, 30, 20)); });
    p.push(apontar(x2 + 70, 70, x2 + 14, 110));
    p.push(texto(x2 + 30, 62, 'ângulo raso —', { tamanho: 9 }));
    p.push(texto(x2 + 30, 73, 'não segura curva', { tamanho: 9 }));
    p.push(texto(x2, 218, 'solto demais', { ancora: 'middle', tamanho: 12, negrito: true }));
    p.push(texto(x2, 232, 'espaço irregular, folga', { ancora: 'middle', tamanho: 9 }));

    // Painel 3 — apertado: ângulo íngreme, voltas muito juntas, morde.
    var x3 = 390;
    p.push(galho(x3, 190, 50));
    for (var j = 0; j < 9; j++) p.push(volta(x3, 182 - j * 15, 22, 70));
    // Marcas de "morde" — pequenos entalhes onde o arame aperta a casca.
    [70, 100, 130, 160].forEach(function (y) {
      p.push(linha(x3 - 3, y, x3 + 3, y, { largura: 1, cor: '#000' }));
    });
    p.push(apontar(x3 + 70, 55, x3 + 6, 90));
    p.push(texto(x3 + 30, 47, 'ângulo íngreme —', { tamanho: 9 }));
    p.push(texto(x3 + 30, 58, 'morde a casca', { tamanho: 9 }));
    p.push(texto(x3, 218, 'apertado demais', { ancora: 'middle', tamanho: 12, negrito: true }));
    p.push(texto(x3, 232, 'voltas coladas, aperta', { ancora: 'middle', tamanho: 9 }));

    p.push('</svg>');
    return p.join('');
  }

  // -----------------------------------------------------------------
  // 5. raizes — pivotante (mergulha) vs. radial (espalhada), com o
  // corte que o primeiro transplante faz na pivotante.
  // -----------------------------------------------------------------
  function raizes() {
    var p = [];
    p.push(abrirSvg('0 0 400 260', 'Raiz pivotante mergulhando fundo, ao lado de raiz radial espalhada, com o corte do primeiro transplante'));
    p.push(cabecalho(200, 'Pivotante × radial'));

    // Linha do substrato.
    p.push(linha(20, 90, 380, 90, { largura: 1.2, cor: '#666' }));

    // --- Lado esquerdo: raiz pivotante (mergulha reto para baixo). ---
    p.push(linha(110, 40, 110, 90, { largura: 10 })); // toco de tronco
    p.push(caminho('M110,90 Q104,140 100,190', { largura: 8 })); // raiz mergulhando
    // Corte no transplante — marca em zigue-zague atravessando a raiz.
    p.push(caminho('M92,150 l8,6 l8,-6 l8,6', { largura: 2 }));
    p.push(apontar(30, 175, 96, 152));
    p.push(texto(10, 178, 'corte do', { tamanho: 9 }));
    p.push(texto(10, 189, 'transplante', { tamanho: 9 }));
    p.push(texto(100, 232, 'pivotante', { ancora: 'middle', tamanho: 13, negrito: true }));
    p.push(texto(100, 246, '(mergulha fundo, difícil em vaso raso)', { ancora: 'middle', tamanho: 8 }));

    // --- Lado direito: raiz radial (espalha achatada perto da superfície). ---
    p.push(linha(290, 40, 290, 90, { largura: 10 }));
    [[250, 108], [265, 104], [290, 100], [315, 104], [330, 108]].forEach(function (pt) {
      p.push(caminho('M290,90 Q' + ((290 + pt[0]) / 2) + ',92 ' + pt[0] + ',' + pt[1], { largura: 3.5 }));
    });
    p.push(apontar(290, 60, 290, 92));
    p.push(texto(290, 232, 'radial', { ancora: 'middle', tamanho: 13, negrito: true }));
    p.push(texto(290, 246, '(espalhada e achatada — o nebari que buscamos)', { ancora: 'middle', tamanho: 8 }));

    p.push('</svg>');
    return p.join('');
  }

  // -----------------------------------------------------------------
  // 6. linhaFases — engorda (anos) / decepe (um ponto) / estrutura
  // (2–4 anos) / refino (contínuo), com o gatilho por medida marcado.
  // -----------------------------------------------------------------
  function linhaFases() {
    var p = [];
    p.push(abrirSvg('0 0 480 220', 'Linha do tempo das quatro fases: engorda em anos, decepe num único dia, estrutura em anos, refino contínuo'));
    p.push(cabecalho(240, 'As quatro fases não duram o mesmo tempo'));

    var y = 110;
    // Engorda — segmento longo, seta grossa (anos).
    p.push(linha(30, y, 190, y, { largura: 10 }));
    p.push(poligono('190,' + (y - 9) + ' 190,' + (y + 9) + ' 206,' + y, { fill: '#000' })); // ponta de seta
    p.push(texto(105, y - 18, 'engorda', { ancora: 'middle', tamanho: 12, negrito: true }));
    p.push(texto(105, y + 26, '(anos — deixa engrossar)', { ancora: 'middle', tamanho: 9 }));

    // Decepe — um único ponto no tempo (um dia), não um segmento.
    var xDecepe = 206;
    p.push(circulo(xDecepe, y, 6, { fill: '#000', largura: 0 }));
    p.push(texto(xDecepe, y - 18, 'decepe', { ancora: 'middle', tamanho: 12, negrito: true }));
    p.push(texto(xDecepe, y + 26, '(um dia só)', { ancora: 'middle', tamanho: 9 }));
    p.push(apontar(xDecepe, y + 50, xDecepe, y + 10));
    p.push(texto(xDecepe, y + 62, 'gatilho: tronco atinge a', { ancora: 'middle', tamanho: 8 }));
    p.push(texto(xDecepe, y + 72, 'medida-alvo — não o calendário', { ancora: 'middle', tamanho: 8 }));

    // Estrutura — segmento médio (2–4 anos).
    p.push(linha(222, y, 320, y, { largura: 8 }));
    p.push(poligono('320,' + (y - 8) + ' 320,' + (y + 8) + ' 334,' + y, { fill: '#000' }));
    p.push(texto(272, y - 18, 'estrutura', { ancora: 'middle', tamanho: 12, negrito: true }));
    p.push(texto(272, y + 26, '(2–4 anos)', { ancora: 'middle', tamanho: 9 }));

    // Refino — contínuo, sem fim: linha que termina em ponta aberta / reticências.
    p.push(linha(350, y, 430, y, { largura: 6 }));
    p.push(circulo(438, y, 2, { fill: '#000', largura: 0 }));
    p.push(circulo(448, y, 2, { fill: '#000', largura: 0 }));
    p.push(circulo(458, y, 2, { fill: '#000', largura: 0 }));
    p.push(texto(400, y - 18, 'refino', { ancora: 'middle', tamanho: 12, negrito: true }));
    p.push(texto(400, y + 26, '(contínuo, sem data para acabar)', { ancora: 'middle', tamanho: 9 }));

    p.push('</svg>');
    return p.join('');
  }

  // -----------------------------------------------------------------
  // 7. conicidadeVsCilindrico — fallback desenhado para o slot
  // "tronco-cilíndrico" (assets/fotos/creditos.json), sem foto livre.
  // -----------------------------------------------------------------
  function conicidadeVsCilindrico() {
    var p = [];
    p.push(abrirSvg('0 0 360 260', 'Tronco cônico, com conicidade, ao lado de um tronco cilíndrico, sem conicidade'));
    p.push(cabecalho(180, 'Conicidade × cilíndrico'));

    // Linha do solo.
    p.push(linha(20, 210, 340, 210, { largura: 1.2, cor: '#666' }));

    // --- Esquerda: tronco cônico (com conicidade). ---
    p.push(poligono('95,210 155,210 138,60 112,60', { fill: '#fff', cor: '#000', largura: 2 }));
    // Réguas de largura no topo e na base, para o contraste ficar explícito.
    p.push(linha(88, 210, 88, 60, { largura: 0.8, cor: '#999', tracejado: '2 2' }));
    p.push(texto(125, 234, 'cônico', { ancora: 'middle', tamanho: 13, negrito: true }));
    p.push(texto(125, 248, '(com conicidade: base larga, topo fino)', { ancora: 'middle', tamanho: 8 }));
    p.push(apontar(60, 200, 100, 205));
    p.push(texto(20, 200, 'largo', { tamanho: 9 }));
    p.push(apontar(60, 70, 118, 64));
    p.push(texto(20, 70, 'fino', { tamanho: 9 }));

    // --- Direita: tronco cilíndrico (sem conicidade, como um poste). ---
    p.push(poligono('215,210 275,210 275,60 215,60', { fill: '#fff', cor: '#000', largura: 2 }));
    p.push(linha(280, 210, 280, 60, { largura: 0.8, cor: '#999', tracejado: '2 2' }));
    p.push(texto(245, 234, 'cilíndrico', { ancora: 'middle', tamanho: 13, negrito: true }));
    p.push(texto(245, 248, '(sem conicidade — mesma grossura do chão à copa)', { ancora: 'middle', tamanho: 8 }));
    p.push(apontar(300, 200, 278, 205));
    p.push(texto(304, 200, 'largo', { tamanho: 9 }));
    p.push(apontar(300, 70, 278, 64));
    p.push(texto(304, 70, 'largo', { tamanho: 9 }));

    p.push('</svg>');
    return p.join('');
  }

  var LISTA = [
    {
      id: 'cinco-partes',
      titulo: 'As cinco partes de um bonsai',
      legenda: 'Olhe onde cada linha aponta: a raiz espalhada na base é o nebari, o formato do próprio tronco — grosso embaixo, fino em cima — já É a conicidade, o corpo entre raiz e galhos é o tronco, o galho que se divide em dois é a ramificação, e a massa de folhas no topo é a copa. São essas cinco coisas que se avalia numa árvore.',
      fn: 'cincoPartes'
    },
    {
      id: 'corte-certo',
      titulo: 'Onde cortar um galho',
      legenda: 'Compare as três pontas: a da esquerda corta bem rente ao colar inchado e some — fecha sozinha com casca nova por cima. A do meio deixa um pedaço de galho morto para trás — ele oca e apodrece por dentro. A da direita corta fundo demais, dentro do próprio tronco — a ferida fica maior que o galho e nunca fecha.',
      fn: 'corteCerto'
    },
    {
      id: 'clip-and-grow',
      titulo: 'Clip-and-grow: um ramo vira dois',
      legenda: 'Siga a seta: o galho corre solto até ter várias folhas, depois é cortado logo acima da segunda gema — não da última. Dessa mesma gema saem dois ramos novos onde antes havia um. A grossura do galho vem desse corte repetido, nunca de deixar crescer sem parar.',
      fn: 'clipAndGrow'
    },
    {
      id: 'angulo-arame',
      titulo: 'O ângulo certo do arame',
      legenda: 'Olhe o ângulo das voltas em relação ao galho, não a quantidade de arame usado: perto de 45°, espaçadas igual, o arame segura a curva sem apertar. Deitado demais, ele fica frouxo e o galho volta sozinho. Em pé demais, as voltas ficam coladas e mordem a casca — é assim que nasce a marca em espiral que não sai mais.',
      fn: 'anguloArame'
    },
    {
      id: 'raizes-pivotante-radial',
      titulo: 'Raiz pivotante e raiz radial',
      legenda: 'Do lado esquerdo, olhe a raiz única mergulhando reto para baixo — é a pivotante que a planta trouxe da semente, e a marca em zigue-zague é onde ela é cortada no primeiro transplante. Do lado direito, olhe as raízes finas se espalhando na horizontal, perto da superfície — é essa forma achatada que vira nebari, e só aparece depois do corte da pivotante.',
      fn: 'raizes'
    },
    {
      id: 'linha-fases',
      titulo: 'As quatro fases não duram o mesmo tempo',
      legenda: 'Compare o tamanho de cada trecho, não só o nome: engorda e estrutura se arrastam por anos, refino não tem fim marcado, e decepe não é um trecho — é um ponto único, um dia. Olhe a nota embaixo do ponto: o que dispara o decepe é o tronco chegar na medida-alvo, nunca uma data marcada no calendário.',
      fn: 'linhaFases'
    },
    {
      id: 'conicidade-vs-cilindrico',
      titulo: 'Tronco cônico e tronco cilíndrico',
      legenda: 'Compare a régua tracejada nas duas pontas de cada tronco: no da esquerda ela encolhe do chão para o topo — isso é conicidade. No da direita ela fica do mesmo tamanho o tempo todo, como um poste. É esse segundo formato que o decepe existe para corrigir, e é o defeito mais comum em planta que cresceu solta.',
      fn: 'conicidadeVsCilindrico'
    }
  ];

  return {
    cincoPartes: cincoPartes,
    corteCerto: corteCerto,
    clipAndGrow: clipAndGrow,
    anguloArame: anguloArame,
    raizes: raizes,
    linhaFases: linhaFases,
    conicidadeVsCilindrico: conicidadeVsCilindrico,
    LISTA: LISTA
  };

})();
