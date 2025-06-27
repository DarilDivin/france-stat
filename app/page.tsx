"use client";

import { useEffect, useState } from "react";
import Background from "@/components/Background";
import FranceMapDepartement from "@/components/maps/FranceMapDepartement";
import { usePopulation } from "@/hooks/usePopulationData";

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);

  const { data, selectedDep, setSelectedDep } = usePopulation();

  console.log(data);
  console.log(selectedDep);
  

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

      <div className="text-center p-4">
        <h1 className="text-3xl font-bold mb-4">Carte des Départements Français</h1>
        <p className="text-lg mb-2">Sélectionnez un département pour voir les détails de la population.</p>
        {selectedDep && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold">{selectedDep.nom}</h2>
            <p>Population totale: {selectedDep.ensemble.total}</p>
            <p>Hommes: {selectedDep.hommes.total}</p>
            <p>Femmes: {selectedDep.femmes.total}</p>
          </div>
        )}
      </div>

      <div className="bg-background p-4 rounded-lg shadow-md flex justify-center items-center h-screen">
        {geoData && (
          <FranceMapDepartement
            geoData={geoData}
            width={1000}
            height={900}
          />
        )}
      </div>
    </div>
  );
}
