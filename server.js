const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// serve static files from public directory (front end)
app.use(express.static(path.join(__dirname, 'public')));

const fs = require('fs');
const DB_DIR = path.join(__dirname, '.data');
if (!fs.existsSync(DB_DIR)){
    fs.mkdirSync(DB_DIR);
}
const DB_PATH = path.join(DB_DIR, 'data.sqlite');

// open or create database
const db = new sqlite3.Database(DB_PATH, err => {
    if (err) {
        console.error('Erro ao abrir banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco SQLite.');
    }
});

// initialize tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id TEXT PRIMARY KEY,
            nome TEXT,
            preco REAL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
            id TEXT PRIMARY KEY,
            rotulo TEXT,
            nome TEXT,
            documento TEXT,
            telefone TEXT,
            endereco TEXT
        )
    `);
});

// Helper to send all rows from a table
function selectAll(table, res) {
    db.all(`SELECT * FROM ${table}`, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
}

// GET endpoints
app.get('/api/produtos', (req, res) => {
    selectAll('produtos', res);
});

app.get('/api/clientes', (req, res) => {
    selectAll('clientes', res);
});

// POST endpoints: replace data
app.post('/api/produtos', (req, res) => {
    const { produtos } = req.body;
    if (!Array.isArray(produtos)) {
        return res.status(400).json({ error: 'Payload inválido' });
    }

    const stmt = db.prepare(
        `REPLACE INTO produtos (id,nome,preco) VALUES (?,?,?)`
    );

    db.serialize(() => {
        produtos.forEach(p => {
            stmt.run(p.id, p.nome, p.preco);
        });
        stmt.finalize(err => {
            if (err) console.error(err);
            selectAll('produtos', res);
        });
    });
});

app.post('/api/clientes', (req, res) => {
    const { clientes } = req.body;
    if (!Array.isArray(clientes)) {
        return res.status(400).json({ error: 'Payload inválido' });
    }

    const stmt = db.prepare(
        `REPLACE INTO clientes (id,rotulo,nome,documento,telefone,endereco) VALUES (?,?,?,?,?,?)`
    );

    db.serialize(() => {
        clientes.forEach(c => {
            stmt.run(
                c.id,
                c.rotulo,
                c.nome,
                c.documento,
                c.telefone,
                c.endereco
            );
        });
        stmt.finalize(err => {
            if (err) console.error(err);
            selectAll('clientes', res);
        });
    });
});

// start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
