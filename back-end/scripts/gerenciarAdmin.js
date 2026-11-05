async function gerenciarAdmin(firebaseAuth, acao, uid) {
    if (!["grant", "revoke"].includes(acao) || !uid) {
        throw new Error("Usage: node scripts/gerenciarAdmin.js <grant|revoke> <firebase-uid>");
    }

    const usuario = await firebaseAuth.getUser(uid);
    const claims = { ...usuario.customClaims };

    if (acao === "grant") {
        claims.admin = true;
        await firebaseAuth.setCustomUserClaims(uid, claims);
    } else {
        delete claims.admin;
        await firebaseAuth.setCustomUserClaims(uid, claims);
        await firebaseAuth.revokeRefreshTokens(uid);
    }
}

if (require.main === module) {
    const { admin } = require("../firebase");
    gerenciarAdmin(admin.auth(), process.argv[2], process.argv[3])
        .then(() => console.log("Admin permission updated."))
        .catch((erro) => {
            console.error(erro.message);
            process.exitCode = 1;
        });
}

module.exports = { gerenciarAdmin };
