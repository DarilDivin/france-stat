"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import Background from "./Background";

type Props = {
    topoData: any;
    width?: number;
    height?: number;
};

const FranceMap: React.FC<Props> = ({ topoData, width = 975, height = 610 }) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!topoData || !ref.current) return;

        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", zoomed);

        svg
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto;")
            .on("click", reset);

        const path = d3.geoPath();
        const g = svg.append("g");

        // Remplace "states" par l'objet correct de ton topoData
        const statesFeature = topojson.feature(topoData, topoData.objects.states) as GeoJSON.FeatureCollection | GeoJSON.Feature;
        let statesData: GeoJSON.Feature[] = [];
        if (statesFeature.type === "FeatureCollection") {
            statesData = statesFeature.features;
        } else if (statesFeature.type === "Feature") {
            statesData = [statesFeature];
        }

        const states = g.append("g")
            .attr("fill", "#444")
            .attr("cursor", "pointer")
            .selectAll("path")
            .data(statesData)
            .join("path")
            .on("click", clicked)
            .attr("d", path as any);

        states.append("title")
            .text((d: any) => d.properties.name);

        g.append("path")
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", path(topojson.mesh(topoData, topoData.objects.states, (a: any, b: any) => a !== b) as any));

        svg.call(zoom as any);

        function reset() {
            states.transition().style("fill", null);
            svg.transition().duration(750).call(
                zoom.transform as any,
                d3.zoomIdentity,
                d3.zoomTransform(svg.node() as Element).invert([width / 2, height / 2])
            );
        }

        function clicked(event: any, d: any) {
            const [[x0, y0], [x1, y1]] = path.bounds(d);
            event.stopPropagation();
            states.transition().style("fill", null);
            d3.select(event.currentTarget).transition().style("fill", "red");
            svg.transition().duration(750).call(
                zoom.transform as any,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, svg.node())
            );
        }

        function zoomed(event: any) {
            const { transform } = event;
            g.attr("transform", transform);
            g.attr("stroke-width", 1 / transform.k);
        }
    }, [topoData, width, height]);

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
            </div>
        </div>
    );
};

export default FranceMap;
