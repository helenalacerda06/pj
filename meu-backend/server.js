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
  
  database: 'lacStar',
  dateStrings: true
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
    res.status(201).json({ id: result.insertId, nome, email, data_nascimento });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

// criar avaliações
app.post('avaliacoes', async (req, res) => {
  try {
    const { categoria_avaliacao, nome_avaliacao, descricao_avaliacao, feedback_avaliacao, principais_pontos_avaliacao, imagens_avaliacao, lancamento_avaliacao, tempo_duracao_avaliacao, estrelas_avaliacao } = req.body;
    if (!nome_avaliacao || !descricao_avaliacao || !feedback_avaliacao || !principais_pontos_avaliacao || !imagens_avaliacao || !estrelas_avaliacao) {
      return res.status(400).json({ erro: '' })
    }
    const [result] = await pool.query(
      'INSERT INTO avaliacao (categoria_avaliacao, nome_avaliacao, descricao_avaliacao, feedback_avaliacao, principais_pontos_avaliacao, imagens_avaliacao, lancamento_avaliacao, tempo_duracao_avaliacao, estrelas_avaliacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      [categoria_avaliacao, nome_avaliacao, descricao_avaliacao, feedback_avaliacao, principais_pontos_avaliacao, imagens_avaliacao, lancamento_avaliacao, tempo_duracao_avaliacao, estrelas_avaliacao || null]
    )
    res.status(201).json({ id_avaliacao: result.insertId, categoria_avaliacao, nome_avaliacao, descricao_avaliacao, feedback_avaliacao, principais_pontos_avaliacao, imagens_avaliacao, lancamento_avaliacao, tempo_duracao_avaliacao, estrelas_avaliacao })
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao criar avaliação' })
  }
})

//buscar avaliações
app.get('avaliacoes', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM avaliacoes');
  res.json(rows);
})

app.listen(3001, () => console.log('Servidor rodando em http://localhost:3001'));