import { useEffect, useReducer, useState } from 'react'
import { HOW_CARDS } from './game/content'
import { sfx } from './game/audio'
import type { GameState } from './game/types'
import type { Action } from './game/reducer'
import { initialState, reduce } from './game/reducer'
import { MatchView } from './ui/match'
import { Solo } from './ui/solo'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export function App() {
  const [state, dispatch] = useReducer((current: GameState, action: Action) => reduce(current, action), undefined, initialState)
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  useEffect(() => {
    try {
      const settings = localStorage.getItem('imposter-settings')
      const setup = localStorage.getItem('imposter-setup')
      if (settings) dispatch({ type: 'patch-settings', patch: JSON.parse(settings) })
      if (setup) dispatch({ type: 'patch-setup', patch: JSON.parse(setup) })
    } catch {
      /* ignore broken local prefs */
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('imposter-settings', JSON.stringify(state.settings))
  }, [state.settings])

  useEffect(() => {
    localStorage.setItem('imposter-setup', JSON.stringify(state.setup))
  }, [state.setup])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce', !state.settings.motion)
    document.documentElement.classList.toggle('lg', state.settings.large)
  }, [state.settings.motion, state.settings.large])

  useEffect(() => {
    const onPointer = () => sfx.unlock()
    window.addEventListener('pointerdown', onPointer, { once: true })
    const onInstall = (event: Event) => {
      event.preventDefault()
      setInstall(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onInstall)
    return () => window.removeEventListener('beforeinstallprompt', onInstall)
  }, [])

  const go = (action: Action) => dispatch(action)

  if (state.screen === 'solo') {
    return (
      <main className="app">
        <Solo sound={state.settings.sound} onExit={() => go({ type: 'nav', screen: 'home' })} />
      </main>
    )
  }

  if (state.screen === 'home') {
    return (
      <main className="app">
        <section className="screen">
          <div className="lamp" aria-hidden>
            <span className="chain" />
            <span className="glow" />
            <span className="bulb" />
          </div>
          <p className="eyebrow">IMPOSTER</p>
          <h1 className="wordmark">الجاسوس</h1>
          <p className="pitch">الجميع يعرف المكان. واحد منكم يكذب.</p>
          <button className="btn" data-testid="play" onClick={() => go({ type: 'nav', screen: 'setup' })}>
            مرّر والعب
          </button>
          <button className="btn ghost" data-testid="solo" onClick={() => go({ type: 'nav', screen: 'solo' })}>
            ملف الليلة
          </button>
          <button className="btn ghost" onClick={() => go({ type: 'nav', screen: 'howto' })}>
            كيف تُلعب
          </button>
          {install && (
            <button
              className="btn"
              onClick={() => {
                void install.prompt()
                setInstall(null)
              }}
            >
              ثبّت على أندرويد
            </button>
          )}
          {!standalone && (
            <p className="fine">على أندرويد: من قائمة المتصفح اختر «ثبّت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>
          )}
          <button className={state.settings.sound ? 'check on' : 'check'} onClick={() => go({ type: 'patch-settings', patch: { sound: !state.settings.sound } })}>
            الصوت {state.settings.sound ? 'يعمل' : 'صامت'}
          </button>
          <button className={state.settings.motion ? 'check on' : 'check'} onClick={() => go({ type: 'patch-settings', patch: { motion: !state.settings.motion } })}>
            الحركة {state.settings.motion ? 'هادئة' : 'مطفأة'}
          </button>
          <button className={state.settings.large ? 'check on' : 'check'} onClick={() => go({ type: 'patch-settings', patch: { large: !state.settings.large } })}>
            خط أكبر
          </button>
        </section>
      </main>
    )
  }

  if (state.screen === 'howto') {
    const card = HOW_CARDS[state.howAt] ?? HOW_CARDS[0]
    return (
      <main className="app">
        <section className="screen">
          <p className="eyebrow">
            {state.howAt + 1} / {HOW_CARDS.length}
          </p>
          <article className="paper shown slim">
            <h2 className="secret-word quiet">{card.title}</h2>
            <p>{card.body}</p>
          </article>
          <button
            className="btn"
            onClick={() => {
              if (state.howAt + 1 >= HOW_CARDS.length) go({ type: 'nav', screen: 'home' })
              else go({ type: 'how', at: state.howAt + 1 })
            }}
          >
            {state.howAt + 1 >= HOW_CARDS.length ? 'فهمت' : 'التالي'}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <MatchView state={state} dispatch={go} />
    </main>
  )
}
