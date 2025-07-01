import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { PopulationDepartement } from "@/types/population";
import { endianness } from "os";
import gsap from "gsap";

type Props = {
  department: PopulationDepartement | null;
};

export default function PopulationPieChart({ department }: Props) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    value: number;
    label: string;
    percent: string;
  } | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const ref = useRef<SVGSVGElement>(null);

  let width = 300;
  let height = 220;

  useEffect(() => {
    if (!department || !ref.current) return;

    // Utilise la même couleur de base mais nuances différentes pour hommes/femmes
    const baseColor = "#10b981";
    const data = [
      {
        label: "Hommes",
        value: department.hommes.total ?? 0,
        color: d3.color(baseColor)!.darker(1.5).formatHex(),
      },
      {
        label: "Femmes",
        value: department.femmes.total ?? 0,
        color: d3.color(baseColor)!.brighter(1.2).formatHex(),
      },
    ];

    const svgElement = ref.current;
    width = svgElement?.width.baseVal.value || 300;
    height = svgElement?.height.baseVal.value || 220;
    const radius = Math.min(width, height) / 2 - 10; // -10 pour éviter de toucher les bords
    const svg = d3.select(ref.current);

    let defs: d3.Selection<SVGDefsElement, unknown, null, undefined> =
      svg.select("defs");
    if (defs.empty()) {
      defs = svg.append("defs");
    }
    data.forEach((d, i) => {
      const gradId = `pie-gradient-${i}`;
      if (defs.select(`#${gradId}`).empty()) {
        const gradient = defs
          .append("linearGradient")
          .attr("id", gradId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%");
        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", d3.color(d.color)!.brighter(0.7).formatHex());
        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", d3.color(d.color)!.darker(1.2).formatHex());
      }
    });

    // On ne supprime pas tout le SVG, seulement la légende
    svg.selectAll(".legend-group").remove();

    const pie = d3
      .pie<{ label: string; value: number; color: string }>()
      .value((d) => d.value)
      .padAngle(0.04) // Espace entre les parts
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number; color: string }>>()
      .innerRadius(radius * 0.12) // Rayon intérieur pour créer un donut
      .outerRadius(radius)
      .cornerRadius(6); // Coins arrondis

    // Groupe central
    let g = svg.select<SVGGElement>(".pie-group");
    if (g.empty()) {
      g = svg.append("g").attr("class", "pie-group");
    }
    g.attr("transform", `translate(${width / 2},${height / 2})`);

    // DATA JOIN
    const arcs = g
      .selectAll<SVGPathElement, d3.PieArcDatum<(typeof data)[0]>>("path")
      .data(pie(data), (d) => d.data.label);

    // ENTER
    arcs
      .enter()
      .append("path")
      // .attr("fill", (d) => (d.data as any).color)
      .attr("fill", (d, i) => `url(#pie-gradient-${i})`)
      .attr("stroke", "transparent")
      .attr("stroke-width", 4)
      .on("mouseover", function (event, d) {
        const rect = (event.target as SVGPathElement).getBoundingClientRect();
        const total = data.reduce((sum, dd) => sum + dd.value, 0);
        const percent = total > 0 ? `${((d.data.value / total) * 100).toFixed(1)}%` : "";
        setTooltip({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.top,
          value: d.data.value,
          label: d.data.label,
          percent,
        });
      })
      .on("mouseout", function () {
        setTooltip(null);
      })
      .each(function (d) {
        // Commence à 0° de remplissage
        (this as any)._current = { ...d, endAngle: d.startAngle };
        // Animation GSAP du remplissage
        gsap.to((this as any)._current, {
          endAngle: d.endAngle,
          duration: 1.5,
          ease: "elastic.out(1, 0.3)",
          onUpdate: () => {
            d3.select(this).attr("d", arc((this as any)._current));
          },
        });
      })
      .attr("d", function (d) {
        // Affiche l'état initial (invisible)
        return arc({ ...d, endAngle: d.startAngle }) || "";
      });

    // UPDATE
    arcs
      .each(function (d) {
        // On récupère l'état courant ou on initialise à la position de départ
        const current = (this as any)._current || {
          ...d,
          endAngle: d.startAngle,
          startAngle: d.startAngle,
        };
        // On crée un objet mutable pour GSAP
        const anim = { ...current };
        gsap.to(anim, {
          startAngle: d.startAngle,
          endAngle: d.endAngle,
          duration: 1.5,
          ease: "elastic.out(1, 0.3)",
          onUpdate: () => {
            d3.select(this).attr("d", arc(anim));
          },
          onComplete: () => {
            (this as any)._current = { ...anim };
          },
        });
      })
      // .attr("fill", (d) => (d.data as any).color);
      .attr("fill", (d, i) => `url(#pie-gradient-${i})`);

    // EXIT
    arcs
      .exit()
      .transition()
      .duration(700)
      .attrTween("d", function (this: SVGPathElement, d) {
        // On fait disparaître l'arc en le réduisant à zéro
        const datum = d as d3.PieArcDatum<{
          label: string;
          value: number;
          color: string;
        }>;
        const i = d3.interpolate((this as any)._current, datum);
        return (t) => arc(i(t)) || "";
      })
      .remove();

    g.selectAll("text.pie-label").remove();

    // Ajoute les nouveaux labels de pourcentage
    const total = data.reduce((sum, d) => sum + d.value, 0);
    // Ajoute les labels carrés au centre de chaque part
    g.selectAll("g.pie-label-group").remove();

    const labelGroups = g
      .selectAll("g.pie-label-group")
      .data(pie(data), (d: any) => d.data.label)
      .enter()
      .append("g")
      .attr("class", "pie-label-group")
      .attr("transform", (d) => {
        const [x, y] = arc.centroid(d as any);
        return `translate(${x},${y})`;
      });

    labelGroups
      .append("rect")
      .attr("x", -18)
      .attr("y", -18)
      .attr("width", 36)
      .attr("height", 36)
      .attr("rx", 8)
      .attr("fill", "#eee3") // couleur de fond, ajuste selon ton thème
      .attr("stroke", "#ffffff80")
      .attr("stroke-width", 1);

    labelGroups
      .append("text")
      .text((d) => {
        const percent = total > 0 ? (d.data.value / total) * 100 : 0;
        return percent > 2 ? `${percent.toFixed(1)}%` : ""; // n'affiche pas les toutes petites parts
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle") // meilleure centrage vertical
      .attr("dy", "0.05em") // léger ajustement vertical
      .attr("fill", "#fff")
      .attr("font-size", 10)
      .attr("font-weight", "bold");

    // Légende
    const legend = svg
      .append("g")
      .attr("class", "legend-group")
      .attr("transform", `translate(0,${height - 50})`);
    data.forEach((d, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 22)
        .attr("rx", 100)
        .attr("ry", 100)
        .attr("width", 16)
        .attr("height", 16)
        .attr("fill", d.color);
      legend
        .append("text")
        .attr("x", 24)
        .attr("y", i * 22 + 13)
        .text(d.label)
        .attr("font-size", 13)
        .attr("fill", "#eeeeee");
    });
  }, [department]);

  useEffect(() => {
    if (tooltip?.visible && tooltipRef.current) {
      gsap.fromTo(
        tooltipRef.current,
        { opacity: 0, y: 10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" }
      );
    }
  }, [tooltip]);

  if (!department) return null;

  return (
    <div className="bg-background/00 rounded-lg p-4 mb-4  w-full flex flex-col justify-center items-start">
      <p className="text-md text-left font-semibold mb-2">Répartition Hommes / Femmes</p>
      <svg
        ref={ref}
        width={400}
        height={220}
        viewBox={`0 0 ${width} ${height}`}
      />
      {tooltip?.visible && (
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            left: tooltip.x + 16,
            top: tooltip.y - 32,
            pointerEvents: "none",
            zIndex: 100,
            background: "rgba(30,30,40,0.97)",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 8,
            boxShadow: "0 2px 12px #0004",
            fontSize: 14,
            fontWeight: 500,
            transition: "box-shadow 0.2s",
          }}
        >
          <div>
            <b>{tooltip.label}</b> -{" "}
            <span style={{ color: "#aaa" }}>{tooltip.percent}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {tooltip.value.toLocaleString("fr-FR")}
          </div>
        </div>
      )}
    </div>
  );
}
