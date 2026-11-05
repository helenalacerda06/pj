const test = require("node:test");
const assert = require("node:assert/strict");

let verificarToken;
let middleware;

function respostaFake() {
    return {
        statusCode: 200,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test.before(() => {
    const firebasePath = require.resolve("../../firebase");
    require.cache[firebasePath] = {
        id: firebasePath,
        filename: firebasePath,
        loaded: true,
        exports: {
            admin: {
                auth: () => ({
                    verifyIdToken: (...args) => verificarToken(...args)
                })
            }
        }
    };
    middleware = require("../../autenticarUsuario");
});

test("requires a bearer token", async () => {
    const response = respostaFake();
    await middleware({ headers: {} }, response, () => assert.fail("next must not run"));
    assert.equal(response.statusCode, 401);
});

test("sets authenticated identity from a verified Firebase token", async () => {
    verificarToken = async (token) => ({ uid: token, email: "person@example.com" });
    const request = { headers: { authorization: "Bearer uid-a" } };
    const response = respostaFake();
    let continued = false;

    await middleware(request, response, () => {
        continued = true;
    });

    assert.equal(continued, true);
    assert.equal(request.usuario.uid, "uid-a");
});

test("rejects invalid Firebase tokens", async () => {
    verificarToken = async () => {
        const error = new Error("invalid token");
        error.code = "auth/invalid-id-token";
        throw error;
    };
    const response = respostaFake();

    await middleware(
        { headers: { authorization: "Bearer bad-token" } },
        response,
        () => assert.fail("next must not run")
    );

    assert.equal(response.statusCode, 401);
});

test("reports token verification service failures as server errors", async () => {
    verificarToken = async () => {
        throw new Error("service unavailable");
    };
    const response = respostaFake();
    const consoleErrorOriginal = console.error;
    console.error = () => {};

    try {
        await middleware(
            { headers: { authorization: "Bearer token" } },
            response,
            () => assert.fail("next must not run")
        );
    } finally {
        console.error = consoleErrorOriginal;
    }

    assert.equal(response.statusCode, 500);
});
