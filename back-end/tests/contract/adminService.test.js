const test = require("node:test");
const assert = require("node:assert/strict");
const {
    listarUsuariosAdmin,
    listarAvaliacoesAdmin
} = require("../../services/adminService");

function snapshot(id, data) {
    return { id, data: () => data };
}

test("admin user listing omits password and returns Firebase UID identity", async () => {
    const db = {
        collection(name) {
            assert.equal(name, "usuarios");
            return {
                async get() {
                    return {
                        docs: [snapshot("firebase-uid", {
                            nome: "Pessoa",
                            email: "person@example.com",
                            aniversario: "2000-01-01",
                            senha: "must-not-return"
                        })]
                    };
                }
            };
        }
    };

    const usuarios = await listarUsuariosAdmin(db);
    assert.deepEqual(usuarios, [{
        uid: "firebase-uid",
        nome: "Pessoa",
        email: "person@example.com",
        aniversario: "2000-01-01"
    }]);
});

test("admin review listing joins profile names by Firebase UID", async () => {
    const db = {
        collection(name) {
            if (name === "avaliacoes") {
                return {
                    orderBy(field, order) {
                        assert.equal(field, "dataCriacao");
                        assert.equal(order, "desc");
                        return {
                            async get() {
                                return {
                                    docs: [snapshot("review-a", {
                                        usuarioUid: "uid-a",
                                        nome: "Obra",
                                        dataCriacao: {
                                            toDate: () => new Date("2025-01-01T00:00:00.000Z")
                                        }
                                    })]
                                };
                            }
                        };
                    }
                };
            }
            return {
                doc(uid) {
                    assert.equal(uid, "uid-a");
                    return {
                        async get() {
                            return {
                                exists: true,
                                data: () => ({ nome: "Autora" })
                            };
                        }
                    };
                }
            };
        }
    };

    const avaliacoes = await listarAvaliacoesAdmin(db);
    assert.equal(avaliacoes[0].id, "review-a");
    assert.equal(avaliacoes[0].nome_usuario, "Autora");
    assert.equal(avaliacoes[0].dataCriacao, "2025-01-01T00:00:00.000Z");
});
