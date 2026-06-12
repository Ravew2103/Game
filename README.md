# Cidade Infinita

Construtor de cidade **procedural e contínua**: você escolhe onde expandir e o
jogo gera aquele pedaço da cidade. O mapa cresce indefinidamente e o traçado
(ruas, rio, quarteirões) **flui de forma contínua entre as peças**, sem cara de
retalhos quadriculados.

## Como jogar

Abra o `index.html` no navegador (não precisa de servidor) — ou acesse a versão
publicada no GitHub Pages.

- **Toque / clique** numa célula destacada: o jogo constrói aquele pedaço
- As células ao redor aparecem como **esboço** (a cidade já gerada) — é só tocar
- **Arrastar** (1 dedo) move o mapa; **pinça** (2 dedos) ou **slider** dá zoom
- **Nova cidade** sorteia uma cidade totalmente diferente

## Como a continuidade funciona

Não há regras de encaixe nem peças pré-definidas. Cada **borda** entre duas
células tem um perfil determinístico, calculado por *hash* das coordenadas
globais da borda: se uma rua a cruza e em que posição. Como dois vizinhos
derivam a **mesma** borda do mesmo hash, as ruas atravessam as peças de forma
contínua. Dentro de cada peça os pontos das bordas são ligados por curvas, e os
quarteirões são preenchidos evitando ruas e rio — o que faz os blocos se
estenderem naturalmente para os vizinhos. O **rio** é uma curva global que
serpenteia pelo mapa inteiro.

## Estrutura

- `index.html` — tela e painel (zoom, grade, nova cidade, ajuda)
- `style.css` — estilo da interface (responsivo, mobile)
- `game.js` — geração procedural contínua, câmera infinita (pan/zoom/inércia),
  textura de papel e controles por toque

## Próximos passos (ideias)

- **Pontes** onde a rua cruza o rio
- Avenidas/ruas principais correlacionadas (eixos mais longos)
- Distritos com caráter próprio (centro denso, periferia, parques, porto)
- Rótulos e textura de pena/nanquim para reforçar o aspecto desenhado à mão
- Salvar/carregar a cidade
