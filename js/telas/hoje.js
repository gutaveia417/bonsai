var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.telas = Bonsai.telas || {};

// Tela "Hoje" — alertas ativos, tarefas abertas, checklist de rega e o botão
// de registrar evento. Esqueleto: o conteúdo real entra na Task 9.
Bonsai.telas.hoje = (function () {

  function render(params) {
    return '' +
      '<h1>Hoje</h1>' +
      '<p>Esta tela ainda não foi construída (Task 9).</p>';
  }

  return { render: render };

})();
