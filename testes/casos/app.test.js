// Roteador por hash — só a parte pura (sem DOM). Ver js/app.js.

assert.grupo('app.analisarRota — rotas simples', function () {
  assert.eq(Bonsai.app.analisarRota('#/hoje'), { rota: 'hoje', params: {} },
    '#/hoje vira { rota: hoje, params: {} }');
  assert.eq(Bonsai.app.analisarRota('#/arvores'), { rota: 'arvores', params: {} },
    '#/arvores vira { rota: arvores, params: {} }');
  assert.eq(Bonsai.app.analisarRota('#/guia'), { rota: 'guia', params: {} },
    '#/guia vira { rota: guia, params: {} }');
  assert.eq(Bonsai.app.analisarRota('#/mais'), { rota: 'mais', params: {} },
    '#/mais vira { rota: mais, params: {} }');
});

assert.grupo('app.analisarRota — rotas com parâmetro', function () {
  assert.eq(Bonsai.app.analisarRota('#/arvore/jabuticaba'),
    { rota: 'arvore', params: { id: 'jabuticaba' } },
    '#/arvore/jabuticaba extrai o id');
  assert.eq(Bonsai.app.analisarRota('#/arvore/ficus-a'),
    { rota: 'arvore', params: { id: 'ficus-a' } },
    'id com hífen (ficus-a) não é cortado no hífen');
  assert.eq(Bonsai.app.analisarRota('#/guia/rega'),
    { rota: 'guia', params: { secao: 'rega' } },
    '#/guia/rega extrai a seção');
});

assert.grupo('app.analisarRota — vazio, desconhecida e barra final', function () {
  assert.eq(Bonsai.app.analisarRota(''), { rota: 'hoje', params: {} },
    'hash vazio (\'\') normaliza para hoje');
  assert.eq(Bonsai.app.analisarRota('#'), { rota: 'hoje', params: {} },
    'hash só com # normaliza para hoje');
  assert.eq(Bonsai.app.analisarRota('#/nao-existe'), { rota: 'hoje', params: {} },
    'rota desconhecida normaliza para hoje');
  assert.eq(Bonsai.app.analisarRota('#/arvore'), { rota: 'hoje', params: {} },
    '#/arvore sem id normaliza para hoje (id é obrigatório)');
  assert.eq(Bonsai.app.analisarRota('#/hoje/'), { rota: 'hoje', params: {} },
    'barra final é ignorada (#/hoje/)');
  assert.eq(Bonsai.app.analisarRota('#/arvores/'), { rota: 'arvores', params: {} },
    'barra final é ignorada (#/arvores/)');
  assert.eq(Bonsai.app.analisarRota('#/arvore/ficus-a/'), { rota: 'arvore', params: { id: 'ficus-a' } },
    'barra final depois do id não quebra o parâmetro');
});

assert.grupo('app.telaParaRota — escolha da tela pela rota', function () {
  assert.eq(Bonsai.app.telaParaRota('hoje'), 'hoje', 'hoje → tela hoje');
  assert.eq(Bonsai.app.telaParaRota('arvores'), 'arvores', 'arvores → tela arvores');
  assert.eq(Bonsai.app.telaParaRota('arvore'), 'arvores', 'arvore (ficha) usa a mesma tela arvores');
  assert.eq(Bonsai.app.telaParaRota('guia'), 'guia', 'guia → tela guia');
  assert.eq(Bonsai.app.telaParaRota('mais'), 'mais', 'mais → tela mais');
  assert.eq(Bonsai.app.telaParaRota('rota-invalida'), 'hoje', 'rota desconhecida cai na tela hoje');
});

assert.grupo('app.abaParaRota — aba ativa na navegação', function () {
  assert.eq(Bonsai.app.abaParaRota('hoje'), 'hoje', 'hoje → aba hoje');
  assert.eq(Bonsai.app.abaParaRota('arvores'), 'arvores', 'arvores → aba arvores');
  assert.eq(Bonsai.app.abaParaRota('arvore'), 'arvores', 'ficha de árvore mantém a aba arvores ativa');
  assert.eq(Bonsai.app.abaParaRota('guia'), 'guia', 'guia → aba guia');
  assert.eq(Bonsai.app.abaParaRota('mais'), 'mais', 'mais → aba mais');
});

// Task 9, fix round 1: rota do formulário de evento (Task 11), registrada
// aqui só para o botão "Registrar evento" da Tela Hoje apontar para um
// destino real (js/telas/evento.js, esqueleto) em vez de cair em silêncio
// na tela padrão. Acréscimo puro — nenhuma asserção acima foi alterada.
assert.grupo('app.analisarRota — evento (Task 9 fix round 1, preparando a Task 11)', function () {
  assert.eq(Bonsai.app.analisarRota('#/evento'), { rota: 'evento', params: {} },
    '#/evento sem árvore/tipo vira { rota: evento, params: {} }');
  assert.eq(Bonsai.app.analisarRota('#/evento/jabuticaba/medicao'),
    { rota: 'evento', params: { arvoreId: 'jabuticaba', tipo: 'medicao' } },
    '#/evento/:arvoreId/:tipo extrai os dois parâmetros');
  assert.eq(Bonsai.app.analisarRota('#/evento/jabuticaba'), { rota: 'hoje', params: {} },
    '#/evento com só um segmento (sem tipo) normaliza para hoje, não quebra');
  assert.eq(Bonsai.app.telaParaRota('evento'), 'evento', 'evento → tela evento');
  assert.eq(Bonsai.app.abaParaRota('evento'), 'evento', 'evento não corresponde a nenhuma aba existente, mas não lança');
});
