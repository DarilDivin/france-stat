interface PopulationHistoryEntry {
  id: string;
  nom: string;
  series: Record<string, number>; // année (ex. "1990") -> population totale
}

export type { PopulationHistoryEntry };
