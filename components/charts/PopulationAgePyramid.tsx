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

export default function PopulationAgePyramid({ department }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!department || !ref.current) return;

    const data = AGE_LABELS.map(({ key, label }) => ({
      label,
      hommes: -(department.hommes[key as keyof typeof department.hommes] ?? 0),
      femmes: department.femmes[key as keyof typeof department.femmes] ?? 0,
    }));

    // Trie du plus grand au plus petit total (hommes + femmes)
    data.sort(
      (a, b) => Math.abs(b.hommes) + b.femmes - (Math.abs(a.hommes) + a.femmes)
    );

    const width = 400;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };

    const svg = d3.select(ref.current);

    // --- AXES ---
    const maxValue =
      d3.max(data, (d) => Math.max(Math.abs(d.hommes), d.femmes)) || 0;

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    const x = d3
      .scaleLinear()
      .domain([-maxValue, maxValue])
      .range([margin.left, width - margin.right]);

    // --- BARRES HOMMES ---
    const hommes = svg
      .selectAll<SVGRectElement, (typeof data)[0]>("rect.hommes")
      .data(data, (d) => d.label);

    hommes
      .enter()
      .append("rect")
      .attr("class", "hommes")
      .attr("x", (d) => x(d.hommes))
      .attr("y", (d) => y(d.label)!)
      .attr("width", (d) => x(0) - x(d.hommes))
      .attr("height", y.bandwidth())
      .attr("fill", "#10b981")
      .on("mousemove", function (event, d) {
        showTooltip(event, d, "Hommes");
      })
      .on("mouseleave", hideTooltip)
      .merge(hommes)
      .transition()
      .duration(700)
      .attr("y", (d) => y(d.label)!)
      .attr("x", (d) => x(d.hommes))
      .attr("width", (d) => x(0) - x(d.hommes))
      .attr("height", y.bandwidth());

    hommes.exit().remove();

    // --- BARRES FEMMES ---
    const femmes = svg
      .selectAll<SVGRectElement, (typeof data)[0]>("rect.femmes")
      .data(data, (d) => d.label);

    femmes
      .enter()
      .append("rect")
      .attr("class", "femmes")
      .attr("x", x(0))
      .attr("y", (d) => y(d.label)!)
      .attr("width", (d) => x(d.femmes) - x(0))
      .attr("height", y.bandwidth())
      .attr("fill", "#f472b6")
      .on("mousemove", function (event, d) {
        showTooltip(event, d, "Femmes");
      })
      .on("mouseleave", hideTooltip)
      .merge(femmes)
      .transition()
      .duration(700)
      .attr("y", (d) => y(d.label)!)
      .attr("x", x(0))
      .attr("width", (d) => x(d.femmes) - x(0))
      .attr("height", y.bandwidth());

    femmes.exit().remove();

    // --- AXE Y ---
    let yAxis = svg.select<SVGGElement>(".y-axis");
    if (yAxis.empty()) {
      yAxis = svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${x(0)},0)`);
    }
    yAxis.transition().duration(700).call(d3.axisLeft(y).tickSize(0));

    // --- AXE X ---
    let xAxis = svg.select<SVGGElement>(".x-axis");
    if (xAxis.empty()) {
      xAxis = svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`);
    }
    xAxis
      .transition()
      .duration(700)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((d) => Math.abs(Number(d)).toLocaleString())
      );

    // Légende
    svg.selectAll(".legend-group").remove();
    const legend = svg
      .append("g")
      .attr("class", "legend-group")
      .attr("transform", `translate(${width - 120},${margin.top})`);

    const legendData = [
      { label: "Hommes", color: "#10b981" },
      { label: "Femmes", color: "#f472b6" },
    ];

    legendData.forEach((item, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 22)
        .attr("width", 16)
        .attr("height", 16)
        .attr("fill", item.color);
      legend
        .append("text")
        .attr("x", 24)
        .attr("y", i * 22 + 13)
        .text(item.label)
        .attr("font-size", 13)
        .attr("fill", "#eee");
    });

    // ...après la création de svg...
    // Ajoute un div tooltip (hors SVG)
    let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> = d3.select<HTMLDivElement, unknown>("#pyramid-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append<HTMLDivElement>("div")
        .attr("id", "pyramid-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "#222")
        .style("color", "#fff")
        .style("padding", "6px 12px")
        .style("border-radius", "6px")
        .style("font-size", "14px")
        .style("opacity", 0)
        .style("z-index", 50);

    }

    // Fonction d'affichage du tooltip
    function showTooltip(event: MouseEvent, d: any, sexe: string) {
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${d.label}</strong><br>${sexe} : ${Math.abs(
            sexe === "Hommes" ? d.hommes : d.femmes
          ).toLocaleString()}`
        )
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    }
    function hideTooltip() {
      tooltip.style("opacity", 0);
    }
  }, [department]);

  if (!department) return null;

  return (
    <div className="bg-background/80 rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">Pyramide des âges</h3>
      <svg ref={ref} width={400} height={220} />
    </div>
  );
}
