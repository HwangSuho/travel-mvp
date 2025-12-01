import RequireAuth from "@/components/auth/RequireAuth";
import PlanClient from "./PlanClient";

type PlanPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params;
  return (
    <RequireAuth>
      <PlanClient tripId={id} />
    </RequireAuth>
  );
}
