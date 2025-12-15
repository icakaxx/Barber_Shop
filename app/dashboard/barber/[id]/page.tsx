import BarberDashboard from '@/components/dashboard/barber/BarberDashboard';

export default function IndividualBarberDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  return <BarberDashboard barberId={params.id} />;
}

