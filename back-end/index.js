const express = require("express")
const sqlite3 = require("sqlite3").verbose()

const server = express()

server.use(express.json())

const db = new sqlite3.Database("../teste_helena.db", (erro) => {
    if (erro) {
        console.log("Erro ao conectar com o banco:", erro.messagem)
    } else {
        console.log("Banco conectado com sucesso!")
    }
})

server.post('/usuario', (request, response) => {

    const { nome, email, senha } = request.body

    const sql = `
        INSERT INTO usuarios (nome, email, senha)
    VALUES(?, ?, ?)
        `

    db.run(sql, [nome, email, senha], function(erro){
        if (erro){
            return response.status(500).send("Erro ao cria usuário")
        }
        return response.send("Usuario criado com sucesso")
    })
})

server.listen(3001, () => {
    console.log("Servidor rodando em http://localhost:3001")
})