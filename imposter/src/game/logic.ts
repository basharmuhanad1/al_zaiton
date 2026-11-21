import { ABILITY_COPY, CARDS, QUESTIONS } from './content'
import type { AbilityId, PlayerState, Role, SecretCard } from './types'

export type Rng = () => number

export function shuffle<T>(list: readonly T[], rng: Rng = Math.random): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function maxImposters(players: number): number {
  if (players <= 1) return 0
  if (players === 2) return 1
  return Math.min(5, Math.floor((players - 1) / 2))
}

export function suggestedImposters(players: number): number {
  if (players <= 5) return 1
  if (players <= 10) return 2
  if (players <= 13) return 3
  return 4
}

export function shortlistSize(players: number): number {
  if (players <= 4) return 6
  if (players <= 8) return 8
  return 10
}

export function recommendedPreset(players: number): 'classic' | 'abilities' {
  if (players >= 6 && players <= 10) return 'abilities'
  return 'classic'
}

export function nameLength(name: string): number {
  return [...name.trim()].length
}

const BLOCK = ['fuck', 'shit', 'كس', 'شرموط', 'قحبة']

export function cleanName(raw: string): { ok: true; name: string } | { ok: false; reason: string } {
  const name = raw.trim().replace(/\s+/g, ' ')
  const len = nameLength(name)
  if (len < 2) return { ok: false, reason: 'حرفان على الأقل.' }
  if (len > 16) return { ok: false, reason: 'ستة عشر حرفًا كحد أقصى.' }
  const low = name.toLowerCase()
  if (BLOCK.some((w) => low.includes(w))) return { ok: false, reason: 'اختر اسمًا آخر.' }
  return { ok: true, name }
}

export function dedupeNames(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((raw) => {
    const n = raw.trim()
    const count = seen.get(n) ?? 0
    seen.set(n, count + 1)
    return count === 0 ? n : `${n} ${count + 1}`
  })
}

export function observerAllowed(players: number, imposters: number, preset: 'classic' | 'abilities'): boolean {
  return preset === 'abilities' && players >= 6 && imposters <= 2
}

const CIV = ['pointed', 'mirror', 'seal', 'witness', 'loyalty'] as const
const IMP = ['thread', 'echo', 'fog', 'mask', 'trail'] as const
const CIV3 = ['pointed', 'mirror', 'loyalty'] as const
const IMP3 = ['thread', 'echo', 'mask'] as const

export function abilityPool(role: Role, players: number): AbilityId[] {
  if (role === 'observer') return []
  if (role === 'civilian') return [...(players <= 3 ? CIV3 : CIV)]
  return [...(players <= 3 ? IMP3 : IMP)]
}

export function offerTwo(pool: AbilityId[], rng: Rng): AbilityId[] {
  return shuffle(pool, rng).slice(0, 2)
}

export function assignSeats(
  ids: string[],
  imposterCount: number,
  withObserver: boolean,
  rng: Rng,
): Record<string, Role> {
  const order = shuffle(ids, rng)
  const roles: Record<string, Role> = {}
  order.forEach((id, i) => {
    roles[id] = i < imposterCount ? 'imposter' : 'civilian'
  })
  if (withObserver) {
    const civ = order.filter((id) => roles[id] === 'civilian')
    if (civ.length) roles[civ[Math.floor(rng() * civ.length)]] = 'observer'
  }
  return roles
}

export function buildAround(
  truth: SecretCard,
  pool: SecretCard[],
  size: number,
  rng: Rng,
): SecretCard[] {
  const others = shuffle(
    pool.filter((c) => c.id !== truth.id),
    rng,
  )
  const picked: SecretCard[] = []
  const clash = new Map<string, number>()
  if (truth.clash) clash.set(truth.clash, 1)

  const canTake = (card: SecretCard, ignoreClash: boolean) => {
    if (picked.some((p) => p.id === card.id)) return false
    if (ignoreClash || !card.clash) return true
    return (clash.get(card.clash) ?? 0) < 2
  }
  const take = (card: SecretCard) => {
    picked.push(card)
    if (card.clash) clash.set(card.clash, (clash.get(card.clash) ?? 0) + 1)
  }

  const support = (facet: string) => picked.filter((c) => c.facets.includes(facet)).length
  for (const facet of truth.facets) {
    while (support(facet) < 3) {
      const cands = others.filter((c) => c.facets.includes(facet) && canTake(c, false))
      if (!cands.length) break
      cands.sort((a, b) => {
        const gain = (card: SecretCard) =>
          card.facets.filter((f) => truth.facets.includes(f) && support(f) < 3).length
        return gain(b) - gain(a)
      })
      take(cands[0])
    }
  }
  let guard = 0
  while (picked.length > size - 1 && guard < 40) {
    guard += 1
    const idx = picked.findIndex((card, index) =>
      truth.facets.every((facet) => {
        if (!card.facets.includes(facet)) return true
        return picked.filter((c, i) => i !== index && c.facets.includes(facet)).length >= 3
      }),
    )
    if (idx < 0) break
    const [removed] = picked.splice(idx, 1)
    if (removed.clash) clash.set(removed.clash, Math.max(0, (clash.get(removed.clash) ?? 1) - 1))
  }
  for (const card of others) {
    if (picked.length >= size - 1) break
    if (canTake(card, false)) take(card)
  }
  for (const card of others) {
    if (picked.length >= size - 1) break
    if (canTake(card, true)) take(card)
  }
  return shuffle([truth, ...picked.slice(0, size - 1)], rng)
}

export function dealSecret(
  pool: SecretCard[],
  size: number,
  seen: string[],
  rng: Rng,
): { truth: SecretCard; list: SecretCard[] } {
  const fresh = pool.filter((c) => !seen.includes(c.id))
  const truthPool = fresh.length ? fresh : pool
  const truth = truthPool[Math.floor(rng() * truthPool.length)]
  return { truth, list: buildAround(truth, pool, Math.min(size, pool.length), rng) }
}

export interface VoteResolution {
  kind: 'eliminate' | 'none' | 'tie' | 'insufficient'
  eliminatedId?: string
  tiedIds?: string[]
  tally: Record<string, number>
}

export function resolveVotes(
  votes: Record<string, string>,
  voterIds: string[],
  allowNone: boolean,
): VoteResolution {
  const cast = voterIds.filter((id) => votes[id] && votes[id] !== id)
  if (cast.length * 2 < voterIds.length) {
    return { kind: 'insufficient', tally: {} }
  }
  const tally: Record<string, number> = {}
  for (const id of cast) {
    const choice = votes[id]
    if (!allowNone && choice === 'none') continue
    if (choice === id) continue
    tally[choice] = (tally[choice] ?? 0) + 1
  }
  const entries = Object.entries(tally)
  if (!entries.length) return { kind: 'insufficient', tally }
  const max = Math.max(...entries.map(([, n]) => n))
  const leaders = entries.filter(([, n]) => n === max).map(([id]) => id)
  const players = leaders.filter((id) => id !== 'none')
  if (leaders.includes('none') && players.length === 1 && leaders.length === 2) {
    return { kind: 'none', tally }
  }
  if (players.length === 1 && !leaders.includes('none')) {
    return { kind: 'eliminate', eliminatedId: players[0], tally }
  }
  if (players.length === 0 && leaders.includes('none')) return { kind: 'none', tally }
  if (players.length > 1) return { kind: 'tie', tiedIds: players, tally }
  return { kind: 'none', tally }
}

export function activePlayers(players: PlayerState[]): PlayerState[] {
  return players.filter((p) => !p.withdrawn)
}

export function sideAlive(players: PlayerState[]): { civilians: number; imposters: number } {
  const alive = activePlayers(players)
  return {
    civilians: alive.filter((p) => p.role !== 'imposter').length,
    imposters: alive.filter((p) => p.role === 'imposter').length,
  }
}

export function tableValid(players: PlayerState[]): boolean {
  const n = activePlayers(players).length
  const { civilians, imposters } = sideAlive(players)
  if (imposters < 1 || civilians < 1) return false
  if (n === 2) return imposters === 1 && civilians === 1
  return n >= 3 && imposters < civilians
}

export function scoreDeltas(input: {
  players: PlayerState[]
  winner: 'civilians' | 'imposters'
  votes: Record<string, string>
  viaGuess: boolean
  guesserId?: string
  guessBonus: boolean
}): Record<string, number> {
  const deltas: Record<string, number> = {}
  for (const p of input.players) deltas[p.id] = 0
  if (!input.viaGuess) {
    for (const p of activePlayers(input.players)) {
      const choice = input.votes[p.id]
      if (!choice || choice === 'none') continue
      const target = input.players.find((x) => x.id === choice)
      if (target?.role === 'imposter') deltas[p.id] += 1
    }
  }
  for (const p of activePlayers(input.players)) {
    if (input.winner === 'civilians' && p.role !== 'imposter') deltas[p.id] += 2
    if (input.winner === 'imposters' && p.role === 'imposter') deltas[p.id] += 3
    if (p.witness) {
      const marked = input.players.find((x) => x.id === p.witness)
      if (marked?.role === 'imposter') deltas[p.id] += 2
      else if (marked) deltas[p.id] -= 1
    }
  }
  if (input.guesserId && input.guessBonus && input.winner === 'imposters') {
    deltas[input.guesserId] += 2
  }
  return deltas
}

export function abilityName(id: AbilityId): string {
  return ABILITY_COPY[id].name
}

export function freshQuestionDeck(rng: Rng): string[] {
  return shuffle(QUESTIONS.map((q) => q.id), rng)
}

export function cardsIn(pack: string): SecretCard[] {
  return CARDS.filter((c) => c.pack === pack)
}

export function mvpId(
  players: PlayerState[],
  scores: Record<string, number>,
  reads: Record<string, number>,
  falls: Record<string, number>,
): string | null {
  if (!players.length) return null
  return [...players].sort((a, b) => {
    const ds = (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
    if (ds) return ds
    const dr = (reads[b.id] ?? 0) - (reads[a.id] ?? 0)
    if (dr) return dr
    return (falls[a.id] ?? 0) - (falls[b.id] ?? 0)
  })[0].id
}
