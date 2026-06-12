import ResetPasswordClient from '@/components/auth/ResetPasswordClient';
import BackToHomeLink from '@/components/auth/BackToHomeLink';
import { META_RESET_PASSWORD_DESCRIPTION, META_RESET_PASSWORD_TITLE } from '@/lib/seo-defaults';

export const metadata = {
  title: META_RESET_PASSWORD_TITLE,
  description: META_RESET_PASSWORD_DESCRIPTION,
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[100dvh] login-page-bg flex flex-col items-center justify-center p-4 sm:p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md min-w-0 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-8">
        <ResetPasswordClient />
      </div>
      <BackToHomeLink className="mt-8 text-sm text-white/90 hover:text-white font-medium drop-shadow-sm" />
    </div>
  );
}
