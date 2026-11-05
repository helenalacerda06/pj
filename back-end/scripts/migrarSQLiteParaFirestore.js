const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const sqlite3 = require("sqlite3");
const { buildMigrationPlan } = require("../services/migrationService");

const DATABASE_ORIGINAL = path.resolve(__dirname, "../../teste_helena.db");

function parseArgs(args) {
    const values = {};
    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        if (!argument.startsWith("--") || !args[index + 1] || args[index + 1].startsWith("--")) {
            throw new Error(`Invalid argument: ${argument}`);
        }
        values[argument.slice(2)] = args[index + 1];
        index += 1;
    }

    const required = [
        "source-copy",
        "source-approval-reference",
        "mode",
        "target-project",
        "report"
    ];
    for (const key of required) {
        if (!values[key]) {
            throw new Error(`Missing required argument --${key}.`);
        }
    }
    if (!["dry-run", "apply"].includes(values.mode)) {
        throw new Error("--mode must be dry-run or apply.");
    }
    return values;
}

function assertSafeEnvironment(options) {
    const sourcePath = fs.realpathSync(options["source-copy"]);
    const originalPath = fs.existsSync(DATABASE_ORIGINAL)
        ? fs.realpathSync(DATABASE_ORIGINAL)
        : DATABASE_ORIGINAL;
    if (sourcePath === originalPath) {
        throw new Error("The live SQLite database cannot be used; provide an approved isolated copy.");
    }
    if (fs.existsSync(`${sourcePath}-wal`) || fs.existsSync(`${sourcePath}-journal`)) {
        throw new Error("SQLite source copies must be closed and have no WAL/journal sidecars.");
    }
    if (
        !options["target-project"].startsWith("demo-") ||
        process.env.NODE_ENV === "production" ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST === undefined ||
        process.env.FIRESTORE_EMULATOR_HOST === undefined
    ) {
        throw new Error("Migration is restricted to a demo-* project with both Firebase emulators.");
    }
    for (const [name, value] of [
        ["FIREBASE_AUTH_EMULATOR_HOST", process.env.FIREBASE_AUTH_EMULATOR_HOST],
        ["FIRESTORE_EMULATOR_HOST", process.env.FIRESTORE_EMULATOR_HOST]
    ]) {
        let hostname;
        try {
            hostname = new URL(`http://${value}`).hostname.replace(/^\[|\]$/g, "");
        } catch {
            throw new Error(`${name} must point to a local emulator.`);
        }
        if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
            throw new Error(`${name} must point to a local emulator.`);
        }
    }
    const configuredProject = process.env.GCLOUD_PROJECT
        || process.env.GOOGLE_CLOUD_PROJECT
        || process.env.FIREBASE_PROJECT_ID;
    if (configuredProject !== options["target-project"]) {
        throw new Error("The configured Firebase project must match --target-project.");
    }
    if (options.mode === "apply") {
        if (process.env.MIGRATION_APPLY_APPROVED !== "true" || !options["approval-reference"]) {
            throw new Error("Apply requires MIGRATION_APPLY_APPROVED=true and --approval-reference.");
        }
    }
    return sourcePath;
}

function hashFile(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const input = fs.createReadStream(filePath);
        input.on("error", reject);
        input.on("data", (chunk) => hash.update(chunk));
        input.on("end", () => resolve(hash.digest("hex")));
    });
}

async function buildImageManifest(plan, imagesDirectory) {
    const records = [];
    const checksums = {};
    for (const review of plan.imageReviews) {
        const imagePath = resolveImagePath(review.imagemOriginal, imagesDirectory);
        if (!imagePath) {
            throw new Error(`Approved image source is no longer available for review ${review.sourceId}.`);
        }
        const checksum = await hashFile(imagePath);
        records.push({ sourceId: review.sourceId, sha256: checksum });
        checksums[review.id] = checksum;
    }
    return {
        sha256: crypto.createHash("sha256").update(JSON.stringify(records)).digest("hex"),
        records,
        checksums
    };
}

function query(database, sql) {
    return new Promise((resolve, reject) => {
        database.all(sql, (error, rows) => (error ? reject(error) : resolve(rows)));
    });
}

function openReadOnly(sourcePath) {
    return new Promise((resolve, reject) => {
        const database = new sqlite3.Database(sourcePath, sqlite3.OPEN_READONLY, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(database);
        });
    });
}

async function loadSource(database) {
    const integrity = await query(database, "PRAGMA integrity_check");
    if (integrity.length !== 1 || integrity[0].integrity_check !== "ok") {
        throw new Error("The approved SQLite copy failed its integrity check.");
    }
    const users = await query(
        database,
        "SELECT id, nome, email, aniversario FROM usuarios ORDER BY id"
    );
    const reviews = await query(
        database,
        "SELECT id, categoria, nome, descricao, feedback, principais_pontos, imagem, lancamento, duracao, estrelas FROM avaliacao ORDER BY id"
    );
    const links = await query(
        database,
        "SELECT rowid, id, id_usuario, id_avaliacao, data_criacao FROM avaliacoes_usuario ORDER BY rowid"
    );
    return { users, reviews, links };
}

async function listFirebaseUsers(auth) {
    const users = [];
    let pageToken;
    do {
        const page = await auth.listUsers(1000, pageToken);
        users.push(...page.users.map(({ uid, email, emailVerified }) => ({
            uid,
            email,
            emailVerified
        })));
        pageToken = page.pageToken;
    } while (pageToken);
    return users;
}

function resolveImagePath(imageReference, imagesDirectory) {
    if (!imageReference || !imagesDirectory || /^https?:\/\//i.test(imageReference)) {
        return null;
    }
    const relativePath = imageReference.replace(/^\/?uploads\//, "");
    if (path.isAbsolute(relativePath)) {
        return null;
    }
    let root;
    try {
        root = fs.realpathSync(imagesDirectory);
    } catch {
        return null;
    }
    const candidate = path.resolve(root, relativePath);
    if (
        candidate === root ||
        !candidate.startsWith(`${root}${path.sep}`) ||
        !fs.existsSync(candidate)
    ) {
        return null;
    }
    try {
        const resolved = fs.realpathSync(candidate);
        return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
    } catch {
        return null;
    }
}

function excludeUnmigratableImages(plan, imagesDirectory, applyMode) {
    const unavailableImageReasons = new Map();
    const { LIMITE_IMAGEM_BYTES, detectarTipoImagem } = require("../services/imagemService");
    for (const review of plan.imageReviews) {
        let reason = null;
        const imagePath = resolveImagePath(review.imagemOriginal, imagesDirectory);
        if (!imagePath) {
            reason = "IMAGE_FILE_NOT_FOUND_OR_OUTSIDE_APPROVED_DIRECTORY";
        } else {
            try {
                if (fs.statSync(imagePath).size > LIMITE_IMAGEM_BYTES) {
                    reason = "IMAGE_EXCEEDS_10_MB";
                } else if (!detectarTipoImagem(fs.readFileSync(imagePath))) {
                    reason = "IMAGE_TYPE_INVALID";
                }
            } catch {
                reason = "IMAGE_FILE_UNREADABLE";
            }
        }
        if (!reason && (
            applyMode &&
            process.env.CLOUDINARY_FREE_PLAN_APPROVED !== "true"
        )) {
            reason = "CLOUDINARY_FREE_NOT_APPROVED";
        }
        if (reason) {
            unavailableImageReasons.set(review.id, reason);
            plan.exceptions.push({ entity: "image", sourceId: review.sourceId, reason });
        }
    }

    for (const review of plan.reviews) {
        if (unavailableImageReasons.has(review.id)) {
            review.imagemOriginal = "";
        }
    }
    plan.imageReviews = plan.imageReviews.filter(
        (review) => !unavailableImageReasons.has(review.id)
    );
}

function createReport(plan, {
    mode,
    sourcePath,
    sourceChecksum,
    targetProject,
    approvalReference,
    runDate = new Date()
}) {
    return {
        runId: runDate.toISOString(),
        mode,
        source: path.basename(sourcePath),
        sourceChecksum,
        targetProject,
        approvalReference: approvalReference || null,
        sourceApprovalReference: null,
        sourceIntact: null,
        normalizations: plan.normalizations,
        counts: {
            users: { source: plan.sourceCounts.users, planned: plan.profiles.length, imported: 0 },
            reviews: { source: plan.sourceCounts.reviews, planned: plan.reviews.length, imported: 0 },
            links: { source: plan.sourceCounts.links, planned: plan.links.length, imported: 0 },
            images: { source: plan.sourceCounts.images, planned: plan.imageReviews.length, imported: 0 }
        },
        exceptions: [...plan.exceptions],
        imageManifestSha256: null,
        imageManifest: [],
        mappings: {
            users: plan.profiles.map(({ sourceId, uid }) => ({ sourceId, uid })),
            reviews: plan.reviews.map(({ sourceId, id, usuarioUid }) => ({
                sourceId,
                documentId: id,
                usuarioUid
            })),
            links: plan.links.map(({ sourceId, id, usuarioUid, avaliacaoId }) => ({
                sourceId,
                documentId: id,
                usuarioUid,
                avaliacaoId
            }))
        }
    };
}

async function setMigrationDocument(db, reference, data, originId, strictOriginIds) {
    if (!strictOriginIds) {
        await reference.set(data, { merge: true });
        return;
    }

    await db.runTransaction(async (transaction) => {
        const existing = await transaction.get(reference);
        if (existing.exists && existing.data()?.origemId !== originId) {
            const error = new Error("Destination document is not owned by this migration source.");
            error.code = "DESTINATION_SOURCE_CONFLICT";
            throw error;
        }
        transaction.set(reference, data, { merge: true });
    });
}

async function applyPlan({
    plan,
    report,
    db,
    admin,
    imagesDirectory,
    enviarImagem,
    excluirImagem,
    expectedImageChecksums,
    strictOriginIds = false
}) {
    const imageService = require("../services/imagemService");
    const uploadImage = enviarImagem || imageService.enviarImagem;
    const deleteImage = excluirImagem || imageService.excluirImagem;
    const importedProfileUids = new Set();
    for (const profile of plan.profiles) {
        try {
            const reference = db.collection("usuarios").doc(profile.uid);
            const existing = await reference.get();
            const { sourceId, ...profileData } = profile;
            profileData.origemId = `sqlite:usuarios:${sourceId}`;
            if (!existing.exists || !existing.data()?.criadoEm) {
                profileData.criadoEm = admin.firestore.FieldValue.serverTimestamp();
            }
            await setMigrationDocument(
                db,
                reference,
                profileData,
                profileData.origemId,
                strictOriginIds
            );
            importedProfileUids.add(profile.uid);
            report.counts.users.imported += 1;
        } catch (error) {
            console.error("Could not import a profile:", error.code || "firestore-write-failed");
            report.exceptions.push({
                entity: "user",
                sourceId: profile.sourceId,
                reason: error.code || "FIRESTORE_WRITE_FAILED"
            });
        }
    }

    const importedReviewIds = new Set();
    for (const review of plan.reviews) {
        if (!importedProfileUids.has(review.usuarioUid)) {
            report.exceptions.push({
                entity: "review",
                sourceId: review.sourceId,
                reason: "USER_PROFILE_NOT_IMPORTED"
            });
            continue;
        }

        const document = {
            usuarioUid: review.usuarioUid,
            nome: review.nome,
            descricao: review.descricao,
            feedback: review.feedback,
            principais_pontos: review.principais_pontos,
            categoria: review.categoria,
            estrelas: review.estrelas,
            lancamento: review.lancamento,
            duracao: review.duracao,
            dataCriacao: admin.firestore.Timestamp.fromDate(review.dataCriacao),
            origemId: `sqlite:avaliacao:${review.sourceId}`,
            imagemUrl: null,
            imagemPublicId: null
        };

        let uploadedAsset = null;
        let reusedAsset = false;
        const reviewReference = db.collection("avaliacoes").doc(review.id);
        try {
            const existing = await reviewReference.get();
            const existingData = existing.exists ? existing.data() : null;
            if (
                existingData?.origemId === `sqlite:avaliacao:${review.sourceId}` &&
                existingData.imagemUrl &&
                existingData.imagemPublicId
            ) {
                document.imagemUrl = existingData.imagemUrl;
                document.imagemPublicId = existingData.imagemPublicId;
                reusedAsset = true;
            }
        } catch (error) {
            console.error("Could not check the existing review:", error.code || "firestore-read-failed");
            report.exceptions.push({
                entity: "review",
                sourceId: review.sourceId,
                reason: error.code || "FIRESTORE_READ_FAILED"
            });
            continue;
        }

        if (review.imagemOriginal) {
            if (reusedAsset) {
                uploadedAsset = {
                    url: document.imagemUrl,
                    publicId: document.imagemPublicId
                };
            } else {
                const imagePath = resolveImagePath(review.imagemOriginal, imagesDirectory);
                try {
                    const imageBuffer = fs.readFileSync(imagePath);
                    const expectedChecksum = expectedImageChecksums?.[review.id];
                    if (
                        expectedChecksum &&
                        crypto.createHash("sha256").update(imageBuffer).digest("hex") !== expectedChecksum
                    ) {
                        const error = new Error("Image source changed after approval.");
                        error.code = "IMAGE_CHANGED_AFTER_APPROVAL";
                        throw error;
                    }
                    const publicId = `lac-star/avaliacoes/${review.id}`;
                    uploadedAsset = await uploadImage(imageBuffer, publicId);
                    document.imagemUrl = uploadedAsset.url;
                    document.imagemPublicId = uploadedAsset.publicId;
                } catch (error) {
                    console.error("Could not import an image:", error.code || "image-import-failed");
                    report.exceptions.push({
                        entity: "image",
                        sourceId: review.sourceId,
                        reason: error.code || "IMAGE_IMPORT_FAILED"
                    });
                }
            }
        }

        try {
            await setMigrationDocument(
                db,
                reviewReference,
                document,
                document.origemId,
                strictOriginIds
            );
            importedReviewIds.add(review.id);
            report.counts.reviews.imported += 1;
            if (uploadedAsset) {
                report.counts.images.imported += 1;
            }
        } catch (error) {
            console.error("Could not import a review:", error.code || "firestore-write-failed");
            report.exceptions.push({
                entity: "review",
                sourceId: review.sourceId,
                reason: error.code || "FIRESTORE_WRITE_FAILED"
            });
            if (uploadedAsset?.publicId && !reusedAsset) {
                try {
                    await deleteImage(uploadedAsset.publicId);
                } catch (cleanupError) {
                    console.error(
                        "Could not remove an orphaned image:",
                        cleanupError.code || "image-cleanup-failed"
                    );
                    report.exceptions.push({
                        entity: "image",
                        sourceId: review.sourceId,
                        reason: "ORPHAN_CLEANUP_FAILED"
                    });
                }
            }
        }
    }

    for (const link of plan.links) {
        if (!importedProfileUids.has(link.usuarioUid) || !importedReviewIds.has(link.avaliacaoId)) {
            report.exceptions.push({
                entity: "link",
                sourceId: link.sourceId,
                reason: "REFERENCED_RECORD_NOT_IMPORTED"
            });
            continue;
        }
        try {
            const linkReference = db.collection("avaliacoes_usuario").doc(link.id);
            const linkData = {
                usuarioUid: link.usuarioUid,
                avaliacaoId: link.avaliacaoId,
                dataCriacao: admin.firestore.Timestamp.fromDate(link.dataCriacao),
                origemId: `sqlite:avaliacoes_usuario:${link.sourceId}`
            };
            await setMigrationDocument(
                db,
                linkReference,
                linkData,
                linkData.origemId,
                strictOriginIds
            );
            report.counts.links.imported += 1;
        } catch (error) {
            console.error("Could not import a user-review link:", error.code || "firestore-write-failed");
            report.exceptions.push({
                entity: "link",
                sourceId: link.sourceId,
                reason: error.code || "FIRESTORE_WRITE_FAILED"
            });
        }
    }
}

async function executar(options) {
    const sourcePath = assertSafeEnvironment(options);
    const reportPath = path.resolve(options.report);
    if (fs.existsSync(reportPath)) {
        throw new Error("The requested report file already exists.");
    }
    if (reportPath === sourcePath) {
        throw new Error("The report path cannot overwrite the SQLite source.");
    }
    if (!fs.existsSync(path.dirname(reportPath))) {
        throw new Error("The report directory must exist before migration starts.");
    }
    fs.accessSync(path.dirname(reportPath), fs.constants.W_OK);
    const sourceChecksum = await hashFile(sourcePath);
    const database = await openReadOnly(sourcePath);
    const { admin, db } = require("../firebase");
    try {
        const source = await loadSource(database);
        const authUsers = await listFirebaseUsers(admin.auth());
        const runDate = new Date();
        const plan = buildMigrationPlan({ ...source, authUsers, fallbackDate: runDate });
        excludeUnmigratableImages(plan, options["images-directory"], options.mode === "apply");
        const imageManifest = await buildImageManifest(plan, options["images-directory"]);
        const report = createReport(plan, {
            mode: options.mode,
            sourcePath,
            sourceChecksum,
            targetProject: options["target-project"],
            approvalReference: options["approval-reference"],
            runDate
        });
        report.imageManifestSha256 = imageManifest.sha256;
        report.imageManifest = imageManifest.records;
        report.sourceApprovalReference = options["source-approval-reference"];
        if (options.mode === "apply") {
            await applyPlan({
                plan,
                report,
                db,
                admin,
                imagesDirectory: options["images-directory"],
                expectedImageChecksums: imageManifest.checksums
            });
        }
        report.sourceIntact = await hashFile(sourcePath) === sourceChecksum;
        if (!report.sourceIntact) {
            throw new Error("The source copy changed during migration; approval is blocked.");
        }
        const json = `${JSON.stringify(report, null, 2)}\n`;
        fs.writeFileSync(reportPath, json, { flag: "wx", mode: 0o600 });
        process.stdout.write(json);
    } finally {
        await new Promise((resolve, reject) => {
            database.close((error) => (error ? reject(error) : resolve()));
        });
    }
}

if (require.main === module) {
    try {
        const options = parseArgs(process.argv.slice(2));
        executar(options).catch((error) => {
            console.error(`Migration stopped: ${error.message}`);
            process.exitCode = 1;
        });
    } catch (error) {
        console.error(`Migration stopped: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = {
    parseArgs,
    assertSafeEnvironment,
    buildMigrationPlan,
    resolveImagePath,
    excludeUnmigratableImages,
    createReport,
    buildImageManifest,
    applyPlan,
    setMigrationDocument,
    openReadOnly,
    loadSource,
    hashFile
};
