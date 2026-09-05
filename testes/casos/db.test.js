assert.grupo('db', function () {
  localStorage.clear();

  var r1 = Bonsai.db.carregar();
  assert.eq(r1.somenteLeitura, false, 'banco novo é gravável');
  assert.eq(r1.db.schemaVersion, 1, 'banco novo nasce na versão 1');
  assert.eq(r1.db.arvores.length, 7, 'banco novo tem as 7 árvores');

  // fix 1/5, achado 2 — estado derivado (somenteLeitura/motivo) não pode vazar
  // para o disco: a raiz gravada tem que ter exatamente as 7 chaves do seed.
  var chavesRaizSeed = ['schemaVersion', 'ajustes', 'especies', 'arvores', 'eventos', 'tarefas', 'alertasDispensados'].sort();
  var brutoArmazenado = JSON.parse(localStorage.getItem(Bonsai.db.CHAVE));
  assert.eq(Object.keys(brutoArmazenado).sort(), chavesRaizSeed, 'banco gravado em disco tem só as 7 chaves da raiz do seed');
  assert.eq('somenteLeitura' in brutoArmazenado, false, 'somenteLeitura não é persistido em disco');
  assert.eq('motivo' in brutoArmazenado, false, 'motivo não é persistido em disco');

  // ida e volta
  var texto = Bonsai.db.exportar(r1.db);
  var r2 = Bonsai.db.importar(texto);
  assert.eq(r2.ok, true, 'importa o que exportou');
  assert.eq(JSON.stringify(r2.db), JSON.stringify(r1.db), 'ida e volta preserva tudo');

  // fix 1/5, achado 2 — mesma checagem para exportar()
  var chavesExportadas = Object.keys(JSON.parse(texto)).sort();
  assert.eq(chavesExportadas, chavesRaizSeed, 'exportar() também só tem as 7 chaves da raiz');

  // lixo não derruba o app
  var r3 = Bonsai.db.importar('{isso nao e json');
  assert.eq(r3.ok, false, 'JSON inválido é rejeitado');
  assert.ok(r3.erro, 'JSON inválido explica o erro');

  // R12 — importar substitui o banco vivo, então lixo estruturado (arvores ou
  // especies que não são array) tem que ser rejeitado, não aceito como ok:true
  var r3b = Bonsai.db.importar(JSON.stringify({
    schemaVersion: 1, ajustes: {}, especies: [], arvores: 'nao é array',
    eventos: [], tarefas: [], alertasDispensados: []
  }));
  assert.eq(r3b.ok, false, 'arvores que não é array é rejeitado');
  assert.ok(r3b.erro, 'erro explica que arvores é inválido');

  var r3c = Bonsai.db.importar(JSON.stringify({
    schemaVersion: 1, ajustes: {}, especies: 'nao é array', arvores: [],
    eventos: [], tarefas: [], alertasDispensados: []
  }));
  assert.eq(r3c.ok, false, 'especies que não é array é rejeitado');
  assert.ok(r3c.erro, 'erro explica que especies é inválido');

  // versão do futuro entra em somente-leitura em vez de destruir dados
  var r4 = Bonsai.db.migrar({ schemaVersion: 99, arvores: [], eventos: [], tarefas: [] });
  assert.eq(r4.somenteLeitura, true, 'versão futura vira somente-leitura');
  assert.ok(r4.motivo, 'somente-leitura explica o motivo');

  // R11 — cadeia de migração que não alcança a versão atual não pode ser
  // marcada gravável (MIGRACOES vazia hoje, então schemaVersion 0 nunca chega
  // a 1: a cadeia fica incompleta e isso tem que virar somente-leitura)
  var r5 = Bonsai.db.migrar({ schemaVersion: 0, arvores: [], eventos: [], tarefas: [] });
  assert.eq(r5.somenteLeitura, true, 'migração que não alcança a versão atual vira somente-leitura');
  assert.ok(r5.motivo, 'motivo explica que a migração não foi concluída');

  // salvar respeita somente-leitura
  var db = r1.db;
  db.somenteLeitura = true;
  db.arvores[0].apelido = 'NAO DEVE GRAVAR';
  Bonsai.db.salvar(db);
  assert.eq(Bonsai.db.carregar().db.arvores[0].apelido, 'Jabuticaba', 'somente-leitura não grava');

  localStorage.clear();
});
