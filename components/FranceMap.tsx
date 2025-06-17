import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

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
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!geoData || !ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const projection = d3
      .geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(width * 3.6)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Configurer le comportement de zoom
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8]) // Min/max zoom scale
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        // Ajuster l'épaisseur du trait selon le niveau de zoom
        g.selectAll("path").attr("stroke-width", 1 / event.transform.k);
      });

       // Appliquer le zoom au SVG
    svg.call(zoom as any);

    // Fonction pour zoomer sur une région spécifique
    const zoomToFeature = (d: any) => {
      const bounds = path.bounds(d);
      const dx = bounds[1][0] - bounds[0][0];
      const dy = bounds[1][1] - bounds[0][1];
      const x = (bounds[0][0] + bounds[1][0]) / 2;
      const y = (bounds[0][1] + bounds[1][1]) / 2;

      // Calculer le facteur de zoom
      const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
      const translate = [width / 2 - scale * x, height / 2 - scale * y];

      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );

      setIsZoomed(true);
    };

    // Fonction pour réinitialiser le zoom
    const resetZoom = () => {
      svg
        .transition()
        .duration(750)
        .call(
            zoom.transform as any,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node() as Element).invert([width / 2, height / 2])
        );

      setIsZoomed(false);
    };

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    g.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("stroke", "#e5e5e530")
      .attr("class", "stroke-1 stroke-gray-300/10")
      .attr(
        "class",
        "fill-transparent transition-all duration-200 cursor-pointer hover:stroke-2"
      )
      .on("mouseover", function (event, d: any) {
        const centroid = path.centroid(d);

        // Récupérer la position de l'élément SVG dans la page
        const svgRect = ref.current!.getBoundingClientRect();

        // Convertir les coordonnées SVG en coordonnées de page
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

        d3.select(this).attr("class", "fill-orange-400");
      })
      .on("mouseout", function () {
        setHoveredRegion(null);
        // d3.select(this).attr("fill", "#38bdf8");
        d3.select(this).attr("class", "fill-transparent");
      })
      .on("click", function (event, d) {
        event.stopPropagation(); // Empêche la propagation de l'événement

        if (isZoomed) {
          resetZoom();
        } else {
          zoomToFeature(d);
        }
      });

    // Clic sur l'arrière-plan pour réinitialiser le zoom
    svg.on("click", function () {
      if (isZoomed) {
        resetZoom();
      }
    });
  }, [geoData, width, height, isZoomed]);

  return (
    // Conteneur avec taille maximale et centrage
    <div className="w-full max-w-5xl mx-auto">
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

        {/* Bouton pour réinitialiser le zoom */}
        {isZoomed && (
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 bg-background p-2 rounded-full shadow-lg z-10 hover:bg-gray-700   "
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default FranceMap;
