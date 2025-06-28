import { PopulationDepartement } from "@/types/population";

type Props = {
  department: PopulationDepartement | null;
};

export default function DepartmentStats({ department }: Props) {
  if (!department) {
    return <div className="text-gray-400">Aucun département sélectionné.</div>;
  }

  return (
    <div className="bg-background/80 rounded-lg shadow p-4 mb-4">
      <h2 className="text-xl font-bold mb-2">{department.nom} ({department.id})</h2>
      <div className="mb-1">Population totale : <span className="font-semibold">{department.ensemble.total?.toLocaleString() ?? "?"}</span></div>
      <div className="mb-1">Hommes : <span className="font-semibold">{department.hommes.total?.toLocaleString() ?? "?"}</span></div>
      <div className="mb-1">Femmes : <span className="font-semibold">{department.femmes.total?.toLocaleString() ?? "?"}</span></div>
      {/* Ajoute ici d'autres stats si besoin */}
    </div>
  );
}