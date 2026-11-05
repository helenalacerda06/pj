function criarAutenticarAdmin(firebaseAuth) {
    return async function autenticarAdmin(req, res, next) {
        const authorization = req.headers.authorization;
        const match = typeof authorization === "string"
            ? authorization.match(/^Bearer ([^\s]+)$/)
            : null;

        if (!match) {
            return res.status(401).json({ mensagem: "Token não informado ou inválido." });
        }

        try {
            const usuario = await firebaseAuth.verifyIdToken(match[1], true);
            if (usuario.admin !== true) {
                return res.status(403).json({ mensagem: "Acesso administrativo negado." });
            }
            req.usuario = usuario;
            return next();
        } catch (erro) {
            if (!erro.code || !String(erro.code).startsWith("auth/")) {
                console.error("Firebase admin authorization failed:", erro);
                return res.status(500).json({
                    mensagem: "Não foi possível validar a autorização administrativa."
                });
            }
            return res.status(401).json({ mensagem: "Token inválido, expirado ou revogado." });
        }
    };
}

module.exports = { criarAutenticarAdmin };
