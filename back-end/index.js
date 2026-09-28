const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")

const server = express()

 server.use(cors())
 server.use(express.json())

server.use(express.json())

const db = new sqlite3.Database("../teste_helena.db", (erro) => {
    if (erro) {
        console.log("Erro ao conectar com o banco:", erro.messagem)
    } else {
        console.log("Banco conectado com sucesso!")
    }
})

server.post('/usuario', (request, response) => {

    const { nome, email, aniversario, senha } = request.body

    const sql = `
        INSERT INTO usuarios (nome, email,aniversario, senha)
    VALUES(?, ?, ?, ?)
        `

    db.run(sql, [nome, email, aniversario, senha], function(erro){
        if (erro){
            console.log("ERRO DO BANCO:", erro.message)
        return response.status(500).send("Erro ao criar usuário: " + erro.message)
        }
        return response.send("Usuario criado com sucesso")
    })
})

server.post('/avaliacao', (request, response) => {
    const { categoria, nome, descricao, fedback, principais_pontos, imagem, lancamento, duracao, estrelas} = request.body

    const sql= `
    INSERT INTO avaliacao ( categoria, nome, descricao, fedback, principais_pontos, imagem, lancamento, duracao, estrelas)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    db.run(sql, [categoria, nome, descricao, fedback, principais_pontos, imagem, lancamento, duracao, estrelas], function(erro){
        if(erro){
            console.log("ERRO DO BANCO:", + erro.message)
            return response.status(500).send("Erro ao criar avaliação: " + erro.message)
        }
        return response.send("Avaliação criada com sucesso")
    })
})

server.listen(3001, () => {
    console.log("Servidor rodando em http://localhost:3001")
})