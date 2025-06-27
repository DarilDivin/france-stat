interface PopulationTranche {
  "0_19": number | null;
  "20_39": number | null;
  "40_59": number | null;
  "60_74": number | null;
  "75_plus": number | null;
  total: number | null;
}

interface PopulationDepartement {
  id: string;
  nom: string;
  ensemble: PopulationTranche;
  hommes: PopulationTranche;
  femmes: PopulationTranche;
}

export type { PopulationTranche, PopulationDepartement };