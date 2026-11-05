const crypto = require("node:crypto");

const REQUIRED_GATES = [
    "sourceCopyAuthorized",
    "destinationAuthorized",
    "integrityVerified",
    "identityMappingReviewed",
    "adminIdentitiesReviewed",
    "imageQuotaApproved",
    "environmentValidated",
    "requiredTestsPassed",
    "previewReportReviewed",
    "reconciliationApproved",
    "importApproved"
];

function isSha256(value) {
    return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function assertIsoDate(value, label) {
    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        throw new Error(`${label} must be a valid ISO date.`);
    }
    const parsed = new Date(value);
    if (parsed.toISOString() !== value) {
        throw new Error(`${label} must use a canonical ISO date.`);
    }
    return parsed;
}

function parseApprovalArguments(args) {
    const values = {};
    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        if (
            !argument.startsWith("--") ||
            !args[index + 1] ||
            args[index + 1].startsWith("--")
        ) {
            throw new Error(`Invalid argument: ${argument}`);
        }
        const key = argument.slice(2);
        if (Object.hasOwn(values, key)) {
            throw new Error(`Duplicate argument: --${key}`);
        }
        values[key] = args[index + 1];
        index += 1;
    }

    const allowed = new Set([
        "source-copy",
        "source-snapshot-id",
        "source-approval-reference",
        "target-project",
        "images-directory",
        "approval-manifest",
        "approval-signature",
        "approval-id",
        "preview-report",
        "report",
        "confirm-real-import"
    ]);
    for (const key of Object.keys(values)) {
        if (!allowed.has(key)) {
            throw new Error(`Unsupported argument: --${key}`);
        }
    }
    for (const key of allowed) {
        if (!values[key]) {
            throw new Error(`Missing required argument --${key}.`);
        }
    }
    return values;
}

function assertRealImportEnvironment(targetProject, env = process.env) {
    if (env.MIGRATION_REAL_IMPORT_ENABLED !== "true") {
        throw new Error("Real import is disabled; MIGRATION_REAL_IMPORT_ENABLED must be true.");
    }
    if (env.FIREBASE_AUTH_EMULATOR_HOST || env.FIRESTORE_EMULATOR_HOST) {
        throw new Error("Real import cannot run while Firebase emulator hosts are configured.");
    }
    if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(targetProject) || targetProject.startsWith("demo-")) {
        throw new Error("Real import requires an explicitly authorized non-demo project.");
    }
    if (env.MIGRATION_EXPECTED_TARGET_PROJECT !== targetProject) {
        throw new Error("The target project does not match MIGRATION_EXPECTED_TARGET_PROJECT.");
    }
    const configuredProject = env.GCLOUD_PROJECT
        || env.GOOGLE_CLOUD_PROJECT
        || env.FIREBASE_PROJECT_ID;
    if (configuredProject !== targetProject) {
        throw new Error("The configured Firebase project must match the approved target.");
    }
    if (!env.MIGRATION_APPROVAL_PUBLIC_KEY) {
        throw new Error("MIGRATION_APPROVAL_PUBLIC_KEY is required to verify approval.");
    }
    if (!["staging", "production"].includes(env.MIGRATION_TARGET_ENVIRONMENT)) {
        throw new Error("MIGRATION_TARGET_ENVIRONMENT must be staging or production.");
    }
}

function verifySignedManifest(manifestBytes, signatureText, publicKey) {
    if (!Buffer.isBuffer(manifestBytes) || manifestBytes.length === 0 || manifestBytes.length > 65536) {
        throw new Error("Approval manifest must be a non-empty file no larger than 64 KB.");
    }
    if (
        typeof signatureText !== "string" ||
        signatureText.trim().length > 128 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(signatureText.trim())
    ) {
        throw new Error("Approval signature must be base64 encoded.");
    }
    const signature = Buffer.from(signatureText.trim(), "base64");
    if (signature.length !== 64 || signature.toString("base64") !== signatureText.trim()) {
        throw new Error("Approval signature has an invalid encoding or length.");
    }
    let validSignature = false;
    try {
        validSignature = crypto.verify(null, manifestBytes, publicKey, signature);
    } catch (error) {
        throw new Error(`Could not verify approval signature: ${error.message}`);
    }
    if (!validSignature) {
        throw new Error("Approval signature is invalid.");
    }

    let manifest;
    try {
        manifest = JSON.parse(manifestBytes.toString("utf8"));
    } catch {
        throw new Error("Signed approval manifest must contain valid JSON.");
    }
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        throw new Error("Signed approval manifest must be a JSON object.");
    }
    return manifest;
}

function validateApprovalManifest(manifest, {
    targetProject,
    targetEnvironment,
    sourceSnapshotId,
    sourceApprovalReference,
    sourceChecksum,
    previewChecksum,
    confirmation,
    now = new Date()
}) {
    if (manifest.version !== 1) {
        throw new Error("Unsupported approval manifest version.");
    }
    if (
        typeof manifest.approvalId !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(manifest.approvalId)
    ) {
        throw new Error("Approval manifest must include a valid approvalId.");
    }
    if (confirmation !== manifest.approvalId) {
        throw new Error("Explicit confirmation must match the signed approvalId.");
    }
    if (typeof manifest.approvedBy !== "string" || manifest.approvedBy.trim().length < 3) {
        throw new Error("Approval manifest must identify the approving person.");
    }
    const approvedAt = assertIsoDate(manifest.approvedAt, "approvedAt");
    const expiresAt = assertIsoDate(manifest.expiresAt, "expiresAt");
    if (approvedAt > now || expiresAt <= now || expiresAt <= approvedAt) {
        throw new Error("Approval must be current and must not be expired.");
    }

    const source = manifest.source;
    if (
        !source ||
        typeof source.snapshotId !== "string" ||
        source.snapshotId !== sourceSnapshotId ||
        source.approvalReference !== sourceApprovalReference ||
        source.sha256 !== sourceChecksum ||
        !isSha256(source.sha256)
    ) {
        throw new Error("Approval source identity, reference and checksum must match the inspected copy.");
    }

    const destination = manifest.destination;
    if (
        !destination ||
        destination.projectId !== targetProject ||
        !["staging", "production"].includes(destination.environment) ||
        destination.environment !== targetEnvironment
    ) {
        throw new Error("Approval destination must match the explicitly configured staging or production project.");
    }

    if (manifest.previewReportSha256 !== previewChecksum || !isSha256(previewChecksum)) {
        throw new Error("The signed approval must match the exact reviewed preview report.");
    }

    const gates = manifest.gates;
    if (
        !gates ||
        REQUIRED_GATES.some((gate) => gates[gate] !== true)
    ) {
        const missing = REQUIRED_GATES.filter((gate) => gates?.[gate] !== true);
        throw new Error(`Import approval is incomplete; required gates are not approved: ${missing.join(", ")}.`);
    }
    return manifest;
}

function validatePreviewReport(report, {
    targetProject,
    sourceChecksum
}) {
    if (
        !report ||
        report.mode !== "dry-run" ||
        report.targetProject !== targetProject ||
        report.sourceChecksum !== sourceChecksum ||
        report.sourceIntact !== true ||
        !isSha256(report.imageManifestSha256) ||
        typeof report.runId !== "string" ||
        Number.isNaN(Date.parse(report.runId)) ||
        !Array.isArray(report.exceptions) ||
        !Array.isArray(report.imageManifest) ||
        !report.mappings ||
        !["users", "reviews", "links"].every((entity) =>
            Array.isArray(report.mappings[entity])
        )
    ) {
        throw new Error("The reviewed preview report is incomplete or does not match the approved source and destination.");
    }
    for (const entity of ["users", "reviews", "links", "images"]) {
        const counts = report.counts?.[entity];
        if (
            !counts ||
            ["source", "planned", "imported"].some((key) =>
                !Number.isSafeInteger(counts[key]) || counts[key] < 0
            ) ||
            counts.imported !== 0
        ) {
            throw new Error(`The preview report has invalid ${entity} counts or contains writes.`);
        }
    }
    return report;
}

function assertPlanMatchesPreview(report, plan) {
    const expected = {
        users: { source: plan.sourceCounts.users, planned: plan.profiles.length },
        reviews: { source: plan.sourceCounts.reviews, planned: plan.reviews.length },
        links: { source: plan.sourceCounts.links, planned: plan.links.length },
        images: { source: plan.sourceCounts.images, planned: plan.imageReviews.length }
    };
    for (const [entity, counts] of Object.entries(expected)) {
        if (
            report.counts[entity].source !== counts.source ||
            report.counts[entity].planned !== counts.planned
        ) {
            throw new Error(`The current ${entity} plan differs from the signed preview.`);
        }
    }
    if (JSON.stringify(report.normalizations) !== JSON.stringify(plan.normalizations)) {
        throw new Error("Current normalizations differ from the signed preview.");
    }
    if (JSON.stringify(report.exceptions) !== JSON.stringify(plan.exceptions)) {
        throw new Error("Current exceptions differ from the signed preview.");
    }
    const mappings = {
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
    };
    if (JSON.stringify(report.mappings) !== JSON.stringify(mappings)) {
        throw new Error("Current identity and document mappings differ from the signed preview.");
    }
}

module.exports = {
    REQUIRED_GATES,
    parseApprovalArguments,
    assertRealImportEnvironment,
    verifySignedManifest,
    validateApprovalManifest,
    validatePreviewReport,
    assertPlanMatchesPreview
};
