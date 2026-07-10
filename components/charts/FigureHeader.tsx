import { ReactNode } from "react";

type Props = {
  n: number;
  title: string;
  right?: ReactNode;
};

export default function FigureHeader({ n, title, right }: Props) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between gap-3 mb-3.5">
        <h3 className="font-display text-[16.5px] font-normal text-foreground">{title}</h3>
        <span className="text-[11.5px] tracking-wide text-muted-foreground shrink-0">
          Fig. {n}
        </span>
      </div>
      {right && <div className="flex flex-wrap items-center gap-4">{right}</div>}
    </div>
  );
}

export function FigureLegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
