const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const db = new sqlite3.Database("database.sqlite");

// ---------- Middlewares ----------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: "segredo-top",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// ---------- Inicializar Banco ----------
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pontos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    datahora TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Usuário padrão
  db.get("SELECT * FROM users WHERE username = ?", ["user"], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["user", "123", "user"]);
      console.log("Usuário padrão criado: user / 123 (role=user)");
    }
  });

  // Admin padrão
  db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", "admin", "admin"]);
      console.log("Admin padrão criado: admin / admin (role=admin)");
    }
  });
});

// ---------- Middleware de autenticação ----------
function auth(req, res, next) {
  if (!req.session.userId) return res.redirect("/");
  next();
}

function isAdmin(req, res, next) {
  if (!req.session.userId) return res.redirect("/");
  if (req.session.role !== "admin") return res.status(403).send("<h3>Acesso restrito ao administrador.</h3>");
  next();
}

// ---------- Login / Logout ----------
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (user) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role || "user";
      res.redirect("/ponto.html");
    } else {
      res.status(401).send("<h3>Usuário ou senha incorretos! <a href='/'>Tentar novamente</a></h3>");
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// ---------- Páginas HTML Protegidas ----------
app.get("/ponto.html", auth, (req, res) => res.sendFile(path.join(__dirname, "public", "ponto.html")));
app.get("/historico.html", auth, (req, res) => res.sendFile(path.join(__dirname, "public", "historico.html")));
app.get("/alterar.html", auth, (req, res) => res.sendFile(path.join(__dirname, "public", "alterar.html")));
app.get("/admin.html", isAdmin, (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

// ---------- Static ----------
app.use(express.static("public"));

// ---------- APIs Usuário ----------
app.get("/api/usuario", auth, (req, res) => {
  res.json({ id: req.session.userId, username: req.session.username, role: req.session.role });
});

// ---------- CRUD Usuários (ADMIN) ----------
app.get("/api/admin/usuarios", isAdmin, (req, res) => {
  db.all("SELECT id, username, role FROM users ORDER BY username ASC", [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.post("/api/admin/usuarios", isAdmin, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !role) return res.status(400).json({ error: "username e role são obrigatórios" });
  const senha = password || "123"; // senha padrão
  db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [username, senha, role],
    function(err) {
      if (err) {
        if (String(err).includes("SQLITE_CONSTRAINT")) return res.status(409).json({ error: "Usuário já existe" });
        return res.status(500).json({ error: "Erro ao criar usuário" });
      }
      res.json({ id: this.lastID, username, role });
    }
  );
});

app.put("/api/admin/usuarios/:id", isAdmin, (req, res) => {
  const id = req.params.id;
  const { username, password, role } = req.body;

  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: "Usuário não encontrado" });

    const novoUsername = username || user.username;
    const novaSenha = password || user.password;
    const novoRole = role || user.role;

    db.run(
      "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?",
      [novoUsername, novaSenha, novoRole, id],
      function(err) {
        if (err) return res.status(500).json({ error: "Erro ao atualizar usuário" });
        res.json({ success: true });
      }
    );
  });
});

app.delete("/api/admin/usuarios/:id", isAdmin, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: "Erro ao deletar usuário" });
    res.json({ success: true });
  });
});

// ---------- CRUD Pontos (ADMIN) ----------
app.get("/api/admin/pontos/:userId", isAdmin, (req, res) => {
  const userId = req.params.userId;
  db.all("SELECT id, datahora FROM pontos WHERE user_id = ? ORDER BY id ASC", [userId], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.put("/api/admin/pontos/:id", isAdmin, (req, res) => {
  const id = req.params.id;
  const { datahora } = req.body;
  db.run("UPDATE pontos SET datahora = ? WHERE id = ?", [datahora, id], function(err) {
    if (err) return res.status(500).json({ error: "Erro ao atualizar ponto" });
    res.json({ success: true });
  });
});

app.delete("/api/admin/pontos/:id", isAdmin, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM pontos WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: "Erro ao deletar ponto" });
    res.json({ success: true });
  });
});

// ---------- Operações de Ponto Usuário ----------
app.post("/ponto", auth, (req, res) => {
  const userId = req.session.userId;
  const agora = new Date();
  const dataHora = agora.toLocaleDateString("pt-BR") + " " + agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  db.run("INSERT INTO pontos (user_id, datahora) VALUES (?, ?)", [userId, dataHora], (err) => {
    if (err) console.error(err);
    res.redirect("/ponto.html");
  });
});

app.get("/api/historico", auth, (req, res) => {
  db.all("SELECT id, datahora FROM pontos WHERE user_id = ? ORDER BY id ASC", [req.session.userId], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

// ---------- Funções Utilitárias ----------
function parsePtBRDateTimeToDate(str) {
  const [d, t] = str.split(" ");
  const [dd, mm, yyyy] = d.split("/");
  return new Date(`${yyyy}-${mm}-${dd}T${t}:00`);
}

function paresEntradaSaida(rows) {
  const pares = [];
  for (let i = 1; i < rows.length; i += 2) {
    const entrada = parsePtBRDateTimeToDate(rows[i - 1].datahora);
    const saida   = parsePtBRDateTimeToDate(rows[i].datahora);
    if (!isNaN(entrada) && !isNaN(saida) && saida > entrada) {
      pares.push({ entrada, saida, minutos: (saida - entrada)/60000 });
    }
  }
  return pares;
}

// ---------- KPIs Usuário ----------
app.get("/api/total-horas", auth, (req, res) => {
  db.all("SELECT datahora FROM pontos WHERE user_id = ? ORDER BY id ASC", [req.session.userId], (err, rows) => {
    if (err || !rows) return res.json({ total: "0h 0m" });
    const pares = paresEntradaSaida(rows);
    const totalMin = Math.max(0, Math.floor(pares.reduce((s,p) => s+p.minutos, 0)));
    const h = Math.floor(totalMin/60);
    const m = totalMin%60;
    res.json({ total: `${h}h ${m}m` });
  });
});

// ---------- Alterar usuário (próprio usuário) ----------
app.post("/alterar-usuario", auth, (req, res) => {
  const { novoUsuario, novaSenha } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND id != ?", [novoUsuario, req.session.userId], (err, row) => {
    if (row) return res.send("<h3>Erro: este nome de usuário já está em uso. <a href='/alterar.html'>Tentar novamente</a></h3>");
    db.run("UPDATE users SET username = ?, password = ? WHERE id = ?", [novoUsuario, novaSenha, req.session.userId], (err) => {
      if (err) return res.send("<h3>Erro ao atualizar usuário. <a href='/alterar.html'>Tentar novamente</a></h3>");
      req.session.username = novoUsuario;
      res.redirect("/ponto.html");
    });
  });
});

app.listen(3000, () => console.log("Servidor de ponto rodando 🚀 http://localhost:3000"));
