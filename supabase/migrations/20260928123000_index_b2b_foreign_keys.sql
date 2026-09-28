create index if not exists organizations_owner_user_id_idx
  on public.organizations(owner_user_id);

create index if not exists user_subscriptions_plan_id_idx
  on public.user_subscriptions(plan_id);
