const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

// In-memory payment store (substituir por DB em produção)
const pagamentos = {};

// Gera payload PIX EMV simulado (formato real para QR Code)
function gerarPayloadPix(valor, pedidoId) {
  const chavePix = "cantina@senai.br";
  const beneficiario = "CANTINA SENAI";
  const cidade = "SAO PAULO";
  const txId = pedidoId.substring(0, 25).toUpperCase().replace(/-/g, "");
  const valorStr = valor.toFixed(2);

  // Formato EMV simplificado para QR Code PIX (mock educacional)
  const payload =
    `00020126` +
    `36` +
    `0014BR.GOV.BCB.PIX` +
    `01${String(chavePix.length).padStart(2,"0")}${chavePix}` +
    `5204000053039865406${valorStr}` +
    `5802BR` +
    `59${String(beneficiario.length).padStart(2,"0")}${beneficiario}` +
    `60${String(cidade.length).padStart(2,"0")}${cidade}` +
    `62${String(txId.length + 4 + 2).padStart(2,"0")}0503${String(txId.length).padStart(2,"0")}${txId}` +
    `6304`;

  // CRC16 simplificado (mock)
  const crc = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, "0");
  return payload + crc;
}

// POST /pagamentos/pix — Iniciar pagamento PIX
router.post("/pix", (req, res) => {
  const { valor, pedidoId } = req.body;
  if (!valor || !pedidoId) {
    return res.status(400).json({ erro: "valor e pedidoId são obrigatórios" });
  }

  const id = uuidv4();
  const payload = gerarPayloadPix(parseFloat(valor), pedidoId);
  const expiracao = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  pagamentos[id] = {
    id,
    tipo: "pix",
    valor: parseFloat(valor),
    pedidoId,
    status: "aguardando",
    pixPayload: payload,
    expiracao: expiracao.toISOString(),
    criadoEm: new Date().toISOString(),
  };

  // Simula confirmação após 8 segundos (mock)
  setTimeout(() => {
    if (pagamentos[id] && pagamentos[id].status === "aguardando") {
      pagamentos[id].status = "confirmado";
      pagamentos[id].confirmadoEm = new Date().toISOString();
      console.log(`[MOCK] Pagamento PIX ${id} confirmado automaticamente`);
    }
  }, 8000);

  res.json({
    id,
    tipo: "pix",
    status: "aguardando",
    pixPayload: payload,
    chavePix: "cantina@senai.br",
    beneficiario: "CANTINA SENAI",
    valor: parseFloat(valor),
    expiracao: expiracao.toISOString(),
  });
});

// POST /pagamentos/cartao — Processar pagamento com cartão
router.post("/cartao", (req, res) => {
  const { numero, nome, validade, cvv, tipo, valor, pedidoId } = req.body;

  if (!numero || !nome || !validade || !cvv || !tipo || !valor || !pedidoId) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  // Validação básica mock (número com 16 dígitos)
  const numeroLimpo = numero.replace(/\s/g, "");
  if (numeroLimpo.length !== 16) {
    return res.status(400).json({ erro: "Número do cartão inválido" });
  }

  // Simula recusa aleatória 10% das vezes (mock realista)
  if (Math.random() < 0.1) {
    return res.status(402).json({ erro: "Cartão recusado. Tente outro método de pagamento." });
  }

  const id = uuidv4();
  const bandeira = detectarBandeira(numeroLimpo);
  const final = numeroLimpo.slice(-4);

  pagamentos[id] = {
    id,
    tipo: "cartao",
    subtipo: tipo, // credito | debito
    valor: parseFloat(valor),
    pedidoId,
    status: "processando",
    bandeira,
    cartaoFinal: final,
    criadoEm: new Date().toISOString(),
  };

  // Simula processamento
  setTimeout(() => {
    if (pagamentos[id]) {
      pagamentos[id].status = "confirmado";
      pagamentos[id].confirmadoEm = new Date().toISOString();
      pagamentos[id].autorizacao = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  }, 3000);

  res.json({
    id,
    tipo: "cartao",
    subtipo: tipo,
    status: "processando",
    bandeira,
    cartaoFinal: final,
    valor: parseFloat(valor),
    mensagem: "Processando pagamento...",
  });
});

// GET /pagamentos/:id/status — Consultar status do pagamento
router.get("/:id/status", (req, res) => {
  const pagamento = pagamentos[req.params.id];
  if (!pagamento) {
    return res.status(404).json({ erro: "Pagamento não encontrado" });
  }

  res.json({
    id: pagamento.id,
    status: pagamento.status,
    tipo: pagamento.tipo,
    subtipo: pagamento.subtipo,
    bandeira: pagamento.bandeira,
    cartaoFinal: pagamento.cartaoFinal,
    autorizacao: pagamento.autorizacao,
    confirmadoEm: pagamento.confirmadoEm,
    valor: pagamento.valor,
  });
});

// GET /pagamentos/:id — Detalhes do pagamento
router.get("/:id", (req, res) => {
  const pagamento = pagamentos[req.params.id];
  if (!pagamento) return res.status(404).json({ erro: "Pagamento não encontrado" });
  res.json(pagamento);
});

function detectarBandeira(numero) {
  if (/^4/.test(numero)) return "Visa";
  if (/^5[1-5]/.test(numero)) return "Mastercard";
  if (/^3[47]/.test(numero)) return "American Express";
  if (/^6(?:011|5)/.test(numero)) return "Discover";
  if (/^(?:606282|3841)/.test(numero)) return "Hipercard";
  if (/^(?:4011|4312|4389|4514|4576|5041|5066|5090)/.test(numero)) return "Elo";
  return "Cartão";
}

module.exports = router;
