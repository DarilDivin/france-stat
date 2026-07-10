"use client";

import { useEffect, useRef, useState } from "react";
import FranceMapDepartement from "@/components/maps/FranceMapDepartement";
import { usePopulation } from "@/hooks/usePopulationData";
import PopulationBarChart from "@/components/charts/PopulationBarChart";
import { aggregateFrance } from "@/utils/aggregateFrance";
import PopulationSplitBar from "@/components/charts/PopulationSplitBar";
import PopulationAgePyramid from "@/components/charts/PopulationAgePyramid";
import PopulationRanking from "@/components/charts/PopulationRanking";
import PopulationTrendChart from "@/components/charts/PopulationTrendChart";
import SelectDepartment from "@/components/SelectDepartement";
import ThemeToggle from "@/components/ThemeToggle";
import { Loader } from "@/components/ui/loader";
import Footer from "@/components/Footer";
import { gsap } from "@/lib/gsap";

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);

  const { data, selectedDep, setSelectedDep } = usePopulation();

  const displayedDep = selectedDep ?? aggregateFrance(data ?? []);

  const numberRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (numberRef.current && displayedDep.ensemble.total != null) {
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
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
        {/* Masthead */}
        <header className="flex items-baseline justify-between gap-6 pb-4 border-b border-border flex-wrap">
          <div>
            <div className="font-display text-2xl sm:text-3xl flex items-baseline gap-2.5">
              <b className="font-bold">France</b>
              <span style={{ color: "var(--brand)" }}>·</span>Stat
            </div>
            <div className="text-[12.5px] tracking-widest uppercase text-muted-foreground mt-1">
              Recensement INSEE — millésime 2023
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SelectDepartment
              departments={data}
              selectedDep={selectedDep}
              setSelectedDep={setSelectedDep}
            />
            <ThemeToggle />
          </div>
        </header>

        {/* Hero : carte + chiffre-clé */}
        <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-8 lg:gap-14 items-center py-8 lg:py-10">
          <div className="min-w-0">
            {geoData ? (
              <FranceMapDepartement
                geoData={geoData}
                width={800}
                height={630}
                selectedDep={selectedDep}
                setSelectedDep={setSelectedDep}
              />
            ) : (
              <div className="flex justify-center items-center h-64">
                <Loader
                  variant="loading-dots"
                  text="Chargement de la carte"
                  size="md"
                  className="text-foreground"
                />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[12.5px] tracking-widest uppercase text-muted-foreground mb-1.5">
              Population totale
            </p>
            <p
              ref={numberRef}
              className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] leading-none mb-6"
            >
              {displayedDep.ensemble.total?.toLocaleString() ?? "?"}
            </p>

            <PopulationSplitBar department={displayedDep} />

            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[42ch] pt-5 border-t border-border">
              Sélectionnez un département sur la carte ou via le menu ci-dessus pour
              mettre à jour l&rsquo;ensemble des chiffres de la page.
            </p>
          </div>
        </div>

        {/* Figures : bar chart et pyramide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-border">
          <div className="py-7 sm:pr-8 sm:border-r border-border">
            <PopulationBarChart department={displayedDep} />
          </div>
          <div className="py-7 sm:pl-8">
            <PopulationAgePyramid department={displayedDep} />
          </div>
        </div>

        {/* Classement des départements */}
        <div className="border-t border-border py-7">
          <PopulationRanking />
        </div>

        {/* Évolution 1975-2023 */}
        <div className="border-t border-border py-7">
          <PopulationTrendChart department={displayedDep} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
