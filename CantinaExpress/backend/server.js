const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, "../frontend")));

// Rotas da API
const pedidosRoute = require("./routes/pedidos");
const produtosRoute = require("./routes/produtos");
const pagamentosRoute = require("./routes/pagamentos");

app.use("/pedidos", pedidosRoute);
app.use("/produtos", produtosRoute);
app.use("/pagamentos", pagamentosRoute);

// Fallback para SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🍔 Cantina Express rodando em http://localhost:${PORT}`);
  console.log(`📊 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`🔧 API: http://localhost:${PORT}/produtos\n`);
});