const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const {
    assertIsolatedEmulatorEnvironment,
    emulatorConfigured
} = require("../helpers/firebaseEmulator");

const rotasSQLiteLegadas = [
    ["POST", "/usuario", {}],
    ["GET", "/usuario/123"],
    ["POST", "/login", {}],
    ["POST", "/avaliacoes_usuario", {}],
    ["GET", "/avaliacoes_usuarios/123"]
];

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

async function createTestIdentity(email, password) {
    return authEmulatorRequest("signUp", { email, password, returnSecureToken: true });
}

async function createAdminIdentity(auth, email, password) {
    const identity = await createTestIdentity(email, password);
    await auth.setCustomUserClaims(identity.localId, { admin: true });
    const customToken = await auth.createCustomToken(identity.localId);
    const session = await authEmulatorRequest("signInWithCustomToken", {
        token: customToken,
        returnSecureToken: true
    });
    return { ...identity, idToken: session.idToken };
}

function jsonRequest(method, body, token) {
    const headers = { "content-type": "application/json" };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    };
}

function expiredToken(token) {
    const [header, encodedClaims, signature] = token.split(".");
    const claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8"));
    claims.exp = Math.floor(Date.now() / 1000) - 60;
    return [
        header,
        Buffer.from(JSON.stringify(claims)).toString("base64url"),
        signature
    ].join(".");
}

test("serves real Firebase and legacy routes over HTTP against isolated emulators", {
    skip: !emulatorConfigured()
}, async (context) => {
    assertIsolatedEmulatorEnvironment();

    const { admin, db } = require("../../firebase");
    const authenticateUser = require("../../autenticarUsuario");
    const { createApp } = require("../../app");
    const suffix = randomUUID();
    const password = "test-password-9876";
    const identities = [];
    let server;
    let authorUid;

    context.after(async () => {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }

        const links = authorUid
            ? await db.collection("avaliacoes_usuario")
                .where("usuarioUid", "==", authorUid)
                .get()
            : { docs: [] };
        const reviews = authorUid
            ? await db.collection("avaliacoes")
                .where("usuarioUid", "==", authorUid)
                .get()
            : { docs: [] };
        const cleanup = db.batch();
        for (const link of links.docs) {
            cleanup.delete(link.ref);
        }
        for (const review of reviews.docs) {
            cleanup.delete(review.ref);
        }
        if (authorUid) {
            cleanup.delete(db.collection("usuarios").doc(authorUid));
        }
        await cleanup.commit();
        await Promise.all(identities.map((uid) => admin.auth().deleteUser(uid)));
    });

    const author = await createTestIdentity(`author-${suffix}@example.test`, password);
    identities.push(author.localId);
    authorUid = author.localId;
    const other = await createTestIdentity(`other-${suffix}@example.test`, password);
    identities.push(other.localId);
    const administrator = await createAdminIdentity(
        admin.auth(),
        `admin-${suffix}@example.test`,
        password
    );
    identities.push(administrator.localId);

    const app = createApp({
        firestore: db,
        admin,
        authenticateUser,
        corsOrigins: "http://localhost:3000"
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const profileBeforeInvalidRequests = await db
        .collection("usuarios")
        .doc(author.localId)
        .get();
    const reviewsBeforeInvalidRequests = await db.collection("avaliacoes")
        .where("usuarioUid", "==", author.localId)
        .get();
    const linksBeforeInvalidRequests = await db.collection("avaliacoes_usuario")
        .where("usuarioUid", "==", author.localId)
        .get();
    let response;
    const invalidTokens = [
        "not-a-valid-firebase-id-token",
        expiredToken(author.idToken)
    ];
    for (const token of invalidTokens) {
        response = await fetch(`${baseUrl}/usuario/firebase`, jsonRequest(
            "GET",
            undefined,
            token
        ));
        assert.equal(response.status, 401);

        response = await fetch(`${baseUrl}/avaliacoes_usuario`, jsonRequest(
            "GET",
            undefined,
            token
        ));
        assert.equal(response.status, 401);

        response = await fetch(`${baseUrl}/admin/usuarios`, jsonRequest(
            "GET",
            undefined,
            token
        ));
        assert.equal(response.status, 401);

        response = await fetch(`${baseUrl}/usuario/firebase`, jsonRequest(
            "POST",
            { nome: "Não deve ser salvo", aniversario: "" },
            token
        ));
        assert.equal(response.status, 401);

        response = await fetch(`${baseUrl}/avaliacao`, jsonRequest(
            "POST",
            {
                categoria: "Filme",
                nome: `Invalid token ${suffix}`,
                descricao: "Não deve ser salvo",
                estrelas: 4
            },
            token
        ));
        assert.equal(response.status, 401);
    }

    const profileAfterInvalidRequests = await db
        .collection("usuarios")
        .doc(author.localId)
        .get();
    const reviewsAfterInvalidRequests = await db.collection("avaliacoes")
        .where("usuarioUid", "==", author.localId)
        .get();
    const linksAfterInvalidRequests = await db.collection("avaliacoes_usuario")
        .where("usuarioUid", "==", author.localId)
        .get();
    assert.equal(profileAfterInvalidRequests.exists, profileBeforeInvalidRequests.exists);
    assert.equal(reviewsAfterInvalidRequests.size, reviewsBeforeInvalidRequests.size);
    assert.equal(linksAfterInvalidRequests.size, linksBeforeInvalidRequests.size);

    for (const [method, route, body] of rotasSQLiteLegadas) {
        const response = await fetch(`${baseUrl}${route}`, jsonRequest(method, body));
        assert.equal(response.status, 410, `${method} ${route} should be Gone`);
    }

    response = await fetch(`${baseUrl}/usuario/firebase`);
    assert.equal(response.status, 401);

    response = await fetch(`${baseUrl}/usuarios/firebase`);
    assert.equal(response.status, 401);

    response = await fetch(`${baseUrl}/usuario/firebase`, jsonRequest("GET", undefined, author.idToken));
    assert.equal(response.status, 404);

    response = await fetch(`${baseUrl}/usuario/firebase`, jsonRequest(
        "POST",
        { nome: "Pessoa de teste", aniversario: "2000-01-02", uid: other.localId },
        author.idToken
    ));
    assert.equal(response.status, 201);
    const createdProfile = await response.json();
    assert.equal(createdProfile.uid, author.localId);
    authorUid = createdProfile.uid;

    response = await fetch(`${baseUrl}/usuario/firebase`, jsonRequest("GET", undefined, author.idToken));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        uid: author.localId,
        nome: "Pessoa de teste",
        email: `author-${suffix}@example.test`,
        aniversario: "2000-01-02"
    });

    response = await fetch(`${baseUrl}/usuarios/firebase`, jsonRequest("GET", undefined, author.idToken));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).uid, author.localId);

    response = await fetch(`${baseUrl}/usuario/firebase`, jsonRequest("GET", undefined, other.idToken));
    assert.equal(response.status, 404);

    response = await fetch(`${baseUrl}/avaliacao`);
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(await response.json()));

    response = await fetch(`${baseUrl}/avaliacao`, jsonRequest("POST", {
        categoria: "Filme",
        nome: `Review ${suffix}`,
        descricao: "Descrição de teste",
        usuarioUid: other.localId,
        estrelas: 4
    }));
    assert.equal(response.status, 401);

    response = await fetch(`${baseUrl}/avaliacao`, jsonRequest("POST", {
        categoria: "Filme",
        nome: `Review ${suffix}`,
        descricao: "Descrição de teste",
        usuarioUid: other.localId,
        estrelas: 4
    }, author.idToken));
    assert.equal(response.status, 201);
    const createdReview = await response.json();
    assert.ok(createdReview.id);
    assert.equal(createdReview.imagemUrl, null);

    response = await fetch(`${baseUrl}/avaliacoes_usuario`);
    assert.equal(response.status, 401);
    response = await fetch(`${baseUrl}/avaliacoes_usuario`, jsonRequest(
        "GET",
        undefined,
        author.idToken
    ));
    assert.equal(response.status, 200);
    const personalReviews = await response.json();
    assert.ok(personalReviews.some((review) =>
        review.id === createdReview.id && review.usuarioUid === author.localId
    ));
    response = await fetch(`${baseUrl}/avaliacoes_usuario`, jsonRequest(
        "GET",
        undefined,
        other.idToken
    ));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).some((review) => review.id === createdReview.id), false);

    response = await fetch(`${baseUrl}/avaliacao`);
    const publicReviews = await response.json();
    assert.ok(publicReviews.some((review) =>
        review.id === createdReview.id && review.usuarioUid === author.localId
    ));

    response = await fetch(`${baseUrl}/admin/avaliacoes`);
    assert.equal(response.status, 401);
    response = await fetch(`${baseUrl}/admin/avaliacoes?admin=true`, jsonRequest(
        "GET",
        undefined,
        author.idToken
    ));
    assert.equal(response.status, 403);
    response = await fetch(`${baseUrl}/admin/usuarios`, {
        ...jsonRequest("GET", undefined, author.idToken),
        headers: {
            ...jsonRequest("GET", undefined, author.idToken).headers,
            "x-admin": "true"
        }
    });
    assert.equal(response.status, 403);

    response = await fetch(`${baseUrl}/admin/avaliacoes`, jsonRequest(
        "GET",
        undefined,
        administrator.idToken
    ));
    assert.equal(response.status, 200);
    const adminReviews = await response.json();
    assert.ok(adminReviews.some((review) =>
        review.id === createdReview.id && review.nome_usuario === "Pessoa de teste"
    ));

    response = await fetch(`${baseUrl}/admin/usuarios`, jsonRequest(
        "GET",
        undefined,
        administrator.idToken
    ));
    assert.equal(response.status, 200);
    const adminProfiles = await response.json();
    const profile = adminProfiles.find((item) => item.uid === author.localId);
    assert.ok(profile);
    assert.equal(profile.nome, "Pessoa de teste");
    assert.equal("senha" in profile, false);
});
