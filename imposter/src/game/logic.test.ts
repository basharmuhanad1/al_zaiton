import { describe, expect, it } from 'vitest'
import { CARDS } from './content'
import {
  buildAround,
  dedupeNames,
  maxImposters,
  resolveVotes,
  scoreDeltas,
  suggestedImposters,
} from './logic'
import { initialState, reduce } from './reducer'
import type { PlayerState } from './types'

function rngFrom(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('limits', () => {
  it('keeps imposters below civilians except the duel', () => {
    expect(maxImposters(1)).toBe(0)
    expect(maxImposters(2)).toBe(1)
    expect(maxImposters(3)).toBe(1)
    expect(maxImposters(4)).toBe(1)
    expect(maxImposters(8)).toBe(3)
    expect(maxImposters(15)).toBe(5)
    expect(suggestedImposters(8)).toBe(2)
    expect(suggestedImposters(15)).toBe(4)
  })

  it('dedupes display names', () => {
    expect(dedupeNames(['نور', 'نور', 'سامي'])).toEqual(['نور', 'نور 2', 'سامي'])
  })
})

describe('votes', () => {
  const voters = ['a', 'b', 'c', 'd']

  it('eliminates a strict leader', () => {
    const r = resolveVotes({ a: 'b', b: 'c', c: 'b', d: 'none' }, voters, true)
    expect(r.kind).toBe('eliminate')
    expect(r.eliminatedId).toBe('b')
  })

  it('lets لا أحد win a tie with one player', () => {
    const r = resolveVotes({ a: 'b', b: 'none', c: 'a', d: 'none' }, voters, true)
    expect(r.kind).toBe('none')
  })

  it('sends a player tie to sudden death', () => {
    const r = resolveVotes({ a: 'b', b: 'a', c: 'b', d: 'a' }, voters, true)
    expect(r.kind).toBe('tie')
    expect(r.tiedIds?.sort()).toEqual(['a', 'b'])
  })

  it('cancels when fewer than half vote', () => {
    const r = resolveVotes({ a: 'b' }, voters, true)
    expect(r.kind).toBe('insufficient')
  })
})

describe('score', () => {
  const players = [
    { id: 'c1', role: 'civilian', witness: null, withdrawn: false },
    { id: 'c2', role: 'civilian', witness: 'i1', withdrawn: false },
    { id: 'i1', role: 'imposter', witness: null, withdrawn: false },
  ] as PlayerState[]

  it('pays civilians for a caught imposter and the witness mark', () => {
    const d = scoreDeltas({
      players,
      winner: 'civilians',
      votes: { c1: 'i1', c2: 'i1', i1: 'c1' },
      viaGuess: false,
      guessBonus: false,
    })
    expect(d.c1).toBe(3)
    expect(d.c2).toBe(5)
    expect(d.i1).toBe(0)
  })
})

describe('deck', () => {
  it('builds a shortlist where every true facet still has three neighbors', () => {
    for (const pack of ['places', 'jobs', 'foods'] as const) {
      const pool = CARDS.filter((c) => c.pack === pack)
      for (const truth of pool) {
        for (let seed = 1; seed <= 4; seed++) {
        const list = buildAround(truth, pool, Math.min(8, pool.length), rngFrom(seed * 100 + truth.id.length))
        expect(list).toHaveLength(Math.min(8, pool.length))
        expect(list.some((c) => c.id === truth.id)).toBe(true)
        for (const facet of truth.facets) {
          const support = list.filter((c) => c.id !== truth.id && c.facets.includes(facet)).length
          expect(support, `${truth.id} / ${facet}`).toBeGreaterThanOrEqual(3)
        }
        const clashes = new Map<string, number>()
        for (const card of list) {
          if (!card.clash) continue
          clashes.set(card.clash, (clashes.get(card.clash) ?? 0) + 1)
        }
        for (const [group, count] of clashes) {
          expect(count, group).toBeLessThanOrEqual(2)
        }
        }
      }
    }
  })
})

describe('match lock', () => {
  it('deals one imposter among four after the names lock', () => {
    let state = initialState()
    state = reduce(state, { type: 'nav', screen: 'setup' })
    for (const name of ['ليلى', 'سامي', 'نور', 'كريم']) {
      state = reduce(state, { type: 'add-name', name })
    }
    state = reduce(state, { type: 'lock' }, rngFrom(4))
    expect(state.screen).toBe('deal')
    expect(state.players.filter((p) => p.role === 'imposter')).toHaveLength(1)
    expect(state.shortlist).toHaveLength(6)
    expect(state.shortlist).toContain(state.truthId)
  })
})
