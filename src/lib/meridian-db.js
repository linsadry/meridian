/**
 * Meridian — Data Layer v3
 * Supabase como fonte de verdade primária.
 * Fila de pendentes para garantir que nenhum dado se perde.
 */

import { supabase } from './supabase'

const LOCAL_KEY    = 'meridian_turnos_v1'
const MISSOES_KEY  = 'meridian_missoes_v1'
const PENDING_KEY  = 'meridian_pending_v1'   // fila de upserts pendentes

// ── helpers: turnos ───────────────────────────────────────────

const toLocal = (row) => ({
  id:                  row.id,
  clinicaId:           row.clinica_id,
  missaoId:            row.missao_id    || null,
  diaMissao:           row.dia_missao   || 1,
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
  pausas:              row.pausas || [],
  manual:              row.manual || false,
  missao: row.missao_cidade ? {
    cidade:               row.missao_cidade,
    meio:                 row.missao_meio,
    meios:                row.missao_meios,
    noites:               row.missao_noites,
    diasConsecutivos:     row.missao_dias_consecutivos,
    diasOciosos:          row.missao_dias_ociosos,
    tempoViagemEstimadoH: row.missao_tempo_viagem_h,
    hospedagemProxima:    row.missao_hospedagem_proxima,
  } : null,
})

const toRow = (t) => ({
  id:                         t.id,
  clinica_id:                 t.clinicaId,
  missao_id:                  t.missaoId    || null,
  dia_missao:                 t.diaMissao   || 1,
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
  pausas:                     t.pausas || [],
  manual:                     t.manual || false,
  missao_cidade:              t.missao?.cidade               || null,
  missao_meio:                t.missao?.meio                 || null,
  missao_meios:               t.missao?.meios                ?? null,
  missao_noites:              t.missao?.noites               ?? null,
  missao_dias_consecutivos:   t.missao?.diasConsecutivos     ?? null,
  missao_dias_ociosos:        t.missao?.diasOciosos          ?? 0,
  missao_tempo_viagem_h:      t.missao?.tempoViagemEstimadoH ?? null,
  missao_hospedagem_proxima:  t.missao?.hospedagemProxima    ?? null,
})

// ── helpers: missões ──────────────────────────────────────────

const missaoToLocal = (row) => ({
  id:                row.id,
  clinicaId:         row.clinica_id,
  cidade:            row.cidade,
  saidaCasa:         row.saida_casa        ? new Date(row.saida_casa).getTime()        : null,
  chegadaDestino:    row.chegada_destino   ? new Date(row.chegada_destino).getTime()   : null,
  partidaDestino:    row.partida_destino   ? new Date(row.partida_destino).getTime()   : null,
  chegadaCasa:       row.chegada_casa      ? new Date(row.chegada_casa).getTime()      : null,
  noites:            row.noites            ?? 0,
  meios:             row.meios             || [],
  tempoViagemH:      row.tempo_viagem_h    ?? null,
  hospedagemProxima: row.hospedagem_proxima ?? false,
  observacoes:       row.observacoes       || null,
  status:            row.status            || 'aberta',
  createdAt:         row.created_at        ? new Date(row.created_at).getTime() : null,
})

const missaoToRow = (m) => ({
  id:                 m.id,
  clinica_id:         m.clinicaId,
  cidade:             m.cidade,
  saida_casa:         m.saidaCasa       ? new Date(m.saidaCasa).toISOString()       : null,
  chegada_destino:    m.chegadaDestino  ? new Date(m.chegadaDestino).toISOString()  : null,
  partida_destino:    m.partidaDestino  ? new Date(m.partidaDestino).toISOString()  : null,
  chegada_casa:       m.chegadaCasa     ? new Date(m.chegadaCasa).toISOString()     : null,
  noites:             m.noites          ?? 0,
  meios:              m.meios           || [],
  tempo_viagem_h:     m.tempoViagemH    ?? null,
  hospedagem_proxima: m.hospedagemProxima ?? false,
  observacoes:        m.observacoes     || null,
  status:             m.status          || 'aberta',
})

// ── localStorage ──────────────────────────────────────────────

const ls = {
  load:  ()  => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)   || '[]') } catch { return [] } },
  save:  (d) => { try { localStorage.setItem(LOCAL_KEY,   JSON.stringify(d)) } catch {} },
}
const lsM = {
  load:  ()  => { try { return JSON.parse(localStorage.getItem(MISSOES_KEY) || '[]') } catch { return [] } },
  save:  (d) => { try { localStorage.setItem(MISSOES_KEY, JSON.stringify(d)) } catch {} },
}

// ── Fila de pendentes ─────────────────────────────────────────
// Garante que upserts que falharam sejam reenviados na próxima abertura.

const pending = {
  load: () => { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') } catch { return [] } },
  save: (d) => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(d)) } catch {} },
  add:  (row) => {
    const all = pending.load()
    const idx = all.findIndex(r => r.id === row.id)
    if (idx >= 0) all[idx] = row; else all.push(row)
    pending.save(all)
  },
  remove: (id) => {
    pending.save(pending.load().filter(r => r.id !== id))
  },
  count: () => pending.load().length,
}

// Tenta reenviar todos os pendentes. Retorna quantos falharam.
export async function flushPending() {
  if (!supabase) return pending.count()
  const all = pending.load()
  if (!all.length) return 0
  let falhas = 0
  for (const row of all) {
    try {
      const { error } = await supabase
        .from('turnos')
        .upsert(row, { onConflict: 'id' })
      if (error) { falhas++; continue }
      pending.remove(row.id)
    } catch { falhas++ }
  }
  return falhas
}

export function getPendingCount() {
  return pending.count()
}

// ── TURNOS ────────────────────────────────────────────────────

export async function loadTurnos() {
  if (!supabase) return ls.load()

  const { data, error } = await supabase
    .from('turnos')
    .select('*')
    .order('saida_casa', { ascending: false, nullsFirst: false })
    .order('atendimento_inicio', { ascending: false, nullsFirst: false })
    .limit(300)

  if (error) {
    console.error('[Meridian] loadTurnos error:', error)
    // Fallback: localStorage + pendentes locais
    return ls.load()
  }

  const rows = data.map(toLocal)
  // Merge com pendentes locais ainda não confirmados pelo Supabase
  const pend = pending.load()
  pend.forEach(p => {
    if (!rows.find(r => r.id === p.id)) rows.unshift(toLocal(p))
  })
  ls.save(rows)
  return rows
}

export async function saveTurno(turno) {
  // 1. localStorage imediato — nunca perde
  const all = ls.load()
  const idx = all.findIndex(t => t.id === turno.id)
  if (idx >= 0) all[idx] = turno; else all.unshift(turno)
  ls.save(all)

  if (!supabase) {
    pending.add(toRow(turno))
    return { data: turno, error: { message: 'offline' }, pending: true }
  }

  const row = toRow(turno)
  const { data, error } = await supabase
    .from('turnos')
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle()

  if (error) {
    // Falhou no Supabase — entra na fila de pendentes
    console.error('[Meridian] saveTurno error:', error)
    pending.add(row)
    return { data: turno, error, pending: true }
  }

  // Sucesso — remove da fila de pendentes se estava lá
  pending.remove(turno.id)
  return { data: data ? toLocal(data) : turno, error: null, pending: false }
}

export async function deleteTurno(id) {
  const all = ls.load().filter(t => t.id !== id)
  ls.save(all)
  pending.remove(id)

  if (!supabase) return { error: null }

  const { error } = await supabase.from('turnos').delete().eq('id', id)
  if (error) console.error('[Meridian] deleteTurno error:', error)
  return { error }
}

// ── MISSÕES ───────────────────────────────────────────────────

export async function loadMissoes() {
  if (!supabase) return lsM.load()

  const { data, error } = await supabase
    .from('missoes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) { console.error('[Meridian] loadMissoes error:', error); return lsM.load() }

  const rows = data.map(missaoToLocal)
  lsM.save(rows)
  return rows
}

export async function saveMissao(missao) {
  const all = lsM.load()
  const idx = all.findIndex(m => m.id === missao.id)
  if (idx >= 0) all[idx] = missao; else all.unshift(missao)
  lsM.save(all)

  if (!supabase) return { data: missao, error: null }

  try {
    const row = missaoToRow(missao)
    const { data, error } = await supabase
      .from('missoes')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle()

    if (error) console.error('[Meridian] saveMissao error:', error)
    return { data: data ? missaoToLocal(data) : missao, error }
  } catch (e) {
    console.error('[Meridian] saveMissao exception:', e)
    return { data: missao, error: e }
  }
}

export async function deleteMissao(id) {
  lsM.save(lsM.load().filter(m => m.id !== id))
  if (!supabase) return { error: null }
  const { error } = await supabase.from('missoes').delete().eq('id', id)
  if (error) console.error('[Meridian] deleteMissao error:', error)
  return { error }
}

// ── CLÍNICAS ──────────────────────────────────────────────────

export async function loadClinicas() {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('iryx_clinicas')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) { console.error('[Meridian] loadClinicas error:', error); return null }
  if (!data || data.length === 0) return null

  return data.map(r => ({
    id:     r.id,
    nome:   r.nome   || r.nome_clinica || '',
    cidade: r.cidade || '',
    tipo:   r.tipo   || 'local',
    cor:    r.cor    || '#7E9B8A',
  }))
}

export async function saveClinica(clinica, ordem = 0) {
  if (!supabase) return { error: { message: 'offline' } }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(clinica.id)
  const payload = { nome: clinica.nome, cidade: clinica.cidade, tipo: clinica.tipo, cor: clinica.cor, ativo: true, ordem }

  if (isUUID) {
    const { data, error } = await supabase.from('iryx_clinicas').update(payload).eq('id', clinica.id).select().maybeSingle()
    if (error) console.error('[Meridian] saveClinica error:', error)
    return { data: data ? { ...clinica, id: data.id } : clinica, error }
  } else {
    const { data, error } = await supabase.from('iryx_clinicas').insert(payload).select().maybeSingle()
    if (error) console.error('[Meridian] insertClinica error:', error)
    return { data: data ? { ...clinica, id: data.id } : clinica, error }
  }
}

export async function seedClinicas(defaults) {
  if (!supabase) return
  const rows = defaults.map((c, i) => ({ nome: c.nome, cidade: c.cidade, tipo: c.tipo, cor: c.cor, ativo: true, ordem: i }))
  const { error } = await supabase.from('iryx_clinicas').insert(rows)
  if (error) console.error('[Meridian] seedClinicas error:', error)
}

export async function deleteClinica(id) {
  if (!supabase) return { error: null }
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)
  if (!isUUID) return { error: null }
  const { error } = await supabase.from('iryx_clinicas').update({ ativo: false }).eq('id', id)
  if (error) console.error('[Meridian] deleteClinica error:', error)
  return { error }
}

// ── CALCULADORA ───────────────────────────────────────────────

export async function saveCalculo(result) {
  if (!supabase) return { error: null }

  const row = {
    local:              result.clinicaNome || result.local || null,
    clinica_id:         result.clinicaId   || null,
    clinica_nome:       result.clinicaNome || result.local || null,
    horas:              result.h,
    pacientes:          result.pac,
    deslocamento_min:   result.desl || 0,
    rec_consultas:      result.recC  ?? null,
    rec_exames:         result.recE  ?? null,
    rec_laser:          result.recL  ?? null,
    imposto:            result.imposto   ?? null,
    contabilidade:      result.contab    ?? null,
    custos:             result.custos    ?? 0,
    pct_imposto:        result.pctImposto ?? null,
    pct_contab:         result.pctContab  ?? null,
    pct_deducoes:       result.pctDed     ?? null,
    faturamento_bruto:  result.totalRec  ?? null,
    receita_liquida:    result.totalRec  ?? null,
    receita_final:      result.final,
    valor_hora:         result.hora,
    valor_hora_real:    result.horaReal  ?? null,
    valor_por_paciente: result.porPac,
    classificacao:      result.classif,
  }

  const { data, error } = await supabase.from('iryx_calculos').insert(row).select().maybeSingle()
  if (error) console.error('[Meridian] saveCalculo error:', error)
  return { data, error }
}

export async function loadCalculos() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('iryx_calculos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) { console.error('[Meridian] loadCalculos error:', error); return [] }

  return data.map(r => {
    const hora = r.valor_hora || 0
    return {
      id:          r.id,
      clinicaId:   r.clinica_id   || null,
      clinicaNome: r.clinica_nome || r.local || '',
      local:       r.local        || '',
      h:           r.horas,
      pac:         r.pacientes,
      desl:        r.deslocamento_min || 0,
      recC:        r.rec_consultas || 0,
      recE:        r.rec_exames    || 0,
      recL:        r.rec_laser     || 0,
      totalRec:    r.faturamento_bruto || 0,
      imposto:     r.imposto       || 0,
      contab:      r.contabilidade || 0,
      custos:      r.custos        || 0,
      totalDed:    (r.imposto||0) + (r.contabilidade||0) + (r.custos||0),
      pctImposto:  r.pct_imposto   || 0,
      pctContab:   r.pct_contab    || 0,
      pctDed:      r.pct_deducoes  || 0,
      final:       r.receita_final || 0,
      hora,
      horaReal:    r.valor_hora_real || null,
      porPac:      r.valor_por_paciente || 0,
      classif:     r.classificacao || '',
      classColor:  hora >= 400 ? 'var(--sage)' : hora >= 200 ? 'var(--amber)' : 'var(--wine)',
      ts:          new Date(r.created_at).getTime(),
    }
  })
}
