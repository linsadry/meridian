/**
 * Meridian — Data Layer
 *
 * All reads/writes go through here.
 * When Supabase is not configured, falls back to localStorage.
 */

import { supabase } from './supabase'

const LOCAL_KEY = 'meridian_turnos_v1'

// ── helpers ──────────────────────────────────────────────────

const toLocal = (row) => ({
  id:                  row.id,
  clinicaId:           row.clinica_id,
  saidaCasa:           row.saida_casa          ? new Date(row.saida_casa).getTime()           : null,
  chegadaClinica:      row.chegada_clinica      ? new Date(row.chegada_clinica).getTime()      : null,
  atendimentoInicio:   row.atendimento_inicio   ? new Date(row.atendimento_inicio).getTime()   : null,
  atendimentoFim:      row.atendimento_fim      ? new Date(row.atendimento_fim).getTime()      : null,
  chegadaCasa:         row.chegada_casa         ? new Date(row.chegada_casa).getTime()         : null,
  humor:               row.humor,
  desgaste:            row.desgaste,
  transito:            row.transito,
  observacoes:         row.observacoes,
  status:              row.status,
  missao: row.missao_cidade ? {
    cidade:              row.missao_cidade,
    meio:                row.missao_meio,
    noites:              row.missao_noites,
    diasConsecutivos:    row.missao_dias_consecutivos,
    tempoViagemEstimadoH: row.missao_tempo_viagem_h,
    hospedagemProxima:   row.missao_hospedagem_proxima,
  } : null,
})

const toRow = (t, userId) => ({
  id:                         t.id,
  user_id:                    userId,
  clinica_id:                 t.clinicaId,
  saida_casa:                 t.saidaCasa          ? new Date(t.saidaCasa).toISOString()          : null,
  chegada_clinica:            t.chegadaClinica      ? new Date(t.chegadaClinica).toISOString()      : null,
  atendimento_inicio:         t.atendimentoInicio   ? new Date(t.atendimentoInicio).toISOString()   : null,
  atendimento_fim:            t.atendimentoFim      ? new Date(t.atendimentoFim).toISOString()      : null,
  chegada_casa:               t.chegadaCasa         ? new Date(t.chegadaCasa).toISOString()         : null,
  humor:                      t.humor    || null,
  desgaste:                   t.desgaste || null,
  transito:                   t.transito || null,
  observacoes:                t.observacoes || null,
  status:                     t.status || 'ativo',
  missao_cidade:              t.missao?.cidade              || null,
  missao_meio:                t.missao?.meio                || null,
  missao_noites:              t.missao?.noites              ?? null,
  missao_dias_consecutivos:   t.missao?.diasConsecutivos    ?? null,
  missao_tempo_viagem_h:      t.missao?.tempoViagemEstimadoH ?? null,
  missao_hospedagem_proxima:  t.missao?.hospedagemProxima   ?? null,
})

// ── local storage fallback ────────────────────────────────────

const ls = {
  load: () => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
  },
  save: (data) => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)) } catch {}
  },
}

// ── public API ────────────────────────────────────────────────

/**
 * Load all completed + active turnos for the current user.
 * Returns an array sorted by saida_casa desc.
 */
export async function loadTurnos() {
  if (!supabase) {
    return ls.load()
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ls.load()           // anonymous — use local

  const { data, error } = await supabase
    .from('turnos')
    .select('*')
    .eq('user_id', user.id)
    .order('saida_casa', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[Meridian] loadTurnos error:', error)
    return ls.load()
  }

  return data.map(toLocal)
}

/**
 * Upsert a single turno.
 * Works for both creating and updating (active → concluido).
 */
export async function saveTurno(turno) {
  if (!supabase) {
    const all = ls.load()
    const idx = all.findIndex(t => t.id === turno.id)
    if (idx >= 0) all[idx] = turno; else all.unshift(turno)
    ls.save(all)
    return { data: turno, error: null }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // anonymous: local only
    const all = ls.load()
    const idx = all.findIndex(t => t.id === turno.id)
    if (idx >= 0) all[idx] = turno; else all.unshift(turno)
    ls.save(all)
    return { data: turno, error: null }
  }

  const row = toRow(turno, user.id)
  const { data, error } = await supabase
    .from('turnos')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('[Meridian] saveTurno error:', error)
    return { data: null, error }
  }

  return { data: toLocal(data), error: null }
}

/**
 * Load clinicas from Supabase. Falls back to localStorage defaults.
 */
export async function loadClinicas() {
  if (!supabase) return null   // null = use localStorage

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('iryx_clinicas')
    .select('*')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) { console.error('[Meridian] loadClinicas error:', error); return null }
  if (!data || data.length === 0) return null  // empty = seed defaults

  return data.map(r => ({
    id:     r.id,
    nome:   r.nome,
    cidade: r.cidade || '',
    tipo:   r.tipo   || 'local',
    cor:    r.cor    || '#7E9B8A',
  }))
}

/**
 * Save (upsert) a single clinica to Supabase.
 */
export async function saveClinica(clinica, ordem = 0) {
  if (!supabase) return { error: { message: 'offline' } }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'not authenticated' } }

  // If id looks like a UUID (from Supabase), upsert by id.
  // If it's our local format (c_xxxxxxxx), insert as new.
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(clinica.id)

  const payload = {
    user_id: user.id,
    nome:    clinica.nome,
    cidade:  clinica.cidade,
    tipo:    clinica.tipo,
    cor:     clinica.cor,
    ativo:   true,
    ordem,
  }

  if (isUUID) {
    const { data, error } = await supabase
      .from('iryx_clinicas')
      .update(payload)
      .eq('id', clinica.id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()
    if (error) console.error('[Meridian] saveClinica error:', error)
    return { data: data ? { ...clinica, id: data.id } : clinica, error }
  } else {
    const { data, error } = await supabase
      .from('iryx_clinicas')
      .insert({ ...payload })
      .select()
      .maybeSingle()
    if (error) console.error('[Meridian] insertClinica error:', error)
    return { data: data ? { ...clinica, id: data.id } : clinica, error }
  }
}

/**
 * Seed default clinicas for a new user (called once when Supabase returns empty).
 */
export async function seedClinicas(defaults) {
  if (!supabase) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const rows = defaults.map((c, i) => ({
    user_id: user.id,
    nome:    c.nome,
    cidade:  c.cidade,
    tipo:    c.tipo,
    cor:     c.cor,
    ativo:   true,
    ordem:   i,
  }))

  const { error } = await supabase.from('iryx_clinicas').insert(rows)
  if (error) console.error('[Meridian] seedClinicas error:', error)
}

/**
 * Delete (soft) a clinica by id.
 */
export async function deleteClinica(id) {
  if (!supabase) return { error: null }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: null }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)
  if (!isUUID) return { error: null }  // local-only id, nothing in DB

  const { error } = await supabase
    .from('iryx_clinicas')
    .update({ ativo: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) console.error('[Meridian] deleteClinica error:', error)
  return { error }
}


/**
 * Save a calculadora result to iryx_calculos.
 * Shared table — readable by Iryx too.
 */
export async function saveCalculo(result) {
  if (!supabase) {
    // offline: already handled by localStorage in TelaCalculadora
    return { error: null }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'not authenticated' } }

  const { data, error } = await supabase
    .from('iryx_calculos')
    .insert({
      user_id:           user.id,
      local:             result.local,
      horas:             result.h,
      pacientes:         result.pac,
      valor_consulta:    result.vc,
      qtd_consultas:     result.qc,
      pct_consultas:     result.pctC,
      valor_exame:       result.ve,
      qtd_exames:        result.qe,
      pct_exames:        result.pctE,
      valor_laser:       result.vl,
      qtd_laser:         result.ql,
      pct_laser:         result.pctL,
      custos:            result.cost,
      deslocamento_min:  result.desl,
      faturamento_bruto: result.bruta,
      receita_liquida:   result.liq,
      receita_final:     result.final,
      valor_hora:        result.hora,
      valor_hora_real:   result.horaReal ?? null,
      valor_por_paciente:result.porPac,
      classificacao:     result.classif,
    })
    .select()
    .single()

  if (error) console.error('[Meridian] saveCalculo error:', error)
  return { data, error }
}

/**
 * Load calculadora history from iryx_calculos.
 */
export async function loadCalculos() {
  if (!supabase) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('iryx_calculos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) { console.error('[Meridian] loadCalculos error:', error); return [] }

  // Map DB row → app shape
  return data.map(r => ({
    local:     r.local,
    h:         r.horas,
    pac:       r.pacientes,
    vc:r.valor_consulta, qc:r.qtd_consultas, pctC:r.pct_consultas,
    ve:r.valor_exame,    qe:r.qtd_exames,    pctE:r.pct_exames,
    vl:r.valor_laser,    ql:r.qtd_laser,     pctL:r.pct_laser,
    cost:      r.custos,
    desl:      r.deslocamento_min,
    bruta:     r.faturamento_bruto,
    liq:       r.receita_liquida,
    final:     r.receita_final,
    hora:      r.valor_hora,
    horaReal:  r.valor_hora_real,
    porPac:    r.valor_por_paciente,
    classif:   r.classificacao,
    classColor: r.valor_hora >= 400 ? 'var(--sage)' : r.valor_hora >= 200 ? 'var(--amber)' : 'var(--wine)',
    ts:        new Date(r.created_at).getTime(),
  }))
}

/**
 * Delete a turno by id.
 */
export async function deleteTurno(id) {
  if (!supabase) {
    const all = ls.load().filter(t => t.id !== id)
    ls.save(all)
    return { error: null }
  }

  const { error } = await supabase.from('turnos').delete().eq('id', id)
  if (error) console.error('[Meridian] deleteTurno error:', error)
  return { error }
}

/**
 * Sign in with magic link (email).
 */
export async function signInWithEmail(email) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
}

/**
 * Sign out.
 */
export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

/**
 * Get current auth session.
 */
export async function getSession() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
