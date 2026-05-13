"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./admin-nav.module.css";

export function AdminNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (!user) return null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/admin/dashboard" className={styles.logo}>
          Atlas Particular · Admin
        </Link>
        <ul className={styles.menu}>
          <li>
            <Link href="/admin/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/admin/trips">Viagens</Link>
          </li>
          <li>
            <Link href="/admin/settings">Configurações</Link>
          </li>
          <li>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Sair ({user.email})
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
