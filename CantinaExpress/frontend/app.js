// =============================================
// CANTINA EXPRESS — TOTEM LOGIC
// =============================================
const API = '';  // vazio = mesmo servidor (relativo)

// ---- ESTADO GLOBAL ----
let produtos = [];
let carrinho = [];
let categoriaAtual = 'todos';
let pedidoAtual = null;
let pagamentoAtual = null;
let tipoCartao = 'credito';
let pixPayload = '';
let pixTimer = null;
let pollTimer = null;

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  iniciarRelogio();
  carregarProdutos();
});

function iniciarRelogio() {
  const el = document.getElementById('welcome-clock');
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

async function carregarProdutos() {
  try {
    const res = await fetch(`${API}/produtos`);
    produtos = await res.json();
    renderProdutos();
  } catch (e) {
    console.warn('Erro ao carregar produtos, usando mock local');
    produtos = MOCK_LOCAL;
    renderProdutos();
  }
}

// =============================================
// NAVEGAÇÃO ENTRE TELAS
// =============================================
function showScreen(nome) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  const el = document.getElementById(`screen-${nome}`);
  if (!el) return;
  el.classList.add('active');

  // Ações por tela
  if (nome === 'cart') renderCarrinho();
  if (nome === 'payment-method') {
    document.getElementById('pm-total').textContent = formatMoeda(getTotal());
    if (carrinho.length === 0) { showScreen('catalog'); return; }
  }
  if (nome === 'card') {
    document.getElementById('card-screen-title').textContent =
      `💳 Pagamento com Cartão de ${tipoCartao === 'credito' ? 'Crédito' : 'Débito'}`;
    document.getElementById('card-pay-total').textContent = formatMoeda(getTotal());
  }
  if (nome === 'catalog') atualizarFloatingCart();
}

// =============================================
// CATÁLOGO
// =============================================
function renderProdutos(lista) {
  const grid = document.getElementById('products-grid');
  const itens = lista || (categoriaAtual === 'todos' ? produtos : produtos.filter(p => p.categoria === categoriaAtual));
  if (!itens.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Nenhum produto encontrado</div>`;
    return;
  }
  grid.innerHTML = itens.map(p => `
    <div class="product-card" style="animation:slideUp 0.3s ease both">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.nome}</div>
      <div class="product-desc">${p.descricao}</div>
      <div class="product-price">${formatMoeda(p.preco)}</div>
      <button class="add-btn" onclick="addAoCarrinho(${p.id})">+ Adicionar</button>
    </div>
  `).join('');
}

function filterCat(btn, cat) {
  categoriaAtual = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProdutos();
}

// =============================================
// CARRINHO
// =============================================
function addAoCarrinho(id) {
  const prod = produtos.find(p => p.id === id);
  if (!prod) return;
  const item = carrinho.find(c => c.id === id);
  if (item) item.qtd++;
  else carrinho.push({ ...prod, qtd: 1 });
  atualizarFloatingCart();
  feedbackAdd(id);
}

function feedbackAdd(id) {
  const btns = document.querySelectorAll('.add-btn');
  btns.forEach((btn, i) => {
    const gridItems = document.querySelectorAll('.product-card');
    if (gridItems[i]) {
      const prodId = parseInt(gridItems[i].querySelector('.add-btn')?.getAttribute('onclick')?.match(/\d+/)?.[0]);
      if (prodId === id) {
        btn.textContent = '✓ Adicionado!';
        btn.style.background = 'var(--success)';
        setTimeout(() => { btn.textContent = '+ Adicionar'; btn.style.background = ''; }, 1000);
      }
    }
  });
  atualizarFloatingCart();
}

function atualizarFloatingCart() {
  const total = carrinho.reduce((s, c) => s + c.preco * c.qtd, 0);
  const qtd = carrinho.reduce((s, c) => s + c.qtd, 0);
  const floating = document.getElementById('floating-cart');
  const badge = document.getElementById('cart-badge');
  const headerBtn = document.getElementById('cart-header-btn');

  if (badge) badge.textContent = qtd;
  if (document.getElementById('floating-label'))
    document.getElementById('floating-label').textContent = `Ver Carrinho (${qtd})`;
  if (document.getElementById('floating-total'))
    document.getElementById('floating-total').textContent = formatMoeda(total);

  if (floating) floating.classList.toggle('visible', qtd > 0);
  if (headerBtn) headerBtn.style.display = qtd > 0 ? 'flex' : 'none';
}

function getTotal() {
  return carrinho.reduce((s, c) => s + c.preco * c.qtd, 0);
}

function renderCarrinho() {
  const body = document.getElementById('cart-body');
  const totalEl = document.getElementById('cart-total-value');
  const checkoutBtn = document.getElementById('btn-checkout');

  if (!carrinho.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <span class="emoji">🛒</span>
        <h3 style="margin-bottom:8px">Carrinho vazio</h3>
        <p>Adicione itens do cardápio</p>
      </div>`;
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (totalEl) totalEl.textContent = 'R$ 0,00';
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;
  body.innerHTML = carrinho.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nome}</div>
        <div class="cart-item-price">${formatMoeda(item.preco)} un.</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="alterarQtd(${item.id},-1)">−</button>
        <span class="qty-num">${item.qtd}</span>
        <button class="qty-btn" onclick="alterarQtd(${item.id},1)">+</button>
      </div>
      <button class="remove-btn" onclick="removerItem(${item.id})" title="Remover">🗑</button>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = formatMoeda(getTotal());
}

function alterarQtd(id, delta) {
  const item = carrinho.find(c => c.id === id);
  if (!item) return;
  item.qtd += delta;
  if (item.qtd <= 0) removerItem(id);
  else { renderCarrinho(); atualizarFloatingCart(); }
}

function removerItem(id) {
  carrinho = carrinho.filter(c => c.id !== id);
  renderCarrinho();
  atualizarFloatingCart();
}

// =============================================
// PAGAMENTO
// =============================================
async function startPayment(metodo) {
  tipoCartao = metodo;

  // Criar pedido primeiro
  try {
    const res = await fetch(`${API}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: carrinho.map(c => ({ id: c.id, nome: c.nome, preco: c.preco, qtd: c.qtd })),
        total: getTotal(),
        metodoPagamento: metodo
      })
    });
    pedidoAtual = await res.json();
  } catch (e) {
    // fallback local
    pedidoAtual = {
      id: `local_${Date.now()}`,
      numero: Math.floor(Math.random() * 9000) + 1000,
      itens: carrinho.map(c => ({ id: c.id, nome: c.nome, preco: c.preco, qtd: c.qtd })),
      total: getTotal(),
      metodoPagamento: metodo
    };
  }

  if (metodo === 'pix') iniciarPix();
  else showScreen('card');
}

// ---- PIX ----
async function iniciarPix() {
  showScreen('pix');
  const valor = getTotal();
  document.getElementById('pix-valor').textContent = formatMoeda(valor);

  try {
    const res = await fetch(`${API}/pagamentos/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor, pedidoId: pedidoAtual.id })
    });
    const data = await res.json();
    pagamentoAtual = data;
    pixPayload = data.pixPayload;
    gerarQRCode(pixPayload);
    iniciarTimerPix(300);
    iniciarPolling(data.id);
  } catch (e) {
    pixPayload = `PIX_MOCK_${pedidoAtual.id}_${valor.toFixed(2)}`;
    gerarQRCode(pixPayload);
    iniciarTimerPix(300);
    // Simula confirmação após 8s
    setTimeout(() => confirmarPagamento({ tipo: 'pix', id: 'mock' }), 8000);
  }
}

function gerarQRCode(texto) {
  const el = document.getElementById('pix-qrcode');
  el.innerHTML = '';
  QRCode.toCanvas(document.createElement('canvas'), texto, { width: 220, margin: 0 }, (err, canvas) => {
    if (!err) el.appendChild(canvas);
  });
}

function iniciarTimerPix(segundos) {
  clearInterval(pixTimer);
  let restante = segundos;
  const el = document.getElementById('pix-timer');
  pixTimer = setInterval(() => {
    restante--;
    const m = String(Math.floor(restante / 60)).padStart(2, '0');
    const s = String(restante % 60).padStart(2, '0');
    if (el) el.textContent = `${m}:${s}`;
    if (restante <= 0) { clearInterval(pixTimer); if (el) el.textContent = 'Expirado'; }
  }, 1000);
}

function iniciarPolling(pagId) {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`${API}/pagamentos/${pagId}/status`);
      const data = await res.json();
      if (data.status === 'confirmado') {
        clearInterval(pollTimer);
        clearInterval(pixTimer);
        confirmarPagamento(data);
      }
    } catch (e) {}
  }, 2000);
}

function copyPixCode() {
  navigator.clipboard.writeText(pixPayload).catch(() => {});
  const btn = document.getElementById('pix-copy-btn');
  if (btn) { btn.textContent = '✓ Copiado!'; setTimeout(() => { btn.textContent = '📋 Copiar código PIX'; }, 2000); }
}

// ---- CARTÃO ----
function setCardType(tipo) {
  tipoCartao = tipo;
  document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tipo}`)?.classList.add('active');
  document.getElementById('card-screen-title').textContent =
    `💳 Pagamento com Cartão de ${tipo === 'credito' ? 'Crédito' : 'Débito'}`;
}

function flipCard(paraTras) {
  document.getElementById('card-inner')?.classList.toggle('flipped', paraTras);
}

function fmtCard(inp) {
  let v = inp.value.replace(/\D/g, '').substring(0, 16);
  inp.value = v.replace(/(.{4})/g, '$1 ').trim();
  updateCardDisplay();
}

function fmtExpiry(inp) {
  let v = inp.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
  inp.value = v;
  updateCardDisplay();
}

function updateCardDisplay() {
  const num = document.getElementById('card-number')?.value || '';
  const nome = document.getElementById('card-name')?.value || '';
  const exp = document.getElementById('card-expiry')?.value || '';
  const cvv = document.getElementById('card-cvv')?.value || '';

  const numDisplay = num.padEnd(19, ' ').replace(/[^ ]/g, (c, i) => c).substring(0, 19) || '•••• •••• •••• ••••';
  const numFormatted = num || '•••• •••• •••• ••••';

  if (document.getElementById('card-num-display'))
    document.getElementById('card-num-display').textContent = numFormatted || '•••• •••• •••• ••••';
  if (document.getElementById('card-name-display'))
    document.getElementById('card-name-display').textContent = nome.toUpperCase() || 'SEU NOME';
  if (document.getElementById('card-exp-display'))
    document.getElementById('card-exp-display').textContent = exp || 'MM/AA';
  if (document.getElementById('card-cvv-display'))
    document.getElementById('card-cvv-display').textContent = cvv || '•••';

  // Detectar bandeira
  const raw = num.replace(/\s/g, '');
  let brand = '●●●●';
  if (/^4/.test(raw)) brand = 'VISA';
  else if (/^5[1-5]/.test(raw)) brand = 'MASTER';
  else if (/^3[47]/.test(raw)) brand = 'AMEX';
  else if (/^6/.test(raw)) brand = 'ELO';
  if (document.getElementById('card-brand-display'))
    document.getElementById('card-brand-display').textContent = brand;
}

async function submitCard() {
  const numero = document.getElementById('card-number')?.value.replace(/\s/g, '');
  const nome = document.getElementById('card-name')?.value;
  const validade = document.getElementById('card-expiry')?.value;
  const cvv = document.getElementById('card-cvv')?.value;

  if (!numero || numero.length < 16) return alert('Número do cartão inválido');
  if (!nome) return alert('Informe o nome no cartão');
  if (!validade || validade.length < 5) return alert('Informe a validade');
  if (!cvv || cvv.length < 3) return alert('CVV inválido');

  showScreen('processing');
  document.getElementById('proc-title').textContent = 'Processando pagamento...';
  document.getElementById('proc-sub').textContent = 'Por favor, não remova o cartão';

  try {
    const res = await fetch(`${API}/pagamentos/cartao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, nome, validade, cvv, tipo: tipoCartao, valor: getTotal(), pedidoId: pedidoAtual.id })
    });
    if (!res.ok) {
      const err = await res.json();
      showScreen('card');
      return alert(err.erro || 'Cartão recusado. Tente outro método.');
    }
    const data = await res.json();
    pagamentoAtual = data;
    // Polling para confirmação
    aguardarCartao(data.id);
  } catch (e) {
    // Fallback mock
    setTimeout(() => confirmarPagamento({ tipo: 'cartao', subtipo: tipoCartao, cartaoFinal: numero.slice(-4), bandeira: 'Mock' }), 3000);
  }
}

function aguardarCartao(pagId) {
  const poll = setInterval(async () => {
    try {
      const res = await fetch(`${API}/pagamentos/${pagId}/status`);
      const data = await res.json();
      if (data.status === 'confirmado') {
        clearInterval(poll);
        confirmarPagamento(data);
      }
    } catch (e) {}
  }, 1500);
  // timeout segurança 15s
  setTimeout(() => { clearInterval(poll); confirmarPagamento({ tipo: 'cartao', subtipo: tipoCartao }); }, 15000);
}

// =============================================
// CONFIRMAR PAGAMENTO → COMPROVANTE
// =============================================
async function confirmarPagamento(pagData) {
  clearInterval(pixTimer);
  clearInterval(pollTimer);

  // Atualizar pedido no backend
  try {
    await fetch(`${API}/pedidos/${pedidoAtual.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pago', pagamentoId: pagData.id || 'mock', metodoPagamento: pagData.tipo })
    });
  } catch (e) {}

  pagamentoAtual = { ...pagamentoAtual, ...pagData };
  renderComprovante();
  showScreen('receipt');
}

// =============================================
// COMPROVANTE
// =============================================
function renderComprovante() {
  const agora = new Date();
  const papel = document.getElementById('receipt-paper');
  const itensHtml = carrinho.map(i =>
    `<div class="receipt-item">
      <span>${i.emoji} ${i.nome} x${i.qtd}</span>
      <span>${formatMoeda(i.preco * i.qtd)}</span>
    </div>`
  ).join('');

  const metodoPag = pagamentoAtual?.tipo === 'pix' ? '📱 PIX' :
    `💳 Cartão de ${pagamentoAtual?.subtipo === 'credito' ? 'Crédito' : 'Débito'}${pagamentoAtual?.bandeira ? ' — ' + pagamentoAtual.bandeira : ''}${pagamentoAtual?.cartaoFinal ? ' (••••' + pagamentoAtual.cartaoFinal + ')' : ''}`;

  papel.innerHTML = `
    <div class="receipt-header">
      <h3>🍔 CANTINA EXPRESS</h3>
      <p>SENAI • Autoatendimento</p>
      <p style="font-size:11px;margin-top:4px">${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
    <div class="receipt-order">
      <div><div style="font-size:12px;color:#999">Pedido Nº</div><strong>#${pedidoAtual?.numero || '----'}</strong></div>
      <div><div style="font-size:12px;color:#999">Retire em</div><strong>Balcão</strong></div>
    </div>
    <div class="receipt-items">${itensHtml}</div>
    <hr class="receipt-divider">
    <div class="receipt-total">
      <span>TOTAL</span>
      <span style="color:var(--primary)">${formatMoeda(getTotal())}</span>
    </div>
    <div class="receipt-payment">${metodoPag} — Pagamento aprovado ✓</div>
  `;
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
  const agora = new Date();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CANTINA EXPRESS', 40, 12, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('SENAI — Autoatendimento', 40, 17, { align: 'center' });
  doc.text(`${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 40, 21, { align: 'center' });
  doc.setDrawColor(200);
  doc.line(5, 24, 75, 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`PEDIDO Nº ${pedidoAtual?.numero || '----'}`, 40, 30, { align: 'center' });
  doc.line(5, 33, 75, 33);

  let y = 39;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  carrinho.forEach(item => {
    doc.text(`${item.nome} x${item.qtd}`, 6, y);
    doc.text(formatMoeda(item.preco * item.qtd), 74, y, { align: 'right' });
    y += 6;
  });

  doc.line(5, y, 75, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL', 6, y);
  doc.text(formatMoeda(getTotal()), 74, y, { align: 'right' });
  y += 7;

  const metodo = pagamentoAtual?.tipo === 'pix' ? 'PIX' :
    `Cartão ${pagamentoAtual?.subtipo === 'credito' ? 'Crédito' : 'Débito'}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Pagamento: ${metodo}`, 40, y, { align: 'center' }); y += 5;
  doc.text('Pagamento APROVADO ✓', 40, y, { align: 'center' }); y += 8;
  doc.line(5, y, 75, y); y += 5;
  doc.text('Obrigado pela preferência!', 40, y, { align: 'center' }); y += 4;
  doc.text('Retire no balcão ao ouvir seu número.', 40, y, { align: 'center' });

  doc.save(`Comprovante_Pedido_${pedidoAtual?.numero || 'CE'}.pdf`);
}

// =============================================
// RESET
// =============================================
function resetApp() {
  carrinho = [];
  pedidoAtual = null;
  pagamentoAtual = null;
  pixPayload = '';
  clearInterval(pixTimer);
  clearInterval(pollTimer);
  // Limpar formulário cartão
  ['card-number', 'card-name', 'card-expiry', 'card-cvv'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  updateCardDisplay();
  atualizarFloatingCart();
  showScreen('welcome');
}

// =============================================
// UTILITÁRIOS
// =============================================
function formatMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// =============================================
// MOCK LOCAL (fallback sem backend)
// =============================================
const MOCK_LOCAL = [
  { id: 1, categoria: 'lanches', nome: 'X-Burguer', preco: 12.00, emoji: '🍔', descricao: 'Pão brioche, hambúrguer e queijo' },
  { id: 2, categoria: 'lanches', nome: 'X-Frango', preco: 14.00, emoji: '🍗', descricao: 'Frango grelhado, alface e tomate' },
  { id: 3, categoria: 'lanches', nome: 'Hot Dog', preco: 10.00, emoji: '🌭', descricao: 'Salsicha artesanal com molhos' },
  { id: 4, categoria: 'salgados', nome: 'Coxinha', preco: 5.00, emoji: '🍗', descricao: 'Frango cremoso crocante' },
  { id: 5, categoria: 'salgados', nome: 'Pão de Queijo', preco: 3.50, emoji: '🧀', descricao: 'Mineiro quentinho' },
  { id: 6, categoria: 'bebidas', nome: 'Suco Natural', preco: 7.00, emoji: '🥤', descricao: 'Laranja, limão ou maracujá' },
  { id: 7, categoria: 'bebidas', nome: 'Refrigerante', preco: 5.00, emoji: '🥫', descricao: 'Lata 350ml' },
  { id: 8, categoria: 'bebidas', nome: 'Café', preco: 4.00, emoji: '☕', descricao: 'Expresso ou coado' },
  { id: 9, categoria: 'doces', nome: 'Brigadeiro', preco: 4.00, emoji: '🍫', descricao: '2 unidades, caseiro' },
  { id: 10, categoria: 'doces', nome: 'Açaí 300ml', preco: 12.00, emoji: '🫐', descricao: 'Com granola e banana' },
];