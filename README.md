# Cidade Infinita

Protótipo de um jogo **roguelike de construção de mapa**: você vai montando uma
cidade encaixando **peças quadradas**, e o mapa cresce indefinidamente.

A grade é quadrada, mas o **conteúdo** de cada peça é gerado proceduralmente com
ruas que curvam e quarteirões irregulares — a intenção é que a cidade pareça
**orgânica**, baseada em traçados reais, e não num quadriculado.

## Como jogar

Abra o `index.html` no navegador (não precisa de servidor):

```bash
# opção simples
xdg-open index.html        # Linux
# ou apenas dê duplo-clique no arquivo
```

- **Clique esquerdo** coloca a peça atual
- **R** gira a peça
- **D** descarta a peça atual (limitado)
- **Arrastar** com botão direito/meio (ou **Espaço + arrastar**) move o mapa
- **Scroll** dá zoom

## Regras de encaixe (estilo Carcassonne)

Cada lado de uma peça é **rua (R)** ou **quarteirão (B)**. Duas peças vizinhas só
encaixam se os lados que se tocam forem do mesmo tipo, garantindo continuidade
das ruas e dos quarteirões. A primeira peça vai na origem; as próximas precisam
encostar em alguma já colocada.

## Estrutura

- `index.html` — tela e painel lateral (mão de peças, pontos, controles)
- `style.css` — estilo da interface
- `game.js` — toda a lógica: definição de peças, encaixe, geração procedural do
  desenho de cada peça, câmera infinita (pan/zoom), baralho roguelike e pontuação

## Próximos passos (ideias)

- Mais tipos de traçado (avenidas, rios, praças, diagonais) para mais variedade
- Pontuação por "features" completas (quarteirões fechados, ruas longas)
- Objetivos/eventos roguelike (cartas, distritos especiais, modificadores)
- Salvar/carregar a cidade
