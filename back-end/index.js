const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")
const path = require("path")
const multer = require("multer");

const server = express()
server.use(cors())
server.use(express.json())

const db = new sqlite3.Database(path.join(__dirname, "../teste_helena.db"))

const fs = require("fs");

const pastaUploads = path.join(__dirname, "uploads");

if (!fs.existsSync(pastaUploads)) {
    fs.mkdirSync(pastaUploads, { recursive: true });
}

server.use("/uploads", express.static(pastaUploads));

const armazenamento = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, pastaUploads);
    },
    filename: (request, file, callback) => {
        const nomeArquivo = Date.now() + path.extname(file.originalname);
        callback(null, nomeArquivo);
    }
});

const upload = multer({
    storage: armazenamento
});

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
            if (erro.code === "SQLITE_CONSTRAINT" || erro.code === "SQLITE_CONSTRAINT_UNIQUE") {
                return response.status(409).json({ erro: "Este e-mail já está cadastrado." })
            }
            return response.status(500).json({ erro: "Erro ao criar usuário." })
        }
        return response.status(201).json({
            mensagem: "Usuário criado com sucesso.",
            id: this.lastID
        })
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
        if (erro) {
            console.error("ERRO DO BANCO:", erro.message)
            return response.status(500).json({
                erro: "Erro ao consultar usuário."
            })
        }
        if (!usuario) {
            return response.status(401).json({
                erro: "E-mail ou senha incorretos :("
            });
        }
        response.json(usuario);
    });
});

// cria a avaliação do db
server.post('/avaliacao', upload.single('imagem'), (request, response) => {
    const { categoria, nome, descricao, feedback, principais_pontos, lancamento, duracao, estrelas } = request.body;

    const imagem = request.file
        ? `/uploads/${request.file.filename}`
        : null;

    const sql = `
        INSERT INTO avaliacao (categoria, nome, descricao, feedback, principais_pontos, imagem, lancamento, duracao, estrelas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [categoria, nome, descricao, feedback, principais_pontos, imagem, lancamento, duracao, estrelas];

    db.run(sql, valores, function (erro) {
        if (erro) {
            console.error('Erro ao criar avaliação:', erro.message);

            // Remove o arquivo caso não tenha sido possível salvar o registro no banco de dados.
            if (request.file) {
                require('fs').unlink(
                    request.file.path,
                    () => { }
                );
            }

            return response.status(500).json({
                mensagem: 'Erro ao salvar a avaliação.'
            });
        }

        response.status(201).json({
            mensagem: 'Avaliação criada com sucesso!',
            id_avaliacao: this.lastID,
            imagem: imagem
        });
    });
});

//tabelas relacionadas a avaliação

server.post("/avaliacoes_usuario", (request, response) => {
    const { id_usuario, id_avaliacao, data_criacao } = request.body

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

//buscar pelas avaliacoes do usuario
server.get("/avaliacoes_usuarios/:id_usuario", (request, response) => {
    const id_usuario = request.params.id_usuario;

    const sql = `
    SELECT
    avaliacao.id,
    avaliacao.categoria,
    avaliacao.nome,
    avaliacao.descricao,
    avaliacao.feedback,
    avaliacao.principais_pontos,
    avaliacao.imagem,
    avaliacao.lancamento,
    avaliacao.duracao,
    avaliacao.estrelas,
    avaliacoes_usuario.data_criacao

    FROM avaliacoes_usuario

    INNER JOIN avaliacao 
    ON avaliacoes_usuario.id_avaliacao = avaliacao.id
    WHERE avaliacoes_usuario.id_usuario = ?
    `

    db.all(sql, [id_usuario], (erro, avaliacoes) => {
        if (erro) {
            console.error(erro);
            return response.status(500).json({
                erro: "Erro ao mostrar avaliações do usuário"
            });
        }
        response.json(avaliacoes);
    })
})

server.get("/admin/avaliacoes", (request, response) => {
    const token = request.headers.authorization;

    if (
        !process.env.ADMIN_TOKEN ||
        token !== `Bearer ${process.env.ADMIN_TOKEN}`
    ) {
        return response.status(401).json({
            erro: "Acesso não autorizado"
        });
    }

    const sql = `
        SELECT
            avaliacao.id,
            avaliacao.categoria,
            avaliacao.nome,
            avaliacao.descricao,
            avaliacao.feedback,
            avaliacao.principais_pontos,
            avaliacao.imagem,
            avaliacao.lancamento,
            avaliacao.duracao,
            avaliacao.estrelas,
            avaliacoes_usuario.id_usuario,
            usuarios.nome AS nome_usuario,
            avaliacoes_usuario.data_criacao
        FROM avaliacao
        LEFT JOIN avaliacoes_usuario
            ON avaliacao.id = avaliacoes_usuario.id_avaliacao
        LEFT JOIN usuarios
            ON avaliacoes_usuario.id_usuario = usuarios.id
        ORDER BY avaliacao.id DESC
    `;

    db.all(sql, [], (erro, avaliacoes) => {
        if (erro) {
            console.error("Erro na consulta administrativa:", erro.message);

            return response.status(500).json({
                erro: "Erro ao consultar avaliações"
            });
        }

        return response.json(avaliacoes);
    });
});

// Consultar usuários sem expor senhas
server.get("/admin/usuarios", (request, response) => {
    const token = request.headers.authorization;

    if (
        !process.env.ADMIN_TOKEN ||
        token !== `Bearer ${process.env.ADMIN_TOKEN}`
    ) {
        return response.status(401).json({
            erro: "Acesso não autorizado"
        });
    }

    const sql = `
        SELECT id, nome, email, aniversario
        FROM usuarios
        ORDER BY id DESC
    `;

    db.all(sql, [], (erro, usuarios) => {
        if (erro) {
            console.error(erro.message);
            return response.status(500).json({
                erro: "Erro ao consultar usuários"
            });
        }

        return response.json(usuarios);
    });
});


const PORT = process.env.PORT || 3002;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});