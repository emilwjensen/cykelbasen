import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ComparisonTray } from "@/features/listings/components/compare-controls";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Cykelbasen – brugte racercykler med dokumenteret ejerskab",
    template: "%s · Cykelbasen",
  },
  description:
    "Find brugte racer-, gravel- og triatloncykler med strukturerede specifikationer og dokumenteret ejerskab.",
  openGraph: {
    type: "website",
    locale: "da_DK",
    siteName: "Cykelbasen",
    title: "Cykelbasen – brugte racercykler med dokumenteret ejerskab",
    description:
      "Find brugte racercykler med strukturerede specifikationer og dokumenteret ejerskab.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="da">
      <body>
        <a className="skip-link" href="#main-content">
          Gå til indhold
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <ComparisonTray />
        <SiteFooter />
      </body>
    </html>
  );
}
