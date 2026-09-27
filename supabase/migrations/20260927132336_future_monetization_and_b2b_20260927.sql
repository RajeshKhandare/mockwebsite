-- Future-ready server-managed monetization, AI usage, affiliate, institute and API foundations.
create table if not exists public.plans (
 id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text,
 billing_interval text check(billing_interval in ('month','year','one_time')), price_minor integer not null default 0,
 currency text not null default 'INR', entitlements jsonb not null default '{}'::jsonb, is_active boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.user_subscriptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 plan_id uuid not null references public.plans(id), status text not null check(status in ('trialing','active','past_due','cancelled','expired')),
 provider text, provider_customer_id text, provider_subscription_id text, current_period_end timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ai_usage_events (
 id bigint generated always as identity primary key, user_id uuid references auth.users(id) on delete set null,
 action text not null, units integer not null default 1, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.affiliate_clicks (
 id bigint generated always as identity primary key, user_id uuid references auth.users(id) on delete set null,
 partner text not null, placement text, target text, session_id text, created_at timestamptz not null default now()
);
create table if not exists public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, owner_user_id uuid references auth.users(id) on delete set null,
 status text not null default 'active' check(status in ('active','suspended','archived')), settings jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists public.organization_members (
 organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'student' check(role in ('owner','admin','reviewer','teacher','student')), status text not null default 'active',
 created_at timestamptz not null default now(), primary key(organization_id,user_id)
);
create table if not exists public.organization_test_templates (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 test_template_id uuid not null references public.test_templates(id) on delete cascade,
 visibility text not null default 'private' check(visibility in ('private','members')), created_at timestamptz not null default now(),
 primary key(organization_id,test_template_id)
);
create table if not exists public.api_clients (
 id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete cascade,
 name text not null, key_hash text unique not null, scopes text[] not null default array[]::text[], rate_limit_per_minute integer not null default 60,
 is_active boolean not null default true, created_at timestamptz not null default now(), last_used_at timestamptz
);
create table if not exists public.api_usage (
 id bigint generated always as identity primary key, api_client_id uuid not null references public.api_clients(id) on delete cascade,
 endpoint text not null, units integer not null default 1, status_code integer, created_at timestamptz not null default now()
);

alter table public.plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_test_templates enable row level security;
alter table public.api_clients enable row level security;
alter table public.api_usage enable row level security;

create policy "public active plans" on public.plans for select to anon,authenticated using(is_active);
create policy "own subscriptions" on public.user_subscriptions for select to authenticated using((select auth.uid())=user_id);
create policy "own ai usage" on public.ai_usage_events for select to authenticated using((select auth.uid())=user_id);
create policy "own affiliate clicks" on public.affiliate_clicks for select to authenticated using((select auth.uid())=user_id);
create policy "own organization membership" on public.organization_members for select to authenticated using((select auth.uid())=user_id);
create policy "organization members server managed" on public.organizations for all to anon,authenticated using(false) with check(false);
create policy "organization test templates server managed" on public.organization_test_templates for all to anon,authenticated using(false) with check(false);
create policy "api clients server managed" on public.api_clients for all to anon,authenticated using(false) with check(false);
create policy "api usage server managed" on public.api_usage for all to anon,authenticated using(false) with check(false);
create policy "plans server managed" on public.plans for insert to anon,authenticated with check(false);
create policy "plans server managed update" on public.plans for update to anon,authenticated using(false) with check(false);
create policy "plans server managed delete" on public.plans for delete to anon,authenticated using(false);
create policy "subscriptions server managed" on public.user_subscriptions for insert to anon,authenticated with check(false);
create policy "subscriptions server managed update" on public.user_subscriptions for update to anon,authenticated using(false) with check(false);
create policy "ai usage server managed insert" on public.ai_usage_events for insert to anon,authenticated with check(false);
create policy "affiliate server managed insert" on public.affiliate_clicks for insert to anon,authenticated with check(false);

create index if not exists user_subscriptions_user_idx on public.user_subscriptions(user_id,status);
create index if not exists ai_usage_user_idx on public.ai_usage_events(user_id,created_at desc);
create index if not exists affiliate_clicks_user_idx on public.affiliate_clicks(user_id,created_at desc);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists organization_test_templates_template_idx on public.organization_test_templates(test_template_id);
create index if not exists api_clients_org_idx on public.api_clients(organization_id);
create index if not exists api_usage_client_idx on public.api_usage(api_client_id,created_at desc);

grant select on public.plans to anon,authenticated;
grant select on public.user_subscriptions,public.ai_usage_events,public.affiliate_clicks,public.organization_members to authenticated;
grant all on public.plans,public.user_subscriptions,public.ai_usage_events,public.affiliate_clicks,public.organizations,public.organization_members,public.organization_test_templates,public.api_clients,public.api_usage to service_role;