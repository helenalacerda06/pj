const express = require('express');
const mysql =require('mysql2/promise')

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'CursoDeNode@123',
    database: 'lacStar'
})

// listar todos
app.get('/usuarios', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
});

// Criar usuario
app.post('/usuarios', async (req, res) => {
    const { nome, email } = req.body;
    const [result] = await pool.query(
        'INSERT INTO usuarios (nome, email) VALUES (?, ?)',
        [nome, email] 
    );
})

app.listen(3306, () => console.log('Servidor rodando em http://localhost:3306'));