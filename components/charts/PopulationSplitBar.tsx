"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { PopulationDepartement } from "@/types/population";

type Props = {
  department: PopulationDepartement | null;
};

export default function PopulationSplitBar({ department }: Props) {
  const hommesRef = useRef<HTMLSpanElement>(null);
  const femmesRef = useRef<HTMLSpanElement>(null);

  const hommes = department?.hommes.total ?? 0;
  const femmes = department?.femmes.total ?? 0;
  const total = hommes + femmes;
  const hommesPct = total > 0 ? (hommes / total) * 100 : 50;
  const femmesPct = total > 0 ? (femmes / total) * 100 : 50;

  useEffect(() => {
    if (hommesRef.current) {
      gsap.to(hommesRef.current, { width: `${hommesPct}%`, duration: 0.8, ease: "power2.out" });
    }
    if (femmesRef.current) {
      gsap.to(femmesRef.current, { width: `${femmesPct}%`, duration: 0.8, ease: "power2.out" });
    }
  }, [hommesPct, femmesPct]);

  if (!department) return null;

  return (
    <div className="w-full">
      <div className="flex items-center h-3 gap-0.5 mb-2.5">
        <span
          ref={hommesRef}
          className="block h-full rounded-l-full"
          style={{ backgroundColor: "var(--hommes)", width: "50%" }}
        />
        <span
          ref={femmesRef}
          className="block h-full rounded-r-full"
          style={{ backgroundColor: "var(--femmes)", width: "50%" }}
        />
      </div>
      <div className="flex justify-between text-[13.5px] mb-7">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] tracking-wide uppercase text-muted-foreground mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--hommes)" }} />
            Hommes
          </div>
          <div className="text-base font-semibold tabular-nums">{hommes.toLocaleString("fr-FR")}</div>
          <div className="text-xs text-muted-foreground">{hommesPct.toFixed(1)} %</div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-[11px] tracking-wide uppercase text-muted-foreground mb-0.5">
            Femmes
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--femmes)" }} />
          </div>
          <div className="text-base font-semibold tabular-nums">{femmes.toLocaleString("fr-FR")}</div>
          <div className="text-xs text-muted-foreground">{femmesPct.toFixed(1)} %</div>
        </div>
      </div>
    </div>
  );
}
