import type { MetadataRoute } from "next";
import { SITE_URL } from "@/ui/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/plan/", "/plans"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
