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

  useEffect(() => {
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
      .scale(width * 3.6)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Créer le groupe principal pour le zoom
    const g = svg.append("g");

    // Dessiner les régions
    const regions = g
      .append("g")
    //   .attr("fill", "#38bdf8")
    .attr("stroke", "#e5e5e530")
    .attr("class", "stroke-1 stroke-gray-300/10")
    .attr(
      "class",
      "fill-transparent transition-all duration-200 cursor-pointer hover:stroke-2"
    )
    .attr("cursor", "pointer")
    .selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("class", "fill-transparent transition-all duration-200 cursor-pointer stroke-1 stroke-gray-300/10") // <-- Ajouté pour forcer la classe de base
    .on("click", clicked)
    .on("mouseover", function (event, d: any) {
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

      d3.select(this).attr("class", "fill-orange-400 transition-all duration-200 cursor-pointer stroke-1 stroke-gray-300/10"); // <-- Ajouté pour garder stroke-1
    })
    .on("mouseout", function () {
        setHoveredRegion(null);
        d3.select(this).attr("class", "fill-transparent");
      })
      .attr("d", (d: any) => path(d));

    // Ajouter les noms des régions comme titres (pour l'accessibilité)
    regions
      .append("title")
      .text((d: any) => d.properties.nom || d.properties.name);

    // Dessiner les frontières entre les régions
    // Dessiner les frontières entre les régions sans topojson
    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "#ffffffcc") // blanc avec transparence (~80%)
      .attr("stroke-width", 1) // épaisseur uniforme
      .attr("stroke-linejoin", "round")
      .attr("pointer-events", "none")
      .attr("d", () => {
        // Dessine tous les contours des régions (pas de double contour)
        return path({
          type: "MultiLineString",
          coordinates: geoData.features
            .map((feature: any) => feature.geometry.coordinates)
            .flat(),
        });
      });

    // Appliquer le zoom au SVG
    svg.call(zoom as any);

    // Fonction pour réinitialiser le zoom
    function reset() {
      regions.transition().attr("class", "fill-transparent");
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
    //   regions.transition().style("fill", "#38bdf8");
      regions.transition().attr("class", "fill-transparent");
      d3.select(event.currentTarget).transition().attr("class", "fill-orange-400");

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
      g.attr("stroke-width", 1 / transform.k);
    }
  }, [geoData, width, height]);

  return (
    // Conteneur avec taille maximale et centrage
    <div className="w-full max-w-5xl mx-auto">
      <div className="opacity-10">
        <Background />
      </div>
      {/* Wrapper pour maintenir les proportions */}
      <div className="relative w-full">
        <svg
          ref={ref}
          className="w-full h-auto shadow-xl rounded-xl border border-gray-200/10 stroke-1 bg-gray-300/10"
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
