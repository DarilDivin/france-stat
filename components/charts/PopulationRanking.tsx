"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { usePopulation } from "@/hooks/usePopulationData";
import FigureHeader from "./FigureHeader";

const RANK_COUNT = 10;

export default function PopulationRanking() {
  const { data, selectedDep, setSelectedDep } = usePopulation();
  const [mode, setMode] = useState<"top" | "bottom">("top");
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const ranked = useMemo(() => {
    if (!data) return [];
    const sorted = [...data]
      .filter((d) => d.ensemble.total != null)
      .sort((a, b) => (b.ensemble.total ?? 0) - (a.ensemble.total ?? 0));
    return mode === "top" ? sorted.slice(0, RANK_COUNT) : sorted.slice(-RANK_COUNT).reverse();
  }, [data, mode]);

  const maxValue = useMemo(
    () => ranked.reduce((m, d) => Math.max(m, d.ensemble.total ?? 0), 0),
    [ranked]
  );

  useEffect(() => {
    ranked.forEach((d) => {
      const el = barRefs.current[d.id];
      if (!el) return;
      const pct = maxValue > 0 ? ((d.ensemble.total ?? 0) / maxValue) * 100 : 0;
      gsap.fromTo(el, { width: "0%" }, { width: `${pct}%`, duration: 0.7, ease: "power2.out" });
    });
  }, [ranked, maxValue]);

  if (!data) return null;

  return (
    <div className="w-full">
      <FigureHeader
        n={4}
        title="Classement des départements"
        right={
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setMode("top")}
              className={
                mode === "top"
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              Plus peuplés
            </button>
            <button
              onClick={() => setMode("bottom")}
              className={
                mode === "bottom"
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              Moins peuplés
            </button>
          </div>
        }
      />

      <div className="space-y-1.5">
        {ranked.map((d, i) => {
          const isSelected = selectedDep?.id === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDep(isSelected ? null : d)}
              className="w-full flex items-center gap-3 group text-left cursor-pointer"
            >
              <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
                {i + 1}
              </span>
              <span className="w-28 sm:w-40 shrink-0 truncate text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {d.nom}
              </span>
              <span className="relative flex-1 h-3 bg-muted rounded-sm overflow-hidden">
                <div
                  ref={(el) => {
                    barRefs.current[d.id] = el;
                  }}
                  className="absolute inset-y-0 left-0 rounded-sm transition-colors duration-300"
                  style={{
                    backgroundColor: isSelected ? "var(--brand)" : "var(--hommes)",
                    width: "0%",
                  }}
                />
              </span>
              <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {(d.ensemble.total ?? 0).toLocaleString("fr-FR")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
