/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       BELLA DOCES — js/estoque.js                           ║
 * ║       CRUD completo da aba Estoque                          ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Funções:
 *   renderStock()         → Renderiza o grid de cards do estoque
 *   filterStock(query)    → Filtra por nome e/ou categoria
 *   openStockModal(id)    → Abre modal de cadastro/edição
 *   saveStockItem()       → Salva (cria ou edita) um ingrediente
 *   deleteStockItem(id)   → Abre confirmação de exclusão
 *   confirmDelete()       → Executa a exclusão
 *   previewCostPerUnit()  → Calcula custo/unidade em tempo real
 *   updateStockBadge()    → Atualiza badge de contagem na aba
 */

// ID do item sendo excluído (compartilhado entre funções)
let pendingDeleteId = null;

/* ═══════════════════════════════════════
   RENDERIZAÇÃO DO GRID
════════════════════════════════════════ */

/**
 * Renderiza todos os cards do estoque no grid.
 * Aplica filtro se informado.
 * @param {string} [query='']       - Texto de busca
 * @param {string} [category='']   - Filtro de categoria
 */
function renderStock(query = '', category = '') {
  const stock  = loadStock();
  const grid   = document.getElementById('stockGrid');
  const empty  = document.getElementById('stockEmpty');

  // Filtra por nome e categoria
  const q = query.toLowerCase().trim();
  const filtered = stock.filter(item => {
    const matchName = !q || item.name.toLowerCase().includes(q);
    const matchCat  = !category || item.category === category;
    return matchName && matchCat;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    empty.classList.add('visible');
  } else {
    empty.classList.remove('visible');
    filtered.forEach(item => {
      grid.appendChild(createStockCard(item));
    });
  }

  updateStockBadge();
}

/**
 * Cria o elemento HTML de um card de ingrediente.
 * @param {Object} item
 * @returns {HTMLElement}
 */
function createStockCard(item) {
  const cpuText = formatCPU(item);

  const categoryLabels = {
    massa:     '🌾 Massa',
    calda:     '🍯 Calda',
    recheio:   '🍓 Recheio',
    cobertura: '🍫 Cobertura',
    embalagem: '📦 Embalagem',
    outros:    '📌 Outros',
  };

  const card = document.createElement('div');
  card.className = 'stock-card';
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="stock-card-header">
      <div class="stock-card-name">${escapeHtml(item.name)}</div>
      <div class="stock-card-category">${categoryLabels[item.category] || item.category}</div>
    </div>
    <div class="stock-card-pkg">
      Embalagem: ${item.qtyPkg} ${item.unit} por ${formatBRL(item.pkgPrice)}
    </div>
    <div class="stock-card-cpu">
      ${formatBRL(item.costPerUnit)} <span>/ ${item.unit}</span>
    </div>
    ${item.notes ? `<div class="stock-card-pkg" style="font-style:italic;opacity:.7">${escapeHtml(item.notes)}</div>` : ''}
    <div class="stock-card-actions">
      <button class="btn-stock-edit" onclick="openStockModal('${item.id}')">✏️ Editar</button>
      <button class="btn-stock-delete" onclick="deleteStockItem('${item.id}')">🗑️ Excluir</button>
    </div>
  `;

  return card;
}

/**
 * Filtra o estoque com base nos campos de busca/categoria.
 * Chamado pelo oninput do campo de busca e pelo onchange do select.
 * @param {string} query
 */
function filterStock(query) {
  const category = document.getElementById('stockCategoryFilter').value;
  renderStock(query, category);
}

/* ═══════════════════════════════════════
   MODAL DE CADASTRO / EDIÇÃO
════════════════════════════════════════ */

/**
 * Abre o modal de cadastro (novo) ou edição (por ID).
 * @param {string|null} [id=null] - ID do ingrediente para edição
 */
function openStockModal(id = null) {
  // Limpa campos
  document.getElementById('editStockId').value   = '';
  document.getElementById('stockName').value     = '';
  document.getElementById('stockQtyPkg').value   = '';
  document.getElementById('stockUnit').value     = 'g';
  document.getElementById('stockPkgPrice').value = '';
  document.getElementById('stockCategory').value = 'massa';
  document.getElementById('stockNotes').value    = '';
  document.getElementById('costPerUnitPreview').style.display = 'none';
  document.getElementById('modalStockTitle').textContent = 'Novo Ingrediente';

  if (id) {
    // Modo edição: preenche com dados existentes
    const stock = loadStock();
    const item  = stock.find(i => i.id === id);
    if (!item) return;

    document.getElementById('editStockId').value   = item.id;
    document.getElementById('stockName').value     = item.name;
    document.getElementById('stockQtyPkg').value   = item.qtyPkg;
    document.getElementById('stockUnit').value     = item.unit;
    document.getElementById('stockPkgPrice').value = item.pkgPrice;
    document.getElementById('stockCategory').value = item.category;
    document.getElementById('stockNotes').value    = item.notes || '';
    document.getElementById('modalStockTitle').textContent = 'Editar Ingrediente';

    previewCostPerUnit();
  }

  openModal('modalStock');
}

/**
 * Salva o item do estoque (cria ou atualiza).
 * Valida campos obrigatórios antes.
 */
function saveStockItem() {
  const name     = document.getElementById('stockName').value.trim();
  const qtyPkg   = parseFloat(document.getElementById('stockQtyPkg').value);
  const unit     = document.getElementById('stockUnit').value;
  const pkgPrice = parseFloat(document.getElementById('stockPkgPrice').value);
  const category = document.getElementById('stockCategory').value;
  const notes    = document.getElementById('stockNotes').value.trim();
  const editId   = document.getElementById('editStockId').value;

  // Validação
  if (!name) return alertField('stockName', 'Informe o nome do ingrediente');
  if (!qtyPkg || qtyPkg <= 0) return alertField('stockQtyPkg', 'Informe a quantidade da embalagem');
  if (!pkgPrice || pkgPrice <= 0) return alertField('stockPkgPrice', 'Informe o preço da embalagem');

  const costPerUnit = pkgPrice / qtyPkg;

  let stock = loadStock();

  if (editId) {
    // Atualiza existente
    stock = stock.map(item =>
      item.id === editId
        ? { ...item, name, qtyPkg, unit, pkgPrice, category, notes, costPerUnit }
        : item
    );
  } else {
    // Cria novo
    const newItem = {
      id: `stock_${Date.now()}`,
      name,
      qtyPkg,
      unit,
      pkgPrice,
      category,
      notes,
      costPerUnit,
      createdAt: new Date().toISOString(),
    };
    stock.push(newItem);
  }

  saveStock(stock);
  closeModal('modalStock');
  renderStock(
    document.getElementById('stockSearch').value,
    document.getElementById('stockCategoryFilter').value
  );
}

/* ═══════════════════════════════════════
   EXCLUSÃO
════════════════════════════════════════ */

/**
 * Abre o modal de confirmação de exclusão.
 * @param {string} id
 */
function deleteStockItem(id) {
  const stock = loadStock();
  const item  = stock.find(i => i.id === id);
  if (!item) return;

  pendingDeleteId = id;
  document.getElementById('deleteItemName').textContent = item.name;
  openModal('modalDelete');
}

/**
 * Executa a exclusão após confirmação.
 */
function confirmDelete() {
  if (!pendingDeleteId) return;

  let stock = loadStock();
  stock = stock.filter(i => i.id !== pendingDeleteId);
  saveStock(stock);

  pendingDeleteId = null;
  closeModal('modalDelete');
  renderStock(
    document.getElementById('stockSearch').value,
    document.getElementById('stockCategoryFilter').value
  );
}

/* ═══════════════════════════════════════
   PREVIEW CUSTO POR UNIDADE
════════════════════════════════════════ */

/**
 * Calcula e exibe o custo por unidade em tempo real
 * enquanto o usuário preenche o modal de estoque.
 */
function previewCostPerUnit() {
  const qty   = parseFloat(document.getElementById('stockQtyPkg').value) || 0;
  const price = parseFloat(document.getElementById('stockPkgPrice').value) || 0;
  const unit  = document.getElementById('stockUnit').value;
  const wrap  = document.getElementById('costPerUnitPreview');
  const val   = document.getElementById('cpuValue');

  if (qty > 0 && price > 0) {
    wrap.style.display = 'flex';
    val.textContent = `${formatBRL(price / qty)} / ${unit}`;
  } else {
    wrap.style.display = 'none';
  }
}

/* ═══════════════════════════════════════
   BADGE DE CONTAGEM
════════════════════════════════════════ */

/**
 * Atualiza o badge numérico na aba "Estoque".
 */
function updateStockBadge() {
  const stock  = loadStock();
  const badge  = document.getElementById('stockBadge');
  const count  = stock.length;

  badge.textContent = count;
  badge.classList.toggle('empty', count === 0);
}

/* ═══════════════════════════════════════
   UTILITÁRIOS LOCAIS
════════════════════════════════════════ */

/**
 * Formata o custo por unidade de um ingrediente.
 * @param {Object} item
 * @returns {string}
 */
function formatCPU(item) {
  return `${formatBRL(item.costPerUnit)} / ${item.unit}`;
}

/**
 * Destaca visualmente um campo inválido.
 * @param {string} fieldId
 * @param {string} message
 */
function alertField(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.style.borderColor = '#e05050';
  field.focus();
  field.addEventListener('input', () => {
    field.style.borderColor = '';
  }, { once: true });
  // Pequeno toast de aviso
  showToast(message, 'error');
}
