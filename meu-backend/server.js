const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  database: 'lacStar',
  password: 'Alice@2206',
  dateStrings: true
});

function criarHashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verificarSenha(senha, senhaHash) {
  if (!senhaHash?.startsWith('scrypt$')) return false;

  const [, salt, hash] = senhaHash.split('$');
  const hashCalculado = crypto.scryptSync(senha, salt, 64);
  const hashArmazenado = Buffer.from(hash, 'hex');

  return hashCalculado.length === hashArmazenado.length &&
    crypto.timingSafeEqual(hashCalculado, hashArmazenado);
}

// listar todos
app.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, data_nascimento FROM usuarios'
    );
    res.status(200).json(rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
});

// Criar usuario
app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, data_nascimento, senha } = req.body;
    if (!nome || !email || !data_nascimento || !senha) {
      return res.status(400).json({
        erro: 'Nome, email, data de nascimento e senha são obrigatórios'
      });
    }

    const senha_hash = criarHashSenha(senha);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, data_nascimento, senha_hash) VALUES (?, ?, ?, ?)',
      [nome, email, data_nascimento, senha_hash]
    );
    res.status(201).json({
      id: result.insertId,
      nome,
      email,
      data_nascimento
    });
  } catch (erro) {
    console.error(erro);
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({
        erro: 'Email e senha são obrigatórios'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, nome, senha_hash FROM usuarios WHERE email = ?',
      [email]
    );

    if (rows.length === 0 || !verificarSenha(senha, rows[0].senha_hash)) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos'
      });
    }

    res.status(200).json({
      id: rows[0].id,
      nome: rows[0].nome
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao autenticar usuário' });
  }
});

// criar avaliações
app.post('/avaliacoes', async (req, res) => {
  try {
    const { categoria_avaliacao, nome_avaliacao, descricao_avaliacao, feedback_avaliacao, principais_pontos_avaliacao, imagens_avaliacao, lancamento_avaliacao, tempo_duracao_avaliacao, estrelas_avaliacao } = req.body;
    if (!nome_avaliacao || !descricao_avaliacao || !feedback_avaliacao || !principais_pontos_avaliacao || !imagens_avaliacao || !estrelas_avaliacao) {
      return res.status(400).json({ erro: '' })
    }
    const [result] = await pool.query(
      'INSERT INTO avaliacao (categoria_avaliacao, nome_avaliacao, descricao_avaliacao, feedback_avaliacao, principais_pontos_avaliacao, imagens_avaliacao, lancamento_avaliacao, tempo_duracao_avaliacao, estrelas_avaliacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [categoria_avaliacao, nome_avaliacao, descricao_avaliacao, feedback_avaliacao, principais_pontos_avaliacao, imagens_avaliacao, lancamento_avaliacao, tempo_duracao_avaliacao, estrelas_avaliacao || null]
    )
    res.status(201).json({ id_avaliacao: result.insertId, categoria_avaliacao, nome_avaliacao, descricao_avaliacao, feedback_avaliacao, principais_pontos_avaliacao, imagens_avaliacao, lancamento_avaliacao, tempo_duracao_avaliacao, estrelas_avaliacao })
  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao criar avaliação' })
  }
})

//buscar avaliações
app.get('/avaliacao', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM avaliacao');
    res.status(200).json(rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar avaliações' });
  }
})
app.listen(3001, () => console.log('Servidor rodando em http://localhost:3001'));