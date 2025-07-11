import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import { PopulationDepartement } from "@/types/population";

type Props = {
  department: PopulationDepartement | null;
};

type BarData = {
  label: string;
  ensemble: number | null;
  hommes: number | null;
  femmes: number | null;
};

type GroupData = {
  key: string;
  value: number;
  color: string;
};

// Configuration constants
const CHART_CONFIG = {
  width: 500,
  height: 200,
  margin: { top: 20, right: 30, bottom: 30, left: 30 },
  padding: 0.2,
  innerPadding: 0.1,
  cornerRadius: 6,
  animationDuration: 0.7,
  hoverDuration: 0.2,
  staggerDelay: 0.1,
};

const AGE_LABELS = [
  { key: "0_19", label: "0-19" },
  { key: "20_39", label: "20-39" },
  { key: "40_59", label: "40-59" },
  { key: "60_74", label: "60-74" },
  { key: "75_plus", label: "75+" },
] as const;

const GROUPS = [
  { key: "ensemble", label: "Ensemble", color: "#2563eb" }, // Bleu foncé
  { key: "hommes", label: "Hommes", color: "#60a5fa" }, // Bleu moyen
  { key: "femmes", label: "Femmes", color: "#93c5fd" }, // Bleu clair
] as const;

export default function PopulationBarChart({ department }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  // Memoized data transformation
  const transformData = useCallback((department: PopulationDepartement): BarData[] => {
    return AGE_LABELS.map(({ key, label }) => ({
      label,
      ensemble: department.ensemble[key as keyof typeof department.ensemble] as number | null,
      hommes: department.hommes[key as keyof typeof department.hommes] as number | null,
      femmes: department.femmes[key as keyof typeof department.femmes] as number | null,
    }));
  }, []);

  // Calculate margins based on bar width
  const calculateMargins = useCallback((width: number, dataLength: number, padding: number) => {
    const x0 = d3.scaleBand().domain(Array(dataLength).fill(0).map((_, i) => i.toString())).range([0, width]).padding(padding);
    const totalBarWidth = x0.step() * dataLength;
    const leftMargin = (width - totalBarWidth) / 2;
    return { 
      top: CHART_CONFIG.margin.top, 
      right: leftMargin, 
      bottom: CHART_CONFIG.margin.bottom, 
      left: leftMargin 
    };
  }, []);

  // Setup gradients
  const setupGradients = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
    
    GROUPS.forEach((group) => {
      const gradId = `bar-gradient-${group.key}`;
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
          .attr("stop-color", d3.color(group.color)!.brighter(0.7).formatHex());
        
        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", d3.color(group.color)!.darker(1.2).formatHex());
      }
    });
  }, []);

  // Setup scales
  const setupScales = useCallback((data: BarData[], width: number, height: number, margin: any) => {
    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(CHART_CONFIG.padding);

    const x1 = d3
      .scaleBand()
      .domain(GROUPS.map((g) => g.key))
      .range([0, x0.bandwidth()])
      .padding(CHART_CONFIG.innerPadding);

    const maxValue = d3.max(data, (d) =>
      Math.max(d.ensemble ?? 0, d.hommes ?? 0, d.femmes ?? 0)
    ) || 0;

    const y = d3
      .scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([height - margin.bottom, margin.top]);

    return { x0, x1, y };
  }, []);

  // Handle bar hover with D3 tooltip
  const handleBarHover = useCallback((event: MouseEvent, d: GroupData, parentLabel: string) => {
    // Créer ou récupérer le tooltip D3
    let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> =
      d3.select<HTMLDivElement, unknown>("#barchart-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append<HTMLDivElement>("div")
        .attr("id", "barchart-tooltip")
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
        .style("min-width", "180px");
    }

    const groupLabel = GROUPS.find((g) => g.key === d.key)?.label ?? d.key;
    
    tooltip
      .style("opacity", 1)
      .html(
        `<div style="margin-bottom: 6px; font-weight: bold;">${parentLabel}</div>
         <div style="margin-bottom: 4px;">${groupLabel} : <strong>${d.value.toLocaleString("fr-FR")}</strong></div>
         <div style="color: #94a3b8; font-size: 11px;">Tranche d'âge</div>`
      )
      .style("left", event.pageX + 15 + "px")
      .style("top", event.pageY - 50 + "px");
    
    gsap.to(event.target, {
      scaleX: 1.15,
      transformOrigin: "50% 100%",
      duration: CHART_CONFIG.hoverDuration,
      filter: "brightness(1.2)",
    });
  }, []);

  // Handle bar mouse leave with D3 tooltip
  const handleBarLeave = useCallback((event: MouseEvent) => {
    const tooltip = d3.select("#barchart-tooltip");
    tooltip.style("opacity", 0);
    
    gsap.to(event.target, { 
      scaleX: 1, 
      filter: "brightness(1)", 
      duration: CHART_CONFIG.hoverDuration 
    });
  }, []);

  // Animate bar entrance
  const animateBarEntrance = useCallback((element: SVGRectElement, d: GroupData, yScale: d3.ScaleLinear<number, number, never>) => {
    gsap.to(element, {
      delay: CHART_CONFIG.staggerDelay * GROUPS.findIndex((g) => g.key === d.key),
      duration: CHART_CONFIG.animationDuration,
      attr: {
        y: yScale(d.value),
        height: yScale(0) - yScale(d.value),
      },
      ease: "elastic.out(1,0.3)",
      overwrite: "auto",
    });
  }, []);

  // Animate bar update
  const animateBarUpdate = useCallback((element: SVGRectElement, d: GroupData, x1: d3.ScaleBand<string>, yScale: d3.ScaleLinear<number, number, never>) => {
    gsap.to(element, {
      delay: CHART_CONFIG.staggerDelay * GROUPS.findIndex((g) => g.key === d.key),
      duration: CHART_CONFIG.animationDuration,
      attr: {
        x: x1(d.key)!,
        width: x1.bandwidth(),
        y: yScale(d.value),
        height: yScale(0) - yScale(d.value),
        fill: `url(#bar-gradient-${d.key})`,
      },
      ease: "elastic.out(1,0.3)",
      overwrite: "auto",
    });
  }, []);

  // Render bars for each group
  const renderBars = useCallback((
    groups: d3.Selection<SVGGElement, BarData, SVGGElement, unknown>, 
    x1: d3.ScaleBand<string>, 
    yScale: d3.ScaleLinear<number, number, never>
  ) => {
    groups.each(function (d) {
      const group = d3.select(this);
      const barsData: GroupData[] = GROUPS.map((g) => ({
        key: g.key,
        value: (d[g.key as keyof BarData] as number) ?? 0,
        color: g.color,
      }));

      const bars = group.selectAll<SVGRectElement, GroupData>("rect")
        .data(barsData, (d) => d.key);

      // ENTER
      const barsEnter = bars
        .enter()
        .append("rect")
        .attr("x", (d) => x1(d.key)!)
        .attr("width", x1.bandwidth())
        .attr("y", yScale(0))
        .attr("height", 0)
        .attr("fill", (d) => `url(#bar-gradient-${d.key})`)
        .attr("rx", CHART_CONFIG.cornerRadius)
        .attr("ry", CHART_CONFIG.cornerRadius)
        .on("mouseover", (event, d) => handleBarHover(event, d, (group.datum() as BarData).label))
        .on("mouseout", handleBarLeave);

      barsEnter.each(function (d) {
        animateBarEntrance(this, d, yScale);
      });

      // UPDATE
      bars.each(function (d) {
        animateBarUpdate(this, d, x1, yScale);
      });

      // EXIT
      bars.exit()
        .each(function () {
          gsap.to(this, { opacity: 0, y: yScale(0), duration: 0.5 });
        })
        .transition()
        .duration(CHART_CONFIG.animationDuration * 1000)
        .attr("y", yScale(0))
        .attr("height", 0)
        .remove();
    });
  }, [handleBarHover, handleBarLeave, animateBarEntrance, animateBarUpdate]);

  // Setup axes
  const setupAxes = useCallback((
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, 
    x0: d3.ScaleBand<string>, 
    width: number, 
    height: number, 
    margin: any
  ) => {
    // Clear existing axes
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();

    // X-axis
    const xAxisGroup = svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom + 10})`);

    xAxisGroup
      .call(d3.axisBottom(x0).tickSize(0))
      .call((g) => g.select(".domain").remove());
  }, []);

  useEffect(() => {
    if (!department || !ref.current) return;

    const data = transformData(department);
    const svgElement = ref.current;
    const width = CHART_CONFIG.width;
    const height = CHART_CONFIG.height;
    const margin = calculateMargins(width, data.length, CHART_CONFIG.padding);

    const svg = d3.select(ref.current);
    
    // Configuration du viewBox et des dimensions directement avec D3
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    
    // Setup gradients
    setupGradients(svg);
    
    // Setup scales
    const { x0, x1, y } = setupScales(data, width, height, margin);
    
    // Setup axes
    setupAxes(svg, x0, width, height, margin);

    // Setup bars container
    let barsGroup = svg.select<SVGGElement>(".bars-group");
    if (barsGroup.empty()) {
      barsGroup = svg.append("g").attr("class", "bars-group");
    }

    // DATA JOIN for age groups
    const groups = barsGroup
      .selectAll<SVGGElement, BarData>("g.bar-group")
      .data(data, (d) => d.label);

    // ENTER + UPDATE for age groups
    const groupsEnter = groups
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", (d) => `translate(${x0(d.label)},0)`);

    const groupsUpdate = groups
      .merge(groupsEnter)
      .transition()
      .duration(CHART_CONFIG.animationDuration * 1000)
      .attr("transform", (d) => `translate(${x0(d.label)},0)`);

    // Render bars
    renderBars(groups.merge(groupsEnter), x1, y);

    // EXIT
    groups.exit()
      .transition()
      .duration(CHART_CONFIG.animationDuration * 1000)
      .style("opacity", 0)
      .remove();

  }, [department, transformData, calculateMargins, setupGradients, setupScales, setupAxes, renderBars]);

  if (!department) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl shadow-gray-900/50 w-full h-full transition-all duration-300 hover:shadow-3xl hover:border-gray-600/50">
      {/* Header avec titre et légende */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-blue-400 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-100 tracking-tight">
            Répartition par tranche d'âge
          </h3>
        </div>
        
        {/* Légende améliorée */}
        <div className="flex items-center gap-6">
          {GROUPS.map((group) => (
            <div key={group.label} className="flex items-center gap-3 group">
              <div className="relative">
                <div 
                  className="w-4 h-4 rounded-sm shadow-lg" 
                  style={{ backgroundColor: group.color }}
                ></div>
                <div 
                  className="absolute inset-0 w-4 h-4 rounded-sm opacity-0 group-hover:opacity-30 transition-opacity duration-200" 
                  style={{ 
                    backgroundColor: group.color,
                    filter: 'blur(4px)',
                    transform: 'scale(1.5)'
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-300 font-medium group-hover:text-gray-200 transition-colors duration-200">
                {group.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conteneur du graphique avec bordure subtile */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-blue-500/10 rounded-lg"></div>
        <div className="relative bg-gray-900/30 rounded-lg p-4 border border-gray-800/40">
          <div className="flex justify-center">
            <svg 
              ref={ref} 
              className="w-full h-auto max-w-full max-h-full drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
