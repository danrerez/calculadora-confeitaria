/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       BELLA DOCES — js/calculator.js                        ║
 * ║       Lógica das 5 etapas de precificação                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ESTADO DA CALCULADORA:
 *   calcState.sections  → Ingredientes por seção
 *   calcState.labor     → Mão de obra
 *   calcState.expenses  → Despesas fixas
 *   calcState.margin    → % de margem de lucro
 *   calcState.step      → Etapa atual
 *
 * SEÇÕES DE INGREDIENTES:
 *   massa | calda | recheio | cobertura | embalagem
 */

/* ─────────────────────────────────────
   ESTADO DA CALCULADORA
───────────────────────────────────── */
let calcState = {
  step: 1,
  sections: {
    massa:     [],   // Array de { id, name, cost, source, detail }
    calda:     [],
    recheio:   [],
    cobertura: [],
    embalagem: [],
  },
  labor: { rate: 0, time: 0, total: 0 },
  expenses: { light: 0, water: 0, internet: 0, gas: 0 },
  margin: 30,
};

// Mapeamento: seção → emoji
const SECTION_ICONS = {
  massa:     '🌾',
  calda:     '🍯',
  recheio:   '🍓',
  cobertura: '🍫',
  embalagem: '📦',
};

/* ─────────────────────────────────────
   NAVEGAÇÃO ENTRE ETAPAS
───────────────────────────────────── */

/**
 * Navega para a etapa indicada.
 * Atualiza barra de progresso e estado.
 * @param {number} target
 */
function goToStep(target) {
  // Oculta etapa atual
  document.querySelectorAll('.calc-step').forEach(s => s.classList.remove('active'));
  const panel = document.getElementById(`step-${target}`);
  if (panel) panel.classList.add('active');

  // Atualiza dots de progresso
  document.querySelectorAll('.prog-step').forEach(dot => {
    const s = parseInt(dot.dataset.step);
    dot.classList.remove('active', 'done');
    if (s === target) dot.classList.add('active');
    if (s < target)   dot.classList.add('done');
  });

  // Atualiza linhas entre dots
  document.querySelectorAll('.prog-line').forEach((line, idx) => {
    line.classList.toggle('done', idx + 1 < target);
  });

  calcState.step = target;

  // Se chegou ao resultado, renderiza
  if (target === 5) renderResult();

  // Scroll suave ao início
  document.getElementById('calcMain')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  persistCalcState();
}

/* ─────────────────────────────────────
   INGREDIENTES NA CALCULADORA
   (adicionados via modal)
───────────────────────────────────── */

/**
 * Adiciona um ingrediente a uma seção e renderiza.
 * Chamado pelo modal após confirmação.
 *
 * @param {string} section  - Seção destino (massa, calda, etc.)
 * @param {Object} ingData  - { id, name, cost, source, detail }
 */
function addIngredientToSection(section, ingData) {
  calcState.sections[section].push(ingData);
  renderSection(section);
  recalcSectionTotal(section);
  persistCalcState();
}

/**
 * Remove um ingrediente de uma seção.
 * @param {string} section
 * @param {string} ingId
 */
function removeIngFromSection(section, ingId) {
  calcState.sections[section] = calcState.sections[section].filter(i => i.id !== ingId);

  const el = document.getElementById(`ing-${ingId}`);
  if (el) {
    el.style.transition = 'opacity 0.2s, transform 0.2s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(6px)';
    setTimeout(() => { el.remove(); }, 200);
  }

  recalcSectionTotal(section);
  persistCalcState();
}

/**
 * Renderiza todos os ingredientes de uma seção no DOM.
 * @param {string} section
 */
function renderSection(section) {
  const list = document.getElementById(`list-${section}`);
  if (!list) return;

  list.innerHTML = '';
  calcState.sections[section].forEach(ing => {
    list.appendChild(createIngItem(section, ing));
  });
}

/**
 * Cria o elemento HTML de um item de ingrediente na calculadora.
 * @param {string} section
 * @param {Object} ing
 * @returns {HTMLElement}
 */
function createIngItem(section, ing) {
  const div = document.createElement('div');
  div.className = 'ing-item';
  div.id = `ing-${ing.id}`;

  div.innerHTML = `
    <span class="ing-item-icon">${SECTION_ICONS[section] || '🧂'}</span>
    <div class="ing-item-info">
      <div class="ing-item-name">${escapeHtml(ing.name)}</div>
      <div class="ing-item-detail">${escapeHtml(ing.detail || '')}</div>
    </div>
    <span class="ing-item-cost">${formatBRL(ing.cost)}</span>
    <button
      class="ing-item-remove"
      onclick="removeIngFromSection('${section}', '${ing.id}')"
      title="Remover"
      aria-label="Remover ${escapeHtml(ing.name)}"
    >✕</button>
  `;

  return div;
}

/**
 * Recalcula o total de uma seção e atualiza o DOM.
 * Também dispara o recálculo geral.
 * @param {string} section
 */
function recalcSectionTotal(section) {
  const total = calcState.sections[section].reduce((sum, i) => sum + (i.cost || 0), 0);
  const el = document.getElementById(`total-${section}`);
  if (el) el.textContent = formatBRL(total);

  recalcGrandTotals();
}

/**
 * Recalcula o total geral de todos os ingredientes
 * e atualiza despesas variáveis.
 */
function recalcGrandTotals() {
  const sections = ['massa', 'calda', 'recheio', 'cobertura'];
  const ingTotal = sections.reduce((sum, sec) =>
    sum + calcState.sections[sec].reduce((s, i) => s + (i.cost || 0), 0), 0
  );

  const el = document.getElementById('grand-total-ing');
  if (el) el.textContent = formatBRL(ingTotal);

  // Atualiza despesas variáveis (depende de ingTotal + embalagem + labor)
  calcExpenses();
}

/* ─────────────────────────────────────
   ETAPA 3: MÃO DE OBRA
───────────────────────────────────── */

/**
 * Recalcula mão de obra em tempo real.
 */
function calcLabor() {
  const rate  = parseFloat(document.getElementById('hourlyRate')?.value) || 0;
  const time  = parseFloat(document.getElementById('prodTime')?.value)   || 0;
  const total = rate * time;

  calcState.labor = { rate, time, total };

  document.getElementById('lr-rate').textContent  = formatBRL(rate);
  document.getElementById('lr-time').textContent  = `${time}h`;
  document.getElementById('laborTotal').textContent = formatBRL(total);

  calcExpenses();
  persistCalcState();
}

/* ─────────────────────────────────────
   ETAPA 4: DESPESAS
───────────────────────────────────── */

/**
 * Recalcula despesas fixas e variáveis.
 * Despesas variáveis = 10% do custo base (ing + emb + labor + fixas).
 */
function calcExpenses() {
  const light    = parseFloat(document.getElementById('expLight')?.value)    || 0;
  const water    = parseFloat(document.getElementById('expWater')?.value)    || 0;
  const internet = parseFloat(document.getElementById('expInternet')?.value) || 0;
  const gas      = parseFloat(document.getElementById('expGas')?.value)      || 0;

  calcState.expenses = { light, water, internet, gas };

  const fixedTotal = light + water + internet + gas;

  // Custo base sem variáveis (para evitar referência circular)
  const ingTotal = ['massa','calda','recheio','cobertura'].reduce((s, sec) =>
    s + calcState.sections[sec].reduce((ss, i) => ss + (i.cost || 0), 0), 0
  );
  const embTotal = calcState.sections.embalagem.reduce((s, i) => s + (i.cost || 0), 0);
  const laborTotal = calcState.labor.total;

  const baseForVariable = ingTotal + embTotal + laborTotal + fixedTotal;
  const variableTotal   = baseForVariable * 0.10;

  // DOM
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = formatBRL(val); };
  set('fixedTotal', fixedTotal);
  set('variableTotal', variableTotal);
  set('expensesTotal', fixedTotal + variableTotal);

  persistCalcState();
}

/* ─────────────────────────────────────
   ETAPA 5: RESULTADO FINAL
───────────────────────────────────── */

/**
 * Calcula e renderiza toda a etapa de resultado.
 */
function renderResult() {
  // Garante que os dados estão atualizados
  calcLabor();
  calcExpenses();

  const margin = parseFloat(document.getElementById('marginInput').value) || 30;
  calcState.margin = margin;

  // Coleta de totais
  const ingTotal = ['massa','calda','recheio','cobertura'].reduce((s, sec) =>
    s + calcState.sections[sec].reduce((ss, i) => ss + (i.cost || 0), 0), 0
  );
  const embTotal    = calcState.sections.embalagem.reduce((s, i) => s + (i.cost || 0), 0);
  const laborTotal  = calcState.labor.total;
  const { light, water, internet, gas } = calcState.expenses;
  const fixedTotal  = light + water + internet + gas;
  const baseForVar  = ingTotal + embTotal + laborTotal + fixedTotal;
  const varTotal    = baseForVar * 0.10;
  const cost        = ingTotal + embTotal + laborTotal + fixedTotal + varTotal;
  const marginVal   = cost * (margin / 100);
  const finalPrice  = cost + marginVal;

  // Definição das linhas do breakdown
  const segments = [
    { label: 'Ingredientes',          val: ingTotal,   color: '#E07D96' },
    { label: 'Embalagens',            val: embTotal,   color: '#F2B8C6' },
    { label: 'Mão de Obra',           val: laborTotal, color: '#7AAD6A' },
    { label: 'Despesas Fixas',        val: fixedTotal, color: '#C8983A' },
    { label: 'Despesas Variáveis 10%',val: varTotal,   color: '#A8C898' },
  ];

  // Breakdown de linhas
  const bd = document.getElementById('resultBreakdown');
  if (bd) {
    bd.innerHTML = segments.map(s => `
      <div class="result-row">
        <span class="result-row-label">${s.label}</span>
        <span class="result-row-val">${formatBRL(s.val)}</span>
      </div>
    `).join('') + `
      <div class="result-row">
        <span class="result-row-label" style="font-weight:800">Total de Custos</span>
        <span class="result-row-val" style="color:var(--rosa-escuro)">${formatBRL(cost)}</span>
      </div>
    `;
  }

  // Barra de composição
  const bar    = document.getElementById('compBar');
  const legend = document.getElementById('compLegend');
  if (bar && legend) {
    bar.innerHTML    = '';
    legend.innerHTML = '';

    if (cost > 0) {
      segments.forEach(s => {
        const pct = (s.val / cost) * 100;
        if (pct < 0.1) return;

        const seg = document.createElement('div');
        seg.className   = 'comp-seg';
        seg.style.width = `${pct}%`;
        seg.style.background = s.color;
        seg.title = `${s.label}: ${pct.toFixed(1)}%`;
        bar.appendChild(seg);

        const leg = document.createElement('div');
        leg.className = 'legend-item';
        leg.innerHTML = `
          <div class="legend-dot" style="background:${s.color}"></div>
          <span>${s.label} (${pct.toFixed(0)}%)</span>
        `;
        legend.appendChild(leg);
      });
    }
  }

  // Margem e preço final
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl('marginValue', formatBRL(marginVal));
  setEl('finalPrice', formatBRL(finalPrice));
  setEl('costDisplay', formatBRL(cost));
  setEl('profitDisplay', formatBRL(marginVal));

  // Animação no preço
  const fp = document.getElementById('finalPrice');
  if (fp) { fp.classList.remove('fade-in'); void fp.offsetWidth; fp.classList.add('fade-in'); }

  // Slider de margem
  updateMarginSlider(margin);
  persistCalcState();
}

/* ─────────────────────────────────────
   MARGEM DE LUCRO
───────────────────────────────────── */

/**
 * Atualizado quando o input numérico muda.
 */
function updateMargin() {
  const val = parseFloat(document.getElementById('marginInput').value) || 0;
  calcState.margin = val;
  document.getElementById('marginSlider').value = Math.min(val, 200);
  updateMarginSlider(val);
  renderResult();
}

/**
 * Atualizado quando o slider muda.
 * @param {number|string} val
 */
function syncMargin(val) {
  const v = parseInt(val);
  document.getElementById('marginInput').value = v;
  calcState.margin = v;
  updateMarginSlider(v);
  renderResult();
}

/**
 * Atualiza o visual do slider (gradient de preenchimento).
 * @param {number} val
 */
function updateMarginSlider(val) {
  const slider = document.getElementById('marginSlider');
  if (!slider) return;
  const pct = Math.min((val / 200) * 100, 100);
  slider.style.background = `linear-gradient(to right, var(--verde) 0%, var(--verde) ${pct}%, var(--creme-md) ${pct}%)`;
}

/* ─────────────────────────────────────
   RESET
───────────────────────────────────── */

/**
 * Confirma e reinicia a calculadora.
 */
function resetCalc() {
  if (!confirm('🎂 Iniciar um novo cálculo?\n\nTodos os dados serão apagados.')) return;
  clearCalcState();
  window.location.reload();
}

/* ─────────────────────────────────────
   PERSISTÊNCIA
───────────────────────────────────── */

/**
 * Salva o estado da calculadora em sessionStorage.
 */
function persistCalcState() {
  const snapshot = {
    step: calcState.step,
    sections: calcState.sections,
    labor: calcState.labor,
    expenses: calcState.expenses,
    margin: calcState.margin,
    laborRate: document.getElementById('hourlyRate')?.value || '',
    laborTime: document.getElementById('prodTime')?.value   || '',
    expLight:    document.getElementById('expLight')?.value    || '',
    expWater:    document.getElementById('expWater')?.value    || '',
    expInternet: document.getElementById('expInternet')?.value || '',
    expGas:      document.getElementById('expGas')?.value      || '',
  };
  saveCalcState(snapshot);
}

/**
 * Restaura o estado da calculadora do sessionStorage.
 */
function restoreCalcState() {
  const saved = loadCalcState();
  if (!saved) return;

  // Restaura seções
  if (saved.sections) {
    Object.keys(calcState.sections).forEach(sec => {
      if (saved.sections[sec]) {
        calcState.sections[sec] = saved.sections[sec];
        renderSection(sec);
        recalcSectionTotal(sec);
      }
    });
  }

  // Restaura mão de obra
  if (saved.laborRate) {
    const hr = document.getElementById('hourlyRate');
    if (hr) hr.value = saved.laborRate;
  }
  if (saved.laborTime) {
    const pt = document.getElementById('prodTime');
    if (pt) pt.value = saved.laborTime;
  }
  calcLabor();

  // Restaura despesas
  const expFields = ['expLight','expWater','expInternet','expGas'];
  expFields.forEach(f => {
    if (saved[f]) {
      const el = document.getElementById(f);
      if (el) el.value = saved[f];
    }
  });
  calcExpenses();

  // Restaura margem
  if (saved.margin !== undefined) {
    calcState.margin = saved.margin;
    const mi = document.getElementById('marginInput');
    if (mi) mi.value = saved.margin;
    const ms = document.getElementById('marginSlider');
    if (ms) ms.value = Math.min(saved.margin, 200);
    updateMarginSlider(saved.margin);
  }

  // Navega para a etapa salva
  if (saved.step && saved.step > 1) {
    goToStep(saved.step);
  }
}
