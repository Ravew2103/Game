# ⚒️ Forja & Fama — Protótipo

Protótipo de jogo onde você é um **aprendiz de ferreiro** que evolui sua técnica,
coleta matéria-prima, forja armas e armaduras, e comercializa suas mercadorias
para ganhar ouro e renome.

## Como jogar

Abra o arquivo `index.html` em qualquer navegador moderno. Não precisa instalar nada.

O progresso é salvo automaticamente no navegador (localStorage). Use o botão
"Recomeçar jogo" para zerar.

## Loop de gameplay

1. **⛏️ Coleta** — Explore locais (Floresta, Mina, Caçada...) para coletar
   madeira, ferro, couro, carvão e prata. Cada expedição gasta energia.
   Locais melhores são desbloqueados com renome.
2. **🔥 Forja** — Use os materiais para forjar armas e armaduras. Um minigame
   de martelo decide a qualidade da peça (Comum, Boa, Excelente, Obra-Prima):
   acerte 3 batidas na zona verde, o mais perto possível do centro dourado.
   Errar feio demais quebra a peça e perde os materiais! Forjar dá XP de técnica.
3. **💰 Comércio** — Venda no mercado ou entregue **encomendas** de clientes,
   que pagam mais caro e dão renome extra. Novas encomendas chegam a cada dia.
4. **🌙 Dormir** — Recupera a energia e avança para o próximo dia.

## Progressão

- **Técnica** (nível 1+): sobe forjando. Desbloqueia receitas melhores
  (da Adaga de Ferro até a Lâmina do Dragão) e aumenta a zona de acerto
  do minigame.
- **Renome** (⭐): ganho vendendo e entregando encomendas. Desbloqueia locais
  de coleta, melhora os preços de venda (até +50%) e concede títulos —
  de *Aprendiz de Ferreiro* até *Ferreiro Lendário*.
- **Refino**: a partir de técnica 4 você pode fundir ferro + carvão em **aço**,
  necessário para os equipamentos avançados.

## Stack

HTML + CSS + JavaScript puro, num único arquivo (`index.html`). Sem
dependências, sem build — ideal para iterar rápido no protótipo.
