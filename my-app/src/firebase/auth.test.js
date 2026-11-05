import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  cadastrarUsuario,
  enviarVerificacaoEmail,
  fazerLogin,
  redefinirSenha,
  sairDaConta
} from "./auth";
import { auth } from "./config";

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

jest.mock("./config", () => ({ auth: { currentUser: null } }));

describe("Firebase authentication helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a Firebase account and requests email verification", async () => {
    const userCredential = { user: { uid: "firebase-uid" } };
    createUserWithEmailAndPassword.mockResolvedValue(userCredential);
    sendEmailVerification.mockResolvedValue(undefined);

    await expect(cadastrarUsuario("person@example.com", "new-password"))
      .resolves.toBe(userCredential);

    expect(createUserWithEmailAndPassword)
      .toHaveBeenCalledWith(auth, "person@example.com", "new-password");
    expect(sendEmailVerification).toHaveBeenCalledWith(userCredential.user);
  });

  test("logs in with Firebase Authentication", async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "uid-a" } });

    await fazerLogin("person@example.com", "new-password");

    expect(signInWithEmailAndPassword)
      .toHaveBeenCalledWith(auth, "person@example.com", "new-password");
  });

  test("sends a password reset email through Firebase Authentication", async () => {
    sendPasswordResetEmail.mockResolvedValue(undefined);

    await redefinirSenha("person@example.com");

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, "person@example.com");
  });

  test("resends email verification for the current Firebase user", async () => {
    auth.currentUser = { emailVerified: false };
    sendEmailVerification.mockResolvedValue(undefined);

    await enviarVerificacaoEmail();

    expect(sendEmailVerification).toHaveBeenCalledWith(auth.currentUser);
    auth.currentUser = null;
  });

  test("ends the Firebase session", async () => {
    signOut.mockResolvedValue(undefined);

    await sairDaConta();

    expect(signOut).toHaveBeenCalledWith(auth);
  });
});
