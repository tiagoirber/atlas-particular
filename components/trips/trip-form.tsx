"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TripDoc, TripFormData } from "@/types/trip";
import { useAuth } from "@/lib/auth-context";
import { createTrip, updateTrip } from "@/lib/trips-service";
import { uploadTripCover, deleteFromStorage } from "@/lib/storage-service";
import { describeFirebaseError } from "@/lib/firebase-errors";
import { toInputDate } from "@/utils/date";
import { parseCsv, toCsv } from "@/utils/format";
import { validateImageFile } from "@/utils/validators";
import styles from "./trip-form.module.css";

interface Props {
  trip?: TripDoc | null;
}

function emptyForm(): TripFormData {
  return {
    title: "",
    destination: "",
    country: "",
    state: "",
    city: "",
    startDate: "",
    endDate: "",
    generalDescription: "",
    notes: "",
    mood: "",
    bestMoment: "",
    worstMoment: "",
    coverImageUrl: "",
    coverImagePath: "",
    approximateTotalCost: 0,
    currency: "BRL",
    generalRating: 0,
    wouldReturn: false,
    wouldReturnNote: "",
    travelers: 1,
    travelerNames: [],
    tags: [],
    status: "draft",
    isPublic: false,
  };
}

function fromTrip(trip: TripDoc): TripFormData {
  return {
    title: trip.title || "",
    destination: trip.destination || "",
    country: trip.country || "",
    state: trip.state || "",
    city: trip.city || "",
    startDate: toInputDate(trip.startDate),
    endDate: toInputDate(trip.endDate),
    generalDescription: trip.generalDescription || "",
    notes: trip.notes || "",
    mood: trip.mood || "",
    bestMoment: trip.bestMoment || "",
    worstMoment: trip.worstMoment || "",
    coverImageUrl: trip.coverImageUrl || "",
    coverImagePath: trip.coverImagePath || "",
    approximateTotalCost: trip.approximateTotalCost || 0,
    currency: trip.currency || "BRL",
    generalRating: trip.generalRating || 0,
    wouldReturn: !!trip.wouldReturn,
    wouldReturnNote: trip.wouldReturnNote || "",
    travelers: trip.travelers || 1,
    travelerNames: trip.travelerNames || [],
    tags: trip.tags || [],
    status: trip.status || "draft",
    isPublic: !!trip.isPublic,
  };
}

export function TripForm({ trip }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const isEditing = !!trip;

  const [form, setForm] = useState<TripFormData>(
    trip ? fromTrip(trip) : emptyForm(),
  );
  const [tagsInput, setTagsInput] = useState(toCsv(trip?.tags));
  const [travelersInput, setTravelersInput] = useState(
    toCsv(trip?.travelerNames),
  );
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (trip) {
      setForm(fromTrip(trip));
      setTagsInput(toCsv(trip.tags));
      setTravelersInput(toCsv(trip.travelerNames));
    }
  }, [trip]);

  function update<K extends keyof TripFormData>(key: K, value: TripFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset para permitir re-upload do mesmo nome
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      setError(check.reason || "Arquivo inválido.");
      return;
    }
    setError("");
    setUploadingCover(true);
    try {
      // Para uma viagem ainda não criada, usar um id temporário; após salvar
      // a primeira vez, a próxima edição usará o tripId real.
      const tripId = trip?.id || `tmp-${Date.now().toString(36)}`;
      const oldPath = form.coverImagePath;
      const { url, storagePath } = await uploadTripCover(tripId, file);
      setForm((prev) => ({
        ...prev,
        coverImageUrl: url,
        coverImagePath: storagePath,
      }));
      if (oldPath && oldPath !== storagePath) {
        deleteFromStorage(oldPath).catch(() => undefined);
      }
    } catch (err) {
      setError(describeFirebaseError(err, "Erro ao subir imagem."));
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleRemoveCover() {
    const path = form.coverImagePath;
    setForm((prev) => ({ ...prev, coverImageUrl: "", coverImagePath: "" }));
    if (path) await deleteFromStorage(path);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: TripFormData = {
        ...form,
        tags: parseCsv(tagsInput),
        travelerNames: parseCsv(travelersInput),
      };
      if (isEditing && trip) {
        await updateTrip(trip.id, payload);
        setSuccess("Viagem atualizada.");
      } else {
        const id = await createTrip(user.uid, payload);
        router.push(`/admin/trips/${id}`);
        return;
      }
    } catch (err) {
      setError(describeFirebaseError(err, "Erro ao salvar viagem."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {success && <p className={styles.success}>{success}</p>}

      <fieldset className={styles.section}>
        <legend>Foto de capa</legend>
        <div className={styles.coverArea}>
          {form.coverImageUrl ? (
            <div className={styles.coverPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.coverImageUrl} alt="Capa da viagem" />
              <button
                type="button"
                onClick={handleRemoveCover}
                className={styles.removeCoverBtn}
                disabled={uploadingCover}
              >
                Remover
              </button>
            </div>
          ) : (
            <label className={styles.coverDrop}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                disabled={uploadingCover || saving}
              />
              <span>
                {uploadingCover ? "Enviando…" : "Clique para enviar uma capa (JPG, PNG ou WEBP)"}
              </span>
            </label>
          )}
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend>Informações básicas</legend>
        <div className={styles.field}>
          <label htmlFor="title">Título *</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            disabled={saving}
            placeholder="Ex.: Inverno no Japão"
          />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="destination">Destino *</label>
            <input
              id="destination"
              type="text"
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              required
              disabled={saving}
              placeholder="Ex.: Tóquio"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="country">País *</label>
            <input
              id="country"
              type="text"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              required
              disabled={saving}
              placeholder="Japão"
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="state">Estado / Província</label>
            <input
              id="state"
              type="text"
              value={form.state || ""}
              onChange={(e) => update("state", e.target.value)}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="city">Cidade</label>
            <input
              id="city"
              type="text"
              value={form.city || ""}
              onChange={(e) => update("city", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="startDate">Data de início *</label>
            <input
              id="startDate"
              type="date"
              value={typeof form.startDate === "string" ? form.startDate : toInputDate(form.startDate)}
              onChange={(e) => update("startDate", e.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="endDate">Data de fim *</label>
            <input
              id="endDate"
              type="date"
              value={typeof form.endDate === "string" ? form.endDate : toInputDate(form.endDate)}
              onChange={(e) => update("endDate", e.target.value)}
              required
              disabled={saving}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="tags">Tags (separadas por vírgula)</label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            disabled={saving}
            placeholder="solo, gastronomia, neve"
          />
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend>Relato</legend>
        <div className={styles.field}>
          <label htmlFor="generalDescription">Descrição geral</label>
          <textarea
            id="generalDescription"
            rows={6}
            value={form.generalDescription || ""}
            onChange={(e) => update("generalDescription", e.target.value)}
            disabled={saving}
            placeholder="Conte como foi essa viagem em linhas gerais."
          />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="bestMoment">Melhor momento</label>
            <textarea
              id="bestMoment"
              rows={3}
              value={form.bestMoment || ""}
              onChange={(e) => update("bestMoment", e.target.value)}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="worstMoment">Pior momento</label>
            <textarea
              id="worstMoment"
              rows={3}
              value={form.worstMoment || ""}
              onChange={(e) => update("worstMoment", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="notes">Observações gerais</label>
          <textarea
            id="notes"
            rows={4}
            value={form.notes || ""}
            onChange={(e) => update("notes", e.target.value)}
            disabled={saving}
            placeholder="Coisas que você quer lembrar para a próxima vez."
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="mood">Humor geral</label>
          <input
            id="mood"
            type="text"
            value={form.mood || ""}
            onChange={(e) => update("mood", e.target.value)}
            disabled={saving}
            placeholder="Ex.: contemplativa, intensa, cansativa"
          />
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend>Detalhes</legend>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="cost">Custo total aproximado</label>
            <input
              id="cost"
              type="number"
              min={0}
              step="0.01"
              value={form.approximateTotalCost || 0}
              onChange={(e) => update("approximateTotalCost", Number(e.target.value))}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="currency">Moeda</label>
            <select
              id="currency"
              value={form.currency || "BRL"}
              onChange={(e) => update("currency", e.target.value)}
              disabled={saving}
            >
              <option>BRL</option>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>JPY</option>
            </select>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="rating">Nota geral (0 a 5)</label>
            <input
              id="rating"
              type="number"
              min={0}
              max={5}
              step={1}
              value={form.generalRating || 0}
              onChange={(e) => update("generalRating", Number(e.target.value))}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="travelers">Número de viajantes</label>
            <input
              id="travelers"
              type="number"
              min={1}
              value={form.travelers || 1}
              onChange={(e) => update("travelers", Number(e.target.value))}
              disabled={saving}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="travelerNames">Nomes (separados por vírgula)</label>
          <input
            id="travelerNames"
            type="text"
            value={travelersInput}
            onChange={(e) => setTravelersInput(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.wouldReturn || false}
              onChange={(e) => update("wouldReturn", e.target.checked)}
              disabled={saving}
            />
            Voltaria a esse destino
          </label>
        </div>
        <div className={styles.field}>
          <label htmlFor="wouldReturnNote">Comentário sobre voltar</label>
          <textarea
            id="wouldReturnNote"
            rows={2}
            value={form.wouldReturnNote || ""}
            onChange={(e) => update("wouldReturnNote", e.target.value)}
            disabled={saving}
          />
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend>Publicação</legend>
        <div className={styles.field}>
          <label className={styles.radio}>
            <input
              type="radio"
              value="draft"
              checked={form.status === "draft"}
              onChange={() => update("status", "draft")}
              disabled={saving}
            />
            Rascunho (privado)
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              value="published"
              checked={form.status === "published"}
              onChange={() => update("status", "published")}
              disabled={saving}
            />
            Finalizada
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.isPublic || false}
              onChange={(e) => update("isPublic", e.target.checked)}
              disabled={saving}
            />
            Visível na lista pública (precisa estar Finalizada para aparecer)
          </label>
        </div>
      </fieldset>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => router.back()}
          className={styles.cancel}
          disabled={saving}
        >
          Cancelar
        </button>
        <button type="submit" disabled={saving} className={styles.submit}>
          {saving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar viagem"}
        </button>
      </div>
    </form>
  );
}
