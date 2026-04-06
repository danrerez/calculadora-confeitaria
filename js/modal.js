/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       BELLA DOCES — js/modal.js                             ║
 * ║       Controle dos modais e fluxo de adição de ingredientes ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Funções:
 *   openModal(id)              → Abre um modal pelo ID
 *   closeModal(id)             → Fecha um modal pelo ID
 *   openAddModal(section)      → Abre o modal "Adicionar Ingrediente"
 *   switchModalTab(tab)        → Alterna entre "Do Estoque" / "Manual"
 *   filterModalStock(query)    → Filtra ingredientes no modal
 *   selectStockItem(stockId)   → Seleciona um ingrediente do estoque
 *   calcModalCost()            → Calcula custo com base na quantidade
 *   confirmAddIngredient()     → Confirma e adiciona o ingrediente
 */

// Seção de destino do ingrediente sendo adicionado
let currentAddSection = 'massa';

// ID do ingrediente do estoque selecionado no modal
let selectedStockId = null;

/* ─────────────────────────────────────
   CONTROLE BÁSICO DE MODAIS
───────────────────────────────────── */

/**
 * Abre um modal.
 * @param {string} id - ID do elemento .modal-overlay
 */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    // Foca o primeiro input para acessibilidade
    setTimeout(() => {
      const first = el.querySelector('input:not([type=hidden]), select, button.modal-close');
      if (first) first.focus();
    }, 100);
  }
}

/**
 * Fecha um modal.
 * @param {string} id
 */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Fecha modal ao clicar no overlay (fora da box)
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// Fecha modal com Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

/* ─────────────────────────────────────
   MODAL DE ADIÇÃO DE INGREDIENTE
───────────────────────────────────── */

/**
 * Abre o modal para adicionar ingrediente a uma seção.
 * Reseta o estado interno e popula a lista do estoque.
 * @param {string} section - Seção destino
 */
function openAddModal(section) {
  currentAddSection = section;
  selectedStockId   = null;

  // Título dinâmico conforme a seção
  const sectionNames = {
    massa:     'Massa',
    calda:     'Calda',
    recheio:   'Recheio',
    cobertura: 'Cobertura',
    embalagem: 'Embalagem',
  };

  document.getElementById('modalAddTitle').textContent =
    `Adicionar — ${sectionNames[section] || section}`;

  // Reseta aba para "Do Estoque"
  switchModalTab('stock');

  // Reseta campos manuais
  document.getElementById('manualName').value = '';
  document.getElementById('manualCost').value = '';
  document.getElementById('saveToStockCheck').checked = false;
  document.getElementById('saveToStockFields').style.display = 'none';

  // Reseta quantidade e preview
  resetStockSelection();

  // Popula lista do estoque
  populateModalStock('');

  openModal('modalAddIng');
}

/**
 * Alterna entre as abas "Do Estoque" e "Manual".
 * @param {string} tab - 'stock' | 'manual'
 */
function switchModalTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.modal-panel').forEach(p => p.classList.remove('active'));

  document.getElementById(`mtab-${tab}`).classList.add('active');
  document.getElementById(`mpanel-${tab}`).classList.add('active');
}

/* ─────────────────────────────────────
   ABA "DO ESTOQUE"
───────────────────────────────────── */

/**
 * Popula a lista de ingredientes do estoque no modal.
 * @param {string} [query=''] - Filtro de busca
 */
function populateModalStock(query = '') {
  const stock   = loadStock();
  const list    = document.getElementById('modalStockList');
  const empty   = document.getElementById('modalStockEmpty');
  const qtyWrap = document.getElementById('modalStockQty');

  if (!list) return;

  // Filtra por nome
  const q = query.toLowerCase().trim();
  const filtered = stock.filter(item =>
    !q || item.name.toLowerCase().includes(q)
  );

  list.innerHTML = '';

  if (stock.length === 0) {
    // Estoque completamente vazio
    list.style.display = 'none';
    empty.style.display = 'flex';
    qtyWrap.style.display = 'none';
    return;
  }

  list.style.display = 'flex';
  empty.style.display = 'none';

  if (filtered.length === 0) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--marrom-lt);font-size:.85rem">Nenhum resultado encontrado</div>';
    return;
  }

  filtered.forEach(item => {
    const div = document.createElement('div');
    div.className = 'modal-stock-item';
    div.dataset.id = item.id;

    if (item.id === selectedStockId) div.classList.add('selected');

    div.innerHTML = `
      <span class="msi-icon">${getCategoryIcon(item.category)}</span>
      <div class="msi-info">
        <div class="msi-name">${escapeHtml(item.name)}</div>
        <div class="msi-pkg">${item.qtyPkg} ${item.unit} · ${formatBRL(item.pkgPrice)}</div>
      </div>
      <div class="msi-cpu">${formatBRL(item.costPerUnit)}/${item.unit}</div>
    `;

    div.addEventListener('click', () => selectStockItem(item.id));
    list.appendChild(div);
  });
}

/**
 * Filtra a lista do modal de estoque.
 * @param {string} query
 */
function filterModalStock(query) {
  populateModalStock(query);
}

/**
 * Seleciona um ingrediente do estoque no modal.
 * Exibe os campos de quantidade.
 * @param {string} stockId
 */
function selectStockItem(stockId) {
  selectedStockId = stockId;

  // Destaca o item selecionado na lista
  document.querySelectorAll('.modal-stock-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === stockId);
  });

  // Busca o item
  const stock = loadStock();
  const item  = stock.find(i => i.id === stockId);
  if (!item) return;

  // Exibe card do ingrediente selecionado
  const card = document.getElementById('selectedIngCard');
  card.innerHTML = `
    <strong>${escapeHtml(item.name)}</strong>
    &nbsp;·&nbsp; ${formatBRL(item.costPerUnit)} por ${item.unit}
    &nbsp;·&nbsp; <span style="color:var(--marrom-lt)">Embalagem: ${item.qtyPkg}${item.unit} · ${formatBRL(item.pkgPrice)}</span>
  `;

  // Exibe unidade no badge
  document.getElementById('modalQtyUnit').textContent = item.unit;

  // Reseta o campo de quantidade
  document.getElementById('modalQtyInput').value = '';
  document.getElementById('modalCostValue').textContent = 'R$ 0,00';

  // Exibe os campos de quantidade
  document.getElementById('modalStockQty').style.display = 'flex';

  // Foca o campo de quantidade
  setTimeout(() => document.getElementById('modalQtyInput').focus(), 100);
}

/**
 * Calcula o custo baseado na quantidade informada.
 * Chamado pelo oninput do campo de quantidade.
 */
function calcModalCost() {
  if (!selectedStockId) return;

  const stock = loadStock();
  const item  = stock.find(i => i.id === selectedStockId);
  if (!item) return;

  const qty  = parseFloat(document.getElementById('modalQtyInput').value) || 0;
  const cost = qty * item.costPerUnit;

  document.getElementById('modalCostValue').textContent = formatBRL(cost);
}

/**
 * Reseta a seleção de ingrediente do estoque.
 */
function resetStockSelection() {
  selectedStockId = null;
  document.getElementById('modalStockQty').style.display = 'none';
  document.getElementById('modalQtyInput').value = '';
  document.getElementById('modalCostValue').textContent = 'R$ 0,00';
  document.getElementById('modalStockSearch').value = '';
}

/* ─────────────────────────────────────
   ABA "MANUAL" — Checkbox salvar no estoque
───────────────────────────────────── */

// Exibe/oculta campos extras quando checkbox "Salvar no estoque" é marcado
document.addEventListener('change', e => {
  if (e.target.id === 'saveToStockCheck') {
    const fields = document.getElementById('saveToStockFields');
    fields.style.display = e.target.checked ? 'flex' : 'none';
    if (e.target.checked) fields.style.flexDirection = 'column';
    if (e.target.checked) {
      // Preenche nome com o que foi digitado
      const name = document.getElementById('manualName').value.trim();
      if (name) document.getElementById('saveQtyPkg').focus();
    }
  }
});

/* ─────────────────────────────────────
   CONFIRMAR ADIÇÃO
───────────────────────────────────── */

/**
 * Confirma a adição do ingrediente (de qualquer tab).
 * Lida com os dois fluxos: Do Estoque e Manual.
 */
function confirmAddIngredient() {
  // Descobre qual tab está ativa
  const isStockTab = document.getElementById('mtab-stock').classList.contains('active');

  if (isStockTab) {
    confirmAddFromStock();
  } else {
    confirmAddManual();
  }
}

/**
 * Confirma adição de ingrediente selecionado do estoque.
 */
function confirmAddFromStock() {
  if (!selectedStockId) {
    showToast('Selecione um ingrediente do estoque', 'error');
    return;
  }

  const stock = loadStock();
  const item  = stock.find(i => i.id === selectedStockId);
  if (!item) return;

  const qty = parseFloat(document.getElementById('modalQtyInput').value) || 0;
  if (qty <= 0) {
    showToast('Informe a quantidade utilizada', 'error');
    document.getElementById('modalQtyInput').focus();
    return;
  }

  const cost = qty * item.costPerUnit;

  const ingData = {
    id:     `ing_${Date.now()}`,
    name:   item.name,
    cost:   cost,
    source: 'stock',
    detail: `${qty} ${item.unit} · ${formatBRL(item.costPerUnit)}/${item.unit}`,
  };

  addIngredientToSection(currentAddSection, ingData);
  closeModal('modalAddIng');
  showToast(`${item.name} adicionado ✓`, 'success');
}

/**
 * Confirma adição manual de ingrediente.
 * Opcionalmente salva no estoque.
 */
function confirmAddManual() {
  const name    = document.getElementById('manualName').value.trim();
  const costVal = parseFloat(document.getElementById('manualCost').value) || 0;

  if (!name) {
    showToast('Informe o nome do ingrediente', 'error');
    document.getElementById('manualName').focus();
    return;
  }

  if (costVal <= 0) {
    showToast('Informe um custo válido', 'error');
    document.getElementById('manualCost').focus();
    return;
  }

  const ingData = {
    id:     `ing_${Date.now()}`,
    name:   name,
    cost:   costVal,
    source: 'manual',
    detail: 'Inserido manualmente',
  };

  // Salva no estoque se marcado
  const saveCheck = document.getElementById('saveToStockCheck').checked;
  if (saveCheck) {
    const qtyPkg   = parseFloat(document.getElementById('saveQtyPkg').value)   || 0;
    const unit     = document.getElementById('saveUnit').value;
    const pkgPrice = parseFloat(document.getElementById('savePkgPrice').value) || 0;
    const category = document.getElementById('saveCategory').value;

    if (qtyPkg > 0 && pkgPrice > 0) {
      const newStockItem = {
        id:          `stock_${Date.now()}`,
        name:        name,
        qtyPkg:      qtyPkg,
        unit:        unit,
        pkgPrice:    pkgPrice,
        category:    category,
        notes:       '',
        costPerUnit: pkgPrice / qtyPkg,
        createdAt:   new Date().toISOString(),
      };
      const stock = loadStock();
      stock.push(newStockItem);
      saveStock(stock);
      renderStock();
      showToast(`${name} salvo no estoque ✓`, 'success');
    }
  }

  addIngredientToSection(currentAddSection, ingData);
  closeModal('modalAddIng');
  showToast(`${name} adicionado ✓`, 'success');
}

/* ─────────────────────────────────────
   UTILITÁRIOS
───────────────────────────────────── */

/**
 * Retorna o emoji de uma categoria.
 * @param {string} category
 * @returns {string}
 */
function getCategoryIcon(category) {
  const icons = {
    massa:     '🌾',
    calda:     '🍯',
    recheio:   '🍓',
    cobertura: '🍫',
    embalagem: '📦',
    outros:    '📌',
  };
  return icons[category] || '🧂';
}

/**
 * Exibe um toast de notificação temporário.
 * @param {string} message
 * @param {'success'|'error'} type
 */
function showToast(message, type = 'success') {
  // Remove toast existente
  const existing = document.getElementById('bella-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'bella-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: ${type === 'success' ? 'var(--verde)' : '#e05050'};
    color: white;
    padding: 10px 22px;
    border-radius: 999px;
    font-family: var(--font-body);
    font-size: 0.88rem;
    font-weight: 700;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    animation: toastIn 0.3s ease;
    white-space: nowrap;
    pointer-events: none;
  `;
  toast.textContent = message;

  // Adiciona estilo de animação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn {
      from { opacity:0; transform: translateX(-50%) translateY(12px); }
      to   { opacity:1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
