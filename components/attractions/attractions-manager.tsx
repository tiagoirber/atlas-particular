"use client";

import { useMemo, useState, useEffect } from "react";
import { useAttractions } from "@/hooks/useAttractions";
import { useDays } from "@/hooks/useDays";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  createAttraction,
  updateAttraction,
  deleteAttraction,
  setAttractionPhotos,
  setAttractionVideos,
  updateAttractionCover,
} from "@/lib/attractions-service";
import {
  uploadAttractionCover,
  uploadAttractionPhoto,
  uploadAttractionVideo,
  deleteFromStorage,
} from "@/lib/storage-service";
import { validateImageFile } from "@/utils/validators";
import { formatLongDate, toInputDate } from "@/utils/date";
import {
  ATTRACTION_TYPE_LABEL,
  DIFFICULTY_LABEL,
  type AttractionDoc,
  type AttractionFormData,
  type AttractionType,
  type DifficultyLevel,
} from "@/types/attraction";
import type { Photo } from "@/types/photo";
import type { Video } from "@/types/video";
import { PhotoUploader } from "@/components/photos/photo-uploader";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { VideoUploader } from "@/components/photos/video-uploader";
import { VideoGallery } from "@/components/photos/video-gallery";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import styles from "./attractions-manager.module.css";

interface Props {
  tripId: string;
  onChanged?: () => void;
}

const TYPES = Object.keys(ATTRACTION_TYPE_LABEL) as AttractionType[];
const DIFFICULTIES = Object.keys(DIFFICULTY_LABEL) as DifficultyLevel[];

function emptyForm(order: number): AttractionFormData {
  return {
    dayId: "",
    title: "",
    type: "outro",
    visitDate: "",
    description: "",
    notes: "",
    locationName: "",
    googleMapsUrl: "",
    approximateCost: 0,
    currency: "BRL",
    difficulty: "nenhuma",
    rating: 0,
    visitTime: "",
    timeSpent: "",
    requiresGuide: false,
    distanceOrTransfer: "",
    bestTimeToVisit: "",
    whatToBring: "",
    wouldRecommend: false,
    physicalEffortLevel: "nenhuma",
    risksOrWarnings: "",
    coverImageUrl: "",
    coverImagePath: "",
    photos: [],
    videos: [],
    order,
  };
}

function fromDoc(att: AttractionDoc): AttractionFormData {
  return {
    dayId: att.dayId || "",
    title: att.title,
    type: att.type,
    visitDate: toInputDate(att.visitDate),
    description: att.description || "",
    notes: att.notes || "",
    locationName: att.locationName || "",
    googleMapsUrl: att.googleMapsUrl || "",
    approximateCost: att.approximateCost || 0,
    currency: att.currency || "BRL",
    difficulty: att.difficulty || "nenhuma",
    rating: att.rating || 0,
    visitTime: att.visitTime || "",
    timeSpent: att.timeSpent || "",
    requiresGuide: !!att.requiresGuide,
    distanceOrTransfer: att.distanceOrTransfer || "",
    bestTimeToVisit: att.bestTimeToVisit || "",
    whatToBring: att.whatToBring || "",
    wouldRecommend: !!att.wouldRecommend,
    physicalEffortLevel: att.physicalEffortLevel || "nenhuma",
    risksOrWarnings: att.risksOrWarnings || "",
    coverImageUrl: att.coverImageUrl || "",
    coverImagePath: att.coverImagePath || "",
    photos: att.photos || [],
    videos: att.videos || [],
    order: att.order || 0,
  };
}

export function AttractionsManager({ tripId, onChanged }: Props) {
  const { attractions, loading, error, refresh } = useAttractions(tripId);
  const { days } = useDays(tripId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<AttractionFormData>(emptyForm(0));
  const [originalDraft, setOriginalDraft] = useState<AttractionFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [filterDayId, setFilterDayId] = useState<string>("");
  const [pendingDelete, setPendingDelete] = useState<AttractionDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detectar mudanças não salvas
  const hasUnsavedChanges = useMemo(() => {
    if (!editingId || !originalDraft) return false;
    return JSON.stringify(draft) !== JSON.stringify(originalDraft);
  }, [draft, originalDraft, editingId]);

  useUnsavedChanges(hasUnsavedChanges && !saving);

  const filtered = useMemo(() => {
    if (!filterDayId) return attractions;
    return attractions.filter((a) => a.dayId === filterDayId);
  }, [attractions, filterDayId]);

  function startCreate() {
    setEditingId(null);
    setCreating(true);
    const emptyFormData = emptyForm(attractions.length);
    setDraft(emptyFormData);
    setOriginalDraft(emptyFormData);
    setActionError("");
  }

  function startEdit(att: AttractionDoc) {
    setCreating(false);
    setEditingId(att.id);
    const fromDocData = fromDoc(att);
    setDraft(fromDocData);
    setOriginalDraft(fromDocData);
    setActionError("");
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
    setOriginalDraft(null);
    setActionError("");
  }

  async function save() {
    if (!draft.title.trim()) {
      setActionError("Informe o nome da atração.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      if (editingId) {
        await updateAttraction(tripId, editingId, draft);
      } else {
        await createAttraction(tripId, draft);
      }
      await refresh();
      onChanged?.();
      cancel();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao salvar atração.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const att = pendingDelete;
    if (!att) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteAttraction(tripId, att.id);
      await refresh();
      onChanged?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao excluir atração.");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  async function uploadCover(file: File) {
    const check = validateImageFile(file);
    if (!check.ok) {
      setActionError(check.reason || "Arquivo inválido.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      let currentId = editingId;
      if (!currentId) {
        if (!draft.title.trim()) {
          setActionError("Informe o nome da atração antes de fazer upload.");
          setSaving(false);
          return;
        }
        // Auto-save atração antes de fazer upload da foto
        currentId = await createAttraction(tripId, draft);
        setEditingId(currentId);
      }
      const oldPath = draft.coverImagePath;
      const { url, storagePath } = await uploadAttractionCover(tripId, currentId, file);
      await updateAttractionCover(tripId, currentId, url, storagePath);
      setDraft((d) => ({ ...d, coverImageUrl: url, coverImagePath: storagePath }));
      if (oldPath && oldPath !== storagePath) {
        await deleteFromStorage(oldPath).catch(() => undefined);
      }
      await refresh();
      setActionSuccess("✅ Foto da atração enviada com sucesso!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao enviar foto";
      setActionError(`❌ ${errorMsg}. Tente novamente ou verifique sua conexão.`);
      console.error("uploadCover error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function removeCover() {
    if (!editingId) return;
    const path = draft.coverImagePath;
    setDraft((d) => ({ ...d, coverImageUrl: "", coverImagePath: "" }));
    await updateAttractionCover(tripId, editingId, "", "");
    if (path) await deleteFromStorage(path);
    await refresh();
  }

  async function handleUploadPhotos(files: File[]) {
    setSaving(true);
    setActionError("");
    try {
      let currentId = editingId;
      if (!currentId) {
        if (!draft.title.trim()) {
          setActionError("Informe o nome da atração antes de fazer upload.");
          setSaving(false);
          return;
        }
        // Auto-save atração antes de fazer upload das fotos
        currentId = await createAttraction(tripId, draft);
        setEditingId(currentId);
      }
      const uploaded: Photo[] = [];
      const base = draft.photos?.length || 0;
      for (let i = 0; i < files.length; i++) {
        const photo = await uploadAttractionPhoto(tripId, currentId, files[i]);
        uploaded.push({ ...photo, order: base + i });
      }
      const updated = [...(draft.photos || []), ...uploaded];
      await setAttractionPhotos(tripId, currentId, updated);
      setDraft((d) => ({ ...d, photos: updated }));
      await refresh();
      setActionSuccess(`✅ ${files.length} foto(s) adicionada(s) com sucesso!`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao enviar fotos";
      setActionError(`❌ ${errorMsg}. Tente novamente ou verifique sua conexão.`);
      console.error("handleUploadPhotos error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto(photo: Photo) {
    if (!editingId) return;
    const remaining = (draft.photos || []).filter(
      (p) => p.storagePath !== photo.storagePath,
    );
    await setAttractionPhotos(tripId, editingId, remaining);
    setDraft((d) => ({ ...d, photos: remaining }));
    if (photo.storagePath) await deleteFromStorage(photo.storagePath);
    await refresh();
  }

  async function changeCaption(photo: Photo, caption: string) {
    if (!editingId) return;
    const updated = (draft.photos || []).map((p) =>
      p.storagePath === photo.storagePath ? { ...p, caption } : p,
    );
    await setAttractionPhotos(tripId, editingId, updated);
    setDraft((d) => ({ ...d, photos: updated }));
  }

  async function handleUploadVideo(file: File, onProgress: (pct: number) => void) {
    setSaving(true);
    setActionError("");
    try {
      let currentId = editingId;
      if (!currentId) {
        if (!draft.title.trim()) {
          setActionError("Informe o nome da atração antes de fazer upload.");
          setSaving(false);
          return;
        }
        currentId = await createAttraction(tripId, draft);
        setEditingId(currentId);
      }
      const base = draft.videos?.length || 0;
      const video = await uploadAttractionVideo(tripId, currentId, file, onProgress);
      const updated: Video[] = [...(draft.videos || []), { ...video, order: base }];
      await setAttractionVideos(tripId, currentId, updated);
      setDraft((d) => ({ ...d, videos: updated }));
      await refresh();
      setActionSuccess("✅ Vídeo adicionado com sucesso!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao enviar vídeo";
      setActionError(`❌ ${errorMsg}. Tente novamente ou verifique sua conexão.`);
    } finally {
      setSaving(false);
    }
  }

  async function removeVideo(video: Video) {
    if (!editingId) return;
    const remaining = (draft.videos || []).filter((v) =>
      video.youtubeId
        ? v.youtubeId !== video.youtubeId
        : v.storagePath !== video.storagePath,
    );
    await setAttractionVideos(tripId, editingId, remaining);
    setDraft((d) => ({ ...d, videos: remaining }));
    if (video.storagePath) await deleteFromStorage(video.storagePath);
    await refresh();
  }

  async function changeVideoCaption(video: Video, caption: string) {
    if (!editingId) return;
    const updated = (draft.videos || []).map((v) => {
      const match = video.youtubeId
        ? v.youtubeId === video.youtubeId
        : v.storagePath === video.storagePath;
      return match ? { ...v, caption } : v;
    });
    await setAttractionVideos(tripId, editingId, updated);
    setDraft((d) => ({ ...d, videos: updated }));
  }

  async function handleAddYoutubeVideo(youtubeId: string) {
    setSaving(true);
    setActionError("");
    try {
      let currentId = editingId;
      if (!currentId) {
        if (!draft.title.trim()) {
          setActionError("Informe o nome da atração antes de adicionar vídeo.");
          setSaving(false);
          return;
        }
        currentId = await createAttraction(tripId, draft);
        setEditingId(currentId);
      }
      const base = draft.videos?.length || 0;
      const newVideo: Video = {
        url: "",
        storagePath: "",
        youtubeId,
        caption: "",
        order: base,
        uploadedAt: new Date().toISOString(),
      };
      const updated: Video[] = [...(draft.videos || []), newVideo];
      await setAttractionVideos(tripId, currentId, updated);
      setDraft((d) => ({ ...d, videos: updated }));
      await refresh();
      setActionSuccess("✅ Vídeo do YouTube adicionado!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao adicionar vídeo";
      setActionError(`❌ ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  }

  function updateDraft<K extends keyof AttractionFormData>(
    key: K,
    value: AttractionFormData[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2>Atrações</h2>
          <p>Lugares e experiências dessa viagem.</p>
        </div>
        <div className={styles.headerActions}>
          {days.length > 0 && (
            <select
              value={filterDayId}
              onChange={(e) => setFilterDayId(e.target.value)}
              className={styles.filter}
            >
              <option value="">Todos os dias</option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  Dia {d.order + 1} — {d.title || formatLongDate(d.date)}
                </option>
              ))}
            </select>
          )}
          {!creating && !editingId && (
            <button type="button" className={styles.primary} onClick={startCreate}>
              + Nova atração
            </button>
          )}
        </div>
      </header>

      {actionError && <p className={styles.error}>{actionError}</p>}
      {actionSuccess && <p className={styles.success}>{actionSuccess}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {(creating || editingId) && (
        <AttractionForm
          draft={draft}
          isEditing={!!editingId}
          saving={saving}
          days={days}
          onUpdate={updateDraft}
          onCancel={cancel}
          onSave={save}
          onUploadCover={uploadCover}
          onRemoveCover={removeCover}
          onUploadPhotos={handleUploadPhotos}
          onRemovePhoto={removePhoto}
          onCaptionChange={changeCaption}
          onUploadVideo={handleUploadVideo}
          onAddYoutubeVideo={handleAddYoutubeVideo}
          onRemoveVideo={removeVideo}
          onVideoCaptionChange={changeVideoCaption}
        />
      )}

      {loading ? (
        <p className={styles.empty}>Carregando atrações…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>Nenhuma atração nesse filtro.</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((att) => (
            <li key={att.id} className={styles.card}>
              <div className={styles.cardCover}>
                {att.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.coverImageUrl} alt={att.title} />
                ) : (
                  <div className={styles.coverPlaceholder} />
                )}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <span className={styles.badge}>
                    {ATTRACTION_TYPE_LABEL[att.type]}
                  </span>
                  {att.visitDate && (
                    <span className={styles.date}>
                      {formatLongDate(att.visitDate)}
                    </span>
                  )}
                </div>
                <h3>{att.title}</h3>
                {att.locationName && (
                  <p className={styles.location}>{att.locationName}</p>
                )}
                {att.description && (
                  <p className={styles.description}>{att.description}</p>
                )}
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => startEdit(att)}
                    className={styles.linkBtn}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(att)}
                    className={`${styles.linkBtn} ${styles.danger}`}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmationDialog
        isOpen={!!pendingDelete}
        title="Excluir atração"
        message={`Excluir "${pendingDelete?.title}"? Fotos e cover serão removidas.`}
        confirmText="Excluir"
        isDangerous
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

interface FormProps {
  draft: AttractionFormData;
  isEditing: boolean;
  saving: boolean;
  days: { id: string; order: number; title?: string; date: unknown }[];
  onUpdate: <K extends keyof AttractionFormData>(
    key: K,
    value: AttractionFormData[K],
  ) => void;
  onCancel: () => void;
  onSave: () => void;
  onUploadCover: (file: File) => void;
  onRemoveCover: () => void;
  onUploadPhotos: (files: File[]) => Promise<void>;
  onRemovePhoto: (photo: Photo) => void;
  onCaptionChange: (photo: Photo, caption: string) => void;
  onUploadVideo: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  onAddYoutubeVideo: (youtubeId: string) => Promise<void>;
  onRemoveVideo: (video: Video) => void;
  onVideoCaptionChange: (video: Video, caption: string) => void;
}

function AttractionForm({
  draft,
  isEditing,
  saving,
  days,
  onUpdate,
  onCancel,
  onSave,
  onUploadCover,
  onRemoveCover,
  onUploadPhotos,
  onRemovePhoto,
  onCaptionChange,
  onUploadVideo,
  onAddYoutubeVideo,
  onRemoveVideo,
  onVideoCaptionChange,
}: FormProps) {
  return (
    <div className={styles.formCard}>
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Dados principais</h3>
        <div className={styles.formGrid}>
          <div className={`${styles.field} ${styles.full}`}>
            <label>Nome *</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => onUpdate("title", e.target.value)}
              disabled={saving}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Tipo</label>
            <select
              value={draft.type}
              onChange={(e) => onUpdate("type", e.target.value as AttractionType)}
              disabled={saving}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {ATTRACTION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Dia da viagem</label>
            <select
              value={draft.dayId || ""}
              onChange={(e) => onUpdate("dayId", e.target.value)}
              disabled={saving}
            >
              <option value="">— sem dia —</option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  Dia {d.order + 1} {d.title ? `· ${d.title}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Data da visita</label>
            <input
              type="date"
              value={typeof draft.visitDate === "string" ? draft.visitDate : toInputDate(draft.visitDate)}
              onChange={(e) => onUpdate("visitDate", e.target.value)}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label>Hora da visita</label>
            <input
              type="time"
              value={draft.visitTime || ""}
              onChange={(e) => onUpdate("visitTime", e.target.value)}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label>Ordem</label>
            <input
              type="number"
              min={0}
              value={draft.order}
              onChange={(e) => onUpdate("order", Number(e.target.value))}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Foto principal</h3>
        {draft.coverImageUrl ? (
          <div className={styles.coverPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.coverImageUrl} alt="Capa da atração" />
            <button
              type="button"
              className={styles.removeCoverBtn}
              onClick={onRemoveCover}
              disabled={saving}
            >
              Remover capa
            </button>
          </div>
        ) : (
          <PhotoUploader
            label="Enviar foto principal"
            multiple={false}
            disabled={saving}
            onSelect={async (files) => {
              if (files[0]) await onUploadCover(files[0]);
            }}
          />
        )}
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Descrição</h3>
        <div className={styles.formGrid}>
          <div className={`${styles.field} ${styles.full}`}>
            <label>Experiência</label>
            <textarea
              rows={4}
              value={draft.description || ""}
              onChange={(e) => onUpdate("description", e.target.value)}
              disabled={saving}
              placeholder="Como foi a visita."
            />
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <label>Notas pessoais</label>
            <textarea
              rows={2}
              value={draft.notes || ""}
              onChange={(e) => onUpdate("notes", e.target.value)}
              disabled={saving}
              placeholder="Detalhes só para você."
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Localização & logística</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Localização (texto)</label>
            <input
              type="text"
              value={draft.locationName || ""}
              onChange={(e) => onUpdate("locationName", e.target.value)}
              disabled={saving}
              placeholder="Ex.: Shibuya Crossing"
            />
          </div>
          <div className={styles.field}>
            <label>Link Google Maps</label>
            <input
              type="url"
              value={draft.googleMapsUrl || ""}
              onChange={(e) => onUpdate("googleMapsUrl", e.target.value)}
              disabled={saving}
              placeholder="https://maps.google.com/…"
            />
          </div>
          <div className={styles.field}>
            <label>Distância ou deslocamento</label>
            <input
              type="text"
              value={draft.distanceOrTransfer || ""}
              onChange={(e) => onUpdate("distanceOrTransfer", e.target.value)}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label>Tempo gasto</label>
            <input
              type="text"
              value={draft.timeSpent || ""}
              onChange={(e) => onUpdate("timeSpent", e.target.value)}
              disabled={saving}
              placeholder="Ex.: 2h, meio-dia"
            />
          </div>
          <div className={styles.field}>
            <label>Melhor horário para visitar</label>
            <input
              type="text"
              value={draft.bestTimeToVisit || ""}
              onChange={(e) => onUpdate("bestTimeToVisit", e.target.value)}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label>O que levar</label>
            <input
              type="text"
              value={draft.whatToBring || ""}
              onChange={(e) => onUpdate("whatToBring", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Avaliações</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Custo aproximado</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.approximateCost || 0}
              onChange={(e) => onUpdate("approximateCost", Number(e.target.value))}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label>Moeda</label>
            <select
              value={draft.currency || "BRL"}
              onChange={(e) => onUpdate("currency", e.target.value)}
              disabled={saving}
            >
              <option>BRL</option>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>JPY</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Nota pessoal (0 a 5)</label>
            <input
              type="number"
              min={0}
              max={5}
              step={1}
              value={draft.rating || 0}
              onChange={(e) => onUpdate("rating", Number(e.target.value))}
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label>Dificuldade</label>
            <select
              value={draft.difficulty || "nenhuma"}
              onChange={(e) => onUpdate("difficulty", e.target.value as DifficultyLevel)}
              disabled={saving}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Esforço físico</label>
            <select
              value={draft.physicalEffortLevel || "nenhuma"}
              onChange={(e) => onUpdate("physicalEffortLevel", e.target.value as DifficultyLevel)}
              disabled={saving}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={!!draft.requiresGuide}
                onChange={(e) => onUpdate("requiresGuide", e.target.checked)}
                disabled={saving}
              />
              Requer guia
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={!!draft.wouldRecommend}
                onChange={(e) => onUpdate("wouldRecommend", e.target.checked)}
                disabled={saving}
              />
              Recomendaria
            </label>
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <label>Riscos ou pontos de atenção</label>
            <textarea
              rows={2}
              value={draft.risksOrWarnings || ""}
              onChange={(e) => onUpdate("risksOrWarnings", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Galeria de fotos</h3>
        <PhotoUploader
          label="Adicionar fotos à galeria"
          multiple
          disabled={saving}
          onSelect={onUploadPhotos}
        />
        <PhotoGallery
          photos={draft.photos || []}
          editable
          onRemove={onRemovePhoto}
          onCaptionChange={onCaptionChange}
        />
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Vídeos</h3>
        <VideoUploader
          label="Adicionar vídeo"
          disabled={saving}
          onSelect={onUploadVideo}
          onAddYoutube={onAddYoutubeVideo}
        />
        <VideoGallery
          videos={draft.videos || []}
          editable
          onRemove={onRemoveVideo}
          onCaptionChange={onVideoCaptionChange}
        />
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.secondary}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          className={styles.primary}
          disabled={saving}
        >
          {saving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar atração"}
        </button>
      </div>
    </div>
  );
}
