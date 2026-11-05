const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const {
    criarAvaliacao,
    listarAvaliacoes,
    listarAvaliacoesDoUsuario
} = require("../../services/avaliacaoService");
const {
    assertIsolatedEmulatorEnvironment,
    emulatorConfigured
} = require("../helpers/firebaseEmulator");

test("lists reviews in descending creation order and isolates the 15 personal results", {
    skip: !emulatorConfigured()
}, async () => {
    assertIsolatedEmulatorEnvironment();
    const { admin, db } = require("../../firebase");
    const suffix = randomUUID();
    const author = await admin.auth().createUser({
        email: `author-${suffix}@example.test`,
        emailVerified: true
    });
    const other = await admin.auth().createUser({
        email: `other-${suffix}@example.test`,
        emailVerified: true
    });
    const createdIds = [];

    try {
        for (let index = 0; index < 16; index += 1) {
            const result = await criarAvaliacao({
                db,
                fieldValue: admin.firestore.FieldValue,
                uid: author.uid,
                dados: {
                    categoria: "Filme",
                    nome: `Review ${index}`,
                    estrelas: "4"
                }
            });
            createdIds.push(result.id);
        }

        const personal = await listarAvaliacoesDoUsuario(db, author.uid, 15);
        assert.equal(personal.length, 15);
        assert.ok(personal.every((review) => review.usuarioUid === author.uid));
        assert.ok(
            new Date(personal[0].dataCriacao) >= new Date(personal[14].dataCriacao)
        );
        assert.deepEqual(await listarAvaliacoesDoUsuario(db, other.uid, 15), []);

        const publicReviews = await listarAvaliacoes(db, 15);
        assert.equal(publicReviews.length, 15);
        assert.ok(
            new Date(publicReviews[0].dataCriacao) >= new Date(publicReviews[14].dataCriacao)
        );
    } finally {
        const reviewIds = new Set(createdIds);
        const links = await db.collection("avaliacoes_usuario")
            .where("usuarioUid", "==", author.uid)
            .get();
        const batch = db.batch();
        for (const id of reviewIds) {
            batch.delete(db.collection("avaliacoes").doc(id));
        }
        for (const link of links.docs) {
            batch.delete(link.ref);
        }
        await batch.commit();
        await Promise.all([
            admin.auth().deleteUser(author.uid),
            admin.auth().deleteUser(other.uid)
        ]);
    }
});
