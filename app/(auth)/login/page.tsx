"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdmin } from "@/lib/auth-utils";
import { useAuth } from "@/lib/auth-context";
import styles from "./login.module.css";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (search.get("denied") === "1") {
      setError("Acesso negado. Esta conta não tem permissão de administrador.");
    }
  }, [search]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await loginAdmin(email, password);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Atlas Particular</p>
          <h1>Acessar painel</h1>
        </header>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={submitting} className={styles.submit}>
            {submitting ? "Autenticando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.container}>Carregando…</main>}>
      <LoginInner />
    </Suspense>
  );
}
