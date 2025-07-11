import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { PopulationDepartement } from "@/types/population";
import { gsap } from "@/lib/gsap";

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
  {
    label: "Hommes",
    baseColor1: "#3b82f6",
    baseColor2: "#1e40af",
    gradientId: "hommes-gradient",
  },
  {
    label: "Femmes",
    baseColor1: "#f472b6",
    baseColor2: "#be185d",
    gradientId: "femmes-gradient",
  },
];

// Utilitaire pour récupérer le fill url
function getColor(label: string) {
  const item = legendData.find((l) => l.label === label);
  return item ? `url(#${item.gradientId})` : "#888";
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

    // Trie du plus ancien au plus jeune (ordre logique pour une pyramide)
    data.reverse(); // Inverse l'ordre pour avoir 0-19 en haut et 75+ en bas

    const svgElement = ref.current;
    const width = 500; // Utilise la dimension du viewBox
    const height = 220; // Utilise la dimension du viewBox

    // Marges optimisées pour une meilleure utilisation de l'espace
    const margin = { top: 15, right: 20, bottom: 35, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(ref.current);
    
    // Configuration du viewBox et des dimensions directement avec D3
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    
    // Initialisation des defs une seule fois
    let defs = svg.select<SVGDefsElement>("defs");
    if (defs.empty()) {
      defs = svg.append<SVGDefsElement>("defs");
      
      // Génère les gradients une seule fois
      legendData.forEach(({ gradientId, baseColor1, baseColor2 }) => {
        const grad = defs
          .append<SVGLinearGradientElement>("linearGradient")
          .attr("id", gradientId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%");
        
        grad.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", baseColor1)
          .attr("stop-opacity", 0.8);
        grad.append("stop")
          .attr("offset", "50%")
          .attr("stop-color", baseColor2)
          .attr("stop-opacity", 0.9);
        grad.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", baseColor1)
          .attr("stop-opacity", 1);
      });
    }

    // --- CONFIGURATION DES ÉCHELLES OPTIMISÉES ---
    const maxValue = d3.max(data, (d) => Math.max(Math.abs(d.hommes), d.femmes)) || 0;
    const padding = 0.1; // Espacement réduit entre les barres pour optimiser l'espace

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(padding);

    // Calcul optimisé de l'espace central
    const centerGap = 8; // Espace entre les barres hommes/femmes
    const labelSpace = 35; // Espace réservé pour les labels de valeurs
    
    // Échelle X optimisée pour utiliser tout l'espace disponible
    const x = d3
      .scaleLinear()
      .domain([-maxValue, maxValue])
      .range([margin.left + labelSpace, width - margin.right - labelSpace]);

    // Position centrale calculée
    const centerX = x(0);

    // --- BARRES HOMMES (côté gauche) ---
    const hommesColor = getColor("Hommes");
    const hommes = svg
      .selectAll<SVGRectElement, (typeof data)[0]>("rect.hommes")
      .data(data, (d) => "hommes-" + d.label);

    // Nouveaux éléments avec positionnement optimisé
    const hommesEnter = hommes
      .enter()
      .append("rect")
      .attr("class", "hommes")
      .attr("x", centerX - centerGap)
      .attr("y", (d) => y(d.label)!)
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", hommesColor)
      .style("cursor", "pointer")
      .on("mousemove", function (event, d) {
        showTooltip(event, d, "Hommes");
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mouseleave", function() {
        hideTooltip();
        d3.select(this).attr("opacity", 1);
      });

    // Mise à jour des éléments existants et nouveaux
    const hommesUpdate = hommesEnter.merge(hommes);
    
    hommesUpdate.each(function (d, i) {
      const element = this;
      const isNew = d3.select(element).classed("new-element");
      
      // Marque les nouveaux éléments
      if (!isNew && hommesEnter.nodes().includes(element)) {
        d3.select(element).classed("new-element", true);
      }
      
      // Calcul de la largeur optimisée
      const barWidth = Math.abs(centerX - x(d.hommes)) - centerGap;
      
      gsap.to(element, {
        attr: {
          x: x(d.hommes),
          y: y(d.label)!,
          width: barWidth,
          height: y.bandwidth(),
        },
        duration: 1.2,
        delay: i * 0.1,
        ease: "back.out(1.7)",
      });
    });

    // Suppression des éléments sortants
    hommes.exit()
      .each(function() {
        gsap.to(this, {
          attr: { width: 0, x: centerX - centerGap },
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            d3.select(this).remove();
          }
        });
      });

    // --- BARRES FEMMES (côté droit) ---
    const femmesColor = getColor("Femmes");
    const femmes = svg
      .selectAll<SVGRectElement, (typeof data)[0]>("rect.femmes")
      .data(data, (d) => "femmes-" + d.label);

    // Nouveaux éléments avec positionnement optimisé
    const femmesEnter = femmes
      .enter()
      .append("rect")
      .attr("class", "femmes")
      .attr("x", centerX + centerGap)
      .attr("y", (d) => y(d.label)!)
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", femmesColor)
      .style("cursor", "pointer")
      .on("mousemove", function (event, d) {
        showTooltip(event, d, "Femmes");
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mouseleave", function() {
        hideTooltip();
        d3.select(this).attr("opacity", 1);
      });

    // Mise à jour des éléments existants et nouveaux
    const femmesUpdate = femmesEnter.merge(femmes);
    
    femmesUpdate.each(function (d, i) {
      const element = this;
      const isNew = d3.select(element).classed("new-element");
      
      if (!isNew && femmesEnter.nodes().includes(element)) {
        d3.select(element).classed("new-element", true);
      }
      
      // Calcul de la largeur optimisée
      const barWidth = Math.abs(x(d.femmes) - centerX) - centerGap;
      
      gsap.to(element, {
        attr: {
          x: centerX + centerGap,
          y: y(d.label)!,
          width: barWidth,
          height: y.bandwidth(),
        },
        duration: 1.2,
        delay: i * 0.1 + 0.2,
        ease: "back.out(1.7)",
      });
    });

    // Suppression des éléments sortants
    femmes.exit()
      .each(function() {
        gsap.to(this, {
          attr: { width: 0, x: centerX + centerGap },
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            d3.select(this).remove();
          }
        });
      });

    // --- LABELS D'ÂGE AU CENTRE ---
    const ageLabels = svg
      .selectAll<SVGTextElement, (typeof data)[0]>(".age-label")
      .data(data, (d) => "age-" + d.label);

    const ageLabelsEnter = ageLabels
      .enter()
      .append("text")
      .attr("class", "age-label")
      .attr("x", centerX)
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 11)
      .attr("font-weight", "600")
      .attr("fill", "#f8fafc")
      .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
      .style("opacity", 0)
      .text((d) => d.label);

    // Mise à jour de tous les labels
    const ageLabelsUpdate = ageLabelsEnter.merge(ageLabels);
    
    ageLabelsUpdate.each(function(d, i) {
      const element = this;
      
      // Anime la position
      gsap.to(element, {
        attr: {
          x: centerX,
          y: y(d.label)! + y.bandwidth() / 2,
        },
        duration: 0.8,
        delay: i * 0.05,
        ease: "power2.out",
      });
      
      // Anime l'opacité
      gsap.to(element, {
        style: { opacity: 1 },
        duration: 0.6,
        delay: i * 0.1 + 0.5,
      });
    });

    ageLabels.exit()
      .each(function() {
        gsap.to(this, {
          style: { opacity: 0 },
          duration: 0.3,
          onComplete: () => {
            d3.select(this).remove();
          }
        });
      });

    // --- LABELS DE VALEURS ---
    // Labels valeurs hommes (à gauche)
    const hommesValues = svg
      .selectAll<SVGTextElement, (typeof data)[0]>(".hommes-value")
      .data(data, (d) => "hommes-value-" + d.label);

    const hommesValuesEnter = hommesValues
      .enter()
      .append("text")
      .attr("class", "hommes-value")
      .attr("x", (d) => Math.max(margin.left + 2, x(d.hommes) - 6))
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 9)
      .attr("font-weight", "500")
      .attr("fill", "#93c5fd")
      .style("opacity", 0)
      .text((d) => formatValue(Math.abs(d.hommes)));

    const hommesValuesUpdate = hommesValuesEnter.merge(hommesValues);
    
    hommesValuesUpdate.each(function(d, i) {
      const element = this;
      
      // Mise à jour du texte
      d3.select(element).text(formatValue(Math.abs(d.hommes)));
      
      // Position optimisée pour éviter les chevauchements
      const xPos = Math.max(margin.left + 2, x(d.hommes) - 6);
      
      // Animation de position
      gsap.to(element, {
        attr: {
          x: xPos,
          y: y(d.label)! + y.bandwidth() / 2,
        },
        duration: 0.8,
        delay: i * 0.05,
        ease: "power2.out",
      });
      
      // Animation d'opacité
      gsap.to(element, {
        style: { opacity: 1 },
        duration: 0.4,
        delay: i * 0.1 + 0.8,
      });
    });

    hommesValues.exit()
      .each(function() {
        gsap.to(this, {
          style: { opacity: 0 },
          duration: 0.3,
          onComplete: () => {
            d3.select(this).remove();
          }
        });
      });

    // Labels valeurs femmes (à droite)
    const femmesValues = svg
      .selectAll<SVGTextElement, (typeof data)[0]>(".femmes-value")
      .data(data, (d) => "femmes-value-" + d.label);

    const femmesValuesEnter = femmesValues
      .enter()
      .append("text")
      .attr("class", "femmes-value")
      .attr("x", (d) => Math.min(width - margin.right - 2, x(d.femmes) + 6))
      .attr("y", (d) => y(d.label)! + y.bandwidth() / 2)
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 9)
      .attr("font-weight", "500")
      .attr("fill", "#f9a8d4")
      .style("opacity", 0)
      .text((d) => formatValue(d.femmes));

    const femmesValuesUpdate = femmesValuesEnter.merge(femmesValues);
    
    femmesValuesUpdate.each(function(d, i) {
      const element = this;
      
      // Mise à jour du texte
      d3.select(element).text(formatValue(d.femmes));
      
      // Position optimisée pour éviter les chevauchements
      const xPos = Math.min(width - margin.right - 2, x(d.femmes) + 6);
      
      // Animation de position
      gsap.to(element, {
        attr: {
          x: xPos,
          y: y(d.label)! + y.bandwidth() / 2,
        },
        duration: 0.8,
        delay: i * 0.05,
        ease: "power2.out",
      });
      
      // Animation d'opacité
      gsap.to(element, {
        style: { opacity: 1 },
        duration: 0.4,
        delay: i * 0.1 + 1.0,
      });
    });

    femmesValues.exit()
      .each(function() {
        gsap.to(this, {
          style: { opacity: 0 },
          duration: 0.3,
          onComplete: () => {
            d3.select(this).remove();
          }
        });
      });
    // --- AXE X (en bas) ---
    let xAxis = svg.select<SVGGElement>(".x-axis");
    if (xAxis.empty()) {
      xAxis = svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`);
    }
    
    // Mise à jour de l'axe avec transition fluide
    xAxis
      .transition()
      .duration(800)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => formatValue(Math.abs(Number(d))))
      );

    // Style de l'axe X (conservé)
    xAxis
      .selectAll("path.domain")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7);

    xAxis
      .selectAll("g.tick line")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5);

    xAxis
      .selectAll("g.tick text")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 10)
      .attr("font-weight", "500");

    // --- LIGNE CENTRALE ---
    let centerLine = svg.select<SVGLineElement>(".center-line");
    if (centerLine.empty()) {
      centerLine = svg
        .append("line")
        .attr("class", "center-line")
        .attr("stroke", "#475569")
        .attr("stroke-width", 2)
        .attr("opacity", 0.6)
        .style("stroke-dasharray", "5,5");
    }
    
    // Mise à jour de la ligne centrale
    centerLine
      .transition()
      .duration(800)
      .attr("x1", centerX)
      .attr("x2", centerX)
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom);

    // --- TOOLTIP AMÉLIORÉ (une seule fois) ---
    let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> =
      d3.select<HTMLDivElement, unknown>("#pyramid-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append<HTMLDivElement>("div")
        .attr("id", "pyramid-tooltip")
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
        .style("z-index", "1000");
    }

    // Fonction d'affichage du tooltip améliorée
    function showTooltip(event: MouseEvent, d: any, sexe: string) {
      const value = Math.abs(sexe === "Hommes" ? d.hommes : d.femmes);
      const total = Math.abs(d.hommes) + d.femmes;
      const percentage = ((value / total) * 100).toFixed(1);
      
      tooltip
        .style("opacity", 1)
        .html(
          `<div style="margin-bottom: 6px;"><strong>${d.label}</strong></div>
           <div style="margin-bottom: 4px;">${sexe} : <strong>${value.toLocaleString()}</strong></div>
           <div style="color: #94a3b8; font-size: 11px;">${percentage}% du total de cette tranche</div>`
        )
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 50 + "px");
    }
    
    function hideTooltip() {
      tooltip.style("opacity", 0);
    }
  }, [department]);

  if (!department) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl shadow-gray-900/50 w-full h-full transition-all duration-300 hover:shadow-3xl hover:border-gray-600/50">
      {/* Header avec titre et légende */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-pink-400 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-100 tracking-tight">
            Pyramide des âges
          </h3>
        </div>
        
        {/* Légende améliorée */}
        <div className="flex items-center gap-6">
          {legendData.map((item) => (
            <div key={item.label} className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-4 h-4 rounded-full shadow-lg" style={{ 
                  background: `linear-gradient(135deg, ${item.baseColor1}, ${item.baseColor2})` 
                }}></div>
                <div className="absolute inset-0 w-4 h-4 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-200" style={{ 
                  background: `linear-gradient(135deg, ${item.baseColor1}, ${item.baseColor2})`,
                  filter: 'blur(4px)',
                  transform: 'scale(1.5)'
                }}></div>
              </div>
              <span className="text-sm text-gray-300 font-medium group-hover:text-gray-200 transition-colors duration-200">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conteneur du graphique avec bordure subtile */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-pink-500/10 rounded-lg"></div>
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
