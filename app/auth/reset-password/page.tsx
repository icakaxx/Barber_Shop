import Link from 'next/link';
import ResetPasswordClient from '@/components/auth/ResetPasswordClient';

export const metadata = {
  title: 'Нова парола | Barber King',
  description: 'Задайте нова парола за акаунта си',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen login-page-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
        <ResetPasswordClient />
      </div>
      <Link href="/" className="mt-8 text-sm text-white/90 hover:text-white font-medium drop-shadow-sm">
        ← Начало
      </Link>
    </div>
  );
}
