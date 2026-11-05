const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { criarPerfil, buscarPerfil } = require("../../services/perfilService");
const {
    assertIsolatedEmulatorEnvironment,
    emulatorConfigured
} = require("../helpers/firebaseEmulator");

test("isolates persisted profiles between two Firebase Auth emulator users", {
    skip: !emulatorConfigured()
}, async () => {
    assertIsolatedEmulatorEnvironment();
    const { admin, db } = require("../../firebase");
    const suffix = randomUUID();
    const users = [];

    try {
        for (const label of ["a", "b"]) {
            users.push(await admin.auth().createUser({
                email: `${label}-${suffix}@example.test`,
                emailVerified: true
            }));
        }

        for (const user of users) {
            await criarPerfil({
                db,
                fieldValue: admin.firestore.FieldValue,
                usuario: user,
                perfil: { nome: user.email, aniversario: "" }
            });
        }

        const ownProfile = await buscarPerfil(db, users[0].uid);
        assert.equal(ownProfile.email, users[0].email);
        await assert.rejects(
            buscarPerfil(db, users[0].uid, users[1].uid),
            { code: "permission-denied" }
        );
    } finally {
        await Promise.all(users.map(async (user) => {
            await db.collection("usuarios").doc(user.uid).delete();
            await admin.auth().deleteUser(user.uid);
        }));
    }
});
