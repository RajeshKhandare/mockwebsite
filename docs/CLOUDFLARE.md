# Cloudflare deployment

Cloudflare's current guidance (August 2026) recommends vinext as the default path for new Next.js applications on Cloudflare Workers. The project therefore keeps vinext scripts and avoids OpenNext-only configuration.

Before production deployment:

1. Connect this GitHub repository to Cloudflare Workers Builds.
2. Confirm the detected framework is Next.js/vinext.
3. Set public Supabase URL and anon key as build/runtime variables.
4. Keep service-role and AI provider keys server-side only.
5. Run a preview build and verify the application in the Workers runtime.
6. Configure the production custom domain only after preview verification.

Reference: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
