"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import styles from "./header.module.css";

export function Header() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          Atlas Particular
        </Link>

        <div className={styles.links}>
          <Link href="/viagens" className={styles.link}>
            Viagens
          </Link>
          {user && isAdmin && (
            <Link href="/admin/dashboard" className={styles.link}>
              Painel
            </Link>
          )}
        </div>

        <div className={styles.user}>
          {user && isAdmin ? (
            <button
              onClick={logout}
              className={styles.logoutBtn}
              title={`Sair (${user.email})`}
            >
              Sair
            </button>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
