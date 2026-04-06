/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       BELLA DOCES — js/app.js                               ║
 * ║       Inicialização e orquestração geral do app             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Este é o ponto de entrada do app.
 * Carregado por último (após todos os outros scripts).
 *
 * Responsabilidades:
 *   - Inicializar a navegação por abas
 *   - Renderizar estoque inicial
 *   - Restaurar estado da calculadora
 *   - Registrar utilitários globais (formatBRL, escapeHtml)
 */

/* ═══════════════════════════════════════
   UTILITÁRIOS GLOBAIS
   Disponíveis para todos os módulos
════════════════════════════════════════ */

/**
 * Formata número como moeda brasileira.
 * @param {number} val
 * @returns {string}
 */
function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', {
    style:                 'currency',
    currency:              'BRL',
    minimumFractionDigits: 2,
  }).format(val || 0);
}

/**
 * Escapa caracteres HTML para evitar XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* ═══════════════════════════════════════
   INICIALIZAÇÃO
════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navegação por abas (Calculadora / Estoque) ── */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // Atualiza botões
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === target);
        b.setAttribute('aria-selected', b.dataset.tab === target);
      });

      // Exibe view correspondente
      document.querySelectorAll('.app-view').forEach(v => {
        v.classList.toggle('active', v.id === `view-${target}`);
      });

      // Se foi para o estoque, garante renderização atualizada
      if (target === 'estoque') {
        renderStock(
          document.getElementById('stockSearch').value,
          document.getElementById('stockCategoryFilter').value
        );
      }
    });
  });

  /* ── Estoque: renderização inicial ── */
  renderStock();

  /* ── Calculadora: restaura estado da sessão anterior ── */
  restoreCalcState();

  /* ── Pré-popula ingredientes de exemplo no estoque
        se estiver vazio (ajuda no primeiro uso) ──     */
  if (loadStock().length === 0) {
    const defaults = [
      { name: 'Farinha de trigo',     qtyPkg: 1000, unit: 'g',  pkgPrice: 5.99,  category: 'massa',     notes: 'Pacote 1kg' },
      { name: 'Açúcar refinado',      qtyPkg: 1000, unit: 'g',  pkgPrice: 4.50,  category: 'massa',     notes: 'Pacote 1kg' },
      { name: 'Ovos',                 qtyPkg: 12,   unit: 'un', pkgPrice: 9.90,  category: 'massa',     notes: 'Dúzia' },
      { name: 'Manteiga',             qtyPkg: 200,  unit: 'g',  pkgPrice: 5.50,  category: 'massa',     notes: 'Tablete 200g' },
      { name: 'Leite',                qtyPkg: 1000, unit: 'ml', pkgPrice: 4.20,  category: 'calda',     notes: 'Caixinha 1L' },
      { name: 'Leite condensado',     qtyPkg: 395,  unit: 'g',  pkgPrice: 6.50,  category: 'recheio',   notes: 'Lata 395g' },
      { name: 'Creme de leite',       qtyPkg: 200,  unit: 'ml', pkgPrice: 4.80,  category: 'recheio',   notes: 'Caixinha 200ml' },
      { name: 'Chocolate em pó 50%',  qtyPkg: 200,  unit: 'g',  pkgPrice: 8.90,  category: 'cobertura', notes: 'Embalagem 200g' },
      { name: 'Granulado chocolate',  qtyPkg: 500,  unit: 'g',  pkgPrice: 12.00, category: 'cobertura', notes: 'Pacote 500g' },
      { name: 'Fermento em pó',       qtyPkg: 100,  unit: 'g',  pkgPrice: 3.20,  category: 'massa',     notes: 'Embalagem 100g' },
    ];

    const stock = defaults.map((item, idx) => ({
      id:          `stock_default_${idx}`,
      name:        item.name,
      qtyPkg:      item.qtyPkg,
      unit:        item.unit,
      pkgPrice:    item.pkgPrice,
      category:    item.category,
      notes:       item.notes,
      costPerUnit: item.pkgPrice / item.qtyPkg,
      createdAt:   new Date().toISOString(),
    }));

    saveStock(stock);
    renderStock();
  }

});
