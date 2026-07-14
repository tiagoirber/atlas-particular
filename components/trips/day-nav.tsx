"use client";

import { useEffect, useState } from "react";
import styles from "./day-nav.module.css";

export interface DayNavItem {
  id: string;
  label: string;
}

interface DayNavProps {
  items: DayNavItem[];
}

export function DayNav({ items }: DayNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav className={styles.dayNav} aria-label="Navegação entre dias">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={item.id === activeId ? `${styles.pill} ${styles.active}` : styles.pill}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
