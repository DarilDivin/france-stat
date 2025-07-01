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
    <div className="bg-gray-950 min-h-screen text-foreground p-2">
      {/* <div className="opacity-10">
        <Background />
      </div> */}

      <nav className="flex h-16 bg-accent/00 w-full rounded-md p-2 justify-between items-center z-50">
        <h1 className="text-2xl font-bold">Population de France - 2023</h1>

        <SelectDepartment
          departments={data}
          selectedDep={selectedDep}
          setSelectedDep={setSelectedDep}
        />
      </nav>

      <main className="w-full flex justify-between">
        <div className="text-center p-4 z-50 bg-amber-700/00">
          {/* <DepartmentStats department={displayedDep} /> */}
          <PopulationBarChart department={displayedDep} />
          <PopulationPieChart department={displayedDep} />
          <PopulationAgePyramid department={displayedDep} />
        </div>

        <div className="bg-amber-950/00 p-4 rounded-lg flex justify-center items-center">
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
      </main>
    </div>
  );
}
