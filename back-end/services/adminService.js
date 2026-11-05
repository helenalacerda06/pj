function serializarData(valor) {
    return valor?.toDate ? valor.toDate().toISOString() : "";
}

async function listarUsuariosAdmin(db) {
    const resultado = await db.collection("usuarios").get();
    return resultado.docs.map((documento) => {
        const dados = documento.data();
        return {
            uid: documento.id,
            nome: dados.nome || "",
            email: dados.email || "",
            aniversario: dados.aniversario || ""
        };
    });
}

async function listarAvaliacoesAdmin(db) {
    const resultado = await db.collection("avaliacoes")
        .orderBy("dataCriacao", "desc")
        .get();
    const avaliacoes = resultado.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
        dataCriacao: serializarData(documento.data().dataCriacao)
    }));
    const uids = [...new Set(avaliacoes.map((avaliacao) => avaliacao.usuarioUid).filter(Boolean))];
    const perfis = new Map(await Promise.all(uids.map(async (uid) => {
        const perfil = await db.collection("usuarios").doc(uid).get();
        return [uid, perfil.exists ? perfil.data() : null];
    })));

    return avaliacoes.map((avaliacao) => ({
        ...avaliacao,
        nome_usuario: perfis.get(avaliacao.usuarioUid)?.nome || ""
    }));
}

module.exports = { listarUsuariosAdmin, listarAvaliacoesAdmin };
