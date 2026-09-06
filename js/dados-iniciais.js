var Bonsai = (typeof window !== 'undefined'
  ? (window.Bonsai = window.Bonsai || {})
  : (globalThis.Bonsai = globalThis.Bonsai || {}));

Bonsai.dadosIniciais = (function () {

  // Janela de transplante é clima regional (Naviraí: agosto-setembro), não
  // biologia de espécie — ver guia seção 6. Constante única para não sugerir
  // que cada espécie tem sua própria janela, sem evidência para isso.
  var JANELA_TRANSPLANTE_NAVIRAI = [8, 9];

  var MODELO = {
    schemaVersion: 1,
    ajustes: { ocultarFotosNaImpressao: false },

    especies: [
      {
        id: 'jabuticaba',
        nomeComum: 'Jabuticaba',
        nomeCientifico: 'Plinia cauliflora',
        rega: 'sempre-umido',
        regaNota: 'Nunca deixar secar.',
        luz: { horasMin: 5, horasMax: 6, descricao: 'sol da manhã até ~13h' },
        adubo: {
          formula: '20-05-20',
          frequencia: 'quinzenal',
          temporada: [9, 10, 11, 12, 1, 2, 3],
          dose: 'cheia',
          carencia: 'só 3–4 semanas depois do transplante',
          notas: []
        },
        janelaTransplante: JANELA_TRANSPLANTE_NAVIRAI,
        podaQuando: null,
        cuidados: ['Tronco único com bifurcação em Y baixa nesta árvore.'],
        armadilhas: ['Podar a copa em engorda — cada folha é uma fábrica de grossura de tronco.']
      },
      {
        id: 'bougainvillea',
        nomeComum: 'Primavera',
        nomeCientifico: 'Bougainvillea',
        rega: 'secar-entre-regas',
        regaNota: 'Morre mais por excesso do que por falta.',
        luz: { horasMin: null, horasMax: null, descricao: 'sol pleno desde o primeiro dia' },
        adubo: {
          formula: '10-10-10',
          frequencia: null,
          temporada: null,
          dose: null,
          carencia: null,
          notas: ['Frequência, época e dose não foram informadas — só a fórmula. Definir antes da primeira adubação.']
        },
        janelaTransplante: JANELA_TRANSPLANTE_NAVIRAI,
        podaQuando: null,
        cuidados: [
          'Floração se induz por estresse hídrico (reduzir rega 2–3 semanas), não por adubo.',
          'Espinhos nas axilas das folhas.'
        ],
        armadilhas: ['Regar em excesso achando que ajuda a floração.']
      },
      {
        id: 'serissa',
        nomeComum: 'Serissa',
        nomeCientifico: 'Serissa foetida variegata',
        rega: 'nem-secar-nem-encharcar',
        regaNota: 'Meio-termo, sem extremos.',
        luz: { horasMin: 2, horasMax: 5, descricao: 'meia-sombra, 2–5 h de sol da manhã' },
        adubo: {
          formula: '10-10-10',
          frequencia: 'quinzenal',
          temporada: null,
          dose: 'meia',
          carencia: null,
          notas: ['Época de adubação não foi informada.']
        },
        janelaTransplante: JANELA_TRANSPLANTE_NAVIRAI,
        podaQuando: null,
        cuidados: ['Sensível a sal no substrato.', 'Derruba folha a cada mudança de lugar.'],
        armadilhas: ['Mudar de lugar sem necessidade — a queda de folha assusta mas é normal.']
      },
      {
        id: 'rhododendron',
        nomeComum: 'Azaleia',
        nomeCientifico: 'Rhododendron',
        rega: 'sempre-umido',
        regaNota: 'Acidófila — substrato ácido não pode secar (regra geral de espécie saudável).',
        luz: { horasMin: null, horasMax: null, descricao: 'sombra' },
        adubo: {
          formula: null,
          frequencia: null,
          temporada: null,
          dose: null,
          carencia: null,
          notas: [
            'Nenhuma fórmula base de adubo foi informada para esta espécie — definir antes da primeira adubação.',
            'Enquanto o estado da árvore for recuperação, adubo fica bloqueado independente desta fórmula (ver estado).'
          ]
        },
        janelaTransplante: JANELA_TRANSPLANTE_NAVIRAI,
        podaQuando: 'só depois da floração',
        cuidados: [
          'Poda só depois da floração — forma os botões do ano seguinte logo após florir.',
          'Substrato ácido com casca de pinus.'
        ],
        armadilhas: ['Podar antes da floração e perder os botões do ano seguinte.']
      },
      {
        id: 'ficus-panda',
        nomeComum: 'Ficus Panda',
        nomeCientifico: "Ficus microcarpa 'Panda'",
        rega: 'sempre-umido',
        regaNota: 'Água constante.',
        luz: { horasMin: null, horasMax: null, descricao: 'sol pleno' },
        adubo: {
          formula: '10-10-10',
          frequencia: 'quinzenal',
          temporada: null,
          dose: null,
          carencia: null,
          notas: ['Dose e época de adubação não foram informadas.']
        },
        janelaTransplante: JANELA_TRANSPLANTE_NAVIRAI,
        podaQuando: null,
        cuidados: ['Aramação em engorda aparece como atenção, não proibida — ramo verde não segura curva.'],
        armadilhas: ['Aramar cedo demais, antes de consistência de lápis.']
      }
    ],

    arvores: [
      {
        id: 'jabuticaba',
        apelido: 'Jabuticaba',
        especieId: 'jabuticaba',
        status: 'ativa',
        dataAquisicao: null,

        fase: 'engorda',
        faseDefinidaEm: '2026-09-05',
        estado: 'pos-transplante',
        estadoDesde: '2026-09-01',
        estadoAte: '2026-10-03',

        vaso: { descricao: 'bacia grande', furada: true, geotextil: '130 g/m²' },
        substrato: [
          { componente: 'terra vegetal', pct: 40 },
          { componente: 'substrato comercial', pct: 40 },
          { componente: 'casca de pinus', pct: 20 }
        ],
        posicao: 'sol da manhã até ~13h',
        solHoras: 6,
        // Nunca mencionada pelo dono para esta árvore — null, não 'nenhuma'
        // (spec 4.7.1: 'nenhuma' afirmaria a ausência, que ninguém confirmou).
        coberturaSuperficie: null,

        gatilhoFase: {
          tipo: 'diametro', alvoMm: 80, medidoACm: 5,
          proximaFase: 'decepe',
          metodo: 'fita métrica em volta do tronco a 5 cm do solo, dividir por 3,1416'
        },

        historicoRega: [],
        regaOverride: null,
        notas: 'Tronco único com bifurcação em Y baixa. Em 01/09/2026, bordas do ' +
          'torrão soltas com os dedos; o núcleo do torrão ficou intacto. A intenção ' +
          'era cortar raiz circulante se encontrasse, mas não há certeza se chegou a ' +
          'cortar — raiz mexida nas bordas, corte não confirmado.',
        grupo: null
      },
      {
        id: 'primavera',
        apelido: 'Primavera',
        especieId: 'bougainvillea',
        status: 'ativa',
        dataAquisicao: null,

        fase: 'engorda',
        faseDefinidaEm: '2026-09-05',
        estado: 'pos-transplante',
        estadoDesde: '2026-09-05',
        // Carência de 4 semanas, não as 3-4 do padrão do estado: escolha do
        // dono depois do torrão quebrado (ver notas). 05/09 + 28 dias.
        estadoAte: '2026-10-03',

        vaso: { descricao: 'bacia', furada: null, geotextil: null },
        substrato: [
          { componente: 'húmus', pct: 40, estimado: true },
          { componente: 'substrato comercial', pct: 40, estimado: true },
          { componente: 'casca de pinus', pct: 20, estimado: true }
        ],
        // Movida para meia-sombra por causa do torrão quebrado — ver notas.
        // Não é mais "sol pleno desde o primeiro dia" da espécie: overrida
        // aqui, com o motivo registrado, nunca sobrescrita em silêncio.
        posicao: 'meia-sombra (temporário, por causa do torrão quebrado)',
        solHoras: null,
        coberturaSuperficie: 'casca',

        gatilhoFase: null,

        historicoRega: [],
        regaOverride: null,
        notas: 'Transplantada para bacia em 05/09/2026, na mesma leva da Serissa. ' +
          'O torrão se desfez quase por completo e as raízes ficaram expostas; ' +
          'nenhuma raiz foi cortada. Substrato aproximado por estimativa do dono, ' +
          'por volume (não medido): 40% húmus, 40% substrato comercial, 20% casca ' +
          'de pinus. Casca de pinus foi espalhada na superfície do substrato, por ' +
          'estética. Movida para meia-sombra por causa do torrão quebrado — estava ' +
          'em sol pleno antes.',
        grupo: null
      },
      {
        id: 'serissa',
        apelido: 'Serissa',
        especieId: 'serissa',
        status: 'ativa',
        dataAquisicao: null,

        fase: null,
        faseDefinidaEm: null,
        estado: 'adaptacao',
        estadoDesde: '2026-09-05',
        estadoAte: null,

        vaso: { descricao: 'bacia', furada: null, geotextil: null },
        substrato: [
          { componente: 'húmus', pct: 40, estimado: true },
          { componente: 'substrato comercial', pct: 40, estimado: true },
          { componente: 'casca de pinus', pct: 20, estimado: true }
        ],
        posicao: 'meia-sombra, 2–5 h de sol da manhã',
        solHoras: null,
        coberturaSuperficie: 'casca',

        gatilhoFase: null,

        historicoRega: [],
        regaOverride: null,
        notas: 'Transplantada para bacia em 05/09/2026, na mesma leva da Primavera. ' +
          'Terra vermelha da superfície foi removida; havia terra vermelha também por ' +
          'baixo, ao tirar do vaso. Raiz foi mexida nesse processo, mas não foi ' +
          'cortada nem o torrão foi quebrado — por isso é provável que ainda reste ' +
          'terra vermelha dentro do torrão. Ninguém viu isso; é suspeita, não fato ' +
          'confirmado. Se ela demorar mais para secar que as outras árvores, essa ' +
          'terra vermelha remanescente é a explicação mais provável — isso não é ' +
          'motivo para regar as outras árvores com menos frequência. Substrato ' +
          'aproximado por estimativa do dono, por volume (não medido): 40% húmus, ' +
          '40% substrato comercial, 20% casca de pinus. Casca de pinus foi espalhada ' +
          'na superfície do substrato, por estética.',
        grupo: null
      },
      {
        id: 'azaleia',
        apelido: 'Azaleia',
        especieId: 'rhododendron',
        status: 'ativa',
        dataAquisicao: null,

        fase: null,
        faseDefinidaEm: null,
        estado: 'recuperacao',
        estadoDesde: '2026-09-05',
        estadoAte: null,

        vaso: { descricao: 'vaso atual', furada: null, geotextil: null },
        substrato: [],
        posicao: 'sombra',
        solHoras: null,
        coberturaSuperficie: null,

        gatilhoFase: null,

        historicoRega: [],
        regaOverride: {
          perfil: 'umido-vigiado',
          nota: 'Causa do dano não confirmada — excesso de água é uma das hipóteses. Não regue sem testar.',
          enquantoEstado: 'recuperacao'
        },
        notas: 'Dano severo. Câmbio verde na base testado com a unha. Aguardando broto novo.',
        grupo: null
      },
      {
        id: 'ficus-a',
        apelido: 'Ficus A',
        especieId: 'ficus-panda',
        status: 'a-chegar',
        dataAquisicao: null,

        fase: 'engorda',
        faseDefinidaEm: '2026-09-05',
        estado: 'saudavel',
        estadoDesde: '2026-09-05',
        estadoAte: null,

        vaso: { descricao: null, furada: null, geotextil: null },
        substrato: [],
        posicao: 'sol pleno',
        solHoras: null,
        coberturaSuperficie: null,

        gatilhoFase: null,

        historicoRega: [],
        regaOverride: null,
        notas: 'Compra feita, aguardando entrega. Controle do experimento — sem arame.',
        grupo: 'experimento-ficus',
        planoExperimento: {
          fase1: 'Fase 1 (6–12 meses): os três soltos, tratamento idêntico, sem arame.',
          fase2: 'Fase 2: quando os ramos tiverem consistência de lápis, aramar B e C com abordagens diferentes; A é o controle, sem arame.'
        }
      },
      {
        id: 'ficus-b',
        apelido: 'Ficus B',
        especieId: 'ficus-panda',
        status: 'a-chegar',
        dataAquisicao: null,

        fase: 'engorda',
        faseDefinidaEm: '2026-09-05',
        estado: 'saudavel',
        estadoDesde: '2026-09-05',
        estadoAte: null,

        vaso: { descricao: null, furada: null, geotextil: null },
        substrato: [],
        posicao: 'sol pleno',
        solHoras: null,
        coberturaSuperficie: null,

        gatilhoFase: null,

        historicoRega: [],
        regaOverride: null,
        notas: 'Compra feita, aguardando entrega.',
        grupo: 'experimento-ficus',
        planoExperimento: {
          fase1: 'Fase 1 (6–12 meses): os três soltos, tratamento idêntico, sem arame.',
          fase2: 'Fase 2: quando os ramos tiverem consistência de lápis, aramar B e C com abordagens diferentes; A é o controle, sem arame.'
        }
      },
      {
        id: 'ficus-c',
        apelido: 'Ficus C',
        especieId: 'ficus-panda',
        status: 'a-chegar',
        dataAquisicao: null,

        fase: 'engorda',
        faseDefinidaEm: '2026-09-05',
        estado: 'saudavel',
        estadoDesde: '2026-09-05',
        estadoAte: null,

        vaso: { descricao: null, furada: null, geotextil: null },
        substrato: [],
        posicao: 'sol pleno',
        solHoras: null,
        coberturaSuperficie: null,

        gatilhoFase: null,

        historicoRega: [],
        regaOverride: null,
        notas: 'Compra feita, aguardando entrega.',
        grupo: 'experimento-ficus',
        planoExperimento: {
          fase1: 'Fase 1 (6–12 meses): os três soltos, tratamento idêntico, sem arame.',
          fase2: 'Fase 2: quando os ramos tiverem consistência de lápis, aramar B e C com abordagens diferentes; A é o controle, sem arame.'
        }
      }
    ],

    // Três transplantes reais de 2026 (relato do dono, ver CONTEXTO.md
    // invariante 1). Nenhuma raiz foi cortada nas três — `podaRaizFracao` é
    // `null` nas três, nunca `0`: `0` afirmaria "cortou zero", e para a
    // Jabuticaba isso é exatamente o que ele não sabe dizer. A certeza (ou a
    // falta dela) de cada árvore vive em `nota`, em palavras, não no número.
    eventos: [
      {
        id: 'evento-jabuticaba-transplante-2026-09-01',
        arvoreId: 'jabuticaba',
        data: '2026-09-01',
        tipo: 'transplante',
        nota: 'Bordas do torrão soltas com os dedos; o núcleo do torrão ficou ' +
          'intacto. A intenção era cortar raiz circulante se encontrasse, mas não ' +
          'há certeza se chegou a cortar — raiz mexida nas bordas, corte não confirmado.',
        dados: {
          vaso: { descricao: 'bacia grande', furada: true, geotextil: '130 g/m²' },
          substrato: [
            { componente: 'terra vegetal', pct: 40 },
            { componente: 'substrato comercial', pct: 40 },
            { componente: 'casca de pinus', pct: 20 }
          ],
          podaRaizFracao: null
        },
        fotoId: null
      },
      {
        id: 'evento-serissa-transplante-2026-09-05',
        arvoreId: 'serissa',
        data: '2026-09-05',
        tipo: 'transplante',
        nota: 'Raízes mexidas ao remover a terra vermelha da superfície e a que ' +
          'havia por baixo, ao tirar do vaso; nenhuma raiz foi cortada.',
        dados: {
          vaso: { descricao: 'bacia', furada: null, geotextil: null },
          substrato: [
            { componente: 'húmus', pct: 40, estimado: true },
            { componente: 'substrato comercial', pct: 40, estimado: true },
            { componente: 'casca de pinus', pct: 20, estimado: true }
          ],
          podaRaizFracao: null
        },
        fotoId: null
      },
      {
        id: 'evento-primavera-transplante-2026-09-05',
        arvoreId: 'primavera',
        data: '2026-09-05',
        tipo: 'transplante',
        nota: 'O torrão se desfez quase por completo e as raízes ficaram ' +
          'expostas; nenhuma raiz foi cortada.',
        dados: {
          vaso: { descricao: 'bacia', furada: null, geotextil: null },
          substrato: [
            { componente: 'húmus', pct: 40, estimado: true },
            { componente: 'substrato comercial', pct: 40, estimado: true },
            { componente: 'casca de pinus', pct: 20, estimado: true }
          ],
          podaRaizFracao: null
        },
        fotoId: null
      }
    ],

    tarefas: [
      {
        id: 'tarefa-jabuticaba-medir',
        arvoreId: 'jabuticaba',
        titulo: 'Medir o tronco pela primeira vez',
        comoFazer: 'Fita métrica em volta do tronco a 5 cm do solo, dividir por 3,1416 para obter o diâmetro.',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: null,
        eventoAoConcluir: 'medicao'
      },
      {
        id: 'tarefa-primavera-transplante',
        arvoreId: 'primavera',
        titulo: 'Transplantar para bacia',
        comoFazer: 'Feito em 05/09/2026. Substrato usado: ~40% húmus, ~40% substrato ' +
          'comercial, ~20% casca de pinus (estimativa do dono, por volume, não medido).',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: '2026-09-05',
        eventoAoConcluir: 'transplante'
      },
      {
        id: 'tarefa-serissa-terra-vermelha',
        arvoreId: 'serissa',
        titulo: 'Remover a terra vermelha da superfície',
        comoFazer: 'Retirar a camada de terra vermelha da superfície do torrão e substituir por substrato comercial com casca de pinus.',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: '2026-09-05',
        eventoAoConcluir: null
      },
      {
        id: 'tarefa-serissa-definir-fase',
        arvoreId: 'serissa',
        titulo: 'Definir a fase',
        comoFazer: 'Depois que a árvore terminar a adaptação, avaliar e definir a fase (engorda, decepe, estrutura ou refino).',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: null,
        eventoAoConcluir: null
      },
      {
        id: 'tarefa-azaleia-definir-fase',
        arvoreId: 'azaleia',
        titulo: 'Definir a fase',
        comoFazer: 'Depois que a árvore brotar, avaliar e definir a fase (engorda, decepe, estrutura ou refino).',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: null,
        eventoAoConcluir: null
      },
      {
        id: 'tarefa-azaleia-data-aquisicao',
        arvoreId: 'azaleia',
        titulo: 'Preencher a data de aquisição',
        comoFazer: 'Registrar a data em que a Azaleia foi adquirida, quando lembrada ou encontrada.',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: null,
        eventoAoConcluir: null
      },
      {
        id: 'tarefa-ficus-chegada',
        arvoreId: null,
        grupo: 'experimento-ficus',
        titulo: 'Registrar a chegada dos Ficus A/B/C',
        comoFazer: 'Ao chegarem: mudar status para ativa, preencher a data de aquisição e registrar o substrato usado em cada um.',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: null,
        eventoAoConcluir: null
      }
    ],

    alertasDispensados: []
  };

  return {
    montar: function () {
      return JSON.parse(JSON.stringify(MODELO));
    }
  };

})();
