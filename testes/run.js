const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');

// Ordem de carga: igual à do index.html.
const FONTES = [
  'js/datas.js', 'js/db.js', 'js/dados-iniciais.js', 'js/regras.js',
  'js/rega.js', 'js/alertas.js', 'js/grafico.js', 'js/svg.js'
];

const contexto = vm.createContext({
  console,
  globalThis: null,
  localStorage: (function () {
    let m = {};
    return {
      getItem: k => (k in m ? m[k] : null),
      setItem: (k, v) => { m[k] = String(v); },
      removeItem: k => { delete m[k]; },
      clear: () => { m = {}; }
    };
  })()
});
contexto.globalThis = contexto;

function carregar(rel) {
  const p = path.join(raiz, rel);
  if (!fs.existsSync(p)) return;           // módulo ainda não escrito
  vm.runInContext(fs.readFileSync(p, 'utf8'), contexto, { filename: rel });
}

FONTES.forEach(carregar);

// Guias de referência (js/guia/*.js) — carregados por último, em ordem alfabética.
const dirGuia = path.join(raiz, 'js', 'guia');
const arquivosGuia = fs.existsSync(dirGuia)
  ? fs.readdirSync(dirGuia).filter(f => f.endsWith('.js')).sort()
  : [];
arquivosGuia.forEach(f => carregar(path.join('js', 'guia', f)));

vm.runInContext(fs.readFileSync(path.join(__dirname, 'assert.js'), 'utf8'), contexto, { filename: 'assert.js' });

const dirCasos = path.join(__dirname, 'casos');
const casos = fs.existsSync(dirCasos)
  ? fs.readdirSync(dirCasos).filter(f => f.endsWith('.test.js')).sort()
  : [];
casos.forEach(f => vm.runInContext(
  fs.readFileSync(path.join(dirCasos, f), 'utf8'), contexto, { filename: 'casos/' + f }
));

const r = vm.runInContext('assert.relatorio()', contexto);
if (r.falhas.length) {
  console.error('\nFALHAS (' + r.falhas.length + ' de ' + r.total + '):');
  r.falhas.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('OK — ' + r.total + ' asserções, ' + casos.length + ' arquivo(s).');
