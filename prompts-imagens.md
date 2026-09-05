# Prompts de imagem — Nano Banana

## Situação: nenhum prompt é necessário no momento

Este arquivo existia para cobrir os cinco slots de **espécie formada**, os únicos
onde imagem gerada por IA é permitida neste projeto. A busca no Wikimedia Commons
encontrou **foto real com licença livre para os cinco**, então nenhum deles
precisa de ilustração.

Pela regra do projeto, **foto real ganha de ilustração sempre que existir**. Os
prompts abaixo ficam de reserva: use um só se você olhar a foto correspondente no
app e decidir que ela não serve.

| slot | situação |
|---|---|
| `ficus-formado` | ✅ foto real — Sarah Stierch, CC BY 4.0 |
| `jabuticaba-formada` | ✅ foto real — APK, CC BY 4.0 |
| `serissa-formada` | ✅ foto real — Ragesoss, CC BY-SA 4.0 |
| `primavera-formada` | ✅ foto real — Joanna, CC BY 2.0 |
| `azaleia-formada` | ✅ foto real — APK, CC BY 4.0 |

**Os seis slots técnicos não estão aqui e nunca estarão.** Nebari, conicidade,
decepe, arame encravado, raiz circulante e substrato não aceitam IA neste
projeto, por decisão sua: são gabaritos de reconhecimento, e uma anatomia
plausível-mas-errada ensina errado sem dar como perceber. Deles, quatro já têm
foto real e três seguem pendentes da sua câmera — a lista está no app, na galeria
do guia, e em `assets/fotos/creditos.json`.

---

## Se precisar: como usar

1. Gere no Nano Banana com o prompt em inglês.
2. Confira você mesmo contra o bloco **"precisa estar visível"**. Não é uma
   formalidade: se um item falhar, a imagem ensina errado.
3. Me mande a imagem. Eu otimizo, gravo em `assets/fotos/` e marco
   `"origem": "ia"` no `creditos.json`, o que faz o app exibir a tarja
   **"ilustração — não é foto"** por cima dela.

Regra geral para todos os prompts: `photorealistic, natural daylight, plain
neutral background, single subject, sharp focus, no text, no watermark, no
people, no hands`.

---

### 1. `ficus-formado` — Ficus microcarpa formado

> Photorealistic photograph of a mature Ficus microcarpa bonsai in a shallow
> brown ceramic pot, viewed straight on at eye level against a plain light grey
> wall. Thick pale-grey trunk with a wide flared root base spreading visibly over
> the soil surface. Broad flat-topped canopy much wider than it is tall, dense
> small glossy dark-green leaves. Aerial roots hanging from the lower branches to
> the soil. Natural diffuse daylight, sharp focus throughout, no text, no
> watermark, no people.

**Precisa estar visível:** raízes espalhadas em várias direções no nível do
substrato · tronco claramente mais grosso na base que no topo · copa mais larga
que alta · folha pequena e brilhante em proporção à árvore.

**Legenda no app:** "Olhe o nebari largo e as raízes aéreas descendo do tronco, e
como a copa é larga e achatada em vez de arredondada."

---

### 2. `jabuticaba-formada` — Jabuticaba formada

> Photorealistic photograph of a mature jabuticaba bonsai (Plinia cauliflora) in
> a shallow oval ceramic pot on a wooden stand, plain pale background. Smooth
> mottled pale-grey and tan bark that flakes in patches. Trunk noticeably thick
> at the base and tapering steadily upward. Dense rounded canopy of small oval
> dark-green leaves. Natural daylight, sharp focus, no text, no watermark.

**Precisa estar visível:** casca lisa e manchada, esfoliando em placas · afinamento
contínuo do tronco da base ao topo · copa densa e compacta · folha pequena e oval.

**Legenda no app:** "Olhe a conicidade: a base é visivelmente mais grossa que o
topo. O que separa esta da sua é o decepe."

---

### 3. `serissa-formada` — Serissa formada

> Photorealistic photograph of a mature Serissa japonica bonsai in a shallow
> glazed pot, plain neutral background. Very fine twiggy branching with many
> divisions, tiny dark-green leaves with cream-white variegated edges, a few
> small white four-petalled flowers. Slender pale trunk with fine surface roots
> visible. Natural daylight, sharp focus, no text, no watermark.

**Precisa estar visível:** ramificação muito fina, com várias divisões · folha
minúscula com borda variegada · flor branca pequena · raízes finas de superfície.

**Legenda no app:** "Olhe a finura dos ramos e o tamanho da folha em relação à
árvore inteira."

---

### 4. `primavera-formada` — Primavera formada

> Photorealistic photograph of a flowering Bougainvillea bonsai in a shallow
> ceramic pot, plain pale background. Thick sinuous grey trunk, disproportionately
> heavy for the size of the tree, with visible twisting and deeply furrowed bark.
> Canopy covered in magenta bracts, each surrounding a small white tubular
> flower. Natural daylight, sharp focus, no text, no watermark.

**Precisa estar visível:** tronco grosso e sinuoso, desproporcional ao tamanho ·
casca sulcada · brácteas magenta **com a flor branca pequena no centro de cada
grupo** (se as brácteas aparecerem sozinhas, sem a flor branca, a imagem está
botanicamente errada — regere).

**Legenda no app:** "As partes coloridas são brácteas, não pétalas: a flor de
verdade é a coisinha branca no meio delas."

---

### 5. `azaleia-formada` — Azaleia formada

> Photorealistic photograph of a mature Satsuki azalea bonsai (Rhododendron
> indicum) in full bloom, in a shallow glazed pot, plain neutral background.
> Short thick trunk with rough scaly bark and a wide base. Compact dome-shaped
> canopy densely covered in pink and white funnel-shaped flowers over small
> dark-green leaves, flowers spread across the whole structure rather than only
> at the tips. Natural daylight, sharp focus, no text, no watermark.

**Precisa estar visível:** casca escamada e áspera · base larga · flor
distribuída pela estrutura inteira, não só nas pontas · flor em forma de funil,
5 lobos.

**Legenda no app:** "A flor cobre a estrutura inteira, não só as pontas. É por
isso que azaleia se poda depois da floração."
