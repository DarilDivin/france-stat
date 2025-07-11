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
import Footer from "@/components/Footer";
import { Menu, X } from "lucide-react";
import { gsap } from "@/lib/gsap";

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Fermer le menu mobile au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('nav')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

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

      <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900/80 via-gray-800/70 to-gray-900/80 border border-gray-800/50 rounded-xl backdrop-blur-md shadow-lg mb-4">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo et titre */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <h1 className="text-base sm:text-lg lg:text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                  France Stat
                </h1>
              </div>
              <div className="hidden sm:block">
                <time
                  className="text-xs sm:text-sm lg:text-base text-gray-400 font-medium"
                  dateTime="2023"
                >
                  Données 2023
                </time>
              </div>
            </div>

            {/* Menu desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                  Population totale
                </span>
              </div>
              <SelectDepartment
                departments={data}
                selectedDep={selectedDep}
                setSelectedDep={setSelectedDep}
              />
            </div>

            {/* Bouton menu burger pour mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors duration-200"
                aria-expanded="false"
              >
                <span className="sr-only">Ouvrir le menu principal</span>
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Menu mobile */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen 
              ? 'max-h-96 opacity-100 pb-4' 
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            <div className="border-t border-gray-800/50 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <time
                  className="text-sm text-gray-400 font-medium"
                  dateTime="2023"
                >
                  Données 2023
                </time>
                <div className="px-2 py-1 rounded bg-gray-800/50 border border-gray-700/50">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                    Population
                  </span>
                </div>
              </div>
              <div className="w-full">
                <SelectDepartment
                  departments={data}
                  selectedDep={selectedDep}
                  setSelectedDep={setSelectedDep}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full p-2 sm:p-3 md:p-4 lg:p-4">
        {/* Layout principal selon le wireframe */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 ">
          {/* Colonne gauche - Carte interactive de la France */}
          <div className="lg:col-span-2 h-full">
            <div className="h-full bg-gradient-to-br from-gray-900/60 to-gray-900/20 rounded-2xl border border-gray-800/50 backdrop-blur-sm overflow-hidden group hover:border-gray-700/50 transition-all duration-300">
              <div className="relative h-full flex flex-col">
                {/* Contenu de la carte */}
                <div className="flex-1 p-0">
                  {geoData ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <FranceMapDepartement
                        geoData={geoData}
                        width={800}
                        height={630}
                        selectedDep={selectedDep}
                        setSelectedDep={setSelectedDep}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Loader
                        variant="loading-dots"
                        text="Chargement de la carte"
                        size="md"
                        className="text-foreground"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite - Cards d'informations */}
          <div className="lg:col-span-1 flex flex-col gap-3 md:gap-4 h-full">
            {/* Card Informations - Stats principales */}
            <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/30 rounded-xl border border-gray-700/30 backdrop-blur-sm p-3 hover:border-gray-600/40 transition-all duration-300 flex-1">
              <div className="space-y-1.5 h-full flex flex-col">
                {/* Nom du département */}
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5 truncate">
                    {displayedDep.nom}
                  </p>
                  <p className="text-xs text-gray-400">
                    Département {displayedDep.id}
                  </p>
                </div>

                {/* Population totale - élément principal */}
                <div className="py-0.5">
                  <p className="text-xs text-gray-400 mb-0.5">
                    Population totale
                  </p>
                  <span
                    className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block"
                    ref={numberRef}
                  >
                    {displayedDep.ensemble.total?.toLocaleString() ?? "?"}
                  </span>
                </div>

                {/* Répartition H/F - version compacte */}
                <div className="space-y-1 flex-1">
                  <p className="text-xs text-gray-400">Répartition par sexe</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Hommes */}
                    <div className="text-left">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                        <span className="text-xs text-gray-300">Hommes</span>
                      </div>
                      <p className="text-sm font-semibold text-cyan-400">
                        {displayedDep.hommes.total?.toLocaleString() ?? "?"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {displayedDep.ensemble.total &&
                        displayedDep.hommes.total
                          ? `${(
                              (displayedDep.hommes.total /
                                displayedDep.ensemble.total) *
                              100
                            ).toFixed(1)}%`
                          : "?"}
                      </p>
                    </div>

                    {/* Femmes */}
                    <div className="text-left">
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="w-1.5 h-1.5 bg-rose-400 rounded-full"></div>
                        <span className="text-xs text-gray-300">Femmes</span>
                      </div>
                      <p className="text-sm font-semibold text-rose-400">
                        {displayedDep.femmes.total?.toLocaleString() ?? "?"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {displayedDep.ensemble.total &&
                        displayedDep.femmes.total
                          ? `${(
                              (displayedDep.femmes.total /
                                displayedDep.ensemble.total) *
                              100
                            ).toFixed(1)}%`
                          : "?"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PieChart */}
            <div className="bg-gradient-to-br from-pink-900/30 to-red-900/30 rounded-xl border border-gray-800/50 backdrop-blur-sm p-0 group hover:border-pink-500/30 transition-all duration-300 flex-1">
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <PopulationPieChart department={displayedDep} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne du bas - Bar chart et Pyramide d'âge */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4 ">
          {" "}
          {/* h-[calc(40vh-40px)] */}
          {/* Bar chart */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl border border-gray-800/50 backdrop-blur-sm p-0 group hover:border-green-500/30 transition-all duration-300 h-full">
            <div className="flex flex-col h-full">
              {/* <div className="flex-1 flex items-center justify-center min-h-0"> */}
              <PopulationBarChart department={displayedDep} />
              {/* </div> */}
            </div>
          </div>
          {/* Pyramide d'âge */}
          <div className="bg-gradient-to-br from-orange-900/30 to-yellow-900/30 rounded-xl border border-gray-800/50 backdrop-blur-sm p-0 group hover:border-orange-500/30 transition-all duration-300 h-full">
            <div className="flex flex-col h-full">
              {/* <div className="flex-1 flex items-center justify-center min-h-0"> */}
              <PopulationAgePyramid department={displayedDep} />
              {/* </div> */}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
