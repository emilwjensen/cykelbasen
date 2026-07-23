import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/cykler", "/forum"],
      disallow: [
        "/admin/",
        "/annoncer/",
        "/api/",
        "/auth/",
        "/favoritter",
        "/henvendelser",
        "/mine-annoncer",
        "/mine-cykler",
        "/profil",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

