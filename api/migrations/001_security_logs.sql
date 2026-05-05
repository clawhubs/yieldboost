create table if not exists security_logs (
  id bigserial primary key,
  wallet_address text not null,
  action_type text not null check (action_type in ('Seal', 'Unseal', 'Delete')),
  status text not null check (status in ('Success', 'Blocked')),
  layer_failed text,
  payload_metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create index if not exists security_logs_wallet_idx
  on security_logs (lower(wallet_address));

create index if not exists security_logs_action_status_idx
  on security_logs (action_type, status, timestamp desc);
