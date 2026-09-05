var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.datas = (function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function partes(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    return { a: +m[1], m: +m[2], d: +m[3] };
  }

  function valida(iso) {
    var p = partes(iso);
    if (!p) return false;
    if (p.m < 1 || p.m > 12 || p.d < 1) return false;
    var dt = new Date(p.a, p.m - 1, p.d);
    return dt.getFullYear() === p.a && dt.getMonth() === p.m - 1 && dt.getDate() === p.d;
  }

  function paraDate(iso) {
    var p = partes(iso);
    return new Date(p.a, p.m - 1, p.d);   // meia-noite local, não UTC
  }

  function deDate(dt) {
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  }

  return {
    hoje: function () { return deDate(new Date()); },
    somarDias: function (iso, n) {
      var dt = paraDate(iso);
      dt.setDate(dt.getDate() + n);
      return deDate(dt);
    },
    diasEntre: function (a, b) {
      return Math.round((paraDate(b) - paraDate(a)) / 86400000);
    },
    mes: function (iso) { return partes(iso).m; },
    formatarBR: function (iso) {
      var p = partes(iso);
      return pad(p.d) + '/' + pad(p.m) + '/' + p.a;
    },
    valida: valida,
    deDate: deDate
  };
})();
