var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.regras = (function () {

  // ---------------------------------------------------------------------
  // Tabela por fase — spec 5.1. Dados, não `if`s: uma linha por ação, para
  // que uma pessoa possa editar o texto sem tocar em lógica.
  // ---------------------------------------------------------------------
  var POR_FASE = {
    // "podar-raiz" (permitido, ato deliberado na janela de transplante) e
    // "podar" (atenção, observação passiva sobre ramo baixo engrossando) são
    // atos físicos diferentes — nunca a mesma acao em listas diferentes.
    //
    // `regar` e `medir` (cuidado básico, spec 5.1 "Cuidado básico") NÃO
    // aparecem aqui: elas vêm da lista NUCLEO, aplicada por fora de fase e
    // estado, para não depender de herança — uma árvore com `fase: null`
    // não tem de quem herdar.
    engorda: {
      permitido: [
        {
          acao: 'adubar',
          texto: 'Adubar dentro da temporada indicada para esta espécie, com fórmula cheia.',
          porque: 'Engorda é a fase de crescimento mais rápido; é quando a planta mais aproveita nutriente para engrossar tronco e galhos.',
          guiaAncora: 'guia#engorda-adubar'
        },
        {
          acao: 'transplantar',
          texto: 'Usar vaso ou bacia do maior tamanho disponível — nunca um vaso de bonsai definitivo.',
          porque: 'Raiz com mais espaço sustenta uma copa maior, e é a copa grande que fabrica a grossura de tronco desta fase.',
          guiaAncora: 'guia#engorda-vaso'
        },
        {
          acao: 'podar-raiz',
          texto: 'Podar raiz apenas dentro da janela de transplante, deixando a copa crescer solta entre uma poda e outra.',
          porque: 'Copa solta é o que gera grossura de tronco; podar raiz na janela certa renova o vaso sem parar o crescimento da parte de cima.',
          guiaAncora: 'guia#engorda-podar-raiz'
        }
      ],
      proibido: [
        {
          acao: 'podar-copa',
          texto: 'Podar a copa ou encurtar o líder.',
          porque: 'Cada folha é uma fábrica de grossura de tronco — cortar a copa agora remove justamente a fonte de energia que engrossa o tronco.',
          guiaAncora: 'guia#engorda-nao-podar-copa'
        }
      ],
      atencao: [
        {
          acao: 'aramar',
          texto: 'Aramar já nesta fase, antes do ramo ganhar consistência de lápis.',
          porque: 'Ramo verde não segura curva — espere o ramo engrossar até parecer um lápis antes de aramar, ou o arame sai sem deixar forma nenhuma.',
          guiaAncora: 'guia#engorda-aramar'
        },
        {
          acao: 'podar',
          texto: 'Ramo baixo que está engrossando muito mais rápido que o restante da copa.',
          porque: 'Um ramo baixo deixado engrossar demais em relação ao tronco deixa uma cicatriz de corte desproporcional quando precisar ser removido depois.',
          guiaAncora: 'guia#engorda-ramo-baixo'
        }
      ]
    },

    decepe: {
      // "decepar" (o corte em si), "decepar cedo/fora de época" e "cuidado,
      // é irreversível" são o mesmo ato físico visto de três ângulos — a
      // spec 5.1 exige acao distinta por lista, então o corte correto e a
      // nota de irreversibilidade ficam no mesmo item de `permitido`, e só
      // o corte no momento errado vira `decepar-precoce` em `proibido`.
      permitido: [
        {
          acao: 'decepar',
          texto: 'Fazer o corte baixo do decepe e selar o corte logo em seguida.',
          porque: 'O selante evita que o corte grande fique exposto a fungo e umidade enquanto caleja. É um corte de um dia só, mas define a estrutura da árvore por anos — depois de decepado não tem como desfazer a escolha de altura e ângulo, então vale conferir duas vezes antes de cortar.',
          guiaAncora: 'guia#decepe-corte'
        },
        {
          acao: 'podar',
          texto: 'Escolher o broto mais forte perto do corte para virar o novo líder.',
          porque: 'O novo líder define a continuação do tronco acima do decepe; escolher cedo evita disputa entre galhos concorrentes.',
          guiaAncora: 'guia#decepe-novo-lider'
        }
      ],
      proibido: [
        {
          acao: 'decepar-precoce',
          texto: 'Decepar antes de o tronco atingir o diâmetro-alvo, ou fora da época de brotação.',
          porque: 'Decepar cedo demais deixa um tronco fino acima do corte, e fora da brotação a árvore não tem reserva de energia para emitir os brotos que vão virar os novos galhos.',
          guiaAncora: 'guia#decepe-nao-antecipar'
        }
      ]
    },

    estrutura: {
      // "podar" (seleção/estruturação) e "podar-copa" (corte grande demais)
      // são atos físicos diferentes, como já vale em engorda/refino; "aramar"
      // (fixar arame) e "conferir-arame" (checar o que já está fixado) idem.
      permitido: [
        {
          acao: 'podar',
          texto: 'Selecionar os galhos primários e fazer a poda de estruturação.',
          porque: 'É nesta fase que a arquitetura geral da árvore é definida, escolhendo quais galhos vão virar a estrutura permanente.',
          guiaAncora: 'guia#estrutura-selecionar-primarios'
        },
        {
          acao: 'aramar',
          texto: 'Aramar os galhos escolhidos para dar direção e movimento.',
          porque: 'Com o tronco já engrossado, o arame passa a servir para fixar as curvas da estrutura permanente, não mais para testar formas.',
          guiaAncora: 'guia#estrutura-aramar'
        }
      ],
      proibido: [
        {
          acao: 'podar-copa',
          texto: 'Remover mais de um terço da folhagem de uma vez.',
          porque: 'Cortar folhagem demais de uma vez pode jogar a árvore em estresse severo e comprometer a energia de recuperação.',
          guiaAncora: 'guia#estrutura-nao-mais-de-um-terco'
        }
      ],
      atencao: [
        // CONTEXTO invariante 5: única exceção de alerta por prazo fixo no
        // app inteiro — pedida explicitamente pelo usuário. Não usar este
        // caso como precedente para inventar outros intervalos fixos.
        {
          acao: 'conferir-arame',
          texto: 'Conferir o arame a cada 30 dias.',
          porque: 'Arame esquecido encrava na casca conforme o galho engrossa; conferir mensalmente evita que a marca vire uma cicatriz permanente.',
          guiaAncora: 'guia#estrutura-conferir-arame'
        }
      ]
    },

    refino: {
      permitido: [
        {
          acao: 'podar',
          texto: 'Clip-and-grow, pinçagem de brotos novos e desfolha parcial.',
          porque: 'Essas técnicas mantêm a ramificação fina e a copa compacta sem exigir cortes grandes que a árvore já não precisa mais.',
          guiaAncora: 'guia#refino-tecnicas'
        }
      ],
      proibido: [
        {
          acao: 'podar-copa',
          texto: 'Cortes grandes que quebram a ramificação fina já formada.',
          porque: 'Na fase de refino a ramificação fina é resultado de anos de trabalho; um corte grande obriga a reconstruir essa ramificação do zero.',
          guiaAncora: 'guia#refino-nao-cortar-grande'
        }
      ],
      atencao: [
        {
          acao: 'adubar',
          texto: 'Usar adubo mais fraco do que nas fases anteriores.',
          porque: 'Adubo forte demais nesta fase engrossa ramos que deveriam ficar finos, atrapalhando a proporção que o refino busca.',
          guiaAncora: 'guia#refino-adubo-fraco'
        }
      ]
    }
  };

  // ---------------------------------------------------------------------
  // Tabela por estado — spec 5.1. Sobrepõe a fase (CONTEXTO invariante 3):
  // quando a mesma ação aparece nas duas tabelas, o item do estado vence e
  // o da fase é removido de todas as listas.
  // ---------------------------------------------------------------------
  var POR_ESTADO = {
    // `regar` e `observar` não aparecem em `permitido` aqui: são cuidado
    // básico (NUCLEO), garantido por fora desta tabela.
    adaptacao: {
      proibido: [
        {
          acao: 'adubar',
          texto: 'Adubar durante a adaptação.',
          porque: 'A planta está se firmando num ambiente novo; adubo agora estressa mais do que ajuda.',
          guiaAncora: 'guia#adaptacao-nao-adubar'
        },
        {
          acao: 'podar',
          texto: 'Podar durante a adaptação.',
          porque: 'Toda poda cria um novo ponto de estresse, e a planta ainda está gastando energia só para se firmar no vaso ou substrato novo.',
          guiaAncora: 'guia#adaptacao-nao-podar'
        },
        {
          acao: 'podar-raiz',
          texto: 'Podar raiz durante a adaptação.',
          porque: 'Poda de raiz só acontece dentro de um transplante, e transplantar de novo agora reinicia o mesmo estresse do qual a planta ainda está se firmando.',
          guiaAncora: 'guia#adaptacao-nao-podar-raiz'
        },
        {
          acao: 'transplantar',
          texto: 'Transplantar de novo durante a adaptação.',
          porque: 'Mexer na raiz outra vez antes dela se firmar reinicia o mesmo estresse do transplante anterior.',
          guiaAncora: 'guia#adaptacao-nao-transplantar'
        },
        {
          acao: 'mudar-lugar',
          texto: 'Mudar a árvore de lugar durante a adaptação.',
          porque: 'Trocar de posição muda luz, vento e temperatura de uma vez, estresse a mais para quem já está se ajustando. Se a folhagem cair sozinha nesse período, sem que ninguém tenha mexido na árvore, é reação normal à mudança de ambiente, não sinal de que ela está morrendo.',
          guiaAncora: 'guia#adaptacao-mudar-lugar'
        }
      ]
    },

    // `regar` não aparece em `permitido` aqui: é cuidado básico (NUCLEO).
    recuperacao: {
      permitido: [
        {
          acao: 'manter-sombra',
          texto: 'Manter no lugar atual, à sombra, sem mudar de lugar.',
          porque: 'Trocar de posição agora soma mais uma variável de estresse a uma planta que já está tentando se recuperar de um dano sério.',
          guiaAncora: 'guia#recuperacao-manter-sombra'
        },
        {
          acao: 'esperar',
          texto: 'Esperar o aparecimento de um broto novo antes de voltar a mexer na árvore.',
          porque: 'Broto novo é o sinal visível de que a planta recuperou energia suficiente para reagir bem a poda, arame ou adubo.',
          guiaAncora: 'guia#recuperacao-esperar-broto'
        }
      ],
      proibido: [
        {
          acao: 'adubar',
          texto: 'Adubar durante a recuperação.',
          porque: 'Uma planta debilitada não tem folhagem saudável suficiente para processar adubo; o excesso de sais pode piorar o dano já existente.',
          guiaAncora: 'guia#recuperacao-nao-adubar'
        },
        {
          acao: 'podar',
          texto: 'Podar durante a recuperação.',
          porque: 'Cortar agora tira reserva de energia justamente da planta que mais precisa dela; espere aparecer um broto novo antes de voltar a mexer.',
          guiaAncora: 'guia#recuperacao-nao-podar'
        },
        {
          acao: 'podar-raiz',
          texto: 'Podar raiz durante a recuperação.',
          porque: 'Poda de raiz só acontece dentro de um transplante, e não há transplante seguro para fazer numa planta que ainda está tentando se recuperar de um dano sério.',
          guiaAncora: 'guia#recuperacao-nao-podar-raiz'
        },
        {
          acao: 'aramar',
          texto: 'Aramar durante a recuperação.',
          porque: 'Fixar arame numa planta debilitada soma estresse mecânico a uma estrutura sem energia para reagir; espere um broto novo antes de aramar de novo.',
          guiaAncora: 'guia#recuperacao-nao-aramar'
        },
        {
          acao: 'transplantar',
          texto: 'Transplantar durante a recuperação.',
          porque: 'Mexer na raiz agora arrisca destruir justamente a raiz que ainda está viva e tentando se recuperar.',
          guiaAncora: 'guia#recuperacao-nao-transplantar'
        }
      ]
    },

    // `regar` não aparece em `permitido` aqui: é cuidado básico (NUCLEO).
    'pos-transplante': {
      proibido: [
        {
          acao: 'adubar',
          texto: 'Adubar até {ate}.',
          porque: 'A raiz cortada no transplante ainda está cicatrizando; adubo agora pode queimar raízes novas antes delas se estabelecerem.',
          guiaAncora: 'guia#pos-transplante-nao-adubar'
        },
        {
          acao: 'podar',
          texto: 'Podar até {ate}.',
          porque: 'A planta está gastando energia para reconstruir raiz cortada; qualquer poda agora compete com essa prioridade.',
          guiaAncora: 'guia#pos-transplante-nao-podar'
        },
        {
          acao: 'podar-raiz',
          texto: 'Podar raiz de novo até {ate}.',
          porque: 'A raiz já foi cortada uma vez neste transplante recente; cortar de novo agora não deixa tempo para cicatrizar antes de emitir raízes novas.',
          guiaAncora: 'guia#pos-transplante-nao-podar-raiz'
        },
        {
          acao: 'transplantar',
          texto: 'Transplantar de novo até {ate}.',
          porque: 'Uma árvore recém-transplantada é a que menos aguenta ser transplantada de novo — a raiz ainda está cicatrizando do corte anterior.',
          guiaAncora: 'guia#pos-transplante-nao-transplantar'
        }
      ],
      atencao: [
        {
          acao: 'manter-sombra',
          texto: 'Manter à sombra por 3 a 4 semanas depois do transplante.',
          porque: 'Sol direto demais logo depois do transplante aumenta a perda de água pela folhagem, e a raiz ainda cortada não consegue repor o que se perde.',
          guiaAncora: 'guia#pos-transplante-sombra'
        }
      ]
    }
  };

  // ---------------------------------------------------------------------
  // Cuidado básico — spec 5.1 "Cuidado básico": regar, observar e medir são
  // sempre ✅, em qualquer fase (inclusive `fase: null`) e qualquer estado,
  // sem exceção. Nenhuma delas toca na planta, e `medir` é o dado que
  // governa a troca de fase — por isso vivem como lista própria, aplicada
  // depois de fase e estado, em vez de espalhadas pelas tabelas: uma árvore
  // com `fase: null` não tem de quem herdar, e foi assim que a Serissa e a
  // Azaleia ficaram sem `medir` na primeira versão.
  // ---------------------------------------------------------------------
  var NUCLEO = [
    {
      acao: 'regar',
      texto: 'Regar conforme o perfil de rega efetivo desta espécie.',
      porque: 'Regar não é intervenção, é manutenção básica que uma planta viva sempre precisa — nenhuma fase e nenhum estado tornam isso arriscado.',
      guiaAncora: 'guia#nucleo-regar'
    },
    {
      acao: 'observar',
      texto: 'Observar, anotar e fotografar o estado atual da árvore, sem mexer.',
      porque: 'Observar não toca na planta; é assim que se percebe cedo um sinal de melhora ou piora, em qualquer fase ou estado.',
      guiaAncora: 'guia#nucleo-observar'
    },
    {
      acao: 'medir',
      texto: 'Medir o tronco com fita métrica.',
      porque: 'Medir não toca na planta, e é o único dado real que decide quando uma árvore em engorda está pronta para o corte de decepe — esconder a medição esconde essa decisão.',
      guiaAncora: 'guia#nucleo-medir'
    }
  ];

  // Estados em que uma ✅ vinda só da fase, sem re-autorização explícita do
  // próprio estado, deixa de ser ✅ e vira ⚠️ (spec 5.1 "Estado restritivo
  // nega por omissão"). `saudavel` não entra aqui: nele a fase manda sozinha.
  var ESTADOS_RESTRITIVOS = { adaptacao: true, recuperacao: true, 'pos-transplante': true };

  var NOTA_ESTADO_RESTRITIVO = {
    adaptacao: {
      nome: 'adaptação',
      checar: 'espere a árvore firmar no ambiente novo antes de considerar isto'
    },
    recuperacao: {
      nome: 'recuperação',
      checar: 'espere aparecer um broto novo antes de considerar isto'
    },
    'pos-transplante': {
      nome: 'pós-transplante',
      checar: 'espere terminar a carência do transplante antes de considerar isto'
    }
  };

  function rebaixarPorEstado(item, estado) {
    var nota = NOTA_ESTADO_RESTRITIVO[estado];
    return {
      acao: item.acao,
      texto: item.texto + ' Normalmente permitido nesta fase, mas a árvore está em ' + nota.nome + ' agora.',
      porque: item.porque + ' Enquanto o estado for ' + nota.nome + ', ' + nota.checar + '.',
      guiaAncora: item.guiaAncora,
      origem: 'fase'
    };
  }

  function copiarItem(item, origem) {
    return { acao: item.acao, texto: item.texto, porque: item.porque, guiaAncora: item.guiaAncora, origem: origem };
  }

  function interpolar(texto, arvore) {
    if (texto.indexOf('{ate}') === -1) return texto;
    var ate = arvore.estadoAte ? Bonsai.datas.formatarBR(arvore.estadoAte) : '';
    return texto.split('{ate}').join(ate);
  }

  // Campo `null` em especie.adubo nunca vira permissão (spec 4.7.1): decide
  // se o item de adubo da fase entra em permitido ou vira atenção.
  function avaliarAdubarFase(item, especie, hoje) {
    var adubo = (especie && especie.adubo) || {};

    if (adubo.formula === null || adubo.formula === undefined) {
      return {
        lista: 'atencao',
        texto: 'Fórmula de adubo não definida para esta espécie.',
        porque: 'Cada fórmula de adubo tem uma proporção diferente de NPK; aplicar uma fórmula chutada pode faltar o nutriente que esta espécie mais precisa agora, ou sobrar em excesso e queimar raiz.',
        guiaAncora: 'guia#adubo-formula-nao-definida'
      };
    }

    if (adubo.temporada === null || adubo.temporada === undefined) {
      return {
        lista: 'atencao',
        texto: 'Época de adubação não definida para esta espécie.',
        porque: 'Adubar fora da época de crescimento ativo desperdiça nutriente e pode estressar raízes que não estão absorvendo; sem saber os meses certos desta espécie, não dá para saber se hoje ajuda ou atrapalha.',
        guiaAncora: 'guia#adubo-temporada-nao-definida'
      };
    }

    // `temporada: []` é afirmação, não ausência de dado (spec 4.7.1): esta
    // espécie explicitamente não é adubada em mês nenhum. Diferente de
    // `null`, que só significa "ninguém informou ainda".
    if (adubo.temporada.length === 0) {
      return {
        lista: 'proibido',
        texto: 'Adubar esta espécie.',
        porque: 'A temporada de adubo desta espécie foi definida como nenhuma — esta espécie explicitamente não recebe adubo em mês algum.',
        guiaAncora: 'guia#adubo-nunca'
      };
    }

    var mesHoje = Bonsai.datas.mes(hoje);
    var emTemporada = adubo.temporada.indexOf(mesHoje) >= 0;
    if (emTemporada) {
      return { lista: 'permitido', texto: item.texto, porque: item.porque, guiaAncora: item.guiaAncora };
    }

    return {
      lista: 'atencao',
      texto: 'Fora da temporada de adubo desta espécie.',
      porque: 'Adubar fora da época de crescimento ativo desperdiça nutriente e pode estressar a planta em repouso.',
      guiaAncora: 'guia#adubo-fora-de-temporada'
    };
  }

  function paraArvore(arvore, especie, hoje) {
    var resultado = { permitido: [], proibido: [], atencao: [] };

    // fase pode legitimamente ser null (chegada recente, em recuperação) —
    // nunca inventar uma fase padrão (CONTEXTO invariante 1).
    if (arvore.fase === null) {
      resultado.atencao.push({
        acao: 'definir-fase',
        texto: 'Fase ainda não definida — defina quando a árvore estiver pronta.',
        porque: 'Sem uma fase definida não dá para saber quais ações fazem sentido agora nem o que evitar; a tarefa aberta ajuda a decidir isso.',
        guiaAncora: 'guia#fase-indefinida',
        origem: 'fase'
      });
    } else {
      var tabelaFase = POR_FASE[arvore.fase];
      if (tabelaFase) {
        ['permitido', 'proibido', 'atencao'].forEach(function (lista) {
          (tabelaFase[lista] || []).forEach(function (item) {
            if (lista === 'permitido' && item.acao === 'adubar') {
              var avaliado = avaliarAdubarFase(item, especie, hoje);
              resultado[avaliado.lista].push({
                acao: 'adubar',
                texto: avaliado.texto,
                porque: avaliado.porque,
                guiaAncora: avaliado.guiaAncora,
                origem: 'fase'
              });
            } else {
              resultado[lista].push(copiarItem(item, 'fase'));
            }
          });
        });
      }
    }

    // pos-transplante expira: passada a data de estadoAte, o estado deixa
    // de valer e a fase volta a mandar sozinha.
    var estadoAplica = true;
    if (arvore.estado === 'pos-transplante' && arvore.estadoAte) {
      if (Bonsai.datas.diasEntre(arvore.estadoAte, hoje) > 0) estadoAplica = false;
    }

    var itensEstado = [];
    if (estadoAplica) {
      var tabelaEstado = POR_ESTADO[arvore.estado];
      if (tabelaEstado) {
        ['permitido', 'proibido', 'atencao'].forEach(function (lista) {
          (tabelaEstado[lista] || []).forEach(function (item) {
            itensEstado.push({
              lista: lista,
              acao: item.acao,
              texto: interpolar(item.texto, arvore),
              porque: item.porque,
              guiaAncora: item.guiaAncora
            });
          });
        });
      }
    }

    // Estado vence fase (CONTEXTO invariante 3): quando a mesma ação existe
    // no estado, o item da fase é removido de todas as listas, e o item do
    // estado é quem aparece — nunca os dois na tela.
    var acoesEstado = {};
    itensEstado.forEach(function (i) { acoesEstado[i.acao] = true; });

    ['permitido', 'proibido', 'atencao'].forEach(function (lista) {
      resultado[lista] = resultado[lista].filter(function (i) {
        return !(i.origem === 'fase' && acoesEstado[i.acao]);
      });
    });

    itensEstado.forEach(function (i) {
      resultado[i.lista].push({
        acao: i.acao, texto: i.texto, porque: i.porque, guiaAncora: i.guiaAncora, origem: 'estado'
      });
    });

    // Estado restritivo nega por omissão (spec 5.1): numa árvore em
    // adaptacao/recuperacao/pos-transplante, uma ✅ que sobrou da fase (ou
    // seja, o estado não tinha nada com essa acao, então não foi
    // substituída no passo de dedupe acima) não fica ✅ por herança
    // silenciosa — vira ⚠️, citando o estado e o que checar antes. Isso
    // fecha a classe de bug do "transplantar" liberado 4 dias após o
    // transplante: aqui não é mais um caso específico corrigido, é a regra.
    if (estadoAplica && ESTADOS_RESTRITIVOS[arvore.estado]) {
      var mantidos = [];
      resultado.permitido.forEach(function (item) {
        if (item.origem === 'fase') {
          resultado.atencao.push(rebaixarPorEstado(item, arvore.estado));
        } else {
          mantidos.push(item);
        }
      });
      resultado.permitido = mantidos;
    }

    // Cuidado básico (spec 5.1): regar, observar e medir são sempre ✅,
    // aplicados por último e só se nenhuma tabela mais específica (fase ou
    // estado) já tiver colocado essa acao em alguma lista — o item mais
    // específico vence, nunca há a mesma acao duas vezes.
    var acoesPresentes = {};
    ['permitido', 'proibido', 'atencao'].forEach(function (lista) {
      resultado[lista].forEach(function (item) { acoesPresentes[item.acao] = true; });
    });
    NUCLEO.forEach(function (item) {
      if (!acoesPresentes[item.acao]) {
        resultado.permitido.push({
          acao: item.acao, texto: item.texto, porque: item.porque, guiaAncora: item.guiaAncora, origem: 'nucleo'
        });
      }
    });

    return resultado;
  }

  return {
    POR_FASE: POR_FASE,
    POR_ESTADO: POR_ESTADO,
    paraArvore: paraArvore
  };

})();
