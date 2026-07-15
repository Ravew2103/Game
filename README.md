# 🏠 Casa Segura

Plataforma visual e interativa de conhecimentos úteis para casa: **elétrica, gás, encanamento, carpintaria básica, marcenaria básica, limpeza e manutenção** — com guias passo a passo, quizzes e jogos.

## ✨ O que tem dentro

| Área | Conteúdo |
|---|---|
| 📚 **7 módulos** | 21 guias práticos com passos numerados, lista de ferramentas, avisos de segurança e dicas |
| 🧠 **Quizzes** | 35 perguntas com explicação detalhada de cada resposta |
| 🚨 **Emergência em Casa** | Jogo de decisão: 12 cenários reais com 15 segundos para escolher a atitude correta |
| 🧰 **Ferramenta Certa** | Jogo de pares: ligue cada ferramenta à sua função contra o relógio |
| 🏅 **Progressão** | XP, níveis e 8 conquistas — tudo salvo localmente no navegador |

## 🚀 Como rodar

Não há build nem dependências — é HTML, CSS e JavaScript puros.

```bash
# opção 1: abrir direto
abra o arquivo index.html no navegador

# opção 2: servidor local (recomendado)
python3 -m http.server 8000
# acesse http://localhost:8000
```

Também pode ser publicado direto no **GitHub Pages** (Settings → Pages → Deploy from branch), já que é um site 100% estático.

## 🗂️ Estrutura

```
index.html        # página única (SPA com roteamento por hash)
css/style.css     # tema claro/escuro automático, responsivo
js/data.js        # todo o conteúdo educativo (módulos, quizzes, cenários, pares)
js/state.js       # progresso, XP, níveis e conquistas (localStorage)
js/quiz.js        # motor de quiz (perguntas e opções embaralhadas)
js/games.js       # jogo de emergências e jogo de pares
js/app.js         # roteador e renderização das páginas
```

## ➕ Como adicionar conteúdo

Todo o conteúdo vive em `js/data.js`:

- **Novo guia**: adicione um objeto ao array `guides` do módulo (título, dificuldade, ferramentas, passos, aviso e dica).
- **Nova pergunta de quiz**: adicione ao array `quiz` do módulo (`q`, `options`, `answer` = índice da correta, `explain`).
- **Novo cenário de emergência**: adicione a `EMERGENCY_SCENARIOS`.
- **Novo par ferramenta/tarefa**: adicione a `TOOL_PAIRS`.
- **Novo módulo**: adicione ao array `MODULES` seguindo o formato dos existentes — a navegação, o progresso e o quiz aparecem automaticamente.

## ⚠️ Aviso

O conteúdo é educativo. Serviços em **gás** e alterações na **rede elétrica** devem sempre ser executados por profissionais habilitados.
