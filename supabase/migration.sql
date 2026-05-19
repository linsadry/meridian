-- ============================================================
-- MERIDIAN — Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── TURNOS ──────────────────────────────────────────────────
create table if not exists public.turnos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,

  -- Clínica
  clinica_id       text not null,

  -- Timestamps do turno
  saida_casa       timestamptz,
  chegada_clinica  timestamptz,
  atendimento_inicio timestamptz,
  atendimento_fim  timestamptz,
  chegada_casa     timestamptz,

  -- Avaliações
  humor            text check (humor in ('otimo','bom','neutro','cansado','esgotado')),
  desgaste         int  check (desgaste between 1 and 5),
  transito         text check (transito in ('leve','moderado','intenso')),
  observacoes      text,

  -- Status
  status           text not null default 'ativo'
                   check (status in ('ativo','concluido','cancelado')),

  -- Missão (nullable — só preenchido em viagens)
  missao_cidade              text,
  missao_meio                text,
  missao_noites              int,
  missao_dias_consecutivos   int,
  missao_tempo_viagem_h      numeric(5,2),
  missao_hospedagem_proxima  boolean,

  -- Metadados
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Índices
create index if not exists turnos_user_id_idx      on public.turnos(user_id);
create index if not exists turnos_clinica_id_idx   on public.turnos(clinica_id);
create index if not exists turnos_saida_casa_idx   on public.turnos(saida_casa desc);
create index if not exists turnos_status_idx       on public.turnos(status);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists turnos_updated_at on public.turnos;
create trigger turnos_updated_at
  before update on public.turnos
  for each row execute procedure public.handle_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table public.turnos enable row level security;

-- Users can only see their own turnos
create policy "turnos: select own"
  on public.turnos for select
  using (auth.uid() = user_id);

create policy "turnos: insert own"
  on public.turnos for insert
  with check (auth.uid() = user_id);

create policy "turnos: update own"
  on public.turnos for update
  using (auth.uid() = user_id);

create policy "turnos: delete own"
  on public.turnos for delete
  using (auth.uid() = user_id);

-- ── VIEWS ────────────────────────────────────────────────────

-- Computed metrics per turno (used by analytics queries)
create or replace view public.turnos_metrics as
select
  id,
  user_id,
  clinica_id,
  saida_casa,
  chegada_casa,
  atendimento_inicio,
  atendimento_fim,
  status,
  humor,
  desgaste,
  transito,
  -- durations in minutes
  extract(epoch from (chegada_clinica - saida_casa)) / 60       as min_ida,
  extract(epoch from (atendimento_fim - atendimento_inicio)) / 60 as min_atendimento,
  extract(epoch from (chegada_casa - atendimento_fim)) / 60      as min_volta,
  extract(epoch from (chegada_casa - saida_casa)) / 60           as min_total_fora,
  -- produtividade %
  case
    when chegada_casa is not null and saida_casa is not null
      and atendimento_fim is not null and atendimento_inicio is not null
      and (chegada_casa - saida_casa) > interval '0'
    then round(
      extract(epoch from (atendimento_fim - atendimento_inicio)) /
      extract(epoch from (chegada_casa - saida_casa)) * 100
    )
    else null
  end as produtividade_pct,
  -- missao flag
  (missao_cidade is not null) as is_missao,
  missao_cidade,
  missao_noites,
  missao_tempo_viagem_h,
  created_at
from public.turnos
where status = 'concluido';

-- ============================================================
-- DONE — your Meridian database is ready.
-- ============================================================
