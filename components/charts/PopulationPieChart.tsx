import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { PopulationDepartement } from "@/types/population";

type Props = {
  department: PopulationDepartement | null;
};

export default function PopulationPieChart({ department }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!department || !ref.current) return;

    const data = [
      {
        label: "Hommes",
        value: department.hommes.total ?? 0,
        color: "#10b981",
      },
      {
        label: "Femmes",
        value: department.femmes.total ?? 0,
        color: "#f472b6",
      },
    ];

    const width = 220,
      height = 220,
      radius = 90;
    const svg = d3.select(ref.current);

    // On ne supprime pas tout le SVG, seulement la légende
    svg.selectAll(".legend-group").remove();

    const pie = d3
      .pie<{ label: string; value: number; color: string }>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number; color: string }>>()
      .innerRadius(0)
      .outerRadius(radius);

    // Groupe central
    let g = svg.select<SVGGElement>(".pie-group");
    if (g.empty()) {
      g = svg
        .append("g")
        .attr("class", "pie-group")
        .attr("transform", `translate(${width / 2},${height / 2})`);
    }

    // DATA JOIN
    const arcs = g
      .selectAll<SVGPathElement, d3.PieArcDatum<(typeof data)[0]>>("path")
      .data(pie(data), (d) => d.data.label);

    // ENTER
    arcs
      .enter()
      .append("path")
      .attr("fill", (d) => (d.data as any).color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .each(function (d) {
        (this as any)._current = d;
      }) // stocke l'état initial
      .attr("d", arc as any)
      .transition()
      .duration(700)
      .attrTween("d", function (this: SVGPathElement, d) {
        const i = d3.interpolate((this as any)._current, d);
        (this as any)._current = i(1);
        return (t) => arc(i(t)) || "";
      });

    // UPDATE
    arcs
      .transition()
      .duration(700)
      .attrTween("d", function (this: SVGPathElement, d) {
        const i = d3.interpolate((this as any)._current, d);
        (this as any)._current = i(1);
        return (t) => arc(i(t)) || "";
      })
      .attr("fill", (d) => (d.data as any).color);

    // EXIT
    arcs
      .exit()
      .transition()
      .duration(700)
      .attrTween(
        "d",
        function (
          this: SVGPathElement,
          d: d3.PieArcDatum<{ label: string; value: number; color: string }>
        ) {
          // On fait disparaître l'arc en le réduisant à zéro
          const end = { ...d, startAngle: d.endAngle, endAngle: d.endAngle };
          const i = d3.interpolate((this as any)._current, end);
          return (t) => arc(i(t)) || "";
        }
      )
      .remove();

    g.selectAll("text.pie-label").remove();

    // Ajoute les nouveaux labels de pourcentage
    const total = data.reduce((sum, d) => sum + d.value, 0);

    g.selectAll("text.pie-label")
      .data(pie(data), (d: any) => d.data.label)
      .enter()
      .append("text")
      .attr("class", "pie-label")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", "#fff")
      .attr("font-size", 16)
      .attr("font-weight", "bold")
      .attr("transform", (d) => {
        const [x, y] = arc.centroid(d as any);
        return `translate(${x},${y})`;
      })
      .text((d) => {
        const percent = total > 0 ? (d.data.value / total) * 100 : 0;
        return percent > 2 ? `${percent.toFixed(1)}%` : ""; // n'affiche pas les toutes petites parts
      });

    // Légende
    const legend = svg
      .append("g")
      .attr("class", "legend-group")
      .attr("transform", `translate(0,0)`);
    data.forEach((d, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 22)
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

  if (!department) return null;

  return (
    <div className="bg-background/80 rounded-lg shadow p-4 mb-4 inline-block">
      <h3 className="text-lg font-bold mb-2">Répartition Hommes / Femmes</h3>
      <svg ref={ref} width={300} height={220} />
    </div>
  );
}
