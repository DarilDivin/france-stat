"use client";

import { useEffect, useRef, useState } from "react";
import Background from "@/components/Background";
import FranceMapDepartement from "@/components/maps/FranceMapDepartement";
import { usePopulation } from "@/hooks/usePopulationData";
import PopulationBarChart from "@/components/charts/PopulationBarChart";
import { aggregateFrance } from "@/utils/aggregateFrance";
import PopulationPieChart from "@/components/charts/PopulationPieChart";
import PopulationAgePyramid from "@/components/charts/PopulationAgePyramid";
import SelectDepartment from "@/components/SelectDepartement";
import { Loader } from "@/components/ui/loader";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import { SplitText } from "gsap/SplitText"; // Si tu veux TextSplit (GSAP 3+)
gsap.registerPlugin(ScrambleTextPlugin, TextPlugin, SplitText);

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);

  const { data, selectedDep, setSelectedDep } = usePopulation();

  const displayedDep = selectedDep ?? aggregateFrance(data ?? []);

  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (numberRef.current && displayedDep.ensemble.total != null) {
      // Scramble effect
      gsap.to(numberRef.current, {
        scrambleText: {
          text: displayedDep.ensemble.total.toLocaleString(),
          chars: "𓂀𓆣𓅓𓏏", // caractères hiéroglyphiques égyptiens  𓊹𓃭𓆑𓎛𓋴𓄿
          revealDelay: 0.2,
          speed: 0.5,
        },
        duration: 1,
        ease: "power2.out",
      });

      // Split effect (slide chaque chiffre)
      // const split = new SplitText(numberRef.current, { type: "chars" });
      // gsap.from(split.chars, {
      //   y: 30,
      //   stagger: 0.03,
      //   duration: 0.5,
      //   ease: "power2.out",
      // });
    }
  }, [displayedDep.ensemble.total]);

  useEffect(() => {
    fetch("/data/france-departements-avec-outre-mer.geojson")
      .then((res) => res.json())
      .then(setGeoData);
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full">
        <Loader
          variant="loading-dots"
          text="Chargement"
          size="lg"
          className="text-foreground"
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen text-foreground md:p-2">
      {/* <div className="opacity-10">
        <Background />
      </div> */}

      <nav className="flex flex-col md:flex-row gap-4 h-16 bg-accent/00 w-full rounded-md p-2 justify-between items-center z-50">
        <h1 className="text-2xl font-bold">Population de France - 2023</h1>

        <SelectDepartment
          departments={data}
          selectedDep={selectedDep}
          setSelectedDep={setSelectedDep}
        />
      </nav>

      <main className="w-full flex flex-col-reverse md:flex-row mt-8 md:mt-0 justify-between">
        <div className="md:p-4 z-50 bg-amber-700/0">
          <h2 className="pl-4 text-sm font-bold mb-2">
            {displayedDep.nom} ({displayedDep.id})
          </h2>
          <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
            <div className="mb-1 md:p-4 flex flex-col items-start">
              <span
                className="font-semibold text-3xl w-[200px] bg-gradient-to-r from-blue-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent"
                ref={numberRef}
              >
                {displayedDep.ensemble.total?.toLocaleString() ?? "?"}
              </span>
            </div>
            <PopulationPieChart department={displayedDep} />
          </div>

          <PopulationBarChart department={displayedDep} />
          <PopulationAgePyramid department={displayedDep} />
        </div>

        <div className="invisible hidden md:visible bg-amber-950/0 p-4 rounded-lg md:flex justify-center items-center">
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
