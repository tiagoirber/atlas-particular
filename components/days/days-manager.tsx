"use client";

import { useState } from "react";
import { useDays } from "@/hooks/useDays";
import {
  createDay,
  updateDay,
  deleteDay,
} from "@/lib/days-service";
import type { DayDoc, DayFormData } from "@/types/day";
import { toInputDate, formatLongDate } from "@/utils/date";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { describeFirebaseError } from "@/lib/firebase-errors";
import styles from "./days-manager.module.css";

interface Props {
  tripId: string;
  onChanged?: () => void;
}

function emptyDay(order: number): DayFormData {
  return {
    date: "",
    title: "",
    summary: "",
    notes: "",
    order,
  };
}

function fromDoc(day: DayDoc): DayFormData {
  return {
    date: toInputDate(day.date),
    title: day.title || "",
    summary: day.summary || "",
    notes: day.notes || "",
    order: day.order || 0,
  };
}

export function DaysManager({ tripId, onChanged }: Props) {
  const { days, loading, error, refresh } = useDays(tripId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<DayFormData>(emptyDay(0));
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DayDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setDraft(emptyDay(days.length));
    setActionError("");
  }

  function startEdit(day: DayDoc) {
    setCreating(false);
    setEditingId(day.id);
    setDraft(fromDoc(day));
    setActionError("");
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
    setActionError("");
  }

  async function save() {
    if (!draft.date) {
      setActionError("Informe a data do dia.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      if (editingId) {
        await updateDay(tripId, editingId, draft);
      } else {
        await createDay(tripId, draft);
      }
      await refresh();
      onChanged?.();
      cancel();
    } catch (err) {
      setActionError(describeFirebaseError(err, "Erro ao salvar dia."));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const day = pendingDelete;
    if (!day) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteDay(tripId, day.id);
      await refresh();
      onChanged?.();
    } catch (err) {
      setActionError(describeFirebaseError(err, "Erro ao excluir dia."));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2>Dias da viagem</h2>
          <p>Organize a viagem dia a dia. Cada dia pode ter atrações ligadas.</p>
        </div>
        {!creating && !editingId && (
          <button type="button" className={styles.primary} onClick={startCreate}>
            + Novo dia
          </button>
        )}
      </header>

      {actionError && (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {(creating || editingId) && (
        <DayForm
          draft={draft}
          setDraft={setDraft}
          onCancel={cancel}
          onSave={save}
          saving={saving}
          isEditing={!!editingId}
        />
      )}

      {loading ? (
        <p className={styles.empty}>Carregando dias…</p>
      ) : days.length === 0 ? (
        <p className={styles.empty}>Nenhum dia cadastrado ainda.</p>
      ) : (
        <ul className={styles.list}>
          {days.map((day) => (
            <li key={day.id} className={styles.dayCard}>
              <div className={styles.dayHeader}>
                <span className={styles.dayBadge}>Dia {day.order + 1}</span>
                <span className={styles.dayDate}>{formatLongDate(day.date)}</span>
              </div>
              {day.title && <h3>{day.title}</h3>}
              {day.summary && <p className={styles.summary}>{day.summary}</p>}
              {day.notes && <p className={styles.notes}>📝 {day.notes}</p>}
              <div className={styles.cardActions}>
                <button type="button" onClick={() => startEdit(day)} className={styles.linkBtn}>
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(day)}
                  className={`${styles.linkBtn} ${styles.danger}`}
                >
                  🗑️ Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmationDialog
        isOpen={!!pendingDelete}
        title="Excluir dia"
        message={`Excluir o dia "${pendingDelete?.title || (pendingDelete ? formatLongDate(pendingDelete.date) : "")}"? Atrações ligadas a este dia não serão apagadas.`}
        confirmText="Excluir"
        isDangerous
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

interface DayFormProps {
  draft: DayFormData;
  setDraft: (data: DayFormData) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  isEditing: boolean;
}

function DayForm({ draft, setDraft, onCancel, onSave, saving, isEditing }: DayFormProps) {
  return (
    <div className={styles.formCard}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="day-date">Data *</label>
          <input
            id="day-date"
            type="date"
            value={typeof draft.date === "string" ? draft.date : toInputDate(draft.date)}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            disabled={saving}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="day-order">Ordem</label>
          <input
            id="day-order"
            type="number"
            min={0}
            value={draft.order}
            onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
            disabled={saving}
          />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="day-title">Título do dia</label>
          <input
            id="day-title"
            type="text"
            value={draft.title || ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Ex.: Chegada em Tóquio"
            disabled={saving}
          />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="day-summary">Resumo</label>
          <textarea
            id="day-summary"
            rows={3}
            value={draft.summary || ""}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            placeholder="O que aconteceu neste dia em poucas linhas."
            disabled={saving}
          />
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="day-notes">Observações</label>
          <textarea
            id="day-notes"
            rows={2}
            value={draft.notes || ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            disabled={saving}
          />
        </div>
      </div>
      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.secondary} disabled={saving}>
          Cancelar
        </button>
        <button type="button" onClick={onSave} className={styles.primary} disabled={saving}>
          {saving ? "Salvando…" : isEditing ? "Salvar alterações" : "Adicionar dia"}
        </button>
      </div>
    </div>
  );
}
