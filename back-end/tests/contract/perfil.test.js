const test = require("node:test");
const assert = require("node:assert/strict");
const { criarPerfil, buscarPerfil } = require("../../services/perfilService");

function criarBancoEmMemoria() {
    const documentos = new Map();
    return {
        documentos,
        collection(nome) {
            return {
                doc(uid) {
                    const chave = `${nome}/${uid}`;
                    return {
                        async get() {
                            return {
                                exists: documentos.has(chave),
                                data: () => documentos.get(chave)
                            };
                        },
                        async set(valor, opcoes) {
                            const atual = documentos.get(chave) || {};
                            documentos.set(chave, opcoes?.merge ? { ...atual, ...valor } : valor);
                        }
                    };
                }
            };
        }
    };
}

test("persists profile at authenticated UID and derives email from verified identity", async () => {
    const db = criarBancoEmMemoria();
    await criarPerfil({
        db,
        fieldValue: { serverTimestamp: () => "server-time" },
        usuario: { uid: "uid-a", email: "person@example.com" },
        perfil: { nome: "Pessoa", aniversario: "2000-01-01" }
    });

    assert.deepEqual(db.documentos.get("usuarios/uid-a"), {
        uid: "uid-a",
        nome: "Pessoa",
        email: "person@example.com",
        aniversario: "2000-01-01",
        criadoEm: "server-time"
    });
});

test("profile lookup cannot select a UID other than the authenticated identity", async () => {
    const db = criarBancoEmMemoria();
    await criarPerfil({
        db,
        fieldValue: { serverTimestamp: () => "server-time" },
        usuario: { uid: "uid-a", email: "a@example.com" },
        perfil: { nome: "A", aniversario: "" }
    });

    await assert.rejects(
        buscarPerfil(db, "uid-a", "uid-b"),
        { code: "permission-denied" }
    );
    assert.equal(await buscarPerfil(db, "uid-a", "uid-a").then((profile) => profile.uid), "uid-a");
});

test("profile updates preserve the original creation timestamp", async () => {
    const db = criarBancoEmMemoria();
    await criarPerfil({
        db,
        fieldValue: { serverTimestamp: () => "first-time" },
        usuario: { uid: "uid-a", email: "a@example.com" },
        perfil: { nome: "A", aniversario: "" }
    });
    await criarPerfil({
        db,
        fieldValue: { serverTimestamp: () => "second-time" },
        usuario: { uid: "uid-a", email: "a@example.com" },
        perfil: { nome: "Pessoa A", aniversario: "" }
    });

    assert.equal(db.documentos.get("usuarios/uid-a").criadoEm, "first-time");
    assert.equal(db.documentos.get("usuarios/uid-a").nome, "Pessoa A");
});
