const rotasSQLiteLegadas = [
    { method: "POST", path: /^\/usuario\/?$/ },
    { method: "GET", path: /^\/usuario\/(?!firebase\/?$)[^/]+\/?$/ },
    { method: "POST", path: /^\/login\/?$/ },
    { method: "POST", path: /^\/avaliacoes_usuario\/?$/ },
    { method: "GET", path: /^\/avaliacoes_usuarios\/[^/]+\/?$/ }
];

function isLegacySqliteRoute(method, path) {
    return rotasSQLiteLegadas.some((route) =>
        route.method === method && route.path.test(path)
    );
}

function bloquearRotasSQLiteLegadas(req, res, next) {
    if (!isLegacySqliteRoute(req.method, req.path)) {
        return next();
    }

    return res.status(410).json({
        mensagem: "Esta rota legada foi desativada. Use os endpoints Firebase atuais."
    });
}

module.exports = { bloquearRotasSQLiteLegadas, isLegacySqliteRoute };
