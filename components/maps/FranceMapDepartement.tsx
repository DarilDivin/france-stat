import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { usePopulation } from "@/hooks/usePopulationData";
import { PopulationDepartement } from "@/types/population";

type Props = {
  geoData: any;
  width?: number;
  height?: number;
  selectedDep: PopulationDepartement | null;
  setSelectedDep: (d: PopulationDepartement | null) => void;
};

// L'échelle séquentielle a besoin de vraies couleurs (d3 les interpole),
// donc pas de var(--xxx) ici — deux jeux de teintes selon le thème.
const SEQ = {
  dark: { light: "#bcd4e8", dark: "#1d3f5c", fallback: "#2a2a28" },
  light: { light: "#dbe9f5", dark: "#0b3a63", fallback: "#d8d8d4" },
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const seq = isDark ? SEQ.dark : SEQ.light;

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

    // Échelle séquentielle : couleur = population totale du département
    const totals = (data ?? []).map((d) => d.ensemble.total ?? 0);
    const colorScale = d3
      .scaleLinear<string, string>()
      .domain((d3.extent(totals) as [number, number]) ?? [0, 1])
      .range([seq.light, seq.dark]);

    function fillFor(feature: any) {
      const code = normalizeCode(feature.properties.code);
      const dep = data?.find((d: PopulationDepartement) => normalizeCode(d.id) === code);
      const total = dep?.ensemble.total;
      return total != null ? colorScale(total) : seq.fallback;
    }

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
      g.selectAll("path.region, path.boundary").attr("stroke-width", 1 / event.transform.k);
      g.select("path.selection-ring").attr("stroke-width", 3 / event.transform.k);
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
        .style("background", "var(--popover)")
        .style("color", "var(--popover-foreground)")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("border", "1px solid var(--border)")
        .style("font-size", "13px")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
        .style("opacity", 0)
        .style("z-index", "1000")
        .style("transition", "opacity 0.2s ease");
    }

    // Fonction d'affichage du tooltip
    function showTooltip(event: MouseEvent, d: any) {
      const code = normalizeCode(d.properties.code);
      const depData = data?.find(
        (dep: PopulationDepartement) => normalizeCode(dep.id) === code
      ) || null;

      const properties = depData || d.properties;
      const nom = properties?.nom || properties?.name || "Département";
      const total = depData?.ensemble.total;

      const content = `
        <div style="text-align: center; font-weight: 600;">${nom}</div>
        ${
          total != null
            ? `<div style="text-align: center; font-size: 12px; opacity: 0.7; margin-top: 2px;">${total.toLocaleString("fr-FR")} habitants</div>`
            : ""
        }
      `;

      // Suit le curseur, comme le ferait l'attribut title natif — pas de
      // calcul de centroïde, sinon le tooltip se fige loin de la souris.
      tooltip
        .html(content)
        .style("left", event.pageX + 14 + "px")
        .style("top", event.pageY + 18 + "px")
        .style("opacity", 1);
    }

    function hideTooltip() {
      tooltip.style("opacity", 0);
    }

    // Zoom config (stocké en ref pour usage programmatique)
    if (!zoomRef.current) {
      zoomRef.current = d3.zoom().scaleExtent([1, 90]).on("zoom", zoomed);
    }
    svg
      .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("style", "max-width: 100%; height: auto; display: block;")
      .on("click", reset)
      .call(zoomRef.current as any);

    // Dessiner les régions — le fill (choroplèthe) est posé une fois pour toutes ;
    // seul le stroke change ensuite (survol / sélection), voir zoomed()/clicked().
    const regions = g
      .selectAll("path.region")
      .data(geoData.features)
      .join("path")
      .attr("class", "region")
      .attr("d", (d: any) => path(d))
      .attr("fill", (d: any) => fillFor(d))
      .attr("stroke", "color-mix(in oklch, var(--foreground) 12%, transparent)")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .on("click", clicked)
      .on("mouseover", function (event: any, d: any) {
        const svgNode = ref.current;
        const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;

        showTooltip(event, d);

        d3.select(this)
          .attr("stroke", "var(--brand)")
          .attr("stroke-width", 1.5 / transform.k)
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
          .attr("stroke", "color-mix(in oklch, var(--foreground) 12%, transparent)")
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
      .attr("stroke", "color-mix(in oklch, var(--foreground) 80%, transparent)")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("pointer-events", "none");

    function reset() {
      setSelectedDep && setSelectedDep(null);
      svg
        .transition()
        .duration(750)
        .call((zoomRef.current as any).transform, d3.zoomIdentity);
    }

    function clicked(event: any, d: any) {
      event.stopPropagation();
      if (setSelectedDep) {
        const code = normalizeCode(d.properties.code);
        const depData =
          data?.find(
            (dep: PopulationDepartement) => normalizeCode(dep.id) === code
          ) || null;
        setSelectedDep(depData);
      }
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
  }, [geoData, width, height, data, setSelectedDep, responsiveMapPadding, seq]);

  // Anneau de sélection : superposé au-dessus des régions, ne touche jamais leur fill.
  useEffect(() => {
    if (!ref.current || !gRef.current || !geoData || !svgReady) return;

    const svg = d3.select(ref.current);
    const g = d3.select(gRef.current);

    if (!selectedDep) {
      g.select("path.selection-ring").remove();
      return;
    }

    const selectedCode = normalizeCode(selectedDep.id);

    const feature = geoData.features.find(
      (f: any) => normalizeCode(f.properties?.code) === selectedCode
    );

    if (!feature) {
      g.select("path.selection-ring").remove();
      return;
    }

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

    const k = d3.zoomTransform(ref.current).k;
    let ring = g.select<SVGPathElement>("path.selection-ring");
    if (ring.empty()) {
      ring = g
        .append("path")
        .attr("class", "selection-ring")
        .attr("fill", "none")
        .attr("pointer-events", "none");
    }
    // Posé directement (pas de GSAP) : zoomed() est la seule autorité sur
    // stroke-width par la suite, pour éviter que les deux ne se disputent
    // l'attribut pendant la transition de zoom ci-dessous.
    ring
      .attr("d", path(feature) as string)
      .attr("stroke", "var(--brand)")
      .attr("stroke-width", 3 / k);

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
              90,
              0.9 / Math.max((x1 - x0) / baseWidth, (y1 - y0) / baseHeight)
            )
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );
  }, [selectedDep, geoData, svgReady, responsiveMapPadding]);

  if (!data)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mr-2"></span>
        <span>Chargement des données…</span>
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <p className="text-[12.5px] tracking-wide uppercase text-muted-foreground">
          <span style={{ color: "var(--brand)" }}>●</span>{" "}
          Territoire — {selectedDep ? selectedDep.nom : "France entière"}
        </p>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Réinitialiser la vue"
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
      </div>

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative flex-1 overflow-hidden"
        style={{
          minHeight: 250,
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 68%, transparent 100%)",
          maskImage: "radial-gradient(ellipse at center, #000 68%, transparent 100%)",
        }}
      >
        <svg
          ref={ref}
          viewBox={`0 0 ${baseWidth} ${baseHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          style={{ maxWidth: "100%", height: "auto", display: "block" }}
        >
          <g ref={gRef} />
        </svg>
      </motion.div>

      <div className="flex justify-between text-[12.5px] text-muted-foreground mt-2.5">
        <span>Fig. 1 — Population par département</span>
        <span>
          <b className="text-foreground/80 font-semibold">101</b> départements, dont 5 DROM
        </span>
      </div>
      <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
        <span>Moins peuplé</span>
        <span
          className="flex-1 h-1.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${seq.light}, ${seq.dark})` }}
        />
        <span>Plus peuplé</span>
      </div>
    </div>
  );
};

export default FranceMapDepartement;
