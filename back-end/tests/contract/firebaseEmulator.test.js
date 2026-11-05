const test = require("node:test");
const assert = require("node:assert/strict");
const { assertIsolatedEmulatorEnvironment } = require("../helpers/firebaseEmulator");

const ENVIRONMENT_KEYS = [
    "NODE_ENV",
    "GCLOUD_PROJECT",
    "GOOGLE_CLOUD_PROJECT",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIRESTORE_EMULATOR_HOST"
];

function withEmulatorEnvironment(overrides, callback) {
    const previous = Object.fromEntries(
        ENVIRONMENT_KEYS.map((key) => [key, process.env[key]])
    );
    for (const key of ENVIRONMENT_KEYS) {
        delete process.env[key];
    }
    Object.assign(process.env, {
        GCLOUD_PROJECT: "demo-lac-star",
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
        FIRESTORE_EMULATOR_HOST: "localhost:8080",
        ...overrides
    });

    try {
        callback();
    } finally {
        for (const key of ENVIRONMENT_KEYS) {
            if (previous[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = previous[key];
            }
        }
    }
}

test("allows only explicit demo projects and local Firebase emulator hosts", () => {
    withEmulatorEnvironment({}, () => assert.doesNotThrow(assertIsolatedEmulatorEnvironment));
    withEmulatorEnvironment({
        FIREBASE_AUTH_EMULATOR_HOST: "[::1]:9099",
        FIRESTORE_EMULATOR_HOST: "[::1]:8080"
    }, () => assert.doesNotThrow(assertIsolatedEmulatorEnvironment));
});

test("refuses emulator integration tests in production", () => {
    withEmulatorEnvironment(
        { NODE_ENV: "production" },
        () => assert.throws(assertIsolatedEmulatorEnvironment, /cannot run in production/)
    );
});

test("refuses emulator integration tests for non-demo Firebase projects", () => {
    withEmulatorEnvironment(
        { GCLOUD_PROJECT: "lac-star-production" },
        () => assert.throws(assertIsolatedEmulatorEnvironment, /demo-\* project ID/)
    );
});

test("refuses Firebase emulator hosts outside the local machine", () => {
    withEmulatorEnvironment(
        { FIRESTORE_EMULATOR_HOST: "firestore.googleapis.com:443" },
        () => assert.throws(assertIsolatedEmulatorEnvironment, /local emulator/)
    );
});
