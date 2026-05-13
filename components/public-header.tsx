"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import styles from "./public-header.module.css";

export function PublicHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Atlas Particular
        </Link>
        <nav className={styles.nav}>
          <Link href="/viagens">Viagens</Link>
          <button onClick={toggleTheme} className={styles.themeBtn}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </nav>
      </div>
    </header>
  );
}
