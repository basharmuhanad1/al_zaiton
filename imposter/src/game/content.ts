import type { AbilityId, PackId, QuestionCard, SecretCard } from './types'

export const PACKS: { id: PackId; name: string; blurb: string }[] = [
  { id: 'places', name: 'أماكن', blurb: 'من الحمّام إلى السطح' },
  { id: 'jobs', name: 'مهن', blurb: 'أعمال يعرفها الجميع' },
  { id: 'foods', name: 'أكلات', blurb: 'ما يُشترى ويُؤكل' },
]

export const PACK_NAME: Record<PackId, string> = {
  places: 'أماكن',
  jobs: 'مهن',
  foods: 'أكلات',
}

const p = (
  id: string,
  name: string,
  en: string,
  facets: [string, string, string],
  forbidden: [string, string],
  clash?: string,
): SecretCard => ({ id, pack: 'places', name, en, facets, forbidden, clash })

const j = (
  id: string,
  name: string,
  en: string,
  facets: [string, string, string],
  forbidden: [string, string],
  clash?: string,
): SecretCard => ({ id, pack: 'jobs', name, en, facets, forbidden, clash })

const f = (
  id: string,
  name: string,
  en: string,
  facets: [string, string, string],
  forbidden: [string, string],
  clash?: string,
): SecretCard => ({ id, pack: 'foods', name, en, facets, forbidden, clash })

export const CARDS: SecretCard[] = [
  p('hammam', 'حمّام تركي', 'Turkish bath', ['مائي', 'حار', 'مغلق'], ['بخار', 'منشفة'], 'bath'),
  p('pool', 'مسبح فندق', 'Hotel pool', ['مائي', 'مفتوح', 'مزدحم'], ['كلور', 'غطس'], 'bath'),
  p('laundry', 'مغسلة', 'Laundry', ['مائي', 'حار', 'مغلق'], ['مسحوق', 'نشافة']),
  p('fish', 'سوق السمك', 'Fish market', ['مائي', 'مزدحم', 'مفتوح'], ['زعانف', 'ثلج']),
  p('aquarium', 'حوض سمك', 'Aquarium', ['مائي', 'هادئ', 'مغلق'], ['زجاج', 'مرجان']),
  p('carwash', 'مغسل سيارات', 'Car wash', ['مائي', 'مفتوح', 'مزدحم'], ['رغوة', 'خرطوم']),
  p('sauna', 'غرفة ساونا', 'Sauna', ['حار', 'مغلق', 'هادئ'], ['خشب', 'عرق'], 'bath'),
  p('bakery', 'مخبز الفجر', 'Dawn bakery', ['حار', 'عائلي', 'مفتوح'], ['عجين', 'فرن'], 'oven'),
  p('grill', 'مشواة الزقاق', 'Alley grill', ['حار', 'مزدحم', 'مفتوح'], ['فحم', 'سيخ']),
  p('rooftop', 'سطح في آب', 'August rooftop', ['حار', 'مفتوح', 'عالٍ'], ['غسيل', 'جيران'], 'roof'),
  p('kitchen', 'مطبخ البيت', 'Home kitchen', ['حار', 'عائلي', 'مغلق'], ['قدر', 'بهار'], 'oven'),
  p('gym', 'صالة رياضة', 'Gym', ['حار', 'مغلق', 'مزدحم'], ['جهاز', 'أوزان']),
  p('library', 'مكتبة عامة', 'Public library', ['هادئ', 'مغلق', 'منخفض'], ['كتب', 'استعارة'], 'study'),
  p('museum', 'متحف', 'Museum', ['هادئ', 'مغلق', 'رسمي'], ['لوحة', 'تذكرة']),
  p('mosque', 'جامع', 'Mosque', ['هادئ', 'مغلق', 'منخفض'], ['سجادة', 'أذان']),
  p('cinema', 'صالة سينما', 'Cinema', ['هادئ', 'مغلق', 'مزدحم'], ['شاشة', 'مقعد']),
  p('clinic', 'عيادة', 'Clinic', ['هادئ', 'مغلق', 'رسمي'], ['موعد', 'إبرة'], 'care'),
  p('dentist', 'عيادة أسنان', 'Dentist', ['بارد', 'مغلق', 'رسمي'], ['كرسي', 'ألم'], 'care'),
  p('pharmacy', 'صيدلية ليلية', 'Night pharmacy', ['بارد', 'مغلق', 'ليلي'], ['وصفة', 'درج']),
  p('coldstore', 'براد السوق', 'Market cold room', ['بارد', 'مغلق', 'مزدحم'], ['صندوق', 'صقيع']),
  p('dawnpool', 'مسبح الفجر', 'Dawn pool', ['بارد', 'مائي', 'مفتوح'], ['سلم', 'هدوء الصباح']),
  p('station', 'محطة ليل', 'Night station', ['ليلي', 'مفتوح', 'مزدحم'], ['رصيف', 'صفارة'], 'travel'),
  p('airport', 'مطار', 'Airport', ['ليلي', 'مزدحم', 'رسمي'], ['جواز', 'بوابة'], 'travel'),
  p('fuel', 'محطة وقود', 'Fuel station', ['ليلي', 'مفتوح', 'منخفض'], ['مضخة', 'إسفلت']),
  p('cafe', 'مقهى آخر الليل', 'Late café', ['ليلي', 'مفتوح', 'مزدحم'], ['فنجان', 'رصيف']),
  p('university', 'قاعة جامعة', 'Lecture hall', ['هادئ', 'مزدحم', 'رسمي'], ['محاضرة', 'دفتر'], 'study'),
  p('souq', 'سوق شعبي', 'Souq', ['عائلي', 'مفتوح', 'مزدحم'], ['زقاق', 'نداء']),
  p('playground', 'ملعب أطفال', 'Playground', ['عائلي', 'مفتوح', 'مزدحم'], ['أرجوحة', 'سياج']),
  p('bridge', 'جسر مشاة', 'Footbridge', ['عالٍ', 'مفتوح', 'مزدحم'], ['رياح', 'حديد']),
  p('balcony', 'شرفة مقهى', 'Café balcony', ['عالٍ', 'مفتوح', 'عائلي'], ['إطلالة', 'درابزين'], 'roof'),
  p('lighthouse', 'منارة', 'Lighthouse', ['عالٍ', 'مفتوح', 'هادئ'], ['درج حلزوني', 'ضوء']),
  p('cellar', 'قبو عمارة', 'Building cellar', ['منخفض', 'مغلق', 'هادئ'], ['رطوبة', 'سلالم']),
  p('garage', 'موقف تحت الأرض', 'Underground parking', ['منخفض', 'مغلق', 'ليلي'], ['عامود', 'صدى']),

  j('pharmacist', 'صيدلاني', 'Pharmacist', ['مكتب', 'هدوء', 'رعاية'], ['وصفة', 'درج']),
  j('accountant', 'محاسب', 'Accountant', ['مكتب', 'هدوء', 'زحام'], ['دفتر', 'ختم']),
  j('programmer', 'مبرمج', 'Programmer', ['مكتب', 'هدوء', 'ليل'], ['شاشة', 'رمز']),
  j('teacher', 'معلّم', 'Teacher', ['مكتب', 'زحام', 'هدوء'], ['سبورة', 'دفتر']),
  j('cashier', 'أمين صندوق', 'Cashier', ['مكتب', 'زحام', 'هدوء'], ['درج', 'فاتورة']),
  j('nurse', 'ممرّض', 'Nurse', ['رعاية', 'زحام', 'ليل'], ['إبرة', 'وردية']),
  j('dentistjob', 'طبيب أسنان', 'Dentist', ['رعاية', 'هدوء', 'مكتب'], ['كرسي', 'ألم'], 'carejob'),
  j('paramedic', 'مسعف', 'Paramedic', ['رعاية', 'خطر', 'شارع'], ['صفارة', 'حمّالة']),
  j('midwife', 'قابلة', 'Midwife', ['رعاية', 'هدوء', 'شارع'], ['ليل طويل', 'بيت']),
  j('journalist', 'صحفي', 'Journalist', ['شارع', 'زحام', 'ليل'], ['دفتر', 'سؤال']),
  j('taxi', 'سائق أجرة', 'Taxi driver', ['شارع', 'ليل', 'زحام'], ['عداد', 'زجاج']),
  j('guard', 'حارس ليلي', 'Night guard', ['ليل', 'هدوء', 'خطر'], ['مصباح', 'باب']),
  j('bakerjob', 'خبّاز', 'Baker', ['حرفة', 'هدوء', 'زحام'], ['عجين', 'فرن'], 'ovenjob'),
  j('carpenter', 'نجّار', 'Carpenter', ['حرفة', 'هدوء', 'شارع'], ['خشب', 'منشار']),
  j('tailor', 'خيّاط', 'Tailor', ['حرفة', 'هدوء', 'مكتب'], ['إبرة', 'قماش']),
  j('barber', 'حلّاق', 'Barber', ['حرفة', 'زحام', 'شارع'], ['مرآة', 'مقص']),
  j('butcher', 'جزّار', 'Butcher', ['حرفة', 'زحام', 'شارع'], ['سكين', 'ميزان']),
  j('chef', 'طبّاخ', 'Chef', ['حرفة', 'زحام', 'ليل'], ['قدر', 'نار']),
  j('firefighter', 'إطفائي', 'Firefighter', ['خطر', 'شارع', 'زحام'], ['خرطوم', 'صفارة']),
  j('electrician', 'كهربائي', 'Electrician', ['خطر', 'حرفة', 'شارع'], ['سلك', 'قاطع']),
  j('pilot', 'طيّار', 'Pilot', ['خطر', 'ليل', 'هدوء'], ['مقصورة', 'حزام']),
  j('police', 'شرطي', 'Police officer', ['شارع', 'زحام', 'خطر'], ['صفارة', 'شارة']),

  f('masgouf', 'مسكوف', 'Grilled carp', ['مشوي', 'مالح', 'حار'], ['سمك', 'نهر'], 'fishfood'),
  f('tikka', 'تكة', 'Tikkar', ['مشوي', 'مالح', 'حار'], ['سيخ', 'فحم'], 'grillfood'),
  f('kebab', 'كباب', 'Kebab', ['مشوي', 'مالح', 'حار'], ['سيخ', 'لحم'], 'grillfood'),
  f('shawarma', 'شاورما', 'Shawarma', ['شارع', 'مالح', 'حار'], ['خبز', 'سيخ'], 'wrap'),
  f('falafel', 'فلافل', 'Falafel', ['مقلي', 'شارع', 'مالح'], ['حمّص', 'طحينة'], 'wrap'),
  f('dolma', 'دولمة', 'Dolma', ['مالح', 'حار', 'سائل'], ['ورق', 'أرز']),
  f('biryani', 'برياني', 'Biryani', ['حار', 'مالح', 'شارع'], ['أرز', 'بهار']),
  f('quzi', 'قوزي', 'Quzi', ['مشوي', 'مالح', 'حار'], ['لحم', 'أرز'], 'feast'),
  f('sambosa', 'سمبوسة', 'Samosa', ['مقلي', 'شارع', 'مالح'], ['عجين', 'حشوة']),
  f('kunafa', 'كنافة', 'Kunafa', ['حلو', 'شارع', 'حار'], ['جبن', 'قطر']),
  f('baklava', 'بقلاوة', 'Baklava', ['حلو', 'شارع', 'حار'], ['فستق', 'قطر']),
  f('ice', 'آيس كريم', 'Ice cream', ['بارد', 'حلو', 'شارع'], ['كوب', 'ملعقة']),
  f('lemonade', 'ليموناضة', 'Lemonade', ['بارد', 'حلو', 'سائل'], ['ليمون', 'ثلج']),
  f('lentil', 'شوربة عدس', 'Lentil soup', ['سائل', 'حار', 'مالح'], ['عدس', 'كمون'], 'soup'),
  f('marqa', 'مرقة', 'Broth', ['سائل', 'حار', 'مالح'], ['عظم', 'بصل'], 'soup'),
  f('salad', 'سلطة', 'Salad', ['بارد', 'مالح', 'شارع'], ['خس', 'ليمون']),
  f('fries', 'بطاطا مقلية', 'Fries', ['مقلي', 'شارع', 'مالح'], ['زيت', 'ملح']),
  f('corn', 'ذرة مشوية', 'Grilled corn', ['مشوي', 'شارع', 'حار'], ['عود', 'فحم']),
  f('pomegranate', 'عصير رمّان', 'Pomegranate juice', ['بارد', 'حلو', 'سائل'], ['حبّ', 'كأس']),
  f('hummus', 'حمّص', 'Hummus', ['بارد', 'مالح', 'شارع'], ['طحينة', 'زيت']),
  f('tashreeb', 'تشريب', 'Tashreeb', ['سائل', 'حار', 'مالح'], ['خبز', 'مرق'], 'stew'),
  f('mansaf', 'منسف', 'Mansaf', ['مشوي', 'مالح', 'حار'], ['لبن', 'أرز'], 'feast'),
  f('friedfish', 'سمك مقلي', 'Fried fish', ['مقلي', 'شارع', 'مالح'], ['زيت', 'سمك'], 'fishfood'),
  f('friedcheese', 'جبن مقلي', 'Fried cheese', ['مقلي', 'حار', 'مالح'], ['قشرة', 'زيت']),
]

export const QUESTIONS: QuestionCard[] = [
  { id: 'q1', kind: 'sense', kindLabel: 'حس', text: 'ماذا تسمع إن سكت الناس؟' },
  { id: 'q2', kind: 'sense', kindLabel: 'حس', text: 'ما أول شيء تلمسه هناك؟' },
  { id: 'q3', kind: 'sense', kindLabel: 'حس', text: 'الهواء أثقل أم أخف من الشارع؟' },
  { id: 'q4', kind: 'sense', kindLabel: 'حس', text: 'ماذا يبقى على ثيابك بعد الخروج؟' },
  { id: 'q5', kind: 'social', kindLabel: 'ناس', text: 'هل تدفع قبل أن تخرج؟' },
  { id: 'q6', kind: 'social', kindLabel: 'ناس', text: 'من يكون معك عادةً؟' },
  { id: 'q7', kind: 'social', kindLabel: 'ناس', text: 'هل يحق لك أن ترفع صوتك؟' },
  { id: 'q8', kind: 'social', kindLabel: 'ناس', text: 'أتدخل وحدك أم تنتظر دورك؟' },
  { id: 'q9', kind: 'time', kindLabel: 'وقت', text: 'هذا المكان لصباحه أم لليله؟' },
  { id: 'q10', kind: 'time', kindLabel: 'وقت', text: 'كم تبقى عادةً؟' },
  { id: 'q11', kind: 'time', kindLabel: 'وقت', text: 'هل تتأخر إن وصلت متأخرًا؟' },
  { id: 'q12', kind: 'time', kindLabel: 'وقت', text: 'ما الذي يتغيّر إن طال بقاؤك؟' },
  { id: 'q13', kind: 'mood', kindLabel: 'مزاج', text: 'ما الذي يضايق المهذّب هنا؟' },
  { id: 'q14', kind: 'mood', kindLabel: 'مزاج', text: 'أين يقف المرتبك؟' },
  { id: 'q15', kind: 'mood', kindLabel: 'مزاج', text: 'ما أسوأ جزء إن كان المكان مزدحمًا؟' },
  { id: 'q16', kind: 'mood', kindLabel: 'مزاج', text: 'بماذا تخرج وأنت مرتاح؟' },
  { id: 'q17', kind: 'sense', kindLabel: 'حس', text: 'الأرض تحتك صلبة أم ليّنة؟' },
  { id: 'q18', kind: 'social', kindLabel: 'ناس', text: 'هل يعرفك أحد هناك بالاسم؟' },
  { id: 'q19', kind: 'time', kindLabel: 'وقت', text: 'هل تغلق أبوابه أم يبقى مفتوحًا؟' },
  { id: 'q20', kind: 'mood', kindLabel: 'مزاج', text: 'ما الجملة التي لا تقال بصوت عالٍ؟' },
]

export const ABILITY_COPY: Record<
  AbilityId,
  { name: string; en: string; side: 'civ' | 'imp'; blurb: string }
> = {
  pointed: {
    name: 'السؤال المُحدَّد',
    en: 'Pointed Question',
    side: 'civ',
    blurb: 'بطاقة لا تُمرَّر. جوابها يُكتب في السجل.',
  },
  mirror: {
    name: 'المرآة',
    en: 'Mirror',
    side: 'civ',
    blurb: 'تجيب عن آخر سؤال، ثم تسأل سؤالك.',
  },
  seal: {
    name: 'الكاتم',
    en: 'Seal',
    side: 'civ',
    blurb: 'تُسكت دور سؤال لاعب. الفاعل يبقى مخفيًا.',
  },
  witness: {
    name: 'علامة الشاهد',
    en: 'Witness Mark',
    side: 'civ',
    blurb: 'رهان علني: +2 إن كان جاسوسًا، و−1 إن كان من أهل المكان.',
  },
  loyalty: {
    name: 'اختبار الولاء',
    en: 'Loyalty Test',
    side: 'civ',
    blurb: 'إن اتُّهمت: أنت والمتّهم تجيبان عن بطاقة واحدة. لا حصانة.',
  },
  thread: {
    name: 'الخيط',
    en: 'Thread',
    side: 'imp',
    blurb: 'سمة واحدة صحيحة، الآن، قبل الكلام. ليست الاسم.',
  },
  echo: {
    name: 'الصدى',
    en: 'Echo',
    side: 'imp',
    blurb: 'في دورك تجاري آخر جواب بكلمة آمنة، ولا تسأل.',
  },
  fog: {
    name: 'الضباب',
    en: 'Fog',
    side: 'imp',
    blurb: 'تخفي سطرًا من السجل. السقف سطران للجولة كلها.',
  },
  mask: {
    name: 'القناع',
    en: 'Mask',
    side: 'imp',
    blurb: 'تمرّر سؤالًا حرًا مرة واحدة. السؤال المحدد لا يُمرَّر.',
  },
  trail: {
    name: 'الأثر الكاذب',
    en: 'False Trail',
    side: 'imp',
    blurb: 'بطاقتان من قائمتك ليستا الحقيقة. تبهتان الآن.',
  },
}

export const ECHO_WORDS = ['قريب', 'بعيد', 'أعلى', 'أهدأ', 'مثلهم', 'لست متأكدًا'] as const

export const HOW_CARDS = [
  { title: 'أهل المكان', body: 'يعرفون السر. يتكلمون من غير أن يسمّوه.' },
  { title: 'الجاسوس', body: 'لا يعرفه. يرى قائمة قصيرة، وواحدة منها فقط هي الحقيقة.' },
  { title: 'لا تسمِّه', body: 'جملة دقيقة تفضحك. جملة فارغة تفضحك أيضًا.' },
  { title: 'الختم', body: 'الاتهام صامت. التصويت مخفي. الكشف للجميع.' },
]

export function cardById(id: string): SecretCard {
  const card = CARDS.find((c) => c.id === id)
  if (!card) throw new Error(`missing card ${id}`)
  return card
}

export function questionsByKind() {
  const kinds = ['sense', 'social', 'time', 'mood'] as const
  return kinds.map((kind) => ({
    kind,
    label: QUESTIONS.find((q) => q.kind === kind)?.kindLabel ?? kind,
    cards: QUESTIONS.filter((q) => q.kind === kind),
  }))
}
