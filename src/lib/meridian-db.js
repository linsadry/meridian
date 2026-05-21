/**
 * Meridian — Data Layer
 *
 * Sem autenticação — usa anon key diretamente, igual ao Iryx.
 * RLS desabilitado nas tabelas. Fallback para localStorage se offline.
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
  pausas:              row.pausas || [],
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
  missao_cidade:              t.missao?.cidade               || null,
  missao_meio:                t.missao?.meio                 || null,
  missao_meios:               t.missao?.meios                ?? null,
  missao_noites:              t.missao?.noites               ?? null,
  missao_dias_consecutivos:   t.missao?.diasConsecutivos     ?? null,
  missao_dias_ociosos:        t.missao?.diasOciosos          ?? 0,
  missao_tempo_viagem_h:      t.missao?.tempoViagemEstimadoH ?? null,
  missao_hospedagem_proxima:  t.missao?.hospedagemProxima    ?? null,
})

// ── localStorage fallback ─────────────────────────────────────

const ls = {
  load: () => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
  },
  save: (data) => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)) } catch {}
  },
}

// ── TURNOS ────────────────────────────────────────────────────

export async function loadTurnos() {
  if (!supabase) return ls.load()

  const { data, error } = await supabase
    .from('turnos')
    .select('*')
    .order('saida_casa', { ascending: false })
    .limit(200)

  if (error) { console.error('[Meridian] loadTurnos error:', error); return ls.load() }

  const rows = data.map(toLocal)
  ls.save(rows) // mantém cópia local
  return rows
}

export async function saveTurno(turno) {
  if (!supabase) {
    const all = ls.load()
    const idx = all.findIndex(t => t.id === turno.id)
    if (idx >= 0) all[idx] = turno; else all.unshift(turno)
    ls.save(all)
    return { data: turno, error: null }
  }

  const row = toRow(turno)
  const { data, error } = await supabase
    .from('turnos')
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle()

  if (error) { console.error('[Meridian] saveTurno error:', error) }

  // Mantém cópia local
  const all = ls.load()
  const idx = all.findIndex(t => t.id === turno.id)
  if (idx >= 0) all[idx] = turno; else all.unshift(turno)
  ls.save(all)

  return { data: data ? toLocal(data) : turno, error }
}

export async function deleteTurno(id) {
  // Remove do localStorage sempre
  const all = ls.load().filter(t => t.id !== id)
  ls.save(all)

  if (!supabase) return { error: null }

  const { error } = await supabase
    .from('turnos')
    .delete()
    .eq('id', id)

  if (error) console.error('[Meridian] deleteTurno error:', error)
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

  const payload = {
    nome:   clinica.nome,
    cidade: clinica.cidade,
    tipo:   clinica.tipo,
    cor:    clinica.cor,
    ativo:  true,
    ordem,
  }

  if (isUUID) {
    const { data, error } = await supabase
      .from('iryx_clinicas')
      .update(payload)
      .eq('id', clinica.id)
      .select()
      .maybeSingle()
    if (error) console.error('[Meridian] saveClinica error:', error)
    return { data: data ? { ...clinica, id: data.id } : clinica, error }
  } else {
    const { data, error } = await supabase
      .from('iryx_clinicas')
      .insert(payload)
      .select()
      .maybeSingle()
    if (error) console.error('[Meridian] insertClinica error:', error)
    return { data: data ? { ...clinica, id: data.id } : clinica, error }
  }
}

export async function seedClinicas(defaults) {
  if (!supabase) return

  const rows = defaults.map((c, i) => ({
    nome:   c.nome,
    cidade: c.cidade,
    tipo:   c.tipo,
    cor:    c.cor,
    ativo:  true,
    ordem:  i,
  }))

  const { error } = await supabase.from('iryx_clinicas').insert(rows)
  if (error) console.error('[Meridian] seedClinicas error:', error)
}

export async function deleteClinica(id) {
  if (!supabase) return { error: null }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)
  if (!isUUID) return { error: null }

  const { error } = await supabase
    .from('iryx_clinicas')
    .update({ ativo: false })
    .eq('id', id)

  if (error) console.error('[Meridian] deleteClinica error:', error)
  return { error }
}

// ── CALCULADORA ───────────────────────────────────────────────

export async function saveCalculo(result) {
  if (!supabase) return { error: null }

  const row = {
    local:              result.local,
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

  const { data, error } = await supabase
    .from('iryx_calculos')
    .insert(row)
    .select()
    .maybeSingle()

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
      local:      r.local,
      h:          r.horas,
      pac:        r.pacientes,
      desl:       r.deslocamento_min || 0,
      recC:       r.rec_consultas || 0,
      recE:       r.rec_exames    || 0,
      recL:       r.rec_laser     || 0,
      totalRec:   r.faturamento_bruto || 0,
      imposto:    r.imposto       || 0,
      contab:     r.contabilidade || 0,
      custos:     r.custos        || 0,
      totalDed:   (r.imposto||0) + (r.contabilidade||0) + (r.custos||0),
      pctImposto: r.pct_imposto   || 0,
      pctContab:  r.pct_contab    || 0,
      pctDed:     r.pct_deducoes  || 0,
      final:      r.receita_final || 0,
      hora,
      horaReal:   r.valor_hora_real || null,
      porPac:     r.valor_por_paciente || 0,
      classif:    r.classificacao || '',
      classColor: hora >= 400 ? 'var(--sage)' : hora >= 200 ? 'var(--amber)' : 'var(--wine)',
      ts:         new Date(r.created_at).getTime(),
    }
  })
}
