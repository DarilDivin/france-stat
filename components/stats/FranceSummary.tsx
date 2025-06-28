import { usePopulation } from "@/hooks/usePopulationData";

export default function FranceSummary() {
  const { data } = usePopulation();

  if (!data) return <div>Chargement…</div>;

  const total = data.reduce(
    (acc, dep) => {
      acc.ensemble += dep.ensemble.total ?? 0;
      acc.hommes += dep.hommes.total ?? 0;
      acc.femmes += dep.femmes.total ?? 0;
      return acc;
    },
    { ensemble: 0, hommes: 0, femmes: 0 }
  );

  return (
    <div className="bg-background/80 rounded-lg shadow p-4 mb-4">
      <h2 className="text-xl font-bold mb-2">Population France entière</h2>
      <div>Population totale : <span className="font-semibold">{total.ensemble.toLocaleString()}</span></div>
      <div>Hommes : <span className="font-semibold">{total.hommes.toLocaleString()}</span></div>
      <div>Femmes : <span className="font-semibold">{total.femmes.toLocaleString()}</span></div>
    </div>
  );
}