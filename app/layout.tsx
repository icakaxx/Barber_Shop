import type { Metadata } from "next";
import "./globals.css";
import DevNav from "@/components/shared/DevNav";

export const metadata: Metadata = {
  title: "Barber King | Premium Haircuts & Beard Trims in Sofia",
  description: "Book your next haircut at Barber King – professional barbers, modern salon, easy online booking. Sofia's top-rated barber shop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900">
        {children}
        <DevNav />
      </body>
    </html>
  );
}

