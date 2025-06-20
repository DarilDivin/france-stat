"use client";

import { useEffect, useState } from "react";
import Background from "@/components/Background";
// import FranceMap from "@/components/FranceMapTopoJson";
// import FranceMap from "@/components/FranceMap";
import FranceMap from "@/components/FranceMapTest";
import FranceMapDepartement from "@/components/maps/FranceMapDepartement";
// import FranceMap from "@/components/FranceMapClickZoom";

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/data/france-departements-avec-outre-mer.geojson")
    // fetch("/data/states-albers-10m.json")
      .then((res) => res.json())
      .then(setGeoData);
  }, []);

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="opacity-10">
        <Background />
      </div>
      <div className="bg-background p-4 rounded-lg shadow-md flex justify-center items-center h-screen">
      {geoData && <FranceMapDepartement geoData={geoData} width={1000} height={900} />}
      </div>
    </div>
  );
} 