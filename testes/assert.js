var assert = (function () {
  var falhas = [], grupoAtual = '', total = 0;
  function reg(ok, msg) {
    total++;
    if (!ok) falhas.push(grupoAtual + ' → ' + msg);
  }
  return {
    grupo: function (nome, fn) { grupoAtual = nome; fn(); },
    eq: function (a, b, msg) {
      var ok = JSON.stringify(a) === JSON.stringify(b);
      reg(ok, msg + (ok ? '' : '  (recebi ' + JSON.stringify(a) + ', esperava ' + JSON.stringify(b) + ')'));
    },
    ok: function (v, msg) { reg(!!v, msg); },
    lanca: function (fn, msg) {
      var lancou = false;
      try { fn(); } catch (e) { lancou = true; }
      reg(lancou, msg);
    },
    relatorio: function () { return { total: total, falhas: falhas }; }
  };
})();
if (typeof module !== 'undefined') module.exports = assert;
