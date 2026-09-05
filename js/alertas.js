var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.alertas = (function () {

  // ---------------------------------------------------------------------
  // CONTEXTO invariante 5 / spec 5.2: alertas nascem de janela de época ou
  // de gatilho por medida, nunca de prazo inventado. Quatro geradores
  // puros — function(db, hoje): Alerta[] — concatenados por `gerar`.
  //
  // R21: para saber se uma ação está bloqueada para uma árvore, este
  // módulo SEMPRE pergunta a Bonsai.regras.paraArvore(...) e lê a lista
  // devolvida — nunca reimplementa a tabela de fase/estado aqui dentro.
  // Se este módulo reencodasse aquela lógica, as duas camadas divergiriam
  // na primeira mudança de regra, e a tela "Hoje" discordaria da ficha da
  // árvore — exatamente o tipo de contradição que já custou duas rodadas
  // de correção neste projeto.
  // ---------------------------------------------------------------------

  var NOME_MES = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function acharEspecie(db, especieId) {
    return db.especies.filter(function (e) { return e.id === especieId; })[0] || null;
  }

  function arvoresAtivas(db) {
    return db.arvores.filter(function (a) { return a.status === 'ativa'; });
  }

  // Meses em que a janela de época já é assunto: de 2 meses antes do
  // início até o fim da janela, contando por mês (nunca por dia — spec
  // 5.2 item 1). Resolvido com aritmética circular porque uma janela
  // poderia, em tese, atravessar a virada do ano.
  function mesesDeAvisoDaJanela(janela) {
    var inicio = Math.min.apply(null, janela);
    var fim = Math.max.apply(null, janela);
    var meses = [];
    var m = inicio - 2;
    for (var i = 0; i < 14; i++) {
      var mm = ((m - 1) % 12 + 12) % 12 + 1;
      meses.push(mm);
      if (mm === fim) break;
      m++;
    }
    return meses;
  }

  // ---------------------------------------------------------------------
  // 1. Janela de época — spec 5.2 item 1. Deriva de especie.janelaTransplante,
  // nunca de um contador de dias. R21: pula toda árvore cujas regras já
  // proíbem transplantar agora — anunciar "a janela abre em agosto" para a
  // Serissa (adaptação) ou a Azaleia (recuperação) contradiria a própria
  // ficha delas, que mostra transplantar ⛔.
  // ---------------------------------------------------------------------
  function gerarJanelaEpoca(db, hoje) {
    var mesHoje = Bonsai.datas.mes(hoje);
    var resultado = [];

    arvoresAtivas(db).forEach(function (arvore) {
      var especie = acharEspecie(db, arvore.especieId);
      if (!especie || !especie.janelaTransplante || especie.janelaTransplante.length === 0) return;

      var mesesAviso = mesesDeAvisoDaJanela(especie.janelaTransplante);
      if (mesesAviso.indexOf(mesHoje) === -1) return;

      var regrasArvore = Bonsai.regras.paraArvore(arvore, especie, hoje);
      var bloqueada = regrasArvore.proibido.some(function (i) { return i.acao === 'transplantar'; });
      if (bloqueada) return;

      // Âncora emprestada do próprio item de "transplantar" que as regras
      // já produziram para esta árvore (R21) — sem duplicar a informação
      // de onde no guia isso é explicado. Só cai no fallback se a fase
      // desta árvore nem menciona transplantar (nenhuma tree do seed cai
      // aqui hoje, mas decepe/estrutura/refino não têm item de transplante).
      //
      // PROVISÓRIO (fix round 1, revisão): 'guia#engorda-vaso' fala de vaso
      // grande na fase de engorda, não de planejar um transplante — é
      // semanticamente errada para este fallback. Hoje é código morto
      // (nenhuma árvore do seed cai aqui), por isso não foi trocada agora;
      // quem escrever o guia não deve assumir que esta âncora está correta
      // e construir em cima dela sem revisar este ponto primeiro.
      var itemTransplantar = regrasArvore.permitido.filter(function (i) { return i.acao === 'transplantar'; })[0];
      var guiaAncora = itemTransplantar ? itemTransplantar.guiaAncora : 'guia#engorda-vaso';

      var inicio = Math.min.apply(null, especie.janelaTransplante);
      var fim = Math.max.apply(null, especie.janelaTransplante);
      var textoJanela = inicio === fim
        ? NOME_MES[inicio]
        : NOME_MES[inicio] + ' a ' + NOME_MES[fim];

      resultado.push({
        id: 'janela-transplante-' + arvore.id,
        nivel: 'info',
        titulo: 'Janela de transplante abre em ' + NOME_MES[inicio],
        corpo: 'A janela de transplante em Naviraí vai de ' + textoJanela +
          '. Se fizer sentido para esta árvore, é hora de planejar substrato, vaso e poda de raiz antes que a janela abra.',
        arvoreId: arvore.id,
        guiaAncora: guiaAncora,
        progresso: null
      });
    });

    return resultado;
  }

  // ---------------------------------------------------------------------
  // 2. Gatilho por medida — spec 5.2 item 2. Compara a última `medicao`
  // com gatilhoFase.alvoMm. Sem nenhuma medição real, `progresso` é
  // `null` e o corpo mostra alvo e método, nunca um percentual inventado
  // (CONTEXTO invariante 1 — o caso de referência é exatamente este: o
  // tronco da Jabuticaba nunca foi medido com fita).
  // ---------------------------------------------------------------------
  function ultimaMedicao(db, arvoreId) {
    var medicoes = db.eventos.filter(function (e) { return e.arvoreId === arvoreId && e.tipo === 'medicao'; });
    if (medicoes.length === 0) return null;
    return medicoes.reduce(function (maisRecente, atual) {
      return atual.data >= maisRecente.data ? atual : maisRecente;
    });
  }

  function gerarGatilhoMedida(db, hoje) {
    var resultado = [];

    arvoresAtivas(db).forEach(function (arvore) {
      if (!arvore.gatilhoFase) return;

      var medicao = ultimaMedicao(db, arvore.id);
      var progresso = medicao
        ? { atualMm: medicao.dados.diametroMm, alvoMm: arvore.gatilhoFase.alvoMm }
        : null;

      var corpo, nivel, titulo, guiaAncora;
      if (!progresso) {
        titulo = 'Ainda sem medição do tronco';
        corpo = 'Alvo para o decepe: ' + arvore.gatilhoFase.alvoMm +
          ' mm de diâmetro. Método: ' + arvore.gatilhoFase.metodo + '.';
        nivel = 'info';
        guiaAncora = 'guia#nucleo-medir';
      } else if (progresso.atualMm >= progresso.alvoMm) {
        titulo = 'Tronco atingiu o alvo de decepe';
        corpo = 'Última medição: ' + progresso.atualMm + ' mm — alcançou o alvo de ' + progresso.alvoMm +
          ' mm. Reveja a orientação de decepe no guia antes de cortar.';
        nivel = 'atencao';
        guiaAncora = 'guia#decepe-corte';
      } else {
        titulo = 'Acompanhar o tronco até o alvo de decepe';
        corpo = 'Última medição: ' + progresso.atualMm + ' mm, de um alvo de ' + progresso.alvoMm +
          ' mm. Método: ' + arvore.gatilhoFase.metodo + '.';
        nivel = 'info';
        guiaAncora = 'guia#nucleo-medir';
      }

      resultado.push({
        id: 'gatilho-' + arvore.id,
        nivel: nivel,
        titulo: titulo,
        corpo: corpo,
        arvoreId: arvore.id,
        guiaAncora: guiaAncora,
        progresso: progresso
      });
    });

    return resultado;
  }

  // ---------------------------------------------------------------------
  // 3. Condição registrada — spec 5.2 item 3, mais o alerta previsto no
  // seed (spec 5.2, "Alerta previsto no seed"). Os dois nascem de uma
  // condição já registrada nos dados, nunca de um prazo inventado.
  // ---------------------------------------------------------------------

  // Único intervalo fixo de todo o app (CONTEXTO invariante 5 / R9):
  // conferência de arame a cada 30 dias, pedida explicitamente pelo dono
  // do projeto. Não usar este caso como precedente para inventar outro
  // prazo fixo em lugar nenhum — a regra geral continua sendo janela de
  // época ou gatilho por medida.
  var DIAS_CONFERENCIA_ARAME = 30;

  function gerarConferenciaArame(db, hoje) {
    var resultado = [];

    var idsComAramacao = {};
    db.eventos.forEach(function (e) {
      if (e.tipo === 'aramacao') idsComAramacao[e.arvoreId] = true;
    });

    Object.keys(idsComAramacao).forEach(function (arvoreId) {
      var eventosArvore = db.eventos.filter(function (e) { return e.arvoreId === arvoreId; });
      var aramacoes = eventosArvore.filter(function (e) { return e.tipo === 'aramacao'; });
      var ultimaAramacao = aramacoes.reduce(function (maisRecente, atual) {
        return atual.data >= maisRecente.data ? atual : maisRecente;
      });

      var removidoDepois = eventosArvore.some(function (e) {
        return e.tipo === 'remocao-arame' && Bonsai.datas.diasEntre(ultimaAramacao.data, e.data) >= 0;
      });
      if (removidoDepois) return;

      var dias = Bonsai.datas.diasEntre(ultimaAramacao.data, hoje);
      if (dias <= DIAS_CONFERENCIA_ARAME) return;

      resultado.push({
        id: 'arame-' + arvoreId,
        nivel: 'atencao',
        titulo: 'Hora de conferir o arame',
        corpo: 'Arame aplicado há ' + dias + ' dias, sem conferência nem remoção registrada. ' +
          'Confira se não está encravando na casca conforme o galho engrossa — remova ou reaplique se precisar.',
        arvoreId: arvoreId,
        guiaAncora: 'guia#estrutura-conferir-arame',
        progresso: null
      });
    });

    return resultado;
  }

  // Alerta previsto no seed (spec 5.2): Jabuticaba transplantada em
  // 01/09/2026, posição de 6h de sol, guia pede sombra por 3–4 semanas.
  // Levantado como pergunta, nunca como acusação, e só enquanto as regras
  // (não uma data recalculada aqui) disserem que a árvore ainda está sob
  // o aviso de sombra pós-transplante — R21.
  function gerarConflitoSolPosTransplante(db, hoje) {
    var resultado = [];

    arvoresAtivas(db).forEach(function (arvore) {
      if (typeof arvore.solHoras !== 'number' || arvore.solHoras <= 0) return;

      var especie = acharEspecie(db, arvore.especieId);
      if (!especie) return;

      var regrasArvore = Bonsai.regras.paraArvore(arvore, especie, hoje);
      var itemSombra = regrasArvore.atencao.filter(function (i) { return i.acao === 'manter-sombra'; })[0];
      if (!itemSombra) return;

      resultado.push({
        id: 'sol-pos-transplante-' + arvore.id,
        nivel: 'atencao',
        titulo: 'Sol na posição atual — intencional?',
        corpo: itemSombra.texto + ' A posição registrada para esta árvore tem ' + arvore.solHoras +
          ' h de sol por dia. Ela já está na sombra? Isso é intencional?',
        arvoreId: arvore.id,
        guiaAncora: itemSombra.guiaAncora,
        progresso: null
      });
    });

    return resultado;
  }

  // ---------------------------------------------------------------------
  // 4. Carência / bloqueio — spec 5.2 item 4. Enquanto o estado bloqueia
  // adubar, o lembrete de adubo não é gerado — em seu lugar vai o motivo
  // e a data de liberação, lidos direto do item que Bonsai.regras já
  // devolveu em `proibido` (R21): o texto de pos-transplante já vem com
  // `{ate}` interpolado pela data real (ex.: Jabuticaba, 03/10/2026);
  // adaptação/recuperação não têm data fixa, e o motivo não inventa uma.
  // ---------------------------------------------------------------------
  function gerarCarenciaBloqueio(db, hoje) {
    var resultado = [];

    arvoresAtivas(db).forEach(function (arvore) {
      var especie = acharEspecie(db, arvore.especieId);
      if (!especie) return;

      var regrasArvore = Bonsai.regras.paraArvore(arvore, especie, hoje);
      var itemAdubo = regrasArvore.proibido.filter(function (i) { return i.acao === 'adubar'; })[0];
      if (!itemAdubo) return;

      resultado.push({
        id: 'bloqueio-adubo-' + arvore.id,
        nivel: 'bloqueio',
        titulo: 'Adubo bloqueado agora',
        corpo: itemAdubo.texto + ' ' + itemAdubo.porque,
        arvoreId: arvore.id,
        guiaAncora: itemAdubo.guiaAncora,
        progresso: null
      });
    });

    return resultado;
  }

  // ---------------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------------
  function gerar(db, hoje) {
    return [].concat(
      gerarJanelaEpoca(db, hoje),
      gerarGatilhoMedida(db, hoje),
      gerarConferenciaArame(db, hoje),
      gerarConflitoSolPosTransplante(db, hoje),
      gerarCarenciaBloqueio(db, hoje)
    );
  }

  // Uma dispensa vale de hoje até `ateData` (inclusive): o alerta some
  // enquanto hoje <= ateData e volta a aparecer no dia seguinte.
  function ativos(db, hoje) {
    var dispensados = db.alertasDispensados || [];
    return gerar(db, hoje).filter(function (alerta) {
      var dispensadoAgora = dispensados.some(function (d) {
        return d.alertaId === alerta.id && Bonsai.datas.diasEntre(hoje, d.ateData) >= 0;
      });
      return !dispensadoAgora;
    });
  }

  function dispensar(db, alertaId, ateIso) {
    db.alertasDispensados = db.alertasDispensados || [];
    db.alertasDispensados.push({ alertaId: alertaId, ateData: ateIso });
  }

  return {
    gerar: gerar,
    ativos: ativos,
    dispensar: dispensar
  };

})();
