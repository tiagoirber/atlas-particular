import { FirebaseError } from "firebase/app";
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updatePassword as fbUpdatePassword,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "./firebase";

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdminUid(uid: string | undefined | null): boolean {
  if (!uid) return false;
  return ADMIN_UIDS.includes(uid);
}

export async function loginAdmin(email: string, password: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!isAdminUid(cred.user.uid)) {
      await fbSignOut(auth);
      throw new Error(
        "Usuário autenticado, porém não está autorizado como administrador.",
      );
    }
    return cred.user;
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(translateAuthError(err.code));
    }
    throw err;
  }
}

export async function logoutAdmin(): Promise<void> {
  await fbSignOut(auth);
}

export async function getUserProfile(uid: string) {
  const ref = doc(firestore, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function updatePassword(newPassword: string): Promise<void> {
  try {
    if (!auth.currentUser) {
      throw new Error("Nenhum usuário autenticado.");
    }
    await fbUpdatePassword(auth.currentUser, newPassword);
  } catch (err) {
    if (err instanceof FirebaseError) {
      if (err.code === "auth/weak-password") {
        throw new Error("Senha muito fraca. Use ao menos 6 caracteres.");
      }
      if (err.code === "auth/requires-recent-login") {
        throw new Error("Faça login novamente para mudar a senha.");
      }
      throw new Error("Erro ao atualizar senha. Tente novamente.");
    }
    throw err;
  }
}

function translateAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/missing-password":
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente em instantes.";
    case "auth/network-request-failed":
      return "Sem conexão com a rede.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}
