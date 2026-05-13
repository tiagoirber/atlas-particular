"use client";

import { useAuth } from "@/lib/auth-context";
import { ChangePasswordForm } from "@/components/change-password-form";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1>Configurações</h1>
        <p>
          Atlas Particular é um acervo privado. A área administrativa é restrita aos UIDs listados na variável{" "}
          <code>NEXT_PUBLIC_ADMIN_UIDS</code> e validada pelas <em>Security Rules</em>.
        </p>
      </header>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Informações da conta</h2>
        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt>E-mail logado</dt>
            <dd>{user?.email || "—"}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt>UID</dt>
            <dd className={styles.monospace}>{user?.uid || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.formCard}>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
