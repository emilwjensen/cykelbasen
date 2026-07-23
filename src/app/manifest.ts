import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cykelbasen",
    short_name: "Cykelbasen",
    description:
      "Dansk markedsplads for brugte racercykler med strukturerede data og dokumenteret ejerskab.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ec",
    theme_color: "#0d2c22",
    lang: "da",
  };
}

