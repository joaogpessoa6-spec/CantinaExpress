const API = '';
let todosPedidos = [];
let filtroAtual = 'todos';

const STATUS_LABEL = {
  aguardando_pagamento: 'Aguardando Pagamento',
  pago: 'Pago',
  preparando: 'Preparando',
  pronto: 'Pronto p/ Retirada',
  entregue: 'Entregue'
};

const PROXIMO_STATUS = {
  aguardando_pagamento: 'pago',
  pago: 'preparando',
  preparando: 'pronto',
  pronto: 'entregue',
  entregue: null
};

const PROXIMO_LABEL = {
  aguardando_pagamento: '✅ Confirmar Pagamento',
  pago: '👨‍🍳 Iniciar Preparo',
  preparando: '🔔 Marcar Pronto',
  pronto: '📦 Marcar Entregue',
  entregue: null
};

document.addEventListener('DOMContentLoaded', () => {
  iniciarRelogio();
  carregarPedidos();
  setInterval(carregarPedidos, 15000); // auto-refresh 15s
});

function iniciarRelogio() {
  const el = document.getElementById('admin-clock');
  if (!el) return;
  setInterval(() => {
    el.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 1000);
}

async function carregarPedidos() {
  try {
    const res = await fetch(`${API}/pedidos`);
    todosPedidos = await res.json();
  } catch (e) {
    todosPedidos = [];
  }
  atualizarStats();
  renderPedidos();
}

function atualizarStats() {
  document.getElementById('stat-total').textContent = todosPedidos.length;
  document.getElementById('stat-aguardando').textContent =
    todosPedidos.filter(p => p.status === 'aguardando_pagamento' || p.status === 'pago').length;
  document.getElementById('stat-preparando').textContent =
    todosPedidos.filter(p => p.status === 'preparando').length;
  const fat = todosPedidos.filter(p => p.status !== 'aguardando_pagamento')
    .reduce((s, p) => s + (parseFloat(p.total) || 0), 0);
  document.getElementById('stat-faturamento').textContent =
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fat);
}

function filtrarStatus(btn, status) {
  filtroAtual = status;
  document.querySelectorAll('.status-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPedidos();
}

function renderPedidos() {
  const grid = document.getElementById('orders-grid');
  const lista = filtroAtual === 'todos'
    ? todosPedidos
    : todosPedidos.filter(p => p.status === filtroAtual);

  if (!lista.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
      <div style="font-size:48px;margin-bottom:12px">📋</div>
      <p>Nenhum pedido ${filtroAtual !== 'todos' ? 'com este status' : 'encontrado'}</p>
    </div>`;
    return;
  }

  grid.innerHTML = lista.map(p => {
    const itensHtml = (p.itens || []).map(i => `<div>${i.emoji || '🍽'} ${i.nome} x${i.qtd}</div>`).join('');
    const proximoStatus = PROXIMO_STATUS[p.status];
    const proximoLabel = PROXIMO_LABEL[p.status];
    const criadoEm = p.criadoEm ? new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const metPag = p.metodoPagamento ? (p.metodoPagamento === 'pix' ? '📱 PIX' : `💳 ${p.metodoPagamento}`) : '—';

    return `
    <div class="order-card" id="card-${p.id}">
      <div class="order-card-header">
        <div class="order-num">#${p.numero || '????'}</div>
        <div class="order-badge badge-${p.status}">${STATUS_LABEL[p.status] || p.status}</div>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${criadoEm} · ${metPag}</div>
      <div class="order-items">${itensHtml}</div>
      <div class="order-total">${formatMoeda(p.total)}</div>
      <div class="order-actions">
        ${proximoStatus ? `<button class="action-btn" onclick="atualizarStatus('${p.id}','${proximoStatus}')">${proximoLabel}</button>` : '<button class="action-btn" disabled style="opacity:0.4">Finalizado</button>'}
        <button class="action-btn danger" onclick="excluirPedido('${p.id}')" style="max-width:40px">🗑</button>
      </div>
    </div>`;
  }).join('');
}

async function atualizarStatus(id, novoStatus) {
  const btn = document.querySelector(`#card-${id} .action-btn`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  try {
    await fetch(`${API}/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    await carregarPedidos();
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = PROXIMO_LABEL[todosPedidos.find(p=>p.id===id)?.status]; }
    alert('Erro ao atualizar pedido');
  }
}

async function excluirPedido(id) {
  if (!confirm('Remover este pedido?')) return;
  try {
    await fetch(`${API}/pedidos/${id}`, { method: 'DELETE' });
    await carregarPedidos();
  } catch (e) { alert('Erro ao remover pedido'); }
}

function formatMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
