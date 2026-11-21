import { useState } from 'react'
import { sfx } from '../game/audio'

interface Shadow {
  id: string
  name: string
  imp: boolean
}

interface CaseFile {
  id: string
  label: string
  place: string
  category: string
  forbidden: [string, string]
  shortlist: string[]
  shadows: Shadow[]
  asks: { by: string; q: string; options: string[] }[]
  statements: { id: string; text: string }[]
  lesson: string
  templates: { id: string; text: string; safe: boolean }[]
}

const CASES: CaseFile[] = [
  {
    id: 'clear',
    label: 'واضح',
    place: 'حمّام تركي',
    category: 'أماكن',
    forbidden: ['بخار', 'منشفة'],
    shortlist: ['حمّام تركي', 'مسبح فندق', 'مغسلة', 'مطبخ البيت'],
    shadows: [
      { id: 'bayan', name: 'بيان', imp: false },
      { id: 'saif', name: 'سيف', imp: false },
      { id: 'jawad', name: 'جواد', imp: true },
      { id: 'lama', name: 'لمى', imp: false },
      { id: 'hana', name: 'هناء', imp: false },
    ],
    asks: [
      {
        by: 'بيان',
        q: 'ماذا تسمع إن سكت الناس؟',
        options: ['ماء من تحت، واطي.', 'ما أميز صوتًا بعينه.', 'نداء من بعيد.'],
      },
      {
        by: 'سيف',
        q: 'كم تبقى عادةً؟',
        options: ['حتى يفك التعب.', 'دقائق وأخرج.', 'أضيع الوقت.'],
      },
      {
        by: 'لمى',
        q: 'هل يحق لك أن ترفع صوتك؟',
        options: ['لا، المكان يخفض الصوت وحده.', 'أحيانًا.', 'نعم، هذا طبعه.'],
      },
    ],
    statements: [
      { id: 'bayan', text: 'أجلس وأحس الحرارة تصعد من الأرض.' },
      { id: 'saif', text: 'ما أدفع عند الباب، أدفع قبل ما أدخل.' },
      { id: 'jawad', text: 'أفتح الشباك لأن الهواء واقف.' },
      { id: 'lama', text: 'الناس يهمسون، والماء لا يتوقف.' },
      { id: 'hana', text: 'أخرج أثقل مما دخلت، ومرتاح.' },
    ],
    lesson: 'راقب من وصف هواء الشارع في مكان لا شباك له.',
    templates: [
      { id: 'safe', text: 'نفس الشيء، أهدأ', safe: true },
      { id: 'risk', text: 'أشم البحر من الشباك', safe: false },
    ],
  },
  {
    id: 'mixed',
    label: 'ملتبس',
    place: 'مكتبة عامة',
    category: 'أماكن',
    forbidden: ['كتب', 'استعارة'],
    shortlist: ['مكتبة عامة', 'قاعة جامعة', 'متحف', 'جامع'],
    shadows: [
      { id: 'noura', name: 'نورة', imp: false },
      { id: 'rami', name: 'رامي', imp: true },
      { id: 'huda', name: 'هدى', imp: false },
      { id: 'fares', name: 'فارس', imp: false },
      { id: 'maya', name: 'مايا', imp: false },
    ],
    asks: [
      {
        by: 'نورة',
        q: 'ما الذي يضايق المهذّب هنا؟',
        options: ['صوت كرسي يُسحَب.', 'الزحمة.', 'الانتظار.'],
      },
      {
        by: 'هدى',
        q: 'أتدخل وحدك أم تنتظر دورك؟',
        options: ['أختار زاوية وأبقى.', 'أنتظر من يناديني.', 'أمشي بين الصفوف.'],
      },
      {
        by: 'مايا',
        q: 'هذا المكان لصباحه أم لليله؟',
        options: ['لنهاره الطويل.', 'لآخر الليل.', 'للاثنين.'],
      },
    ],
    statements: [
      { id: 'noura', text: 'أبحث عن شيء بعينه ثم أضيع في الجوار.' },
      { id: 'rami', text: 'المحاضرة تطول إن جاء الأستاذ متأخرًا.' },
      { id: 'huda', text: 'الصوت منخفض، والوقت يمشي بطيء.' },
      { id: 'fares', text: 'أخرج بشيء معي، وأرجعه لاحقًا.' },
      { id: 'maya', text: 'أفضل زاوية قرب النافذة، لا وسط الزحمة.' },
    ],
    lesson: 'الجار الأقرب للمكان هو أخطر جملة. «المحاضرة» قاعة لا مكتبة.',
    templates: [
      { id: 'safe', text: 'مثلهم، أهدأ', safe: true },
      { id: 'risk', text: 'أنسخ ما يمليه علينا', safe: false },
    ],
  },
  {
    id: 'expert',
    label: 'خبير',
    place: 'سطح في آب',
    category: 'أماكن',
    forbidden: ['غسيل', 'جيران'],
    shortlist: ['سطح في آب', 'شرفة مقهى', 'جسر مشاة', 'ملعب أطفال'],
    shadows: [
      { id: 'leila', name: 'ليلى', imp: false },
      { id: 'kareem', name: 'كريم', imp: true },
      { id: 'mona', name: 'منى', imp: true },
      { id: 'sami', name: 'سامي', imp: false },
      { id: 'noor', name: 'نور', imp: false },
    ],
    asks: [
      {
        by: 'ليلى',
        q: 'الهواء أثقل أم أخف من الشارع؟',
        options: ['أخف، وأوسع.', 'أثقل.', 'مثله.'],
      },
      {
        by: 'سامي',
        q: 'هل تدفع قبل أن تخرج؟',
        options: ['لا أدفع. المكان لنا.', 'أدفع عند الباب.', 'أدفع ثمن ما أحمل.'],
      },
      {
        by: 'نور',
        q: 'ما أسوأ جزء إن كان المكان مزدحمًا؟',
        options: ['تضيق الزوايا.', 'يضيع الصوت.', 'أقف في طابور.'],
      },
    ],
    statements: [
      { id: 'leila', text: 'الحر يضرب من فوق، لا من فرن.' },
      { id: 'kareem', text: 'ندفع تذكرة قبل أن نصعد الدرج.' },
      { id: 'mona', text: 'الماء بارد على البلاط تحت أقدامنا.' },
      { id: 'sami', text: 'أبقى إلى أن يميل الضوء.' },
      { id: 'noor', text: 'الريح أقوى من الشارع، والمكان مكشوف.' },
    ],
    lesson: 'في الخبير كاذبان: تذكرة الباب، وماء على البلاط. السطح لا يبيع دخولًا ولا يبلّل الأرض.',
    templates: [
      { id: 'safe', text: 'نفس الشيء، أعلى', safe: true },
      { id: 'risk', text: 'آخذ تذكرتي وأصعد', safe: false },
    ],
  },
]

type Side = 'civilian' | 'imposter'
type Step = 'pick' | 'brief' | 'asks' | 'read' | 'vote' | 'guess' | 'done'

export function Solo({ sound, onExit }: { sound: boolean; onExit: () => void }) {
  const [difficulty, setDifficulty] = useState(CASES[0].id)
  const [side, setSide] = useState<Side | 'random'>('random')
  const [file, setFile] = useState<CaseFile | null>(null)
  const [role, setRole] = useState<Side>('civilian')
  const [step, setStep] = useState<Step>('pick')
  const [askAt, setAskAt] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [template, setTemplate] = useState<string | null>(null)
  const [stars, setStars] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('imposter-solo') || '{}') as Record<string, number>
    } catch {
      return {}
    }
  })

  const saveStars = (key: string, value: number) => {
    const next = { ...stars, [key]: Math.max(stars[key] ?? 0, value) }
    setStars(next)
    localStorage.setItem('imposter-solo', JSON.stringify(next))
  }

  const start = () => {
    const chosen = CASES.find((c) => c.id === difficulty) ?? CASES[0]
    const played: Side = side === 'random' ? (Math.random() < 0.5 ? 'civilian' : 'imposter') : side
    setFile(chosen)
    setRole(played)
    setStep('brief')
    setAskAt(0)
    setChoice(null)
    setTemplate(null)
  }

  if (step === 'pick' || !file) {
    return (
      <section className="screen">
        <p className="eyebrow">CASEFILE</p>
        <h1 className="wordmark small">ملف الليلة</h1>
        <p className="pitch">خمسة ظلال على الطاولة. الأجوبة مكتوبة، والقرار لك.</p>
        <div className="segment">
          {CASES.map((c) => (
            <button key={c.id} className={difficulty === c.id ? 'on' : ''} onClick={() => setDifficulty(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="segment">
          <button className={side === 'civilian' ? 'on' : ''} onClick={() => setSide('civilian')}>
            أهل المكان
          </button>
          <button className={side === 'imposter' ? 'on' : ''} onClick={() => setSide('imposter')}>
            الجاسوس
          </button>
          <button className={side === 'random' ? 'on' : ''} onClick={() => setSide('random')}>
            فاجئني
          </button>
        </div>
        <button className="btn" onClick={start}>
          افتح الملف
        </button>
        <button className="btn ghost" onClick={onExit}>
          رجوع
        </button>
      </section>
    )
  }

  const finish = (won: boolean, lesson: string) => {
    const value = won ? 3 : 1
    saveStars(`${file.id}:${role}`, value)
    if (sound) (won ? sfx.civilians : sfx.imposters)()
    setStep('done')
    setChoice(lesson)
  }

  if (step === 'brief') {
    return (
      <section className="screen">
        <p className="eyebrow">{file.label}</p>
        <article className="paper">
          <span className={`role-pill ${role === 'imposter' ? 'imposter' : 'civilian'}`}>
            {role === 'imposter' ? 'جاسوس' : 'مدني'}
          </span>
          <p className="cat">{file.category}</p>
          {role === 'civilian' ? (
            <>
              <h2 className="secret-word">{file.place}</h2>
              <p className="whisper">لا تسمِّه. تجنّب: {file.forbidden.join('، ')}</p>
            </>
          ) : (
            <>
              <h2 className="secret-word quiet">لا تعرف الحقيقة</h2>
              <div className="mini-grid">
                {file.shortlist.map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </div>
            </>
          )}
        </article>
        <button className="btn" onClick={() => setStep(role === 'civilian' ? 'asks' : 'read')}>
          إلى الطاولة
        </button>
      </section>
    )
  }

  if (step === 'asks' && role === 'civilian') {
    const ask = file.asks[askAt]
    return (
      <section className="screen">
        <p className="eyebrow">
          سؤال {askAt + 1} من {file.asks.length}
        </p>
        <h2 className="prompt-title">{ask.by} يسأل</h2>
        <p className="prompt">{ask.q}</p>
        <div className="rows">
          {ask.options.map((option) => (
            <button key={option} className="row" onClick={() => setChoice(option)}>
              {option}
            </button>
          ))}
        </div>
        <button
          className="btn"
          disabled={!choice}
          onClick={() => {
            if (askAt + 1 >= file.asks.length) setStep('read')
            else {
              setAskAt(askAt + 1)
              setChoice(null)
            }
          }}
        >
          التالي
        </button>
      </section>
    )
  }

  if (step === 'read') {
    return (
      <section className="screen">
        <p className="eyebrow">ما قيل على الطاولة</p>
        <div className="rows">
          {file.statements.map((line) => (
            <article key={line.id} className="quote">
              <strong>{file.shadows.find((s) => s.id === line.id)?.name}</strong>
              <p>{line.text}</p>
            </article>
          ))}
        </div>
        {role === 'civilian' ? (
          <>
            <h2 className="prompt-title">من يكذب؟</h2>
            <div className="rows">
              {file.shadows.map((shadow) => (
                <button
                  key={shadow.id}
                  className="row"
                  onClick={() => {
                    const won = shadow.imp
                    finish(won, won ? file.lesson : 'ليس هذا الظل. ' + file.lesson)
                  }}
                >
                  {shadow.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="prompt-title">جملتك</h2>
            <div className="rows">
              {file.templates.map((item) => (
                <button key={item.id} className={template === item.id ? 'row on' : 'row'} onClick={() => setTemplate(item.id)}>
                  {item.text}
                </button>
              ))}
            </div>
            <button className="btn" disabled={!template} onClick={() => setStep('guess')}>
              إلى الحدس
            </button>
          </>
        )}
      </section>
    )
  }

  if (step === 'guess') {
    const picked = file.templates.find((item) => item.id === template)
    return (
      <section className="screen">
        <p className="eyebrow">حدس واحد</p>
        <p className="pitch">سمِّ المكان، أو مرّ. الخطأ يخسر الملف.</p>
        <div className="rows">
          {file.shortlist.map((name) => (
            <button
              key={name}
              className="row"
              onClick={() => {
                const correct = name === file.place
                finish(correct, correct ? 'الحدس أصاب. ' + file.lesson : 'الحدس أخطأ. ' + file.lesson)
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <button
          className="btn ghost"
          onClick={() => finish(Boolean(picked?.safe), (picked?.safe ? 'نجوت بالصمت. ' : 'الجملة زادتك وضوحًا. ') + file.lesson)}
        >
          أمرّ
        </button>
      </section>
    )
  }

  const starKey = `${file.id}:${role}`
  return (
    <section className="screen">
      <p className="eyebrow">الملف</p>
      <h1 className="wordmark small">{'★'.repeat(stars[starKey] ?? 1)}</h1>
      <p className="pitch">{choice}</p>
      <button className="btn" onClick={() => setStep('pick')}>
        ملف آخر
      </button>
      <button className="btn ghost" onClick={onExit}>
        إلى الباب
      </button>
    </section>
  )
}
