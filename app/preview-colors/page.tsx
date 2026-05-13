"use client";

import { useState } from "react";
import styles from "./preview.module.css";

const palettes = [
  {
    name: "Modern Sophisticated",
    vibe: "Profissional, luxuoso, corporativo",
    colors: {
      accent: "#2c5282",
      accentLight: "#4299e1",
      clayWarm: "#d4af37",
      clayWater: "#38b6a8",
      bgPrimary: "#f8f9fa",
      bgSecondary: "#edf2f7",
      textPrimary: "#1a202c",
      textSecondary: "#4a5568",
    },
  },
  {
    name: "Modern Warm",
    vibe: "Aconchegante, elegante, natural",
    colors: {
      accent: "#a85c3c",
      accentLight: "#c97c4c",
      clayWarm: "#d4a574",
      clayWater: "#4a9e83",
      bgPrimary: "#faf7f3",
      bgSecondary: "#f3ede5",
      textPrimary: "#2d2420",
      textSecondary: "#6b5f54",
    },
  },
  {
    name: "Modern Dark Elegance",
    vibe: "Moderno, sofisticado, dark premium",
    colors: {
      accent: "#9f7aea",
      accentLight: "#bb86fc",
      clayWarm: "#e8d4a2",
      clayWater: "#48a9a6",
      bgPrimary: "#1a1a2e",
      bgSecondary: "#16213e",
      textPrimary: "#f0f0f0",
      textSecondary: "#b0b0b0",
    },
  },
  {
    name: "Modern Minimal",
    vibe: "Clean, moderno, minimalista",
    colors: {
      accent: "#2d3748",
      accentLight: "#4a5568",
      clayWarm: "#f6ad55",
      clayWater: "#4fd1c5",
      bgPrimary: "#f7fafc",
      bgSecondary: "#edf2f7",
      textPrimary: "#1a202c",
      textSecondary: "#4a5568",
    },
  },
  {
    name: "Modern Emerald",
    vibe: "Natural, premium, eco-luxury",
    colors: {
      accent: "#055e3d",
      accentLight: "#10b981",
      clayWarm: "#d4a574",
      clayWater: "#34d399",
      bgPrimary: "#f0fdf4",
      bgSecondary: "#f0fdf4",
      textPrimary: "#065f46",
      textSecondary: "#047857",
    },
  },
];

export default function PreviewColorsPage() {
  const [selectedPalette, setSelectedPalette] = useState(0);
  const palette = palettes[selectedPalette];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Visualizador de Paletas de Cores</h1>
        <p>Escolha a paleta que mais gosta e clique em &quot;Aplicar&quot;</p>
      </header>

      <div className={styles.palettesGrid}>
        {palettes.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedPalette(idx)}
            className={`${styles.paletteCard} ${
              idx === selectedPalette ? styles.selected : ""
            }`}
            style={{
              backgroundColor: p.colors.bgPrimary,
              color: p.colors.textPrimary,
              borderColor: p.colors.accent,
            }}
          >
            <h3>{p.name}</h3>
            <p>{p.vibe}</p>
            <div className={styles.colorPreview}>
              <div
                className={styles.colorDot}
                style={{ backgroundColor: p.colors.accent }}
              />
              <div
                className={styles.colorDot}
                style={{ backgroundColor: p.colors.clayWarm }}
              />
              <div
                className={styles.colorDot}
                style={{ backgroundColor: p.colors.clayWater }}
              />
            </div>
          </button>
        ))}
      </div>

      <div
        className={styles.preview}
        style={{
          backgroundColor: palette.colors.bgPrimary,
          color: palette.colors.textPrimary,
        }}
      >
        <div className={styles.previewHeader}>
          <h2>{palette.name}</h2>
          <p className={styles.previewVibe}>{palette.vibe}</p>
        </div>

        {/* Card Preview */}
        <div
          className={styles.previewCard}
          style={{
            backgroundColor: palette.colors.bgSecondary,
            color: palette.colors.textPrimary,
            borderColor: palette.colors.accent,
          }}
        >
          <h3 style={{ color: palette.colors.accent }}>Card com Título</h3>
          <p style={{ color: palette.colors.textSecondary }}>
            Este é um exemplo de como ficaria um card com as cores dessa paleta.
            Todas as cores são cuidadosamente escolhidas para harmonia.
          </p>
          <div className={styles.previewTags}>
            <span
              style={{
                backgroundColor: palette.colors.accent,
                color: "white",
              }}
            >
              Tag 1
            </span>
            <span
              style={{
                backgroundColor: palette.colors.clayWarm,
                color: "white",
              }}
            >
              Tag 2
            </span>
            <span
              style={{
                backgroundColor: palette.colors.clayWater,
                color: "white",
              }}
            >
              Tag 3
            </span>
          </div>
        </div>

        {/* Button Preview */}
        <div className={styles.previewButtons}>
          <button
            style={{
              backgroundColor: palette.colors.accent,
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Botão Primário
          </button>
          <button
            style={{
              backgroundColor: palette.colors.bgSecondary,
              color: palette.colors.textPrimary,
              border: `2px solid ${palette.colors.accent}`,
              padding: "12px 24px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Botão Secundário
          </button>
        </div>

        {/* Color Swatches */}
        <div className={styles.colorSwatches}>
          <div className={styles.swatch}>
            <div
              style={{ backgroundColor: palette.colors.accent }}
              className={styles.swatchColor}
            />
            <p>Accent</p>
            <code>{palette.colors.accent}</code>
          </div>
          <div className={styles.swatch}>
            <div
              style={{ backgroundColor: palette.colors.clayWarm }}
              className={styles.swatchColor}
            />
            <p>Warm</p>
            <code>{palette.colors.clayWarm}</code>
          </div>
          <div className={styles.swatch}>
            <div
              style={{ backgroundColor: palette.colors.clayWater }}
              className={styles.swatchColor}
            />
            <p>Water</p>
            <code>{palette.colors.clayWater}</code>
          </div>
          <div className={styles.swatch}>
            <div
              style={{ backgroundColor: palette.colors.textPrimary }}
              className={styles.swatchColor}
            />
            <p>Text Primary</p>
            <code>{palette.colors.textPrimary}</code>
          </div>
          <div className={styles.swatch}>
            <div
              style={{ backgroundColor: palette.colors.bgPrimary }}
              className={`${styles.swatchColor} ${styles.bordered}`}
            />
            <p>Background</p>
            <code>{palette.colors.bgPrimary}</code>
          </div>
        </div>

        {/* Info */}
        <div className={styles.info}>
          <h3>Detalhes da Paleta</h3>
          <ul>
            <li>
              <strong>Accent:</strong> {palette.colors.accent}
            </li>
            <li>
              <strong>Warm:</strong> {palette.colors.clayWarm}
            </li>
            <li>
              <strong>Water:</strong> {palette.colors.clayWater}
            </li>
            <li>
              <strong>Text Primary:</strong> {palette.colors.textPrimary}
            </li>
            <li>
              <strong>Text Secondary:</strong> {palette.colors.textSecondary}
            </li>
            <li>
              <strong>Background Primary:</strong> {palette.colors.bgPrimary}
            </li>
            <li>
              <strong>Background Secondary:</strong> {palette.colors.bgSecondary}
            </li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          onClick={() => applyPalette(palette.colors)}
          className={styles.applyBtn}
          style={{ backgroundColor: palette.colors.accent, color: "white" }}
        >
          ✓ Aplicar esta paleta
        </button>
        <a href="/" className={styles.backBtn}>
          ← Voltar
        </a>
      </div>
    </div>
  );
}

function applyPalette(colors: Record<string, string>) {
  const message = `Para aplicar a paleta, copie os valores abaixo para globals.css:\n\n${JSON.stringify(colors, null, 2)}`;
  alert(message);
}
