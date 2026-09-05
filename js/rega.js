var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.rega = (function () {

  // ---------------------------------------------------------------------
  // Perfis de rega — spec 4.6. Dados, não `if`s: uma linha por perfil.
  //
  // Nenhum texto aqui manda "regar hoje" ou "regar a cada X dias" — só o
  // que testar e o que aquele teste significa para o perfil. Um beginner
  // que rega por calendário fixo é a forma mais comum de matar a planta,
  // porque folha murcha pode ser tanto falta quanto excesso de água; o
  // teste do dedo no substrato é o único jeito de distinguir os dois.
  // ---------------------------------------------------------------------
  var PERFIS = {
    'sempre-umido': {
      rotulo: 'Sempre úmido',
      instrucao: 'Não deixar secar — o substrato deve continuar úmido ao toque o tempo todo.',
      teste: 'Encoste o dedo na superfície do substrato: seco ao toque é sinal de atraso, não uma data de calendário.'
    },
    'secar-entre-regas': {
      rotulo: 'Secar entre regas',
      instrucao: 'Deixar a superfície secar antes de molhar de novo — essa espécie sofre mais de excesso do que de falta.',
      teste: 'Enfie o dedo 2–3 cm no substrato: seco nesse ponto é o sinal certo, não quantos dias se passaram desde a última vez.'
    },
    'secar-completo': {
      rotulo: 'Secar completo',
      instrucao: 'Deixar secar por completo entre uma vez e outra.',
      teste: 'Enfie o dedo 2–3 cm no substrato: só considere completo quando estiver seco até essa profundidade, não só por cima.'
    },
    'nem-secar-nem-encharcar': {
      rotulo: 'Nem secar, nem encharcar',
      instrucao: 'Meio-termo, sem extremos — nem ressecar por completo, nem manter encharcado.',
      teste: 'Enfie o dedo 2–3 cm no substrato: secando nesse ponto já é sinal suficiente, sem esperar secar por completo.'
    },
    'umido-vigiado': {
      rotulo: 'Úmido vigiado',
      instrucao: 'Teste do dedo a 2–3 cm antes de cada rega, sem exceção. Nunca ressecar por completo, nunca regar por rotina.',
      teste: 'Enfie o dedo 2–3 cm no substrato antes de qualquer decisão: o teste manda, nunca "já faz tempo".'
    }
  };

  // ---------------------------------------------------------------------
  // Resolução do perfil efetivo — spec 4.6.1. Nunca ler especie.rega
  // direto fora daqui: um override amarrado ao estado pode substituir o
  // perfil da espécie, e ele só vale enquanto aquele estado persistir.
  // O override não é apagado quando o estado muda — fica inerte e volta a
  // valer se a árvore recair no mesmo estado (CONTEXTO invariante 4).
  // ---------------------------------------------------------------------
  function perfilEfetivo(arvore, especie) {
    var override = arvore.regaOverride;
    if (override && arvore.estado === override.enquantoEstado) {
      var perfilOverride = PERFIS[override.perfil];
      return {
        id: override.perfil,
        rotulo: perfilOverride.rotulo,
        instrucao: perfilOverride.instrucao,
        teste: perfilOverride.teste,
        nota: override.nota,
        origem: 'override'
      };
    }

    var idEspecie = especie.rega;
    var perfilEspecie = PERFIS[idEspecie];
    return {
      id: idEspecie,
      rotulo: perfilEspecie.rotulo,
      instrucao: perfilEspecie.instrucao,
      teste: perfilEspecie.teste,
      nota: null,
      origem: 'especie'
    };
  }

  // Mais recente primeiro, capado em 30, nunca duplica uma data já
  // presente.
  function registrar(arvore, isoData) {
    var historico = arvore.historicoRega || [];
    if (historico.indexOf(isoData) === -1) {
      historico = [isoData].concat(historico);
    }
    arvore.historicoRega = historico.slice(0, 30);
  }

  // null com menos de duas datas — spec 4.7.1, null significa "não dá
  // para calcular", nunca 0 nem um valor fabricado.
  function intervaloMedioDias(arvore) {
    var historico = arvore.historicoRega || [];
    if (historico.length < 2) return null;
    var maisRecente = historico[0];
    var maisAntiga = historico[historico.length - 1];
    var dias = Bonsai.datas.diasEntre(maisAntiga, maisRecente);
    return Math.round(dias / (historico.length - 1));
  }

  // Modificador de estação — spec 5.3. Não é frequência fixa, só um
  // aviso de atenção redobrada nos meses de pico de calor e crescimento
  // em Naviraí (dez–fev). Nunca vira "regue duas vezes ao dia" como
  // regra automática.
  var MESES_REGA_DOBRADA = [12, 1, 2];
  var AVISO_REGA_DOBRADA = 'Janela de rega dobrada em Naviraí (dez–fev, pico de calor e crescimento): teste o substrato com mais atenção — a frequência sobe se o teste pedir, nunca por um horário fixo a mais.';

  function avisoEstacao(hoje) {
    var mes = Bonsai.datas.mes(hoje);
    return MESES_REGA_DOBRADA.indexOf(mes) >= 0 ? AVISO_REGA_DOBRADA : null;
  }

  function checklist(db, hoje) {
    var aviso = avisoEstacao(hoje);
    return db.arvores
      .filter(function (a) { return a.status === 'ativa'; })
      .map(function (a) {
        var especie = db.especies.filter(function (e) { return e.id === a.especieId; })[0];
        var perfil = perfilEfetivo(a, especie);
        var historico = a.historicoRega || [];
        var ultimaRega = historico.length > 0 ? historico[0] : null;
        var diasDesde = ultimaRega !== null ? Bonsai.datas.diasEntre(ultimaRega, hoje) : null;
        return {
          arvore: a,
          perfil: perfil,
          ultimaRega: ultimaRega,
          diasDesde: diasDesde,
          avisoEstacao: aviso
        };
      });
  }

  return {
    PERFIS: PERFIS,
    perfilEfetivo: perfilEfetivo,
    registrar: registrar,
    intervaloMedioDias: intervaloMedioDias,
    checklist: checklist
  };

})();
