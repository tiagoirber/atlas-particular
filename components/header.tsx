"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import styles from "./header.module.css";

function SunIcon() {
  return (
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
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onOutside(e: MouseEvent) {
      if (menuOpen && headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);
  const themeLabel = theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro";

  return (
    <header className={styles.header} ref={headerRef}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo} onClick={close}>
          Atlas Particular
        </Link>

        {/* Desktop: links centrais */}
        <div className={styles.links}>
          <Link href="/viagens" className={styles.link}>Viagens</Link>
          {user && isAdmin && (
            <Link href="/admin/dashboard" className={styles.link}>Painel</Link>
          )}
        </div>

        {/* Desktop: tema + logout/login */}
        <div className={styles.user}>
          {mounted && (
            <button onClick={toggleTheme} className={styles.themeToggle} aria-label={themeLabel} title={themeLabel}>
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          )}
          {user && isAdmin ? (
            <button onClick={logout} className={styles.logoutBtn} title={`Sair (${user.email})`}>
              Sair
            </button>
          ) : (
            <Link href="/login" className={styles.loginBtn}>Entrar</Link>
          )}
        </div>

        {/* Mobile: tema + hamburger */}
        <div className={styles.mobileRight}>
          {mounted && (
            <button onClick={toggleTheme} className={styles.themeToggle} aria-label={themeLabel} title={themeLabel}>
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          )}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="header-mobile-menu"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.barTop : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barMid : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barBot : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div
        id="header-mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}
        aria-hidden={!menuOpen}
      >
        <Link href="/viagens" className={styles.mobileLink} onClick={close}>Viagens</Link>
        {user && isAdmin && (
          <Link href="/admin/dashboard" className={styles.mobileLink} onClick={close}>Painel</Link>
        )}
        {user && isAdmin ? (
          <button onClick={() => { logout(); close(); }} className={styles.mobileLinkBtn}>Sair</button>
        ) : (
          <Link href="/login" className={styles.mobileLink} onClick={close}>Entrar</Link>
        )}
      </div>
    </header>
  );
}
