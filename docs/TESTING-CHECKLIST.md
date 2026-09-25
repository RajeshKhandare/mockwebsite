# Testing Checklist

## Foundation
- [ ] install
- [ ] lint
- [ ] typecheck
- [ ] unit tests
- [ ] production build

## Auth
- [ ] register
- [ ] login
- [ ] logout
- [ ] expired session
- [ ] unauthorized access denied

## Exam
- [ ] exam listing
- [ ] stage selection
- [ ] test template selection
- [ ] language selection
- [ ] instructions
- [ ] start

## Test engine
- [ ] timer
- [ ] answer selection
- [ ] clear response
- [ ] mark for review
- [ ] question palette
- [ ] save/next
- [ ] previous
- [ ] refresh/re-entry behavior
- [ ] submit guard
- [ ] auto-save

## Scoring
- [ ] correct
- [ ] incorrect
- [ ] skipped
- [ ] negative marking
- [ ] section metrics
- [ ] topic metrics
- [ ] result persistence
- [ ] explanation visibility after submit

## AI pipeline
- [ ] generation request validation
- [ ] schema validation
- [ ] four-option validation
- [ ] answer validation
- [ ] duplicate detection
- [ ] language validation
- [ ] approval workflow

## Security
- [ ] service key not client-exposed
- [ ] AI key not client-exposed
- [ ] answer key protected
- [ ] RLS tested
- [ ] admin authorization tested
- [ ] rate limiting tested
- [ ] private pages noindex

## SEO
- [ ] title
- [ ] description
- [ ] canonical
- [ ] sitemap
- [ ] robots
- [ ] structured data
- [ ] breadcrumbs
- [ ] 404
- [ ] internal links

## Production
- [ ] Cloudflare build succeeds
- [ ] runtime verification succeeds
- [ ] Supabase connectivity
- [ ] production auth
- [ ] production test attempt
- [ ] production scoring
- [ ] mobile verification
- [ ] no critical console errors
