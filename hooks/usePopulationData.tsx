"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { PopulationDepartement } from "../types/population";

type PopulationContextType = {
  data: PopulationDepartement[] | null;
  selectedDep: PopulationDepartement | null;
  setSelectedDep: (d: PopulationDepartement | null) => void;
};

const PopulationContext = createContext<PopulationContextType | undefined>(
  undefined
);

export function usePopulation() {
  const ctx = useContext(PopulationContext);
  if (!ctx)
    throw new Error("usePopulation must be used within PopulationProvider");
  return ctx;
}

export function PopulationContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<PopulationDepartement[] | null>(null);
  const [selectedDep, setSelectedDep] = useState<PopulationDepartement | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/population")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <PopulationContext.Provider value={{ data, selectedDep, setSelectedDep }}>
      {children}
    </PopulationContext.Provider>
  );
}
