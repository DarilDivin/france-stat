import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import { PopulationDepartement } from "@/types/population";

type Props = {
  department: PopulationDepartement | null;
};

const AGE_LABELS = [
  { key: "0_19", label: "0-19" },
  { key: "20_39", label: "20-39" },
  { key: "40_59", label: "40-59" },
  { key: "60_74", label: "60-74" },
  { key: "75_plus", label: "75+" },
];

const GROUPS = [
  { key: "ensemble", label: "Ensemble", color: "#2563eb" }, // Bleu foncé
  { key: "hommes", label: "Hommes", color: "#60a5fa" }, // Bleu moyen
  { key: "femmes", label: "Femmes", color: "#93c5fd" }, // Bleu clair
];

export default function PopulationBarChart({ department }: Props) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    value: number;
    label: string;
    group: string;
  } | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!department || !ref.current) return;

    const data = AGE_LABELS.map(({ key, label }) => ({
      label,
      ensemble: department.ensemble[key as keyof typeof department.ensemble] as
        | number
        | null,
      hommes: department.hommes[key as keyof typeof department.hommes] as
        | number
        | null,
      femmes: department.femmes[key as keyof typeof department.femmes] as
        | number
        | null,
    }));

    const svgElement = ref.current;
    const width = svgElement?.width.baseVal.value || 500;
    const height = svgElement?.height.baseVal.value || 200;
    // const margin = { top: 20, right: 30, bottom: 30, left: 30 };

    console.log(width);

    // Declare x0 first to use it in margin calculation
    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, width]) // temporary, will update after margin calculation
      .padding(0.2);

    // Calculate totalBarWidth and margins after x0 is declared
    const totalBarWidth = x0.step() * data.length;
    const leftMargin = (width - totalBarWidth) / 2;
    const margin = { top: 20, right: leftMargin, bottom: 30, left: leftMargin };

    // Update x0 range with correct margins
    x0.range([margin.left, width - margin.right]);

    const svg = d3.select(ref.current);

    // Ajoute ce code juste après const svg = d3.select(ref.current);
    const defs = svg.select("defs").empty()
      ? svg.append("defs")
      : svg.select("defs");

    // Pour chaque groupe (ensemble, hommes, femmes), crée un gradient unique
    GROUPS.forEach((g) => {
      const gradId = `bar-gradient-${g.key}`;
      if (defs.select(`#${gradId}`).empty()) {
        const gradient = defs
          .append("linearGradient")
          .attr("id", gradId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");
        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", d3.color(g.color)!.brighter(0.7).formatHex());
        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", d3.color(g.color)!.darker(1.2).formatHex());
      }
    });

    // On ne supprime pas tout le SVG, seulement axes et légende
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();
    svg.selectAll(".legend-group").remove();

    const x1 = d3
      .scaleBand()
      .domain(GROUPS.map((g) => g.key))
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) =>
          Math.max(d.ensemble ?? 0, d.hommes ?? 0, d.femmes ?? 0)
        ) || 0,
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Groupe pour les barres (persistant)
    let barsGroup = svg.select<SVGGElement>(".bars-group");
    if (barsGroup.empty()) {
      barsGroup = svg.append("g").attr("class", "bars-group");
    }

    // DATA JOIN pour chaque groupe d'âge
    const groups = barsGroup
      .selectAll<SVGGElement, (typeof data)[0]>("g.bar-group")
      .data(data, (d) => d.label);

    // ENTER + UPDATE pour les groupes d'âge
    const groupsEnter = groups
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", (d) => `translate(${x0(d.label)},0)`);

    groups
      .merge(groupsEnter)
      .transition()
      .duration(700)
      .attr("transform", (d) => `translate(${x0(d.label)},0)`);

    // DATA JOIN pour les barres à l'intérieur de chaque groupe
    groups.merge(groupsEnter).each(function (d) {
      const group = d3.select(this);
      const bars = group.selectAll<SVGRectElement, any>("rect").data(
        GROUPS.map((g) => ({
          key: g.key,
          value: d[g.key as "ensemble" | "hommes" | "femmes"] ?? 0,
          color: g.color,
        })),
        (d) => d.key
      );

      // ENTER
      bars
        .enter()
        .append("rect")
        .attr("x", (d) => x1(d.key)!)
        .attr("width", x1.bandwidth())
        .attr("y", y(0))
        .attr("height", 0)
        // .attr("fill", (d) => d.color)
        .attr("fill", (d) => `url(#bar-gradient-${d.key})`)
        .attr("rx", 6)
        .attr("ry", 6)
        .each(function (d) {
          // Animate each bar's height individually
          gsap.to(this, {
            delay: 0.1 * GROUPS.findIndex((g) => g.key === d.key), // stagger by group
            duration: 0.7,
            attr: {
              y: y(d.value),
              height: y(0) - y(d.value),
            },
            ease: "elastic.out(1,0.3)",
            overwrite: "auto",
          });
        });

      // UPDATE
      bars.each(function (d) {
        gsap.to(this, {
          delay: 0.1 * GROUPS.findIndex((g) => g.key === d.key), // stagger by group
          duration: 0.7,
          attr: {
            x: x1(d.key)!,
            width: x1.bandwidth(),
            y: y(d.value),
            height: y(0) - y(d.value),
            // fill: d.color,
            fill: `url(#bar-gradient-${d.key})`,
          },
          ease: "elastic.out(1,0.3)",
          overwrite: "auto",
        });
      });

      // EXIT
      bars
        .exit()
        .each(function () {
          gsap.to(this, { opacity: 0, y: y(0), duration: 0.5 });
        })
        .transition()
        .duration(700)
        .attr("y", y(0))
        .attr("height", 0)
        .remove();

      //   bars
      //     .on("mouseover", function (_, d) {
      //       gsap.to(this, {
      //         scaleX: 1.15,
      //         transformOrigin: "50% 100%",
      //         duration: 0.2,
      //         filter: "brightness(1.2)",
      //       });
      //     })
      //     .on("mouseout", function () {
      //       gsap.to(this, { scaleX: 1, filter: "brightness(1)", duration: 0.2 });
      //     });

      bars
        .on("mouseover", function (event, d) {
          const rect = (event.target as SVGRectElement).getBoundingClientRect();
          setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top,
            value: d.value,
            label: (
              d3.select(this.parentNode as SVGGElement).datum() as {
                label: string;
              }
            ).label,
            group: GROUPS.find((g) => g.key === d.key)?.label ?? d.key,
          });
          gsap.to(this, {
            scaleX: 1.15,
            transformOrigin: "50% 100%",
            duration: 0.2,
            filter: "brightness(1.2)",
          });
        })
        .on("mouseout", function () {
          setTooltip(null);
          gsap.to(this, { scaleX: 1, filter: "brightness(1)", duration: 0.2 });
        });
    });

    // Axe X (labels uniquement, sans la barre de l'axe)
    const xAxisGroup = svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom + 10})`);

    // Ajoute uniquement les labels, sans la ligne de l'axe
    xAxisGroup
      .call(d3.axisBottom(x0).tickSize(0))
      .call((g) => g.select(".domain").remove()); // retire la ligne de l'axe

    // Axe Y
    // svg
    //   .append("g")
    //   .attr("class", "y-axis")
    //   .attr("transform", `translate(${margin.left},0)`)
    //   .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));

    // Légende
    const legend = svg
      .append("g")
      .attr("class", "legend-group")
      .attr("transform", `translate(${width - 120},${margin.top})`);
    GROUPS.forEach((g, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", g.color)
        .attr("rx", 3)
        .attr("ry", 3);
      legend
        .append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(g.label)
        .attr("font-size", 12)
        .attr("fill", "#eee");
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
    <div id="my_dataviz" className="bg-transparent rounded-lg p-4 mb-4 ">
      <h3 className="text-lg font-bold mb-2 text-left ml-[30]">
        Répartition par tranche d’âge
      </h3>
      <svg ref={ref} width={500} height={200} />

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
            {tooltip.label} -{" "}
            <span style={{ color: "#aaa" }}>{tooltip.group}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {tooltip.value.toLocaleString("fr-FR")}
          </div>
        </div>
      )}
    </div>
  );
}
