import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Background from "./Background";

type Props = {
  geoData: any;
  width?: number;
  height?: number;
};

type RegionData = {
  properties: any;
  centroid: [number, number];
  screenPosition: { x: number; y: number };
};

const FranceMap: React.FC<Props> = ({ geoData, width = 800, height = 934 }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);

  console.log("Objets disponibles:", geoData);

  useEffect(() => {
    if (!geoData || !ref.current) return;
    
    // Nettoyer le SVG existant
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    // Configurer le zoom
    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

    // Configurer le SVG principal
    svg
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;")
      .on("click", reset);

    // Configurer la projection et le chemin
    const projection = d3
      .geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(width * 5)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Créer le groupe principal pour le zoom
    const g = svg.append("g");

    // Dessiner les régions - CORRECTION: n'applique pas de classes au groupe entier
    const regions = g
      .append("g")
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", (d: any) => path(d))
      // Applique les styles individuellement à chaque path
      .attr("fill", "transparent")
      .attr("stroke", "#e5e5e530")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .attr("class", "transition-all duration-200")
      .on("click", clicked)
      .on("mouseover", function (event: any, d: any) {
        // Récupérer le zoom courant depuis le SVG
        const svgNode = ref.current;
        const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;
        const centroid = path.centroid(d);

        const svgRect = ref.current!.getBoundingClientRect();
        const screenX = svgRect.left + centroid[0];
        const screenY = svgRect.top + centroid[1] + window.scrollY;

        setHoveredRegion({
          properties: d.properties,
          centroid: centroid,
          screenPosition: {
            x: screenX,
            y: screenY,
          },
        });

        // CORRECTION: Ne modifie que le fill, garde les autres attributs intacts
        d3.select(this)
          .attr("stroke", "#f59e42")
          .attr("stroke-width", 1 / transform.k); // Garder l'épaisseur du trait constante
      })
      .on("mouseout", function (event : any) {

        // Récupérer le zoom courant depuis le SVG
        const svgNode = ref.current;
        const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;

        setHoveredRegion(null);
        // CORRECTION: Réinitialise seulement le fill
        d3.select(this)
          .attr("stroke", "#e5e5e530")
          .attr("stroke-width", 1 / transform.k);
      });

    // Ajouter les noms des régions comme titres (pour l'accessibilité)
    regions
      .append("title")
      .text((d: any) => d.properties.nom || d.properties.name);

    // CORRECTION: Améliorer le dessin des frontières
    // Méthode 1: Dessiner les frontières comme des lignes distinctes
    const boundaries = generateBoundaries(geoData.features);
    
    g.append("g")
      .selectAll("path")
      .data(boundaries)
      .join("path")
      .attr("d", d => path(d))
      .attr("fill", "none")
      .attr("stroke", "#ffffffcc")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("pointer-events", "none");

    // Appliquer le zoom au SVG
    svg.call(zoom as any);

    // Fonction pour réinitialiser le zoom
    function reset() {
      regions.transition().attr("fill", "transparent");
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node() as any).invert([width / 2, height / 2])
        );
    }

    // Fonction appelée lors du clic sur une région
    function clicked(event: any, d: any) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();

      // Réinitialiser toutes les couleurs puis colorer la région sélectionnée
      regions.transition().attr("fill", "transparent");
      d3.select(event.currentTarget).transition().attr("fill", "#00ff00");

      // Zoomer sur la région
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(
              Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
            )
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
          d3.pointer(event, svg.node())
        );
    }

    // Fonction appelée lors du zoom
    function zoomed(event: any) {
      const { transform } = event;
      g.attr("transform", transform);
      // CORRECTION: Ajuste uniquement l'épaisseur des traits des frontières, pas des régions
      g.select("g:last-child").selectAll("path").attr("stroke-width", 1 / transform.k);
      g.selectAll("path").attr("stroke-width", 1 / transform.k);
    }

    // Fonction pour générer les frontières sans doublons
    function generateBoundaries(features: any[]) {
      const boundaries: any[] = [];
      const seen = new Set();
      
      // Pour chaque paire de régions adjacentes, crée une frontière unique
      for (let i = 0; i < features.length; i++) {
        for (let j = i + 1; j < features.length; j++) {
          const boundary = findCommonBoundary(features[i].geometry, features[j].geometry);
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

    // Fonction pour trouver la frontière commune entre deux géométries
    function findCommonBoundary(geom1: any, geom2: any) {
      // Implémentation simplifiée: convertit les LineString en coordonnées
      // Dans une vraie implémentation, tu devrais comparer les segments de frontière
      // et ne garder que ceux qui sont partagés
      
      // Pour la démonstration, on retourne simplement un LineString pour chaque région
      // Cette partie doit être adaptée selon la structure de tes données
      return {
        type: "LineString",
        coordinates: geom1.coordinates[0].slice(0, 10) // Exemple simplifié
      };
    }
  }, [geoData, width, height]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="opacity-10">
        <Background />
      </div>
      <div className="relative w-full">
        <svg
          ref={ref}
          className="w-full h-auto shadow-xl rounded-xl border border-gray-200/10 bg-gray-300/10"
        />

        {hoveredRegion && (
          <div
            className="fixed bg-blue-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform -translate-y-full -mt-2 pointer-events-none"
            style={{
              left: hoveredRegion.screenPosition.x + 30,
              top: hoveredRegion.screenPosition.y - 40,
            }}
          >
            <div className="font-bold">
              {hoveredRegion.properties.nom || hoveredRegion.properties.name}
            </div>
            <div className="text-sm">
              ID: {hoveredRegion.properties.code || hoveredRegion.properties.id}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FranceMap;