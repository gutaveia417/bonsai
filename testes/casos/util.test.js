// Bonsai.util.escapar — usado por toda tela/gráfico/diagrama antes de jogar
// texto em innerHTML/SVG. Ver CONTEXTO.md invariante 1: null/undefined viram
// string vazia (campo não informado), nunca a palavra "null" na tela; 0 é
// valor real e tem que sobreviver.

assert.grupo('util.escapar — ausência de valor', function () {
  assert.eq(Bonsai.util.escapar(null), '', 'null vira string vazia');
  assert.eq(Bonsai.util.escapar(undefined), '', 'undefined vira string vazia');
  assert.eq(Bonsai.util.escapar(''), '', 'string vazia continua vazia');
});

assert.grupo('util.escapar — zero é valor, não ausência', function () {
  assert.eq(Bonsai.util.escapar(0), '0', 'número 0 vira a string "0", não vazio');
});

assert.grupo('util.escapar — caracteres especiais', function () {
  assert.eq(Bonsai.util.escapar('&'), '&amp;', 'escapa &');
  assert.eq(Bonsai.util.escapar('<'), '&lt;', 'escapa <');
  assert.eq(Bonsai.util.escapar('>'), '&gt;', 'escapa >');
  assert.eq(Bonsai.util.escapar('"'), '&quot;', 'escapa aspas duplas');
  assert.eq(Bonsai.util.escapar("'"), '&#39;', "escapa apóstrofo");
});

assert.grupo('util.escapar — frase combinando vários casos', function () {
  assert.eq(
    Bonsai.util.escapar('Tag <script>alert("oi")</script> & o dono disse: \'cuidado\''),
    'Tag &lt;script&gt;alert(&quot;oi&quot;)&lt;/script&gt; &amp; o dono disse: &#39;cuidado&#39;',
    'frase com <, >, &, " e \' de uma vez só sai inteira escapada'
  );
});
