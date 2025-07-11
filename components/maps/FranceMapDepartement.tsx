import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import Background from "../Background";
import { motion } from "motion/react";
import { usePopulation } from "@/hooks/usePopulationData";
import { PopulationDepartement } from "@/types/population";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideChevronsRightLeft } from "lucide-react";

type Props = {
  geoData: any;
  width?: number;
  height?: number;
  selectedDep: PopulationDepartement | null;
  setSelectedDep: (d: PopulationDepartement | null) => void;
};

function normalizeCode(code: string | number) {
  if (typeof code === "string" && isNaN(Number(code))) return code.trim();
  return String(parseInt(code as string, 10));
}

const FranceMapDepartement: React.FC<Props> = ({
  geoData,
  width = 800,
  height = 934,
  selectedDep,
  setSelectedDep,
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgReady, setSvgReady] = useState(false);
  const [responsiveMapPadding, setResponsiveMapPadding] = useState(40);

  const { data } = usePopulation();

  // Dimensions calculées pour une carte responsive optimale
  const aspectRatio = height / width; // ~1.1675 pour la France
  const baseWidth = 1000; // Base standardisée
  const baseHeight = Math.round(baseWidth * aspectRatio);

  // Fonction pour calculer le padding responsive
  const getResponsiveMapPadding = () => {
    if (typeof window === "undefined") return 40; // SSR fallback
    const width = window.innerWidth;
    if (width < 640) return 20; // Mobile
    if (width < 1024) return 30; // Tablet
    return 40; // Desktop
  };

  // Effet pour gérer le redimensionnement
  useEffect(() => {
    const handleResize = () => {
      setResponsiveMapPadding(getResponsiveMapPadding());
    };

    // Initialiser le padding
    setResponsiveMapPadding(getResponsiveMapPadding());

    // Ajouter le listener de redimensionnement
    window.addEventListener("resize", handleResize);

    // Nettoyer le listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSvgReady(false);
    if (!geoData || !ref.current || !gRef.current) return;

    const svg = d3.select(ref.current);
    const g = d3.select(gRef.current);
    g.selectAll("*").remove();

    // Filtrer les départements pour ne garder que la France métropolitaine
    // Les départements d'outre-mer ont des codes > 95 ou des codes spéciaux
    const metropoleFeatures = geoData.features.filter((feature: any) => {
      const code = feature.properties.code || feature.properties.CODE_DEPT;
      const numCode = parseInt(code);
      // Exclure les DOM-TOM (codes > 95) et les codes spéciaux
      return numCode <= 95 && numCode > 0;
    });

    // Créer un objet GeoJSON temporaire pour la France métropolitaine uniquement
    const metropoleGeoData = {
      type: "FeatureCollection" as const,
      features: metropoleFeatures,
    };

    // Créer la projection avec fitSize pour la France métropolitaine uniquement
    const projection = d3
      .geoConicConformal()
      .center([2.454071, 46.279229])
      .fitSize(
        [
          baseWidth - responsiveMapPadding * 2,
          baseHeight - responsiveMapPadding * 2,
        ],
        metropoleGeoData as any
      );

    // Appliquer un décalage pour centrer avec le padding
    const [currentX, currentY] = projection.translate();
    projection.translate([
      currentX + responsiveMapPadding,
      currentY + responsiveMapPadding,
    ]);

    const path = d3.geoPath().projection(projection);

    // Zoom handler
    function zoomed(event: any) {
      g.attr("transform", event.transform);
      g.selectAll("path").attr("stroke-width", 1 / event.transform.k);
    }

    // --- TOOLTIP AMÉLIORÉ (inspiré de la pyramide des âges) ---
    let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> =
      d3.select<HTMLDivElement, unknown>("#map-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append<HTMLDivElement>("div")
        .attr("id", "map-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(15, 23, 42, 0.95)")
        .style("color", "#f8fafc")
        .style("padding", "8px 12px") // Padding réduit pour le contenu compact
        .style("border-radius", "6px")
        .style("border", "1px solid #475569")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
        .style("backdrop-filter", "blur(8px)")
        .style("opacity", 0)
        .style("z-index", "1000")
        .style("transition", "opacity 0.2s ease"); // Transition douce
    }

    // Fonction d'affichage du tooltip
    function showTooltip(event: MouseEvent, d: any) {
      const code = normalizeCode(d.properties.code);
      const depData = data?.find(
        (dep: PopulationDepartement) => normalizeCode(dep.id) === code
      ) || null;
      
      const properties = depData || d.properties;
      const nom = properties?.nom || properties?.name || "Département";
      
      // Contenu simplifié avec juste le nom du département
      const content = `<div style="text-align: center; font-weight: 600; font-size: 14px;">${nom}</div>`;
      
      // Calculer la position du centroid du département dans l'écran
      const svgNode = ref.current;
      const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;
      const centroid = path.centroid(d);
      const transformedCentroid = transform.apply(centroid);
      const svgRect = ref.current!.getBoundingClientRect();
      
      // Position du tooltip centrée sur le département
      const screenX = svgRect.left + transformedCentroid[0];
      const screenY = svgRect.top + transformedCentroid[1] + window.scrollY;
      
      // Afficher le tooltip avec le contenu d'abord pour mesurer ses dimensions
      tooltip
        .style("opacity", 0) // Invisible pendant la mesure
        .html(content)
        .style("left", "0px")
        .style("top", "0px");
      
      // Mesurer les dimensions réelles du tooltip
      const tooltipNode = tooltip.node();
      const tooltipRect = tooltipNode!.getBoundingClientRect();
      const tooltipWidth = tooltipRect.width;
      const tooltipHeight = tooltipRect.height - 30;
      
      // Calculer la position finale en centrant sur le département
      let finalX = screenX - tooltipWidth / 2;
      let finalY = screenY - tooltipHeight - 15; // Au-dessus du département
      
      // Vérifier les limites de l'écran et ajuster si nécessaire
      if (finalX < 10) finalX = 10;
      if (finalX + tooltipWidth > window.innerWidth - 10) {
        finalX = window.innerWidth - tooltipWidth - 10;
      }
      if (finalY < 10) {
        finalY = screenY + 15; // En dessous si pas de place au-dessus
      }
      
      // Positionner et rendre visible le tooltip
      tooltip
        .style("opacity", 1)
        .style("left", finalX + "px")
        .style("top", finalY + "px");
    }
    
    function hideTooltip() {
      tooltip.style("opacity", 0);
    }

    // Zoom config (stocké en ref pour usage programmatique)
    if (!zoomRef.current) {
      zoomRef.current = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);
    }
    svg
      .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("style", "max-width: 100%; height: auto; display: block;")
      .on("click", reset)
      .call(zoomRef.current as any);

    // Dessiner les régions
    const regions = g
      .selectAll("path.region")
      .data(geoData.features)
      .join("path")
      .attr("class", "region")
      .attr("d", (d: any) => path(d))
      .attr("fill", "transparent")
      .attr("stroke", "#e5e5e530")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .on("click", clicked)
      .on("mouseover", function (event: any, d: any) {
        const svgNode = ref.current;
        const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;
        
        showTooltip(event, d);
        
        d3.select(this)
          .attr("stroke", "#f59e42")
          .attr("stroke-width", 1 / transform.k)
          .raise();
      })
      .on("mousemove", function (event: any, d: any) {
        showTooltip(event, d);
      })
      .on("mouseout", function () {
        const svgNode = ref.current;
        const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;
        
        hideTooltip();
        
        d3.select(this)
          .attr("stroke", "#e5e5e530")
          .attr("stroke-width", 1 / transform.k);
      });

    regions
      .append("title")
      .text((d: any) => d.properties.nom || d.properties.name);

    // Générer les frontières
    const boundaries = generateBoundaries(geoData.features);

    g.selectAll("path.boundary")
      .data(boundaries)
      .join("path")
      .attr("class", "boundary")
      .attr("d", (d) => path(d))
      .attr("fill", "none")
      .attr("stroke", "#ffffffcc")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("pointer-events", "none");

    function reset() {
      regions.transition().attr("fill", "transparent");
      setSelectedDep && setSelectedDep(null);
      svg
        .transition()
        .duration(750)
        .call((zoomRef.current as any).transform, d3.zoomIdentity);
    }

    function clicked(event: any, d: any) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      regions.transition().attr("fill", "transparent");
      d3.select(event.currentTarget).transition().attr("fill", "#00ff00");
      if (setSelectedDep) {
        const code = normalizeCode(d.properties.code);
        const depData =
          data?.find(
            (dep: PopulationDepartement) => normalizeCode(dep.id) === code
          ) || null;
        setSelectedDep(depData);
      }
      svg
        .transition()
        .duration(750)
        .call(
          (zoomRef.current as any).transform,
          d3.zoomIdentity
            .translate(baseWidth / 2, baseHeight / 2)
            .scale(
              Math.min(
                8,
                0.9 / Math.max((x1 - x0) / baseWidth, (y1 - y0) / baseHeight)
              )
            )
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
        );
    }

    function generateBoundaries(features: any[]) {
      const boundaries: any[] = [];
      const seen = new Set();
      for (let i = 0; i < features.length; i++) {
        for (let j = i + 1; j < features.length; j++) {
          const boundary = findCommonBoundary(
            features[i].geometry,
            features[j].geometry
          );
          if (boundary) {
            const key = JSON.stringify(boundary.coordinates);
            if (!seen.has(key)) {
              boundaries.push(boundary);
              seen.add(key);
            }
          }
        }
      }
      return boundaries;
    }

    function findCommonBoundary(geom1: any, _geom2: any) {
      return {
        type: "LineString",
        coordinates: geom1.coordinates[0].slice(0, 10),
      };
    }

    setSvgReady(true);
  }, [geoData, width, height, data, setSelectedDep, responsiveMapPadding]);

  useEffect(() => {
    if (!selectedDep || !ref.current || !gRef.current || !geoData || !svgReady)
      return;

    const svg = d3.select(ref.current);
    const g = d3.select(gRef.current);

    g.selectAll("path.region").transition().attr("fill", "transparent");

    const selectedCode = normalizeCode(selectedDep.id);

    const feature = geoData.features.find(
      (f: any) => normalizeCode(f.properties?.code) === selectedCode
    );

    if (!feature) return;

    const node = g
      .selectAll("path.region")
      .filter(function (d: any) {
        return normalizeCode(d?.properties?.code) === selectedCode;
      })
      .node();

    if (!node) return;

    // Animation GSAP sur le fill
    gsap.to(node, {
      duration: 0.5,
      attr: { fill: "#00ff00" },
      ease: "power2.out",
    });

    // Filtrer les départements pour ne garder que la France métropolitaine
    const metropoleFeatures = geoData.features.filter((feature: any) => {
      const code = feature.properties.code || feature.properties.CODE_DEPT;
      const numCode = parseInt(code);
      return numCode <= 95 && numCode > 0;
    });

    // Créer un objet GeoJSON temporaire pour la France métropolitaine uniquement
    const metropoleGeoData = {
      type: "FeatureCollection" as const,
      features: metropoleFeatures,
    };

    // Utiliser la même logique de projection que dans le premier useEffect
    const projection = d3
      .geoConicConformal()
      .center([2.454071, 46.279229])
      .fitSize(
        [
          baseWidth - responsiveMapPadding * 2,
          baseHeight - responsiveMapPadding * 2,
        ],
        metropoleGeoData as any
      );

    // Appliquer un décalage pour centrer avec le padding
    const [currentX, currentY] = projection.translate();
    projection.translate([
      currentX + responsiveMapPadding,
      currentY + responsiveMapPadding,
    ]);

    const path = d3.geoPath().projection(projection);

    const [[x0, y0], [x1, y1]] = path.bounds(feature);

    svg
      .transition()
      .duration(750)
      .call(
        (zoomRef.current as any).transform,
        d3.zoomIdentity
          .translate(baseWidth / 2, baseHeight / 2)
          .scale(
            Math.min(
              8,
              0.9 / Math.max((x1 - x0) / baseWidth, (y1 - y0) / baseHeight)
            )
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );
  }, [selectedDep, geoData, svgReady, responsiveMapPadding]);



  if (!data)
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-2"></span>
        <span>Chargement des données…</span>
      </div>
    );

  return (
    <div className="w-full mx-auto h-full">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-2xl shadow-gray-900/50 transition-all duration-300 hover:shadow-3xl hover:border-gray-600/50 text-white w-full h-full max-w-7xl mx-auto py-1"
        // style={{
        //   WebkitMaskImage:
        //     "radial-gradient(circle at 50% 50%, #000 80%, transparent 100%)",
        //   maskImage:
        //     "radial-gradient(circle at 50% 50%, #000 80%, transparent 100%)",
        // }}
      >
        {/* Header avec titre - Responsive */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-0.5 sm:w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-400 to-green-400 rounded-full"></div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-100 tracking-tight">
              Carte de France
            </h3>
          </div>
          <button
            className="bg-white/90 backdrop-blur-sm text-gray-900 p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 cursor-pointer"
            onClick={() => {
              if (ref.current && zoomRef.current) {
                d3.select(ref.current)
                  .transition()
                  .duration(750)
                  .call((zoomRef.current as any).transform, d3.zoomIdentity);
                setSelectedDep(null);
              }
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>

        {/* Conteneur de la carte avec bordure subtile et aspect ratio responsive */}
        <div className="relative px-3 pb-3">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-green-500/10 rounded-lg mx-3 mb-3 "></div>
          <div
            className="relative bg-gray-900/30 rounded-lg border border-gray-800/40 w-full overflow-hidden"
            style={{
              aspectRatio: `${baseWidth} / ${baseHeight}`,
              minHeight: "250px",
              // maxHeight: "min(70vh, 600px)",
            }}
          >
            {/* Padding interne responsive pour le SVG */}
            <div className="p-2 w-full h-full">
              <svg
                ref={ref}
                viewBox={`0 0 ${baseWidth} ${baseHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                }}
              >
                <g ref={gRef} />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FranceMapDepartement;
