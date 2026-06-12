# Cidade Infinita

Um **canvas de mapa**: você pinta o esqueleto da cidade com pincéis e o jogo
**preenche o entorno proceduralmente** — casas surgem ao longo das ruas, dentro
de uma faixa de distância e alinhadas à via. O mapa é infinito (pan/zoom) e tem
estética de mapa desenhado à mão.

## Pincéis

- **Rua** / **Avenida** — traço preto (a avenida é mais larga, com faixa central).
  O jogo faz construções nascerem ao longo da via.
- **Rio** — água azul-clara que serpenteia (quarteirões não invadem a água).
- **Quadra** — desenhe o **perímetro** de um quarteirão e o jogo preenche o
  interior com construções (orientadas pelas bordas da quadra).
- **Borracha** — apaga traços tocados.
- **Espessura** — slider que define a grossura do pincel atual.

## Controles

- **1 dedo / clique-arrasta**: desenha com o pincel selecionado
- **2 dedos** (pinça), **✋ Mover**, ou **Espaço + arrastar**: move e dá zoom
- **Slider de Zoom** e botão **Grade** para o cuidado fino
- **Limpar tudo** recomeça o mapa

## Como o preenchimento funciona

Tudo é guardado como traços vetoriais em coordenadas de mundo. Para desenhar,
o mundo é dividido em células cacheadas (só para performance). Em cada célula,
o jogo espalha construções de forma determinística e decide cada lote pela
distância às vias mais próximas:

- em cima da rua/rio → vazio (pavimento/água);
- dentro da faixa `FRONTAGE` ao longo de uma via, ou dentro de uma **quadra** →
  construção, **orientada** pela direção da via (casas voltadas à rua);
- longe de tudo → papel (vazio), com árvores ocasionais.

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
