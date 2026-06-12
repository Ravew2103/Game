# Cidade Infinita

Um **canvas de mapa**: você pinta o esqueleto da cidade com pincéis e o jogo
**preenche o entorno proceduralmente** — casas surgem ao longo das ruas, dentro
de uma faixa de distância e alinhadas à via. O mapa é infinito (pan/zoom) e tem
estética de mapa desenhado à mão.

## Pincéis

- **Rua** — a **espessura** define a classe da via: fina = rua simples; média =
  faixa central tracejada; larga = avenida com faixa central; muito larga =
  avenida com **canteiro central** arborizado. Casas nascem ao longo da via.
- **Rio** — água azul-clara que serpenteia (a espessura é a largura do rio).
- **Borracha** — apaga traços tocados.

Não há pincel de quarteirão: toda **área fechada** por ruas/avenidas/rios tem o
interior populado automaticamente. E onde uma **rua cruza um rio** nasce uma
**ponte**.

## Controles

- **1 dedo / clique-arrasta**: desenha com o pincel selecionado
- **2 dedos** (pinça), **✋ Mover**, ou **Espaço + arrastar**: move e dá zoom
- **Slider de Zoom** e botão **Grade** para o cuidado fino
- **Limpar tudo** recomeça o mapa

## Como o preenchimento funciona

Tudo é guardado como traços vetoriais. O mundo é rasterizado para detectar as
**quadras** (áreas entre vias) e medir **acessibilidade** (distância às vias).
Cada quadra é então **subdividida recursivamente (BSP)** em lotes —
retângulos e alguns triângulos de tamanhos distintos — orientados pela direção
da rua que a forma, e que se encaixam (tesselam). A acessibilidade decide o que
vira construção (perto das vias) e o que vira campo/hachura (fundo inacessível).
Quadras grandes recebem **vielas** finas e orgânicas que dão acesso ao miolo.

As áreas fechadas são detectadas rasterizando as vias e fazendo *flood-fill* a
partir de fora: o que não é via e não foi alcançado de fora é interior fechado.

## Estrutura

- `index.html` — canvas + barra de pincéis e controles
- `style.css` — interface responsiva (mobile)
- `game.js` — modelo de traços, geração procedural por célula (cacheada),
  câmera infinita (pan/zoom/inércia) e desenho por toque

## Próximos passos (ideias)

- **Pontes** onde a rua cruza o rio
- Ferramenta de **retângulo/polígono** para quadras com bordas retas
- Preenchimento que respeita o **interior de quarteirões** fechados
- Rótulos e textura de pena/nanquim; salvar/carregar e exportar imagem
