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
gsap.registerPlugin(ScrambleTextPlugin, TextPlugin);

export default function Home() {
  const [geoData, setGeoData] = useState<any>(null);

  const { data, selectedDep, setSelectedDep } = usePopulation();

  const displayedDep = selectedDep ?? aggregateFrance(data ?? []);

  const numberRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (numberRef.current && displayedDep.ensemble.total != null) {
      // Scramble effect sur les nombres
      gsap.to(numberRef.current, {
        scrambleText: {
          text: displayedDep.ensemble.total.toLocaleString(),
          chars: "0123456789",
          revealDelay: 0.1,
          speed: 0.8,
        },
        duration: 0.8,
        ease: "power2.out",
      });
    }
  }, [displayedDep.ensemble.total]);

  useEffect(() => {
    fetch("/data/france-departements-avec-outre-mer.geojson")
      .then((res) => res.json())
      .then(setGeoData);
  }, []);

  // Animation d'apparition des cards
  useEffect(() => {
    if (mainRef.current) {
      const cards = cardsRef.current.filter(Boolean);
      
      // Animation d'apparition en cascade
      gsap.set(cards, { opacity: 0, y: 20, scale: 0.95 });
      
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [data, geoData]);

  // Animation des hover states
  const handleCardHover = (index: number, isHovering: boolean) => {
    const card = cardsRef.current[index];
    if (card) {
      gsap.to(card, {
        scale: isHovering ? 1.02 : 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

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
    <div className="bg-gray-950 min-h-screen text-foreground overflow-x-hidden">
      {/* <div className="opacity-10">
        <Background />
      </div> */}

      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 shadow-lg">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Logo et titre */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-white">
                  Population de France
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                  Données 2023
                </p>
              </div>
            </div>

            {/* Sélecteur de département */}
            <div className="w-full sm:w-auto sm:min-w-[250px] md:min-w-[280px] lg:min-w-[320px]">
              <SelectDepartment
                departments={data}
                selectedDep={selectedDep}
                setSelectedDep={setSelectedDep}
              />
            </div>

            {/* Indicateur mobile */}
            <div className="sm:hidden text-center">
              <span className="text-xs text-gray-400">2023</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full p-3 sm:p-4 md:p-6 lg:p-8" ref={mainRef}>
        {/* Bento Grid Container - Design moderne avec différentes tailles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 auto-rows-fr min-h-[calc(100vh-120px)]">
          
          {/* Carte de France - Élément principal héro */}
          <div 
            ref={el => { cardsRef.current[0] = el; }}
            className="sm:col-span-2 lg:col-span-3 xl:col-span-4 lg:row-span-2 bg-gradient-to-br from-gray-900/60 to-gray-900/20 rounded-2xl border border-gray-800/50 backdrop-blur-sm overflow-hidden group hover:border-gray-700/50 transition-all duration-300"
            onMouseEnter={() => handleCardHover(0, true)}
            onMouseLeave={() => handleCardHover(0, false)}
          >
            <div className="relative h-full flex flex-col min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
              {/* Header de la carte */}
              <div className="p-4 sm:p-6 border-b border-gray-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-green-400 rounded-full"></div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Carte de France</h2>
                  </div>
                  <button
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-200"
                    onClick={() => {
                      if (selectedDep) {
                        setSelectedDep(null);
                      }
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Contenu de la carte */}
              <div className="flex-1 p-4 sm:p-6">
                {geoData ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <FranceMapDepartement
                      geoData={geoData}
                      width={800}
                      height={600}
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

          {/* Stats principales - Population totale */}
          <div 
            ref={el => { cardsRef.current[1] = el; }}
            className="lg:col-span-1 xl:col-span-2 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl border border-gray-800/50 backdrop-blur-sm p-4 sm:p-6 group hover:border-blue-500/30 transition-all duration-300"
            onMouseEnter={() => handleCardHover(1, true)}
            onMouseLeave={() => handleCardHover(1, false)}
          >
            <div className="flex flex-col h-full min-h-[200px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
                <h3 className="text-lg font-bold text-white">Population</h3>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-sm sm:text-base font-semibold text-gray-300 mb-2 truncate">
                  {displayedDep.nom} ({displayedDep.id})
                </h2>
                
                <div className="text-center">
                  <span className="text-xs text-gray-400 block mb-2">Population totale</span>
                  <span
                    className="font-bold text-2xl sm:text-3xl lg:text-4xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block"
                    ref={numberRef}
                  >
                    {displayedDep.ensemble.total?.toLocaleString() ?? "?"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique Camembert */}
          <div 
            ref={el => { cardsRef.current[2] = el; }}
            className="bg-gradient-to-br from-pink-900/30 to-red-900/30 rounded-2xl border border-gray-800/50 backdrop-blur-sm p-4 sm:p-6 group hover:border-pink-500/30 transition-all duration-300"
            onMouseEnter={() => handleCardHover(2, true)}
            onMouseLeave={() => handleCardHover(2, false)}
          >
            <div className="flex flex-col h-full min-h-[200px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-8 bg-gradient-to-b from-pink-400 to-red-400 rounded-full"></div>
                <h3 className="text-sm font-bold text-white">Répartition H/F</h3>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <PopulationPieChart department={displayedDep} />
              </div>
            </div>
          </div>

          {/* Stats Hommes */}
          <div 
            ref={el => { cardsRef.current[3] = el; }}
            className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-2xl border border-gray-800/50 backdrop-blur-sm p-4 sm:p-6 group hover:border-cyan-500/30 transition-all duration-300"
            onMouseEnter={() => handleCardHover(3, true)}
            onMouseLeave={() => handleCardHover(3, false)}
          >
            <div className="flex flex-col h-full min-h-[160px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-6 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></div>
                <h3 className="text-sm font-bold text-white">Hommes</h3>
              </div>
              <div className="flex-1 flex flex-col justify-center text-center">
                <span className="text-xs text-gray-400 block mb-2">Population masculine</span>
                <span className="font-bold text-xl sm:text-2xl text-cyan-400 block">
                  {displayedDep.hommes.total?.toLocaleString() ?? "?"}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {displayedDep.ensemble.total && displayedDep.hommes.total ? 
                    `${((displayedDep.hommes.total / displayedDep.ensemble.total) * 100).toFixed(1)}%` 
                    : "?"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Femmes */}
          <div 
            ref={el => { cardsRef.current[4] = el; }}
            className="bg-gradient-to-br from-rose-900/30 to-pink-900/30 rounded-2xl border border-gray-800/50 backdrop-blur-sm p-4 sm:p-6 group hover:border-rose-500/30 transition-all duration-300"
            onMouseEnter={() => handleCardHover(4, true)}
            onMouseLeave={() => handleCardHover(4, false)}
          >
            <div className="flex flex-col h-full min-h-[160px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-6 bg-gradient-to-b from-rose-400 to-pink-400 rounded-full"></div>
                <h3 className="text-sm font-bold text-white">Femmes</h3>
              </div>
              <div className="flex-1 flex flex-col justify-center text-center">
                <span className="text-xs text-gray-400 block mb-2">Population féminine</span>
                <span className="font-bold text-xl sm:text-2xl text-rose-400 block">
                  {displayedDep.femmes.total?.toLocaleString() ?? "?"}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {displayedDep.ensemble.total && displayedDep.femmes.total ? 
                    `${((displayedDep.femmes.total / displayedDep.ensemble.total) * 100).toFixed(1)}%` 
                    : "?"}
                </span>
              </div>
            </div>
          </div>

          {/* Graphique en Barres */}
          <div 
            ref={el => { cardsRef.current[5] = el; }}
            className="sm:col-span-2 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl border border-gray-800/50 backdrop-blur-sm p-4 sm:p-6 group hover:border-green-500/30 transition-all duration-300"
            onMouseEnter={() => handleCardHover(5, true)}
            onMouseLeave={() => handleCardHover(5, false)}
          >
            <div className="flex flex-col h-full min-h-[200px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-8 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full"></div>
                <h3 className="text-lg font-bold text-white">Tranches d'âge</h3>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <PopulationBarChart department={displayedDep} />
              </div>
            </div>
          </div>

          {/* Pyramide des âges - Pleine largeur */}
          <div 
            ref={el => { cardsRef.current[6] = el; }}
            className="sm:col-span-2 lg:col-span-4 xl:col-span-6 bg-gradient-to-br from-orange-900/30 to-yellow-900/30 rounded-2xl border border-gray-800/50 backdrop-blur-sm p-4 sm:p-6 group hover:border-orange-500/30 transition-all duration-300"
            onMouseEnter={() => handleCardHover(6, true)}
            onMouseLeave={() => handleCardHover(6, false)}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-yellow-400 rounded-full"></div>
                <h3 className="text-lg font-bold text-white">Pyramide des âges</h3>
              </div>
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <PopulationAgePyramid department={displayedDep} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
