"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminNav } from "@/components/admin-nav";
import styles from "./admin.module.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      // Logado mas sem permissão — sair e ir pro login
      logout().finally(() => router.replace("/login?denied=1"));
    }
  }, [user, isAdmin, loading, logout, router]);

  if (loading) {
    return <div className={styles.fallback}>Carregando…</div>;
  }

  if (!user || !isAdmin) {
    return <div className={styles.fallback}>Redirecionando…</div>;
  }

  return (
    <div className={styles.shell}>
      <AdminNav />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
