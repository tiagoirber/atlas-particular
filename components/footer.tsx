"use client";

import Link from "next/link";
import styles from "./footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.section}>
          <h3>Atlas Particular</h3>
          <p>Um diário privado de viagens. Destinos, dias, atrações e fotos guardados com cuidado.</p>
        </div>

        <div className={styles.section}>
          <h3>Navegação</h3>
          <ul>
            <li>
              <Link href="/">Início</Link>
            </li>
            <li>
              <Link href="/viagens">Viagens</Link>
            </li>
            <li>
              <Link href="/login">Painel</Link>
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Informações</h3>
          <ul>
            <li>
              <a href="mailto:contact@atlasparticular.local">Contato</a>
            </li>
            <li>
              <a href="#privacidade">Privacidade</a>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.bottom}>
        <p>&copy; {year} Atlas Particular. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
