# CONTEXTO — leia antes de escrever qualquer linha

Você é um agente novo neste projeto. Este arquivo existe porque as decisões
abaixo **não são as opções mais óbvias** — várias delas foram propostas de um
jeito, discutidas e revertidas. O raciocínio da reversão está no histórico de uma
conversa que você não tem. Se você seguir seu instinto em vez deste arquivo, vai
reintroduzir exatamente o que foi descartado.

**Nenhum dos invariantes abaixo é negociável sem falar com o dono do projeto.**

Documentos: spec em `docs/superpowers/specs/2026-09-05-bonsai-app-design.md`,
plano em `docs/superpowers/plans/2026-09-05-app-bonsai.md`. Este arquivo tem
precedência sobre os dois em caso de conflito.

---

## 1. Nunca semeie um número que o usuário não forneceu

Campo vazio com tarefa aberta **ganha** de valor plausível.

**Caso de referência:** o usuário estimou por foto que o tronco da Jabuticaba tem
~2,5 cm. Ele nunca mediu com fita nem paquímetro. Esse número **não entra** como
medição. O gráfico dela nasce vazio, e existe uma tarefa aberta ensinando o
método (fita em volta a 5 cm do solo, dividir por 3,1416).

Consequência que é fácil errar: **enquanto não houver medição real, não existe
barra de progresso nem percentual em lugar nenhum.** O card mostra o alvo
(80 mm) e o método. Nunca "31% do caminho".

O mesmo critério vale para a fase da Serissa e da Azaleia (`fase: null`, não
`'engorda'`), para o substrato dos Ficus (`[]`, não uma mistura inventada), e
para a data de aquisição da Azaleia (`null`).

**Como verificar:** `testes/casos/seed.test.js` falha se aparecer medição no seed.

## 2. Imagem gerada por IA: proibida nos slots técnicos

Nos seis slots técnicos — nebari, conicidade, decepe, arame encravado, raiz
circulante, substrato — **IA é proibida**. O usuário é iniciante e usa essas
imagens como gabarito de reconhecimento; anatomia plausível-mas-errada ensina
errado sem dar como perceber. Ordem: foto livre → diagrama SVG → slot pendente
com botão de câmera.

Nos cinco slots de espécie formada, IA seria permitida, mas **foto real ganha de
ilustração** e todos os cinco já têm foto real. Hoje o projeto tem **zero**
imagens de IA. Mantenha assim.

Licença livre é requisito **mínimo, não suficiente**: uma foto que não ensina o
que a legenda promete deve ser rejeitada mesmo estando em domínio público.

Toda legenda diz **o que olhar** na imagem, não o nome do que ela é.

## 3. Estado vence fase quando os dois conflitam

`fase` é doutrina de bonsai (engorda / decepe / estrutura / refino, ou `null`).
`estado` é a situação temporária da planta (saudavel / adaptacao / recuperacao /
pos-transplante).

Quando a mesma ação aparece nas duas tabelas, **o item do estado vence e o da
fase é removido** — nunca os dois na tela.

**Caso de referência:** a Azaleia em `engorda` normalmente liberaria adubo. Em
`recuperacao`, o app mostra adubo **⛔ bloqueado**, com `origem: 'estado'`.

Isso existe para não precisar inventar uma quinta fase falsa.

## 4. A Azaleia usa `umido-vigiado`, nunca `sempre-umido`

Parece errado à primeira vista: azaleia é acidófila e substrato ácido não pode
secar. Esse raciocínio vale para uma azaleia **saudável**. A desta pessoa está em
recuperação de dano severo cuja causa **nunca foi confirmada**, e as hipóteses em
aberto incluem **raiz apodrecida por excesso de água** — havia musgo verde na
superfície do substrato.

Instruir "sempre úmido" pode mandar o usuário repetir o que machucou a planta.

Implementação: `regaOverride` com `enquantoEstado: 'recuperacao'`, que expira
sozinho quando o estado muda para `saudavel`. O override **não é apagado** ao
expirar, fica inerte. A nota *"Causa do dano não confirmada — excesso de água é
uma das hipóteses. Não regue sem testar."* aparece na ficha **e** no checklist de
rega, porque é no checklist que a decisão errada seria tomada.

Nunca resolva perfil de rega direto de `especie.rega`. Use sempre
`Bonsai.rega.perfilEfetivo(arvore, especie)`.

## 5. Alertas por janela de época ou por medida, nunca por prazo fixo

Nada de "adubar a cada 15 dias" como contador cego, nada de "transplantar em 180
dias". As regras reais são: janela de época (transplante abre em agosto em
Naviraí) e gatilho por medida (decepe quando o tronco chegar a 80 mm).

**Única exceção autorizada:** conferência de arame a cada 30 dias. Foi pedida
explicitamente pelo usuário. Comente no código citando esta exceção, para que
ninguém a use como precedente.

Carência bloqueia alerta: enquanto a Jabuticaba estiver em `pos-transplante`, o
alerta de adubo não é gerado — no lugar vai o motivo e a data de liberação
(03/10/2026).

## 6. Severidade: aramar cedo é ⚠️, podar a copa em engorda é ⛔

Aramar em `engorda` **não é proibido**, é prematuro. Aparece em `atencao`, com a
nota *"ramo verde não segura curva — espere consistência de lápis"*. Isso importa
para os três Ficus, cujo experimento prevê aramação na fase 2.

O que é **proibido** em engorda é **podar a copa** — cada folha é uma fábrica de
grossura de tronco.

## 7. São sete árvores, e nenhuma é rosa do deserto

Jabuticaba, Primavera, Serissa, Azaleia, Ficus A, Ficus B, Ficus C. Só.

**Adenium obesum / rosa do deserto não existe neste projeto.** As que apareceram
em fotos eram de outras pessoas. A mistura para suculentas pode aparecer no guia
como referência geral, sem vínculo com nenhuma árvore.

**Como verificar:** `grep -ri "adenium\|rosa do deserto" . --exclude-dir=.git`
deve voltar vazio.

---

## Restrições técnicas que quebram o app se ignoradas

- **Sem ES modules.** `<script>` clássico estendendo `var Bonsai = window.Bonsai
  || {}`. Módulos ES não carregam via `file://` e o app precisa abrir como
  arquivo local.
- **Sem dependências.** Nenhum `npm install`, nenhuma CDN, nenhum build step.
- **`color-scheme: light` forçado.** Nenhum bloco `prefers-color-scheme: dark` —
  o iOS inverte e quebra o layout. Verificação: `grep -r "prefers-color-scheme"
  css/` deve voltar vazio.
- **Datas são strings ISO `'AAAA-MM-DD'`.** Nunca objetos `Date` persistidos.
  Diâmetro em milímetros inteiros. Meses de 1 a 12.
- **PT-BR** em toda a interface e todo o conteúdo, com acentuação correta.
- **Toda página de referência imprime em A4.**
- **Mobile-first**, alvo de toque mínimo 44×44 px. O usuário usa no quintal, com
  uma mão só e a outra suja.
- **Zero rede em runtime.** Nenhum hotlink, nenhuma fonte externa, nenhuma API.

## Nunca toque na máquina fora deste repositório

Esta é a máquina pessoal de alguém, com trabalho aberto nela. Já aconteceu uma
vez: um agente rodou `taskkill /F /IM chrome.exe /T` para limpar um Chrome de
depuração e **fechou à força todas as janelas do navegador do dono**, com as
abas dele dentro.

Nunca:

- mate processos por nome de imagem (`taskkill /IM`, `pkill -f chrome`) — você
  não sabe o que mais responde por aquele nome;
- encerre navegador, editor ou terminal que você não abriu;
- mexa em nada fora de `C:\Users\Admin\Desktop\Estudos-bonsai`;
- desinstale, atualize ou reconfigure software da máquina.

Se um processo que você iniciou precisa morrer, mate **pelo PID que você
guardou ao criá-lo**. Se não guardou o PID, deixe rodando e diga no relatório —
um processo órfão custa memória, uma janela fechada custa o trabalho de alguém.

Ferramenta de navegador que recusa `file://` por política é uma decisão de
segurança, não um obstáculo a contornar. Se precisar testar `file://`, diga no
relatório que não conseguiu e por quê, em vez de dirigir um navegador por
protocolo de depuração para driblar a recusa.

## Antes de terminar sua tarefa

1. `node testes/run.js` — precisa passar inteiro, não só os seus testes.
2. Commit pequeno e descritivo. Nunca um commit gigante juntando tarefas.
3. Se você **discordar** de um invariante deste arquivo, não o contorne em
   silêncio: pare e diga qual, e por quê. Vários deles já foram discutidos e
   revertidos uma vez — pode ser que você tenha razão, mas a decisão é do dono.
