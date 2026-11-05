const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
    REQUIRED_GATES,
    parseApprovalArguments,
    assertRealImportEnvironment,
    verifySignedManifest,
    validateApprovalManifest,
    validatePreviewReport,
    assertPlanMatchesPreview
} = require("../../services/migrationApproval");
const {
    assertSourceCopy,
    assertReportPath,
    assertDestinationOwnership,
    validateImageConfiguration
} = require("../../scripts/importarSQLiteParaFirestoreReal");
const {
    buildImageManifest,
    setMigrationDocument
} = require("../../scripts/migrarSQLiteParaFirestore");

const now = new Date("2026-11-05T16:00:00.000Z");
const sourceChecksum = "a".repeat(64);
const previewChecksum = "b".repeat(64);

function createManifest(overrides = {}) {
    return {
        version: 1,
        approvalId: "MIGRATION-2026-001",
        approvedBy: "Maintainer Helena",
        approvedAt: "2026-11-05T15:00:00.000Z",
        expiresAt: "2026-11-06T15:00:00.000Z",
        source: {
            snapshotId: "approved-copy-001",
            approvalReference: "SOURCE-APPROVAL-001",
            sha256: sourceChecksum
        },
        destination: {
            projectId: "lac-star-staging",
            environment: "staging"
        },
        previewReportSha256: previewChecksum,
        gates: Object.fromEntries(REQUIRED_GATES.map((gate) => [gate, true])),
        ...overrides
    };
}

function createPreviewReport(overrides = {}) {
    return {
        runId: "2026-11-05T14:00:00.000Z",
        mode: "dry-run",
        targetProject: "lac-star-staging",
        sourceChecksum,
        sourceIntact: true,
        imageManifestSha256: "c".repeat(64),
        imageManifest: [],
        mappings: { users: [], reviews: [], links: [] },
        normalizations: {},
        counts: Object.fromEntries(
            ["users", "reviews", "links", "images"].map((entity) => [
                entity,
                { source: 0, planned: 0, imported: 0 }
            ])
        ),
        exceptions: [],
        ...overrides
    };
}

function safeEnvironment(overrides = {}) {
    return {
        MIGRATION_REAL_IMPORT_ENABLED: "true",
        MIGRATION_EXPECTED_TARGET_PROJECT: "lac-star-staging",
        MIGRATION_APPROVAL_PUBLIC_KEY: "test-public-key",
        MIGRATION_TARGET_ENVIRONMENT: "staging",
        GCLOUD_PROJECT: "lac-star-staging",
        ...overrides
    };
}

test("requires every real-import argument and rejects duplicate or unknown flags", () => {
    const args = [
        "--source-copy", "/tmp/source.sqlite",
        "--source-snapshot-id", "approved-copy-001",
        "--source-approval-reference", "SOURCE-1",
        "--target-project", "lac-star-staging",
        "--images-directory", "/tmp/uploads",
        "--approval-manifest", "/tmp/approval.json",
        "--approval-signature", "/tmp/approval.sig",
        "--approval-id", "MIGRATION-2026-001",
        "--preview-report", "/tmp/preview.json",
        "--report", "/tmp/final.json",
        "--confirm-real-import", "MIGRATION-2026-001"
    ];

    assert.equal(parseApprovalArguments(args)["approval-id"], "MIGRATION-2026-001");
    assert.throws(() => parseApprovalArguments(args.slice(0, -2)), /Missing required argument/);
    assert.throws(
        () => parseApprovalArguments([...args, "--target-project", "other-project"]),
        /Duplicate argument/
    );
    assert.throws(() => parseApprovalArguments([...args, "--force", "yes"]), /Unsupported argument/);
});

test("real-import environment is explicitly enabled, pinned and never uses an emulator", () => {
    assert.doesNotThrow(() =>
        assertRealImportEnvironment("lac-star-staging", safeEnvironment())
    );
    for (const overrides of [
        { MIGRATION_REAL_IMPORT_ENABLED: "false" },
        { MIGRATION_EXPECTED_TARGET_PROJECT: "other-project" },
        { GCLOUD_PROJECT: "other-project" },
        { FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099" },
        { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
        { MIGRATION_TARGET_ENVIRONMENT: "development" }
    ]) {
        assert.throws(
            () => assertRealImportEnvironment("lac-star-staging", safeEnvironment(overrides))
        );
    }
    assert.throws(
        () => assertRealImportEnvironment("demo-lac-star", safeEnvironment()),
        /non-demo project/
    );
});

test("verifies the signed manifest bytes and rejects tampering", () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
    const bytes = Buffer.from(JSON.stringify(createManifest()));
    const signature = crypto.sign(null, bytes, privateKey).toString("base64");

    assert.deepEqual(verifySignedManifest(bytes, signature, publicKey), createManifest());
    assert.throws(
        () => verifySignedManifest(Buffer.from(`${bytes.toString()} `), signature, publicKey),
        /signature is invalid/
    );
    assert.throws(
        () => verifySignedManifest(bytes, "not-a-signature", publicKey),
        /base64 encoded/
    );
});

test("requires an identified, current approval for the exact source, preview and destination", () => {
    assert.doesNotThrow(() => validateApprovalManifest(createManifest(), {
        targetProject: "lac-star-staging",
        targetEnvironment: "staging",
        sourceSnapshotId: "approved-copy-001",
        sourceApprovalReference: "SOURCE-APPROVAL-001",
        sourceChecksum,
        previewChecksum,
        confirmation: "MIGRATION-2026-001",
        now
    }));

    const cases = [
        [createManifest({ gates: { ...createManifest().gates, requiredTestsPassed: false } }), /requiredTestsPassed/],
        [createManifest({ approvedBy: "" }), /identify the approving person/],
        [createManifest({ expiresAt: "2026-11-05T15:59:59.000Z" }), /expired/],
        [createManifest({ previewReportSha256: "c".repeat(64) }), /exact reviewed preview report/],
        [createManifest({ source: { ...createManifest().source, sha256: "c".repeat(64) } }), /source identity/],
        [createManifest({ source: { ...createManifest().source, snapshotId: "other-copy" } }), /source identity/],
        [createManifest({ destination: { projectId: "other-project", environment: "staging" } }), /destination/],
        [createManifest({ destination: { projectId: "lac-star-staging", environment: "production" } }), /destination/]
    ];
    for (const [manifest, error] of cases) {
        assert.throws(() => validateApprovalManifest(manifest, {
            targetProject: "lac-star-staging",
            targetEnvironment: "staging",
            sourceSnapshotId: "approved-copy-001",
            sourceApprovalReference: "SOURCE-APPROVAL-001",
            sourceChecksum,
            previewChecksum,
            confirmation: "MIGRATION-2026-001",
            now
        }), error);
    }
});

test("accepts only a complete dry-run report and compares it with the current plan", () => {
    const report = createPreviewReport();
    assert.equal(validatePreviewReport(report, {
        targetProject: "lac-star-staging",
        sourceChecksum
    }), report);

    const plan = {
        sourceCounts: { users: 0, reviews: 0, links: 0, images: 0 },
        profiles: [],
        reviews: [],
        links: [],
        imageReviews: [],
        normalizations: {},
        exceptions: []
    };
    assert.doesNotThrow(() => assertPlanMatchesPreview(report, plan));
    assert.throws(() => assertPlanMatchesPreview(
        { ...report, counts: { ...report.counts, reviews: { source: 1, planned: 0, imported: 0 } } },
        plan
    ), /reviews plan differs/);
    assert.throws(() => assertPlanMatchesPreview(
        { ...report, exceptions: [{ entity: "review", sourceId: "10", reason: "unreviewed" }] },
        plan
    ), /exceptions differ/);
    assert.throws(() => assertPlanMatchesPreview(
        { ...report, mappings: { users: [{ sourceId: "1", uid: "different-uid" }], reviews: [], links: [] } },
        plan
    ), /mappings differ/);
    assert.throws(() => validatePreviewReport(
        { ...report, sourceIntact: false },
        { targetProject: "lac-star-staging", sourceChecksum }
    ), /incomplete/);
    assert.throws(() => validatePreviewReport(
        { ...report, mode: "real-apply" },
        { targetProject: "lac-star-staging", sourceChecksum }
    ), /incomplete/);
    assert.throws(() => validatePreviewReport(
        { ...report, imageManifestSha256: null },
        { targetProject: "lac-star-staging", sourceChecksum }
    ), /incomplete/);
    assert.throws(() => validatePreviewReport(
        {
            ...report,
            counts: { ...report.counts, users: { source: 0, planned: 0, imported: 1 } }
        },
        { targetProject: "lac-star-staging", sourceChecksum }
    ), /contains writes/);
});

test("validates source copy isolation and protects audit report inputs", (context) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "real-migration-guard-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const sourcePath = path.join(directory, "copy.sqlite");
    const reportPath = path.join(directory, "report.json");
    fs.writeFileSync(sourcePath, "synthetic copy");

    assert.equal(assertSourceCopy(sourcePath), fs.realpathSync(sourcePath));
    assert.equal(assertReportPath(reportPath, [sourcePath]), reportPath);
    assert.throws(() => assertReportPath(sourcePath, [sourcePath]), /already exists/);
    fs.writeFileSync(`${sourcePath}-wal`, "");
    assert.throws(() => assertSourceCopy(sourcePath), /WAL\/journal sidecars/);
});

test("hashes deterministic image inputs for preview approval", async (context) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "image-manifest-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const bytes = Buffer.from("synthetic image bytes");
    fs.writeFileSync(path.join(directory, "image.png"), bytes);
    const manifest = await buildImageManifest({
        imageReviews: [{
            id: "review-1",
            sourceId: "10",
            imagemOriginal: "uploads/image.png"
        }]
    }, directory);
    const expected = crypto.createHash("sha256").update(bytes).digest("hex");

    assert.equal(manifest.checksums["review-1"], expected);
    assert.equal(manifest.sha256, crypto.createHash("sha256")
        .update(JSON.stringify([{ sourceId: "10", sha256: expected }]))
        .digest("hex"));
    assert.deepEqual(manifest.records, [{ sourceId: "10", sha256: expected }]);
});

test("blocks conflicting destination documents and permits only matching migration origins", async () => {
    const stored = new Map([
        ["usuarios/uid-1", { origemId: "sqlite:usuarios:1" }],
        ["avaliacoes/review-1", { origemId: "unrelated" }]
    ]);
    const db = {
        collection(name) {
            return {
                doc(id) {
                    return {
                        async get() {
                            const data = stored.get(`${name}/${id}`);
                            return { exists: Boolean(data), data: () => data };
                        }
                    };
                }
            };
        }
    };
    const plan = {
        profiles: [{ uid: "uid-1", sourceId: "1" }],
        reviews: [{ id: "review-1", sourceId: "10" }],
        links: []
    };

    await assert.rejects(() => assertDestinationOwnership(plan, db), /Destination conflict/);
    stored.set("avaliacoes/review-1", { origemId: "sqlite:avaliacao:10" });
    await assert.doesNotReject(() => assertDestinationOwnership(plan, db));
});

test("strict Firestore writes reject races that introduce a foreign destination document", async () => {
    let stored = { origemId: "unrelated" };
    const reference = {
        async get() {
            return { exists: Boolean(stored), data: () => stored };
        },
        async set(data, options) {
            stored = options?.merge ? { ...stored, ...data } : data;
        }
    };
    const db = {
        runTransaction(operation) {
            return operation({
                get: (documentReference) => documentReference.get(),
                set: (documentReference, data, options) =>
                    documentReference.set(data, options)
            });
        }
    };

    await assert.rejects(
        () => setMigrationDocument(
            db,
            reference,
            { origemId: "sqlite:usuarios:1", nome: "Pessoa" },
            "sqlite:usuarios:1",
            true
        ),
        { code: "DESTINATION_SOURCE_CONFLICT" }
    );
    assert.deepEqual(stored, { origemId: "unrelated" });

    stored = { origemId: "sqlite:usuarios:1", nome: "Existing" };
    await setMigrationDocument(
        db,
        reference,
        { origemId: "sqlite:usuarios:1", nome: "Pessoa" },
        "sqlite:usuarios:1",
        true
    );
    assert.deepEqual(stored, { origemId: "sqlite:usuarios:1", nome: "Pessoa" });
});

test("requires an approved Cloudinary Free configuration before importing planned images", () => {
    assert.doesNotThrow(() => validateImageConfiguration({ imageReviews: [] }, {}));
    assert.throws(
        () => validateImageConfiguration({ imageReviews: [{}] }, {}),
        /Cloudinary Free credentials and quota approval/
    );
    assert.doesNotThrow(() => validateImageConfiguration(
        { imageReviews: [{}] },
        {
            CLOUDINARY_FREE_PLAN_APPROVED: "true",
            CLOUDINARY_CLOUD_NAME: "test-cloud",
            CLOUDINARY_API_KEY: "test-key",
            CLOUDINARY_API_SECRET: "test-secret"
        }
    ));
});
