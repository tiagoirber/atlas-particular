"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import styles from "./page.module.css";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className={styles.landing}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Acervo pessoal</p>
        <h1 className={styles.title}>Atlas Particular</h1>
        <p className={styles.lead}>
          Um diário privado de viagens. Destinos, dias, atrações e fotos guardados
          com cuidado — para serem revisitados sem pressa.
        </p>
        <div className={styles.actions}>
          {!loading && user ? (
            <Link href="/admin/dashboard" className={styles.primary}>
              Entrar no painel
            </Link>
          ) : (
            <Link href="/login" className={styles.primary}>
              Acessar painel
            </Link>
          )}
          <Link href="/viagens" className={styles.secondary}>
            Ver viagens
          </Link>
        </div>
      </section>
    </main>
  );
}
