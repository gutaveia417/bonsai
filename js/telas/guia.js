var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.telas = Bonsai.telas || {};

// Tela "Guia" — 11 seções, vocabulário e galeria de imagens (#/guia e
// #/guia/:secao). Esqueleto: o conteúdo real entra na Task 14.
Bonsai.telas.guia = (function () {

  function render(params) {
    if (params && params.secao) {
      return '' +
        '<h1>Guia: ' + escapar(params.secao) + '</h1>' +
        '<p>Esta seção ainda não foi construída (Task 14).</p>';
    }
    return '' +
      '<h1>Guia</h1>' +
      '<p>Esta tela ainda não foi construída (Task 14).</p>';
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
