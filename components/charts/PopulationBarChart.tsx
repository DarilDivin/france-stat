import { useEffect, useRef } from "react";
import * as d3 from "d3";
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
  { key: "ensemble", label: "Ensemble", color: "#3b82f6" },
  { key: "hommes", label: "Hommes", color: "#10b981" },
  { key: "femmes", label: "Femmes", color: "#f472b6" },
];

export default function PopulationBarChart({ department }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!department || !ref.current) return;

    const data = AGE_LABELS.map(({ key, label }) => ({
      label,
      ensemble: department.ensemble[key as keyof typeof department.ensemble] as number | null,
      hommes: department.hommes[key as keyof typeof department.hommes] as number | null,
      femmes: department.femmes[key as keyof typeof department.femmes] as number | null,
    }));

    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(ref.current);

    // On ne supprime pas tout le SVG, seulement axes et légende
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();
    svg.selectAll(".legend-group").remove();

    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const x1 = d3
      .scaleBand()
      .domain(GROUPS.map((g) => g.key))
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.ensemble ?? 0, d.hommes ?? 0, d.femmes ?? 0)) || 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Groupe pour les barres (persistant)
    let barsGroup = svg.select<SVGGElement>(".bars-group");
    if (barsGroup.empty()) {
      barsGroup = svg.append("g").attr("class", "bars-group");
    }

    // DATA JOIN pour chaque groupe d'âge
    const groups = barsGroup.selectAll<SVGGElement, typeof data[0]>("g.bar-group")
      .data(data, d => d.label);

    // ENTER + UPDATE pour les groupes d'âge
    const groupsEnter = groups.enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(${x0(d.label)},0)`);

    groups.merge(groupsEnter)
      .transition()
      .duration(700)
      .attr("transform", d => `translate(${x0(d.label)},0)`);

    // DATA JOIN pour les barres à l'intérieur de chaque groupe
    groups.merge(groupsEnter).each(function(d) {
      const group = d3.select(this);
      const bars = group.selectAll<SVGRectElement, any>("rect")
        .data(GROUPS.map(g => ({
          key: g.key,
          value: d[g.key as "ensemble" | "hommes" | "femmes"] ?? 0,
          color: g.color,
        })), d => d.key);

      // ENTER
      bars.enter()
        .append("rect")
        .attr("x", d => x1(d.key)!)
        .attr("width", x1.bandwidth())
        .attr("y", y(0))
        .attr("height", 0)
        .attr("fill", d => d.color)
        .transition()
        .duration(700)
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value));

      // UPDATE
      bars.transition()
        .duration(700)
        .attr("x", d => x1(d.key)!)
        .attr("width", x1.bandwidth())
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("fill", d => d.color);

      // EXIT
      bars.exit()
        .transition()
        .duration(700)
        .attr("y", y(0))
        .attr("height", 0)
        .remove();
    });

    // Axe X
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0));

    // Axe Y
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));

    // Légende
    const legend = svg.append("g").attr("class", "legend-group").attr("transform", `translate(${width - 120},${margin.top})`);
    GROUPS.forEach((g, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", g.color);
      legend
        .append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(g.label)
        .attr("font-size", 12)
        .attr("fill", "#eee");
    });
  }, [department]);

  if (!department) return null;

  return (
    <div className="bg-background/80 rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">Répartition par tranche d’âge</h3>
      <svg ref={ref} width={400} height={200} />
    </div>
  );
}