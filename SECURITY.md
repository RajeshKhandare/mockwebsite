# Security Baseline

- Never commit secrets.
- Use Cloudflare secrets/bindings for server credentials.
- Supabase service-role key is server-only.
- AI credentials are server-only.
- Never return correct answers for future questions to the client.
- Never trust client-provided score, marks or result.
- Validate all request bodies.
- Authorize every protected server operation.
- Apply rate limits to authentication, test creation, answer submission and admin generation endpoints.
- Use secure session handling through Supabase Auth.
- Review caching for private responses.
- Avoid leaking internal errors.
- Keep admin endpoints inaccessible to ordinary users.
- Test RLS with both authorized and unauthorized users.
