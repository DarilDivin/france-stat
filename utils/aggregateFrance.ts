import { PopulationDepartement } from "@/types/population";

export function aggregateFrance(data: PopulationDepartement[]): PopulationDepartement {
  const emptyTranches = { "0_19": 0, "20_39": 0, "40_59": 0, "60_74": 0, "75_plus": 0, total: 0 };
  const france: PopulationDepartement = {
    id: "FR",
    nom: "France entière",
    ensemble: { ...emptyTranches },
    hommes: { ...emptyTranches },
    femmes: { ...emptyTranches },
  };

  data.forEach(dep => {
    (["ensemble", "hommes", "femmes"] as const).forEach(group => {
      (Object.keys(emptyTranches) as (keyof typeof emptyTranches)[]).forEach(tranche => {
        (france[group] ?? {})[tranche] = ((france[group]?.[tranche] ?? 0) + (dep[group]?.[tranche] ?? 0));
      });
    });
  });

  return france;
}