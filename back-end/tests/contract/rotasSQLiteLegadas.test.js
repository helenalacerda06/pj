const test = require("node:test");
const assert = require("node:assert/strict");
const {
    bloquearRotasSQLiteLegadas,
    isLegacySqliteRoute
} = require("../../middleware/bloquearRotasSQLiteLegadas");

const rotasLegadas = [
    ["POST", "/usuario"],
    ["GET", "/usuario/123"],
    ["POST", "/login"],
    ["POST", "/avaliacoes_usuario"],
    ["GET", "/avaliacoes_usuarios/123"]
];

function criarResponse() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test("blocks every legacy SQLite identity and relationship route without authentication", async () => {
    for (const [method, path] of rotasLegadas) {
        assert.equal(isLegacySqliteRoute(method, path), true);

        const response = criarResponse();
        let continued = false;
        await bloquearRotasSQLiteLegadas(
            { method, path, headers: {} },
            response,
            () => {
                continued = true;
            }
        );

        assert.equal(response.statusCode, 410, `${method} ${path} must be retired`);
        assert.equal(continued, false);
        assert.match(response.body.mensagem, /rota legada foi desativada/);
    }
});

test("keeps the active Firebase profile and personal-review routes available", () => {
    assert.equal(isLegacySqliteRoute("GET", "/usuario/firebase"), false);
    assert.equal(isLegacySqliteRoute("POST", "/usuario/firebase"), false);
    assert.equal(isLegacySqliteRoute("GET", "/avaliacoes_usuario"), false);
});
