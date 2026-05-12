const express = require("express");
const router = express.Router();

const produtos = [
  // Lanches
  { id: 1, categoria: "lanches", nome: "X-Burguer", preco: 12.00, emoji: "🍔", descricao: "Pão brioche, hambúrguer 120g, queijo e molho especial", disponivel: true },
  { id: 2, categoria: "lanches", nome: "X-Egg", preco: 13.50, emoji: "🥚", descricao: "X-Burguer com ovo frito e presunto", disponivel: true },
  { id: 3, categoria: "lanches", nome: "X-Frango", preco: 14.00, emoji: "🍗", descricao: "Frango grelhado, alface, tomate e maionese", disponivel: true },
  { id: 4, categoria: "lanches", nome: "Hot Dog", preco: 10.00, emoji: "🌭", descricao: "Salsicha artesanal com molhos e batata palha", disponivel: true },
  { id: 5, categoria: "lanches", nome: "Misto Quente", preco: 8.00, emoji: "🥪", descricao: "Presunto e queijo grelhados no pão de forma", disponivel: true },

  // Salgados
  { id: 6, categoria: "salgados", nome: "Coxinha", preco: 5.00, emoji: "🍗", descricao: "Frango cremoso com catupiry, crocante", disponivel: true },
  { id: 7, categoria: "salgados", nome: "Esfiha de Carne", preco: 4.50, emoji: "🥙", descricao: "Massa fina com recheio temperado", disponivel: true },
  { id: 8, categoria: "salgados", nome: "Pão de Queijo", preco: 3.50, emoji: "🧀", descricao: "Mineiro, quentinho e crocante", disponivel: true },
  { id: 9, categoria: "salgados", nome: "Empada", preco: 4.00, emoji: "🥧", descricao: "Frango com requeijão cremoso", disponivel: true },
  { id: 10, categoria: "salgados", nome: "Enroladinho", preco: 3.00, emoji: "🌀", descricao: "Salsicha enrolada em massa crocante", disponivel: true },

  // Bebidas
  { id: 11, categoria: "bebidas", nome: "Suco Natural", preco: 7.00, emoji: "🥤", descricao: "Laranja, limão ou maracujá — 300ml", disponivel: true },
  { id: 12, categoria: "bebidas", nome: "Refrigerante", preco: 5.00, emoji: "🥫", descricao: "Lata 350ml — Coca, Guaraná, Fanta", disponivel: true },
  { id: 13, categoria: "bebidas", nome: "Água Mineral", preco: 3.00, emoji: "💧", descricao: "Garrafa 500ml com ou sem gás", disponivel: true },
  { id: 14, categoria: "bebidas", nome: "Café", preco: 4.00, emoji: "☕", descricao: "Expresso ou coado, com ou sem leite", disponivel: true },
  { id: 15, categoria: "bebidas", nome: "Vitamina", preco: 9.00, emoji: "🥛", descricao: "Banana com leite e mel — 400ml", disponivel: true },

  // Doces
  { id: 16, categoria: "doces", nome: "Brigadeiro", preco: 4.00, emoji: "🍫", descricao: "Caseiro e cremoso, 2 unidades", disponivel: true },
  { id: 17, categoria: "doces", nome: "Bolo do Dia", preco: 6.50, emoji: "🍰", descricao: "Consulte o sabor disponível hoje", disponivel: true },
  { id: 18, categoria: "doces", nome: "Açaí 300ml", preco: 12.00, emoji: "🫐", descricao: "Com granola, banana e mel", disponivel: true },
  { id: 19, categoria: "doces", nome: "Pudim", preco: 5.50, emoji: "🍮", descricao: "Caseiro com calda de caramelo", disponivel: true },
  { id: 20, categoria: "doces", nome: "Cookies", preco: 5.00, emoji: "🍪", descricao: "Chocolate ou gotas de chocolate, 3 unidades", disponivel: true },
];

// GET /produtos
router.get("/", (req, res) => {
  const { categoria } = req.query;
  if (categoria && categoria !== "todos") {
    return res.json(produtos.filter(p => p.categoria === categoria && p.disponivel));
  }
  res.json(produtos.filter(p => p.disponivel));
});

// GET /produtos/:id
router.get("/:id", (req, res) => {
  const produto = produtos.find(p => p.id === parseInt(req.params.id));
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
  res.json(produto);
});

module.exports = router;
