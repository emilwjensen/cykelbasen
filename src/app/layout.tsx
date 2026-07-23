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
    <html lang="da">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

