import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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

type RegionData = {
  properties: PopulationDepartement | any;
  centroid: [number, number];
  screenPosition: { x: number; y: number };
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [svgReady, setSvgReady] = useState(false);

  const { data } = usePopulation();

  useEffect(() => {
    setSvgReady(false);
    if (!geoData || !ref.current || !gRef.current) return;

    const svg = d3.select(ref.current);
    const g = d3.select(gRef.current);
    g.selectAll("*").remove();

    // Projection et path
    const projection = d3
      .geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(width * 5)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Zoom handler
    function zoomed(event: any) {
      g.attr("transform", event.transform);
      g.selectAll("path").attr("stroke-width", 1 / event.transform.k);
    }

    // Zoom config (stocké en ref pour usage programmatique)
    if (!zoomRef.current) {
      zoomRef.current = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);
    }
    svg
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;")
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
      .on("mouseover", function (_: any, d: any) {
        const svgNode = ref.current;
        const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;
        const centroid = path.centroid(d);
        const svgRect = ref.current!.getBoundingClientRect();
        const screenX = svgRect.left + centroid[0];
        const screenY = svgRect.top + centroid[1] + window.scrollY;
        const code = normalizeCode(d.properties.code);
        const depData =
          data?.find(
            (dep: PopulationDepartement) => normalizeCode(dep.id) === code
          ) || null;
        setHoveredRegion({
          properties: depData || d.properties,
          centroid: centroid,
          screenPosition: {
            x: screenX,
            y: screenY,
          },
        });
        d3.select(this)
          .attr("stroke", "#f59e42")
          .attr("stroke-width", 1 / transform.k)
          .raise();
      })
      .on("mouseout", function () {
        const svgNode = ref.current;
        const transform = svgNode ? d3.zoomTransform(svgNode) : d3.zoomIdentity;
        setHoveredRegion(null);
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
            .translate(width / 2, height / 2)
            .scale(
              Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
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
  }, [geoData, width, height, data, setSelectedDep]);

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

    // d3.select(node).transition().attr("fill", "#00ff00");
    // Animation GSAP sur le fill
    gsap.to(node, {
      duration: 0.5,
      attr: { fill: "#00ff00" },
      ease: "power2.out",
    });

    const svgWidth = Number(svg.attr("width")) || 800;
    const svgHeight = Number(svg.attr("height")) || 934;

    const projection = d3
      .geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(svgWidth * 5)
      .translate([svgWidth / 2, svgHeight / 2]);

    const path = d3.geoPath().projection(projection);
    const [[x0, y0], [x1, y1]] = path.bounds(feature);

    svg
      .transition()
      .duration(750)
      .call(
        (zoomRef.current as any).transform,
        d3.zoomIdentity
          .translate(svgWidth / 2, svgHeight / 2)
          .scale(
            Math.min(
              8,
              0.9 / Math.max((x1 - x0) / svgWidth, (y1 - y0) / svgHeight)
            )
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );
  }, [selectedDep, geoData, svgReady]);

  useLayoutEffect(() => {
    if (hoveredRegion && tooltipRef.current) {
      gsap.fromTo(
        tooltipRef.current,
        { scale: 0.8, y: 20 },
        { scale: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [hoveredRegion]);

  if (!data)
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-2"></span>
        <span>Chargement des données…</span>
      </div>
    );

  return (
    <div className="w-full mx-auto min-w-[300px] lg:min-w-[1008px]">
      {/* <div className="opacity-10">
        <Background />
      </div> */}
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative bg-zinc-600/00 text-white p-1 rounded-xl z-50 min-w-[250px]"
        style={{
          WebkitMaskImage:
            "radial-gradient(circle at 50% 50%, #000 80%, transparent 100%)",
          maskImage:
            "radial-gradient(circle at 50% 50%, #000 80%, transparent 100%)",
        }}
      >
        <button
          className="absolute top-4 right-4 z-50 bg-white text-black p-1 rounded-full shadow hover:bg-white hover:text-gray-800 transition cursor-pointer"
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
          <LucideChevronsRightLeft className="rotate-45" />
        </button>
        <svg
          ref={ref}
          className="w-full h-auto"
          //shadow-xl rounded-xl border border-gray-200/10 bg-gray-300/10
        >
          <g ref={gRef} />
        </svg>

        {hoveredRegion && (
          <motion.div
            ref={tooltipRef}
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
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default FranceMapDepartement;
