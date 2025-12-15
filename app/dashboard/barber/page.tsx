import BarberDashboard from '@/components/dashboard/barber/BarberDashboard';

export default function BarberDashboardPage({
  searchParams,
}: {
  searchParams: { name?: string; id?: string };
}) {
  return <BarberDashboard barberId={searchParams.id} barberName={searchParams.name} />;
}



