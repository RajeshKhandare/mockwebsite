import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SITE_URL: "https://mockwebsite.rajeshkhandare788.workers.dev",
    NEXT_PUBLIC_SUPABASE_URL: "https://vhbtqsnhfxztaofrigax.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_iWK-uMR6mLVzi1dLopmc3g_oacyQb8H",
  },
};

export default nextConfig;
