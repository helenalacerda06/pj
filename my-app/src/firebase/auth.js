import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail
} from "firebase/auth";

import { auth } from "./config";

// Criar conta
export function cadastrarUsuario(email, senha) {
    return createUserWithEmailAndPassword(auth, email, senha).then(
        async (credential) => {
            try {
                await sendEmailVerification(credential.user);
            } catch (error) {
                error.authUserCreated = true;
                throw error;
            }
            return credential;
        }
    );
}

// Fazer login
export function fazerLogin(email, senha) {
    return signInWithEmailAndPassword(auth, email, senha);
}

// Sair da conta
export function sairDaConta() {
    return signOut(auth);
}

export function enviarVerificacaoEmail() {
    if (!auth.currentUser) {
        return Promise.reject(new Error("No authenticated user."));
    }
    return sendEmailVerification(auth.currentUser);
}

export function redefinirSenha(email) {
    return sendPasswordResetEmail(auth, email);
}

// Verificar usuário autenticado
export function observarAutenticacao(callback) {
    return onAuthStateChanged(auth, callback);
}