const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const db = new sqlite3.Database('cadastro.db');
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.urlencoded({ extended: true }));
db.serialize(() => {
  db.all("PRAGMA table_info(users);", [], (err, columns) => {
    if (err) {
      console.error("Erro ao obter informações da tabela:", err);
      return;
    }
    if (!columns.some(column => column.name === 'func')) {
      db.run("ALTER TABLE users ADD COLUMN func TEXT;", (err) => {
        if (err) {
          console.error("Erro ao adicionar coluna 'func':", err);
        } else {
          console.log("Coluna 'func' adicionada com sucesso.");
        }
      });
    }
  });
  app.get('/reset', (req, res) => {
    db.serialize(() => {
      db.run("DELETE FROM users;", (err) => {
        if (err) {
          console.error("Erro ao deletar registros:", err);
          res.status(500).send("Erro ao deletar registros.");
          return;
        }
        db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
          if (err) {
            console.error("Erro ao verificar usuário admin:", err);
            res.status(500).send("Erro ao verificar usuário admin.");
            return;
          }
          if (!row) {
            const stmt = db.prepare("INSERT INTO users (first_name, last_name, username, email, password, func) VALUES (?, ?, ?, ?, ?, ?)");
            stmt.run("Admin", "User", "admin", "admin@example.com", "1234", "Admin", function(err) {
              if (err) {
                console.error("Erro ao criar usuário admin:", err);
              } else {
                console.log("Usuário admin criado com sucesso.");
              }
            });
            stmt.finalize();
          }
        });
      });
    });
    res.send("Banco de dados resetado com sucesso.");
  });
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
  });
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
      if (err) {
        res.send("Erro no servidor.");
      } else if (row) {
        res.redirect('/cadastro');
      } else {
        res.send("Usuário ou senha incorretos.");
      }
    });
  });
  app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'cadastroUs.html'));
  });
  app.post('/cadastro', (req, res) => {
    const { first_name, last_name, username, email, password, address, city, state, zip, func } = req.body;
    console.log("Dados recebidos para cadastro:", req.body);
    const stmt = db.prepare("INSERT INTO users (first_name, last_name, username, email, password, address, city, state, zip, func) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run(first_name, last_name, username, email, password, address, city, state, zip, func, function(err) {
      if (err) {
        console.error("Erro ao registrar usuário:", err);
        return res.json({ success: false, message: "Erro ao registrar usuário: " + err.message });
      }
      console.log("Usuário cadastrado com sucesso.");
      res.json({ success: true, message: "Usuário cadastrado com sucesso!" });
    });
    stmt.finalize();
  });
  app.get('/usuarios/data', (req, res) => {
    db.all("SELECT first_name, last_name, username, email, func FROM users", [], (err, rows) => {
      if (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ error: err.message });
      } else {
        console.log("Dados dos usuários:", rows);
        res.json(rows);
      }
    });
  });
  app.get('/usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'usuarios.html'));
  });
  app.get('/admin', (req, res) => {
    res.send('<h1>Bem-vindo à administração!</h1>');
  });
  app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
  });
});




