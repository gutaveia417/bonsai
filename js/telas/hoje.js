var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.telas = Bonsai.telas || {};

// Tela "Hoje" — a primeira tela que o dono abre todo dia, no quintal, com a
// mão suja. Ordem fixa (spec §6 / brief da Task 9): alertas (bloqueio >
// atencao > info) → tarefas abertas → checklist de rega → botão "Registrar
// evento".
//
// Esta tela não calcula nada: `Bonsai.alertas.ativos` e `Bonsai.rega.checklist`
// já fazem o trabalho de regra e já foram testados (Tasks 5 e 6). O papel
// daqui é só renderizar o que eles devolvem, sem parafrasear nenhum texto —
// em especial `perfil.instrucao`, `perfil.teste` e `perfil.nota`, que já
// passaram por três rodadas de correção (ver CONTEXTO.md, js/rega.js).
Bonsai.telas.hoje = (function () {

  var ROTULO_NIVEL = {
    bloqueio: '⛔ Bloqueado',
    atencao: '⚠️ Atenção',
    info: 'ℹ️ Info'
  };

  var ORDEM_NIVEL = { bloqueio: 0, atencao: 1, info: 2 };

  // ---------------------------------------------------------------------
  // Parte pura — sem DOM, testada em testes/casos/hoje.test.js.
  // ---------------------------------------------------------------------

  // Bloqueio → atenção → info (brief da Task 9). `Array.prototype.sort` é
  // estável (garantido desde ES2019), então dois alertas do mesmo nível
  // mantêm a ordem em que `Bonsai.alertas.ativos` os devolveu. Não muta a
  // lista recebida — quem chama pode continuar usando o array original.
  function ordenarAlertas(alertas) {
    return alertas.slice().sort(function (a, b) {
      return ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel];
    });
  }

  // `concluidaEm === null` é o único critério de "aberta" (spec §4.7).
  function tarefasAbertas(db) {
    return db.tarefas.filter(function (t) { return t.concluidaEm === null; });
  }

  // Agrupa as linhas do checklist (uma por árvore ativa) pelo perfil
  // EFETIVO que `Bonsai.rega.checklist` já resolveu — nunca reagrupa por
  // `especie.rega` (CONTEXTO invariante 4). A ordem dos grupos segue a
  // ordem de primeira aparição de cada perfil na lista de entrada.
  function agruparChecklistPorPerfil(linhas) {
    var grupos = [];
    var porId = {};
    linhas.forEach(function (linha) {
      var id = linha.perfil.id;
      if (!porId[id]) {
        porId[id] = { perfil: linha.perfil, linhas: [] };
        grupos.push(porId[id]);
      }
      porId[id].linhas.push(linha);
    });
    return grupos;
  }

  // `diasDesde: null` é o caso normal do primeiro dia de uma árvore — nunca
  // vira "há 0 dias" (CONTEXTO invariante, ver brief da Task 9: 0 dias
  // afirmaria que ele regou hoje, o que não é verdade nenhuma vez que não há
  // histórico). `0` de verdade (regou hoje) tem frase própria.
  function textoUltimaRega(diasDesde) {
    if (diasDesde === null) return 'Sem registro de rega ainda.';
    if (diasDesde === 0) return 'Regada hoje.';
    return 'Última rega há ' + diasDesde + (diasDesde === 1 ? ' dia.' : ' dias.');
  }

  // ---------------------------------------------------------------------
  // Renderização — monta HTML a partir das funções puras acima. Nunca toca
  // no DOM (isso é papel de `ligar`).
  // ---------------------------------------------------------------------

  // Apelido da árvore a que o alerta se refere, ou `null` quando o alerta
  // não tem `arvoreId` (nenhum gerador de js/alertas.js produz isso hoje,
  // mas a tela não pode quebrar nem escrever "null" se algum vier a
  // produzir). Não é papel de js/alertas.js carregar apelido — ele só
  // conhece ids; resolver o nome é responsabilidade de quem renderiza.
  function apelidoArvore(arvoreId, db) {
    if (!arvoreId) return null;
    var arvore = db.arvores.filter(function (a) { return a.id === arvoreId; })[0];
    return arvore ? arvore.apelido : null;
  }

  function renderAlerta(alerta, db) {
    var progressoHtml = '';
    // `progresso` só existe quando há medição real (js/alertas.js). Sem
    // medição é `null` — sem barra, sem número (CONTEXTO invariante 1).
    if (alerta.progresso) {
      var pct = Math.max(0, Math.min(100,
        Math.round((alerta.progresso.atualMm / alerta.progresso.alvoMm) * 100)));
      progressoHtml = '' +
        '<div class="alerta-progresso">' +
          '<div class="alerta-progresso-barra" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<p class="alerta-medida">' + Bonsai.util.escapar(alerta.progresso.atualMm) +
          ' mm de ' + Bonsai.util.escapar(alerta.progresso.alvoMm) + ' mm</p>';
    }

    var apelido = apelidoArvore(alerta.arvoreId, db);
    // Sem o apelido aqui, três cartões de bloqueio de adubo têm o mesmo
    // título ("Adubo bloqueado agora") e o dono só sabe de qual árvore é
    // lendo o estado citado no corpo — exatamente o trabalho que o app
    // existe para poupar. Vive no cabeçalho, ao lado do rótulo de nível,
    // para ler antes até do título.
    var cabecalhoArvore = apelido
      ? '<p class="alerta-arvore">' + Bonsai.util.escapar(apelido) + '</p>'
      : '';

    return '' +
      '<article class="alerta alerta-' + Bonsai.util.escapar(alerta.nivel) + '" data-alerta-id="' +
        Bonsai.util.escapar(alerta.id) + '">' +
        '<div class="alerta-cabecalho">' +
          '<p class="alerta-nivel-rotulo">' + (ROTULO_NIVEL[alerta.nivel] || '') + '</p>' +
          cabecalhoArvore +
        '</div>' +
        '<h3>' + Bonsai.util.escapar(alerta.titulo) + '</h3>' +
        '<p>' + Bonsai.util.escapar(alerta.corpo) + '</p>' +
        progressoHtml +
        '<div class="alerta-acoes">' +
          '<a class="botao-secundario" href="#/guia/' + Bonsai.util.escapar(alerta.guiaAncora) + '">Por quê?</a>' +
          '<button type="button" class="botao-secundario" data-dispensar-alerta="' +
            Bonsai.util.escapar(alerta.id) + '">Dispensar</button>' +
        '</div>' +
      '</article>';
  }

  function renderSecaoAlertas(alertas, db) {
    var corpo = alertas.length
      ? alertas.map(function (a) { return renderAlerta(a, db); }).join('')
      : '<p class="vazio">Nenhum alerta agora.</p>';
    return '' +
      '<section aria-labelledby="titulo-alertas">' +
        '<h2 id="titulo-alertas">Alertas</h2>' +
        corpo +
      '</section>';
  }

  // Nome exibido junto da tarefa: apelido da árvore quando `arvoreId` está
  // preenchido, ou os apelidos das árvores do grupo (ex.: a chegada dos três
  // Ficus). `null` nos dois quando não há vínculo — spec §4.7.
  function nomeArvoreOuGrupo(tarefa, db) {
    if (tarefa.arvoreId) {
      var arvore = db.arvores.filter(function (a) { return a.id === tarefa.arvoreId; })[0];
      return arvore ? arvore.apelido : null;
    }
    if (tarefa.grupo) {
      var doGrupo = db.arvores.filter(function (a) { return a.grupo === tarefa.grupo; });
      var apelidos = doGrupo.map(function (a) { return a.apelido; });
      return apelidos.length ? apelidos.join(', ') : null;
    }
    return null;
  }

  function renderTarefa(tarefa, db) {
    var nome = nomeArvoreOuGrupo(tarefa, db);
    return '' +
      '<article class="tarefa" data-tarefa-id="' + Bonsai.util.escapar(tarefa.id) + '">' +
        (nome ? '<p class="tarefa-arvore">' + Bonsai.util.escapar(nome) + '</p>' : '') +
        '<h3>' + Bonsai.util.escapar(tarefa.titulo) + '</h3>' +
        '<p>' + Bonsai.util.escapar(tarefa.comoFazer) + '</p>' +
        '<button type="button" class="botao-secundario" data-concluir-tarefa="' +
          Bonsai.util.escapar(tarefa.id) + '">Concluir</button>' +
      '</article>';
  }

  function renderSecaoTarefas(tarefas, db) {
    var corpo = tarefas.length
      ? tarefas.map(function (t) { return renderTarefa(t, db); }).join('')
      : '<p class="vazio">Nenhuma tarefa aberta.</p>';
    return '' +
      '<section aria-labelledby="titulo-tarefas">' +
        '<h2 id="titulo-tarefas">Tarefas abertas</h2>' +
        corpo +
      '</section>';
  }

  function renderLinhaChecklist(linha) {
    // A nota do override (ex.: a da Azaleia) é a decisão errada que este
    // checklist existe para evitar — precisa ficar visualmente destacada,
    // não misturada ao resto do texto (CONTEXTO invariante 4).
    var notaHtml = linha.perfil.nota
      ? '<p class="rega-nota-alerta" role="alert">⚠️ ' + Bonsai.util.escapar(linha.perfil.nota) + '</p>'
      : '';
    return '' +
      '<li class="rega-linha" data-arvore-id="' + Bonsai.util.escapar(linha.arvore.id) + '">' +
        '<p class="rega-apelido">' + Bonsai.util.escapar(linha.arvore.apelido) + '</p>' +
        notaHtml +
        '<p class="rega-ultima">' + textoUltimaRega(linha.diasDesde) + '</p>' +
        '<button type="button" class="botao-secundario" data-regar-arvore="' +
          Bonsai.util.escapar(linha.arvore.id) + '">Regada</button>' +
      '</li>';
  }

  function renderGrupoChecklist(grupo) {
    var perfil = grupo.perfil;
    return '' +
      '<div class="rega-grupo">' +
        '<h3>' + Bonsai.util.escapar(perfil.rotulo) + '</h3>' +
        '<p class="rega-instrucao">' + Bonsai.util.escapar(perfil.instrucao) + '</p>' +
        '<p class="rega-teste">' + Bonsai.util.escapar(perfil.teste) + '</p>' +
        '<ul class="rega-lista">' + grupo.linhas.map(renderLinhaChecklist).join('') + '</ul>' +
      '</div>';
  }

  function renderSecaoChecklist(grupos) {
    var aviso = (grupos.length && grupos[0].linhas[0].avisoEstacao)
      ? '<p class="checklist-aviso-estacao">' + Bonsai.util.escapar(grupos[0].linhas[0].avisoEstacao) + '</p>'
      : '';
    var corpo = grupos.length
      ? grupos.map(renderGrupoChecklist).join('')
      : '<p class="vazio">Nenhuma árvore ativa para regar.</p>';
    return '' +
      '<section aria-labelledby="titulo-checklist">' +
        '<h2 id="titulo-checklist">Checklist de rega</h2>' +
        aviso +
        corpo +
      '</section>';
  }

  function render(params) {
    var db = Bonsai.app.estado.db;
    var hoje = Bonsai.app.estado.hoje;

    var alertas = ordenarAlertas(Bonsai.alertas.ativos(db, hoje));
    var tarefas = tarefasAbertas(db);
    var grupos = agruparChecklistPorPerfil(Bonsai.rega.checklist(db, hoje));

    return '' +
      '<h1>Hoje</h1>' +
      renderSecaoAlertas(alertas, db) +
      renderSecaoTarefas(tarefas, db) +
      renderSecaoChecklist(grupos) +
      '<section class="secao-registrar">' +
        '<button type="button" id="btn-registrar-evento" class="botao-grande">Registrar evento</button>' +
      '</section>';
  }

  // ---------------------------------------------------------------------
  // Parte que toca DOM — não roda no executor de testes em Node.
  // ---------------------------------------------------------------------

  function ligarBotoesDispensar(raiz, db, hoje) {
    var botoes = raiz.querySelectorAll('[data-dispensar-alerta]');
    for (var i = 0; i < botoes.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-dispensar-alerta');
          Bonsai.alertas.dispensar(db, id, Bonsai.datas.somarDias(hoje, 14));
          Bonsai.app.salvar();
        });
      })(botoes[i]);
    }
  }

  function ligarBotoesConcluir(raiz, db, hoje) {
    var botoes = raiz.querySelectorAll('[data-concluir-tarefa]');
    for (var i = 0; i < botoes.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-concluir-tarefa');
          var tarefa = db.tarefas.filter(function (t) { return t.id === id; })[0];
          if (!tarefa) return;
          // Tarefa com evento associado: concluir abre o formulário daquele
          // tipo, com a árvore já preenchida, em vez de marcar concluída
          // direto — quem fecha a tarefa é o formulário ao salvar (Task 11,
          // ainda não construída; a rota cai no padrão até lá).
          if (tarefa.eventoAoConcluir) {
            Bonsai.app.ir('#/evento/' + (tarefa.arvoreId || '') + '/' + tarefa.eventoAoConcluir);
            return;
          }
          tarefa.concluidaEm = hoje;
          Bonsai.app.salvar();
        });
      })(botoes[i]);
    }
  }

  function ligarBotoesRegar(raiz, db, hoje) {
    var botoes = raiz.querySelectorAll('[data-regar-arvore]');
    for (var i = 0; i < botoes.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-regar-arvore');
          var arvore = db.arvores.filter(function (a) { return a.id === id; })[0];
          if (!arvore) return;
          Bonsai.rega.registrar(arvore, hoje);
          Bonsai.app.salvar();
        });
      })(botoes[i]);
    }
  }

  function ligarBotaoRegistrarEvento(raiz) {
    var btn = raiz.querySelector('#btn-registrar-evento');
    if (!btn) return;
    // Sem árvore/tipo escolhidos ainda — o fluxo de 3 toques (árvore → tipo →
    // salvar) é o formulário da Task 11. Até lá a rota cai no padrão (Hoje).
    btn.addEventListener('click', function () { Bonsai.app.ir('#/evento'); });
  }

  function ligar(raiz) {
    var db = Bonsai.app.estado.db;
    var hoje = Bonsai.app.estado.hoje;

    ligarBotoesDispensar(raiz, db, hoje);
    ligarBotoesConcluir(raiz, db, hoje);
    ligarBotoesRegar(raiz, db, hoje);
    ligarBotaoRegistrarEvento(raiz);
  }

  return {
    render: render,
    ligar: ligar,
    // Expostos para teste (parte pura, sem DOM) — não fazem parte da UI pública.
    ordenarAlertas: ordenarAlertas,
    tarefasAbertas: tarefasAbertas,
    agruparChecklistPorPerfil: agruparChecklistPorPerfil,
    textoUltimaRega: textoUltimaRega
  };

})();
