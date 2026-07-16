"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { TripDoc, TripFormData } from "@/types/trip";
import { useAuth } from "@/lib/auth-context";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { createTrip, updateTrip } from "@/lib/trips-service";
import { uploadTripCover, deleteFromStorage } from "@/lib/storage-service";
import { toInputDate } from "@/utils/date";
import { parseCsv, toCsv } from "@/utils/format";
import { validateImageFile } from "@/utils/validators";
import { AttractionsManager } from "@/components/attractions/attractions-manager";
import styles from "./trip-form-wizard.module.css";

interface Props {
  trip?: TripDoc | null;
}

type Step = "basics" | "dates" | "description" | "cover" | "attractions" | "tags" | "review";

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

export function TripFormWizard({ trip }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const isEditing = !!trip;

  const [currentStep, setCurrentStep] = useState<Step>("basics");
  const [form, setForm] = useState<TripFormData>(
    trip ? fromTrip(trip) : emptyForm(),
  );
  const [tagsInput, setTagsInput] = useState(toCsv(trip?.tags));
  const [travelersInput, setTravelersInput] = useState(
    toCsv(trip?.travelerNames),
  );
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(trip?.id ?? null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const steps: Step[] = ["basics", "dates", "description", "cover", "attractions", "tags", "review"];
  const stepLabels: Record<Step, string> = {
    basics: "Informações básicas",
    dates: "Datas",
    description: "Descrição",
    cover: "Foto de capa",
    attractions: "Atrações",
    tags: "Tags e viajantes",
    review: "Revisar e publicar",
  };

  // Detectar mudanças não salvas
  const hasUnsavedChanges = useMemo(() => {
    if (!trip) return false; // Nova viagem, deixa livres as mudanças
    const original = fromTrip(trip);
    return (
      JSON.stringify(form) !== JSON.stringify(original) ||
      toCsv(trip.tags) !== tagsInput ||
      toCsv(trip.travelerNames) !== travelersInput
    );
  }, [form, trip, tagsInput, travelersInput]);

  useUnsavedChanges(hasUnsavedChanges && !saving);

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

  function canProceedFromStep(step: Step): boolean {
    switch (step) {
      case "basics":
        return !!(form.title && form.destination && form.country);
      case "dates":
        return !!(form.startDate && form.endDate);
      case "description":
        return true;
      case "cover":
        return true;
      case "attractions":
        return true;
      case "tags":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  }

  function canProceed(): boolean {
    return canProceedFromStep(currentStep);
  }

  function goToStep(step: Step) {
    const targetIndex = steps.indexOf(step);
    const currentIndex = steps.indexOf(currentStep);
    if (targetIndex > currentIndex) {
      const firstIncomplete = steps
        .slice(0, targetIndex)
        .find((s) => !canProceedFromStep(s));
      if (firstIncomplete) {
        setCurrentStep(firstIncomplete);
        setError(`Complete a etapa "${stepLabels[firstIncomplete]}" antes de continuar.`);
        setSuccess("");
        return;
      }
    }
    setCurrentStep(step);
    setError("");
    setSuccess("");
  }

  async function nextStep() {
    if (!canProceed()) {
      setError("Por favor, preencha os campos obrigatórios.");
      return;
    }
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex >= steps.length - 1) return;

    const nextStepKey = steps[currentIndex + 1];

    // Auto-save trip before attractions step (for new trips)
    if (nextStepKey === "attractions" && !savedTripId && !isEditing && user) {
      setAutoSaving(true);
      setError("");
      try {
        const payload: TripFormData = {
          ...form,
          tags: parseCsv(tagsInput),
          travelerNames: parseCsv(travelersInput),
          status: "draft",
        };
        const id = await createTrip(user.uid, payload);
        setSavedTripId(id);
        setSuccess(
          "Sua viagem já foi salva como rascunho no painel — mesmo se você sair agora, ela vai continuar lá. Agora adicione suas atrações.",
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao salvar viagem antes de adicionar atrações.",
        );
        setAutoSaving(false);
        return;
      }
      setAutoSaving(false);
    }

    goToStep(nextStepKey);
  }

  function prevStep() {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1]);
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      setError(check.reason || "Arquivo inválido.");
      return;
    }
    setError("");
    setUploadingCover(true);
    try {
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
      setSuccess("Capa enviada com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao subir imagem.");
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
    if (form.status === "published") {
      const firstIncomplete = steps
        .slice(0, steps.indexOf("review"))
        .find((s) => !canProceedFromStep(s));
      if (firstIncomplete) {
        setCurrentStep(firstIncomplete);
        setError(
          `Complete a etapa "${stepLabels[firstIncomplete]}" antes de publicar a viagem.`,
        );
        return;
      }
    }
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
        setSuccess("Viagem atualizada com sucesso!");
        setTimeout(() => router.push("/admin/dashboard"), 1500);
      } else if (savedTripId) {
        // Trip was auto-saved when entering attractions step
        await updateTrip(savedTripId, payload);
        setSuccess("Viagem finalizada com sucesso!");
        setTimeout(() => router.push(`/admin/trips/${savedTripId}`), 1500);
      } else {
        const id = await createTrip(user.uid, payload);
        router.push(`/admin/trips/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar viagem.");
    } finally {
      setSaving(false);
    }
  }

  const progressPercent = ((steps.indexOf(currentStep) + 1) / steps.length) * 100;

  return (
    <div className={styles.wizard}>
      {/* Progress bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Step indicators */}
      <div className={styles.stepIndicators}>
        {steps.map((step, idx) => (
          <button
            key={step}
            type="button"
            onClick={() => goToStep(step)}
            className={`${styles.stepIndicator} ${
              step === currentStep ? styles.stepActive : ""
            } ${steps.indexOf(currentStep) > idx ? styles.stepCompleted : ""}`}
            aria-current={step === currentStep}
          >
            <span className={styles.stepNumber}>{idx + 1}</span>
            <span className={styles.stepLabel}>{stepLabels[step]}</span>
          </button>
        ))}
      </div>

      {/* Form content */}
      <form onSubmit={handleSubmit} className={styles.formContent}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {success && <p className={styles.success}>{success}</p>}

        {/* Step 1: Basics */}
        {currentStep === "basics" && (
          <div className={styles.step}>
            <h2>Informações básicas da viagem</h2>
            <p className={styles.stepDescription}>
              Comece com o título, destino e país.
            </p>

            <div className={styles.field}>
              <label htmlFor="title">Título da viagem *</label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                disabled={saving}
                placeholder="Ex.: Inverno no Japão"
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="destination">Destino principal *</label>
                <input
                  id="destination"
                  type="text"
                  value={form.destination}
                  onChange={(e) => update("destination", e.target.value)}
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
                  disabled={saving}
                  placeholder="Japão"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="state">Estado / Província (opcional)</label>
                <input
                  id="state"
                  type="text"
                  value={form.state || ""}
                  onChange={(e) => update("state", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="city">Cidade (opcional)</label>
                <input
                  id="city"
                  type="text"
                  value={form.city || ""}
                  onChange={(e) => update("city", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dates */}
        {currentStep === "dates" && (
          <div className={styles.step}>
            <h2>Quando foi essa viagem?</h2>
            <p className={styles.stepDescription}>
              Definir as datas ajuda a organizar e lembrar.
            </p>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="startDate">Data de início *</label>
                <input
                  id="startDate"
                  type="date"
                  value={
                    typeof form.startDate === "string"
                      ? form.startDate
                      : toInputDate(form.startDate)
                  }
                  onChange={(e) => update("startDate", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="endDate">Data de fim *</label>
                <input
                  id="endDate"
                  type="date"
                  value={
                    typeof form.endDate === "string"
                      ? form.endDate
                      : toInputDate(form.endDate)
                  }
                  onChange={(e) => update("endDate", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Description */}
        {currentStep === "description" && (
          <div className={styles.step}>
            <h2>Conte como foi</h2>
            <p className={styles.stepDescription}>
              Descreva sua experiência, pontos altos e baixos.
            </p>

            <div className={styles.field}>
              <label htmlFor="generalDescription">Descrição geral</label>
              <textarea
                id="generalDescription"
                rows={5}
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
                  placeholder="Qual foi o ponto alto?"
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
                  placeholder="O que foi mais desafiador?"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="mood">Humor geral</label>
                <input
                  id="mood"
                  type="text"
                  value={form.mood || ""}
                  onChange={(e) => update("mood", e.target.value)}
                  disabled={saving}
                  placeholder="contemplativa, intensa, cansativa"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="notes">Observações</label>
                <textarea
                  id="notes"
                  rows={2}
                  value={form.notes || ""}
                  onChange={(e) => update("notes", e.target.value)}
                  disabled={saving}
                  placeholder="Coisas para lembrar da próxima vez."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Cover Photo */}
        {currentStep === "cover" && (
          <div className={styles.step}>
            <h2>Escolha uma capa</h2>
            <p className={styles.stepDescription}>
              Uma foto representativa da sua viagem.
            </p>

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
                    {uploadingCover
                      ? "Enviando…"
                      : "Clique para enviar uma capa (JPG, PNG ou WEBP)"}
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Attractions */}
        {currentStep === "attractions" && (
          <div className={styles.step}>
            <h2>Atrações e lugares visitados</h2>
            <p className={styles.stepDescription}>
              Adicione os lugares que visitou, com fotos e descrições detalhadas.
            </p>

            {autoSaving ? (
              <p className={styles.loadingMessage}>Salvando viagem…</p>
            ) : savedTripId ? (
              <div className={styles.attractionsSection}>
                <AttractionsManager tripId={savedTripId} />
              </div>
            ) : null}
          </div>
        )}

        {/* Step 6: Tags and Travelers */}
        {currentStep === "tags" && (
          <div className={styles.step}>
            <h2>Tags e viajantes</h2>
            <p className={styles.stepDescription}>
              Organize sua viagem e registre quem estava com você.
            </p>

            <div className={styles.row}>
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
              <label htmlFor="travelerNames">Nomes dos viajantes (separados por vírgula)</label>
              <input
                id="travelerNames"
                type="text"
                value={travelersInput}
                onChange={(e) => setTravelersInput(e.target.value)}
                disabled={saving}
                placeholder="Seu nome, nome do acompanhante"
              />
            </div>
          </div>
        )}

        {/* Step 6: Review and Publish */}
        {currentStep === "review" && (
          <div className={styles.step}>
            <h2>Revisar e publicar</h2>
            <p className={styles.stepDescription}>
              Tudo pronto? Escolha o status e publique.
            </p>

            <div className={styles.reviewCard}>
              <h3>{form.title || "Sem título"}</h3>
              <p className={styles.reviewMeta}>
                {form.destination}, {form.country}
              </p>
              {form.coverImageUrl && (
                <div className={styles.reviewImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImageUrl} alt={form.title} />
                </div>
              )}
              <p className={styles.reviewDescription}>{form.generalDescription}</p>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldset}>
                <div className={styles.fieldsetLegend}>Status da viagem</div>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    value="draft"
                    checked={form.status === "draft"}
                    onChange={() => update("status", "draft")}
                    disabled={saving}
                  />
                  Rascunho (privado - apenas você vê)
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    value="published"
                    checked={form.status === "published"}
                    onChange={() => update("status", "published")}
                    disabled={saving}
                  />
                  Publicada (finalizada)
                </label>
              </div>
            </div>

            {form.status === "published" && (
              <div className={styles.field}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={form.isPublic || false}
                    onChange={(e) => update("isPublic", e.target.checked)}
                    disabled={saving}
                  />
                  Visível na lista pública
                </label>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className={styles.navigationButtons}>
          <button
            type="button"
            onClick={prevStep}
            disabled={steps.indexOf(currentStep) === 0 || saving || autoSaving}
            className={styles.prevBtn}
          >
            ← Anterior
          </button>

          {currentStep === "review" ? (
            <button
              type="submit"
              disabled={saving || autoSaving}
              className={styles.submitBtn}
            >
              {saving ? "Salvando…" : isEditing ? "Salvar alterações" : "Publicar viagem"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => nextStep()}
              disabled={saving || autoSaving}
              className={styles.nextBtn}
            >
              {autoSaving ? "Salvando…" : "Próximo →"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
