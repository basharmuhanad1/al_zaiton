import { CARDS, PACKS, QUESTIONS } from './content'
import {
  abilityPool,
  activePlayers,
  assignSeats,
  cardsIn,
  dealSecret,
  dedupeNames,
  freshQuestionDeck,
  maxImposters,
  offerTwo,
  resolveVotes,
  scoreDeltas,
  shuffle,
  sideAlive,
  tableValid,
  type Rng,
} from './logic'
import type {
  AbilityId,
  GameState,
  LogLine,
  PackId,
  PlayerState,
  RoundResult,
  Settings,
  SetupDraft,
} from './types'

export type Action =
  | { type: 'nav'; screen: 'home' | 'howto' | 'setup' | 'names' | 'lobby' | 'solo' }
  | { type: 'patch-setup'; patch: Partial<SetupDraft> }
  | { type: 'patch-settings'; patch: Partial<Settings> }
  | { type: 'add-name'; name: string }
  | { type: 'remove-name'; name: string }
  | { type: 'lock' }
  | { type: 'deal-done' }
  | { type: 'gate-held' }
  | { type: 'ack-secret' }
  | { type: 'pick-ability'; id: AbilityId }
  | { type: 'ack-privy' }
  | { type: 'enter-table' }
  | { type: 'next-opening' }
  | { type: 'pick-target'; id: string }
  | { type: 'set-prompt'; text: string; card: boolean }
  | { type: 'submit-note'; note: string }
  | { type: 'arm-pointed' }
  | { type: 'echo'; word: string }
  | { type: 'mirror-start' }
  | { type: 'seal'; id: string }
  | { type: 'fog'; lineId: string }
  | { type: 'mask'; id: string }
  | { type: 'witness'; id: string }
  | { type: 'loyalty-start' }
  | { type: 'loyalty-next' }
  | { type: 'accuse'; target: string | null }
  | { type: 'hunch-guess'; cardId: string }
  | { type: 'hunch-pass' }
  | { type: 'vote'; choice: string }
  | { type: 'sudden-next' }
  | { type: 'sudden-vote'; choice: string }
  | { type: 'to-score' }
  | { type: 'continue' }
  | { type: 'replay' }
  | { type: 'cancel' }
  | { type: 'withdraw'; id: string }
  | { type: 'sheet'; id: string }
  | { type: 'sheet-close' }
  | { type: 'log'; open: boolean }
  | { type: 'how'; at: number }
  | { type: 'duel-ask'; text: string }
  | { type: 'duel-note'; note: string }
  | { type: 'duel-guess'; cardId: string }
  | { type: 'duel-pass' }

const emptyWins = { civilians: 0, imposters: 0 }

export function initialState(): GameState {
  return {
    screen: 'home',
    settings: { sound: true, motion: true, large: false },
    setup: {
      imposters: 1,
      rounds: 3,
      preset: 'classic',
      packs: ['places'],
      observer: false,
      english: false,
    },
    names: [],
    players: [],
    round: 0,
    roundCap: 3,
    golden: false,
    wins: { ...emptyWins },
    scores: {},
    reads: {},
    falls: {},
    seen: [],
    packId: null,
    truthId: null,
    shortlist: [],
    revealOrder: [],
    revealAt: 0,
    secretsSeen: 0,
    openingOrder: [],
    openingAt: 0,
    askOrder: [],
    askAt: 0,
    askedCount: {},
    observerOpened: false,
    prompt: null,
    armedPointed: false,
    log: [],
    fogUsed: 0,
    qDeck: [],
    accusations: {},
    accuseOrder: [],
    accuseAt: 0,
    loyalty: null,
    closingOrder: [],
    closingAt: 0,
    guesses: [],
    votes: {},
    suddenIds: [],
    suddenOrder: [],
    suddenAt: 0,
    suddenVotes: {},
    result: null,
    gate: null,
    sheetFor: null,
    logOpen: false,
    duelBeat: 1,
    duelStep: 'ask',
    duelNote: '',
    cancelReason: null,
    howAt: 0,
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function player(state: GameState, id: string | null | undefined): PlayerState | undefined {
  return state.players.find((p) => p.id === id)
}

function patchPlayer(state: GameState, id: string, fn: (p: PlayerState) => PlayerState): GameState {
  return { ...state, players: state.players.map((p) => (p.id === id ? fn(p) : p)) }
}

function aliveIds(state: GameState): string[] {
  return activePlayers(state.players).map((p) => p.id)
}

function pushLog(state: GameState, line: Omit<LogLine, 'id'>): GameState {
  return { ...state, log: [...state.log, { ...line, id: uid('log') }] }
}

function drawQuestion(state: GameState, rng: Rng): { state: GameState; text: string } {
  let deck = state.qDeck
  if (!deck.length) deck = freshQuestionDeck(rng)
  const [id, ...rest] = deck
  const text = QUESTIONS.find((q) => q.id === id)?.text ?? 'ماذا يتغيّر لو طال بقاؤك؟'
  return { state: { ...state, qDeck: rest }, text }
}

function abilitiesOn(state: GameState): boolean {
  return state.setup.preset === 'abilities' && !state.golden && state.players.length > 2
}

function afterSecrets(state: GameState, rng: Rng): GameState {
  const n = activePlayers(state.players).length
  if (n === 2) {
    return { ...state, screen: 'duel', duelBeat: 1, duelStep: 'ask', duelNote: '', gate: null, sheetFor: null }
  }
  const ids = aliveIds(state)
  const opening = n >= 6 ? shuffle(ids, rng) : []
  return {
    ...state,
    screen: 'center',
    openingOrder: opening,
    openingAt: 0,
    gate: null,
    sheetFor: null,
    qDeck: freshQuestionDeck(rng),
  }
}

function advanceReveal(state: GameState, rng: Rng): GameState {
  let at = state.revealAt + 1
  while (at < state.revealOrder.length && player(state, state.revealOrder[at])?.withdrawn) at += 1
  if (at >= state.revealOrder.length) return afterSecrets({ ...state, revealAt: at }, rng)
  return {
    ...state,
    revealAt: at,
    screen: 'gate',
    gate: { playerId: state.revealOrder[at], next: 'secret' },
    sheetFor: null,
  }
}

function startExam(state: GameState, rng: Rng): GameState {
  const ids = aliveIds(state)
  const n = ids.length
  let order: string[]
  if (n >= 10) {
    const ranked = [...ids].sort((a, b) => (state.askedCount[a] ?? 0) - (state.askedCount[b] ?? 0))
    order = []
    const used = new Set<string>()
    while (order.length < 8) {
      const rest = ranked.filter((id) => !used.has(id))
      if (!rest.length) break
      const bucketCount = state.askedCount[rest[0]] ?? 0
      const bucket = shuffle(
        rest.filter((id) => (state.askedCount[id] ?? 0) === bucketCount),
        rng,
      )
      bucket.forEach((id) => used.add(id))
      order.push(...bucket)
    }
    order = order.slice(0, 8)
  } else {
    order = shuffle(ids, rng)
  }
  const observer = state.players.find((p) => p.role === 'observer' && !p.withdrawn)
  if (observer) order = [observer.id, ...order.filter((id) => id !== observer.id)].slice(0, Math.max(order.length, 1))
  const next = { ...state, askOrder: order, askAt: 0, observerOpened: false, screen: 'exam' as const }
  return beginAsk(next)
}

function beginAsk(state: GameState): GameState {
  let at = state.askAt
  while (at < state.askOrder.length) {
    const id = state.askOrder[at]
    const p = player(state, id)
    if (p && !p.withdrawn) break
    at += 1
  }
  if (at >= state.askOrder.length) return startAccuse({ ...state, askAt: at })
  return {
    ...state,
    screen: 'exam',
    askAt: at,
    armedPointed: false,
    sheetFor: null,
    prompt: {
      askerId: state.askOrder[at],
      targetId: null,
      text: '',
      pointed: false,
      passed: false,
      step: 'target',
    },
  }
}

function completeTurn(state: GameState): GameState {
  const asker = state.prompt?.askerId
  const askedCount = asker
    ? { ...state.askedCount, [asker]: (state.askedCount[asker] ?? 0) + 1 }
    : state.askedCount
  return beginAsk({ ...state, askedCount, askAt: state.askAt + 1, prompt: null, armedPointed: false })
}

function startAccuse(state: GameState): GameState {
  return {
    ...state,
    screen: 'accuse',
    prompt: null,
    accuseOrder: shuffle(aliveIds(state)),
    accuseAt: 0,
    accusations: {},
    sheetFor: null,
  }
}

function startClosing(state: GameState, rng: Rng): GameState {
  const order = shuffle(aliveIds(state), rng)
  return {
    ...state,
    screen: 'close-gate',
    closingOrder: order,
    closingAt: 0,
    guesses: [],
    votes: {},
    gate: { playerId: order[0], next: 'hunch' },
    sheetFor: null,
    loyalty: null,
  }
}

function applyResult(state: GameState, result: RoundResult): GameState {
  const scores = { ...state.scores }
  const reads = { ...state.reads }
  const falls = { ...state.falls }
  for (const [id, delta] of Object.entries(result.deltas)) scores[id] = (scores[id] ?? 0) + delta
  if (!result.guesserId) {
    const source = result.via === 'sudden' || result.via === 'sudden-tie' ? state.suddenVotes : state.votes
    for (const p of activePlayers(state.players)) {
      const choice = source[p.id]
      const target = player(state, choice)
      if (target?.role === 'imposter') reads[p.id] = (reads[p.id] ?? 0) + 1
    }
  }
  if (result.eliminatedId) falls[result.eliminatedId] = (falls[result.eliminatedId] ?? 0) + 1
  const wins = { ...state.wins }
  wins[result.winner] += 1
  const seen = state.truthId && !state.seen.includes(state.truthId) ? [...state.seen, state.truthId] : state.seen
  return {
    ...state,
    result,
    scores,
    reads,
    falls,
    wins,
    seen,
    screen: 'reveal',
    sheetFor: null,
    gate: null,
    logOpen: false,
  }
}

function finishVote(
  state: GameState,
  resolution: ReturnType<typeof resolveVotes>,
  viaSudden: boolean,
): GameState {
  if (resolution.kind === 'insufficient') {
    return {
      ...state,
      screen: 'cancelled',
      cancelReason: 'لم يكتمل التصويت. أُلغيت الجولة من غير كشف.',
      sheetFor: null,
    }
  }
  if (resolution.kind === 'tie') {
    return {
      ...state,
      suddenIds: resolution.tiedIds ?? [],
      suddenOrder: shuffle(aliveIds(state)),
      suddenAt: 0,
      suddenVotes: {},
      screen: 'sudden',
      sheetFor: null,
    }
  }
  let winner: 'civilians' | 'imposters' = 'imposters'
  let eliminatedId: string | undefined
  let via: RoundResult['via'] = viaSudden ? 'sudden' : 'vote'
  if (resolution.kind === 'none') {
    winner = 'imposters'
    via = viaSudden ? 'sudden-tie' : 'none'
  } else if (resolution.eliminatedId) {
    eliminatedId = resolution.eliminatedId
    const role = player(state, eliminatedId)?.role
    winner = role === 'imposter' ? 'civilians' : 'imposters'
    if (viaSudden && resolution.kind === 'eliminate') via = 'sudden'
  }
  const votes = viaSudden ? state.suddenVotes : state.votes
  const deltas = scoreDeltas({
    players: state.players,
    winner,
    votes,
    viaGuess: false,
    guessBonus: false,
  })
  return applyResult(state, { winner, via, eliminatedId, tally: resolution.tally, deltas })
}

function resolveClosing(state: GameState): GameState {
  if (state.guesses.length) {
    const order = new Map(state.closingOrder.map((id, i) => [id, i]))
    const guess = [...state.guesses].sort((a, b) => (order.get(a.playerId) ?? 0) - (order.get(b.playerId) ?? 0))[0]
    const correct = guess.cardId === state.truthId
    const winner = correct ? 'imposters' : 'civilians'
    const deltas = scoreDeltas({
      players: state.players,
      winner,
      votes: {},
      viaGuess: true,
      guesserId: guess.playerId,
      guessBonus: true,
    })
    return applyResult(state, {
      winner,
      via: correct ? 'guess' : 'bad-guess',
      eliminatedId: correct ? undefined : guess.playerId,
      guesserId: guess.playerId,
      guessCardId: guess.cardId,
      tally: {},
      deltas,
    })
  }
  return finishVote(state, resolveVotes(state.votes, aliveIds(state), true), false)
}

function nextCloser(state: GameState): GameState {
  let at = state.closingAt + 1
  while (at < state.closingOrder.length && player(state, state.closingOrder[at])?.withdrawn) at += 1
  if (at >= state.closingOrder.length) return resolveClosing({ ...state, closingAt: at })
  return {
    ...state,
    closingAt: at,
    screen: 'close-gate',
    gate: { playerId: state.closingOrder[at], next: 'hunch' },
  }
}

function beginRound(state: GameState, rng: Rng, fresh: boolean): GameState {
  const packs = state.setup.packs.length ? state.setup.packs : (['places'] as PackId[])
  const packId = packs[Math.floor(rng() * packs.length)]
  const pool = cardsIn(packId)
  const size = state.players.length <= 4 ? 6 : state.players.length <= 8 ? 8 : 10
  const { truth, list } = dealSecret(pool, size, state.seen, rng)
  const ids = state.players.map((p) => p.id)
  const imposters = Math.min(state.setup.imposters, maxImposters(ids.length))
  const withObserver =
    abilitiesOn({ ...state, players: state.players }) &&
    state.setup.observer &&
    ids.length >= 6 &&
    imposters <= 2
  const roles = assignSeats(ids, Math.max(1, imposters), withObserver, rng)
  const players = state.players.map((p) => {
    const role = roles[p.id]
    const poolAb = abilitiesOn(state) ? abilityPool(role, ids.length) : []
    return {
      ...p,
      role,
      offer: poolAb.length >= 2 ? offerTwo(poolAb, rng) : [],
      ability: null,
      spent: false,
      facet: null,
      trail: [],
      witness: null,
      withdrawn: false,
    }
  })
  const revealOrder = shuffle(ids, rng)
  const scores = { ...state.scores }
  const reads = { ...state.reads }
  const falls = { ...state.falls }
  if (fresh) {
    for (const id of ids) {
      scores[id] = 0
      reads[id] = 0
      falls[id] = 0
    }
  }
  return {
    ...state,
    players,
    packId,
    truthId: truth.id,
    shortlist: list.map((c) => c.id),
    revealOrder,
    revealAt: 0,
    secretsSeen: 0,
    openingOrder: [],
    openingAt: 0,
    askOrder: [],
    askAt: 0,
    prompt: null,
    armedPointed: false,
    log: [],
    fogUsed: 0,
    qDeck: [],
    accusations: {},
    accuseAt: 0,
    loyalty: null,
    closingOrder: [],
    closingAt: 0,
    guesses: [],
    votes: {},
    suddenIds: [],
    suddenVotes: {},
    result: null,
    screen: 'deal',
    gate: null,
    sheetFor: null,
    logOpen: false,
    cancelReason: null,
    scores,
    reads,
    falls,
    wins: fresh ? { civilians: 0, imposters: 0 } : state.wins,
    seen: fresh ? [] : state.seen,
    round: fresh ? 1 : state.round,
    roundCap: state.setup.rounds,
    golden: fresh ? false : state.golden,
  }
}

function cancelCopy(): string {
  return 'اختلّ عدد اللاعبين. أُلغيت الجولة من غير كشف.'
}

export function reduce(state: GameState, action: Action, rng: Rng = Math.random): GameState {
  switch (action.type) {
    case 'nav':
      return { ...state, screen: action.screen, sheetFor: null, logOpen: false, howAt: 0 }
    case 'how':
      return { ...state, howAt: action.at }
    case 'patch-setup': {
      const setup = { ...state.setup, ...action.patch }
      if (!setup.packs.length) setup.packs = ['places']
      if (setup.preset === 'classic') setup.observer = false
      return { ...state, setup }
    }
    case 'patch-settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'add-name':
      if (state.names.length >= 15) return state
      return { ...state, names: [...state.names, action.name] }
    case 'remove-name':
      return { ...state, names: state.names.filter((n) => n !== action.name) }
    case 'lock': {
      const names = dedupeNames(state.names).slice(0, 15)
      if (names.length < 2) return state
      const imposters = Math.min(state.setup.imposters, maxImposters(names.length))
      if (imposters < 1) return state
      const players: PlayerState[] = names.map((name, i) => ({
        id: `p${i + 1}`,
        name,
        host: i === 0,
        role: null,
        offer: [],
        ability: null,
        spent: false,
        facet: null,
        trail: [],
        witness: null,
        withdrawn: false,
      }))
      return beginRound(
        {
          ...state,
          names,
          players,
          setup: { ...state.setup, imposters },
          askedCount: {},
        },
        rng,
        true,
      )
    }
    case 'deal-done': {
      if (state.screen !== 'deal') return state
      const id = state.revealOrder[0]
      return { ...state, screen: 'gate', gate: { playerId: id, next: 'secret' } }
    }
    case 'gate-held': {
      if (!state.gate) return state
      if (state.gate.next === 'secret') return { ...state, screen: 'secret' }
      if (state.gate.next === 'hunch') return { ...state, screen: 'hunch' }
      if (state.gate.next === 'duel-answer') return { ...state, screen: 'duel', duelStep: 'answer' }
      return { ...state, screen: 'duel', duelStep: 'guess' }
    }
    case 'ack-secret': {
      const current = player(state, state.revealOrder[state.revealAt])
      const seen = state.secretsSeen + 1
      const base = { ...state, secretsSeen: seen }
      if (current && abilitiesOn(state) && current.role !== 'observer' && current.offer.length) {
        return { ...base, screen: 'ability' }
      }
      return advanceReveal(base, rng)
    }
    case 'pick-ability': {
      const current = player(state, state.revealOrder[state.revealAt])
      if (!current || !current.offer.includes(action.id)) return state
      let next = patchPlayer(state, current.id, (p) => ({ ...p, ability: action.id }))
      if (action.id === 'thread' && state.truthId) {
        const card = CARDS.find((c) => c.id === state.truthId)
        const facet = card ? card.facets[Math.floor(rng() * card.facets.length)] : null
        next = patchPlayer(next, current.id, (p) => ({ ...p, spent: true, facet }))
        return { ...next, screen: 'privy' }
      }
      if (action.id === 'trail') {
        const wrong = shuffle(
          state.shortlist.filter((id) => id !== state.truthId),
          rng,
        ).slice(0, 2)
        next = patchPlayer(next, current.id, (p) => ({ ...p, spent: true, trail: wrong }))
        return { ...next, screen: 'privy' }
      }
      return advanceReveal(next, rng)
    }
    case 'ack-privy':
      return advanceReveal(state, rng)
    case 'enter-table':
      return state.openingOrder.length ? { ...state, screen: 'opening', openingAt: 0 } : startExam(state, rng)
    case 'next-opening': {
      const at = state.openingAt + 1
      if (at >= state.openingOrder.length) return startExam({ ...state, openingAt: at }, rng)
      return { ...state, openingAt: at }
    }
    case 'pick-target': {
      if (!state.prompt || state.prompt.step !== 'target') return state
      if (action.id === state.prompt.askerId) return state
      return { ...state, prompt: { ...state.prompt, targetId: action.id, step: 'prompt' } }
    }
    case 'set-prompt': {
      if (!state.prompt || state.prompt.step !== 'prompt' || !state.prompt.targetId) return state
      const asker = player(state, state.prompt.askerId)
      const observerFirst = asker?.role === 'observer' && !state.observerOpened
      if (observerFirst && !action.card) return state
      let text = action.text
      let next = state
      if (action.card) {
        const known = QUESTIONS.find((q) => q.text === action.text)
        if (known) {
          text = known.text
          next = { ...state, qDeck: state.qDeck.filter((id) => id !== known.id) }
        } else {
          const drawn = drawQuestion(state, rng)
          text = drawn.text
          next = drawn.state
        }
      }
      const pointed = next.armedPointed
      return {
        ...next,
        observerOpened: next.observerOpened || Boolean(observerFirst),
        prompt: { ...next.prompt!, text, pointed, step: 'answer' },
        log: [
          ...next.log,
          {
            id: uid('log'),
            askerId: next.prompt!.askerId,
            targetId: next.prompt!.targetId!,
            text,
            note: '',
            pointed,
            fog: false,
            kind: 'ask',
          },
        ],
      }
    }
    case 'submit-note': {
      if (!state.prompt) return state
      if (state.prompt.step === 'mirror') {
        const last = [...state.log].reverse().find((l) => l.kind === 'ask')
        const logged = pushLog(state, {
          askerId: state.prompt.askerId,
          targetId: last?.targetId ?? state.prompt.askerId,
          text: last?.text ?? '',
          note: action.note,
          pointed: false,
          fog: false,
          kind: 'mirror',
        })
        return { ...logged, prompt: { ...state.prompt, step: 'target', targetId: null } }
      }
      if (state.prompt.step !== 'answer') return state
      const log = [...state.log]
      for (let i = log.length - 1; i >= 0; i--) {
        if (log[i].kind === 'ask' && log[i].askerId === state.prompt.askerId) {
          log[i] = { ...log[i], note: action.note }
          break
        }
      }
      return completeTurn({ ...state, log })
    }
    case 'arm-pointed': {
      const me = player(state, actionIdFrom(state))
      if (!me || me.ability !== 'pointed' || me.spent) return state
      if (!state.prompt || state.prompt.askerId !== me.id) return state
      if (state.prompt.step !== 'target' && state.prompt.step !== 'prompt') return state
      return patchPlayer({ ...state, armedPointed: true }, me.id, (p) => ({ ...p, spent: true }))
    }
    case 'echo': {
      if (!state.prompt || state.prompt.step !== 'target') return state
      const me = player(state, state.prompt.askerId)
      if (!me || me.ability !== 'echo' || me.spent) return state
      const last = [...state.log].reverse().find((l) => l.kind === 'ask' || l.kind === 'mirror')
      if (!last) return state
      const logged = pushLog(patchPlayer(state, me.id, (p) => ({ ...p, spent: true })), {
        askerId: me.id,
        targetId: last.targetId,
        text: last.text,
        note: `نفس الأثر، ${action.word}`,
        pointed: false,
        fog: false,
        kind: 'echo',
      })
      return completeTurn(logged)
    }
    case 'mirror-start': {
      if (!state.prompt || state.prompt.step !== 'target') return state
      const me = player(state, state.prompt.askerId)
      if (!me || me.ability !== 'mirror' || me.spent) return state
      if (!state.log.some((l) => l.kind === 'ask')) return state
      return {
        ...patchPlayer(state, me.id, (p) => ({ ...p, spent: true })),
        prompt: { ...state.prompt, step: 'mirror' },
      }
    }
    case 'seal': {
      const me = player(state, state.sheetFor ?? '')
      if (!me || me.ability !== 'seal' || me.spent) return state
      const observer = state.players.find((p) => p.role === 'observer')
      if (observer && action.id === observer.id && !state.observerOpened) return state
      const idx = state.askOrder.indexOf(action.id)
      if (idx <= state.askAt) return state
      return {
        ...patchPlayer(state, me.id, (p) => ({ ...p, spent: true })),
        askOrder: state.askOrder.filter((id) => id !== action.id),
        sheetFor: null,
      }
    }
    case 'fog': {
      const me = player(state, state.sheetFor ?? '')
      if (!me || me.ability !== 'fog' || me.spent || state.fogUsed >= 2) return state
      if (!state.log.some((l) => l.id === action.lineId && !l.fog)) return state
      return {
        ...patchPlayer(state, me.id, (p) => ({ ...p, spent: true })),
        fogUsed: state.fogUsed + 1,
        log: state.log.map((l) => (l.id === action.lineId ? { ...l, fog: true } : l)),
        sheetFor: null,
      }
    }
    case 'mask': {
      if (!state.prompt || state.prompt.step !== 'answer' || state.prompt.pointed || state.prompt.passed) return state
      const me = player(state, state.prompt.targetId)
      if (!me || me.ability !== 'mask' || me.spent) return state
      if (action.id === me.id || action.id === state.prompt.askerId) return state
      const logged = pushLog(patchPlayer(state, me.id, (p) => ({ ...p, spent: true })), {
        askerId: me.id,
        targetId: action.id,
        text: state.prompt.text,
        note: 'تمرير',
        pointed: false,
        fog: false,
        kind: 'pass',
      })
      return {
        ...logged,
        prompt: { ...state.prompt, targetId: action.id, passed: true },
        sheetFor: null,
      }
    }
    case 'witness': {
      const me = player(state, state.sheetFor ?? '')
      if (!me || me.ability !== 'witness' || me.spent) return state
      if (state.screen !== 'accuse' || action.id === me.id) return state
      return patchPlayer({ ...state, sheetFor: null }, me.id, (p) => ({ ...p, spent: true, witness: action.id }))
    }
    case 'loyalty-start': {
      const me = player(state, state.sheetFor ?? '')
      if (!me || me.ability !== 'loyalty' || me.spent || state.screen !== 'accuse') return state
      const accuserId = Object.entries(state.accusations).find(([, target]) => target === me.id)?.[0]
      if (!accuserId) return state
      const drawn = drawQuestion(state, rng)
      return {
        ...patchPlayer(drawn.state, me.id, (p) => ({ ...p, spent: true })),
        screen: 'loyalty',
        sheetFor: null,
        loyalty: { accusedId: me.id, accuserId, text: drawn.text, step: 'accused' },
      }
    }
    case 'loyalty-next': {
      if (!state.loyalty) return state
      if (state.loyalty.step === 'accused') {
        return { ...state, loyalty: { ...state.loyalty, step: 'accuser' } }
      }
      const line = pushLog(state, {
        askerId: state.loyalty.accuserId,
        targetId: state.loyalty.accusedId,
        text: state.loyalty.text,
        note: 'اختبار ولاء',
        pointed: true,
        fog: false,
        kind: 'loyalty',
      })
      return { ...line, screen: 'accuse', loyalty: null }
    }
    case 'accuse': {
      if (state.screen !== 'accuse') return state
      const id = state.accuseOrder[state.accuseAt]
      if (!id) return startClosing(state, rng)
      const accusations = { ...state.accusations, [id]: action.target }
      const at = state.accuseAt + 1
      if (at >= state.accuseOrder.length) return startClosing({ ...state, accusations, accuseAt: at }, rng)
      return { ...state, accusations, accuseAt: at }
    }
    case 'hunch-pass':
      return { ...state, screen: 'ballot' }
    case 'hunch-guess': {
      const id = state.closingOrder[state.closingAt]
      const me = player(state, id)
      if (me?.role !== 'imposter') return { ...state, screen: 'ballot' }
      if (me.trail.includes(action.cardId)) return state
      return {
        ...state,
        guesses: [...state.guesses, { playerId: id, cardId: action.cardId }],
        screen: 'ballot',
      }
    }
    case 'vote': {
      const id = state.closingOrder[state.closingAt]
      if (!id || action.choice === id) return state
      return nextCloser({ ...state, votes: { ...state.votes, [id]: action.choice } })
    }
    case 'sudden-next': {
      const at = state.suddenAt + 1
      if (at >= state.suddenIds.length) {
        return {
          ...state,
          suddenAt: at,
          suddenVotes: {},
          screen: 'sudden-ballot',
          closingAt: 0,
        }
      }
      return { ...state, suddenAt: at }
    }
    case 'sudden-vote': {
      const id = aliveIds(state)[state.closingAt]
      if (!id || action.choice === id) return state
      const suddenVotes = { ...state.suddenVotes, [id]: action.choice }
      const at = state.closingAt + 1
      if (at >= aliveIds(state).length) {
        const resolution = resolveVotes(suddenVotes, aliveIds(state), false)
        if (resolution.kind === 'tie') {
          const deltas = scoreDeltas({
            players: state.players,
            winner: 'imposters',
            votes: suddenVotes,
            viaGuess: false,
            guessBonus: false,
          })
          return applyResult(
            { ...state, suddenVotes },
            {
              winner: 'imposters',
              via: 'sudden-tie',
              tally: resolution.tally,
              deltas,
            },
          )
        }
        return finishVote({ ...state, suddenVotes, closingAt: at }, resolution, true)
      }
      return { ...state, suddenVotes, closingAt: at }
    }
    case 'to-score':
      return state.result ? { ...state, screen: 'score' } : state
    case 'continue': {
      const tied = state.wins.civilians === state.wins.imposters
      if (state.round >= state.roundCap && !(tied && !state.golden)) return { ...state, screen: 'finale' }
      const golden = state.golden || (state.round >= state.roundCap && tied)
      return beginRound({ ...state, golden, round: state.round + 1 }, rng, false)
    }
    case 'replay':
      return beginRound(state, rng, false)
    case 'cancel': {
      if (state.secretsSeen === 0) return { ...state, screen: 'lobby', gate: null, sheetFor: null }
      return { ...state, screen: 'cancelled', cancelReason: cancelCopy(), sheetFor: null, gate: null }
    }
    case 'withdraw': {
      let next = patchPlayer(state, action.id, (p) => ({ ...p, withdrawn: true }))
      if (!tableValid(next.players)) {
        return { ...next, screen: 'cancelled', cancelReason: cancelCopy(), sheetFor: null }
      }
      next = {
        ...next,
        askOrder: next.askOrder.filter((id) => id !== action.id || next.askOrder.indexOf(id) <= next.askAt),
        sheetFor: null,
      }
      if (next.prompt?.askerId === action.id) return completeTurn(next)
      return next
    }
    case 'sheet':
      return { ...state, sheetFor: action.id, logOpen: false }
    case 'sheet-close':
      return { ...state, sheetFor: null }
    case 'log':
      return { ...state, logOpen: action.open }
    case 'duel-ask':
      return {
        ...state,
        duelNote: action.text,
        screen: 'gate',
        gate: { playerId: civilianId(state), next: 'duel-answer' },
      }
    case 'duel-note':
      return {
        ...state,
        duelNote: action.note || state.duelNote,
        screen: 'gate',
        gate: { playerId: imposterId(state), next: 'duel-guess' },
      }
    case 'duel-pass': {
      if (state.duelBeat >= 3) {
        const deltas = scoreDeltas({
          players: state.players,
          winner: 'civilians',
          votes: {},
          viaGuess: true,
          guessBonus: false,
        })
        return applyResult(state, { winner: 'civilians', via: 'none', tally: {}, deltas })
      }
      return { ...state, duelBeat: state.duelBeat + 1, duelStep: 'ask', screen: 'duel', duelNote: '' }
    }
    case 'duel-guess': {
      const correct = action.cardId === state.truthId
      const winner = correct ? 'imposters' : 'civilians'
      const guesserId = imposterId(state)
      const deltas = scoreDeltas({
        players: state.players,
        winner,
        votes: {},
        viaGuess: true,
        guesserId,
        guessBonus: correct && state.duelBeat >= 2,
      })
      return applyResult(state, {
        winner,
        via: correct ? 'guess' : 'bad-guess',
        eliminatedId: correct ? undefined : guesserId,
        guesserId,
        guessCardId: action.cardId,
        tally: {},
        deltas,
      })
    }
    default:
      return state
  }
}

function actionIdFrom(state: GameState): string {
  return state.sheetFor || state.prompt?.askerId || ''
}

function imposterId(state: GameState): string {
  return state.players.find((p) => p.role === 'imposter' && !p.withdrawn)?.id ?? ''
}

function civilianId(state: GameState): string {
  return state.players.find((p) => p.role !== 'imposter' && !p.withdrawn)?.id ?? ''
}

export function packLabel(id: PackId | null): string {
  return PACKS.find((p) => p.id === id)?.name ?? 'أماكن'
}

export function sideAliveNow(state: GameState): { civilians: number; imposters: number } {
  return sideAlive(state.players)
}
