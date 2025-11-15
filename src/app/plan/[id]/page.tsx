import PlanClient from "./PlanClient";

type PlanPageProps = {
  params: { id: string };
};

export default function PlanPage({ params }: PlanPageProps) {
  return <PlanClient tripId={params.id} />;
}
