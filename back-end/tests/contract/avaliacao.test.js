const test = require("node:test");
const assert = require("node:assert/strict");
const {
    criarAvaliacao,
    listarAvaliacoesDoUsuario,
    normalizarAvaliacao
} = require("../../services/avaliacaoService");

function criarBancoEmMemoria({ falharCommit = false } = {}) {
    const documentos = new Map();
    const staged = [];
    let sequencia = 0;
    return {
        documentos,
        staged,
        collection(nome) {
            return {
                doc(id) {
                    return { collection: nome, id: id || `generated-${++sequencia}` };
                },
                where(campo, operador, valor) {
                    assert.equal(campo, "usuarioUid");
                    assert.equal(operador, "==");
                    return {
                        orderBy(campoOrdenacao, ordem) {
                            assert.equal(campoOrdenacao, "dataCriacao");
                            assert.equal(ordem, "desc");
                            return {
                                limit(limite) {
                                    return {
                                        async get() {
                                            const docs = [...documentos.entries()]
                                                .filter(([chave, dado]) =>
                                                    chave.startsWith(`${nome}/`) &&
                                                    dado.usuarioUid === valor
                                                )
                                                .slice(0, limite)
                                                .map(([chave, dado]) => ({
                                                    id: chave.slice(nome.length + 1),
                                                    data: () => dado
                                                }));
                                            return { docs };
                                        }
                                    };
                                }
                            };
                        }
                    };
                }
            };
        },
        batch() {
            return {
                create(referencia, dados) {
                    staged.push([referencia, dados]);
                },
                async commit() {
                    if (falharCommit) {
                        throw new Error("Firestore write failed.");
                    }
                    for (const [referencia, dados] of staged) {
                        documentos.set(`${referencia.collection}/${referencia.id}`, dados);
                    }
                }
            };
        }
    };
}

test("validates current categories, half-star ratings, dates and durations", () => {
    assert.deepEqual(normalizarAvaliacao({
        categoria: "Série",
        nome: "Série",
        estrelas: "4.5",
        lancamento: "2020-02-01",
        duracao: "01:30"
    }), {
        categoria: "Série",
        nome: "Série",
        descricao: "",
        feedback: "",
        principais_pontos: "",
        lancamento: "2020-02-01",
        duracao: "01:30",
        estrelas: 4.5
    });
    assert.throws(() => normalizarAvaliacao({ categoria: "Jogo" }));
    assert.throws(() => normalizarAvaliacao({ estrelas: "4.3" }));
    assert.throws(() => normalizarAvaliacao({ lancamento: "01/02/2020" }));
});

test("accepts valid leap and non-leap calendar dates and boundary durations", () => {
    assert.equal(
        normalizarAvaliacao({ lancamento: "2024-02-29", duracao: "00:00" }).lancamento,
        "2024-02-29"
    );
    assert.equal(
        normalizarAvaliacao({ lancamento: "2023-02-28", duracao: "23:59" }).duracao,
        "23:59"
    );
});

test("rejects impossible calendar dates and durations outside clock limits", () => {
    for (const lancamento of ["2023-02-29", "2024-04-31", "2024-13-01", "0000-01-01"]) {
        assert.throws(
            () => normalizarAvaliacao({ lancamento }),
            /valid YYYY-MM-DD calendar date/
        );
    }
    for (const duracao of ["24:00", "12:60", "1:30", "99:99"]) {
        assert.throws(
            () => normalizarAvaliacao({ duracao }),
            /between 00:00 and 23:59/
        );
    }
});

test("creates review and user link atomically using authenticated UID", async () => {
    const db = criarBancoEmMemoria();
    const result = await criarAvaliacao({
        db,
        fieldValue: { serverTimestamp: () => "server-time" },
        uid: "uid-a",
        dados: {
            usuarioUid: "uid-forged",
            categoria: "Filme",
            nome: "Obra",
            estrelas: "4.5"
        }
    });

    assert.equal(result.id, "generated-1");
    const review = db.documentos.get("avaliacoes/generated-1");
    assert.equal(review.usuarioUid, "uid-a");
    assert.equal(review.nome, "Obra");
    assert.equal(
        db.documentos.get("avaliacoes_usuario/uid-a_generated-1").avaliacaoId,
        result.id
    );
});

test("compensates uploaded media when Firestore commit fails", async () => {
    const db = criarBancoEmMemoria({ falharCommit: true });
    let deletedPublicId;

    await assert.rejects(
        criarAvaliacao({
            db,
            fieldValue: { serverTimestamp: () => "server-time" },
            uid: "uid-a",
            dados: { nome: "Obra" },
            arquivo: { buffer: Buffer.from("file") },
            enviarImagem: async () => ({
                url: "https://images.example.test/image.jpg",
                publicId: "asset-1"
            }),
            excluirImagem: async (publicId) => {
                deletedPublicId = publicId;
            }
        }),
        /Firestore write failed/
    );
    assert.equal(deletedPublicId, "asset-1");
});

test("lists only reviews whose owner UID matches the authenticated UID", async () => {
    const db = criarBancoEmMemoria();
    db.documentos.set("avaliacoes/review-a", {
        usuarioUid: "uid-a",
        nome: "A",
        dataCriacao: { toDate: () => new Date("2025-01-01T00:00:00.000Z") }
    });
    db.documentos.set("avaliacoes/review-b", {
        usuarioUid: "uid-b",
        nome: "B",
        dataCriacao: { toDate: () => new Date("2025-01-02T00:00:00.000Z") }
    });

    const reviews = await listarAvaliacoesDoUsuario(db, "uid-a", 15);
    assert.deepEqual(reviews.map(({ id }) => id), ["review-a"]);
});
