var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.db = (function () {

  var VERSAO_SCHEMA = 1;
  var CHAVE = 'bonsai.db.v1';

  // Migrações em cadeia: chave = versão de origem, valor = função que recebe
  // o banco nessa versão e devolve o banco já na versão seguinte (chave + 1).
  // Vazio na v1 porque não existe versão anterior — a cadeia fica pronta para
  // quando VERSAO_SCHEMA subir, não como um TODO.
  var MIGRACOES = {};

  function uid(prefixo) {
    return prefixo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function novo() {
    return Bonsai.dadosIniciais.montar();
  }

  function aplicarMigracoes(bruto, versaoInicial) {
    var db = bruto;
    var v = versaoInicial;
    while (v < VERSAO_SCHEMA) {
      var passo = MIGRACOES[v];
      if (typeof passo !== 'function') break; // sem migração definida para esta versão; para aqui
      db = passo(db);
      v++;
    }
    db.schemaVersion = v;
    return db;
  }

  function migrar(bruto) {
    var versao = bruto.schemaVersion;
    var db, somenteLeitura, motivo;

    if (versao > VERSAO_SCHEMA) {
      db = bruto;
      somenteLeitura = true;
      motivo = 'Estes dados vieram de uma versão mais nova do app (v' + versao +
        '). Atualize o app antes de gravar, senão você perde informação.';
    } else if (versao < VERSAO_SCHEMA) {
      db = aplicarMigracoes(bruto, versao);
      somenteLeitura = false;
      motivo = null;
    } else {
      db = bruto;
      somenteLeitura = false;
      motivo = null;
    }

    db.somenteLeitura = somenteLeitura;
    db.motivo = motivo;
    return { db: db, somenteLeitura: somenteLeitura, motivo: motivo };
  }

  function salvar(db) {
    if (db.somenteLeitura) return;
    localStorage.setItem(CHAVE, JSON.stringify(db));
  }

  function carregar() {
    var texto = localStorage.getItem(CHAVE);

    if (!texto) {
      var db = novo();
      db.somenteLeitura = false;
      db.motivo = null;
      salvar(db);
      return { db: db, somenteLeitura: false, motivo: null };
    }

    var bruto;
    try {
      bruto = JSON.parse(texto);
    } catch (e) {
      var dbRuim = novo();
      dbRuim.somenteLeitura = true;
      dbRuim.motivo = 'Dados corrompidos. Exporte antes de qualquer coisa.';
      return { db: dbRuim, somenteLeitura: true, motivo: dbRuim.motivo };
    }

    return migrar(bruto);
  }

  function exportar(db) {
    return JSON.stringify(db, null, 2);
  }

  function importar(texto) {
    var bruto;
    try {
      bruto = JSON.parse(texto);
    } catch (e) {
      return { ok: false, db: null, erro: 'JSON inválido: ' + e.message };
    }

    if (!bruto || typeof bruto !== 'object' || typeof bruto.schemaVersion !== 'number') {
      return { ok: false, db: null, erro: 'Arquivo não é um banco de dados do Bonsai.' };
    }

    var resultado = migrar(bruto);
    return { ok: true, db: resultado.db, erro: null };
  }

  return {
    VERSAO_SCHEMA: VERSAO_SCHEMA,
    CHAVE: CHAVE,
    uid: uid,
    novo: novo,
    carregar: carregar,
    salvar: salvar,
    exportar: exportar,
    importar: importar,
    migrar: migrar
  };

})();
