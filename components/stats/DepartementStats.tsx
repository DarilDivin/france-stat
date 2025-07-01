import { PopulationDepartement } from "@/types/population";

type Props = {
  department: PopulationDepartement | null;
};

export default function DepartmentStats({ department }: Props) {
  if (!department) {
    return <div className="text-gray-400">Aucun département sélectionné.</div>;
  }

  return (
    <div className="bg-background/00 rounded-lg p-1 mb-4 w-[300px] flex flex-col justify-center items-start">
      <h2 className="text-sm font-bold mb-2">
        {department.nom} ({department.id})
      </h2>
      <div className="mb-1 flex flex-col items-start">
        {/* <p className="text-xs text-foreground/60">Population totale :</p>{" "} */}
        <span className="font-semibold text-3xl">
          {department.ensemble.total?.toLocaleString() ?? "?"}
        </span>
      </div>
      {/* <div className="mb-1 flex flex-col items-start">
        <p className="text-xs text-foreground/60">Hommes :</p>{" "}
        <span className="font-semibold text-2xl">
          {department.hommes.total?.toLocaleString() ?? "?"}
        </span>
      </div>
      <div className="mb-1 flex flex-col items-start">
        <p className="text-xs text-foreground/60">Femmes :</p>{" "}
        <span className="font-semibold text-2xl">
          {department.femmes.total?.toLocaleString() ?? "?"}
        </span>
      </div> */}
      {/* Ajoute ici d'autres stats si besoin */}
    </div>
  );
}
