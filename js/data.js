/* ============ Casa Segura — base de conteúdo ============ */

const MODULES = [
  {
    id: "eletrica",
    name: "Elétrica",
    icon: "⚡",
    color: "#f59e0b",
    description: "Entenda o quadro de energia, troque itens simples com segurança e saiba quando chamar um eletricista.",
    guides: [
      {
        id: "quadro-energia",
        title: "Conhecendo o quadro de energia (disjuntores)",
        difficulty: "easy",
        time: "10 min",
        tools: ["Lanterna", "Etiquetas adesivas", "Caneta"],
        warning: "Nunca abra a tampa interna do quadro nem toque em fios. Apenas os disjuntores (as alavancas) são de uso do morador.",
        steps: [
          "Localize o quadro de distribuição da casa (geralmente na entrada, área de serviço ou corredor).",
          "Identifique o disjuntor geral: é o maior, normalmente no topo, e desliga a casa inteira.",
          "Com ajuda de outra pessoa, desligue um disjuntor por vez e anote quais cômodos ou aparelhos ficam sem energia.",
          "Cole uma etiqueta identificando cada disjuntor (ex.: 'Chuveiro', 'Tomadas cozinha', 'Iluminação quartos').",
          "Teste o botão do DR (diferencial residual), se houver: aperte 'teste' e veja se ele desarma. Se não desarmar, chame um eletricista."
        ],
        tip: "Disjuntor que desarma repetidamente é um aviso de sobrecarga ou curto — não fique religando: investigue a causa ou chame um profissional."
      },
      {
        id: "trocar-lampada",
        title: "Trocando lâmpadas com segurança",
        difficulty: "easy",
        time: "5 min",
        tools: ["Escada firme", "Lâmpada nova (mesma base e tensão)", "Pano seco"],
        warning: "Desligue o interruptor e, em locais úmidos ou luminárias metálicas, desligue também o disjuntor da iluminação.",
        steps: [
          "Desligue o interruptor e espere a lâmpada esfriar (incandescentes e halógenas queimam a pele).",
          "Posicione uma escada firme — nunca use cadeiras giratórias ou bancos instáveis.",
          "Gire a lâmpada antiga no sentido anti-horário segurando pelo corpo, não pelo vidro fino.",
          "Verifique a base (E27 é a comum) e a tensão (127 V, 220 V ou bivolt) da lâmpada nova.",
          "Rosqueie a nova sem forçar, ligue o interruptor e teste.",
          "Descarte a antiga em ponto de coleta — fluorescentes contêm mercúrio e não vão no lixo comum."
        ],
        tip: "Prefira LED: consome até 85% menos que incandescente e dura muito mais. Verifique se o modelo é bivolt para não errar a tensão."
      },
      {
        id: "tomada-cheiro-queimado",
        title: "Sinais de perigo: tomadas quentes e cheiro de queimado",
        difficulty: "medium",
        time: "leitura de 8 min",
        tools: ["Apenas observação — sem ferramentas"],
        warning: "Se houver fumaça, estalos ou cheiro forte de plástico queimado, desligue o disjuntor geral e chame um eletricista. Não tente consertar.",
        steps: [
          "Passe a mão PRÓXIMA (sem tocar) de tomadas muito usadas: calor perceptível indica mau contato ou sobrecarga.",
          "Observe sinais visuais: tomada escurecida, derretida ou com faíscas ao plugar.",
          "Evite 'árvores de natal': benjamins e filtros de linha empilhados sobrecarregam o circuito.",
          "Chuveiro, micro-ondas, ar-condicionado e ferro de passar devem ter, idealmente, circuitos próprios.",
          "Aparelhos que dão choque leve na carcaça indicam falta de aterramento — pare de usar e chame um profissional.",
          "Anote os sinais encontrados e passe ao eletricista: isso acelera (e barateia) o diagnóstico."
        ],
        tip: "Instalar um DR no quadro protege contra choques e é exigido por norma (NBR 5410) em áreas molhadas. Pergunte ao seu eletricista."
      }
    ],
    quiz: [
      {
        q: "O disjuntor do chuveiro desarma toda vez que alguém toma banho. O que fazer?",
        options: [
          "Trocar por um disjuntor maior por conta própria",
          "Prender o disjuntor com fita adesiva para não cair",
          "Investigar a causa com um eletricista — pode ser sobrecarga ou fiação subdimensionada",
          "Ignorar, é normal"
        ],
        answer: 2,
        explain: "Disjuntor que desarma está protegendo a fiação. Aumentar o disjuntor sem trocar a fiação pode causar incêndio — o correto é um profissional avaliar."
      },
      {
        q: "Qual é a função do DR (diferencial residual) no quadro de energia?",
        options: [
          "Economizar energia elétrica",
          "Proteger pessoas contra choques elétricos, desarmando ao detectar fuga de corrente",
          "Aumentar a potência do chuveiro",
          "Estabilizar a tensão da rede"
        ],
        answer: 1,
        explain: "O DR detecta fugas de corrente (como um choque passando por uma pessoa) e desliga o circuito em fração de segundo. É proteção de vida."
      },
      {
        q: "Antes de trocar uma lâmpada em luminária metálica no banheiro, o mais seguro é:",
        options: [
          "Desligar só o interruptor",
          "Trocar com a luz acesa para ver melhor",
          "Desligar o interruptor E o disjuntor da iluminação",
          "Usar luvas de borracha e trocar com tudo ligado"
        ],
        answer: 2,
        explain: "Interruptores mal instalados podem cortar o neutro em vez da fase, deixando o soquete energizado. Desligar o disjuntor elimina o risco."
      },
      {
        q: "Um aparelho dá 'choquinho' quando você encosta na carcaça. Isso indica:",
        options: [
          "Que o aparelho é potente",
          "Eletricidade estática normal, sem risco",
          "Provável falta de aterramento ou fuga de corrente — pare de usar e verifique",
          "Que a tomada é 220 V"
        ],
        answer: 2,
        explain: "Choque na carcaça é fuga de corrente. Com o corpo molhado ou pés descalços, esse 'choquinho' pode se tornar fatal. Aterramento resolve."
      },
      {
        q: "Por que ligar vários aparelhos em benjamins (Ts) na mesma tomada é perigoso?",
        options: [
          "Porque gasta mais energia que tomadas separadas",
          "Porque a soma das correntes pode exceder o que a fiação suporta, superaquecendo e podendo causar incêndio",
          "Porque diminui a velocidade da internet",
          "Não é perigoso, apenas desorganizado"
        ],
        answer: 1,
        explain: "Cada circuito suporta uma corrente máxima. Somando vários aparelhos, o fio esquenta além do limite — causa comum de incêndios residenciais."
      }
    ]
  },

  {
    id: "gas",
    name: "Gás",
    icon: "🔥",
    color: "#ef4444",
    description: "Segurança em primeiro lugar: identifique vazamentos, use o botijão corretamente e saiba agir em emergências.",
    guides: [
      {
        id: "vazamento-gas",
        title: "Como identificar e agir em um vazamento de gás",
        difficulty: "medium",
        time: "leitura de 8 min",
        tools: ["Esponja", "Detergente", "Água"],
        warning: "NUNCA acenda fósforos, ligue interruptores ou use o celular dentro do ambiente com cheiro de gás. Qualquer faísca pode causar explosão.",
        steps: [
          "Sinta o cheiro: o gás recebe um odorizante (cheiro de ovo podre) justamente para ser percebido.",
          "Feche imediatamente o registro do gás (válvula do botijão ou registro da rede).",
          "Abra portas e janelas para ventilar — o GLP é mais pesado que o ar e acumula embaixo.",
          "NÃO ligue nem desligue interruptores, ventiladores ou eletrodomésticos.",
          "Saia do ambiente e, de fora, ligue para a distribuidora ou para os Bombeiros (193).",
          "Para localizar o ponto do vazamento depois: passe espuma de detergente nas conexões — bolhas indicam o vazamento. Nunca use fogo para testar!"
        ],
        tip: "Regule a chama do fogão: ela deve ser azul. Chama amarela ou alaranjada indica queima incompleta e produção de monóxido de carbono."
      },
      {
        id: "botijao-seguro",
        title: "Uso seguro do botijão de gás (GLP)",
        difficulty: "easy",
        time: "10 min",
        tools: ["Chave de aperto (se o regulador exigir)", "Esponja com detergente"],
        warning: "A troca do botijão pode ser feita pelo morador, mas instalações de tubulação e conversões de fogão são serviço de profissional habilitado.",
        steps: [
          "Compre apenas botijões com lacre íntegro e de marcas certificadas pelo Inmetro.",
          "Mantenha o botijão em pé, em local ventilado, longe de fontes de calor — nunca deitado nem em porões.",
          "Verifique a validade da mangueira (gravada no próprio tubo) e do regulador (5 anos, em geral).",
          "Ao trocar: feche o registro, desrosqueie o regulador, conecte no botijão novo e aperte firme com a mão.",
          "Teste as conexões com espuma de detergente — se borbulhar, reaperte ou troque a peça.",
          "A mangueira deve ser a NBR 8613 (listrada, com tarja amarela) e nunca passar por trás do fogão, perto do forno."
        ],
        tip: "Se o botijão 'gela' ou faz barulho de líquido ao usar, é normal (evaporação do GLP). Mas se congelar demais, o ambiente pode estar sem ventilação para o consumo — verifique."
      },
      {
        id: "monoxido",
        title: "Monóxido de carbono: o perigo invisível",
        difficulty: "medium",
        time: "leitura de 6 min",
        tools: ["Nenhuma — conhecimento salva vidas"],
        warning: "Aquecedores a gás em banheiros sem ventilação já causaram muitas mortes. O monóxido de carbono não tem cheiro nem cor.",
        steps: [
          "Entenda o risco: qualquer queima incompleta de gás gera CO, gás tóxico, invisível e inodoro.",
          "Nunca use fogão ou forno para aquecer o ambiente.",
          "Aquecedores de passagem a gás devem ficar em áreas ventiladas, jamais dentro do box ou banheiros pequenos sem exaustão.",
          "Sintomas de intoxicação: dor de cabeça, tontura, náusea e sonolência — se sentir isso perto de aparelhos a gás, saia para o ar livre imediatamente.",
          "Garanta ventilação permanente na cozinha (fresta ou grade de ventilação, exigida por norma).",
          "Faça manutenção anual de aquecedores a gás com técnico credenciado."
        ],
        tip: "Detectores de CO custam pouco e são vendidos em lojas de material de construção — vale muito para quem tem aquecedor a gás."
      }
    ],
    quiz: [
      {
        q: "Você chega em casa e sente forte cheiro de gás. Qual a PRIMEIRA atitude correta?",
        options: [
          "Acender a luz para enxergar melhor",
          "Ligar o ventilador para dispersar o gás",
          "Fechar o registro de gás e abrir janelas, sem acionar nada elétrico",
          "Ligar da sala mesmo para os bombeiros"
        ],
        answer: 2,
        explain: "Qualquer faísca (interruptor, ventilador, celular) pode causar explosão. Corte a fonte (registro), ventile e só use o telefone fora do ambiente."
      },
      {
        q: "Como testar corretamente se há vazamento na conexão do botijão?",
        options: [
          "Passando um fósforo aceso perto da conexão",
          "Passando espuma de água com detergente e observando bolhas",
          "Cheirando bem de perto a válvula",
          "Balançando o botijão para ouvir o gás"
        ],
        answer: 1,
        explain: "A espuma borbulha onde há escape de gás — método seguro e eficaz. Jamais use chama: o teste com fogo causa explosões e queimaduras graves."
      },
      {
        q: "A chama do fogão está amarela/alaranjada em vez de azul. Isso significa:",
        options: [
          "Que o gás está acabando, apenas",
          "Queima incompleta — desperdício de gás e produção de monóxido de carbono",
          "Que a panela está suja",
          "Que a pressão do gás está alta demais"
        ],
        answer: 1,
        explain: "Chama azul = queima completa. Amarela indica mistura errada de ar/gás, gerando CO tóxico e fuligem. Precisa de regulagem/limpeza do queimador."
      },
      {
        q: "Onde o botijão de gás NUNCA deve ficar?",
        options: [
          "Em área de serviço ventilada",
          "Ao lado externo da casa, em abrigo ventilado",
          "Em porão, local fechado ou deitado no chão",
          "Em pé, longe do calor"
        ],
        answer: 2,
        explain: "O GLP é mais pesado que o ar: em porões e locais fechados ele se acumula no chão formando atmosfera explosiva. Deitado, pode vazar líquido pela válvula."
      },
      {
        q: "Por que é perigoso usar aquecedor a gás dentro de banheiro pequeno e fechado?",
        options: [
          "Porque o vapor estraga o aparelho",
          "Porque a queima consome o oxigênio e gera monóxido de carbono, que pode matar sem aviso",
          "Porque aumenta muito a conta de gás",
          "Não há perigo se o banho for rápido"
        ],
        answer: 1,
        explain: "O CO é invisível e sem cheiro: a pessoa sente sonolência e desmaia. Aquecedores exigem ambiente ventilado e exaustão adequada, por norma."
      }
    ]
  },

  {
    id: "encanamento",
    name: "Encanamento",
    icon: "🚰",
    color: "#0ea5e9",
    description: "Resolva vazamentos simples, desentupa ralos e aprenda a fechar registros antes que o problema cresça.",
    guides: [
      {
        id: "registro-geral",
        title: "Onde ficam os registros de água (e por que você PRECISA saber)",
        difficulty: "easy",
        time: "10 min",
        tools: ["Etiquetas", "Chave de fenda (para alguns registros)"],
        warning: "Descubra os registros HOJE, antes da emergência. Com água jorrando não há tempo de procurar.",
        steps: [
          "Localize o registro geral da casa: perto do hidrômetro (relógio de água), no muro ou na entrada.",
          "Identifique os registros setoriais: cada banheiro e a cozinha costumam ter o seu (atrás da parede, sob a pia ou no barrilete).",
          "Gire cada registro devagar para conferir se funciona — registros parados por anos podem travar.",
          "Etiquete: 'geral', 'banheiro 1', 'cozinha' etc.",
          "Ensine a todos da casa onde fica o registro geral.",
          "Se algum registro estiver emperrado ou vazando pela haste, programe a troca com um encanador."
        ],
        tip: "Ao viajar, feche o registro geral. É a proteção mais barata contra voltar para casa alagada."
      },
      {
        id: "vazamento-descarga",
        title: "Caixa acoplada gastando água? Conserte o mecanismo",
        difficulty: "medium",
        time: "30 min",
        tools: ["Reparo/kit da caixa acoplada", "Chave inglesa", "Pano"],
        warning: "Feche o registro do banheiro antes de abrir a caixa. Não force peças de louça: quebram fácil e cortam.",
        steps: [
          "Teste o vazamento: pingue corante (ou pó de café) na caixa; se o vaso colorir sem dar descarga, há vazamento interno.",
          "Feche o registro e dê descarga para esvaziar a caixa.",
          "Retire a tampa com cuidado e observe o mecanismo: comporta/válvula de saída e boia de entrada.",
          "Se a água fica escorrendo para o vaso: a comporta (válvula de saída) não veda mais — troque o anel de vedação ou o mecanismo completo.",
          "Se a caixa transborda pelo ladrão: regule ou troque a boia (torneira de entrada).",
          "Leve a peça antiga à loja para comprar o reparo idêntico, reinstale e teste."
        ],
        tip: "Um vaso com vazamento silencioso desperdiça milhares de litros por mês — dá para notar pela conta de água ou pelo filete constante na louça."
      },
      {
        id: "desentupir-ralo",
        title: "Desentupindo ralos e sifões sem produtos agressivos",
        difficulty: "easy",
        time: "20 min",
        tools: ["Balde", "Luvas", "Desentupidor de borracha", "Chave (se o sifão for rosqueado)"],
        warning: "Evite soda cáustica: ela ferve em contato com a água, causa queimaduras graves e danifica canos de PVC.",
        steps: [
          "Remova a grelha do ralo e retire cabelos e resíduos visíveis (luvas!).",
          "Tente o desentupidor de borracha: tampe o ladrão da pia com um pano molhado e bombeie com vigor.",
          "Na pia: coloque um balde embaixo, desrosqueie o copo do sifão e limpe a gordura acumulada.",
          "Despeje água fervente com detergente para dissolver gordura residual (canos de PVC suportam; evite se a tubulação for muito antiga).",
          "Recoloque o sifão conferindo os anéis de vedação e teste com bastante água.",
          "Se o entupimento persistir ou voltar sempre, o problema pode estar na rede — chame um profissional com máquina de desentupir."
        ],
        tip: "Prevenção vale ouro: nunca jogue óleo de cozinha na pia (entope e polui). Guarde em garrafa e leve a um ponto de coleta."
      }
    ],
    quiz: [
      {
        q: "Estourou um cano e a água está jorrando. O que fazer primeiro?",
        options: [
          "Enxugar o chão para não estragar o piso",
          "Fechar o registro geral de água",
          "Ligar para a companhia de água",
          "Abrir todas as torneiras para aliviar a pressão"
        ],
        answer: 1,
        explain: "Cortar a alimentação de água estanca o problema na origem. Por isso é essencial saber ONDE fica o registro geral antes da emergência."
      },
      {
        q: "Como descobrir se a caixa acoplada está vazando silenciosamente para o vaso?",
        options: [
          "Colocando corante na caixa e observando se o vaso colore sem descarga",
          "Ouvindo o barulho da rua",
          "Medindo a temperatura da água",
          "Só um encanador consegue detectar"
        ],
        answer: 0,
        explain: "O teste do corante é simples e infalível: se a água colorida aparece no vaso sem ninguém dar descarga, a válvula de saída não está vedando."
      },
      {
        q: "Por que soda cáustica NÃO é recomendada para desentupir?",
        options: [
          "Porque é cara demais",
          "Porque reage violentamente com água, causa queimaduras graves e pode danificar a tubulação",
          "Porque não dissolve nada",
          "Porque deixa cheiro de perfume"
        ],
        answer: 1,
        explain: "A reação da soda com água gera calor intenso — respingos causam queimaduras químicas graves, e o calor pode deformar canos de PVC."
      },
      {
        q: "O que NUNCA se deve jogar na pia da cozinha?",
        options: [
          "Água quente",
          "Detergente",
          "Óleo de cozinha usado",
          "Restos de café coado"
        ],
        answer: 2,
        explain: "O óleo esfria, solidifica e gruda nas paredes do cano formando tampões de gordura. Além disso, 1 litro de óleo polui milhares de litros de água."
      },
      {
        q: "Sua conta de água dobrou sem mudança de hábito. Um bom primeiro teste é:",
        options: [
          "Trocar o hidrômetro por conta própria",
          "Fechar todas as torneiras e ver se o hidrômetro continua girando",
          "Reclamar direto na justiça",
          "Esperar a próxima conta para confirmar"
        ],
        answer: 1,
        explain: "Com tudo fechado, o hidrômetro parado = sem vazamento interno; girando = há vazamento (caixa acoplada e tubulações enterradas são suspeitos comuns)."
      }
    ]
  },

  {
    id: "carpintaria",
    name: "Carpintaria básica",
    icon: "🔨",
    color: "#a16207",
    description: "Fure paredes sem sustos, fixe prateleiras e suportes, e monte seu kit essencial de ferramentas.",
    guides: [
      {
        id: "furar-parede",
        title: "Furando paredes sem acertar canos e fios",
        difficulty: "medium",
        time: "20 min",
        tools: ["Furadeira", "Broca de vídea (parede)", "Buchas e parafusos", "Detector de metais/fiação (opcional)", "Fita crepe", "Óculos de proteção"],
        warning: "Evite furar diretamente acima ou abaixo de tomadas, interruptores e pontos de água — os condutos geralmente sobem/descem na vertical.",
        steps: [
          "Planeje o ponto do furo: longe da linha vertical de tomadas/interruptores e de paredes hidráulicas (atrás de pias, chuveiros).",
          "Se tiver, use um detector de fiação/metais; sem ele, redobre a atenção com as zonas de risco.",
          "Marque o ponto com lápis e cole fita crepe (ajuda a broca a não escorregar no azulejo).",
          "Escolha a broca do diâmetro da bucha (bucha 6 → broca 6).",
          "Fure perpendicular à parede, começando devagar e sem forçar. Em azulejo, desligue o modo impacto até atravessar o esmalte.",
          "Insira a bucha faceando a parede, parafuse o suporte e confira o aperto."
        ],
        tip: "Truque do saquinho: prenda um saco plástico ou envelope aberto com fita logo abaixo do furo para aparar o pó."
      },
      {
        id: "prateleira",
        title: "Instalando uma prateleira nivelada e firme",
        difficulty: "medium",
        time: "40 min",
        tools: ["Nível de bolha", "Furadeira", "Buchas adequadas ao peso", "Trena", "Lápis", "Chave Phillips"],
        warning: "Em drywall (gesso), use buchas específicas (basculante ou tipo GD) — bucha comum de nylon NÃO segura peso em gesso.",
        steps: [
          "Defina a altura e marque a posição do primeiro suporte com lápis.",
          "Use o nível de bolha para traçar uma linha reta horizontal até a posição do segundo suporte.",
          "Confirme o tipo de parede: alvenaria (som fechado ao bater) ou drywall (som oco) — escolha a bucha certa.",
          "Fure, coloque as buchas e parafuse o primeiro suporte.",
          "Apoie o segundo suporte na linha, confira com o nível apoiado entre os dois e parafuse.",
          "Encaixe a prateleira, fixe nos suportes e teste com um peso leve antes do uso definitivo."
        ],
        tip: "Regra prática de carga: em alvenaria com bucha 8, cada suporte aguenta bem itens domésticos; para muitos livros, use mais suportes — o vão entre eles não deve passar de ~60 cm."
      },
      {
        id: "kit-ferramentas",
        title: "Kit essencial de ferramentas para toda casa",
        difficulty: "easy",
        time: "leitura de 5 min",
        tools: ["A lista é o conteúdo 🙂"],
        warning: "Compre ferramentas com certificação e prefira qualidade média a quantidade — ferramenta ruim escapa e machuca.",
        steps: [
          "Martelo de unha (médio, ~500 g): prega e remove pregos.",
          "Jogo de chaves de fenda e Phillips (ao menos 2 tamanhos de cada) ou uma com pontas intercambiáveis.",
          "Alicate universal e alicate de bico: segurar, cortar e dobrar.",
          "Trena de 5 m e nível de bolha: medir e alinhar tudo.",
          "Furadeira com jogo de brocas (vídea para parede, aço para madeira/metal) e kit de buchas 6 e 8 com parafusos.",
          "Complementos que salvam: estilete, fita isolante, fita veda-rosca, chave inglesa ajustável, lanterna e óculos de proteção."
        ],
        tip: "Guarde tudo numa caixa organizada e devolva cada item ao lugar após o uso — metade do valor de um kit é saber onde ele está."
      }
    ],
    quiz: [
      {
        q: "Onde é MAIS arriscado furar uma parede?",
        options: [
          "No centro de uma parede sem pontos elétricos ou hidráulicos",
          "Na linha vertical acima de uma tomada",
          "A 1 metro de distância de qualquer interruptor",
          "Perto do teto em parede de sala"
        ],
        answer: 1,
        explain: "Os eletrodutos normalmente correm na vertical a partir de tomadas e interruptores. Furar nessa linha é a receita clássica para acertar um fio."
      },
      {
        q: "Qual broca usar para furar parede de alvenaria com bucha número 8?",
        options: [
          "Broca de aço rápido número 6",
          "Broca de vídea (widia) número 8",
          "Broca de madeira número 10",
          "Qualquer broca serve"
        ],
        answer: 1,
        explain: "Broca de vídea é a indicada para alvenaria, e o número da broca deve ser igual ao da bucha: bucha 8 → broca 8, para encaixe justo."
      },
      {
        q: "Como saber se a parede é drywall (gesso) ou alvenaria?",
        options: [
          "Pela cor da pintura",
          "Batendo com os nós dos dedos: som oco indica drywall, som fechado indica alvenaria",
          "Medindo a espessura da parede com trena",
          "Só quebrando um pedaço"
        ],
        answer: 1,
        explain: "O teste da batida é o mais prático. Em drywall, buchas comuns não seguram peso: use buchas específicas (basculantes ou GD)."
      },
      {
        q: "Para que serve o nível de bolha?",
        options: [
          "Medir distâncias com precisão",
          "Verificar se uma superfície está perfeitamente horizontal ou vertical",
          "Marcar pontos de furação",
          "Medir a profundidade do furo"
        ],
        answer: 1,
        explain: "A bolha centralizada entre as marcas indica alinhamento perfeito. Essencial para prateleiras, quadros e móveis que precisam ficar retos."
      },
      {
        q: "Ao furar azulejo, o recomendado é:",
        options: [
          "Usar impacto no máximo desde o início",
          "Colar fita crepe, começar devagar e SEM impacto até atravessar o esmalte",
          "Molhar o azulejo com óleo",
          "Bater um prego primeiro para guiar"
        ],
        answer: 1,
        explain: "O impacto no início trinca o esmalte do azulejo. Fita crepe evita que a broca escorregue; o impacto só entra depois, na alvenaria."
      }
    ]
  },

  {
    id: "marcenaria",
    name: "Marcenaria básica",
    icon: "🪚",
    color: "#7c3aed",
    description: "Conheça madeiras e chapas, faça pequenos reparos em móveis e dê acabamento profissional.",
    guides: [
      {
        id: "tipos-madeira",
        title: "MDF, MDP, compensado ou madeira maciça?",
        difficulty: "easy",
        time: "leitura de 7 min",
        tools: ["Nenhuma — só leitura"],
        warning: "MDF e MDP incham de forma irreversível com água. Em áreas úmidas, exija versões 'ultra' (resistentes à umidade) ou outros materiais.",
        steps: [
          "MDF: fibras prensadas, superfície lisa, ótimo para usinagem e pintura. É o padrão de móveis planejados.",
          "MDP: partículas prensadas, mais barato, bom para peças retas de móveis; não aceita entalhes.",
          "Compensado: lâminas de madeira cruzadas e coladas; mais resistente à umidade e a parafusos que MDF/MDP.",
          "Madeira maciça (pinus, tauari, jequitibá...): mais nobre e durável, aceita restauro, porém mais cara e sujeita a empenar.",
          "Para prateleiras pesadas prefira compensado ou maciça; para portas e frentes de gaveta, MDF dá o melhor acabamento.",
          "Ao parafusar MDF/MDP, sempre faça pré-furo — sem ele, a chapa estoura na borda."
        ],
        tip: "Peça cortes na loja: madeireiras e grandes home centers cortam as chapas na medida, o que dispensa serra em casa e melhora a precisão."
      },
      {
        id: "porta-armario",
        title: "Regulando dobradiças de armário (porta caindo ou torta)",
        difficulty: "easy",
        time: "15 min",
        tools: ["Chave Phillips"],
        warning: "Gire os parafusos aos poucos (1/4 de volta) e teste — regulagem demais de uma vez desalinha tudo.",
        steps: [
          "Abra a porta e observe a dobradiça de caneco: ela tem 2 ou 3 parafusos de regulagem.",
          "Porta torta (desalinhada na vertical): ajuste o parafuso mais próximo do caneco (regulagem lateral) em cada dobradiça.",
          "Porta raspando embaixo/em cima: solte os parafusos da base (regulagem vertical), desça/suba a porta e reaperte.",
          "Porta não encosta ou encosta demais: ajuste o parafuso traseiro (regulagem de profundidade).",
          "Feche e confira o alinhamento com a porta vizinha; repita ajustes finos.",
          "Se o caneco arrancou do MDF: preencha o furo com palitos e cola branca, espere secar e reparafuse."
        ],
        tip: "O truque do palito com cola branca recupera quase qualquer furo espanado em madeira ou MDF — funciona em dobradiças, puxadores e corrediças."
      },
      {
        id: "acabamento",
        title: "Lixamento e acabamento: verniz, seladora ou óleo?",
        difficulty: "medium",
        time: "1-2 h + secagem",
        tools: ["Lixas 120, 180 e 220", "Taco de lixa", "Pano limpo", "Pincel ou rolinho de espuma", "Máscara contra poeira"],
        warning: "Lixe e aplique produtos em local ventilado, com máscara. Panos com óleo de acabamento podem autoinflamar — seque-os abertos antes de descartar.",
        steps: [
          "Lixe no sentido dos veios da madeira, começando com grão 120 e subindo para 180 e 220.",
          "Remova todo o pó com pano levemente úmido e espere secar.",
          "Escolha o acabamento: verniz (proteção forte, brilho), seladora + cera (aspecto natural), óleo/dinamarquês (realça veios, retoque fácil) ou tinta (cobre tudo).",
          "Aplique camadas FINAS, sempre no sentido dos veios.",
          "Entre demãos, espere secar e passe lixa 220 ou 320 bem de leve para derrubar a aspereza.",
          "Aplique 2 ou 3 demãos e espere a cura completa (veja o rótulo) antes de usar o móvel."
        ],
        tip: "Camadas finas e mais demãos SEMPRE vencem uma camada grossa: secam melhor, não escorrem e o acabamento fica muito mais liso."
      }
    ],
    quiz: [
      {
        q: "Qual material NÃO deve ser usado em área com respingos constantes de água (sem tratamento especial)?",
        options: [
          "Compensado naval",
          "MDF comum",
          "Madeira maciça envernizada",
          "Plástico"
        ],
        answer: 1,
        explain: "MDF comum absorve água e incha de forma irreversível. Para áreas úmidas existem chapas 'ultra' resistentes à umidade, ou prefira compensado naval."
      },
      {
        q: "O parafuso da dobradiça espanou (gira em falso) no MDF. Solução clássica:",
        options: [
          "Usar um parafuso muito maior e forçar",
          "Preencher o furo com palitos e cola branca, esperar secar e reparafusar",
          "Colar a porta com fita dupla-face",
          "Trocar o armário inteiro"
        ],
        answer: 1,
        explain: "Palito + cola branca reconstitui o material do furo. Depois de seco, o parafuso morde firme de novo. Truque de marceneiro que resolve quase sempre."
      },
      {
        q: "Em que sentido se deve lixar a madeira?",
        options: [
          "Em círculos, para cobrir mais área",
          "No sentido dos veios da madeira",
          "Perpendicular aos veios, para desbastar mais",
          "Tanto faz, o resultado é igual"
        ],
        answer: 1,
        explain: "Lixar contra ou em círculo deixa riscos que aparecem (e muito) depois do verniz. No sentido dos veios, os micro-riscos somem na textura natural."
      },
      {
        q: "Por que fazer pré-furo antes de parafusar perto da borda de MDF?",
        options: [
          "Para o parafuso ficar mais bonito",
          "Para evitar que a chapa rache/estoure na borda",
          "Para gastar menos parafusos",
          "Pré-furo é desnecessário em MDF"
        ],
        answer: 1,
        explain: "O MDF não tem fibras longas como madeira maciça: o parafuso entra como cunha e estoura a borda. O pré-furo abre caminho e preserva a chapa."
      },
      {
        q: "Na aplicação de verniz, o melhor resultado vem de:",
        options: [
          "Uma camada bem grossa de uma vez",
          "Várias camadas finas, lixando de leve entre demãos",
          "Aplicar com a madeira empoeirada para dar aderência",
          "Aplicar sob sol forte para secar rápido"
        ],
        answer: 1,
        explain: "Camadas finas secam uniformes e sem escorridos; a lixa fina entre demãos remove asperezas. Sol forte e poeira são inimigos do acabamento."
      }
    ]
  },

  {
    id: "limpeza",
    name: "Limpeza",
    icon: "🧽",
    color: "#10b981",
    description: "Produtos certos (e misturas proibidas!), técnicas por superfície e rotinas que mantêm a casa em dia.",
    guides: [
      {
        id: "misturas-perigosas",
        title: "Misturas de produtos que você NUNCA deve fazer",
        difficulty: "easy",
        time: "leitura de 6 min",
        tools: ["Nenhuma — conhecimento que protege"],
        warning: "Misturar água sanitária com outros produtos pode gerar gases tóxicos (cloramina, gás cloro) que causam lesões pulmonares graves.",
        steps: [
          "Água sanitária + amoníaco (muitos limpa-vidros): gera cloramina — gás tóxico. NUNCA misture.",
          "Água sanitária + vinagre ou outros ácidos: libera gás cloro, ainda mais perigoso.",
          "Água sanitária + álcool: pode formar clorofórmio e outros compostos nocivos.",
          "Regra de ouro: use UM produto por vez e enxágue bem antes de aplicar outro.",
          "Use produtos em ambiente ventilado e com luvas; nunca em ambiente fechado com crianças ou pets.",
          "Guarde produtos nos frascos originais, com rótulo, longe de alimentos e fora do alcance de crianças."
        ],
        tip: "Sentiu cheiro forte e irritação nos olhos/garganta ao limpar? Saia do ambiente, ventile e só volte quando o ar estiver limpo."
      },
      {
        id: "limpeza-por-superficie",
        title: "Cada superfície com seu produto certo",
        difficulty: "easy",
        time: "leitura de 8 min",
        tools: ["Panos de microfibra", "Detergente neutro", "Álcool 70%", "Vinagre de álcool"],
        warning: "Produtos ácidos (vinagre, limpadores 'removedores') corroem mármore, granito e pedras naturais. Nelas, use apenas detergente neutro.",
        steps: [
          "Mármore e granito: água + detergente neutro, secar em seguida. Nunca vinagre ou produtos ácidos.",
          "Madeira e laminados: pano levemente úmido com detergente neutro; excesso de água estufa o material.",
          "Vidros e espelhos: álcool ou solução com vinagre + pano de microfibra; jornal amassado dá brilho extra.",
          "Inox: detergente neutro no sentido do escovado; evite esponja de aço, que risca para sempre.",
          "Telas (TV, notebook): DESLIGADO, pano de microfibra seco ou levemente umedecido com água destilada. Nunca borrife líquido direto.",
          "Rejuntes: pasta de bicarbonato + água com escova de dentes velha resolve na maioria dos casos."
        ],
        tip: "Microfibra limpa mais com menos produto e não risca. Tenha panos de cores diferentes por área (cozinha, banheiro, superfícies) para não cruzar contaminação."
      },
      {
        id: "rotina-limpeza",
        title: "Montando uma rotina de limpeza realista",
        difficulty: "easy",
        time: "15 min de planejamento",
        tools: ["Papel e caneta ou app de notas"],
        warning: "Rotina irreal é rotina abandonada: comece pequeno e ajuste. Consistência vence intensidade.",
        steps: [
          "Diário (10-15 min): louça, pia seca, cama arrumada, lixo cheio para fora, uma 'varrida rápida' nas áreas usadas.",
          "2-3x por semana: banheiros (vaso, pia, box), varrer/aspirar a casa, trocar panos de prato.",
          "Semanal: troca de roupa de cama, passar pano nos pisos, limpar espelhos e pontos de gordura da cozinha.",
          "Mensal: geladeira por dentro, micro-ondas, ralos com água quente, atrás de móveis leves.",
          "Semestral: lavar cortinas, limpar janelas por fora, filtros de ar-condicionado e coifa, calafetagens do box.",
          "Divida as tarefas entre os moradores e coloque no calendário — o que não tem dia marcado, não acontece."
        ],
        tip: "A técnica dos '15 minutos por dia' mantém a casa 80% em ordem sem fins de semana perdidos na faxina."
      }
    ],
    quiz: [
      {
        q: "O que acontece ao misturar água sanitária com amoníaco?",
        options: [
          "A limpeza fica mais potente",
          "Forma-se cloramina, um gás tóxico perigoso para os pulmões",
          "Nada, os produtos se anulam",
          "Vira um desinfetante natural"
        ],
        answer: 1,
        explain: "A mistura libera cloramina: irrita e lesiona as vias respiratórias, podendo levar à internação. Nunca misture produtos de limpeza."
      },
      {
        q: "Qual produto NÃO deve ser usado em bancada de mármore ou granito?",
        options: [
          "Detergente neutro",
          "Água",
          "Vinagre e produtos ácidos",
          "Pano de microfibra"
        ],
        answer: 2,
        explain: "Pedras naturais são sensíveis a ácidos: o vinagre corrói o polimento e mancha permanentemente. Nelas, só detergente neutro."
      },
      {
        q: "Como limpar corretamente a tela da TV?",
        options: [
          "Borrifando limpa-vidros direto na tela",
          "Com esponja e detergente",
          "Desligada, com pano de microfibra seco ou levemente umedecido",
          "Com álcool puro e papel toalha"
        ],
        answer: 2,
        explain: "Líquido borrifado escorre para dentro do aparelho, e químicos agressivos danificam o revestimento da tela. Microfibra macia resolve."
      },
      {
        q: "Por que usar panos de cores diferentes para cozinha e banheiro?",
        options: [
          "Por estética e organização apenas",
          "Para evitar contaminação cruzada entre áreas",
          "Porque cada cor limpa melhor uma sujeira",
          "Não faz diferença"
        ],
        answer: 1,
        explain: "O pano do banheiro carrega microrganismos que não devem chegar perto de alimentos. Um código de cores simples evita esse cruzamento."
      },
      {
        q: "Qual a forma mais eficaz de manter a casa limpa sem 'faxinas maratona'?",
        options: [
          "Limpar tudo apenas uma vez por mês, com força total",
          "Rotina curta diária + tarefas distribuídas na semana",
          "Usar mais produto de limpeza de uma vez",
          "Fechar os cômodos que não usa"
        ],
        answer: 1,
        explain: "Consistência vence intensidade: 10-15 minutos diários evitam o acúmulo que transforma a limpeza em um evento exaustivo."
      }
    ]
  },

  {
    id: "manutencao",
    name: "Manutenção",
    icon: "🛠️",
    color: "#64748b",
    description: "Prevenção que evita prejuízo: calendário de cuidados, mofo, infiltrações e pequenos reparos de rotina.",
    guides: [
      {
        id: "calendario-manutencao",
        title: "Calendário anual de manutenção da casa",
        difficulty: "easy",
        time: "leitura de 8 min",
        tools: ["Agenda ou app de calendário"],
        warning: "Manutenção adiada quase sempre vira conserto caro: uma calha entupida hoje é uma infiltração na laje amanhã.",
        steps: [
          "Mensal: teste o botão do DR no quadro de energia; limpe ralos e sifões com água quente; confira validade de itens da despensa de emergência.",
          "Trimestral: limpe filtros do ar-condicionado e da coifa; verifique rejuntes e vedação do box; olhe sob as pias em busca de umidade.",
          "Semestral: limpe calhas e ralos de área externa (antes das estações de chuva); teste mangueira e validade do regulador de gás; lubrifique dobradiças e fechaduras com grafite.",
          "Anual: revise o telhado (telhas trincadas/deslocadas); faça manutenção do aquecedor a gás com técnico; lave a caixa d'água (ou contrate); repinte pontos de ferrugem em grades e portões.",
          "A cada 5 anos: reavalie a instalação elétrica com eletricista; troque o regulador de gás; considere repintura externa.",
          "Anote tudo no calendário do celular com repetição automática — manutenção lembrada é manutenção feita."
        ],
        tip: "Crie uma pasta (física ou digital) com manuais, notas fiscais e datas de manutenção — valoriza o imóvel e organiza a vida."
      },
      {
        id: "mofo",
        title: "Mofo e umidade: eliminar e prevenir",
        difficulty: "medium",
        time: "1 h + prevenção contínua",
        tools: ["Luvas", "Máscara", "Água sanitária diluída OU vinagre", "Borrifador", "Pano"],
        warning: "Mofo extenso (paredes inteiras, teto) ou recorrente indica problema estrutural de umidade — trate a causa, não só a mancha. Pessoas alérgicas ou asmáticas não devem fazer essa limpeza.",
        steps: [
          "Proteja-se: luvas, máscara e ambiente ventilado.",
          "Identifique a causa: condensação (ambiente fechado), infiltração (parede externa/laje) ou umidade ascendente (base da parede).",
          "Para limpar: borrife solução de água sanitária (1 parte para 3 de água) OU vinagre puro — NUNCA os dois juntos.",
          "Deixe agir 15-30 minutos, esfregue com pano ou escova e seque bem.",
          "Previna: ventile diariamente (10 min de janelas abertas já ajudam), afaste móveis 5 cm das paredes frias, use desumidificador em áreas críticas.",
          "Se a mancha voltar sempre no mesmo lugar, investigue infiltração: pode ser cano na parede, telhado ou impermeabilização vencida."
        ],
        tip: "Mofo no armário? Potinhos de giz escolar ou de carvão dentro dele absorvem umidade e reduzem muito o problema."
      },
      {
        id: "infiltracao",
        title: "Lendo os sinais de infiltração antes do estrago",
        difficulty: "medium",
        time: "inspeção de 30 min",
        tools: ["Lanterna", "Celular para fotos"],
        warning: "Infiltração perto de pontos elétricos é risco de choque e curto — desligue o circuito da área afetada até resolver.",
        steps: [
          "Percorra a casa após chuvas fortes: olhe tetos, cantos de parede e volta de janelas.",
          "Sinais clássicos: tinta bolhando ou descascando, manchas amareladas/escuras, cheiro de umidade, rejunte escurecendo.",
          "Bolhas na base das paredes indicam umidade subindo do solo (falha de impermeabilização).",
          "Mancha no teto sob banheiro do andar de cima: suspeite de vedação do box, rejunte ou tubulação.",
          "Fotografe e date os pontos: acompanhar a evolução ajuda o profissional a achar a causa.",
          "Aja pequeno agora: renovar rejunte, silicone do box e calafetagem de janelas resolve muitos casos e custa pouco."
        ],
        tip: "Teste do box: forre o chão externo com jornal seco e tome um banho normal. Jornal molhado mostra exatamente por onde a água escapa."
      }
    ],
    quiz: [
      {
        q: "Com que frequência se recomenda testar o botão do DR do quadro elétrico?",
        options: [
          "Nunca — pode estragar",
          "Mensalmente",
          "Somente quando cair energia",
          "A cada 10 anos"
        ],
        answer: 1,
        explain: "O teste mensal garante que o mecanismo não travou. Aperte 'teste': ele deve desarmar. Se não desarmar, chame um eletricista — sua proteção contra choques está comprometida."
      },
      {
        q: "Mancha de mofo volta sempre no mesmo canto da parede externa. A causa mais provável é:",
        options: [
          "Falta de produto de limpeza mais forte",
          "Um problema de umidade/infiltração que precisa ser tratado na origem",
          "Tinta de cor escura",
          "Excesso de sol na parede"
        ],
        answer: 1,
        explain: "Mofo recorrente é sintoma, não causa. Limpar a mancha sem tratar a umidade (infiltração, condensação) garante que ela voltará."
      },
      {
        q: "Por que limpar calhas antes da estação de chuvas?",
        options: [
          "Apenas por estética",
          "Calha entupida transborda e causa infiltrações em lajes e paredes",
          "Para as folhas não atraírem pássaros",
          "Calhas não precisam de limpeza"
        ],
        answer: 1,
        explain: "Com a calha entupida, a água transborda para onde não devia: laje, platibanda e paredes. É das manutenções mais baratas com maior prejuízo evitado."
      },
      {
        q: "Apareceu uma mancha úmida no teto do banheiro, bem abaixo do banheiro do vizinho de cima. Suspeito número 1:",
        options: [
          "Chuva, mesmo em dia seco",
          "Vedação do box, rejunte ou tubulação do andar de cima",
          "Tinta de má qualidade",
          "Umidade natural do banheiro"
        ],
        answer: 1,
        explain: "Água desce: mancha sob área molhada do vizinho aponta para o box, rejuntes ou canos dele. Documentar com fotos ajuda na conversa e no reparo."
      },
      {
        q: "Qual atitude NÃO faz parte de uma boa prevenção contra mofo?",
        options: [
          "Ventilar os ambientes diariamente",
          "Afastar móveis das paredes frias",
          "Manter a casa sempre fechada para não entrar poeira",
          "Usar desumidificador em áreas críticas"
        ],
        answer: 2,
        explain: "Casa fechada acumula vapor de banhos, cozimento e respiração — condensa nas paredes frias e vira mofo. Ventilação diária é a prevenção nº 1."
      }
    ]
  }
];

/* ---------- Jogo: Emergência em Casa ---------- */
const EMERGENCY_SCENARIOS = [
  {
    tag: "⚡ Elétrica",
    situation: "Uma tomada da sala começa a soltar faíscas e sai um filete de fumaça.",
    options: [
      "Jogar água na tomada imediatamente",
      "Desligar o disjuntor do circuito (ou o geral) e não usar a tomada até um eletricista avaliar",
      "Puxar o aparelho da tomada com força"
    ],
    answer: 1,
    explain: "Água conduz eletricidade (risco de choque) e puxar o plugue com faíscas expõe a mão ao arco elétrico. Corte a energia pelo disjuntor primeiro."
  },
  {
    tag: "🔥 Gás",
    situation: "Ao entrar na cozinha, você sente forte cheiro de gás.",
    options: [
      "Acender a luz para verificar o fogão",
      "Abrir janelas, fechar o registro de gás e sair sem acionar nada elétrico",
      "Ligar o exaustor para puxar o gás para fora"
    ],
    answer: 1,
    explain: "Interruptores e motores geram faíscas capazes de detonar o gás acumulado. Ventile, corte a fonte e chame ajuda de FORA do ambiente."
  },
  {
    tag: "🔥 Incêndio",
    situation: "O óleo da frigideira pega fogo no fogão.",
    options: [
      "Jogar água para apagar",
      "Desligar o fogo e abafar a frigideira com uma tampa ou pano grosso ÚMIDO (não molhado)",
      "Levar a frigideira correndo para a pia"
    ],
    answer: 1,
    explain: "Água em óleo quente EXPLODE em bola de fogo. Abafar corta o oxigênio. Carregar a panela espalha óleo em chamas pelo caminho."
  },
  {
    tag: "🚰 Água",
    situation: "Um cano estoura sob a pia e a água jorra sem parar.",
    options: [
      "Fechar o registro (do cômodo ou o geral da casa)",
      "Tampar o cano com o dedo e gritar por ajuda",
      "Colocar baldes e esperar parar sozinho"
    ],
    answer: 0,
    explain: "Só o registro corta a alimentação. Por isso todo morador precisa saber ONDE fica o registro geral antes da emergência acontecer."
  },
  {
    tag: "⚡ Choque",
    situation: "Uma pessoa recebe choque e continua grudada no aparelho elétrico.",
    options: [
      "Puxar a pessoa rapidamente com as mãos",
      "Desligar o disjuntor geral (ou desconectar com material isolante: cabo de vassoura seco) e chamar o SAMU 192",
      "Jogar água para 'cortar' a corrente"
    ],
    answer: 1,
    explain: "Tocar na vítima energizada transfere o choque para você. Corte a energia primeiro; se impossível, afaste-a com material seco e isolante."
  },
  {
    tag: "🔥 Incêndio",
    situation: "Começa um incêndio pequeno na lixeira e há um extintor ABC no corredor.",
    options: [
      "Apontar o jato para o TOPO das chamas",
      "Apontar o jato para a BASE do fogo, em movimentos de varredura",
      "Esvaziar o extintor de uma vez no centro do fogo"
    ],
    answer: 1,
    explain: "O fogo se alimenta na base, onde está o combustível. Varrer a base com o jato é a técnica correta (lembre: Puxar o pino, Apontar, Apertar, Varrer)."
  },
  {
    tag: "☣️ Química",
    situation: "Ao limpar o banheiro, você mistura produtos sem querer e sobe um cheiro forte que arde os olhos.",
    options: [
      "Terminar a limpeza rápido antes que o cheiro piore",
      "Sair imediatamente do ambiente, ventilar e só voltar quando o ar estiver limpo",
      "Jogar mais água sanitária para neutralizar"
    ],
    answer: 1,
    explain: "Ardência nos olhos e garganta = gás tóxico (provável cloramina ou cloro). Cada minuto respirando isso lesiona os pulmões. Saia e ventile."
  },
  {
    tag: "🚰 Água + Elétrica",
    situation: "O banheiro alagou e a água está se aproximando de uma extensão ligada no chão do corredor.",
    options: [
      "Correr e puxar a extensão da água",
      "Desligar o disjuntor da área ANTES de tocar em qualquer coisa molhada",
      "Secar com rodo por cima da extensão"
    ],
    answer: 1,
    explain: "Água + eletricidade é combinação fatal. Nunca toque em equipamentos elétricos em área alagada antes de cortar a energia no quadro."
  },
  {
    tag: "🔥 Gás",
    situation: "A chama do fogão apagou sozinha, mas o gás continuou saindo por alguns minutos.",
    options: [
      "Reacender imediatamente com o acendedor",
      "Fechar o queimador, ventilar bem a cozinha e só reacender depois que o cheiro sumir",
      "Acender um fósforo para verificar se há gás no ar"
    ],
    answer: 1,
    explain: "O gás acumulado pode inflamar de uma vez na reacendida ('flashback'). Ventile até o cheiro sumir completamente antes de acender qualquer chama."
  },
  {
    tag: "🛠️ Ferimento",
    situation: "Você se corta feio com um estilete durante um reparo e o sangramento é intenso.",
    options: [
      "Fazer um torniquete apertado imediatamente",
      "Pressionar o ferimento com pano limpo, elevar o membro e procurar atendimento se não estancar",
      "Lavar com álcool puro e continuar o trabalho"
    ],
    answer: 1,
    explain: "Pressão direta e elevação estancam a maioria dos sangramentos. Torniquete é recurso extremo; álcool no corte lesiona o tecido e não estanca."
  },
  {
    tag: "⚡ Tempestade",
    situation: "Caiu um temporal com raios e a energia começou a oscilar (luzes piscando).",
    options: [
      "Continuar usando o computador — nada vai acontecer",
      "Desligar da tomada os eletrônicos sensíveis até a rede estabilizar",
      "Tomar banho quente enquanto a energia volta"
    ],
    answer: 1,
    explain: "Oscilações e surtos de raios queimam eletrônicos (e chuveiro elétrico durante tempestade tem risco adicional). Tirar da tomada é a proteção real."
  },
  {
    tag: "🧯 Prevenção",
    situation: "Você vai dormir e percebe que esqueceu uma vela acesa na sala.",
    options: [
      "Deixar acesa, velas apagam sozinhas",
      "Apagar a vela — chama alguma fica acesa sem supervisão",
      "Colocar a vela dentro de um armário para proteger do vento"
    ],
    answer: 1,
    explain: "Velas sem supervisão são causa clássica de incêndios domésticos. A regra é absoluta: saiu do cômodo ou vai dormir, apagou a chama."
  }
];

/* ---------- Jogo: Ferramenta Certa (pares) ---------- */
const TOOL_PAIRS = [
  { tool: "🔧 Chave inglesa", task: "Apertar porcas e conexões de tamanhos variados" },
  { tool: "🪛 Chave Phillips", task: "Parafusos com fenda em cruz" },
  { tool: "🔨 Martelo de unha", task: "Pregar e remover pregos" },
  { tool: "📏 Trena", task: "Medir distâncias e peças" },
  { tool: "🫧 Nível de bolha", task: "Conferir se a prateleira está reta" },
  { tool: "🌀 Furadeira + broca de vídea", task: "Furar parede de alvenaria" },
  { tool: "🧻 Fita veda-rosca", task: "Vedar roscas de conexões hidráulicas" },
  { tool: "⚫ Fita isolante", task: "Isolar emendas de fios elétricos" },
  { tool: "🪠 Desentupidor", task: "Desobstruir vaso e ralos por pressão" },
  { tool: "🗜️ Alicate universal", task: "Segurar, dobrar e cortar arames e fios" }
];

/* ---------- Conquistas ---------- */
const BADGES = [
  { id: "first-guide", emoji: "📖", name: "Primeiro passo", desc: "Conclua seu primeiro guia" },
  { id: "first-quiz", emoji: "✅", name: "Testado e aprovado", desc: "Complete seu primeiro quiz" },
  { id: "quiz-perfect", emoji: "💯", name: "Nota máxima", desc: "Gabarite um quiz (100%)" },
  { id: "module-master", emoji: "🎓", name: "Especialista", desc: "Conclua todos os guias e o quiz de um módulo" },
  { id: "emergency-hero", emoji: "🚨", name: "Herói da emergência", desc: "Acerte 10+ no jogo de emergências" },
  { id: "tool-wizard", emoji: "🧰", name: "Mestre das ferramentas", desc: "Complete o jogo da ferramenta certa" },
  { id: "all-modules", emoji: "🏆", name: "Casa segura total", desc: "Torne-se especialista em todos os 7 módulos" },
  { id: "level-5", emoji: "⭐", name: "Nível 5", desc: "Alcance o nível 5 de experiência" }
];
