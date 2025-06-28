import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Background from "../Background";

import { motion } from "motion/react";
import { usePopulation } from "@/hooks/usePopulationData";
import { PopulationDepartement } from "@/types/population";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  geoData: any;
  width?: number;
  height?: number;
  selectedDep: PopulationDepartement | null;
  setSelectedDep: (d: PopulationDepartement | null) => void;
};

type RegionData = {
  properties: PopulationDepartement | any;
  centroid: [number, number];
  screenPosition: { x: number; y: number };
};

function normalizeCode(code: string | number) {
  // Garde les DOM/TOM (2A, 2B, 971...) tels quels, mais normalise les codes numériques sans zéro à gauche
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
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);

    const [svgReady, setSvgReady] = useState(false);

  const { data } = usePopulation();
  console.log("Population data:", data);

  useEffect(() => {
    setSvgReady(false);
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
      .on("mouseover", function (_: any, d: any) {
        // Récupérer le zoom courant depuis le SVG
        const svgNode = ref.current;
        const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;
        const centroid = path.centroid(d);

        const svgRect = ref.current!.getBoundingClientRect();
        const screenX = svgRect.left + centroid[0];
        const screenY = svgRect.top + centroid[1] + window.scrollY;

        // Transforme le code en nombre si possible (ex: "03" -> 3)
        // const code =
        //   d.properties.code && !isNaN(Number(d.properties.code))
        //     ? String(Number(d.properties.code))
        //     : d.properties.code;

        const code = normalizeCode(d.properties.code);

        const depData =
          data?.find(
            (dep: PopulationDepartement) => normalizeCode(dep.id) === code
          ) || null;

        // Mettre à jour l'état de la région survolée
        setHoveredRegion({
          properties: depData || d.properties,
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
      .on("mouseout", function () {
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
      .attr("d", (d) => path(d))
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
      setSelectedDep && setSelectedDep(null);
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
      if (setSelectedDep) {
        console.log("Clicked on region:", d.properties.code);

        const code = normalizeCode(d.properties.code);

        const depData =
          data?.find(
            (dep: PopulationDepartement) => normalizeCode(dep.id) === code
          ) || null;

        console.log("Population data for region:", depData);

        setSelectedDep(depData);
      }

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
      g.select("g:last-child")
        .selectAll("path")
        .attr("stroke-width", 1 / transform.k);
      g.selectAll("path").attr("stroke-width", 1 / transform.k);
    }

    // Fonction pour générer les frontières sans doublons
    function generateBoundaries(features: any[]) {
      const boundaries: any[] = [];
      const seen = new Set();

      // Pour chaque paire de régions adjacentes, crée une frontière unique
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

    // Fonction pour trouver la frontière commune entre deux géométries
    function findCommonBoundary(geom1: any, _geom2: any) {
      // Implémentation simplifiée: convertit les LineString en coordonnées
      // Dans une vraie implémentation, tu devrais comparer les segments de frontière
      // et ne garder que ceux qui sont partagés

      // Pour la démonstration, on retourne simplement un LineString pour chaque région
      // Cette partie doit être adaptée selon la structure de tes données
      return {
        type: "LineString",
        coordinates: geom1.coordinates[0].slice(0, 10), // Exemple simplifié
      };
    }


    setSvgReady(true);
  }, [geoData, width, height, data]);


// useEffect(() => {

//   console.log("Highlight useEffect", { selectedDep, svgReady, geoData });

//   if (!selectedDep || !ref.current || !geoData || !svgReady) return;

//   const svg = d3.select(ref.current);

//   svg.selectAll("path").transition().attr("fill", "transparent");

//   const selectedCode = normalizeCode(selectedDep.id);

//     console.log(selectedCode);

//     console.log(
//   "selectedCode", selectedCode,
//   "codes in geoData",
//   geoData.features.map((f: any) => ({
//     code: f.properties?.code,
//     id: f.properties?.id,
//     normCode: normalizeCode(f.properties?.code),
//     normId: normalizeCode(f.properties?.id),
//   }))
// );


//   const feature = geoData.features.find(
//     (f: any) =>
//       normalizeCode(f.properties?.code) === selectedCode
//   );

//   console.log("Feature found:", feature);

//   if (!feature) return;

//   const node = svg
//     .selectAll("path")
//     .filter(function (d: any) {
//       return (
//         d?.properties?.code?.toString() === selectedCode ||
//         d?.properties?.id?.toString() === selectedCode
//       );
//     })
//     .node();

//     console.log(selectedCode, feature, node);

//   if (!node) return;

//   d3.select(node).transition().attr("fill", "#00ff00");

//   const svgWidth = Number(svg.attr("width")) || 800;
//   const svgHeight = Number(svg.attr("height")) || 934;

//   const projection = d3
//     .geoConicConformal()
//     .center([2.454071, 46.279229])
//     .scale(svgWidth * 5)
//     .translate([svgWidth / 2, svgHeight / 2]);

//   const path = d3.geoPath().projection(projection);
//   const [[x0, y0], [x1, y1]] = path.bounds(feature);

//   svg
//     .transition()
//     .duration(750)
//     .call(
//       (svg as any).call?.__zoom?.transform || (() => {}),
//       d3.zoomIdentity
//         .translate(svgWidth / 2, svgHeight / 2)
//         .scale(
//           Math.min(
//             8,
//             0.9 / Math.max((x1 - x0) / svgWidth, (y1 - y0) / svgHeight)
//           )
//         )
//         .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
//     );
// }, [selectedDep, geoData, svgReady]);

  if (!data) return <div>Chargement des données…</div>;

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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bg-zinc-600/0 text-white p-1 rounded-sm shadow-lg z-50 transform pointer-events-none min-w-[250px]"
            style={{
              left: hoveredRegion.screenPosition.x + 30,
              top: hoveredRegion.screenPosition.y - 40,
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-bold text-2xl">
                  {hoveredRegion.properties?.nom ||
                    hoveredRegion.properties?.name}
                </CardTitle>
                <CardDescription>
                  Code :{" "}
                  {hoveredRegion.properties?.id ||
                    hoveredRegion.properties?.code ||
                    hoveredRegion.properties?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hoveredRegion.properties?.ensemble ? (
                  <>
                    <div>
                      Population totale :{" "}
                      {hoveredRegion.properties.ensemble.total?.toLocaleString() ??
                        "?"}
                    </div>
                    <div>
                      Hommes :{" "}
                      {hoveredRegion.properties.hommes.total?.toLocaleString() ??
                        "?"}
                    </div>
                    <div>
                      Femmes :{" "}
                      {hoveredRegion.properties.femmes.total?.toLocaleString() ??
                        "?"}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-400">
                    Aucune donnée de population
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="font-light text-xs text-foreground/50">
                  Daril.fr @ All Rights Reserved
                </p>
              </CardFooter>
            </Card>

            {/* <div className="font-bold">
              {hoveredRegion.properties?.nom || hoveredRegion.properties?.name}
            </div>
            <div className="text-sm">
              {hoveredRegion.properties?.code || hoveredRegion.properties?.id}
            </div>
            <div className="text-sm">
              {hoveredRegion.properties?.ensemble?.total}
            </div> */}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FranceMapDepartement;