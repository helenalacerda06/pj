const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const { bloquearRotasSQLiteLegadas } = require("./middleware/bloquearRotasSQLiteLegadas");
const { criarPerfil, buscarPerfil } = require("./services/perfilService");
const { criarAutenticarAdmin } = require("./autenticarAdmin");
const {
    listarUsuariosAdmin,
    listarAvaliacoesAdmin
} = require("./services/adminService");
const {
    criarAvaliacao,
    listarAvaliacoes,
    listarAvaliacoesDoUsuario,
    ReviewValidationError
} = require("./services/avaliacaoService");
const { LIMITE_IMAGEM_BYTES } = require("./services/imagemService");

function createApp({
    firestore,
    admin,
    authenticateUser,
    sqliteDb,
    corsOrigins = process.env.CORS_ORIGINS
        || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000"),
    uploadDirectory = path.join(__dirname, "uploads")
}) {
    if (!firestore || !admin || typeof authenticateUser !== "function") {
        throw new TypeError("Firestore, Firebase Admin, and authentication middleware are required.");
    }

    const app = express();
    const allowedOrigins = corsOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
        throw new Error("CORS_ORIGINS must be configured in production.");
    }

    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Origin is not allowed by CORS."));
        }
    }));
    app.use(express.json());
    app.use(bloquearRotasSQLiteLegadas);
    app.use("/uploads", express.static(uploadDirectory));

    const receberImagem = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: LIMITE_IMAGEM_BYTES }
    }).single("imagem");

    function validarUploadImagem(req, res, next) {
        receberImagem(req, res, (erro) => {
            if (!erro) {
                return next();
            }
            if (erro.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({
                    mensagem: "A imagem deve ter no máximo 10 MB."
                });
            }
            return res.status(400).json({
                mensagem: "O arquivo de imagem é inválido."
            });
        });
    }

    app.post("/usuario", (request, response) => {
        const { nome, email, aniversario, senha } = request.body;
        const sql = `
            INSERT INTO usuarios (nome, email, aniversario, senha)
            VALUES(?, ?, ?, ?)
        `;

        sqliteDb.run(sql, [nome, email, aniversario, senha], function (erro) {
            if (erro) {
                console.log("ERRO DO BANCO:", erro.message);
                if (erro.code === "SQLITE_CONSTRAINT" || erro.code === "SQLITE_CONSTRAINT_UNIQUE") {
                    return response.status(409).json({ erro: "Este e-mail já está cadastrado." });
                }
                return response.status(500).json({ erro: "Erro ao criar usuário." });
            }
            return response.status(201).json({
                mensagem: "Usuário criado com sucesso.",
                id: this.lastID
            });
        });
    });

    app.get("/usuarios/firebase", authenticateUser, async (req, res) => {
        try {
            const perfil = await buscarPerfil(firestore, req.usuario.uid);
            if (!perfil) {
                return res.status(404).json({
                    mensagem: "Perfil não encontrado."
                });
            }

            return res.json({
                uid: req.usuario.uid,
                nome: perfil.nome,
                email: req.usuario.email,
                aniversario: perfil.aniversario || ""
            });
        } catch (erro) {
            console.error("Erro ao consultar perfil Firebase:", erro);
            return res.status(500).json({
                mensagem: "Não foi possível consultar o perfil."
            });
        }
    });

    app.get("/usuarios/:id", (request, response) => {
        const sql = `
            SELECT id, nome, email
            FROM usuarios
            WHERE id = ?
        `;

        sqliteDb.get(sql, [request.params.id], (erro, usuario) => {
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
            return response.json(usuario);
        });
    });

    app.post("/login", (request, response) => {
        const { email, senha } = request.body;
        const sql = `
            SELECT id, nome, email
            FROM usuarios
            WHERE email = ? AND senha= ?
        `;

        sqliteDb.get(sql, [email, senha], (erro, usuario) => {
            if (erro) {
                console.error("ERRO DO BANCO:", erro.message);
                return response.status(500).json({
                    erro: "Erro ao consultar usuário."
                });
            }
            if (!usuario) {
                return response.status(401).json({
                    erro: "E-mail ou senha incorretos :("
                });
            }
            return response.json(usuario);
        });
    });

    app.get("/avaliacao", async (_request, response) => {
        try {
            return response.json(await listarAvaliacoes(firestore));
        } catch (erro) {
            console.error("Erro ao consultar avaliações:", erro);
            return response.status(500).json({
                mensagem: "Não foi possível consultar as avaliações."
            });
        }
    });

    app.post("/avaliacao", authenticateUser, validarUploadImagem, async (request, response) => {
        try {
            const resultado = await criarAvaliacao({
                db: firestore,
                fieldValue: admin.firestore.FieldValue,
                uid: request.usuario.uid,
                dados: request.body,
                arquivo: request.file
            });
            return response.status(201).json({
                mensagem: "Avaliação criada com sucesso!",
                ...resultado
            });
        } catch (erro) {
            if (erro instanceof ReviewValidationError) {
                return response.status(400).json({
                    mensagem: "Os dados da avaliação são inválidos."
                });
            }
            if (erro.compensacaoImagem) {
                console.error("Falha ao remover imagem órfã após erro Firestore:", erro.compensacaoImagem);
            }
            console.error("Erro ao criar avaliação:", erro);
            return response.status(erro.status || 500).json({
                mensagem: erro.status
                    ? erro.message
                    : "Não foi possível salvar a avaliação."
            });
        }
    });

    app.get("/avaliacoes_usuario", authenticateUser, async (request, response) => {
        try {
            return response.json(
                await listarAvaliacoesDoUsuario(firestore, request.usuario.uid, 15)
            );
        } catch (erro) {
            console.error("Erro ao consultar avaliações pessoais:", erro);
            return response.status(500).json({
                mensagem: "Não foi possível consultar suas avaliações."
            });
        }
    });

    app.post("/avaliacoes_usuario", (request, response) => {
        const { id_usuario, id_avaliacao, data_criacao } = request.body;
        const sql = `
            INSERT INTO avaliacoes_usuario (id_usuario, id_avaliacao, data_criacao)
            VALUES(?, ?, ?)
        `;

        sqliteDb.run(sql, [id_usuario, id_avaliacao, data_criacao], function (erro) {
            if (erro) {
                console.log("ERRO DO BANCO:", erro.message);
                return response.status(500).send("Erro ao relacionar avaliação e usuário: ", erro.message);
            }
            return response.json({
                mensagem: "Avaliação relacionada com sucesso"
            });
        });
    });

    app.get("/avaliacoes_usuarios/:id_usuario", (request, response) => {
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
            ORDER BY avaliacao.id DESC
        `;

        sqliteDb.all(sql, [request.params.id_usuario], (erro, avaliacoes) => {
            if (erro) {
                console.error(erro);
                return response.status(500).json({
                    erro: "Erro ao mostrar avaliações do usuário"
                });
            }
            return response.json(avaliacoes);
        });
    });

    app.use("/admin", criarAutenticarAdmin(admin.auth()), async (request, response, next) => {
        try {
            if (request.method === "GET" && request.path === "/avaliacoes") {
                return response.json(await listarAvaliacoesAdmin(firestore));
            }
            if (request.method === "GET" && request.path === "/usuarios") {
                return response.json(await listarUsuariosAdmin(firestore));
            }
            return next();
        } catch (erro) {
            console.error("Erro em consulta administrativa Firebase:", erro);
            return response.status(500).json({
                mensagem: "Não foi possível concluir a consulta administrativa."
            });
        }
    });

    app.get("/admin/avaliacoes", (request, response) => {
        const token = request.headers.authorization;
        if (!process.env.ADMIN_TOKEN || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
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

        sqliteDb.all(sql, [], (erro, avaliacoes) => {
            if (erro) {
                console.error("Erro na consulta administrativa:", erro.message);
                return response.status(500).json({
                    erro: "Erro ao consultar avaliações"
                });
            }
            return response.json(avaliacoes);
        });
    });

    app.get("/admin/usuarios", (request, response) => {
        const token = request.headers.authorization;
        if (!process.env.ADMIN_TOKEN || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
            return response.status(401).json({
                erro: "Acesso não autorizado"
            });
        }

        const sql = `
            SELECT id, nome, email, aniversario
            FROM usuarios
            ORDER BY id DESC
        `;

        sqliteDb.all(sql, [], (erro, usuarios) => {
            if (erro) {
                console.error(erro.message);
                return response.status(500).json({
                    erro: "Erro ao consultar usuários"
                });
            }
            return response.json(usuarios);
        });
    });

    app.post("/usuarios/firebase", authenticateUser, async (req, res) => {
        try {
            const perfil = await criarPerfil({
                db: firestore,
                fieldValue: admin.firestore.FieldValue,
                usuario: req.usuarios,
                perfil: {
                    nome: req.body.nome,
                    aniversario: req.body.aniversario
                }
            });

            return res.status(201).json({
                mensagem: "Usuário salvo com sucesso!",
                uid: perfil.uid
            });
        } catch (erro) {
            if (erro.code === "invalid-profile" || erro.code === "invalid-identity") {
                return res.status(400).json({
                    mensagem: "Os dados do perfil são inválidos."
                });
            }

            console.error("Erro ao salvar usuário:", erro);
            return res.status(500).json({
                mensagem: "Erro ao salvar usuário."
            });
        }
    });

    return app;
}

module.exports = { createApp };
