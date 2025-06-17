"use client";

import { useEffect, useState } from "react";
// import FranceMap from "@/components/FranceMap";
import Background from "@/components/Background";
import FranceMap from "@/components/FranceMapTest";
// import FranceMap from "@/components/FranceMapClickZoom";

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/data/france-departements-avec-outre-mer.geojson")
      .then((res) => res.json())
      .then(setGeoData);
  }, []);

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="opacity-10">
        <Background />
      </div>
      <div className="bg-background p-4 rounded-lg shadow-md flex justify-center items-center h-screen">
      {geoData && <FranceMap geoData={geoData} width={1000} height={900} />}
      </div>
    </div>
  );
} 