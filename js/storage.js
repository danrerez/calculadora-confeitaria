/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       BELLA DOCES — js/storage.js                           ║
 * ║       Camada de persistência em localStorage                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Responsável por ler e escrever dados no localStorage.
 * Os dados do ESTOQUE ficam salvos permanentemente.
 * Os dados da CALCULADORA ficam salvos por sessão (sessionStorage).
 *
 * CHAVES:
 *   'bellaDoces_stock'  → Array de ingredientes cadastrados
 *   'bellaDoces_calc'   → Estado atual da calculadora
 */

const STOCK_KEY = 'bellaDoces_stock';
const CALC_KEY  = 'bellaDoces_calc';

/* ═══════════════════════════════════════
   ESTOQUE (localStorage — permanente)
════════════════════════════════════════ */

/**
 * Carrega a lista de ingredientes do estoque.
 * @returns {Array} Lista de ingredientes
 */
function loadStock() {
  try {
    const raw = localStorage.getItem(STOCK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[Storage] Erro ao carregar estoque:', e);
    return [];
  }
}

/**
 * Salva a lista de ingredientes no estoque.
 * @param {Array} stock
 */
function saveStock(stock) {
  try {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
  } catch (e) {
    console.warn('[Storage] Erro ao salvar estoque:', e);
  }
}

/* ═══════════════════════════════════════
   CALCULADORA (sessionStorage — sessão)
════════════════════════════════════════ */

/**
 * Salva o estado da calculadora.
 * @param {Object} state
 */
function saveCalcState(state) {
  try {
    sessionStorage.setItem(CALC_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Storage] Erro ao salvar estado da calculadora:', e);
  }
}

/**
 * Carrega o estado da calculadora.
 * @returns {Object|null}
 */
function loadCalcState() {
  try {
    const raw = sessionStorage.getItem(CALC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[Storage] Erro ao carregar estado da calculadora:', e);
    return null;
  }
}

/**
 * Limpa o estado da calculadora.
 */
function clearCalcState() {
  try {
    sessionStorage.removeItem(CALC_KEY);
  } catch (e) {
    console.warn('[Storage] Erro ao limpar calculadora:', e);
  }
}
