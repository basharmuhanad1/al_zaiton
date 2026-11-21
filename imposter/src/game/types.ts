export type PackId = 'places' | 'jobs' | 'foods'
export type Role = 'civilian' | 'imposter' | 'observer'
export type Preset = 'classic' | 'abilities'
export type AbilityId =
  | 'pointed'
  | 'mirror'
  | 'seal'
  | 'witness'
  | 'loyalty'
  | 'thread'
  | 'echo'
  | 'fog'
  | 'mask'
  | 'trail'

export interface SecretCard {
  id: string
  pack: PackId
  name: string
  en: string
  facets: [string, string, string]
  forbidden: [string, string]
  clash?: string
}

export interface QuestionCard {
  id: string
  kind: 'sense' | 'social' | 'time' | 'mood'
  kindLabel: string
  text: string
}

export interface Settings {
  sound: boolean
  motion: boolean
  large: boolean
}

export interface SetupDraft {
  imposters: number
  rounds: 1 | 3 | 5
  preset: Preset
  packs: PackId[]
  observer: boolean
  english: boolean
}

export interface PlayerState {
  id: string
  name: string
  host: boolean
  role: Role | null
  offer: AbilityId[]
  ability: AbilityId | null
  spent: boolean
  facet: string | null
  trail: string[]
  witness: string | null
  withdrawn: boolean
}

export interface LogLine {
  id: string
  askerId: string
  targetId: string
  text: string
  note: string
  pointed: boolean
  fog: boolean
  kind: 'ask' | 'echo' | 'mirror' | 'pass' | 'loyalty'
}

export interface PromptState {
  askerId: string
  targetId: string | null
  text: string
  pointed: boolean
  passed: boolean
  step: 'target' | 'prompt' | 'mirror' | 'answer'
}

export interface RoundResult {
  winner: 'civilians' | 'imposters'
  via: 'vote' | 'none' | 'tie' | 'guess' | 'bad-guess' | 'sudden' | 'sudden-tie'
  eliminatedId?: string
  guesserId?: string
  guessCardId?: string
  tally: Record<string, number>
  deltas: Record<string, number>
}

export type Screen =
  | 'home'
  | 'howto'
  | 'setup'
  | 'names'
  | 'lobby'
  | 'deal'
  | 'gate'
  | 'secret'
  | 'ability'
  | 'privy'
  | 'center'
  | 'opening'
  | 'exam'
  | 'accuse'
  | 'loyalty'
  | 'close-gate'
  | 'hunch'
  | 'ballot'
  | 'sudden'
  | 'sudden-ballot'
  | 'reveal'
  | 'score'
  | 'between'
  | 'finale'
  | 'cancelled'
  | 'duel'
  | 'solo'

export type GateNext = 'secret' | 'hunch' | 'duel-answer' | 'duel-guess'

export interface GameState {
  screen: Screen
  settings: Settings
  setup: SetupDraft
  names: string[]
  players: PlayerState[]
  round: number
  roundCap: number
  golden: boolean
  wins: { civilians: number; imposters: number }
  scores: Record<string, number>
  reads: Record<string, number>
  falls: Record<string, number>
  seen: string[]
  packId: PackId | null
  truthId: string | null
  shortlist: string[]
  revealOrder: string[]
  revealAt: number
  secretsSeen: number
  openingOrder: string[]
  openingAt: number
  askOrder: string[]
  askAt: number
  askedCount: Record<string, number>
  observerOpened: boolean
  prompt: PromptState | null
  armedPointed: boolean
  log: LogLine[]
  fogUsed: number
  qDeck: string[]
  accusations: Record<string, string | null>
  accuseOrder: string[]
  accuseAt: number
  loyalty: null | { accusedId: string; accuserId: string; text: string; step: 'accused' | 'accuser' }
  closingOrder: string[]
  closingAt: number
  guesses: { playerId: string; cardId: string }[]
  votes: Record<string, string>
  suddenIds: string[]
  suddenOrder: string[]
  suddenAt: number
  suddenVotes: Record<string, string>
  result: RoundResult | null
  gate: null | { playerId: string; next: GateNext }
  sheetFor: string | null
  logOpen: boolean
  duelBeat: number
  duelStep: 'ask' | 'answer' | 'guess'
  duelNote: string
  cancelReason: string | null
  howAt: number
}
