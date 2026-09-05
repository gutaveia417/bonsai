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

        gatilhoFase: {
          tipo: 'diametro', alvoMm: 80, medidoACm: 5,
          proximaFase: 'decepe',
          metodo: 'fita métrica em volta do tronco a 5 cm do solo, dividir por 3,1416'
        },

        historicoRega: [],
        regaOverride: null,
        notas: 'Tronco único com bifurcação em Y baixa.',
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
        estado: 'saudavel',
        estadoDesde: '2026-09-05',
        estadoAte: null,

        vaso: { descricao: 'bacia (transplante pendente)', furada: null, geotextil: null },
        substrato: [],
        posicao: 'sol pleno',
        solHoras: null,

        gatilhoFase: null,

        historicoRega: [],
        regaOverride: null,
        notas: 'Transplante pendente para bacia. Substrato planejado: 20% húmus, 45% substrato comercial, 35% casca de pinus.',
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

        vaso: { descricao: 'torrão original', furada: null, geotextil: null },
        substrato: [],
        posicao: 'meia-sombra, 2–5 h de sol da manhã',
        solHoras: null,

        gatilhoFase: null,

        historicoRega: [],
        regaOverride: null,
        notas: 'Torrão original bom. Terra vermelha na superfície a remover — tarefa aberta.',
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

    eventos: [],

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
        comoFazer: 'Substrato: 20% húmus, 45% substrato comercial, 35% casca de pinus.',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: null,
        eventoAoConcluir: 'transplante'
      },
      {
        id: 'tarefa-serissa-terra-vermelha',
        arvoreId: 'serissa',
        titulo: 'Remover a terra vermelha da superfície',
        comoFazer: 'Retirar a camada de terra vermelha da superfície do torrão e substituir por substrato comercial com casca de pinus.',
        origem: 'seed',
        criadaEm: '2026-09-05',
        concluidaEm: null,
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
