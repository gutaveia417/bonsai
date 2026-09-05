assert.grupo('db', function () {
  localStorage.clear();

  var r1 = Bonsai.db.carregar();
  assert.eq(r1.somenteLeitura, false, 'banco novo é gravável');
  assert.eq(r1.db.schemaVersion, 1, 'banco novo nasce na versão 1');
  assert.eq(r1.db.arvores.length, 7, 'banco novo tem as 7 árvores');

  // ida e volta
  var texto = Bonsai.db.exportar(r1.db);
  var r2 = Bonsai.db.importar(texto);
  assert.eq(r2.ok, true, 'importa o que exportou');
  assert.eq(JSON.stringify(r2.db), JSON.stringify(r1.db), 'ida e volta preserva tudo');

  // lixo não derruba o app
  var r3 = Bonsai.db.importar('{isso nao e json');
  assert.eq(r3.ok, false, 'JSON inválido é rejeitado');
  assert.ok(r3.erro, 'JSON inválido explica o erro');

  // versão do futuro entra em somente-leitura em vez de destruir dados
  var r4 = Bonsai.db.migrar({ schemaVersion: 99, arvores: [], eventos: [], tarefas: [] });
  assert.eq(r4.somenteLeitura, true, 'versão futura vira somente-leitura');
  assert.ok(r4.motivo, 'somente-leitura explica o motivo');

  // salvar respeita somente-leitura
  var db = r1.db;
  db.somenteLeitura = true;
  db.arvores[0].apelido = 'NAO DEVE GRAVAR';
  Bonsai.db.salvar(db);
  assert.eq(Bonsai.db.carregar().db.arvores[0].apelido, 'Jabuticaba', 'somente-leitura não grava');

  localStorage.clear();
});
