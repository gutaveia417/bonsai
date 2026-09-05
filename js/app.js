var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.telas = Bonsai.telas || {};

Bonsai.app = (function () {

  var ROTA_PADRAO = 'hoje';

  // Rota → nome da tela que a renderiza. "arvore" (ficha de uma árvore) usa a
  // mesma tela de "arvores" (lista); a diferença é o parâmetro `id`. O mesmo
  // vale para a aba que fica marcada como ativa na navegação.
  var TELA_POR_ROTA = {
    hoje: 'hoje',
    arvores: 'arvores',
    arvore: 'arvores',
    guia: 'guia',
    mais: 'mais'
  };

  var estado = { db: null, somenteLeitura: false, hoje: null };

  // ---- Roteamento puro (sem DOM) — testado em testes/casos/app.test.js ----

  function partesDoHash(hash) {
    var h = String(hash || '').replace(/^#/, '');
    return h.split('/').filter(function (parte) { return parte !== ''; });
  }

  // Interpreta o hash da URL e devolve { rota, params }. Rota vazia ou
  // desconhecida normaliza para "hoje" — nunca lança, nunca devolve rota nula.
  function analisarRota(hash) {
    var partes = partesDoHash(hash);
    if (partes.length === 0) return { rota: ROTA_PADRAO, params: {} };

    var nome = partes[0];

    if (nome === 'hoje' && partes.length === 1) {
      return { rota: 'hoje', params: {} };
    }
    if (nome === 'arvores' && partes.length === 1) {
      return { rota: 'arvores', params: {} };
    }
    if (nome === 'arvore' && partes.length === 2 && partes[1]) {
      return { rota: 'arvore', params: { id: partes[1] } };
    }
    if (nome === 'guia' && partes.length === 1) {
      return { rota: 'guia', params: {} };
    }
    if (nome === 'guia' && partes.length === 2 && partes[1]) {
      return { rota: 'guia', params: { secao: partes[1] } };
    }
    if (nome === 'mais' && partes.length === 1) {
      return { rota: 'mais', params: {} };
    }

    return { rota: ROTA_PADRAO, params: {} };
  }

  function telaParaRota(rota) {
    return TELA_POR_ROTA[rota] || ROTA_PADRAO;
  }

  // Hoje as abas coincidem 1:1 com as telas: a ficha de árvore ("arvore")
  // mantém a aba "Árvores" marcada, igual à lista.
  function abaParaRota(rota) {
    return telaParaRota(rota);
  }

  // ---- Parte que toca DOM — não roda no executor de testes em Node ----

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function faixaSomenteLeitura() {
    if (!estado.somenteLeitura) return '';
    var motivo = (estado.db && estado.db.motivo) ||
      'Os dados estão em modo somente leitura.';
    return '' +
      '<div id="faixa-somente-leitura" role="alert">' +
        '<p>' + escapar(motivo) + '</p>' +
        '<button type="button" id="btn-exportar-agora">Exportar agora</button>' +
      '</div>';
  }

  function exportarAgora() {
    var texto = Bonsai.db.exportar(estado.db);
    var blob = new Blob([texto], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'bonsai-backup-' + (estado.hoje || 'export') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function ligarBotaoExportar(raiz) {
    var btn = raiz.querySelector('#btn-exportar-agora');
    if (!btn) return;
    btn.addEventListener('click', exportarAgora);
  }

  function marcarAbaAtiva(aba) {
    var nav = document.getElementById('abas');
    if (!nav) return;
    var botoes = nav.querySelectorAll('button[data-rota]');
    for (var i = 0; i < botoes.length; i++) {
      var btn = botoes[i];
      var ehAtiva = btn.getAttribute('data-rota') === '#/' + aba;
      if (ehAtiva) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    }
  }

  function moverFocoParaTitulo(raiz) {
    var h1 = raiz.querySelector('h1');
    if (!h1) return;
    if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
    h1.focus();
  }

  function renderizar() {
    var resolvido = analisarRota(window.location.hash);
    var nomeTela = telaParaRota(resolvido.rota);
    var tela = Bonsai.telas[nomeTela];

    var raizTela = document.getElementById('tela');
    var html = faixaSomenteLeitura();

    if (tela && typeof tela.render === 'function') {
      html += tela.render(resolvido.params);
    } else {
      // Não deveria acontecer com as 4 telas registradas, mas não trava a
      // tela toda por causa de uma tela ausente.
      html += '<h1>Tela não encontrada</h1><p>A tela "' + escapar(nomeTela) +
        '" ainda não foi registrada.</p>';
    }

    raizTela.innerHTML = html;

    if (tela && typeof tela.ligar === 'function') {
      tela.ligar(raizTela);
    }

    ligarBotaoExportar(raizTela);
    marcarAbaAtiva(abaParaRota(resolvido.rota));
    moverFocoParaTitulo(raizTela);
  }

  function ligarAbas() {
    var nav = document.getElementById('abas');
    if (!nav) return;
    nav.addEventListener('click', function (ev) {
      var alvo = ev.target;
      while (alvo && alvo !== nav && !(alvo.tagName === 'BUTTON' && alvo.hasAttribute('data-rota'))) {
        alvo = alvo.parentNode;
      }
      if (!alvo || alvo === nav) return;
      ir(alvo.getAttribute('data-rota'));
    });
  }

  function ir(rota) {
    window.location.hash = rota;
  }

  function salvar() {
    Bonsai.db.salvar(estado.db);
    renderizar();
  }

  function iniciar() {
    var resultado = Bonsai.db.carregar();
    estado.db = resultado.db;
    estado.somenteLeitura = resultado.somenteLeitura;
    estado.hoje = Bonsai.datas.hoje();

    ligarAbas();
    window.addEventListener('hashchange', renderizar);
    renderizar();
  }

  return {
    iniciar: iniciar,
    estado: estado,
    salvar: salvar,
    ir: ir,
    // Expostos para teste (roteamento puro) — não fazem parte da UI pública.
    analisarRota: analisarRota,
    telaParaRota: telaParaRota,
    abaParaRota: abaParaRota
  };

})();
