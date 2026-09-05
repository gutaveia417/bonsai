var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.grafico = (function () {

  // ---------------------------------------------------------------------
  // CONTEXTO invariante 1 / spec seção 6: o tronco da Jabuticaba nunca foi
  // medido — o dono estimou ~2,5 cm por foto, e essa estimativa fica de
  // fora dos dados de propósito. Então o estado vazio (zero `medicao`) é o
  // caso NORMAL deste gráfico, não uma borda: hoje as sete árvores do seed
  // têm zero medições, e quatro delas (Primavera, Serissa, Azaleia, três
  // Ficus) também têm `gatilhoFase: null`. Nenhum dos dois casos pode virar
  // um número inventado — nem um alvo default, nem uma barra de progresso
  // em 0%, que seria uma afirmação de que o tronco mede zero.
  // ---------------------------------------------------------------------

  var LARGURA = 320;
  var ALTURA = 180;

  // Área de desenho dentro do viewBox, com margem para rótulos de eixo.
  var X0 = 34;
  var X1 = LARGURA - 12;
  var Y0 = 14;               // topo da área (maior valor do eixo)
  var Y1 = ALTURA - 28;      // base da área (zero do eixo)

  function escapar(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function arredondar(n) {
    return Math.round(n * 10) / 10;
  }

  // `medicoes` chega em ordem qualquer (contrato da interface) — quem
  // ordena por `data` é este módulo, nunca quem chama.
  function ordenarPorData(medicoes) {
    return medicoes.slice().sort(function (a, b) {
      if (a.data < b.data) return -1;
      if (a.data > b.data) return 1;
      return 0;
    });
  }

  // ---------------------------------------------------------------------
  // Estado vazio — spec seção 6: "Sem medições ainda" + alvo + método
  // citado ao pé da letra (nunca parafraseado: o método é o que ensina o
  // dono, que tem fita métrica e não paquímetro, a dividir a circunferência
  // por 3,1416). Sem gatilho (`gatilhoFase: null`), não existe alvo a
  // mostrar — o texto diz isso em vez de inventar um número.
  // ---------------------------------------------------------------------
  function estadoVazio(gatilho) {
    var partes = [];
    partes.push('<div class="grafico-tronco grafico-tronco--vazio" role="img" ' +
      'aria-label="Gráfico de diâmetro do tronco, sem medições registradas">');
    partes.push('<p class="grafico-tronco__rotulo"><strong>Sem medições ainda</strong></p>');

    if (gatilho && typeof gatilho.alvoMm === 'number') {
      partes.push('<p class="grafico-tronco__alvo">Alvo para o decepe: ' +
        escapar(gatilho.alvoMm) + ' mm de diâmetro.</p>');
      partes.push('<p class="grafico-tronco__metodo">Método: ' + escapar(gatilho.metodo) + '</p>');
    } else {
      partes.push('<p class="grafico-tronco__alvo">Nenhum alvo de diâmetro definido para esta árvore ainda.</p>');
    }

    partes.push('</div>');
    return partes.join('');
  }

  // ---------------------------------------------------------------------
  // Gráfico com medições — spec seção 6 / brief da tarefa 7.
  //   - 1 medição: só o ponto. Uma linha entre um ponto e o nada seria uma
  //     tendência inventada, então nunca desenhamos <polyline> com um só
  //     ponto.
  //   - 2+ medições: polyline ligando os pontos.
  //   - gatilho presente: linha tracejada horizontal no alvo, rotulada com
  //     o valor — tracejada e rotulada porque o gráfico imprime em
  //     escala de cinza e a cor sozinha nunca pode carregar o significado.
  //   - gatilho null: sem linha de alvo, sem inventar um valor.
  // ---------------------------------------------------------------------
  function desenhar(medicoes, gatilho) {
    var ordenadas = ordenarPorData(medicoes);
    var inicio = ordenadas[0].data;
    var fim = ordenadas[ordenadas.length - 1].data;
    var totalDias = Bonsai.datas.diasEntre(inicio, fim);

    var valores = ordenadas.map(function (m) { return m.dados.diametroMm; });
    var maiorMedicao = Math.max.apply(null, valores);

    var alvoMm = (gatilho && typeof gatilho.alvoMm === 'number') ? gatilho.alvoMm : null;
    var maiorReferencia = alvoMm !== null ? Math.max(maiorMedicao, alvoMm) : maiorMedicao;

    // Folga de 10% no eixo Y para o ponto/linha mais alto não colar no
    // topo do gráfico.
    var maxEixo = maiorReferencia * 1.1;
    if (!(maxEixo > 0)) maxEixo = 10; // guarda contra medição(ões) em 0mm

    function escalaX(dataIso) {
      if (totalDias <= 0) return (X0 + X1) / 2; // uma só medição: centraliza
      var dias = Bonsai.datas.diasEntre(inicio, dataIso);
      var t = dias / totalDias;
      return X0 + t * (X1 - X0);
    }

    function escalaY(valorMm) {
      var t = valorMm / maxEixo;
      return Y1 - t * (Y1 - Y0);
    }

    var pontos = ordenadas.map(function (m) {
      return {
        x: escalaX(m.data),
        y: escalaY(m.dados.diametroMm),
        data: m.data,
        valor: m.dados.diametroMm
      };
    });

    var partes = [];
    // Sem `width`/`height` fixos: o viewBox define a proporção e quem
    // decide o tamanho na tela é o CSS de quem incorpora este SVG — nunca
    // `preserveAspectRatio="none"`, que distorceria o texto dos rótulos.
    partes.push('<svg viewBox="0 0 ' + LARGURA + ' ' + ALTURA + '" xmlns="http://www.w3.org/2000/svg" ' +
      'role="img" aria-label="Gráfico de diâmetro do tronco ao longo do tempo" ' +
      'class="grafico-tronco">');
    partes.push('<title>Diâmetro do tronco ao longo do tempo, em milímetros</title>');

    // Linha de base (zero do eixo) — referência neutra, sempre presente.
    partes.push('<line x1="' + X0 + '" y1="' + Y1 + '" x2="' + X1 + '" y2="' + Y1 +
      '" stroke="#999" stroke-width="1" />');

    // Linha do alvo — tracejada e rotulada (nunca só por cor: imprime em
    // escala de cinza).
    if (alvoMm !== null) {
      var yAlvo = arredondar(escalaY(alvoMm));
      partes.push('<line x1="' + X0 + '" y1="' + yAlvo + '" x2="' + X1 + '" y2="' + yAlvo +
        '" stroke="#333" stroke-width="1.5" stroke-dasharray="4 3" />');
      partes.push('<text x="' + X1 + '" y="' + arredondar(yAlvo - 4) +
        '" font-size="9" text-anchor="end" fill="#333">alvo ' + escapar(alvoMm) + ' mm</text>');
    }

    // Liga os pontos só a partir de duas medições — uma linha com um único
    // ponto seria uma tendência inventada.
    if (pontos.length >= 2) {
      var atributoPontos = pontos.map(function (p) {
        return arredondar(p.x) + ',' + arredondar(p.y);
      }).join(' ');
      partes.push('<polyline points="' + atributoPontos + '" fill="none" stroke="#000" stroke-width="2" />');
    }

    pontos.forEach(function (p) {
      partes.push('<circle cx="' + arredondar(p.x) + '" cy="' + arredondar(p.y) + '" r="3" fill="#000" />');
    });

    // Rótulos de data: primeira e última medição, para orientar o eixo X
    // sem precisar de grade completa numa tela pequena.
    var primeiro = pontos[0];
    var ultimo = pontos[pontos.length - 1];
    partes.push('<text x="' + arredondar(primeiro.x) + '" y="' + (ALTURA - 8) +
      '" font-size="8" text-anchor="middle" fill="#333">' +
      escapar(Bonsai.datas.formatarBR(primeiro.data)) + '</text>');
    if (pontos.length >= 2) {
      partes.push('<text x="' + arredondar(ultimo.x) + '" y="' + (ALTURA - 8) +
        '" font-size="8" text-anchor="middle" fill="#333">' +
        escapar(Bonsai.datas.formatarBR(ultimo.data)) + '</text>');
    }

    partes.push('</svg>');
    return partes.join('');
  }

  function tronco(medicoes, gatilho) {
    var lista = medicoes || [];
    if (lista.length === 0) return estadoVazio(gatilho);
    return desenhar(lista, gatilho);
  }

  return {
    tronco: tronco
  };

})();
