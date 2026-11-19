const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    
    database: 'lacStar'
});

// listar todos
app.get('/usuarios', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
});

// Criar usuario
app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, data_nascimento } = req.body;
    if (!nome || !email || !data_nascimento) {
      return res.status(400).json({ erro: 'nome e email são obrigatórios' });
    }
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, data_nascimento) VALUES (?, ?, ?)',
      [nome, email, data_nascimento || null]
    );
    res.status(201).json({ id: result.insertId, nome, email, data_nascimento});
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

app.listen(3001, () => console.log('Servidor rodando em http://localhost:3001'));