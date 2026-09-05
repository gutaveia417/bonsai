var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.telas = Bonsai.telas || {};

// Tela "Árvores" — lista de cards (#/arvores) e ficha de uma árvore
// (#/arvore/:id). Spec §6 (navegação) e §8 (seed / fluxo de chegada dos
// Ficus), brief da Task 10.
//
// Como em js/telas/hoje.js, este módulo não recalcula regra nenhuma: quem
// decide o que é permitido/proibido/atenção é Bonsai.regras.paraArvore
// (Task 5), quem resolve o perfil de rega é Bonsai.rega.perfilEfetivo
// (Task 6, nunca especie.rega direto — CONTEXTO invariante 4), e quem
// desenha o gráfico de tronco é Bonsai.grafico.tronco (Task 7). O papel
// daqui é só render + a transição de estado pura do fluxo de chegada.
Bonsai.telas.arvores = (function () {

  var ROTULO_FASE = {
    engorda: 'Engorda',
    decepe: 'Decepe',
    estrutura: 'Estrutura',
    refino: 'Refino'
  };

  var ROTULO_ESTADO = {
    saudavel: 'Saudável',
    adaptacao: 'Adaptação',
    recuperacao: 'Recuperação',
    'pos-transplante': 'Pós-transplante'
  };

  var ROTULO_TIPO_EVENTO = {
    transplante: 'Transplante',
    poda: 'Poda',
    aramacao: 'Aramação',
    'remocao-arame': 'Remoção de arame',
    adubacao: 'Adubação',
    medicao: 'Medição',
    foto: 'Foto',
    observacao: 'Observação'
  };

  var ROTULO_BLOCO_REGRA = {
    permitido: '✅ Permitido',
    proibido: '⛔ Proibido',
    atencao: '⚠️ Atenção'
  };

  var DIAS_ADAPTACAO_CHEGADA = 14;   // spec §8: chegada dos Ficus abre 2 semanas de adaptação
  var DIAS_FAIXA_REGA = 30;          // spec §4.4: faixa de 30 dias, não a linha do tempo de eventos

  // ---------------------------------------------------------------------
  // Parte pura — sem DOM, testada em testes/casos/arvores.test.js.
  // ---------------------------------------------------------------------

  function especieDe(arvore, db) {
    return db.especies.filter(function (e) { return e.id === arvore.especieId; })[0] || null;
  }

  // Lista (#/arvores): as `a-chegar` (os três Ficus, hoje) vão para um grupo
  // separado no fim, nunca misturadas com as árvores ativas — brief da
  // Task 10. Não filtra 'perdida' para fora: essa árvore continua existindo
  // no registro, só não está nem ativa nem a-chegar.
  function separarPorStatus(arvores) {
    var principal = [];
    var aChegar = [];
    (arvores || []).forEach(function (a) {
      if (a.status === 'a-chegar') aChegar.push(a);
      else principal.push(a);
    });
    return { principal: principal, aChegar: aChegar };
  }

  // Próximo marco do card: a primeira tarefa aberta vinculada a esta árvore
  // (por id ou por grupo, ex. a chegada dos três Ficus é uma tarefa de
  // grupo) — é o passo mais concreto que existe nos dados hoje. Sem tarefa
  // aberta, cai no alvo do gatilho de fase, se houver. Sem nenhum dos dois,
  // diz isso explicitamente: nunca deixa o card sem marco nenhum, e nunca
  // inventa um número ou percentual (CONTEXTO invariante 1).
  function proximoMarco(arvore, db) {
    var tarefa = (db.tarefas || []).filter(function (t) {
      if (t.concluidaEm !== null) return false;
      if (t.arvoreId === arvore.id) return true;
      if (t.grupo && arvore.grupo && t.grupo === arvore.grupo) return true;
      return false;
    })[0];
    if (tarefa) return tarefa.titulo;

    if (arvore.gatilhoFase && typeof arvore.gatilhoFase.alvoMm === 'number') {
      return 'Alvo: ' + arvore.gatilhoFase.alvoMm + ' mm de diâmetro para ' +
        (arvore.gatilhoFase.proximaFase || 'a próxima fase') + '.';
    }

    return 'Sem marco definido ainda.';
  }

  // Fluxo de chegada dos Ficus (spec §8): status -> ativa, grava a data de
  // aquisição informada pelo dono, e abre adaptação por 14 dias a partir
  // dela. `estadoDesde` acompanha a mudança de estado — é quando a
  // adaptação de fato começou, não a data do seed. Muta o objeto recebido
  // (mesma convenção de Bonsai.rega.registrar) e o devolve, para permitir
  // encadeamento sem obrigar quem chama a reatribuir.
  function aplicarChegada(arvore, dataAquisicaoIso) {
    arvore.status = 'ativa';
    arvore.dataAquisicao = dataAquisicaoIso;
    arvore.estado = 'adaptacao';
    arvore.estadoDesde = dataAquisicaoIso;
    arvore.estadoAte = Bonsai.datas.somarDias(dataAquisicaoIso, DIAS_ADAPTACAO_CHEGADA);
    return arvore;
  }

  // Faixa de rega de 30 dias (spec §4.4) — 30 dias corridos terminando hoje,
  // cada um marcado como regado ou não conforme `historicoRega`. Nunca lê
  // o dia de hoje como "há 0 dias regado" nem inventa marca em dia sem
  // registro; é a mesma garantia de honestidade de js/telas/hoje.js,
  // aplicada a uma faixa em vez de a uma frase.
  function faixaRega30Dias(historicoRega, hoje) {
    var historico = historicoRega || [];
    var dias = [];
    for (var i = DIAS_FAIXA_REGA - 1; i >= 0; i--) {
      var dataIso = Bonsai.datas.somarDias(hoje, -i);
      dias.push({ data: dataIso, regada: historico.indexOf(dataIso) !== -1 });
    }
    return dias;
  }

  function eventosDaArvoreOrdenados(db, arvoreId) {
    return (db.eventos || [])
      .filter(function (e) { return e.arvoreId === arvoreId; })
      .slice()
      .sort(function (a, b) {
        if (a.data < b.data) return 1;   // mais recente primeiro
        if (a.data > b.data) return -1;
        return 0;
      });
  }

  // Detalhe curto por tipo de evento (spec §4.3 `dados`) — só o essencial
  // para a linha do tempo, sem duplicar campos que a nota já cobre.
  function detalheEvento(evento) {
    var dados = evento.dados || {};
    if (evento.tipo === 'medicao' && typeof dados.diametroMm === 'number') {
      return dados.diametroMm + ' mm de diâmetro.';
    }
    if (evento.tipo === 'poda' && dados.subtipo) {
      return 'Subtipo: ' + dados.subtipo + '.';
    }
    if (evento.tipo === 'aramacao' && typeof dados.bitolaMm === 'number') {
      return 'Bitola: ' + dados.bitolaMm + ' mm.';
    }
    if (evento.tipo === 'transplante' && dados.vaso && dados.vaso.descricao) {
      return 'Vaso: ' + dados.vaso.descricao + '.';
    }
    return '';
  }

  // ---------------------------------------------------------------------
  // Renderização — lista (#/arvores).
  // ---------------------------------------------------------------------

  // Texto simples aqui, nunca um <a> aninhado: o card inteiro (Ver ficha)
  // já é um link, e HTML não permite <a> dentro de <a> — a versão anterior
  // fazia isso para "ver tarefa aberta" e o navegador fechava o link externo
  // no meio, quebrando o card da Serissa/Azaleia visualmente ao meio.
  function renderFaseCard(arvore) {
    if (arvore.fase === null) {
      return '<p class="arvore-fase arvore-fase--indefinida">Fase ainda não definida — ver tarefa aberta em Hoje.</p>';
    }
    return '<p class="arvore-fase">' + Bonsai.util.escapar(ROTULO_FASE[arvore.fase] || arvore.fase) + '</p>';
  }

  function renderEstadoCard(arvore) {
    var texto = ROTULO_ESTADO[arvore.estado] || arvore.estado;
    var ate = arvore.estadoAte ? ' até ' + Bonsai.datas.formatarBR(arvore.estadoAte) : '';
    return '<p class="arvore-estado">' + Bonsai.util.escapar(texto) + Bonsai.util.escapar(ate) + '</p>';
  }

  // `<article>`, não `<a>`, envolvendo o card inteiro: o link para a ficha
  // vive num botão próprio no rodapé do card, para nunca precisar aninhar
  // outro link (ex. "ver tarefa aberta") dentro de um `<a>` — HTML inválido
  // que o navegador corrige fechando o link externo no meio do card.
  function renderCardArvore(arvore, db) {
    var especie = especieDe(arvore, db);
    return '' +
      '<article class="arvore-card">' +
        '<h3>' + Bonsai.util.escapar(arvore.apelido) + '</h3>' +
        '<p class="arvore-especie">' + Bonsai.util.escapar(especie ? especie.nomeComum : '') + '</p>' +
        renderFaseCard(arvore) +
        renderEstadoCard(arvore) +
        '<p class="arvore-marco">Próximo marco: ' + Bonsai.util.escapar(proximoMarco(arvore, db)) + '</p>' +
        '<a class="botao-secundario" href="#/arvore/' + Bonsai.util.escapar(arvore.id) + '">Ver ficha</a>' +
      '</article>';
  }

  function renderCardAChegar(arvore, db, hoje) {
    var especie = especieDe(arvore, db);
    return '' +
      '<article class="arvore-card arvore-card--a-chegar" data-arvore-id="' + Bonsai.util.escapar(arvore.id) + '">' +
        '<h3>' + Bonsai.util.escapar(arvore.apelido) + '</h3>' +
        '<p class="arvore-especie">' + Bonsai.util.escapar(especie ? especie.nomeComum : '') + '</p>' +
        '<p class="arvore-status">Aguardando chegada.</p>' +
        '<label class="chegada-data-label">Data de aquisição' +
          '<input type="date" class="chegada-data-input" data-chegada-data="' +
            Bonsai.util.escapar(arvore.id) + '" value="' + Bonsai.util.escapar(hoje) + '">' +
        '</label>' +
        '<button type="button" class="botao-secundario" data-registrar-chegada="' +
          Bonsai.util.escapar(arvore.id) + '">Registrar chegada</button>' +
      '</article>';
  }

  function renderLista() {
    var db = Bonsai.app.estado.db;
    var hoje = Bonsai.app.estado.hoje;
    var grupos = separarPorStatus(db.arvores);

    var principalHtml = grupos.principal.length
      ? grupos.principal.map(function (a) { return renderCardArvore(a, db); }).join('')
      : '<p class="vazio">Nenhuma árvore ativa.</p>';

    var aChegarHtml = grupos.aChegar.length
      ? '' +
        '<section aria-labelledby="titulo-a-chegar">' +
          '<h2 id="titulo-a-chegar">A chegar</h2>' +
          grupos.aChegar.map(function (a) { return renderCardAChegar(a, db, hoje); }).join('') +
        '</section>'
      : '';

    return '' +
      '<h1>Árvores</h1>' +
      '<section aria-labelledby="titulo-lista-arvores">' +
        '<h2 id="titulo-lista-arvores" class="visualmente-oculto">Ativas</h2>' +
        principalHtml +
      '</section>' +
      aChegarHtml;
  }

  // ---------------------------------------------------------------------
  // Renderização — ficha (#/arvore/:id). Ordem fixa (brief da Task 10):
  // cabeçalho -> blocos de regra -> gráfico -> rega -> linha do tempo ->
  // vaso/substrato/posição -> notas -> plano do experimento (condicional).
  // ---------------------------------------------------------------------

  function renderCabecalho(arvore, especie) {
    var faseHtml = arvore.fase === null
      ? '<p class="ficha-fase ficha-fase--indefinida">Fase ainda não definida — ' +
        '<a class="botao-secundario" href="#/hoje">ver tarefa aberta em Hoje</a></p>'
      : '<p class="ficha-fase">Fase: ' + Bonsai.util.escapar(ROTULO_FASE[arvore.fase] || arvore.fase) + '</p>';

    var estadoTexto = 'Estado: ' + (ROTULO_ESTADO[arvore.estado] || arvore.estado);
    if (arvore.estadoDesde) estadoTexto += ' desde ' + Bonsai.datas.formatarBR(arvore.estadoDesde);
    if (arvore.estadoAte) estadoTexto += ' até ' + Bonsai.datas.formatarBR(arvore.estadoAte);

    var nomeCientifico = especie && especie.nomeCientifico
      ? ' <em>(' + Bonsai.util.escapar(especie.nomeCientifico) + ')</em>' : '';

    return '' +
      '<header class="ficha-cabecalho">' +
        '<h1>' + Bonsai.util.escapar(arvore.apelido) + '</h1>' +
        '<p class="ficha-especie">' + Bonsai.util.escapar(especie ? especie.nomeComum : '') + nomeCientifico + '</p>' +
        faseHtml +
        '<p class="ficha-estado">' + Bonsai.util.escapar(estadoTexto) + '</p>' +
      '</header>';
  }

  // Cada item de regra mostra o texto sempre visível, e o "por quê?" atrás
  // de um <details> nativo (sem JS de "ligar" — expande/recolhe sozinho) com
  // um link para a âncora do guia (brief: "Link 'por quê?' a #/guia/<ancora>",
  // mesma convenção de js/telas/hoje.js para guiaAncora).
  function renderItemRegra(item) {
    return '' +
      '<li class="regra-item" data-acao="' + Bonsai.util.escapar(item.acao) + '">' +
        '<p class="regra-texto">' + Bonsai.util.escapar(item.texto) + '</p>' +
        '<details class="regra-porque">' +
          '<summary>Por quê?</summary>' +
          '<p>' + Bonsai.util.escapar(item.porque) + '</p>' +
          '<a class="botao-secundario" href="#/guia/' + Bonsai.util.escapar(item.guiaAncora) + '">Ver no guia</a>' +
        '</details>' +
      '</li>';
  }

  function renderBlocoRegra(nivel, itens) {
    var corpo = itens.length
      ? '<ul class="regra-lista">' + itens.map(renderItemRegra).join('') + '</ul>'
      : '<p class="vazio">Nada nesta lista agora.</p>';
    return '' +
      '<div class="regra-bloco regra-bloco-' + nivel + '">' +
        '<h3>' + ROTULO_BLOCO_REGRA[nivel] + '</h3>' +
        corpo +
      '</div>';
  }

  // Ordem permitido -> proibido -> atenção (brief da Task 10, ordem da
  // ficha). Nunca filtra nem deduplica aqui: Bonsai.regras.paraArvore já
  // garante que uma acao não aparece em duas listas ao mesmo tempo.
  function renderSecaoRegras(regras) {
    return '' +
      '<section aria-labelledby="titulo-regras">' +
        '<h2 id="titulo-regras">O que fazer agora</h2>' +
        renderBlocoRegra('permitido', regras.permitido) +
        renderBlocoRegra('proibido', regras.proibido) +
        renderBlocoRegra('atencao', regras.atencao) +
      '</section>';
  }

  // Gráfico de tronco (spec §6). O estado vazio de Bonsai.grafico.tronco já
  // ensina o alvo e o método (Task 7) — a peça que faltava (brief da
  // Task 10) é o botão que abre o formulário de medição. Aparece sempre,
  // com o texto ajustado para a primeira medição ou uma nova.
  function renderSecaoGrafico(arvore, medicoes) {
    var graficoHtml = Bonsai.grafico.tronco(medicoes, arvore.gatilhoFase);
    var rotuloBotao = medicoes.length === 0 ? 'Registrar primeira medição' : 'Registrar nova medição';
    return '' +
      '<section aria-labelledby="titulo-grafico">' +
        '<h2 id="titulo-grafico">Tronco — ' + Bonsai.util.escapar(arvore.apelido) + '</h2>' +
        graficoHtml +
        '<div class="grafico-acoes">' +
          '<a class="botao-secundario" href="#/evento/' + Bonsai.util.escapar(arvore.id) + '/medicao">' +
            rotuloBotao + '</a>' +
        '</div>' +
      '</section>';
  }

  // Rega efetiva (CONTEXTO invariante 4: sempre Bonsai.rega.perfilEfetivo,
  // nunca especie.rega direto) + faixa de 30 dias + intervalo médio.
  function renderSecaoRega(arvore, especie, hoje) {
    var perfil = Bonsai.rega.perfilEfetivo(arvore, especie);
    var faixa = faixaRega30Dias(arvore.historicoRega, hoje);
    var media = Bonsai.rega.intervaloMedioDias(arvore);

    var notaHtml = perfil.nota
      ? '<p class="rega-nota-alerta" role="alert">⚠️ ' + Bonsai.util.escapar(perfil.nota) + '</p>'
      : '';

    var mediaTexto = media === null
      ? 'Sem dados suficientes ainda para calcular o intervalo médio.'
      : 'Intervalo médio entre regas: ' + media + (media === 1 ? ' dia.' : ' dias.');

    var marcas = faixa.map(function (d) {
      var classe = 'rega-faixa-dia' + (d.regada ? ' rega-faixa-dia--regada' : '');
      var titulo = Bonsai.datas.formatarBR(d.data) + (d.regada ? ' — regada' : ' — sem registro');
      return '<span class="' + classe + '" title="' + Bonsai.util.escapar(titulo) + '"></span>';
    }).join('');

    return '' +
      '<section aria-labelledby="titulo-rega">' +
        '<h2 id="titulo-rega">Rega — ' + Bonsai.util.escapar(arvore.apelido) + '</h2>' +
        '<p class="rega-rotulo">' + Bonsai.util.escapar(perfil.rotulo) + '</p>' +
        '<p class="rega-instrucao">' + Bonsai.util.escapar(perfil.instrucao) + '</p>' +
        '<p class="rega-teste">' + Bonsai.util.escapar(perfil.teste) + '</p>' +
        notaHtml +
        '<div class="rega-faixa" role="img" aria-label="Histórico de rega dos últimos 30 dias">' + marcas + '</div>' +
        '<p class="rega-media">' + mediaTexto + '</p>' +
      '</section>';
  }

  function renderEvento(evento) {
    var detalhe = detalheEvento(evento);
    return '' +
      '<li class="evento-item">' +
        '<p class="evento-data">' + Bonsai.util.escapar(Bonsai.datas.formatarBR(evento.data)) + '</p>' +
        '<p class="evento-tipo">' + Bonsai.util.escapar(ROTULO_TIPO_EVENTO[evento.tipo] || evento.tipo) + '</p>' +
        (detalhe ? '<p class="evento-detalhe">' + Bonsai.util.escapar(detalhe) + '</p>' : '') +
        (evento.nota ? '<p class="evento-nota">' + Bonsai.util.escapar(evento.nota) + '</p>' : '') +
      '</li>';
  }

  function renderSecaoLinhaTempo(eventos, apelido) {
    var corpo = eventos.length
      ? '<ul class="evento-lista">' + eventos.map(renderEvento).join('') + '</ul>'
      : '<p class="vazio">Nenhum evento registrado ainda para ' + Bonsai.util.escapar(apelido) + '.</p>';
    return '' +
      '<section aria-labelledby="titulo-linha-tempo">' +
        '<h2 id="titulo-linha-tempo">Linha do tempo</h2>' +
        corpo +
      '</section>';
  }

  // Vaso, substrato e posição. `null` em cada campo é "não informado" (nunca
  // um valor chutado); `substrato: []` é "ainda não registrado" — diferente
  // de dizer que a árvore não tem substrato nenhum (spec §4.7.1).
  function renderSecaoVasoSubstrato(arvore) {
    var vaso = arvore.vaso || {};
    var descricaoVaso = vaso.descricao !== null && vaso.descricao !== undefined ? vaso.descricao : 'não informado';
    var furadaTexto = vaso.furada === true ? 'Furado' : (vaso.furada === false ? 'Não furado' : 'não informado');
    var geotextilTexto = vaso.geotextil !== null && vaso.geotextil !== undefined ? vaso.geotextil : 'não informado';

    var substratoHtml = (arvore.substrato && arvore.substrato.length)
      ? '<ul class="substrato-lista">' + arvore.substrato.map(function (c) {
          return '<li>' + Bonsai.util.escapar(c.componente) + ': ' + Bonsai.util.escapar(c.pct) + '%</li>';
        }).join('') + '</ul>'
      : '<p class="vazio">Substrato ainda não registrado.</p>';

    var solHorasTexto = typeof arvore.solHoras === 'number'
      ? arvore.solHoras + (arvore.solHoras === 1 ? ' hora de sol por dia' : ' horas de sol por dia')
      : 'não informado';

    return '' +
      '<section aria-labelledby="titulo-vaso">' +
        '<h2 id="titulo-vaso">Vaso, substrato e posição</h2>' +
        '<p><strong>Vaso:</strong> ' + Bonsai.util.escapar(descricaoVaso) + '</p>' +
        '<p><strong>Furo de drenagem:</strong> ' + furadaTexto + '</p>' +
        '<p><strong>Geotêxtil:</strong> ' + Bonsai.util.escapar(geotextilTexto) + '</p>' +
        '<p><strong>Substrato:</strong></p>' +
        substratoHtml +
        '<p><strong>Posição:</strong> ' + Bonsai.util.escapar(arvore.posicao || 'não informado') + '</p>' +
        '<p><strong>Sol:</strong> ' + solHorasTexto + '</p>' +
      '</section>';
  }

  function renderSecaoNotas(arvore) {
    return '' +
      '<section aria-labelledby="titulo-notas">' +
        '<h2 id="titulo-notas">Notas</h2>' +
        '<p>' + (arvore.notas ? Bonsai.util.escapar(arvore.notas) : 'Sem notas.') + '</p>' +
      '</section>';
  }

  // Plano do experimento (spec §8) — só nas três Ficus (`grupo:
  // 'experimento-ficus'`), nunca em outra árvore.
  function renderSecaoExperimento(arvore) {
    if (arvore.grupo !== 'experimento-ficus') return '';
    var plano = arvore.planoExperimento || {};
    return '' +
      '<section aria-labelledby="titulo-experimento">' +
        '<h2 id="titulo-experimento">Plano do experimento</h2>' +
        (plano.fase1 ? '<p>' + Bonsai.util.escapar(plano.fase1) + '</p>' : '') +
        (plano.fase2 ? '<p>' + Bonsai.util.escapar(plano.fase2) + '</p>' : '') +
        '<p class="experimento-nota">Qualquer diferença de tratamento entre os três precisa virar evento.</p>' +
      '</section>';
  }

  function renderFicha(id) {
    var db = Bonsai.app.estado.db;
    var hoje = Bonsai.app.estado.hoje;
    var arvore = db.arvores.filter(function (a) { return a.id === id; })[0];

    if (!arvore) {
      return '<h1>Árvore não encontrada</h1><p><a href="#/arvores">Voltar para a lista de árvores</a></p>';
    }

    var especie = especieDe(arvore, db);
    var regras = Bonsai.regras.paraArvore(arvore, especie, hoje);
    var medicoes = (db.eventos || []).filter(function (e) {
      return e.arvoreId === arvore.id && e.tipo === 'medicao';
    });
    var eventos = eventosDaArvoreOrdenados(db, arvore.id);

    return '' +
      renderCabecalho(arvore, especie) +
      renderSecaoRegras(regras) +
      renderSecaoGrafico(arvore, medicoes) +
      renderSecaoRega(arvore, especie, hoje) +
      renderSecaoLinhaTempo(eventos, arvore.apelido) +
      renderSecaoVasoSubstrato(arvore) +
      renderSecaoNotas(arvore) +
      renderSecaoExperimento(arvore);
  }

  function render(params) {
    if (params && params.id) return renderFicha(params.id);
    return renderLista();
  }

  // ---------------------------------------------------------------------
  // Parte que toca DOM — não roda no executor de testes em Node. Só a lista
  // tem algo para ligar (o botão de registrar chegada); a ficha usa <a> e
  // <details> nativos, sem handler nenhum.
  // ---------------------------------------------------------------------

  function ligarBotoesChegada(raiz, db) {
    var botoes = raiz.querySelectorAll('[data-registrar-chegada]');
    for (var i = 0; i < botoes.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-registrar-chegada');
          var arvore = db.arvores.filter(function (a) { return a.id === id; })[0];
          if (!arvore) return;

          var input = raiz.querySelector('[data-chegada-data="' + id + '"]');
          var dataIso = input && input.value ? input.value : Bonsai.app.estado.hoje;
          if (!Bonsai.datas.valida(dataIso)) return;

          aplicarChegada(arvore, dataIso);
          Bonsai.app.salvar();
        });
      })(botoes[i]);
    }
  }

  function ligar(raiz) {
    var db = Bonsai.app.estado.db;
    ligarBotoesChegada(raiz, db);
  }

  return {
    render: render,
    ligar: ligar,
    // Expostos para teste (parte pura, sem DOM) — não fazem parte da UI pública.
    separarPorStatus: separarPorStatus,
    proximoMarco: proximoMarco,
    aplicarChegada: aplicarChegada,
    faixaRega30Dias: faixaRega30Dias
  };

})();
