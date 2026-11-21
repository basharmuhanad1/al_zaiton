import { useEffect, useState } from 'react'
import { ABILITY_COPY, CARDS, ECHO_WORDS, QUESTIONS, questionsByKind } from '../game/content'
import { sfx } from '../game/audio'
import { cleanName, maxImposters, observerAllowed, suggestedImposters } from '../game/logic'
import type { Action } from '../game/reducer'
import { packLabel } from '../game/reducer'
import type { GameState } from '../game/types'
import { HoldButton, Timer, useBeat, useCountdown } from './bits'

function nameOf(state: GameState, id: string | null | undefined): string {
  return state.players.find((p) => p.id === id)?.name ?? '—'
}

function cardName(id: string | null | undefined): string {
  return CARDS.find((c) => c.id === id)?.name ?? '—'
}

function cardEn(id: string | null | undefined): string {
  return CARDS.find((c) => c.id === id)?.en ?? ''
}

export function MatchView({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const [menu, setMenu] = useState(false)
  const [arm, setArm] = useState<string | null>(null)
  const [kind, setKind] = useState<(typeof QUESTIONS)[number]['kind']>('sense')
  const hear = (play: () => void) => {
    if (state.settings.sound) play()
  }

  if (arm) {
    const person = state.players.find((p) => p.id === arm)
    return (
      <section className="screen gate">
        <p className="eyebrow">انظر بعيدًا</p>
        <h1 className="who">{person?.name}</h1>
        <HoldButton
          label={`أنا ${person?.name ?? ''}`}
          onHold={() => {
            hear(sfx.paper)
            dispatch({ type: 'sheet', id: arm })
            setArm(null)
          }}
        />
        <button className="btn ghost" onClick={() => setArm(null)}>
          رجوع
        </button>
      </section>
    )
  }

  if (state.sheetFor) {
    return <Sheet state={state} dispatch={dispatch} onClose={() => dispatch({ type: 'sheet-close' })} />
  }

  if (state.logOpen) {
    return (
      <section className="screen">
        <p className="eyebrow">السجل</p>
        <LogList state={state} />
        <button className="btn" onClick={() => dispatch({ type: 'log', open: false })}>
          أرجعوا المصباح
        </button>
      </section>
    )
  }

  const playScreens = new Set([
    'deal',
    'gate',
    'secret',
    'ability',
    'privy',
    'center',
    'opening',
    'exam',
    'accuse',
    'loyalty',
    'close-gate',
    'hunch',
    'ballot',
    'sudden',
    'sudden-ballot',
    'duel',
  ])

  return (
    <>
      {playScreens.has(state.screen) && (
        <header className="topbar">
          <span>
            جولة {state.round}/{state.roundCap}
            {state.golden ? ' · ذهبية' : ''}
          </span>
          <button className="texty" onClick={() => setMenu(true)} aria-label="قائمة">
            ···
          </button>
        </header>
      )}
      {menu && (
        <section className="screen modal">
          <h2>إلغاء الجولة؟</h2>
          <p className="pitch">لن تُكشف الأدوار.</p>
          <button
            className="btn"
            onClick={() => {
              setMenu(false)
              dispatch({ type: 'cancel' })
            }}
          >
            ألغوا الجولة
          </button>
          <button className="btn ghost" onClick={() => setMenu(false)}>
            عودة
          </button>
        </section>
      )}
      {!menu && <ScreenBody state={state} dispatch={dispatch} kind={kind} setKind={setKind} hear={hear} onSheet={setArm} />}
    </>
  )
}

function ScreenBody({
  state,
  dispatch,
  kind,
  setKind,
  hear,
  onSheet,
}: {
  state: GameState
  dispatch: (action: Action) => void
  kind: (typeof QUESTIONS)[number]['kind']
  setKind: (kind: (typeof QUESTIONS)[number]['kind']) => void
  hear: (play: () => void) => void
  onSheet: (id: string) => void
}) {
  switch (state.screen) {
    case 'setup':
      return <Setup state={state} dispatch={dispatch} />
    case 'names':
      return <Names state={state} dispatch={dispatch} />
    case 'lobby':
      return <Lobby state={state} dispatch={dispatch} />
    case 'deal':
      return <Deal dispatch={dispatch} />
    case 'gate':
      return <Gate state={state} dispatch={dispatch} hear={hear} />
    case 'secret':
      return <Secret state={state} dispatch={dispatch} hear={hear} />
    case 'ability':
      return <Ability state={state} dispatch={dispatch} />
    case 'privy':
      return <Privy state={state} dispatch={dispatch} />
    case 'center':
      return (
        <section className="screen">
          <Lamp />
          <h1 className="wordmark small">ضع الجهاز في الوسط</h1>
          <p className="pitch">من هنا الشاشة مصباح. السر لا يعود إلا في الكشف.</p>
          <button className="btn" data-testid="enter-table" onClick={() => dispatch({ type: 'enter-table' })}>
            أضيئوا المصباح
          </button>
        </section>
      )
    case 'opening':
      return <Opening state={state} dispatch={dispatch} onSheet={onSheet} />
    case 'exam':
      return <Exam state={state} dispatch={dispatch} kind={kind} setKind={setKind} onSheet={onSheet} hear={hear} />
    case 'accuse':
      return <Accuse state={state} dispatch={dispatch} onSheet={onSheet} />
    case 'loyalty':
      return <Loyalty state={state} dispatch={dispatch} />
    case 'close-gate':
      return <Gate state={state} dispatch={dispatch} hear={hear} />
    case 'hunch':
      return <Hunch state={state} dispatch={dispatch} />
    case 'ballot':
      return <Ballot state={state} dispatch={dispatch} hear={hear} />
    case 'sudden':
      return <SuddenTalk state={state} dispatch={dispatch} />
    case 'sudden-ballot':
      return <SuddenVote state={state} dispatch={dispatch} hear={hear} />
    case 'reveal':
      return <Reveal state={state} dispatch={dispatch} hear={hear} />
    case 'score':
      return <Score state={state} dispatch={dispatch} />
    case 'between':
      return <Between state={state} dispatch={dispatch} />
    case 'finale':
      return <Finale state={state} dispatch={dispatch} />
    case 'cancelled':
      return (
        <section className="screen">
          <Lamp dim />
          <h1 className="wordmark small">أُطفئ المصباح</h1>
          <p className="pitch">{state.cancelReason}</p>
          <button className="btn" onClick={() => dispatch({ type: 'replay' })}>
            أعيدوا الجولة
          </button>
          <button className="btn ghost" onClick={() => dispatch({ type: 'nav', screen: 'lobby' })}>
            إلى الردهة
          </button>
        </section>
      )
    case 'duel':
      return <Duel state={state} dispatch={dispatch} />
    default:
      return null
  }
}

function Setup({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const observerOk = state.setup.preset === 'abilities'
  return (
    <section className="screen">
      <p className="eyebrow">TABLE SETUP</p>
      <h1 className="wordmark small">الطاولة</h1>
      <label className="field-label">عدد الجواسيس</label>
      <div className="segment">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={state.setup.imposters === n ? 'on' : ''} onClick={() => dispatch({ type: 'patch-setup', patch: { imposters: n } })}>
            {n}
          </button>
        ))}
      </div>
      <p className="fine">يُراجَع العدد بعد الأسماء. الحد الأعلى يبقى أقل من أهل المكان.</p>
      <label className="field-label">الجولات</label>
      <div className="segment">
        {[1, 3, 5].map((n) => (
          <button key={n} className={state.setup.rounds === n ? 'on' : ''} onClick={() => dispatch({ type: 'patch-setup', patch: { rounds: n as 1 | 3 | 5 } })}>
            {n}
          </button>
        ))}
      </div>
      <div className="choice-grid">
        <button className={state.setup.preset === 'classic' ? 'choice on' : 'choice'} onClick={() => dispatch({ type: 'patch-setup', patch: { preset: 'classic', observer: false } })}>
          <strong>كلاسيكي</strong>
          <span>Classic</span>
          <small>كلام وختم. بلا قدرات.</small>
        </button>
        <button className={state.setup.preset === 'abilities' ? 'choice on' : 'choice'} onClick={() => dispatch({ type: 'patch-setup', patch: { preset: 'abilities' } })}>
          <strong>بقدرات</strong>
          <span>Abilities</span>
          <small>قدرة واحدة، مرة في الجولة.</small>
        </button>
      </div>
      <label className="field-label">الحزم</label>
      <div className="segment wrap">
        {(['places', 'jobs', 'foods'] as const).map((id) => (
          <button
            key={id}
            className={state.setup.packs.includes(id) ? 'on' : ''}
            onClick={() => {
              const has = state.setup.packs.includes(id)
              const packs = has ? state.setup.packs.filter((p) => p !== id) : [...state.setup.packs, id]
              dispatch({ type: 'patch-setup', patch: { packs } })
            }}
          >
            {packLabel(id)}
          </button>
        ))}
      </div>
      <button
        className={state.setup.observer ? 'check on' : 'check'}
        disabled={!observerOk}
        onClick={() => dispatch({ type: 'patch-setup', patch: { observer: !state.setup.observer } })}
      >
        دور نادر: المراقب
        <small>{observerOk ? 'يظهر من 6 لاعبين وبجاسوسين كحد أقصى.' : 'يحتاج إعداد القدرات.'}</small>
      </button>
      <button className={state.setup.english ? 'check on' : 'check'} onClick={() => dispatch({ type: 'patch-setup', patch: { english: !state.setup.english } })}>
        إظهار الترجمة الإنجليزية تحت البطاقة
      </button>
      <button className="btn" onClick={() => dispatch({ type: 'nav', screen: 'names' })}>
        الأسماء
      </button>
    </section>
  )
}

function Names({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  return (
    <section className="screen">
      <p className="eyebrow">NAME ENTRY</p>
      <h1 className="wordmark small">الأسماء</h1>
      <p className="fine">أول اسم هو المضيف، وهو لاعب.</p>
      <form
        className="name-form"
        onSubmit={(event) => {
          event.preventDefault()
          const cleaned = cleanName(value)
          if (!cleaned.ok) {
            setError(cleaned.reason)
            return
          }
          if (state.names.length >= 15) return
          dispatch({ type: 'add-name', name: cleaned.name })
          setValue('')
          setError('')
        }}
      >
        <input
          data-testid="name-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="الاسم"
          maxLength={24}
          enterKeyHint="done"
        />
        <button className="btn" data-testid="add-name" type="submit">
          أضف
        </button>
      </form>
      {error && <p className="fine warn">{error}</p>}
      <div className="rows">
        {state.names.map((name, index) => (
          <div className="row static" key={`${name}-${index}`}>
            <span>
              {name}
              {index === 0 ? ' · مضيف' : ''}
            </span>
            <button className="texty" onClick={() => dispatch({ type: 'remove-name', name })}>
              حذف
            </button>
          </div>
        ))}
      </div>
      <button className="btn" disabled={state.names.length < 2} onClick={() => dispatch({ type: 'nav', screen: 'lobby' })}>
        إلى الردهة · {state.names.length}
      </button>
    </section>
  )
}

function Lobby({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const max = maxImposters(state.names.length)
  const suggested = suggestedImposters(state.names.length)
  const legal = state.names.length >= 2 && state.setup.imposters >= 1 && state.setup.imposters <= max
  const observerOk = observerAllowed(state.names.length, state.setup.imposters, state.setup.preset)
  return (
    <section className="screen">
      <p className="eyebrow">LOBBY</p>
      <Ring names={state.names} />
      <label className="field-label">الجواسيس لهذه الطاولة</label>
      <div className="segment">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} disabled={n > max} className={state.setup.imposters === n ? 'on' : ''} onClick={() => dispatch({ type: 'patch-setup', patch: { imposters: n } })}>
            {n}
          </button>
        ))}
      </div>
      <p className="fine">
        المقترح لـ {state.names.length}: {suggested}. الحد الأعلى {max}.
        {state.setup.observer && !observerOk ? ' المراقب لن يوزَّع: الشروط لم تكتمل.' : ''}
      </p>
      {!legal && <p className="fine warn">عدّلوا عدد الجواسيس قبل القفل.</p>}
      <button className="btn ghost" onClick={() => dispatch({ type: 'patch-setup', patch: { imposters: suggested } })}>
        استخدم المقترح
      </button>
      <button className="btn" data-testid="lock" disabled={!legal} onClick={() => dispatch({ type: 'lock' })}>
        أقفل الطاولة
      </button>
    </section>
  )
}

function Deal({ dispatch }: { dispatch: (action: Action) => void }) {
  useBeat(2200, true, () => dispatch({ type: 'deal-done' }))
  return (
    <section className="screen">
      <Lamp dim />
      <div className="deck" aria-hidden>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <h1 className="wordmark small">وُزّعت الأوراق</h1>
      <p className="pitch">لا أحد يرى إلا ورقته.</p>
    </section>
  )
}

function Gate({ state, dispatch, hear }: { state: GameState; dispatch: (action: Action) => void; hear: (play: () => void) => void }) {
  const person = state.players.find((p) => p.id === state.gate?.playerId)
  return (
    <section className="screen gate">
      <p className="eyebrow">انظر بعيدًا</p>
      <h1 className="who">{person?.name}</h1>
      <p className="pitch">قرّب الجهاز منك قبل أن تضغط.</p>
      <HoldButton
        label={`أنا ${person?.name ?? ''}`}
        onHold={() => {
          hear(sfx.paper)
          dispatch({ type: 'gate-held' })
        }}
      />
    </section>
  )
}

function Secret({ state, dispatch, hear }: { state: GameState; dispatch: (action: Action) => void; hear: (play: () => void) => void }) {
  const [held, setHeld] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [speakArmed, setSpeakArmed] = useState(false)
  const me = state.players.find((p) => p.id === state.revealOrder[state.revealAt])
  const truth = CARDS.find((c) => c.id === state.truthId)
  const visible = held || pinned
  useBeat(20000, visible, () => {
    setHeld(false)
    setPinned(false)
  })
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        setHeld(false)
        setPinned(false)
        speechSynthesis.cancel()
      }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])
  if (!me || !truth) return null
  const imposter = me.role === 'imposter'
  const speak = () => {
    if (!speakArmed) {
      setSpeakArmed(true)
      return
    }
    const text = imposter
      ? `أنت الجاسوس. الفئة ${packLabel(state.packId)}.`
      : `أنت من أهل المكان. السر ${truth.name}. لا تسمّه.`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ar'
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
    setSpeakArmed(false)
  }
  return (
    <section className="screen">
      <p className="eyebrow">{me.name}</p>
      <article className={visible ? 'paper shown' : 'paper veiled'}>
        {visible ? (
          <>
            <span className={`role-pill ${me.role}`}>{me.role === 'imposter' ? 'جاسوس' : me.role === 'observer' ? 'مراقب' : 'مدني'}</span>
            <p className="cat">{packLabel(state.packId)}</p>
            {imposter ? (
              <>
                <h2 className="secret-word quiet">لا تعرف أيها الحقيقة</h2>
                <div className="mini-grid">
                  {state.shortlist.map((id) => (
                    <span key={id}>
                      {cardName(id)}
                      {state.setup.english && <small>{cardEn(id)}</small>}
                    </span>
                  ))}
                </div>
                <p className="whisper">حدس واحد للجولة كلها. الخطأ إخراجك وفوزهم.</p>
              </>
            ) : (
              <>
                <h2 className="secret-word">{truth.name}</h2>
                {state.setup.english && <p className="en">{truth.en}</p>}
                <p className="whisper">لا تسمِّه</p>
                <p className="fine dark">تجنّب: {truth.forbidden.join('، ')}</p>
                {me.role === 'observer' && <p className="fine dark">ستفتتح الأسئلة ببطاقة، ولا قدرة أخرى لك.</p>}
              </>
            )}
          </>
        ) : (
          <p className="veiled-copy">الورقة مغطاة</p>
        )}
      </article>
      <HoldButton label="اضغط مطولًا لتُظهر السر" testId="show-secret" onHold={() => setHeld(true)} onRelease={() => setHeld(false)} />
      <button className="btn ghost" data-testid="pin-secret" onClick={() => setPinned(true)}>
        تثبيت للوصول
      </button>
      <button className="texty" onClick={speak}>
        {speakArmed ? 'سيُسمَع السر من المكبّر. اضغط للتأكيد.' : 'انطق السر'}
      </button>
      <button
        className="btn"
        data-testid="ack-secret"
        onClick={() => {
          speechSynthesis.cancel()
          hear(sfx.tick)
          dispatch({ type: 'ack-secret' })
        }}
      >
        أخفِ ومرّر
      </button>
    </section>
  )
}

function Ability({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const me = state.players.find((p) => p.id === state.revealOrder[state.revealAt])
  if (!me) return null
  return (
    <section className="screen">
      <p className="eyebrow">{me.name}</p>
      <h1 className="wordmark small">قدرتك</h1>
      <div className="choice-grid">
        {me.offer.map((id) => (
          <button key={id} className="choice" onClick={() => dispatch({ type: 'pick-ability', id })}>
            <strong>{ABILITY_COPY[id].name}</strong>
            <span>{ABILITY_COPY[id].en}</span>
            <small>{ABILITY_COPY[id].blurb}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function Privy({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const me = state.players.find((p) => p.id === state.revealOrder[state.revealAt])
  if (!me) return null
  return (
    <section className="screen">
      <p className="eyebrow">لك وحدك</p>
      <article className="paper shown">
        {me.ability === 'thread' ? (
          <>
            <h2 className="secret-word">{me.facet}</h2>
            <p className="whisper">خيط واحد. ليس الاسم.</p>
          </>
        ) : (
          <>
            <h2 className="secret-word quiet">ليست الحقيقة</h2>
            <div className="mini-grid">
              {state.shortlist.map((id) => (
                <span key={id} className={me.trail.includes(id) ? 'dead' : ''}>
                  {cardName(id)}
                </span>
              ))}
            </div>
          </>
        )}
      </article>
      <button className="btn" onClick={() => dispatch({ type: 'ack-privy' })}>
        أخفِ ومرّر
      </button>
    </section>
  )
}

function Opening({ state, dispatch, onSheet }: { state: GameState; dispatch: (action: Action) => void; onSheet: (id: string) => void }) {
  const id = state.openingOrder[state.openingAt]
  useBeat(10000, true, () => dispatch({ type: 'next-opening' }), state.openingAt)
  const left = useCountdown(10000, true, state.openingAt)
  return (
    <section className="screen">
      <Lamp />
      <p className="eyebrow">
        دائرة الافتتاح <Timer seconds={left} />
      </p>
      <h1 className="who">{nameOf(state, id)}</h1>
      <p className="pitch">جملة واحدة. لا تسمِّ السر.</p>
      <button className="btn" onClick={() => dispatch({ type: 'next-opening' })}>
        انتهت الجملة
      </button>
      <TableTools state={state} dispatch={dispatch} onSheet={onSheet} />
    </section>
  )
}

function Exam({
  state,
  dispatch,
  kind,
  setKind,
  onSheet,
  hear,
}: {
  state: GameState
  dispatch: (action: Action) => void
  kind: (typeof QUESTIONS)[number]['kind']
  setKind: (kind: (typeof QUESTIONS)[number]['kind']) => void
  onSheet: (id: string) => void
  hear: (play: () => void) => void
}) {
  const prompt = state.prompt
  if (!prompt) return null
  const asker = state.players.find((p) => p.id === prompt.askerId)
  const observerFirst = asker?.role === 'observer' && !state.observerOpened
  if (prompt.step === 'answer') {
    return <Answer state={state} dispatch={dispatch} onSheet={onSheet} />
  }
  if (prompt.step === 'mirror') {
    return (
      <section className="screen">
        <p className="eyebrow">المرآة</p>
        <NoteForm
          label="جوابك عن السؤال نفسه"
          onSubmit={(note) => {
            hear(sfx.tick)
            dispatch({ type: 'submit-note', note })
          }}
        />
      </section>
    )
  }
  if (prompt.step === 'prompt') {
    const groups = questionsByKind()
    return (
      <section className="screen">
        <p className="eyebrow">سؤال {nameOf(state, prompt.askerId)}</p>
        <h2 className="prompt-title">إلى {nameOf(state, prompt.targetId)}</h2>
        {state.armedPointed && <p className="fine">السؤال المُحدَّد جاهز. اختر بطاقة.</p>}
        {observerFirst && <p className="fine">المراقب يفتتح ببطاقة.</p>}
        {!observerFirst && !state.armedPointed && (
          <button className="btn" onClick={() => dispatch({ type: 'set-prompt', text: 'سؤال حر. اسأل بصوتك، ولا تسمِّ السر.', card: false })}>
            سؤال حر
          </button>
        )}
        <div className="segment wrap">
          {groups.map((group) => (
            <button key={group.kind} className={kind === group.kind ? 'on' : ''} onClick={() => setKind(group.kind)}>
              {group.label}
            </button>
          ))}
        </div>
        <div className="rows">
          {QUESTIONS.filter((q) => q.kind === kind).map((q) => (
            <button key={q.id} className="row" onClick={() => dispatch({ type: 'set-prompt', text: q.text, card: true })}>
              {q.text}
            </button>
          ))}
        </div>
        <TableTools state={state} dispatch={dispatch} onSheet={onSheet} />
      </section>
    )
  }
  const others = state.players.filter((p) => !p.withdrawn && p.id !== prompt.askerId)
  return (
    <section className="screen">
      <Ring names={state.players.filter((p) => !p.withdrawn).map((p) => p.name)} active={asker?.name} />
      <p className="eyebrow">الاستجواب</p>
      <h1 className="who">{asker?.name}</h1>
      <p className="pitch">اختر من يُسأل.</p>
      <div className="rows">
        {others.map((p) => (
          <button key={p.id} className="row" onClick={() => dispatch({ type: 'pick-target', id: p.id })}>
            {p.name}
          </button>
        ))}
      </div>
      <TableTools state={state} dispatch={dispatch} onSheet={onSheet} />
    </section>
  )
}

function Answer({ state, dispatch, onSheet }: { state: GameState; dispatch: (action: Action) => void; onSheet: (id: string) => void }) {
  const prompt = state.prompt!
  useBeat(15000, true, () => dispatch({ type: 'submit-note', note: '' }), `${prompt.askerId}:${prompt.targetId}`)
  const left = useCountdown(15000, true, `${prompt.askerId}:${prompt.targetId}`)
  return (
    <section className="screen">
      <p className="eyebrow">
        الجواب <Timer seconds={left} />
      </p>
      <h2 className="prompt-title">{nameOf(state, prompt.targetId)}</h2>
      <p className="prompt">{prompt.text}</p>
      {prompt.pointed && <p className="fine">لا يُمرَّر.</p>}
      <NoteForm label="دوّنوا الجملة إن شئتم" onSubmit={(note) => dispatch({ type: 'submit-note', note })} />
      <TableTools state={state} dispatch={dispatch} onSheet={onSheet} />
    </section>
  )
}

function NoteForm({ label, onSubmit }: { label: string; onSubmit: (note: string) => void }) {
  const [note, setNote] = useState('')
  return (
    <form
      className="name-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(note.trim())
      }}
    >
      <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={label} maxLength={80} />
      <button className="btn" type="submit">
        تم
      </button>
    </form>
  )
}

function Accuse({ state, dispatch, onSheet }: { state: GameState; dispatch: (action: Action) => void; onSheet: (id: string) => void }) {
  const id = state.accuseOrder[state.accuseAt]
  const others = state.players.filter((p) => !p.withdrawn && p.id !== id)
  return (
    <section className="screen">
      <Lamp dim />
      <p className="eyebrow">الصمت. ضع الاتهام.</p>
      <h1 className="who">{nameOf(state, id)}</h1>
      <div className="rows">
        {others.map((p) => (
          <button key={p.id} className="row" onClick={() => dispatch({ type: 'accuse', target: p.id })}>
            {p.name}
            {state.players.some((x) => x.witness === p.id) ? ' · شاهد' : ''}
          </button>
        ))}
      </div>
      <button className="btn ghost" onClick={() => dispatch({ type: 'accuse', target: null })}>
        لا أتهم
      </button>
      <AccusationSummary state={state} />
      <TableTools state={state} dispatch={dispatch} onSheet={onSheet} />
    </section>
  )
}

function AccusationSummary({ state }: { state: GameState }) {
  const entries = Object.entries(state.accusations).filter(([, target]) => target)
  if (!entries.length) return null
  return (
    <ul className="summary">
      {entries.map(([id, target]) => (
        <li key={id}>
          {nameOf(state, id)} → {nameOf(state, target)}
        </li>
      ))}
    </ul>
  )
}

function Loyalty({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  if (!state.loyalty) return null
  const speaker = state.loyalty.step === 'accused' ? state.loyalty.accusedId : state.loyalty.accuserId
  return (
    <section className="screen">
      <p className="eyebrow">اختبار الولاء</p>
      <h2 className="prompt-title">{nameOf(state, speaker)}</h2>
      <p className="prompt">{state.loyalty.text}</p>
      <p className="fine">لا حصانة. الكلام فقط.</p>
      <button className="btn" onClick={() => dispatch({ type: 'loyalty-next' })}>
        {state.loyalty.step === 'accused' ? 'ثم المتّهِم' : 'عودة إلى الاتهام'}
      </button>
    </section>
  )
}

function Hunch({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const id = state.closingOrder[state.closingAt]
  const me = state.players.find((p) => p.id === id)
  useBeat(6000, true, () => dispatch({ type: 'hunch-pass' }), id ?? '')
  const left = useCountdown(6000, true, id ?? '')
  const imposter = me?.role === 'imposter'
  return (
    <section className="screen">
      <p className="eyebrow">
        الحدس <Timer seconds={left} />
      </p>
      <h1 className="who">{me?.name}</h1>
      <div className="mini-grid pick">
        {state.shortlist.map((cardId) => {
          const blocked = me?.trail.includes(cardId)
          if (!imposter) return <span key={cardId} className="back" />
          return (
            <button key={cardId} disabled={blocked} className={blocked ? 'dead' : ''} onClick={() => dispatch({ type: 'hunch-guess', cardId })}>
              {blocked ? 'ليست الحقيقة' : cardName(cardId)}
            </button>
          )
        })}
      </div>
      {!imposter && <p className="whisper center">الحدس ليس في يدك</p>}
      <button className="btn ghost" onClick={() => dispatch({ type: 'hunch-pass' })}>
        أمرّ
      </button>
    </section>
  )
}

function Ballot({ state, dispatch, hear }: { state: GameState; dispatch: (action: Action) => void; hear: (play: () => void) => void }) {
  const id = state.closingOrder[state.closingAt]
  const others = state.players.filter((p) => !p.withdrawn && p.id !== id)
  const vote = (choice: string) => {
    hear(sfx.seal)
    dispatch({ type: 'vote', choice })
  }
  return (
    <section className="screen">
      <p className="eyebrow">الختم</p>
      <h1 className="who">{nameOf(state, id)}</h1>
      <div className="rows">
        {others.map((p) => (
          <button key={p.id} className="row seal-row" onClick={() => vote(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <button className="btn ghost" data-testid="vote-none" onClick={() => vote('none')}>
        لا أحد
      </button>
    </section>
  )
}

function SuddenTalk({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const id = state.suddenIds[state.suddenAt]
  return (
    <section className="screen">
      <p className="eyebrow">حسم سريع</p>
      <h1 className="who">{nameOf(state, id)}</h1>
      <p className="pitch">جملة واحدة. ثم يُعاد الختم بين المتعادلين فقط.</p>
      <button className="btn" onClick={() => dispatch({ type: 'sudden-next' })}>
        انتهت الجملة
      </button>
    </section>
  )
}

function SuddenVote({ state, dispatch, hear }: { state: GameState; dispatch: (action: Action) => void; hear: (play: () => void) => void }) {
  const voters = state.players.filter((p) => !p.withdrawn)
  const me = voters[state.closingAt]
  if (!me) return null
  return (
    <section className="screen">
      <p className="eyebrow">ختم الحسم</p>
      <h1 className="who">{me.name}</h1>
      <div className="rows">
        {state.suddenIds
          .filter((id) => id !== me.id)
          .map((id) => (
            <button
              key={id}
              className="row"
              onClick={() => {
                hear(sfx.seal)
                dispatch({ type: 'sudden-vote', choice: id })
              }}
            >
              {nameOf(state, id)}
            </button>
          ))}
      </div>
    </section>
  )
}

function Reveal({ state, dispatch, hear }: { state: GameState; dispatch: (action: Action) => void; hear: (play: () => void) => void }) {
  const result = state.result
  const truth = CARDS.find((c) => c.id === state.truthId)
  const imposters = state.players.filter((p) => p.role === 'imposter')
  if (!result || !truth) return null
  return (
    <section className="screen reveal">
      <Lamp dim={result.winner === 'imposters'} />
      <p className="eyebrow">{result.winner === 'civilians' ? 'أهل المكان' : 'الجواسيس'}</p>
      <h1 className="wordmark small">{result.winner === 'civilians' ? 'الجولة لأهل المكان' : 'الجولة للجواسيس'}</h1>
      {result.eliminatedId && (
        <p className="pitch">
          {nameOf(state, result.eliminatedId)} · {state.players.find((p) => p.id === result.eliminatedId)?.role === 'imposter' ? 'جاسوس' : 'من أهل المكان'}
        </p>
      )}
      <div className="rows">
        {imposters.map((p) => (
          <div key={p.id} className="row static">
            <span>{p.name}</span>
            <span className="role-pill imposter">جاسوس</span>
          </div>
        ))}
      </div>
      <article className="paper shown slim">
        <p className="cat">{packLabel(state.packId)}</p>
        <h2 className="secret-word">{truth.name}</h2>
      </article>
      <button
        className="btn"
        onClick={() => {
          hear(result.winner === 'civilians' ? sfx.civilians : sfx.imposters)
          dispatch({ type: 'to-score' })
        }}
      >
        النقاط
      </button>
    </section>
  )
}

function Score({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const result = state.result
  if (!result) return null
  return (
    <section className="screen">
      <Pips wins={state.wins} cap={state.roundCap} />
      <h1 className="wordmark small">الأختام</h1>
      <div className="rows">
        {state.players.map((p) => (
          <div key={p.id} className="row static">
            <span>
              {p.name}
              <small>
                {p.role === 'imposter' ? 'جاسوس' : p.role === 'observer' ? 'مراقب' : 'مدني'}{' '}
                <bdi className="delta">{formatDelta(result.deltas[p.id] ?? 0)}</bdi>
              </small>
            </span>
            <strong>{state.scores[p.id] ?? 0}</strong>
          </div>
        ))}
      </div>
      <Tally state={state} tally={result.tally} />
      <button className="btn" onClick={() => dispatch({ type: 'continue' })}>
        {state.round >= state.roundCap && !(state.wins.civilians === state.wins.imposters && !state.golden) ? 'ختام المباراة' : 'الجولة التالية'}
      </button>
    </section>
  )
}

function Between({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  return (
    <section className="screen">
      <Pips wins={state.wins} cap={state.roundCap} />
      <h1 className="wordmark small">بين الجولات</h1>
      <button className="btn" onClick={() => dispatch({ type: 'continue' })}>
        وزّعوا الأوراق
      </button>
      <button className="btn ghost" onClick={() => dispatch({ type: 'nav', screen: 'lobby' })}>
        غيّروا العدد
      </button>
    </section>
  )
}

function Finale({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const ranked = [...state.players].sort((a, b) => (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0))
  const star = ranked[0]
  const lead = state.wins.civilians === state.wins.imposters ? 'مباراة متعادلة' : state.wins.civilians > state.wins.imposters ? 'الليلة لأهل المكان' : 'الليلة للجواسيس'
  return (
    <section className="screen">
      <Lamp />
      <p className="eyebrow">الختام</p>
      <h1 className="wordmark small">{lead}</h1>
      <Pips wins={state.wins} cap={state.roundCap} />
      {star && <p className="pitch">نجم الليلة: {star.name}</p>}
      <div className="rows">
        {ranked.map((p) => (
          <div key={p.id} className="row static">
            <span>{p.name}</span>
            <strong>{state.scores[p.id] ?? 0}</strong>
          </div>
        ))}
      </div>
      <button className="btn" onClick={() => dispatch({ type: 'nav', screen: 'lobby' })}>
        مباراة جديدة
      </button>
      <button className="btn ghost" onClick={() => dispatch({ type: 'nav', screen: 'home' })}>
        إلى الباب
      </button>
    </section>
  )
}

function Duel({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const imp = state.players.find((p) => p.role === 'imposter')
  const civ = state.players.find((p) => p.role !== 'imposter')
  if (state.duelStep === 'ask') {
    return (
      <section className="screen">
        <p className="eyebrow">
          المواجهة · {state.duelBeat}/3
        </p>
        <h1 className="who">{imp?.name} يسأل</h1>
        <div className="rows">
          {QUESTIONS.slice(0, 6).map((q) => (
            <button key={q.id} className="row" onClick={() => dispatch({ type: 'duel-ask', text: q.text })}>
              {q.text}
            </button>
          ))}
        </div>
        <button className="btn ghost" onClick={() => dispatch({ type: 'duel-ask', text: 'سؤال حر. اسأل بصوتك.' })}>
          سؤال حر
        </button>
      </section>
    )
  }
  if (state.duelStep === 'answer') {
    return (
      <section className="screen">
        <p className="eyebrow">{civ?.name}</p>
        <p className="prompt">{state.duelNote}</p>
        <NoteForm label="جوابك، جملة واحدة" onSubmit={(note) => dispatch({ type: 'duel-note', note })} />
      </section>
    )
  }
  return (
    <section className="screen">
      <p className="eyebrow">{imp?.name} · الحدس</p>
      <p className="pitch">{state.duelNote}</p>
      <div className="rows">
        {state.shortlist.map((id) => (
          <button key={id} className="row" onClick={() => dispatch({ type: 'duel-guess', cardId: id })}>
            {cardName(id)}
          </button>
        ))}
      </div>
      <button className="btn ghost" onClick={() => dispatch({ type: 'duel-pass' })}>
        {state.duelBeat >= 3 ? 'أمرّ' : 'سؤال آخر'}
      </button>
    </section>
  )
}

function Sheet({ state, dispatch, onClose }: { state: GameState; dispatch: (action: Action) => void; onClose: () => void }) {
  const me = state.players.find((p) => p.id === state.sheetFor)
  const truth = CARDS.find((c) => c.id === state.truthId)
  if (!me || !truth) return null
  const future = state.askOrder.slice(state.askAt + 1)
  return (
    <section className="screen">
      <p className="eyebrow">{me.name}</p>
      <span className={`role-pill ${me.role}`}>{me.role === 'imposter' ? 'جاسوس' : me.role === 'observer' ? 'مراقب' : 'مدني'}</span>
      {me.role === 'imposter' ? (
        <div className="mini-grid">
          {state.shortlist.map((id) => (
            <span key={id} className={me.trail.includes(id) ? 'dead' : ''}>
              {cardName(id)}
            </span>
          ))}
        </div>
      ) : (
        <article className="paper shown slim">
          <h2 className="secret-word">{truth.name}</h2>
          <p className="fine dark">تجنّب: {truth.forbidden.join('، ')}</p>
        </article>
      )}
      {me.facet && <p className="pitch">الخيط: {me.facet}</p>}
      {me.ability && !me.spent && (
        <div className="stack">
          {me.ability === 'pointed' && state.prompt?.askerId === me.id && <button className="btn" onClick={() => dispatch({ type: 'arm-pointed' })}>جهّز السؤال المحدد</button>}
          {me.ability === 'mirror' && state.prompt?.askerId === me.id && state.prompt.step === 'target' && (
            <button className="btn" onClick={() => dispatch({ type: 'mirror-start' })}>
              المرآة
            </button>
          )}
          {me.ability === 'echo' && state.prompt?.askerId === me.id && state.prompt.step === 'target' && (
            <div className="segment wrap">
              {ECHO_WORDS.map((word) => (
                <button key={word} onClick={() => dispatch({ type: 'echo', word })}>
                  {word}
                </button>
              ))}
            </div>
          )}
          {me.ability === 'seal' &&
            future.map((id) => (
              <button key={id} className="btn ghost" onClick={() => dispatch({ type: 'seal', id })}>
                اكتم {nameOf(state, id)}
              </button>
            ))}
          {me.ability === 'fog' && state.fogUsed < 2 && (
            <div className="rows">
              {state.log
                .filter((line) => !line.fog)
                .map((line) => (
                  <button key={line.id} className="row" onClick={() => dispatch({ type: 'fog', lineId: line.id })}>
                    أخفِ: {line.text}
                  </button>
                ))}
            </div>
          )}
          {me.ability === 'mask' && state.prompt?.targetId === me.id && state.prompt.step === 'answer' && !state.prompt.pointed && !state.prompt.passed && (
            <div className="rows">
              {state.players
                .filter((p) => !p.withdrawn && p.id !== me.id && p.id !== state.prompt?.askerId)
                .map((p) => (
                  <button key={p.id} className="row" onClick={() => dispatch({ type: 'mask', id: p.id })}>
                    مرّر إلى {p.name}
                  </button>
                ))}
            </div>
          )}
          {me.ability === 'witness' && state.screen === 'accuse' && (
            <div className="rows">
              {state.players
                .filter((p) => p.id !== me.id && !p.withdrawn)
                .map((p) => (
                  <button key={p.id} className="row" onClick={() => dispatch({ type: 'witness', id: p.id })}>
                    علامة على {p.name}
                  </button>
                ))}
            </div>
          )}
          {me.ability === 'loyalty' && state.screen === 'accuse' && Object.values(state.accusations).includes(me.id) && (
            <button className="btn" onClick={() => dispatch({ type: 'loyalty-start' })}>
              اختبار الولاء
            </button>
          )}
        </div>
      )}
      {me.ability && me.spent && <p className="fine">القدرة استُعملت هذه الجولة.</p>}
      <button className="btn ghost" onClick={() => dispatch({ type: 'withdraw', id: me.id })}>
        انسحب من الجولة
      </button>
      <button className="btn" onClick={onClose}>
        أخفِ
      </button>
    </section>
  )
}

function TableTools({
  state,
  dispatch,
  onSheet,
}: {
  state: GameState
  dispatch: (action: Action) => void
  onSheet: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="tools">
      <button className="btn ghost" onClick={() => dispatch({ type: 'log', open: true })}>
        السجل
      </button>
      <button className="btn ghost" onClick={() => setOpen((value) => !value)}>
        ورقتي
      </button>
      {open && (
        <div className="rows">
          {state.players
            .filter((p) => !p.withdrawn)
            .map((p) => (
              <button key={p.id} className="row" onClick={() => onSheet(p.id)}>
                {p.name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

function LogList({ state }: { state: GameState }) {
  if (!state.log.length) return <p className="pitch">السجل فارغ.</p>
  return (
    <div className="rows">
      {state.log.map((line) => (
        <article key={line.id} className={line.fog ? 'quote fogged' : 'quote'}>
          {line.fog ? (
            <p>حبر</p>
          ) : (
            <>
              <strong>
                {nameOf(state, line.askerId)}
                {line.kind === 'pass' ? ` مرّر إلى ${nameOf(state, line.targetId)}` : ` → ${nameOf(state, line.targetId)}`}
              </strong>
              <p>{line.text}</p>
              {line.note && <p>{line.note}</p>}
            </>
          )}
        </article>
      ))}
    </div>
  )
}

function Ring({ names, active }: { names: string[]; active?: string }) {
  return (
    <div className="ring" aria-hidden>
      {names.map((name, index) => {
        const angle = (index / names.length) * Math.PI * 2 - Math.PI / 2
        const x = 50 + Math.cos(angle) * 40
        const y = 48 + Math.sin(angle) * 36
        return (
          <span key={`${name}-${index}`} className={name === active ? 'seat on' : 'seat'} style={{ left: `${x}%`, top: `${y}%` }}>
            {name}
          </span>
        )
      })}
      <i className="ring-core" />
    </div>
  )
}

function Lamp({ dim = false }: { dim?: boolean }) {
  return (
    <div className={dim ? 'lamp dim' : 'lamp'} aria-hidden>
      <span className="chain" />
      <span className="glow" />
      <span className="bulb" />
    </div>
  )
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

function Pips({ wins }: { wins: { civilians: number; imposters: number }; cap: number }) {
  return (
    <div className="pips">
      <span>
        أهل المكان <bdi className="delta">{wins.civilians}</bdi>
      </span>
      <span>
        الجواسيس <bdi className="delta">{wins.imposters}</bdi>
      </span>
    </div>
  )
}

function Tally({ state, tally }: { state: GameState; tally: Record<string, number> }) {
  const entries = Object.entries(tally)
  if (!entries.length) return null
  return (
    <ul className="summary">
      {entries.map(([id, count]) => (
        <li key={id}>
          {id === 'none' ? 'لا أحد' : nameOf(state, id)} <bdi className="delta">{count}</bdi>
        </li>
      ))}
    </ul>
  )
}
