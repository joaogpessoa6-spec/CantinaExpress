const express = require("express");
const router = express.Router();

// In-memory fallback (se Firebase não estiver configurado)
let pedidosMemoria = [];

let db = null;
try {
  db = require("../firebase");
} catch (e) {
  console.warn("[AVISO] Firebase não configurado — usando armazenamento em memória.");
}

// POST /pedidos — Criar pedido
router.post("/", async (req, res) => {
  try {
    const { itens, total, metodoPagamento, pagamentoId } = req.body;
    const novoPedido = {
      itens,
      total,
      metodoPagamento: metodoPagamento || null,
      pagamentoId: pagamentoId || null,
      status: "aguardando_pagamento",
      criadoEm: new Date().toISOString(),
      numero: Math.floor(Math.random() * 9000) + 1000, // número amigável 4 dígitos
    };

    if (db) {
      const doc = await db.collection("pedidos").add(novoPedido);
      return res.json({ id: doc.id, ...novoPedido });
    }

    // Fallback memória
    const id = `pedido_${Date.now()}`;
    pedidosMemoria.push({ id, ...novoPedido });
    res.json({ id, ...novoPedido });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar pedido" });
  }
});

// GET /pedidos — Listar pedidos
router.get("/", async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection("pedidos").orderBy("criadoEm", "desc").get();
      const pedidos = [];
      snapshot.forEach(doc => pedidos.push({ id: doc.id, ...doc.data() }));
      return res.json(pedidos);
    }
    res.json([...pedidosMemoria].reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar pedidos" });
  }
});

// GET /pedidos/:id — Buscar pedido
router.get("/:id", async (req, res) => {
  try {
    if (db) {
      const doc = await db.collection("pedidos").doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ erro: "Pedido não encontrado" });
      return res.json({ id: doc.id, ...doc.data() });
    }
    const pedido = pedidosMemoria.find(p => p.id === req.params.id);
    if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar pedido" });
  }
});

// PUT /pedidos/:id — Atualizar pedido (status, pagamento, etc)
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body, atualizadoEm: new Date().toISOString() };

    if (db) {
      await db.collection("pedidos").doc(req.params.id).update(updates);
      return res.json({ ok: true });
    }
    const idx = pedidosMemoria.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ erro: "Pedido não encontrado" });
    pedidosMemoria[idx] = { ...pedidosMemoria[idx], ...updates };
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao atualizar pedido" });
  }
});

// DELETE /pedidos/:id — Remover pedido (admin)
router.delete("/:id", async (req, res) => {
  try {
    if (db) {
      await db.collection("pedidos").doc(req.params.id).delete();
      return res.json({ ok: true });
    }
    pedidosMemoria = pedidosMemoria.filter(p => p.id !== req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao remover pedido" });
  }
});

module.exports = router;