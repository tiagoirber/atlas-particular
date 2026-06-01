"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import styles from "./header.module.css";

export function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          {mounted && (
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          )}
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
