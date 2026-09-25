import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://mockwebsite.example";
  return ["/","/exams","/tests"].map((path) => ({ url: base + path, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.8 }));
}
