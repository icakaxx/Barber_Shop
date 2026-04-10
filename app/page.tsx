import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import {
  OG_IMAGE_PATH,
  SEO_DESCRIPTION_BG,
  SEO_TITLE_BG,
} from "@/lib/seo-defaults";

export const metadata: Metadata = {
  title: SEO_TITLE_BG,
  description: SEO_DESCRIPTION_BG,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: "/",
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

export default function Home() {
  return <LandingPage />;
}
