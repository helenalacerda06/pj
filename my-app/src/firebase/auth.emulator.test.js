const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { TextDecoder, TextEncoder } = require("node:util");
const { clearImmediate, setImmediate } = require("node:timers");
const { initializeApp, deleteApp } = require("firebase/app");
const {
  browserLocalPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  initializeAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} = require("firebase/auth");
global.TextDecoder = global.TextDecoder || TextDecoder;
global.TextEncoder = global.TextEncoder || TextEncoder;
global.clearImmediate = global.clearImmediate || clearImmediate;
global.setImmediate = global.setImmediate || setImmediate;
const {
  assertIsolatedEmulatorEnvironment,
  emulatorConfigured
} = require("../../../back-end/tests/helpers/firebaseEmulator");

function requestJson(port, method, route, token, body) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: "127.0.0.1",
      port,
      method,
      path: route,
      headers: {
        ...(token ? { Authorization: ["Bearer", token].join(" ") } : {}),
        ...(body ? { "content-type": "application/json" } : {})
      }
    }, (response) => {
      let responseBody = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        responseBody += chunk;
      });
      response.on("end", () => {
        resolve({
          status: response.statusCode,
          body: responseBody ? JSON.parse(responseBody) : null
        });
      });
    });

    request.on("error", reject);
    if (body) {
      request.write(JSON.stringify(body));
    }
    request.end();
  });
}

const emulatorTest = emulatorConfigured() ? test : test.skip;

emulatorTest("uses Firebase Web SDK against emulators for auth sessions and private profiles", async () => {
  assertIsolatedEmulatorEnvironment();

  const projectId = process.env.GCLOUD_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.FIREBASE_PROJECT_ID;
  const { admin, db } = require("../../../back-end/firebase");
  const authenticateUser = require("../../../back-end/autenticarUsuario");
  const { createApp } = require("../../../back-end/app");
  const suffix = randomUUID();
  const password = "emulator-test-password";
  const emails = [
    `web-sdk-a-${suffix}@example.test`,
    `web-sdk-b-${suffix}@example.test`
  ];
  const userUids = [];
  const appName = `auth-emulator-${suffix}`;
  let clientApp;
  let auth;
  let server;

  try {
    const firebaseConfig = {
      apiKey: "fake-api-key",
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      appId: `1:${suffix}:web:emulator`
    };
    clientApp = initializeApp(firebaseConfig, appName);
    auth = initializeAuth(clientApp, {
      persistence: [browserLocalPersistence]
    });
    connectAuthEmulator(
      auth,
      `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
      { disableWarnings: true }
    );
    await setPersistence(auth, browserLocalPersistence);

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

    const firstAccount = await createUserWithEmailAndPassword(
      auth,
      emails[0],
      password
    );
    userUids.push(firstAccount.user.uid);
    const firstToken = await firstAccount.user.getIdToken();
    const createdProfile = await requestJson(
      server.address().port,
      "POST",
      "/usuario/firebase",
      firstToken,
      { nome: "Perfil SDK A", aniversario: "2000-01-02" }
    );
    expect(createdProfile.status).toBe(201);
    expect(createdProfile.body.uid).toBe(firstAccount.user.uid);

    await signOut(auth);
    expect(auth.currentUser).toBeNull();

    const secondAccount = await createUserWithEmailAndPassword(
      auth,
      emails[1],
      password
    );
    userUids.push(secondAccount.user.uid);
    const secondToken = await secondAccount.user.getIdToken();
    const privateProfile = await requestJson(
      server.address().port,
      "GET",
      "/usuario/firebase",
      secondToken
    );
    expect(privateProfile.status).toBe(404);

    await signOut(auth);
    const signedInAccount = await signInWithEmailAndPassword(
      auth,
      emails[0],
      password
    );
    expect(signedInAccount.user.uid).toBe(firstAccount.user.uid);
    const ownProfile = await requestJson(
      server.address().port,
      "GET",
      "/usuario/firebase",
      await signedInAccount.user.getIdToken()
    );
    expect(ownProfile.status).toBe(200);
    expect(ownProfile.body.uid).toBe(firstAccount.user.uid);
    expect(ownProfile.body.nome).toBe("Perfil SDK A");

    await deleteApp(clientApp);
    clientApp = initializeApp(firebaseConfig, appName);
    auth = initializeAuth(clientApp, {
      persistence: [browserLocalPersistence]
    });
    connectAuthEmulator(
      auth,
      `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
      { disableWarnings: true }
    );
    await auth.authStateReady();
    expect(auth.currentUser?.uid).toBe(firstAccount.user.uid);
    await signOut(auth);
  } finally {
    if (auth?.currentUser) {
      await signOut(auth);
    }
    if (clientApp) {
      await deleteApp(clientApp);
    }
    for (const uid of userUids) {
      await db.collection("usuarios").doc(uid).delete();
      await admin.auth().deleteUser(uid);
    }
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  }
}, 30000);
