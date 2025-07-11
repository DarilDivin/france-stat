import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { PopulationDepartement } from "@/types/population";
import { gsap } from "@/lib/gsap";

type Props = {
  department: PopulationDepartement | null;
};

type PieData = {
  label: string;
  value: number;
  color: string;
};

// Configuration constants
const CHART_CONFIG = {
  width: 300,
  height: 300,
  padding: 30,
  cornerRadius: 6,
  padAngle: 0.04,
  innerRadius: 0.15,
  animationDuration: 1.0,
  hoverDuration: 0.25,
};

const PIE_GROUPS = [
  { key: "hommes", label: "Hommes", baseColor: "#3b82f6" },
  { key: "femmes", label: "Femmes", baseColor: "#f472b6" },
] as const;

export default function PopulationPieChart({ department }: Props) {
  const [activeLegend, setActiveLegend] = useState<string | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  // Prepare data for both chart and legend
  const data: PieData[] = department ? [
    {
      label: "Hommes",
      value: department.hommes.total ?? 0,
      color: PIE_GROUPS[0].baseColor,
    },
    {
      label: "Femmes",
      value: department.femmes.total ?? 0,
      color: PIE_GROUPS[1].baseColor,
    },
  ] : [];

  useEffect(() => {
    if (!department || !ref.current || data.length === 0) return;

    const svgElement = ref.current;
    const { width, height } = CHART_CONFIG;
    const radius = Math.min(width, height) / 2 - CHART_CONFIG.padding;

    const svg = d3.select(svgElement);
    
    // Setup gradients (only once)
    let defs = svg.select<SVGDefsElement>("defs");
    if (defs.empty()) {
      defs = svg.append<SVGDefsElement>("defs");
    }
    
    // Update gradients
    data.forEach((d, i) => {
      const gradId = `pie-gradient-${i}`;
      let gradient = defs.select<SVGLinearGradientElement>(`#${gradId}`);
      if (gradient.empty()) {
        gradient = defs
          .append<SVGLinearGradientElement>("linearGradient")
          .attr("id", gradId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%");
        
        gradient.append("stop").attr("offset", "0%");
        gradient.append("stop").attr("offset", "100%");
      }
      
      gradient.select("stop:first-child")
        .attr("stop-color", d3.color(d.color)!.brighter(0.7).formatHex());
      
      gradient.select("stop:last-child")
        .attr("stop-color", d3.color(d.color)!.darker(1.2).formatHex());
    });

    // Setup pie and arc generators
    const pie = d3
      .pie<PieData>()
      .value((d) => d.value)
      .padAngle(CHART_CONFIG.padAngle)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<PieData>>()
      .innerRadius(radius * CHART_CONFIG.innerRadius)
      .outerRadius(radius)
      .cornerRadius(CHART_CONFIG.cornerRadius);

    // Setup main group (only once)
    let g = svg.select<SVGGElement>("g.pie-group");
    if (g.empty()) {
      g = svg
        .append<SVGGElement>("g")
        .attr("class", "pie-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const pieData = pie(data);

    // --- TOOLTIP D3 (inspiré de la pyramide des âges) ---
    let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> =
      d3.select<HTMLDivElement, unknown>("#piechart-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append<HTMLDivElement>("div")
        .attr("id", "piechart-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(15, 23, 42, 0.95)")
        .style("color", "#f8fafc")
        .style("padding", "12px 16px")
        .style("border-radius", "8px")
        .style("border", "1px solid #475569")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
        .style("backdrop-filter", "blur(8px)")
        .style("opacity", 0)
        .style("z-index", "1000")
        .style("min-width", "160px");
    }

    // Fonctions de gestion du tooltip
    function showTooltip(event: MouseEvent, d: d3.PieArcDatum<PieData>) {
      const percent = total > 0 ? `${((d.data.value / total) * 100).toFixed(1)}%` : "0%";
      
      tooltip
        .style("opacity", 1)
        .html(
          `<div style="margin-bottom: 6px; font-weight: bold;">${d.data.label}</div>
           <div style="margin-bottom: 4px;">Population : <strong>${d.data.value.toLocaleString("fr-FR")}</strong></div>
           <div style="color: #94a3b8; font-size: 11px;">${percent} du total</div>`
        )
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 50 + "px");
    }
    
    function hideTooltip() {
      tooltip.style("opacity", 0);
    }

    // DATA JOIN for pie slices
    const slices = g
      .selectAll<SVGPathElement, d3.PieArcDatum<PieData>>("path.pie-slice")
      .data(pieData, (d: any) => d.data.label);

    // ENTER - new slices
    const slicesEnter = slices
      .enter()
      .append<SVGPathElement>("path")
      .attr("class", "pie-slice")
      .attr("fill", (d, i) => `url(#pie-gradient-${i})`)
      .attr("stroke", "transparent")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        // Highlight effect
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 3);
        
        showTooltip(event, d);
      })
      .on("mouseout", function() {
        // Remove highlight
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "transparent")
          .attr("stroke-width", 2);
        
        hideTooltip();
      });

    // Animate new slices from 0 to final position
    slicesEnter.each(function (d) {
      const element = this as SVGPathElement;
      
      // Start from 0 angle at the beginning of the pie
      const startAngle = 0;
      const endAngle = 0;
      
      // Set initial state (invisible)
      d3.select(element).attr("d", arc({
        ...d,
        startAngle: startAngle,
        endAngle: endAngle
      }));
      
      // Store current state for future updates
      (element as any)._current = { ...d, startAngle: startAngle, endAngle: endAngle };
    });

    // UPDATE - existing slices (just update fill, no animation here)
    slices
      .attr("fill", (d, i) => `url(#pie-gradient-${i})`);

    // MERGE - combine enter and update selections for synchronized animation
    const allSlices = slicesEnter.merge(slices);
    
    // Animate all slices together to ensure synchronized movement
    allSlices.each(function (d) {
      const element = this as SVGPathElement;
      const current = (element as any)._current || { ...d, startAngle: 0, endAngle: 0 };
      
      // Animate both start and end angles simultaneously
      gsap.to(current, {
        startAngle: d.startAngle,
        endAngle: d.endAngle,
        duration: CHART_CONFIG.animationDuration,
        ease: "elastic.out(1, 0.3)",
        onUpdate: () => {
          d3.select(element).attr("d", arc(current));
        },
        onComplete: () => {
          (element as any)._current = { ...current };
        }
      });
    });

    // EXIT - remove old slices
    slices.exit()
      .each(function (d) {
        const element = this as SVGPathElement;
        const current = (element as any)._current || d;
        
        // Animate to 0 angle
        gsap.to(current, {
          startAngle: current.startAngle,
          endAngle: current.startAngle,
          duration: CHART_CONFIG.animationDuration * 0.5,
          ease: "power2.out",
          onUpdate: () => {
            d3.select(element).attr("d", arc(current));
          },
          onComplete: () => {
            d3.select(element).remove();
          }
        });
      });

    // DATA JOIN for labels
    const labelGroups = g
      .selectAll<SVGGElement, d3.PieArcDatum<PieData>>("g.pie-label-group")
      .data(pieData, (d: any) => d.data.label);

    // ENTER - new labels
    const labelGroupsEnter = labelGroups
      .enter()
      .append<SVGGElement>("g")
      .attr("class", "pie-label-group")
      .attr("transform", "translate(0,0)")
      .style("opacity", 0);

    // Initialize label position
    labelGroupsEnter.each(function (d) {
      const element = this as SVGGElement;
      // Store initial state for animation
      (element as any)._current = { ...d, startAngle: 0, endAngle: 0 };
    });

    labelGroupsEnter
      .append("rect")
      .attr("x", -16)
      .attr("y", -16)
      .attr("width", 32)
      .attr("height", 32)
      .attr("rx", 6)
      .attr("fill", "rgba(238, 238, 238, 0.2)")
      .attr("stroke", "rgba(255, 255, 255, 0.5)")
      .attr("stroke-width", 1);

    labelGroupsEnter
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("dy", "0.05em")
      .attr("fill", "#fff")
      .attr("font-size", 9)
      .attr("font-weight", "bold");

    // UPDATE - all labels (enter + update)
    const labelGroupsUpdate = labelGroupsEnter.merge(labelGroups);

    // Animate labels to follow their corresponding slices
    labelGroupsUpdate.each(function (d) {
      const element = this as SVGGElement;
      const labelCurrent = (element as any)._current || { ...d, startAngle: 0, endAngle: 0 };
      
      // Animate label position to follow slice
      gsap.to(labelCurrent, {
        startAngle: d.startAngle,
        endAngle: d.endAngle,
        duration: CHART_CONFIG.animationDuration,
        ease: "elastic.out(1, 0.3)",
        onUpdate: () => {
          const [x, y] = arc.centroid(labelCurrent);
          d3.select(element).attr("transform", `translate(${x},${y})`);
        },
        onComplete: () => {
          (element as any)._current = { ...labelCurrent };
        }
      });
    });

    // Show labels with fade in
    labelGroupsUpdate
      .transition()
      .duration(CHART_CONFIG.animationDuration * 500)
      .delay(CHART_CONFIG.animationDuration * 300)
      .style("opacity", 1);

    // Update text content
    labelGroupsUpdate
      .select("text")
      .text((d) => {
        const percent = total > 0 ? (d.data.value / total) * 100 : 0;
        return percent > 2 ? `${percent.toFixed(1)}%` : "";
      });

    // EXIT - remove old labels
    labelGroups.exit()
      .transition()
      .duration(CHART_CONFIG.animationDuration * 500)
      .style("opacity", 0)
      .remove();

  }, [department, data]);

  if (!department) return null;

  return (
    <div className=" w-full bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-2xl shadow-gray-900/50 transition-all duration-300 hover:shadow-3xl hover:border-gray-600/50">
      {/* Header modernisé */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-6 bg-gradient-to-b from-pink-400 to-blue-400 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-100 tracking-tight">
          Répartition Hommes / Femmes
        </h3>
      </div>

      {/* Légende interactive dans la card */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-3">
        {data.map((item, index) => (
          <button
            key={item.label}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
              activeLegend === item.label
                ? 'bg-gray-800/60 shadow-lg'
                : 'hover:bg-gray-800/30'
            }`}
            onMouseEnter={() => setActiveLegend(item.label)}
            onMouseLeave={() => setActiveLegend(null)}
          >
            <div 
              className="w-3 h-3 rounded-full ring-2 ring-gray-700"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs sm:text-sm font-medium text-gray-300">
              {item.label}
            </span>
            {department && (
              <span className="text-xs text-gray-400 ml-1 hidden sm:inline">
                {item.value.toLocaleString('fr-FR')}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Conteneur du graphique - Responsive */}
      <div className="relative w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-blue-500/5 rounded-lg"></div>
        <div className="relative bg-gray-900/30 rounded-lg p-3 border border-gray-800/40">
          {/* Conteneur responsive avec aspect ratio carré et breakpoints */}
          <div 
            className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm xl:max-w-md mx-auto" 
            style={{ aspectRatio: '1/1' }}
          >
            <svg
              ref={ref}
              className="w-full h-full drop-shadow-lg"
              viewBox={`0 0 ${CHART_CONFIG.width} ${CHART_CONFIG.height}`}
              preserveAspectRatio="xMidYMid meet"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
