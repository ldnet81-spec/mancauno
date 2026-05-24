import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mancauno.it";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/e/", "/club/"],
        disallow: ["/admin", "/profilo", "/notifiche", "/auth", "/eventi"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
