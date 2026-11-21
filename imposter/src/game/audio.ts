let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!ctx) ctx = new Ctx()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType, gainValue: number) {
  const context = ac()
  if (!context) return
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(gainValue, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + dur)
  osc.connect(gain)
  gain.connect(context.destination)
  osc.start()
  osc.stop(context.currentTime + dur)
}

export const sfx = {
  unlock: () => ac(),
  tick: () => tone(196, 0.07, 'triangle', 0.035),
  seal: () => tone(98, 0.22, 'sine', 0.05),
  paper: () => tone(310, 0.12, 'sine', 0.03),
  civilians: () => {
    tone(247, 0.16, 'sine', 0.04)
    setTimeout(() => tone(330, 0.2, 'sine', 0.04), 120)
  },
  imposters: () => tone(110, 0.4, 'sine', 0.05),
}
