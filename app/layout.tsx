import type { Metadata, Viewport } from "next";
import "./globals.css";
import RecoveryHashRedirect from "@/components/auth/RecoveryHashRedirect";
import { I18nProvider } from "@/contexts/I18nContext";
import {
  metadataBase,
  OG_IMAGE_PATH,
  SEO_DESCRIPTION_BG,
  SEO_TITLE_BG,
} from "@/lib/seo-defaults";

export const metadata: Metadata = {
  metadataBase,
  title: SEO_TITLE_BG,
  description: SEO_DESCRIPTION_BG,
  openGraph: {
    title: SEO_TITLE_BG,
    description: SEO_DESCRIPTION_BG,
    locale: "bg_BG",
    alternateLocale: ["en_US"],
    type: "website",
    images: [{ url: OG_IMAGE_PATH }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE_BG,
    description: SEO_DESCRIPTION_BG,
    images: [OG_IMAGE_PATH],
  },
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
