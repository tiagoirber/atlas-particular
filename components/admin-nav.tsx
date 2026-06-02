"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./admin-nav.module.css";

export function AdminNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Fecha ao mudar de rota
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Fecha com Escape e clique fora
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onOutside(e: MouseEvent) {
      if (menuOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
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

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const close = () => setMenuOpen(false);

  if (!user) return null;

  return (
    <nav className={styles.navbar} ref={navRef}>
      <div className={styles.container}>
        <Link href="/admin/dashboard" className={styles.logo}>
          Atlas Particular · Admin
        </Link>

        {/* Desktop menu */}
        <ul className={styles.menu}>
          <li><Link href="/admin/dashboard">Dashboard</Link></li>
          <li><Link href="/admin/trips">Viagens</Link></li>
          <li><Link href="/admin/settings">Configurações</Link></li>
          <li>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Sair
            </button>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="admin-mobile-menu"
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barTop : ""}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barMid : ""}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barBot : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        id="admin-mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}
        aria-hidden={!menuOpen}
      >
        <Link href="/admin/dashboard" className={styles.mobileLink} onClick={close}>Dashboard</Link>
        <Link href="/admin/trips" className={styles.mobileLink} onClick={close}>Viagens</Link>
        <Link href="/admin/settings" className={styles.mobileLink} onClick={close}>Configurações</Link>
        <button onClick={handleLogout} className={styles.mobileLogoutBtn}>Sair</button>
      </div>
    </nav>
  );
}
