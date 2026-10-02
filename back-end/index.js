const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")

 const server = express() 
server.use(cors())
server.use(express.json())

const db = new sqlite3.Database("../teste_helena.db")

// cria o usuario no db
server.post('/usuario', (request, response) => {

    const { nome, email, aniversario, senha } = request.body

    const sql = `
        INSERT INTO usuarios (nome, email, aniversario, senha)
    VALUES(?, ?, ?, ?)
        `

    db.run(sql, [nome, email, aniversario, senha], function (erro) {
        if (erro) {
            console.log("ERRO DO BANCO:", erro.message)
            return response.status(500).send("Erro ao criar usuário: ", erro.message)
        }
        return response.send("Usuario criado com sucesso")
    });
}

)

// busca um usuario pelo id

server.get("/usuario/:id", (request, response) => {
    const id = request.params.id;

    const sql = `
    SELECT id, nome, email
    FROM usuarios
    WHERE id = ?
    `;

    db.get(sql, [id], (erro, usuario) => {
        if (erro) {
            console.error(erro);

            return response.status(500).json({
                erro: "Erro ao buscar usuario"
            });
        }
        if (!usuario) {
            return response.status(404).json({
                erro: "Usuário não encontrado"
            });
        }
        console.log("Usuaío encontrado:", usuario);
        response.json(usuario);
    })
})

// busca o usuario que está tentando entrar 

server.post('/login', (request, response) => {
    const { email, senha } = request.body;
    const sql = `
    SELECT id, nome, email
    FROM usuarios
    WHERE email = ? AND senha= ?
    `;

    db.get(sql, [email, senha], (erro, usuario) => {

        if (!usuario) {
            return response.status(401).json({
                erro: "E-mail ou senha incorretos :(" 
            });
        }
        response.json(usuario);
    });
});

// cria a avaliação do db

server.post('/avaliacao', (request, response) => {
    const { categoria, nome, descricao, feedback, principais_pontos, imagem, lancamento, duracao, estrelas } = request.body

    const sql = `
    INSERT INTO avaliacao ( categoria, nome, descricao, feedback, principais_pontos, imagem, lancamento, duracao, estrelas)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    db.run(sql, [categoria, nome, descricao, feedback, principais_pontos, imagem, lancamento, duracao, estrelas], function (erro) {
        if (erro) {
            console.log("ERRO DO BANCO:",  erro.message)
            return response.status(500).send("Erro ao criar avaliação: ", erro.message)
        }
        return response.json({
                mensagem: "Avaliação criada com sucesso",
                id_avaliacao: this.lastID
    })
})
})

//tabelas relacionadas a avaliação

server.post("/avaliacoes_usuario", (request, response) => {
    const {id_usuario, id_avaliacao, data_criacao} = request.body

    const sql = `
    INSERT INTO avaliacoes_usuario (id_usuario, id_avaliacao, data_criacao)
    VALUES(?, ?, ?)
    `
    
    db.run(sql, [id_usuario, id_avaliacao, data_criacao], function (erro) {
        if (erro) {
            console.log("ERRO DO BANCO:", erro.message)
            return response.status(500).send("Erro ao relacionar avaliação e usuário: ", erro.message)
        }
        return response.json({
            mensagem: "Avaliação relacionada com sucesso"
        })
    })
})

server.listen(3001, () => {
    console.log("Servidor rodando em http://localhost:3001")
})