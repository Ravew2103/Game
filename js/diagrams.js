/* ============ Casa Segura — diagramas SVG embutidos ============
   Desenhados com cores do tema (var(--text), var(--surface-2)...)
   para funcionarem em modo claro e escuro. */

const DIAGRAMS = {

  /* ---------- Chuveiro elétrico: anatomia e ligação ---------- */
  chuveiro: `
  <svg viewBox="0 0 620 330" role="img" aria-label="Diagrama de um chuveiro elétrico com suas partes identificadas">
    <rect x="0" y="0" width="620" height="30" fill="var(--surface-2)"/>
    <line x1="0" y1="30" x2="620" y2="30" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="270" y="30" width="18" height="52" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="266" y="68" width="26" height="14" fill="none" stroke="var(--text)" stroke-width="1" stroke-dasharray="3 2"/>
    <path d="M246 84 L312 84 L332 152 L226 152 Z" fill="var(--mc, #f59e0b)" fill-opacity="0.18" stroke="var(--text)" stroke-width="1.5"/>
    <ellipse cx="279" cy="158" rx="58" ry="10" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <circle cx="252" cy="190" r="3" fill="#0ea5e9"/><circle cx="280" cy="202" r="3" fill="#0ea5e9"/>
    <circle cx="308" cy="190" r="3" fill="#0ea5e9"/><circle cx="266" cy="216" r="3" fill="#0ea5e9"/>
    <circle cx="296" cy="220" r="3" fill="#0ea5e9"/>
    <polyline points="350,30 350,60 324,96" fill="none" stroke="#dc2626" stroke-width="2.5"/>
    <polyline points="358,30 358,64 332,102" fill="none" stroke="var(--text)" stroke-width="2.5"/>
    <polyline points="366,30 366,68 340,110" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-dasharray="6 3"/>
    <rect x="318" y="92" width="30" height="24" rx="4" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="322" y="126" width="26" height="14" rx="3" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/>
    <line x1="150" y1="52" x2="266" y2="50" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="30" y="56" font-size="12.5" fill="var(--text)">Cano com rosca</text>
    <line x1="205" y1="76" x2="264" y2="75" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="30" y="80" font-size="12.5" fill="var(--text)">Fita veda-rosca (3–5 voltas)</text>
    <line x1="196" y1="121" x2="238" y2="120" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="30" y="125" font-size="12.5" fill="var(--text)">Corpo — aperte SÓ com a mão</text>
    <line x1="200" y1="166" x2="222" y2="160" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="30" y="170" font-size="12.5" fill="var(--text)">Espalhador (limpe os furinhos)</text>
    <text x="380" y="52" font-size="12.5" fill="#dc2626">Fios de energia</text>
    <text x="380" y="72" font-size="12.5" fill="#16a34a">Terra (verde) — obrigatório</text>
    <line x1="376" y1="100" x2="350" y2="102" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="380" y="104" font-size="12.5" fill="var(--text)">Emenda com conector, bem isolada</text>
    <line x1="376" y1="136" x2="350" y2="133" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="380" y="140" font-size="12.5" fill="var(--text)">Chave de temperatura:</text>
    <text x="380" y="156" font-size="12.5" fill="var(--text)">mude só com ele DESLIGADO</text>
    <text x="30" y="310" font-size="12" fill="var(--text-muted)">⚠ Antes de religar o disjuntor: abra a água e deixe o chuveiro encher.</text>
  </svg>`,

  /* ---------- Quadro de energia ---------- */
  quadro: `
  <svg viewBox="0 0 560 250" role="img" aria-label="Diagrama de um quadro de distribuição com disjuntor geral, DR e disjuntores por circuito">
    <rect x="40" y="14" width="480" height="212" rx="10" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>
    <rect x="70" y="36" width="72" height="64" rx="6" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="98" y="48" width="16" height="40" rx="3" fill="var(--mc, #2f6fed)"/>
    <text x="106" y="116" font-size="12" font-weight="700" fill="var(--text)" text-anchor="middle">GERAL</text>
    <rect x="166" y="36" width="66" height="64" rx="6" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="180" y="48" width="14" height="40" rx="3" fill="var(--mc, #2f6fed)"/>
    <circle cx="214" cy="68" r="8" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/>
    <text x="214" y="72" font-size="10" font-weight="700" fill="var(--text)" text-anchor="middle">T</text>
    <text x="199" y="116" font-size="12" font-weight="700" fill="var(--text)" text-anchor="middle">DR</text>
    <text x="262" y="56" font-size="11.5" fill="var(--text-muted)">← aperte o botão “T”</text>
    <text x="262" y="71" font-size="11.5" fill="var(--text-muted)">1× por mês: ele deve</text>
    <text x="262" y="86" font-size="11.5" fill="var(--text-muted)">desarmar na hora</text>
    ${[0,1,2,3,4,5].map(i => `
      <rect x="${70 + i * 70}" y="136" width="46" height="54" rx="5" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.2"/>
      <rect x="${86 + i * 70}" y="146" width="13" height="34" rx="3" fill="var(--text-muted)"/>`).join("")}
    <text x="93" y="206" font-size="10" fill="var(--text)" text-anchor="middle">Chuveiro</text>
    <text x="163" y="206" font-size="10" fill="var(--text)" text-anchor="middle">Cozinha</text>
    <text x="233" y="206" font-size="10" fill="var(--text)" text-anchor="middle">Tomadas 1</text>
    <text x="303" y="206" font-size="10" fill="var(--text)" text-anchor="middle">Tomadas 2</text>
    <text x="373" y="206" font-size="10" fill="var(--text)" text-anchor="middle">Iluminação</text>
    <text x="443" y="206" font-size="10" fill="var(--text)" text-anchor="middle">Ar-cond.</text>
    <text x="280" y="243" font-size="12" fill="var(--text-muted)" text-anchor="middle">Etiquete cada disjuntor — na emergência, você desliga o circuito certo em segundos.</text>
  </svg>`,

  /* ---------- Sifão da pia em corte ---------- */
  sifao: `
  <svg viewBox="0 0 560 300" role="img" aria-label="Corte de uma pia mostrando o sifão de copo e o fecho hídrico">
    <line x1="30" y1="50" x2="320" y2="50" stroke="var(--text)" stroke-width="3"/>
    <path d="M90 50 L110 120 L230 120 L250 50" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="158" y="120" width="18" height="46" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="138" y="166" width="58" height="60" rx="10" fill="var(--surface)" stroke="var(--text)" stroke-width="1.8"/>
    <line x1="138" y1="172" x2="196" y2="172" stroke="var(--text)" stroke-width="1" stroke-dasharray="3 2"/>
    <line x1="158" y1="166" x2="158" y2="198" stroke="var(--text)" stroke-width="1.2"/>
    <line x1="176" y1="166" x2="176" y2="198" stroke="var(--text)" stroke-width="1.2"/>
    <rect x="141" y="198" width="52" height="25" rx="6" fill="#0ea5e9" fill-opacity="0.35"/>
    <rect x="196" y="172" width="150" height="18" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="346" y="140" width="18" height="92" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <line x1="60" y1="138" x2="156" y2="128" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="30" y="142" font-size="12.5" fill="var(--text)">Ralo da pia</text>
    <text x="360" y="132" font-size="12.5" fill="var(--text)">Saída para o esgoto</text>
    <line x1="372" y1="214" x2="198" y2="214" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="378" y="218" font-size="12.5" fill="#dc2626">Gordura e cabelo</text>
    <text x="378" y="234" font-size="12.5" fill="#dc2626">acumulam AQUI</text>
    <line x1="120" y1="262" x2="150" y2="228" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="30" y="278" font-size="12.5" fill="var(--text)">Copo do sifão: desrosqueia com a mão</text>
    <text x="30" y="294" font-size="12.5" fill="var(--text)">(coloque um balde embaixo!)</text>
    <line x1="286" y1="252" x2="182" y2="212" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="290" y="262" font-size="12.5" fill="#0ea5e9">Água parada (fecho hídrico):</text>
    <text x="290" y="278" font-size="12.5" fill="#0ea5e9">é ela que barra o cheiro do esgoto</text>
  </svg>`,

  /* ---------- Zonas de risco ao furar parede ---------- */
  paredeZonas: `
  <svg viewBox="0 0 560 320" role="img" aria-label="Parede mostrando as zonas de risco vertical e horizontal ao redor de tomadas e interruptores">
    <rect x="20" y="20" width="520" height="280" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="20" y="196" width="520" height="44" fill="#dc2626" fill-opacity="0.12" stroke="#dc2626" stroke-width="1" stroke-dasharray="5 4" stroke-opacity="0.5"/>
    <rect x="146" y="20" width="44" height="280" fill="#dc2626" fill-opacity="0.13" stroke="#dc2626" stroke-width="1" stroke-dasharray="5 4" stroke-opacity="0.5"/>
    <rect x="376" y="20" width="44" height="280" fill="#dc2626" fill-opacity="0.13" stroke="#dc2626" stroke-width="1" stroke-dasharray="5 4" stroke-opacity="0.5"/>
    <rect x="150" y="200" width="36" height="36" rx="4" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/>
    <circle cx="162" cy="218" r="2.5" fill="var(--text)"/><circle cx="174" cy="218" r="2.5" fill="var(--text)"/>
    <text x="168" y="252" font-size="10.5" fill="var(--text)" text-anchor="middle">tomada</text>
    <rect x="380" y="150" width="36" height="36" rx="4" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="390" y="158" width="16" height="20" rx="2" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1"/>
    <text x="398" y="146" font-size="10.5" fill="var(--text)" text-anchor="middle">interruptor</text>
    <text x="80" y="110" font-size="26" fill="#16a34a" text-anchor="middle">✓</text>
    <text x="290" y="90" font-size="26" fill="#16a34a" text-anchor="middle">✓</text>
    <text x="480" y="285" font-size="26" fill="#16a34a" text-anchor="middle">✓</text>
    <text x="168" y="38" font-size="11" fill="#dc2626" text-anchor="middle">⚠ risco</text>
    <text x="398" y="38" font-size="11" fill="#dc2626" text-anchor="middle">⚠ risco</text>
    <text x="530" y="222" font-size="11" fill="#dc2626" text-anchor="end">⚠ risco</text>
  </svg>`,

  /* ---------- Símbolos de etiqueta de roupa ---------- */
  etiquetas: `
  <svg viewBox="0 0 560 190" role="img" aria-label="Os cinco símbolos básicos das etiquetas de roupa: lavagem, alvejante, secadora, ferro e lavagem a seco">
    <path d="M32 48 L44 90 L76 90 L88 48" fill="none" stroke="var(--text)" stroke-width="2.5"/>
    <path d="M28 48 Q36 40 44 48 Q52 56 60 48 Q68 40 76 48 Q84 56 92 48" fill="none" stroke="var(--text)" stroke-width="2.5"/>
    <text x="60" y="80" font-size="17" font-weight="700" fill="var(--text)" text-anchor="middle">40</text>
    <polygon points="148,88 192,88 170,46" fill="none" stroke="var(--text)" stroke-width="2.5"/>
    <line x1="146" y1="42" x2="194" y2="92" stroke="#dc2626" stroke-width="3"/>
    <line x1="194" y1="42" x2="146" y2="92" stroke="#dc2626" stroke-width="3"/>
    <rect x="255" y="44" width="50" height="46" fill="none" stroke="var(--text)" stroke-width="2.5"/>
    <circle cx="280" cy="67" r="17" fill="none" stroke="var(--text)" stroke-width="2.5"/>
    <circle cx="280" cy="67" r="3.2" fill="var(--text)"/>
    <path d="M362 88 L362 82 Q362 52 392 52 L416 52 Q421 52 421 58 L421 88 Z" fill="none" stroke="var(--text)" stroke-width="2.5"/>
    <circle cx="392" cy="72" r="3.2" fill="var(--text)"/>
    <circle cx="500" cy="67" r="23" fill="none" stroke="var(--text)" stroke-width="2.5"/>
    <text x="60" y="122" font-size="12" font-weight="600" fill="var(--text)" text-anchor="middle">Lavagem</text>
    <text x="60" y="138" font-size="11" fill="var(--text-muted)" text-anchor="middle">número = temp.</text>
    <text x="60" y="152" font-size="11" fill="var(--text-muted)" text-anchor="middle">máx. da água</text>
    <text x="170" y="122" font-size="12" font-weight="600" fill="var(--text)" text-anchor="middle">Alvejante</text>
    <text x="170" y="138" font-size="11" fill="var(--text-muted)" text-anchor="middle">X = proibido</text>
    <text x="280" y="122" font-size="12" font-weight="600" fill="var(--text)" text-anchor="middle">Secadora</text>
    <text x="280" y="138" font-size="11" fill="var(--text-muted)" text-anchor="middle">1 ponto = fraco</text>
    <text x="280" y="152" font-size="11" fill="var(--text-muted)" text-anchor="middle">2 = médio</text>
    <text x="390" y="122" font-size="12" font-weight="600" fill="var(--text)" text-anchor="middle">Passar a ferro</text>
    <text x="390" y="138" font-size="11" fill="var(--text-muted)" text-anchor="middle">pontos = calor</text>
    <text x="500" y="122" font-size="12" font-weight="600" fill="var(--text)" text-anchor="middle">Lavagem a seco</text>
    <text x="500" y="138" font-size="11" fill="var(--text-muted)" text-anchor="middle">só lavanderia</text>
  </svg>`,

  /* ---------- Torneira em corte ---------- */
  torneira: `
  <svg viewBox="0 0 560 280" role="img" aria-label="Corte de uma torneira comum mostrando volante, castelo e courinho de vedação">
    <rect x="480" y="110" width="20" height="110" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="330" y="150" width="150" height="20" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="200" y="140" width="130" height="40" rx="8" fill="var(--surface)" stroke="var(--text)" stroke-width="1.8"/>
    <rect x="120" y="148" width="80" height="16" rx="4" fill="var(--surface)" stroke="var(--text)" stroke-width="1.8"/>
    <circle cx="134" cy="180" r="3" fill="#0ea5e9"/><circle cx="134" cy="196" r="3" fill="#0ea5e9"/>
    <circle cx="134" cy="212" r="3" fill="#0ea5e9"/>
    <rect x="245" y="95" width="34" height="45" fill="var(--surface)" stroke="var(--text)" stroke-width="1.8"/>
    <line x1="245" y1="103" x2="279" y2="103" stroke="var(--text)" stroke-width="1" stroke-dasharray="3 2"/>
    <line x1="245" y1="113" x2="279" y2="113" stroke="var(--text)" stroke-width="1" stroke-dasharray="3 2"/>
    <rect x="230" y="75" width="64" height="20" rx="8" fill="var(--surface-2)" stroke="var(--text)" stroke-width="1.8"/>
    <ellipse cx="262" cy="172" rx="12" ry="5" fill="#dc2626" fill-opacity="0.65"/>
    <line x1="248" y1="180" x2="276" y2="180" stroke="var(--text)" stroke-width="1.5"/>
    <line x1="150" y1="68" x2="228" y2="82" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="40" y="66" font-size="12.5" fill="var(--text)">Volante (o que você gira)</text>
    <line x1="160" y1="108" x2="243" y2="112" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="40" y="106" font-size="12.5" fill="var(--text)">Castelo — desrosqueie</text>
    <text x="40" y="121" font-size="12.5" fill="var(--text)">com chave inglesa</text>
    <line x1="170" y1="242" x2="252" y2="178" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="40" y="256" font-size="12.5" fill="#dc2626">Courinho (vedante): gasto = pinga.</text>
    <text x="40" y="271" font-size="12.5" fill="#dc2626">Trocar custa centavos!</text>
    <line x1="400" y1="136" x2="410" y2="150" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="330" y="115" font-size="12.5" fill="var(--text)">Entrada de água:</text>
    <text x="330" y="130" font-size="12.5" font-weight="700" fill="var(--text)">feche o registro antes!</text>
    <text x="120" y="140" font-size="11.5" fill="var(--text-muted)">Bica</text>
  </svg>`
};

/* ---------- Tabela visual: guia de manchas ---------- */
const STAIN_TABLE_HTML = `
<div class="guide-table-wrap">
  <table class="guide-table">
    <thead>
      <tr><th>Mancha</th><th>Trate com</th><th>Como fazer</th><th>Nunca faça</th></tr>
    </thead>
    <tbody>
      <tr><td>🍟 Gordura / óleo</td><td>Detergente de louça</td><td>Aplique puro sobre a mancha, esfregue de leve, deixe 10 min e lave</td><td>Só jogar na máquina sem tratar — a gordura fixa</td></tr>
      <tr><td>🍷 Vinho tinto</td><td>Água fria + detergente neutro</td><td>Absorva o excesso com pano branco, molhe em água fria e aplique o detergente; em tecido claro, finalize com água oxigenada 10 vol.</td><td>Esfregar com força ou usar água quente</td></tr>
      <tr><td>☕ Café / chá</td><td>Água fria + vinagre branco diluído</td><td>Enxágue por trás do tecido com água fria, aplique a solução e lave</td><td>Passar a peça antes de a mancha sair</td></tr>
      <tr><td>🩸 Sangue</td><td>Água FRIA + sabão</td><td>Enxágue imediatamente em água fria; em claros, água oxigenada 10 vol. faz espuma e solta a mancha</td><td>Água quente — 'cozinha' a proteína e fixa para sempre</td></tr>
      <tr><td>😓 Suor amarelado</td><td>Bicarbonato + água oxigenada</td><td>Faça uma pasta, aplique nas axilas da peça, deixe 30 min e lave</td><td>Alvejante com cloro — reage com o suor e amarela ainda mais</td></tr>
      <tr><td>🖊️ Caneta esferográfica</td><td>Álcool 70%</td><td>Coloque um pano por baixo e bata com algodão embebido, de fora para dentro</td><td>Esfregar em círculos — espalha a tinta</td></tr>
      <tr><td>🍫 Chocolate</td><td>Água fria + detergente neutro</td><td>Raspe o excesso com colher, trate por trás do tecido e lave</td><td>Água quente ou secadora antes de sair</td></tr>
      <tr><td>🫧 Chiclete</td><td>Gelo</td><td>Endureça o chiclete com gelo (ou congele a peça) e raspe com faca sem ponta</td><td>Tentar puxar quente — gruda mais fundo nas fibras</td></tr>
    </tbody>
  </table>
</div>`;
