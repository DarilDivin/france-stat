import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { PopulationDepartement } from "@/types/population";
import { gsap } from "gsap";

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

function formatValue(val: number) {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000)
    return (abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1) + "B";
  if (abs >= 1_000_000)
    return (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + "M";
  if (abs >= 1_000) return (abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + "k";
  return abs.toString();
}

export const legendData = [
  { label: "Hommes", color: "#10b981" },
  { label: "Femmes", color: "#f472b6" },
];

function getColor(label: string) {
  return legendData.find((l) => l.label === label)?.color || "#888";
}

export default function PopulationAgePyramid({ department }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!department || !ref.current) return;

    const data = AGE_LABELS.map(({ key, label }) => ({
      label,
      // Les hommes sont négatifs pour placer leur barre à gauche de l'axe central
      hommes: -(department.hommes[key as keyof typeof department.hommes] ?? 0),
      femmes: department.femmes[key as keyof typeof department.femmes] ?? 0,
    }));

    // Trie du plus grand au plus petit total (hommes + femmes)
    data.sort(
      (a, b) => Math.abs(b.hommes) + b.femmes - (Math.abs(a.hommes) + a.femmes)
    );

    const svgElement = ref.current;
    const width = svgElement.clientWidth || svgElement.width.baseVal.value;
    const height = svgElement.clientHeight || svgElement.height.baseVal.value;

    const margin = { top: 20, right: 20, bottom: 30, left: 20 };

    const svg = d3.select(ref.current);
    // svg.selectAll("*").remove(); // Nettoyage du SVG à chaque render

    // --- AXES ---
    const maxValue =
      d3.max(data, (d) => Math.max(Math.abs(d.hommes), d.femmes)) || 0;

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    // const x = d3
    //   .scaleLinear()
    //   .domain([-maxValue, maxValue])
    //   .range([margin.left, width - margin.right]);

    const labelPadding = 30;
    const x = d3
      .scaleLinear()
      .domain([-maxValue, maxValue])
      .range([margin.left + labelPadding, width - margin.right - labelPadding]);

    // --- BARRES HOMMES ---
    const hommesColor = getColor("Hommes");
    const hommes = svg
      .selectAll<SVGRectElement, (typeof data)[0]>("rect.hommes")
      .data(data, (d) => "hommes-" + d.label);

    hommes
      .enter()
      .append("rect")
      .attr("class", "hommes")
      //   .attr("x", (d) => x(d.hommes))
      .attr("x", x(0))
      .attr("y", (d) => y(d.label)!)
      //   .attr("width", (d) => x(0) - x(d.hommes))
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", hommesColor)
      .on("mousemove", function (event, d) {
        showTooltip(event, d, "Hommes");
      })
      .on("mouseleave", hideTooltip)
      .merge(hommes)
      .attr("fill", hommesColor)
      .each(function (d) {
        gsap.to(this, {
          attr: {
            x: x(d.hommes),
            y: y(d.label)!,
            width: x(0) - x(d.hommes) - 20,
            height: y.bandwidth(),
          },
          duration: 1.5,
          ease: "elastic.out(1, 0.3)",
        });
      });

    hommes.exit().remove();

    // --- BARRES FEMMES ---
    const femmesColor = getColor("Femmes");
    const femmes = svg
      .selectAll<SVGRectElement, (typeof data)[0]>("rect.femmes")
      .data(data, (d) => "femmes-" + d.label);

    femmes
      .enter()
      .append("rect")
      .attr("class", "femmes")
      .attr("x", x(0))
      .attr("y", (d) => y(d.label)!)
      //   .attr("width", (d) => x(d.femmes) - x(0))
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", femmesColor)
      .on("mousemove", function (event, d) {
        showTooltip(event, d, "Femmes");
      })
      .on("mouseleave", hideTooltip)
      .merge(femmes)
      .attr("fill", femmesColor)
      .each(function (d) {
        gsap.to(this, {
          attr: {
            x: x(0) + 20,
            y: y(d.label)!,
            width: x(d.femmes) - x(0) - 20,
            height: y.bandwidth(),
          },
          duration: 1.7,
          ease: "elastic.out(1, 0.3)",
        });
      });

    femmes.exit().remove();

    // --- AXE Y ---
    // let yAxis = svg.select<SVGGElement>(".y-axis");
    // if (yAxis.empty()) {
    //   yAxis = svg
    //     .append("g")
    //     .attr("class", "y-axis")
    //     .attr("transform", `translate(${x(0)},0)`);
    // }
    // yAxis.transition().duration(700).call(d3.axisLeft(y).tickSize(0));

    // Ajoute les labels d'âge au centre de chaque bande
    svg.selectAll(".age-label").remove();
    svg
      .selectAll(".age-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "age-label")
      .attr("x", x(0))
      .attr(
        "y",
        (d) => y(d.label)! + y.bandwidth() / 2 + 3 // Décale légèrement vers le bas
      )
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .attr("fill", "#eee")
      .text((d) => d.label);

    // Labels valeurs hommes (à gauche)
    svg.selectAll(".hommes-value").remove();
    svg
      .selectAll(".hommes-value")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "hommes-value")
      //   .attr("x", (d) => x(d.hommes) - 6)
      .attr("x", (d) => Math.max(margin.left + 2, x(d.hommes) - 6))
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("font-size", 12)
      .attr("fill", hommesColor)
      .text((d) => formatValue(d.hommes));

    // Labels valeurs femmes (à droite)
    svg.selectAll(".femmes-value").remove();
    svg
      .selectAll(".femmes-value")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "femmes-value")
      //   .attr("x", (d) => x(d.femmes) + 6)
      .attr("x", (d) => Math.min(width - margin.right - 2, x(d.femmes) + 6))
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .attr("font-size", 12)
      .attr("fill", femmesColor)
      .text((d) => formatValue(d.femmes));
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

    xAxis
      .selectAll("path.domain")
      .attr("stroke", "#ddd8") // couleur de la ligne principale
      .attr("stroke-width", 2);

    xAxis
      .selectAll("g.tick line")
      .attr("stroke", "#ddd8") // couleur des petites graduations
      .attr("stroke-width", "2"); // pointillés

    xAxis
      .selectAll("g.tick text")
      .attr("fill", "#ddd8") // couleur du texte
      .attr("font-size", 12)
      .attr("font-weight", "bold");


    // Ajoute un div tooltip (hors SVG)
    let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> =
      d3.select<HTMLDivElement, unknown>("#pyramid-tooltip");
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
    <div className="bg-blue-900/00 rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">Pyramide des âges</h3>
      <div className="flex flex-col items-start">
        <div className="flex flex-col px-6">
          {legendData.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span
                className="inline-block w-4 h-4 rounded-full"
                style={{ background: item.color }}
              ></span>
              <span className="text-sm text-white">{item.label}</span>
            </div>
          ))}
        </div>
        <svg ref={ref} width={500} height={220} />
      </div>
    </div>
  );
}
