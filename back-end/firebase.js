const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

if (admin.apps.length === 0) {
    const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && (authEmulatorHost || firestoreEmulatorHost)) {
        throw new Error("Firebase emulators must not be configured in production.");
    }

    const projectId = process.env.GCLOUD_PROJECT
        || process.env.GOOGLE_CLOUD_PROJECT
        || process.env.FIREBASE_PROJECT_ID;
    const localServiceAccount = path.join(__dirname, "serviceAccountKey.json");
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    let options = {};

    if (credentialsPath) {
        options.credential = admin.credential.applicationDefault();
    } else if (fs.existsSync(localServiceAccount)) {
        options.credential = admin.credential.cert(require(localServiceAccount));
    } else if (!authEmulatorHost && !firestoreEmulatorHost) {
        throw new Error(
            "Configure GOOGLE_APPLICATION_CREDENTIALS or a local serviceAccountKey.json."
        );
    }

    if (projectId) {
        options.projectId = projectId;
    }

    admin.initializeApp(options);
}

const db = admin.firestore();

module.exports = { admin, db };