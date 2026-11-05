const {
    enviarImagem: enviarImagemPadrao,
    excluirImagem: excluirImagemPadrao
} = require("./imagemService");

const CATEGORIAS = new Set(["Filme", "Série", "Livro"]);

function dataCalendarioValida(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1 || month < 1 || month > 12) {
        return false;
    }

    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysByMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day >= 1 && day <= daysByMonth[month - 1];
}

class ReviewValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ReviewValidationError";
        this.code = "invalid-review";
    }
}

function validarTexto(opcoes, campo) {
    const valor = opcoes[campo];
    if (valor === undefined || valor === null || valor === "") {
        return "";
    }
    if (typeof valor !== "string") {
        throw new ReviewValidationError(`Field ${campo} must be a string.`);
    }
    return valor.trim();
}

function normalizarAvaliacao(dados) {
    const categoria = validarTexto(dados, "categoria");
    if (categoria && !CATEGORIAS.has(categoria)) {
        throw new ReviewValidationError("Category is not supported.");
    }

    const nome = validarTexto(dados, "nome");
    const estrelasRaw = dados.estrelas;
    const estrelas = estrelasRaw === "" || estrelasRaw === undefined
        ? 0
        : Number(estrelasRaw);
    if (
        !Number.isFinite(estrelas) ||
        estrelas < 0 ||
        estrelas > 5 ||
        !Number.isInteger(estrelas * 2)
    ) {
        throw new ReviewValidationError("Rating must be between 0 and 5 in half-star increments.");
    }

    const lancamento = validarTexto(dados, "lancamento");
    if (lancamento && !dataCalendarioValida(lancamento)) {
        throw new ReviewValidationError("Release date must be a valid YYYY-MM-DD calendar date.");
    }
    const duracao = validarTexto(dados, "duracao");
    if (duracao && !/^([01]\d|2[0-3]):[0-5]\d$/.test(duracao)) {
        throw new ReviewValidationError("Duration must be between 00:00 and 23:59.");
    }

    return {
        categoria,
        nome,
        descricao: validarTexto(dados, "descricao"),
        feedback: validarTexto(dados, "feedback"),
        principais_pontos: validarTexto(dados, "principais_pontos"),
        lancamento,
        duracao,
        estrelas
    };
}

function serializarAvaliacao(documento) {
    const dados = documento.data();
    const dataCriacao = dados.dataCriacao?.toDate
        ? dados.dataCriacao.toDate().toISOString()
        : "";
    return {
        id: documento.id,
        ...dados,
        dataCriacao,
        data: dataCriacao,
        imagem: dados.imagemUrl || null
    };
}

async function criarAvaliacao({
    db,
    fieldValue,
    uid,
    dados,
    arquivo,
    enviarImagem = enviarImagemPadrao,
    excluirImagem = excluirImagemPadrao
}) {
    if (!uid) {
        const erro = new Error("Authenticated user UID is required.");
        erro.code = "permission-denied";
        throw erro;
    }

    const avaliacao = normalizarAvaliacao(dados);
    let imagem = null;
    if (arquivo) {
        imagem = await enviarImagem(arquivo.buffer);
    }

    const avaliacaoRef = db.collection("avaliacoes").doc();
    const vinculoRef = db.collection("avaliacoes_usuario").doc(
        `${uid}_${avaliacaoRef.id}`
    );
    const avaliacaoDocumento = {
        ...avaliacao,
        usuarioUid: uid,
        imagemUrl: imagem?.url || null,
        imagemPublicId: imagem?.publicId || null,
        dataCriacao: fieldValue.serverTimestamp()
    };
    const vinculoDocumento = {
        usuarioUid: uid,
        avaliacaoId: avaliacaoRef.id,
        dataCriacao: fieldValue.serverTimestamp()
    };

    try {
        const batch = db.batch();
        batch.create(avaliacaoRef, avaliacaoDocumento);
        batch.create(vinculoRef, vinculoDocumento);
        await batch.commit();
    } catch (erro) {
        if (imagem?.publicId) {
            try {
                await excluirImagem(imagem.publicId);
            } catch (erroCompensacao) {
                erro.compensacaoImagem = erroCompensacao;
            }
        }
        throw erro;
    }

    return { id: avaliacaoRef.id, imagemUrl: imagem?.url || null };
}

async function listarAvaliacoes(db, limite = 15) {
    const resultado = await db.collection("avaliacoes")
        .orderBy("dataCriacao", "desc")
        .limit(limite)
        .get();
    return resultado.docs.map(serializarAvaliacao);
}

async function listarAvaliacoesDoUsuario(db, uid, limite = 15) {
    if (!uid) {
        const erro = new Error("Authenticated user UID is required.");
        erro.code = "permission-denied";
        throw erro;
    }
    const resultado = await db.collection("avaliacoes")
        .where("usuarioUid", "==", uid)
        .orderBy("dataCriacao", "desc")
        .limit(limite)
        .get();
    return resultado.docs.map(serializarAvaliacao);
}

module.exports = {
    CATEGORIAS,
    ReviewValidationError,
    normalizarAvaliacao,
    serializarAvaliacao,
    criarAvaliacao,
    listarAvaliacoes,
    listarAvaliacoesDoUsuario
};
