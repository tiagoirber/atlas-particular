"use client";

import { useAuth } from "@/lib/auth-context";
import { ChangePasswordForm } from "@/components/change-password-form";

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <section style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "1.7rem", fontWeight: 600 }}>Configurações</h1>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "0.5rem" }}>
          Atlas Particular é um acervo privado. A área administrativa é restrita aos UIDs listados na variável
          <code style={{ background: "var(--bg-hover)", padding: "0 0.3rem", borderRadius: 4 }}>
            NEXT_PUBLIC_ADMIN_UIDS
          </code>{" "}
          e validada pelas <em>Security Rules</em>.
        </p>
        <dl style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
          <div>
            <dt style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>E-mail logado</dt>
            <dd style={{ margin: 0 }}>{user?.email || "—"}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>UID</dt>
            <dd style={{ margin: 0, fontFamily: "monospace", fontSize: "0.85rem" }}>
              {user?.uid || "—"}
            </dd>
          </div>
        </dl>
      </div>

      <ChangePasswordForm />
    </section>
  );
}
