import { FirebaseError } from "firebase/app";
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
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
