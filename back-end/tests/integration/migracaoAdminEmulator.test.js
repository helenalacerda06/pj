const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { buildMigrationPlan } = require("../../services/migrationService");
const { applyPlan } = require("../../scripts/migrarSQLiteParaFirestore");
const { gerenciarAdmin } = require("../../scripts/gerenciarAdmin");
const {
    assertIsolatedEmulatorEnvironment,
    emulatorConfigured
} = require("../helpers/firebaseEmulator");

async function authEmulatorRequest(operation, body) {
    const url = new URL(
        `/identitytoolkit.googleapis.com/v1/accounts:${operation}`,
        `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
    );
    url.searchParams.set("key", "fake-api-key");
    const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
    });
    const result = await response.json();
    assert.equal(response.ok, true, `${operation} failed: ${JSON.stringify(result)}`);
    return result;
}

async function idTokenFromCustomClaims(adminAuth, uid) {
    const customToken = await adminAuth.createCustomToken(uid);
    const session = await authEmulatorRequest("signInWithCustomToken", {
        token: customToken,
        returnSecureToken: true
    });
    return session.idToken;
}

async function listen(app) {
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    return server;
}

async function getJson(url, token) {
    const response = await fetch(url, {
        headers: token ? { Authorization: ["Bearer", token].join(" ") } : {}
    });
    return {
        status: response.status,
        body: await response.json()
    };
}

const emulatorTest = emulatorConfigured() ? test : test.skip;

emulatorTest("grants and revokes real admin claims and enforces them on Express routes", {
    timeout: 30000
}, async (context) => {
    assertIsolatedEmulatorEnvironment();

    const { admin, db } = require("../../firebase");
    const { createApp } = require("../../app");
    const authenticateUser = require("../../autenticarUsuario");
    const suffix = randomUUID();
    const email = `admin-${suffix}@example.test`;
    const password = "emulator-admin-password-391";
    let uid;
    let server;

    context.after(async () => {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }
        if (uid) {
            await db.collection("usuarios").doc(uid).delete();
            await admin.auth().deleteUser(uid);
        }
    });

    const identity = await authEmulatorRequest("signUp", {
        email,
        password,
        returnSecureToken: true
    });
    uid = identity.localId;

    const app = createApp({
        firestore: db,
        admin,
        authenticateUser,
        corsOrigins: "http://localhost:3000"
    });
    server = await listen(app);
    const route = `http://127.0.0.1:${server.address().port}/admin/usuarios`;

    assert.equal((await getJson(route, identity.idToken)).status, 403);

    await admin.auth().setCustomUserClaims(uid, { beta: true });
    await gerenciarAdmin(admin.auth(), "grant", uid);
    assert.deepEqual((await admin.auth().getUser(uid)).customClaims, {
        beta: true,
        admin: true
    });

    await db.collection("usuarios").doc(uid).set({
        uid,
        nome: "Admin de teste",
        email,
        aniversario: ""
    });
    const adminToken = await idTokenFromCustomClaims(admin.auth(), uid);
    const adminResponse = await getJson(route, adminToken);
    assert.equal(adminResponse.status, 200);
    assert.ok(adminResponse.body.some((profile) => profile.uid === uid));
    assert.equal(adminResponse.body.some((profile) => "senha" in profile), false);

    const validSinceBeforeRevoke = (await admin.auth().getUser(uid)).tokensValidAfterTime;
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await gerenciarAdmin(admin.auth(), "revoke", uid);
    assert.deepEqual((await admin.auth().getUser(uid)).customClaims, { beta: true });
    assert.notEqual(
        (await admin.auth().getUser(uid)).tokensValidAfterTime,
        validSinceBeforeRevoke
    );

    const regularSession = await authEmulatorRequest("signInWithPassword", {
        email,
        password,
        returnSecureToken: true
    });
    assert.equal((await getJson(route, regularSession.idToken)).status, 403);
});

emulatorTest("imports the same synthetic Firestore fixture twice without duplicates or unrelated writes", {
    timeout: 30000
}, async (context) => {
    assertIsolatedEmulatorEnvironment();

    const { admin, db } = require("../../firebase");
    const suffix = randomUUID();
    const email = `migration-${suffix}@example.test`;
    let uid;
    let plan;

    context.after(async () => {
        if (plan) {
            const batch = db.batch();
            for (const profile of plan.profiles) {
                batch.delete(db.collection("usuarios").doc(profile.uid));
            }
            for (const review of plan.reviews) {
                batch.delete(db.collection("avaliacoes").doc(review.id));
            }
            for (const link of plan.links) {
                batch.delete(db.collection("avaliacoes_usuario").doc(link.id));
            }
            await batch.commit();
        }
        if (uid) {
            await admin.auth().deleteUser(uid);
        }
    });

    const identity = await admin.auth().createUser({ email, emailVerified: true });
    uid = identity.uid;
    const legacyUserId = `synthetic-user-${suffix}`;
    const unmappedUserId = `unmapped-user-${suffix}`;
    const legacyReviewId = `synthetic-review-${suffix}`;
    const legacyLinkId = `synthetic-link-${suffix}`;
    plan = buildMigrationPlan({
        users: [
            {
                id: legacyUserId,
                nome: "Usuária sintética",
                email,
                aniversario: ""
            },
            {
                id: unmappedUserId,
                nome: "Conta sem correspondência",
                email: `unmapped-${suffix}@example.test`,
                aniversario: ""
            }
        ],
        reviews: [{
            id: legacyReviewId,
            categoria: "Filme",
            nome: "Avaliação sintética",
            descricao: "Registro exclusivamente de teste",
            feedback: "Sem dados reais",
            principais_pontos: "Fixture de integração",
            imagem: "",
            lancamento: "2024-02-29",
            duracao: "01:25",
            estrelas: 4.5
        }],
        links: [{
            id: legacyLinkId,
            id_usuario: legacyUserId,
            id_avaliacao: legacyReviewId,
            data_criacao: "2024-03-01T10:00:00.000Z"
        }],
        authUsers: [{ uid, email, emailVerified: true }],
        fallbackDate: new Date("2024-03-02T10:00:00.000Z")
    });

    assert.equal(plan.profiles.length, 1);
    assert.equal(plan.reviews.length, 1);
    assert.equal(plan.links.length, 1);
    assert.ok(plan.exceptions.some((exception) =>
        exception.sourceId === unmappedUserId &&
        exception.reason === "VERIFIED_FIREBASE_ACCOUNT_NOT_FOUND"
    ));

    const reviewReference = db.collection("avaliacoes").doc(plan.reviews[0].id);
    await reviewReference.set({ operatorNote: "preserve-existing-field" });

    function freshReport() {
        return {
            counts: {
                users: { imported: 0 },
                reviews: { imported: 0 },
                links: { imported: 0 },
                images: { imported: 0 }
            },
            exceptions: []
        };
    }

    const runOptions = {
        plan,
        db,
        admin,
        imagesDirectory: undefined,
        enviarImagem: async () => assert.fail("fixture must not upload images")
    };
    const firstReport = freshReport();
    await applyPlan({ ...runOptions, report: firstReport });

    const firstProfile = await db.collection("usuarios").doc(uid).get();
    const firstReview = await reviewReference.get();
    const firstLinks = await db.collection("avaliacoes_usuario")
        .where("origemId", "==", `sqlite:avaliacoes_usuario:${legacyLinkId}`)
        .get();
    assert.equal(firstReport.counts.users.imported, 1);
    assert.equal(firstReport.counts.reviews.imported, 1);
    assert.equal(firstReport.counts.links.imported, 1);
    assert.equal(firstReport.counts.images.imported, 0);
    assert.equal(firstReview.data().operatorNote, "preserve-existing-field");

    const firstProfileData = firstProfile.data();
    const firstReviewData = firstReview.data();
    const firstLinkData = firstLinks.docs.map((document) => document.data());
    const secondReport = freshReport();
    await applyPlan({ ...runOptions, report: secondReport });

    const secondProfile = await db.collection("usuarios").doc(uid).get();
    const secondReview = await reviewReference.get();
    const secondLinks = await db.collection("avaliacoes_usuario")
        .where("origemId", "==", `sqlite:avaliacoes_usuario:${legacyLinkId}`)
        .get();
    const unmappedProfile = await db.collection("usuarios").doc(unmappedUserId).get();

    assert.equal(secondReport.counts.users.imported, 1);
    assert.equal(secondReport.counts.reviews.imported, 1);
    assert.equal(secondReport.counts.links.imported, 1);
    assert.equal(secondReport.counts.images.imported, 0);
    assert.equal(firstLinks.size, 1);
    assert.equal(secondLinks.size, 1);
    assert.equal(unmappedProfile.exists, false);
    assert.deepEqual(secondProfile.data(), firstProfileData);
    assert.equal(secondReview.data().operatorNote, "preserve-existing-field");
    assert.deepEqual(secondReview.data(), firstReviewData);
    assert.deepEqual(secondLinks.docs.map((document) => document.data()), firstLinkData);
});
