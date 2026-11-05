const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
    assertPlanMatchesPreview,
    assertRealImportEnvironment,
    parseApprovalArguments,
    validateApprovalManifest,
    validatePreviewReport,
    verifySignedManifest
} = require("../services/migrationApproval");
const {
    applyPlan,
    buildImageManifest,
    buildMigrationPlan,
    createReport,
    excludeUnmigratableImages,
    hashFile,
    loadSource,
    openReadOnly
} = require("./migrarSQLiteParaFirestore");

const DATABASE_ORIGINAL = path.resolve(__dirname, "../../teste_helena.db");

function assertSourceCopy(sourceCopy) {
    const sourcePath = fs.realpathSync(sourceCopy);
    const originalPath = fs.existsSync(DATABASE_ORIGINAL)
        ? fs.realpathSync(DATABASE_ORIGINAL)
        : DATABASE_ORIGINAL;
    if (sourcePath === originalPath) {
        throw new Error("The live SQLite database cannot be used; provide an approved isolated copy.");
    }
    if (fs.existsSync(`${sourcePath}-wal`) || fs.existsSync(`${sourcePath}-journal`)) {
        throw new Error("SQLite source copies must be closed and have no WAL/journal sidecars.");
    }
    return sourcePath;
}

function assertReportPath(reportPath, protectedPaths) {
    const absoluteReportPath = path.resolve(reportPath);
    if (fs.existsSync(absoluteReportPath)) {
        throw new Error("The requested audit report already exists.");
    }
    if (!fs.existsSync(path.dirname(absoluteReportPath))) {
        throw new Error("The audit report directory must exist before import starts.");
    }
    fs.accessSync(path.dirname(absoluteReportPath), fs.constants.W_OK);
    const canonicalParent = fs.realpathSync(path.dirname(absoluteReportPath));
    const canonicalReport = path.join(canonicalParent, path.basename(absoluteReportPath));
    if (protectedPaths.some((protectedPath) => canonicalReport === path.resolve(protectedPath))) {
        throw new Error("The audit report cannot overwrite a source, approval or preview file.");
    }
    return canonicalReport;
}

async function assertDestinationOwnership(plan, db) {
    const documents = [
        ...plan.profiles.map((profile) => ({
            collection: "usuarios",
            id: profile.uid,
            originId: `sqlite:usuarios:${profile.sourceId}`
        })),
        ...plan.reviews.map((review) => ({
            collection: "avaliacoes",
            id: review.id,
            originId: `sqlite:avaliacao:${review.sourceId}`
        })),
        ...plan.links.map((link) => ({
            collection: "avaliacoes_usuario",
            id: link.id,
            originId: `sqlite:avaliacoes_usuario:${link.sourceId}`
        }))
    ];

    for (const document of documents) {
        const snapshot = await db.collection(document.collection).doc(document.id).get();
        if (snapshot.exists && snapshot.data()?.origemId !== document.originId) {
            throw new Error("Destination conflict detected; existing data is not owned by this source.");
        }
    }
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

function validateImageConfiguration(plan, env = process.env) {
    if (plan.imageReviews.length === 0) {
        return;
    }
    if (
        env.CLOUDINARY_FREE_PLAN_APPROVED !== "true" ||
        !env.CLOUDINARY_CLOUD_NAME ||
        !env.CLOUDINARY_API_KEY ||
        !env.CLOUDINARY_API_SECRET
    ) {
        throw new Error("Approved Cloudinary Free credentials and quota approval are required before importing images.");
    }
}

async function executeRealImport(options, env = process.env) {
    assertRealImportEnvironment(options["target-project"], env);
    if (options["confirm-real-import"] !== options["approval-id"]) {
        throw new Error("Explicit confirmation must match the signed approvalId.");
    }

    const sourcePath = assertSourceCopy(options["source-copy"]);
    const previewPath = fs.realpathSync(options["preview-report"]);
    const manifestPath = fs.realpathSync(options["approval-manifest"]);
    const signaturePath = fs.realpathSync(options["approval-signature"]);
    const reportPath = assertReportPath(options.report, [
        sourcePath,
        previewPath,
        manifestPath,
        signaturePath
    ]);

    const sourceChecksum = await hashFile(sourcePath);
    const previewBytes = fs.readFileSync(previewPath);
    const previewChecksum = crypto
        .createHash("sha256")
        .update(previewBytes)
        .digest("hex");
    const previewReport = validatePreviewReport(JSON.parse(previewBytes.toString("utf8")), {
        targetProject: options["target-project"],
        sourceChecksum
    });
    const manifestBytes = fs.readFileSync(manifestPath);
    const signatureText = fs.readFileSync(signaturePath, "utf8");
    const manifest = verifySignedManifest(
        manifestBytes,
        signatureText,
        env.MIGRATION_APPROVAL_PUBLIC_KEY
    );
    validateApprovalManifest(manifest, {
        targetProject: options["target-project"],
        targetEnvironment: env.MIGRATION_TARGET_ENVIRONMENT,
        sourceSnapshotId: options["source-snapshot-id"],
        sourceApprovalReference: options["source-approval-reference"],
        sourceChecksum,
        previewChecksum,
        confirmation: options["confirm-real-import"]
    });
    if (manifest.approvalId !== options["approval-id"]) {
        throw new Error("Approval identifier in arguments does not match the signed manifest.");
    }

    const database = await openReadOnly(sourcePath);
    try {
        const source = await loadSource(database);
        const { admin, db } = require("../firebase");
        const initializedProject = admin.app().options.projectId;
        if (initializedProject !== options["target-project"]) {
            throw new Error("Firebase Admin initialized a project other than the approved destination.");
        }

        const runDate = new Date(previewReport.runId);
        const plan = buildMigrationPlan({
            ...source,
            authUsers: await listFirebaseUsers(admin.auth()),
            fallbackDate: runDate
        });
        excludeUnmigratableImages(plan, options["images-directory"], false);
        assertPlanMatchesPreview(previewReport, plan);
        const imageManifest = await buildImageManifest(plan, options["images-directory"]);
        if (imageManifest.sha256 !== previewReport.imageManifestSha256) {
            throw new Error("Current image files differ from the signed preview.");
        }
        validateImageConfiguration(plan, env);
        await assertDestinationOwnership(plan, db);
        if (await hashFile(sourcePath) !== sourceChecksum) {
            throw new Error("The approved SQLite copy changed during preflight.");
        }

        const importStartedAt = new Date();
        const report = createReport(plan, {
            mode: "real-apply",
            sourcePath,
            sourceChecksum,
            targetProject: options["target-project"],
            approvalReference: manifest.approvalId,
            runDate: importStartedAt
        });
        report.sourceSnapshotId = manifest.source.snapshotId;
        report.previewRunId = previewReport.runId;
        report.imageManifestSha256 = imageManifest.sha256;
        report.imageManifest = imageManifest.records;
        report.sourceApprovalReference = options["source-approval-reference"];
        report.approval = {
            approvalId: manifest.approvalId,
            approvedBy: manifest.approvedBy,
            approvedAt: manifest.approvedAt,
            sourceSnapshotId: manifest.source.snapshotId,
            targetEnvironment: manifest.destination.environment,
            manifestSha256: crypto
                .createHash("sha256")
                .update(manifestBytes)
                .digest("hex"),
            signatureSha256: crypto
                .createHash("sha256")
                .update(fs.readFileSync(signaturePath))
                .digest("hex"),
            previewReportSha256: previewChecksum
        };

        await applyPlan({
            plan,
            report,
            db,
            admin,
            imagesDirectory: options["images-directory"],
            expectedImageChecksums: imageManifest.checksums,
            strictOriginIds: true
        });
        report.sourceIntact = await hashFile(sourcePath) === sourceChecksum;
        report.result = report.sourceIntact &&
            ["users", "reviews", "links", "images"].every((entity) =>
                report.counts[entity].imported === report.counts[entity].planned
            )
            ? report.exceptions.length > 0
                ? "completed_with_approved_exceptions"
                : "completed"
            : "incomplete";

        const serializedReport = `${JSON.stringify(report, null, 2)}\n`;
        fs.writeFileSync(reportPath, serializedReport, { flag: "wx", mode: 0o600 });
        process.stdout.write(`Audit report written; result=${report.result}; runId=${report.runId}\n`);
        if (report.result === "incomplete") {
            throw new Error("Import was incomplete; preserve the source and reconcile the audit report before retrying.");
        }
        return report;
    } finally {
        await new Promise((resolve, reject) => {
            database.close((error) => error ? reject(error) : resolve());
        });
    }
}

if (require.main === module) {
    try {
        const options = parseApprovalArguments(process.argv.slice(2));
        executeRealImport(options).catch((error) => {
            console.error(`Real import stopped: ${error.message}`);
            process.exitCode = 1;
        });
    } catch (error) {
        console.error(`Real import stopped: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = {
    assertSourceCopy,
    assertReportPath,
    assertDestinationOwnership,
    validateImageConfiguration,
    executeRealImport
};
