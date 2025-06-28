"use client";

import { useEffect, useState } from "react";
import Background from "@/components/Background";
import FranceMapDepartement from "@/components/maps/FranceMapDepartement";
import { usePopulation } from "@/hooks/usePopulationData";
import DepartmentStats from "@/components/stats/DepartementStats";
import FranceSummary from "@/components/stats/FranceSummary";
import PopulationBarChart from "@/components/charts/PopulationBarChart";
import { aggregateFrance } from "@/utils/aggregateFrance";
import PopulationPieChart from "@/components/charts/PopulationPieChart";
import PopulationAgePyramid from "@/components/charts/PopulationAgePyramid";
import SelectDepartment from "@/components/SelectDepartement";

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

  if (!data) {
    return <div>Chargement des données…</div>;
  }
  const displayedDep = selectedDep ?? aggregateFrance(data);

  return (
    <div className="bg-background min-h-screen text-foreground flex ">
      <div className="opacity-10">
        <Background />
      </div>

      <div className="text-center p-4 z-50">
        <h1 className="text-3xl font-bold mb-4">
          Carte des Départements Français
        </h1>
        <p className="text-lg mb-2">
          Sélectionnez un département pour voir les détails de la population.
        </p>
        <SelectDepartment
          departments={data}
          selectedDep={selectedDep}
          setSelectedDep={setSelectedDep}
        />
        <DepartmentStats department={displayedDep} />
        <PopulationBarChart department={displayedDep} />
        <PopulationPieChart department={displayedDep} />
        <PopulationAgePyramid department={displayedDep}/>
      </div>

      <div className="bg-background p-4 rounded-lg shadow-md flex justify-center items-center h-screen">
        {geoData && (
          <FranceMapDepartement
            geoData={geoData}
            width={1000}
            height={900}
            selectedDep={selectedDep}
            setSelectedDep={setSelectedDep}
          />
        )}
      </div>
    </div>
  );
}
