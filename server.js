const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const db = new sqlite3.Database("database.sqlite");

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "segredo-top",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true se usar HTTPS
  })
);

// Inicializar banco
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pontos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    datahora TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.get("SELECT * FROM users WHERE username = ?", ["user"], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["user", "123"]);
      console.log("Usuário padrão criado: user / 123");
    }
  });
});

// Middleware de autenticação
function auth(req, res, next) {
  if (!req.session.userId) return res.redirect("/");
  next();
}

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (user) {
      req.session.userId = user.id;
      req.session.username = user.username;
      res.redirect("/ponto.html");
    } else {
      res.send("<h3>Usuário ou senha incorretos! <a href='/'>Tentar novamente</a></h3>");
    }
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Rotas protegidas
app.get("/ponto.html", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "ponto.html"));
});

app.get("/historico.html", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "historico.html"));
});

app.get("/alterar.html", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "alterar.html"));
});

// Servir arquivos estáticos depois das rotas protegidas
app.use(express.static("public"));

// Retorna info do usuário logado
app.get("/api/usuario", auth, (req, res) => {
  res.json({ username: req.session.username });
});

// Bater ponto
app.post("/ponto", auth, (req, res) => {
  const userId = req.session.userId;
  const agora = new Date();
  const dataHora =
    agora.toLocaleDateString("pt-BR") +
    " " +
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  db.run("INSERT INTO pontos (user_id, datahora) VALUES (?, ?)", [userId, dataHora], (err) => {
    if (err) console.error(err);
    else console.log(`Ponto registrado: ${dataHora} para userId=${userId}`);
    res.redirect("/ponto.html");
  });
});

// Histórico de pontos
app.get("/api/historico", auth, (req, res) => {
  db.all(
    `SELECT id, datahora FROM pontos WHERE user_id = ? ORDER BY id ASC`,
    [req.session.userId],
    (err, rows) => {
      if (err) return res.json([]);
      res.json(rows);
    }
  );
});

// Total de horas e minutos do usuário logado
app.get("/api/total-horas", auth, (req, res) => {
  db.all(
    "SELECT datahora FROM pontos WHERE user_id = ? ORDER BY id ASC",
    [req.session.userId],
    (err, rows) => {
      if (err || !rows) return res.json({ total: "0h 0m" });

      let totalMinutos = 0;

      // Pares de entrada/saída
      for (let i = 1; i < rows.length; i += 2) {
        const [dataEntrada, horaEntrada] = rows[i - 1].datahora.split(" ");
        const [dataSaida, horaSaida] = rows[i].datahora.split(" ");

        const entrada = new Date(dataEntrada.split("/").reverse().join("-") + "T" + horaEntrada);
        const saida = new Date(dataSaida.split("/").reverse().join("-") + "T" + horaSaida);

        const diff = (saida - entrada) / 60000; // minutos
        if (diff > 0) totalMinutos += diff;
      }

      const horas = Math.floor(totalMinutos / 60);
      const minutos = Math.floor(totalMinutos % 60);

      res.json({ total: `${horas}h ${minutos}m` });
    }
  );
});

// Alterar usuário/senha
app.post("/alterar-usuario", auth, (req, res) => {
  const { novoUsuario, novaSenha } = req.body;

  db.get("SELECT * FROM users WHERE username = ? AND id != ?", [novoUsuario, req.session.userId], (err, row) => {
    if (row) {
      return res.send("<h3>Erro: este nome de usuário já está em uso. <a href='/alterar.html'>Tentar novamente</a></h3>");
    }

    db.run(
      "UPDATE users SET username = ?, password = ? WHERE id = ?",
      [novoUsuario, novaSenha, req.session.userId],
      (err) => {
        if (err) return res.send("<h3>Erro ao atualizar usuário. <a href='/alterar.html'>Tentar novamente</a></h3>");
        req.session.username = novoUsuario;
        res.redirect("/ponto.html");
      }
    );
  });
});

app.listen(3000, () => console.log("Servidor de ponto rodando em http://localhost:3000"));
