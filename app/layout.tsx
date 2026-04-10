import type { Metadata, Viewport } from "next";
import "./globals.css";
import RecoveryHashRedirect from "@/components/auth/RecoveryHashRedirect";
import { I18nProvider } from "@/contexts/I18nContext";

export const metadata: Metadata = {
  title: "Barber King | Premium Haircuts & Beard Trims in Sofia",
  description: "Book your next haircut at Barber King – professional barbers, modern salon, easy online booking. Sofia's top-rated barber shop.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" className="scroll-smooth">
      <body className="bg-white text-gray-900 antialiased overflow-x-hidden min-h-[100dvh]">
        <I18nProvider>
          <RecoveryHashRedirect />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

