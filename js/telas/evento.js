var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.telas = Bonsai.telas || {};

// Tela "Registrar evento" (#/evento e #/evento/:arvoreId/:tipo) — um
// formulário por tipo de evento, campos conforme spec §4.3. Esqueleto: o
// conteúdo real entra na Task 11. Existe desde a Task 9 (fix round 1) só
// para o botão "Registrar evento" e o "concluir" de tarefa com evento
// associado (Tela Hoje) apontarem para uma tela real, honesta sobre o que
// falta, em vez de cair em silêncio na tela padrão.
Bonsai.telas.evento = (function () {

  function render(params) {
    if (params && params.arvoreId && params.tipo) {
      return '' +
        '<h1>Registrar evento: ' + Bonsai.util.escapar(params.tipo) + '</h1>' +
        '<p>Árvore: ' + Bonsai.util.escapar(params.arvoreId) + '</p>' +
        '<p>Este formulário ainda não foi construído (Task 11).</p>';
    }
    return '' +
      '<h1>Registrar evento</h1>' +
      '<p>Esta tela ainda não foi construída (Task 11).</p>';
  }

  return { render: render };

})();
