const test = require("node:test");
const assert = require("node:assert/strict");
const { criarAutenticarAdmin } = require("../../autenticarAdmin");

function responseFake() {
    return {
        statusCode: 200,
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

test("admin middleware requires a verified bearer token with admin claim", async () => {
    const middleware = criarAutenticarAdmin({
        verifyIdToken: async () => ({ uid: "uid-a", admin: false })
    });
    const response = responseFake();

    await middleware(
        { headers: { authorization: "Bearer token" } },
        response,
        () => assert.fail("non-admin must not continue")
    );

    assert.equal(response.statusCode, 403);
});

test("admin middleware checks token revocation and derives identity from token", async () => {
    let checkRevoked;
    const middleware = criarAutenticarAdmin({
        verifyIdToken: async (_token, check) => {
            checkRevoked = check;
            return { uid: "uid-admin", admin: true };
        }
    });
    const request = { headers: { authorization: "Bearer valid-token" } };
    const response = responseFake();
    let continued = false;

    await middleware(request, response, () => {
        continued = true;
    });

    assert.equal(checkRevoked, true);
    assert.equal(request.usuario.uid, "uid-admin");
    assert.equal(continued, true);
});

test("admin middleware denies client-declared privileges without a bearer token", async () => {
    const middleware = criarAutenticarAdmin({
        verifyIdToken: async () => assert.fail("must not verify absent token")
    });
    const response = responseFake();

    await middleware(
        { headers: { "x-admin": "true", authorization: undefined } },
        response,
        () => assert.fail("must not continue")
    );

    assert.equal(response.statusCode, 401);
});

test("admin middleware rejects invalid or revoked Firebase ID tokens", async () => {
    const middleware = criarAutenticarAdmin({
        verifyIdToken: async () => {
            const error = new Error("invalid token");
            error.code = "auth/invalid-id-token";
            throw error;
        }
    });
    const response = responseFake();

    await middleware(
        { headers: { authorization: "Bearer invalid-token" } },
        response,
        () => assert.fail("invalid token must not continue")
    );

    assert.equal(response.statusCode, 401);
});
