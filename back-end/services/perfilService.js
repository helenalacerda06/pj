function validarPerfil(usuario, perfil) {
    if (!usuario?.uid || !usuario?.email) {
        const erro = new Error("Authenticated user identity is incomplete.");
        erro.code = "invalid-identity";
        throw erro;
    }

    if (typeof perfil?.nome !== "string" || !perfil.nome.trim()) {
        const erro = new Error("Profile name is required.");
        erro.code = "invalid-profile";
        throw erro;
    }

    if (
        perfil.aniversario !== undefined &&
        typeof perfil.aniversario !== "string"
    ) {
        const erro = new Error("Profile birthday must be a string.");
        erro.code = "invalid-profile";
        throw erro;
    }
}

async function criarPerfil({ db, fieldValue, usuario, perfil }) {
    validarPerfil(usuario, perfil);
    const referencia = db.collection("usuarios").doc(usuario.uid);
    const existente = await referencia.get();
    const dados = {
        uid: usuario.uid,
        nome: perfil.nome.trim(),
        email: usuario.email,
        aniversario: perfil.aniversario || ""
    };

    if (!existente.exists) {
        dados.criadoEm = fieldValue.serverTimestamp();
    }

    await referencia.set(dados, { merge: true });
    return { ...(existente.exists ? existente.data() : {}), ...dados };
}

async function buscarPerfil(db, uidAutenticado, uidSolicitado = uidAutenticado) {
    if (!uidAutenticado || uidSolicitado !== uidAutenticado) {
        const erro = new Error("A user can only read their own profile.");
        erro.code = "permission-denied";
        throw erro;
    }

    const snapshot = await db.collection("usuarios").doc(uidAutenticado).get();
    return snapshot.exists ? snapshot.data() : null;
}

module.exports = { criarPerfil, buscarPerfil };
