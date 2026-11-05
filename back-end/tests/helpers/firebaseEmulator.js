function emulatorConfigured() {
    return Boolean(
        process.env.FIREBASE_AUTH_EMULATOR_HOST &&
        process.env.FIRESTORE_EMULATOR_HOST
    );
}

function assertIsolatedEmulatorEnvironment() {
    const projectId = process.env.GCLOUD_PROJECT
        || process.env.GOOGLE_CLOUD_PROJECT
        || process.env.FIREBASE_PROJECT_ID;

    if (process.env.NODE_ENV === "production") {
        throw new Error("Firebase emulator tests cannot run in production.");
    }

    if (!emulatorConfigured()) {
        throw new Error("Both Firebase Auth and Firestore emulators must be configured.");
    }

    if (!projectId?.startsWith("demo-")) {
        throw new Error("Firebase emulator tests require a demo-* project ID.");
    }

    for (const [name, value] of [
        ["FIREBASE_AUTH_EMULATOR_HOST", process.env.FIREBASE_AUTH_EMULATOR_HOST],
        ["FIRESTORE_EMULATOR_HOST", process.env.FIRESTORE_EMULATOR_HOST]
    ]) {
        let hostname;
        try {
            hostname = new URL(`http://${value}`).hostname;
        } catch {
            throw new Error(`${name} must be a local emulator host.`);
        }
        const normalizedHostname = hostname.replace(/^\[|\]$/g, "");
        if (!["localhost", "127.0.0.1", "::1"].includes(normalizedHostname)) {
            throw new Error(`${name} must point to a local emulator, not a remote service.`);
        }
    }
}

module.exports = { assertIsolatedEmulatorEnvironment, emulatorConfigured };
