const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildMigrationPlan, stableId } = require("../../services/migrationService");
const sqlite3 = require("sqlite3");
const {
    parseArgs,
    assertSafeEnvironment,
    resolveImagePath,
    excludeUnmigratableImages,
    createReport,
    applyPlan,
    openReadOnly,
    loadSource,
    hashFile
} = require("../../scripts/migrarSQLiteParaFirestore");

function createSource() {
    return {
        users: [
            { id: 1, nome: "Pessoa A", email: "A@example.test", aniversario: "" },
            { id: 2, nome: "Pessoa B", email: "b@example.test", aniversario: "" }
        ],
        reviews: [
            {
                id: 10,
                categoria: "Serie",
                nome: "Avaliação",
                descricao: "Descrição",
                feedback: "",
                principais_pontos: "",
                imagem: "uploads/review.png",
                lancamento: "2020-01-02",
                duracao: "01:30",
                estrelas: 4
            },
            {
                id: 20,
                categoria: "Filme",
                nome: "Ambígua",
                lancamento: "",
                duracao: "",
                estrelas: 3
            },
            {
                id: 30,
                categoria: "Jogo",
                nome: "Categoria não suportada",
                lancamento: "",
                duracao: "",
                estrelas: 3
            }
        ],
        links: [
            { id: 101, id_usuario: 1, id_avaliacao: 10, data_criacao: "2024-01-01 10:00:00" },
            { id: 102, id_usuario: 1, id_avaliacao: 10, data_criacao: "2024-01-02 10:00:00" },
            { id: 201, id_usuario: 1, id_avaliacao: 20, data_criacao: "2024-01-03 10:00:00" },
            { id: 202, id_usuario: 2, id_avaliacao: 20, data_criacao: "2024-01-04 10:00:00" },
            { id: 301, id_usuario: 1, id_avaliacao: 30, data_criacao: "2024-01-05 10:00:00" }
        ],
        authUsers: [
            { uid: "firebase-a", email: "a@example.test", emailVerified: true },
            { uid: "firebase-b", email: "b@example.test", emailVerified: false }
        ]
    };
}

test("plans only verified unique accounts and preserves every duplicate link", () => {
    const plan = buildMigrationPlan(createSource());

    assert.deepEqual(plan.profiles.map(({ uid }) => uid), ["firebase-a"]);
    assert.equal(plan.reviews.length, 1);
    assert.equal(plan.reviews[0].usuarioUid, "firebase-a");
    assert.equal(plan.reviews[0].categoria, "Série");
    assert.equal(plan.links.length, 2);
    assert.notEqual(plan.links[0].id, plan.links[1].id);
    assert.equal(plan.sourceCounts.images, 1);
    assert.equal(plan.normalizations.categorySerieToSérie, 1);
    assert.ok(plan.exceptions.some(({ sourceId, reason }) =>
        sourceId === "2" && reason === "VERIFIED_FIREBASE_ACCOUNT_NOT_FOUND"
    ));
    assert.ok(plan.exceptions.some(({ sourceId, reason }) =>
        sourceId === "20" && reason === "UNRESOLVED_REVIEW_OWNER"
    ));
    assert.ok(plan.exceptions.some(({ sourceId, reason }) =>
        sourceId === "30" && reason === "UNSUPPORTED_CATEGORY"
    ));
    assert.equal("senha" in plan.profiles[0], false);
    assert.equal(stableId("review", "10"), plan.reviews[0].id);
});

test("does not map duplicate legacy e-mails or accounts without verified e-mail", () => {
    const source = createSource();
    source.users.push({
        id: 3,
        nome: "Pessoa repetida",
        email: "a@example.test",
        aniversario: ""
    });

    const plan = buildMigrationPlan(source);

    assert.equal(plan.profiles.length, 0);
    assert.ok(plan.exceptions.some(({ sourceId, reason }) =>
        sourceId === "1" && reason === "LEGACY_EMAIL_AMBIGUOUS"
    ));
    assert.ok(plan.exceptions.some(({ sourceId, reason }) =>
        sourceId === "3" && reason === "LEGACY_EMAIL_AMBIGUOUS"
    ));
});

test("keeps reviews and links in the plan when their image file is unavailable", (context) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "migration-missing-image-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const source = createSource();
    source.reviews = [source.reviews[0]];
    source.links = source.links.filter(({ id_avaliacao }) => id_avaliacao === 10);
    const plan = buildMigrationPlan(source);

    excludeUnmigratableImages(plan, directory, false);

    assert.equal(plan.reviews.length, 1);
    assert.equal(plan.links.length, 2);
    assert.equal(plan.imageReviews.length, 0);
    assert.equal(plan.reviews[0].imagemOriginal, "");
    assert.ok(plan.exceptions.some(({ entity, sourceId, reason }) =>
        entity === "image" &&
        sourceId === "10" &&
        reason === "IMAGE_FILE_NOT_FOUND_OR_OUTSIDE_APPROVED_DIRECTORY"
    ));
    assert.equal(
        plan.exceptions.some(({ entity }) => entity === "review" || entity === "link"),
        false
    );
});

test("keeps review fields and links when media upload fails", async (context) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "migration-failed-upload-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    fs.writeFileSync(path.join(directory, "photo.png"), Buffer.from("source image"));
    const stored = new Map();
    const db = {
        collection(name) {
            return {
                doc(id) {
                    const key = `${name}/${id}`;
                    return {
                        async get() {
                            return {
                                exists: stored.has(key),
                                data: () => stored.get(key)
                            };
                        },
                        async set(data, options) {
                            stored.set(
                                key,
                                options?.merge
                                    ? { ...stored.get(key), ...data }
                                    : data
                            );
                        }
                    };
                }
            };
        }
    };
    const plan = {
        profiles: [{
            uid: "firebase-a",
            sourceId: "1",
            nome: "Pessoa A",
            email: "a@example.test",
            aniversario: ""
        }],
        reviews: [{
            id: "legacy-review-10",
            sourceId: "10",
            usuarioUid: "firebase-a",
            nome: "Review preservada",
            descricao: "Descrição preservada",
            feedback: "Feedback preservado",
            principais_pontos: "Pontos preservados",
            categoria: "Série",
            estrelas: 4,
            lancamento: "2020-01-02",
            duracao: "01:30",
            dataCriacao: new Date("2024-01-01T10:00:00.000Z"),
            imagemOriginal: "uploads/photo.png"
        }],
        links: [{
            id: "legacy-link-101",
            sourceId: "101",
            usuarioUid: "firebase-a",
            avaliacaoId: "legacy-review-10",
            dataCriacao: new Date("2024-01-01T10:00:00.000Z")
        }]
    };
    const report = {
        counts: {
            users: { imported: 0 },
            reviews: { imported: 0 },
            links: { imported: 0 },
            images: { imported: 0 }
        },
        exceptions: []
    };
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        await applyPlan({
            plan,
            report,
            db,
            admin: {
                firestore: {
                    FieldValue: { serverTimestamp: () => "server-time" },
                    Timestamp: { fromDate: (date) => date }
                }
            },
            imagesDirectory: directory,
            enviarImagem: async () => {
                const error = new Error("upload failed");
                error.code = "image-provider-failed";
                throw error;
            }
        });
    } finally {
        console.error = originalConsoleError;
    }

    const review = stored.get("avaliacoes/legacy-review-10");
    assert.equal(review.nome, "Review preservada");
    assert.equal(review.descricao, "Descrição preservada");
    assert.equal(review.feedback, "Feedback preservado");
    assert.equal(review.principais_pontos, "Pontos preservados");
    assert.equal(review.imagemUrl, null);
    assert.equal(review.imagemPublicId, null);
    assert.ok(stored.has("avaliacoes_usuario/legacy-link-101"));
    assert.equal(report.counts.reviews.imported, 1);
    assert.equal(report.counts.links.imported, 1);
    assert.ok(report.exceptions.some(({ entity, sourceId, reason }) =>
        entity === "image" && sourceId === "10" && reason === "image-provider-failed"
    ));
});

test("serializes missing and invalid creation dates, fallback dates, exceptions, and review counts", () => {
    for (const [label, originalDate] of [
        ["absent", undefined],
        ["empty", ""],
        ["invalid", "not-a-date"],
        ["impossible calendar date", "2024-02-31 10:00:00"]
    ]) {
        const source = createSource();
        source.reviews = [source.reviews[0]];
        source.links = source.links
            .filter(({ id_avaliacao }) => id_avaliacao === 10)
            .map((link) => ({ ...link, data_criacao: originalDate }));
        const fallbackDate = new Date("2025-11-05T12:00:00.000Z");
        const plan = buildMigrationPlan({ ...source, fallbackDate });
        const serializedReport = JSON.stringify(createReport(plan, {
            mode: "test-only",
            sourcePath: "/safe/copy.sqlite",
            sourceChecksum: "test-checksum",
            targetProject: "demo-lac-star",
            runDate: fallbackDate
        }));
        const report = JSON.parse(serializedReport);

        assert.equal(plan.reviews.length, 1, `${label} date must not discard the review`);
        assert.equal(plan.reviews[0].dataCriacao.toISOString(), fallbackDate.toISOString());
        assert.deepEqual(report.counts.reviews, { source: 1, planned: 1, imported: 0 });
        const exception = report.exceptions.find(({ entity, sourceId, reason }) =>
            entity === "review" &&
            sourceId === "10" &&
            reason === "CREATION_DATE_FALLBACK_USED"
        );
        assert.ok(exception);
        assert.equal(exception.fallbackDate, fallbackDate.toISOString());
        assert.deepEqual(
            exception.originalDates.map(({ value }) => value),
            [originalDate ?? null, originalDate ?? null]
        );
        const invalidDateExceptions = report.exceptions.filter(({ entity, reason, originalDate: recorded }) =>
            entity === "link" &&
            reason === "INVALID_CREATION_DATE" &&
            recorded === (originalDate ?? null)
        );
        assert.equal(invalidDateExceptions.length, 2, `${label} source dates should be in the report`);
        assert.equal(report.counts.links.source, 2);
        assert.equal(report.counts.links.planned, 0);
    }
});

test("rejects image paths outside the approved directory", (context) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "migration-images-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    fs.writeFileSync(path.join(directory, "photo.png"), Buffer.from("image"));

    assert.equal(
        resolveImagePath("uploads/photo.png", directory),
        path.join(directory, "photo.png")
    );
    assert.equal(resolveImagePath("uploads/../../outside.png", directory), null);
});

test("requires explicit source approval, mode and isolated destination arguments", () => {
    assert.throws(
        () => parseArgs(["--source-copy", "/tmp/source.db", "--mode", "dry-run"]),
        /Missing required argument --source-approval-reference/
    );
    assert.deepEqual(
        parseArgs([
            "--source-copy", "/tmp/source.db",
            "--source-approval-reference", "approval-1",
            "--mode", "dry-run",
            "--target-project", "demo-lac-star",
            "--report", "/tmp/report.json"
        ]),
        {
            "source-copy": "/tmp/source.db",
            "source-approval-reference": "approval-1",
            mode: "dry-run",
            "target-project": "demo-lac-star",
            report: "/tmp/report.json"
        }
    );
});

test("migration CLI accepts only local Firebase emulator hosts", (context) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "migration-emulator-hosts-"));
    const sourcePath = path.join(directory, "copy.sqlite");
    fs.writeFileSync(sourcePath, "");
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

    const environmentKeys = [
        "NODE_ENV",
        "GCLOUD_PROJECT",
        "GOOGLE_CLOUD_PROJECT",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_AUTH_EMULATOR_HOST",
        "FIRESTORE_EMULATOR_HOST"
    ];
    const previousEnvironment = Object.fromEntries(
        environmentKeys.map((key) => [key, process.env[key]])
    );
    Object.assign(process.env, {
        GCLOUD_PROJECT: "demo-lac-star",
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
        FIRESTORE_EMULATOR_HOST: "localhost:8080"
    });
    delete process.env.NODE_ENV;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.FIREBASE_PROJECT_ID;
    context.after(() => {
        for (const key of environmentKeys) {
            if (previousEnvironment[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = previousEnvironment[key];
            }
        }
    });

    const options = {
        "source-copy": sourcePath,
        "target-project": "demo-lac-star",
        mode: "dry-run"
    };

    assert.doesNotThrow(() => assertSafeEnvironment(options));
    for (const [name, remoteHost] of [
        ["FIREBASE_AUTH_EMULATOR_HOST", "auth.example.test:9099"],
        ["FIRESTORE_EMULATOR_HOST", "firestore.googleapis.com:443"]
    ]) {
        const previousHost = process.env[name];
        process.env[name] = remoteHost;
        assert.throws(
            () => assertSafeEnvironment(options),
            new RegExp(`${name} must point to a local emulator`)
        );
        process.env[name] = previousHost;
    }

    process.env.FIREBASE_AUTH_EMULATOR_HOST = "[::1]:9099";
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    assert.doesNotThrow(() => assertSafeEnvironment(options));
});

test("reads only selected legacy fields and never writes to the approved SQLite copy", async (context) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "migration-source-"));
    const sourcePath = path.join(directory, "copy.sqlite");
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const writable = new sqlite3.Database(sourcePath);
    await new Promise((resolve, reject) => {
        writable.exec(`
            CREATE TABLE usuarios (id INTEGER, nome TEXT, email TEXT, senha TEXT, aniversario TEXT);
            CREATE TABLE avaliacao (id INTEGER, categoria TEXT, nome TEXT, descricao TEXT, feedback TEXT, principais_pontos TEXT, imagem TEXT, lancamento TEXT, duracao TEXT, estrelas TEXT);
            CREATE TABLE avaliacoes_usuario (id INTEGER, id_usuario INTEGER, id_avaliacao INTEGER, data_criacao TEXT);
            INSERT INTO usuarios VALUES (1, 'Pessoa', 'pessoa@example.test', 'never-read', '');
        `, (error) => error ? reject(error) : resolve());
    });
    await new Promise((resolve, reject) =>
        writable.close((error) => error ? reject(error) : resolve())
    );

    const before = await hashFile(sourcePath);
    const readOnly = await openReadOnly(sourcePath);
    try {
        const source = await loadSource(readOnly);
        assert.deepEqual(source.users, [{
            id: 1,
            nome: "Pessoa",
            email: "pessoa@example.test",
            aniversario: ""
        }]);
        assert.equal("senha" in source.users[0], false);
        const writeError = await new Promise((resolve) => {
            readOnly.run(
                "INSERT INTO usuarios (id, nome) VALUES (2, 'No write')",
                (error) => resolve(error)
            );
        });
        assert.equal(writeError.code, "SQLITE_READONLY");
    } finally {
        await new Promise((resolve, reject) =>
            readOnly.close((error) => error ? reject(error) : resolve())
        );
    }
    assert.equal(await hashFile(sourcePath), before);
});

test("creates a migration report with aggregate counts and no account e-mails", () => {
    const plan = buildMigrationPlan(createSource());
    const report = createReport(plan, {
        mode: "dry-run",
        sourcePath: "/safe/copy.sqlite",
        sourceChecksum: "checksum",
        targetProject: "demo-lac-star",
        approvalReference: null
    });
    const serialized = JSON.stringify(report);

    assert.deepEqual(report.counts.users, { source: 2, planned: 1, imported: 0 });
    assert.deepEqual(report.counts.reviews, { source: 3, planned: 1, imported: 0 });
    assert.deepEqual(report.counts.links, { source: 5, planned: 2, imported: 0 });
    assert.deepEqual(report.counts.images, { source: 1, planned: 1, imported: 0 });
    assert.equal(serialized.includes("a@example.test"), false);
    assert.equal(serialized.includes("senha"), false);
});
