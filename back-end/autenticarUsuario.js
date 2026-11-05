const { admin } = require("./firebase");

async function autenticarUsuario(req, res, next) {
    const authorization = req.headers.authorization;
    const match = typeof authorization === "string"
        ? authorization.match(/^Bearer ([^\s]+)$/)
        : null;

    if (!match) {
        return res.status(401).json({
            mensagem: "Token não informado ou inválido."
        });
    }

    try {
        req.usuario = await admin.auth().verifyIdToken(match[1]);
        return next();
    } catch (erro) {
        if (!erro.code || !String(erro.code).startsWith("auth/")) {
            console.error("Firebase token verification failed:", erro);
            return res.status(500).json({
                mensagem: "Não foi possível validar a sessão."
            });
        }
        return res.status(401).json({
            mensagem: "Token inválido ou expirado."
        });
    }
}

module.exports = autenticarUsuario;