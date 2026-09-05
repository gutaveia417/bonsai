var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.telas = Bonsai.telas || {};

// Tela "Árvores" — lista de cards (#/arvores) e ficha de uma árvore
// (#/arvore/:id). Esqueleto: o conteúdo real entra na Task 10.
Bonsai.telas.arvores = (function () {

  function render(params) {
    if (params && params.id) {
      return '' +
        '<h1>Árvore: ' + escapar(params.id) + '</h1>' +
        '<p>Esta ficha ainda não foi construída (Task 10).</p>';
    }
    return '' +
      '<h1>Árvores</h1>' +
      '<p>Esta tela ainda não foi construída (Task 10).</p>';
  }

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { render: render };

})();
