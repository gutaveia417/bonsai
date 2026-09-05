// Testes de Bonsai.grafico — spec seção 6 ("Gráfico de tronco") e CONTEXTO
// invariante 1: o tronco da Jabuticaba nunca foi medido, então o estado
// vazio é o caso normal, não uma borda. Por isso os testes tratam n=0
// medições como o cenário mais testado, não o menos.

function pad2(n) { return (n < 10 ? '0' : '') + n; }

// Gera `n` medições com datas crescentes a partir de 2026-01-01, sem
// depender de nenhuma ordem específica de entrada.
function gerarMedicoes(n, comecarDiametro) {
  var base = comecarDiametro || 20;
  var lista = [];
  for (var i = 0; i < n; i++) {
    lista.push({
      data: Bonsai.datas.somarDias('2026-01-01', i * 3),
      dados: { diametroMm: base + i, alturaDaMedidaCm: 5, metodo: 'fita métrica' }
    });
  }
  return lista;
}

function embaralharParaTrasParaFrente(lista) {
  return lista.slice().reverse();
}

// Depois de remover toda tag bem-formada (<tag ...> ou </tag> ou <tag/>), não
// deve sobrar nenhum '<' ou '>' solto — evidência de que texto interpolado
// (ex.: `metodo` vindo dos dados) foi escapado antes de entrar na marcação,
// em vez de vazar para dentro do SVG e quebrar a estrutura.
function semAngulosSoltos(saida) {
  var semTags = saida.replace(/<\/?[a-zA-Z][a-zA-Z0-9:-]*(\s[^<>]*)?\/?>/g, '');
  return semTags.indexOf('<') === -1 && semTags.indexOf('>') === -1;
}

assert.grupo('grafico', function () {
  var gat = {
    tipo: 'diametro', alvoMm: 80, medidoACm: 5,
    metodo: 'fita métrica em volta a 5 cm do solo, dividir por 3,1416'
  };

  var vazio = Bonsai.grafico.tronco([], gat);
  assert.ok(/Sem medições ainda/.test(vazio), 'estado vazio é explícito');
  assert.ok(/3,1416/.test(vazio), 'estado vazio ensina o método');
  assert.eq(/<polyline/.test(vazio), false, 'estado vazio não desenha linha');
  assert.eq(/%/.test(vazio), false, 'estado vazio não mostra percentual');

  var med = [
    { data: '2026-09-10', dados: { diametroMm: 26 } },
    { data: '2027-03-10', dados: { diametroMm: 34 } }
  ];
  var svg = Bonsai.grafico.tronco(med, gat);
  assert.ok(/<svg/.test(svg), 'com medições, desenha');
  assert.ok(/<polyline/.test(svg), 'liga os pontos');
  assert.ok(/80/.test(svg), 'mostra a linha do alvo');

  var um = Bonsai.grafico.tronco([med[0]], gat);
  assert.ok(/<circle/.test(um), 'uma medição só desenha o ponto');
  assert.eq(/<polyline/.test(um), false, 'uma medição não vira linha');
});

assert.grupo('grafico - estado vazio sem gatilho', function () {
  // Primavera, Serissa, Azaleia e os três Ficus têm gatilhoFase: null hoje.
  // O estado vazio não pode inventar um alvo que não existe nos dados.
  var vazioSemGatilho = Bonsai.grafico.tronco([], null);
  assert.ok(typeof vazioSemGatilho === 'string' && vazioSemGatilho.length > 0, 'string não vazia');
  assert.ok(/Sem medições ainda/.test(vazioSemGatilho), 'ainda diz que não há medição');
  assert.eq(/<polyline/.test(vazioSemGatilho), false, 'sem linha');
  assert.eq(/<circle/.test(vazioSemGatilho), false, 'sem ponto');
  assert.eq(/%/.test(vazioSemGatilho), false, 'sem percentual');
  assert.eq(/80/.test(vazioSemGatilho), false, 'não inventa um alvo de 80mm que não veio de gatilho');
});

assert.grupo('grafico - com medições mas sem gatilho', function () {
  var gatilhoNulo = null;
  var meds = gerarMedicoes(3);
  var saida = Bonsai.grafico.tronco(meds, gatilhoNulo);
  assert.ok(/<svg/.test(saida), 'desenha mesmo sem alvo definido');
  assert.ok(/<polyline/.test(saida), 'liga os pontos mesmo sem alvo');
  assert.eq(/%/.test(saida), false, 'sem percentual');
});

// -------------------------------------------------------------------------
// Loop de invariantes: 0, 1, 2, 5 e 30 medições, cruzado com gatilho
// presente e gatilho null. A saída precisa sempre ser uma string não vazia,
// nunca lançar, e nunca conter '%'.
// -------------------------------------------------------------------------
assert.grupo('grafico - loop de contagens x gatilho', function () {
  var gat = {
    tipo: 'diametro', alvoMm: 80, medidoACm: 5,
    metodo: 'fita métrica em volta a 5 cm do solo, dividir por 3,1416'
  };
  var contagens = [0, 1, 2, 5, 30];
  var gatilhos = [gat, null];

  contagens.forEach(function (n) {
    gatilhos.forEach(function (g) {
      var rotulo = 'n=' + n + ' gatilho=' + (g ? 'sim' : 'nao');
      var meds = gerarMedicoes(n);
      var saida = null;
      var lancou = false;
      try {
        saida = Bonsai.grafico.tronco(meds, g);
      } catch (e) {
        lancou = true;
      }
      assert.eq(lancou, false, 'não lança (' + rotulo + ')');
      assert.ok(typeof saida === 'string' && saida.length > 0, 'string não vazia (' + rotulo + ')');
      assert.eq(/%/.test(saida), false, 'nunca mostra percentual (' + rotulo + ')');

      if (n === 0) {
        assert.eq(/<polyline/.test(saida), false, 'zero medições sem polyline (' + rotulo + ')');
        assert.eq(/<circle/.test(saida), false, 'zero medições sem circle (' + rotulo + ')');
        if (g) {
          assert.ok(saida.indexOf(String(g.alvoMm)) !== -1, 'mostra o alvo verbatim (' + rotulo + ')');
          assert.ok(saida.indexOf(g.metodo) !== -1, 'mostra o método verbatim (' + rotulo + ')');
        }
      }

      if (n === 1) {
        assert.ok(/<circle/.test(saida), 'uma medição desenha o ponto (' + rotulo + ')');
        assert.eq(/<polyline/.test(saida), false, 'uma medição não vira linha (' + rotulo + ')');
      }

      if (n >= 2) {
        assert.ok(/<polyline/.test(saida), 'duas ou mais medições ligam os pontos (' + rotulo + ')');
      }
    });
  });
});

// -------------------------------------------------------------------------
// Ordem de entrada não importa: `medicoes` chega em qualquer ordem e o
// módulo ordena por `data` internamente.
// -------------------------------------------------------------------------
assert.grupo('grafico - ordem de entrada é irrelevante', function () {
  var gat = { alvoMm: 80, metodo: 'fita métrica' };
  var cronologico = gerarMedicoes(6);
  var reverso = embaralharParaTrasParaFrente(cronologico);

  var saidaCronologica = Bonsai.grafico.tronco(cronologico, gat);
  var saidaReversa = Bonsai.grafico.tronco(reverso, gat);
  assert.eq(saidaReversa, saidaCronologica, 'medições em ordem reversa produzem a mesma saída');

  // Também vale para o gatilho null.
  var saidaCronologicaSemGatilho = Bonsai.grafico.tronco(cronologico, null);
  var saidaReversaSemGatilho = Bonsai.grafico.tronco(reverso, null);
  assert.eq(saidaReversaSemGatilho, saidaCronologicaSemGatilho, 'idem sem gatilho');
});

// -------------------------------------------------------------------------
// Escape de texto interpolado: `metodo` com caracteres especiais de HTML/XML
// precisa sair escapado, e o resultado continua sendo marcação balanceada.
// -------------------------------------------------------------------------
assert.grupo('grafico - escapa texto interpolado', function () {
  var gatPerigoso = {
    alvoMm: 80,
    metodo: 'fita & "régua" <especial> teste \'aspas\''
  };

  var vazio = Bonsai.grafico.tronco([], gatPerigoso);
  assert.ok(/&amp;/.test(vazio), 'escapa &');
  assert.ok(/&lt;especial&gt;/.test(vazio), 'escapa < e >');
  assert.ok(/&quot;régua&quot;/.test(vazio), 'escapa aspas duplas');
  assert.eq(vazio.indexOf('<especial>') === -1, true, 'não vaza a tag falsa sem escapar');
  assert.ok(semAngulosSoltos(vazio), 'marcação continua balanceada no estado vazio');

  // O mesmo metodo pode aparecer também quando há medições (rótulo do
  // alvo, por exemplo, usa apenas o número — mas o teste garante que o
  // gráfico inteiro nunca vaza a marcação nem com dados perigosos por perto).
  var meds = gerarMedicoes(4);
  var comDados = Bonsai.grafico.tronco(meds, gatPerigoso);
  assert.ok(semAngulosSoltos(comDados), 'marcação continua balanceada com medições e gatilho perigoso');
});
