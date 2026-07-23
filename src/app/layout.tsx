import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cykelbasen – brugte racercykler med dokumenteret ejerskab",
    template: "%s · Cykelbasen",
  },
  description:
    "Find brugte racer-, gravel- og triatloncykler med strukturerede specifikationer og dokumenteret ejerskab.",
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
        <SiteFooter />
      </body>
    </html>
  );
}
