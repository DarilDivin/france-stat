"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { gsap } from "@/lib/gsap";
import { PopulationDepartement } from "@/types/population";
import { PopulationHistoryEntry } from "@/types/populationHistory";
import FigureHeader from "./FigureHeader";

type Props = {
  department: PopulationDepartement | null;
};

type Point = { year: number; total: number };

const CHART_CONFIG = {
  width: 920,
  height: 260,
  margin: { top: 16, right: 20, bottom: 28, left: 56 },
};

function formatCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + " M";
  if (abs >= 1_000) return (value / 1_000).toFixed(0) + " k";
  return String(value);
}

export default function PopulationTrendChart({ department }: Props) {
  const [history, setHistory] = useState<PopulationHistoryEntry[] | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch("/data/population-history.json")
      .then((res) => res.json())
      .then(setHistory);
  }, []);

  const points: Point[] = useMemo(() => {
    if (!history || !department) return [];

    if (department.id === "FR") {
      const totalsByYear = new Map<number, number>();
      for (const entry of history) {
        for (const [year, total] of Object.entries(entry.series)) {
          totalsByYear.set(Number(year), (totalsByYear.get(Number(year)) ?? 0) + total);
        }
      }
      return [...totalsByYear.entries()]
        .map(([year, total]) => ({ year, total }))
        .sort((a, b) => a.year - b.year);
    }

    const entry = history.find((h) => h.id === department.id);
    if (!entry) return [];
    return Object.entries(entry.series)
      .map(([year, total]) => ({ year: Number(year), total }))
      .sort((a, b) => a.year - b.year);
  }, [history, department]);

  useEffect(() => {
    if (!ref.current || points.length === 0) return;

    const { width, height, margin } = CHART_CONFIG;
    const svg = d3.select(ref.current);
    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

    const x = d3
      .scaleLinear()
      .domain(d3.extent(points, (d) => d.year) as [number, number])
      .range([margin.left, width - margin.right]);

    const [minTotal, maxTotal] = d3.extent(points, (d) => d.total) as [number, number];
    const y = d3
      .scaleLinear()
      .domain([minTotal * 0.96, maxTotal * 1.04])
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<Point>()
      .x((d) => x(d.year))
      .y((d) => y(d.total))
      .curve(d3.curveMonotoneX);

    // Axes
    let xAxis = svg.select<SVGGElement>(".trend-x-axis");
    if (xAxis.empty()) xAxis = svg.append("g").attr("class", "trend-x-axis");
    xAxis
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(7).tickFormat((d) => String(d)).tickSizeOuter(0))
      .call((g) => g.select(".domain").attr("stroke", "var(--border)"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "var(--border)"))
      .call((g) => g.selectAll(".tick text").attr("fill", "var(--muted-foreground)").attr("font-size", 10.5));

    let yAxis = svg.select<SVGGElement>(".trend-y-axis");
    if (yAxis.empty()) yAxis = svg.append("g").attr("class", "trend-y-axis");
    yAxis
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickFormat((d) => formatCompact(d as number)).tickSizeOuter(0))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", "var(--border)")
          .attr("x2", width - margin.left - margin.right)
      )
      .call((g) => g.selectAll(".tick text").attr("fill", "var(--muted-foreground)").attr("font-size", 10.5));

    // Ligne
    let path = svg.select<SVGPathElement>("path.trend-line");
    if (path.empty()) {
      path = svg.append("path").attr("class", "trend-line").attr("fill", "none").attr("stroke", "var(--hommes)").attr("stroke-width", 2);
    }
    path.attr("d", line(points));

    const node = path.node();
    if (node) {
      const length = node.getTotalLength();
      gsap.fromTo(
        node,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 1.1, ease: "power2.out", overwrite: true }
      );
    }

    // Curseur (ligne verticale + point) + tooltip au survol
    let cursorLine = svg.select<SVGLineElement>(".trend-cursor");
    if (cursorLine.empty()) {
      cursorLine = svg
        .append("line")
        .attr("class", "trend-cursor")
        .attr("stroke", "var(--brand)")
        .attr("stroke-width", 1)
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .style("opacity", 0)
        .attr("pointer-events", "none");
    }
    let cursorDot = svg.select<SVGCircleElement>(".trend-dot");
    if (cursorDot.empty()) {
      cursorDot = svg
        .append("circle")
        .attr("class", "trend-dot")
        .attr("r", 4)
        .attr("fill", "var(--brand)")
        .style("opacity", 0)
        .attr("pointer-events", "none");
    }

    let tooltip = d3.select<HTMLDivElement, unknown>("#trend-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append<HTMLDivElement>("div")
        .attr("id", "trend-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "var(--popover)")
        .style("color", "var(--popover-foreground)")
        .style("padding", "6px 10px")
        .style("border-radius", "6px")
        .style("border", "1px solid var(--border)")
        .style("font-size", "12.5px")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
        .style("opacity", 0)
        .style("z-index", "1000")
        .style("transition", "opacity 0.15s ease");
    }

    const bisectYear = d3.bisector<Point, number>((d) => d.year).left;

    svg.select(".trend-overlay").remove();
    svg
      .append("rect")
      .attr("class", "trend-overlay")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const yearAtCursor = x.invert(mx);
        const i = bisectYear(points, yearAtCursor);
        const d = points[Math.max(0, Math.min(points.length - 1, i))];
        if (!d) return;

        cursorLine.attr("x1", x(d.year)).attr("x2", x(d.year)).style("opacity", 1);
        cursorDot.attr("cx", x(d.year)).attr("cy", y(d.total)).style("opacity", 1);

        tooltip
          .html(
            `<div style="font-weight:600;">${d.year}</div><div style="opacity:0.75;">${d.total.toLocaleString("fr-FR")} habitants</div>`
          )
          .style("left", event.pageX + 14 + "px")
          .style("top", event.pageY - 40 + "px")
          .style("opacity", 1);
      })
      .on("mouseleave", () => {
        cursorLine.style("opacity", 0);
        cursorDot.style("opacity", 0);
        tooltip.style("opacity", 0);
      });

    // StrictMode invoque cet effet deux fois au montage sans jamais démonter
    // le SVG entre les deux passes : sans ce cleanup, le second passage
    // démarre un second tween GSAP sur le même trait, qui se battent pour
    // la même valeur de stroke-dashoffset et bloquent l'animation.
    return () => {
      if (node) gsap.killTweensOf(node);
    };
  }, [points]);

  if (!department) return null;

  return (
    <div className="w-full h-full">
      <FigureHeader n={5} title="Évolution de la population (1975-2023)" />
      {points.length > 0 ? (
        <svg ref={ref} className="w-full h-auto max-w-full" />
      ) : (
        <p className="text-sm text-muted-foreground">Historique indisponible pour ce territoire.</p>
      )}
    </div>
  );
}
