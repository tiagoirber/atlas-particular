"use client";

import { FormEvent, useState } from "react";
import { updatePassword } from "@/lib/auth-utils";
import styles from "./change-password-form.module.css";

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("As senhas não correspondem.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Mudar senha</h2>

      <div className={styles.field}>
        <label htmlFor="newPassword">Nova senha</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="confirmPassword">Confirmar senha</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
          minLength={6}
          placeholder="Digite novamente"
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {success && <p className={styles.success}>✓ Senha atualizada com sucesso!</p>}

      <button type="submit" disabled={loading} className={styles.submit}>
        {loading ? "Atualizando…" : "Atualizar senha"}
      </button>
    </form>
  );
}
