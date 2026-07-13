"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

// Hauteur de chaque ligne de chiffre, un peu > 1em pour laisser de la place
// aux ascendantes/descendantes de la police serif (sinon les glyphes sont rognés).
const ROW_EM = 1.2;

function mod10(n: number) {
  return ((n % 10) + 10) % 10;
}

function formatDigits(value: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

interface DigitColumnProps {
  from: number;
  to: number;
  direction: 1 | -1;
  duration: number;
  delay: number;
}

function DigitColumn({ from, to, direction, duration, delay }: DigitColumnProps) {
  const stripRef = useRef<HTMLSpanElement>(null);

  const diff =
    from === to ? 0 : direction === 1 ? mod10(to - from) : mod10(to - from) - 10;
  const target = from + diff;
  const base = Math.min(from, target);
  const items = Array.from({ length: Math.abs(diff) + 1 }, (_, k) => mod10(base + k));
  const startOffset = from - base;
  const endOffset = target - base;

  useEffect(() => {
    if (!stripRef.current) return;
    gsap.fromTo(
      stripRef.current,
      { y: `-${startOffset * ROW_EM}em` },
      { y: `-${endOffset * ROW_EM}em`, duration, delay, ease: "power3.out" }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, direction]);

  return (
    <span
      className="inline-block overflow-hidden align-middle tabular-nums"
      style={{ height: `${ROW_EM}em` }}
    >
      <span
        ref={stripRef}
        className="flex flex-col"
        style={{ transform: `translateY(-${startOffset * ROW_EM}em)` }}
      >
        {items.map((d, i) => (
          <span
            key={i}
            className="flex items-center justify-center"
            style={{ height: `${ROW_EM}em` }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

interface OdometerNumberInnerProps {
  value: number;
  className?: string;
  duration: number;
}

function OdometerNumberInner({ value, className, duration }: OdometerNumberInnerProps) {
  const prevValueRef = useRef(0);
  const from = prevValueRef.current;

  const formatted = formatDigits(value);
  const chars = formatted.split("");
  const toDigits = chars.filter((c) => /\d/.test(c)).map(Number);
  const fromDigits = formatDigits(from)
    .replace(/\D/g, "")
    .split("")
    .map(Number);
  const direction: 1 | -1 = value >= from ? 1 : -1;

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  let digitIndex = -1;

  return (
    <span className={className}>
      {chars.map((ch, i) => {
        if (/\d/.test(ch)) {
          digitIndex++;
          const placeFromRight = toDigits.length - 1 - digitIndex;
          return (
            <DigitColumn
              key={i}
              from={fromDigits[digitIndex] ?? 0}
              to={toDigits[digitIndex]}
              direction={direction}
              duration={duration}
              delay={Math.min(placeFromRight * 0.025, 0.15)}
            />
          );
        }
        return (
          <span key={i} className="inline-block" style={{ width: "0.3em" }} />
        );
      })}
    </span>
  );
}

interface OdometerNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

export default function OdometerNumber({
  value,
  className,
  duration = 0.9,
}: OdometerNumberProps) {
  const digitCount = formatDigits(value).replace(/\D/g, "").length;

  return (
    <OdometerNumberInner
      key={digitCount}
      value={value}
      className={className}
      duration={duration}
    />
  );
}
