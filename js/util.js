var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

// Utilitários compartilhados entre módulos de renderização (telas, gráfico,
// diagramas SVG). Carregado antes de todos os outros — nada aqui depende de
// mais nada no projeto.
Bonsai.util = (function () {

  // Escapa texto para uso seguro em marcação HTML/SVG. `null`/`undefined`
  // viram string vazia de propósito: CONTEXTO.md invariante 1 exige campo
  // vazio honesto em vez de valor inventado, e a versão anterior (sem essa
  // guarda) imprimia a palavra "null" na tela sempre que um campo do seed
  // fosse `null` por falta de dado real (dataAquisicao da azaleia, solHoras
  // de cinco árvores, fase da serissa/azaleia, vaso dos três ficus).
  // `0` é valor real, não ausência — não pode virar string vazia.
  function escapar(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    escapar: escapar
  };

})();
