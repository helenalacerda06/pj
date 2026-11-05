const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { bloquearRotasSQLiteLegadas } = require("../../middleware/bloquearRotasSQLiteLegadas");

const rotasLegadas = [
    ["POST", "/usuario"],
    ["GET", "/usuario/123"],
    ["POST", "/login"],
    ["POST", "/avaliacoes_usuario"],
    ["GET", "/avaliacoes_usuarios/123"]
];

test("legacy SQLite routes return HTTP 410 and Firebase routes reach their handlers", async (context) => {
    const app = express();
    const firebaseHandlersReached = new Set();
    app.use(express.json());
    app.use(bloquearRotasSQLiteLegadas);

    app.get("/usuario/firebase", (_request, response) => {
        firebaseHandlersReached.add("GET /usuario/firebase");
        return response.status(200).json({ handler: "firebase-profile-read" });
    });
    app.post("/usuario/firebase", (_request, response) => {
        firebaseHandlersReached.add("POST /usuario/firebase");
        return response.status(201).json({ handler: "firebase-profile-create" });
    });
    app.get("/avaliacoes_usuario", (_request, response) => {
        firebaseHandlersReached.add("GET /avaliacoes_usuario");
        return response.status(200).json({ handler: "firebase-personal-reviews" });
    });

    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    context.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    for (const [method, route] of rotasLegadas) {
        const response = await fetch(`${baseUrl}${route}`, {
            method,
            headers: { "content-type": "application/json" },
            body: method === "POST" ? JSON.stringify({}) : undefined
        });

        assert.equal(response.status, 410, `${method} ${route} should be Gone`);
        assert.match((await response.json()).mensagem, /rota legada foi desativada/);
    }

    for (const [method, route, expectedStatus, expectedHandler] of [
        ["GET", "/usuario/firebase", 200, "firebase-profile-read"],
        ["POST", "/usuario/firebase", 201, "firebase-profile-create"],
        ["GET", "/avaliacoes_usuario", 200, "firebase-personal-reviews"]
    ]) {
        const response = await fetch(`${baseUrl}${route}`, {
            method,
            headers: { "content-type": "application/json" },
            body: method === "POST" ? JSON.stringify({}) : undefined
        });

        assert.equal(response.status, expectedStatus, `${method} ${route} should reach its handler`);
        assert.deepEqual(await response.json(), { handler: expectedHandler });
    }

    assert.deepEqual(
        [...firebaseHandlersReached].sort(),
        ["GET /avaliacoes_usuario", "GET /usuario/firebase", "POST /usuario/firebase"]
    );
});
