/**
 * Seed script: Create Georgian Bedtime Star story in Strapi
 * Run with: node scripts/seed-georgian-story.mjs
 */

const STRAPI_URL = 'https://cms.iraklitbz.dev'
const STRAPI_TOKEN = '627f6d9c3a97080d12060a7ed2dfbb1ec04e4e7068a178c785bee25d1d02b34f8af24e224344b3bbd4e89e9a958a7322be7c03ee873d0661e1b84c6bb9a2fb1cbca58fc06d2c3c24f6aaeea3876139561a019c516860bccacd9f05ff1702b43693728a2ffe71bc50b04ebb64c6a493025d1906d9171b73b8a78541322aa4f533'

async function strapiRequest(endpoint, options = {}) {
  const res = await fetch(`${STRAPI_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...options.headers,
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Strapi ${res.status}: ${text}`)
  }
  return JSON.parse(text)
}

// ─── Story metadata ────────────────────────────────────────────────────────────
const STORY = {
  slug: 'georgian-sleep-star',
  title_es: '{childName}-ის ჯადოსნური ძილის ვარსკვლავი',
  title_en: '{childName}-ის ჯადოსნური ძილის ვარსკვლავი',
  description_es: 'Un cuento mágico para dormir en georgiano. Una estrella especial cuida a {childName} cada noche.',
  description_en: 'A magical Georgian bedtime story. A special star watches over {childName} every night.',
  theme: 'family',
  ageRange: { min: 2, max: 7 },
  illustrationStyle: 'digital',
  version: '1.0.0',
  format: 'book',
  cover_title: '{childName}-ის ჯადოსნური ძილის ვარსკვლავი',
  cover_subtitle_es: 'ჯადოსნური საღამო',
  cover_tagline_es: 'ვარსკვლავი მხოლოდ შენთვის',
  backcover_message_es: 'ძილი ნებისა, {childName} ✨',
  backcover_footer_es: 'ვარსკვლავი ყოველ ღამე მოვა.',
  settings: {
    maxRegenerations: 3,
    defaultAspectRatio: 'ratio_3_4',
    geminiModel: 'gemini-3-pro-image-preview',
    processingTimeout: 180,
    imageQuality: { compression: 85, maxWidth: 1200, maxHeight: 1600 },
    faceSwap: true,
    faceSwapModel: 'cdingram/face-swap',
  },
  styleProfile: {
    technique: 'Semi-realistic Pixar-Disney digital painting, magical bedtime fairy tale aesthetic — hybrid style with realistic child face and richly painterly illustrated environments',
    colorPalette: 'Deep midnight blues and rich purples for the night sky, warm golden magical starlight, soft amber bedroom glow, pale lavender moonlight, twinkling silver and gold star highlights',
    lineWork: 'Clean rounded forms with slightly stylized proportions, soft painterly edges, luminous glow effects around magical star elements, smooth transitions between realistic face and illustrated surroundings',
    texture: 'Smooth digital painting with soft atmospheric glow effects, magical starlight shimmer and sparkle particles, dreamy soft-focus backgrounds with sharp foreground details, rich fabric textures on bedding',
    lighting: 'Magical golden starlight illuminating scenes from above, warm cozy interior amber lamp light, soft pale blue moonlight through curtains, stars casting gentle silver highlights — each page has its own lighting mood',
    detailLevel: 'Richly detailed cozy bedroom environments (soft pillows, warm blankets, toys, moonlit curtains, wooden furniture), semi-realistic child faces with expressive emotion, slightly stylized proportions like Pixar characters',
    atmosphere: 'Enchanting magical bedtime world where stars come alive — safe, warm, wonder-filled, cozy and dreamy like a gentle lullaby made visual, reminiscent of Pixar Brave, Tangled and Soul evening scenes',
    artisticReferences: "Pixar's Brave, Tangled, Soul — semi-realistic child faces with rich painterly illustrated environments, How to Train Your Dragon's magical starry skies, Studio Ghibli's cozy warm interior lighting and wonder",
  },
  typography: {
    kitUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap',
    headline: { family: "'Noto Serif Georgian', serif", weight: 700, fallback: 'serif' },
    body: { family: "'Noto Serif Georgian', serif", weight: 400, fallback: 'serif' },
  },
}

// ─── Page definitions ──────────────────────────────────────────────────────────
const PAGES = [
  // PAGE 1 ─ Evening in the city
  {
    pageNumber: 1,
    aspectRatio: 'ratio_3_4',
    metadata: {
      sceneDescription: 'Child in soft pajamas standing at bedroom window in profile, gazing at the twilight sky over their city. First stars appear in the deepening purple-blue sky. Cozy warm bedroom behind them.',
      emotionalTone: 'calm',
      facePosition: { x: 35, y: 40 },
      difficulty: 'medium',
    },
    prompt: `You are an expert children's book illustrator specializing in magical bedtime stories.

Create a Pixar-Disney style magical bedtime illustration.

CHILD REFERENCE: {CHARACTER_DESCRIPTION}

SCENE: A child in soft cozy pajamas stands at a large bedroom window, seen in 3-quarter profile view, gazing out at the twilight sky over {CITY}. The bedroom behind them is warm and cozy with a soft amber lamp on the nightstand. Through the window, the first stars are beginning to appear in the darkening purple-blue sky. City rooftops and warm lights are visible in the distance below.

COMPOSITION: Medium-wide shot. The child is positioned left-center, silhouetted and profiled against the luminous window. The glowing window takes up the right side, showing the magical evening sky transition. The contrast between warm interior amber and cool exterior twilight blue creates enchantment.

LIGHTING: Warm amber lamp glow illuminates the cozy bedroom interior; cool purple-blue twilight light filters through the window and softly catches the child's profile; the very first twinkling silver star is visible in the darkening sky.

STYLE: HYBRID illustration — the child's face in profile rendered semi-realistically like Pixar's Coco or Encanto, while the bedroom and the cityscape through the window are richly painted in a Disney-Pixar storybook style with warm cozy textures.

COLOR PALETTE: Deep indigo and purple for the evening sky, warm amber golden for the interior, soft lavender moonrise glow, first silver star, cozy bedroom warm tones.

DETAILS: Soft curtains framing the window, cozy bedroom items (bed corner with fluffy pillows, nightstand with warm lamp, small stuffed animal on the bed), distant city rooftops and warm window lights through the glass, depth and magic in the twilight.

EYE RENDERING (avoid artifacts):
- Eye visible in profile, realistic proportions, clear iris, round pupil
- Natural eyelids and lashes, expression of dreamy wonder

FACE RENDERING: Semi-realistic Pixar style — smooth skin with warm interior lamp light on one side, cool blue twilight on the other, creating beautiful cinematic lighting. Profile view, child gazing at the sky with calm wonder.

IMPORTANT: NO text, NO words, NO speech bubbles anywhere in the image.`,
    texts: {
      title_es: '',
      text_es: 'დღეს საღამოა {city}-ში.\nცა ნელა ბნელდება და ვარსკვლავები ანათებენ.\n{childName}-საც ეძინება ნელ-ნელა.',
      title_en: '',
      text_en: 'დღეს საღამოა {city}-ში.\nცა ნელა ბნელდება და ვარსკვლავები ანათებენ.\n{childName}-საც ეძინება ნელ-ნელა.',
    },
  },

  // PAGE 2 ─ Pajamas and bed, star appears
  {
    pageNumber: 2,
    aspectRatio: 'ratio_3_4',
    metadata: {
      sceneDescription: 'Child in colorful pajamas climbing into a big cozy bed with fluffy pillows. A tiny magical golden star suddenly appears near the ceiling, just beginning to twinkle.',
      emotionalTone: 'curious',
      facePosition: { x: 45, y: 38 },
      difficulty: 'medium',
    },
    prompt: `You are an expert children's book illustrator specializing in magical bedtime stories.

Create a Pixar-Disney style magical bedtime illustration.

CHILD REFERENCE: {CHARACTER_DESCRIPTION}

SCENE: A child in soft colorful pajamas is climbing into a big inviting bed with fluffy white pillows and a warm cozy blanket. The bedroom is dimly lit with soft nightlight amber glow. Suddenly, a tiny magical golden star has appeared near the ceiling, just beginning to twinkle and glow, casting the very first hints of magical golden light into the dark room. The child's face is in 3-quarter view, turned slightly upward with sleepy surprise as they notice the star.

COMPOSITION: Medium shot showing the child from the side as they settle into bed, face visible in 3-quarter profile turned slightly toward the ceiling where the small star appears. The magical star is a small bright golden spark of light near the upper corner of the room.

LIGHTING: Soft warm nightlight amber glow fills the room from a small lamp on the nightstand; the new magical golden star creates a small but intensifying pool of warm golden light near the ceiling; pale blue moonlight peeks softly through the curtains.

STYLE: HYBRID illustration — child's face semi-realistic Pixar style, bedroom environment richly painted in Disney-Pixar storybook style with soft warm textures.

COLOR PALETTE: Warm amber and soft peach for the cozy interior, magical golden yellow for the star's first glow, deep navy purple for shadows, soft white for pillows and bedding.

DETAILS: Soft stuffed animals on the bed, colorful cozy pajamas, fluffy pillows, warm textured blanket, wooden bedframe, warm nightlight on nightstand, small star visible as a bright magical spark near the ceiling with tiny radiating beams.

EYE RENDERING (avoid artifacts):
- Eyes in 3-quarter view, realistic proportions, clear iris, round pupils
- Natural eyelids and lashes, expression of sleepy wonder and delight

FACE RENDERING: Semi-realistic Pixar style — smooth skin with amber nightlight glow, eyes wide with gentle surprise, warm sleepy expression.

IMPORTANT: NO text, NO words, NO speech bubbles anywhere in the image.`,
    texts: {
      title_es: '',
      text_es: '{childName} იცვამს პიჟამას და თბილად წვება საწოლში.\nუცებ, პატარა ვარსკვლავი იწყებს კაშკაშს ოთახში.',
      title_en: '',
      text_en: '{childName} იცვამს პიჟამას და თბილად წვება საწოლში.\nუცებ, პატარა ვარსკვლავი იწყებს კაშკაშს ოთახში.',
    },
  },

  // PAGE 3 ─ Star whispers (closer, looking up at star)
  {
    pageNumber: 3,
    aspectRatio: 'ratio_3_4',
    metadata: {
      sceneDescription: 'Child sitting up in bed looking upward at a beautiful glowing magical star. The star radiates warm golden light. Child has an expression of wonder and delight, face tilted up in 3-quarter view.',
      emotionalTone: 'curious',
      facePosition: { x: 40, y: 55 },
      difficulty: 'medium',
    },
    prompt: `You are an expert children's book illustrator specializing in magical bedtime stories.

Create a Pixar-Disney style magical bedtime illustration.

CHILD REFERENCE: {CHARACTER_DESCRIPTION}

SCENE: The child is sitting up in their cozy bed, face tilted upward in 3-quarter view, looking with pure wonder at a beautiful magical star that glows above them. The star has grown and radiates warm golden light in gentle beams and soft sparkles — it has a gentle, almost living presence. The child's expression is magical: eyes bright with curiosity and delight, a small wondering smile forming on their lips.

COMPOSITION: Medium close-up. The child is positioned in the lower portion of the frame, face tilted up in a beautiful 3-quarter upward gaze. The magical star occupies the upper area of the frame, large and radiant, casting beautiful golden light downward onto the child's face and the immediate surroundings.

LIGHTING: The magical star's golden glow is the PRIMARY light source — warm golden light falls beautifully onto the child's upturned face, illuminating cheekbones, forehead, and the tip of the nose. The rest of the room fades into peaceful purple-blue darkness. The star creates a magical halo effect.

STYLE: HYBRID illustration — child's face rendered semi-realistically with beautiful golden light playing on their features (Pixar Coco quality), the magical star is illustrated with painterly golden radiance and swirling light particles.

COLOR PALETTE: Brilliant warm gold for the star's radiance, deep indigo and purple for the bedroom darkness, golden skin highlights, soft sparkle particles floating in the air, magical atmosphere.

DETAILS: The star radiates gentle golden beams, surrounded by smaller twinkling lights, casting soft star-shaped light patterns on the ceiling. The child's bedding catches golden highlights. Sense of magical dialogue between child and star.

EYE RENDERING (IMPORTANT):
- Eyes wide open with wonder, clear realistic iris, round pupils
- Eyes catching golden reflections from the magical star (beautiful catchlights)
- Both eyes symmetrical, looking upward with wonder and delight

FACE RENDERING: Semi-realistic Pixar style — golden starlight illuminates the child's face beautifully with warm highlights on cheekbones, forehead, and nose. Expression of pure wonder.

IMPORTANT: NO text, NO words, NO speech bubbles anywhere in the image.`,
    texts: {
      title_es: '',
      text_es: '"საღამო მშვიდობისა, {childName},"\nჩურჩულებს ვარსკვლავი.\n"მე შენი ძილის ვარსკვლავი ვარ."',
      title_en: '',
      text_en: '"საღამო მშვიდობისა, {childName},"\nჩურჩულებს ვარსკვლავი.\n"მე შენი ძილის ვარსკვლავი ვარ."',
    },
  },

  // PAGE 4 ─ Wide magical bedroom scene (same text, different composition)
  {
    pageNumber: 4,
    aspectRatio: 'ratio_3_4',
    metadata: {
      sceneDescription: 'Wider cinematic view of the magical bedroom. Child visible in bed looking up at the magical star which now dominates the room with glorious golden radiance. Star-light patterns dance on walls.',
      emotionalTone: 'surprised',
      facePosition: { x: 30, y: 60 },
      difficulty: 'easy',
    },
    prompt: `You are an expert children's book illustrator specializing in magical bedtime stories.

Create a Pixar-Disney style magical bedtime illustration.

CHILD REFERENCE: {CHARACTER_DESCRIPTION}

SCENE: A wider, more cinematic establishing shot of the magical bedroom. The child is visible in their cozy bed, smaller in the frame — shown from a slightly above angle — looking up at the magical star which now dominates the upper portion of the room with glorious golden radiance. The entire bedroom is bathed in magical starlight: beautiful star-shaped light patterns dance across the walls, ceiling, and floor. It is as if the bedroom has been transformed into a magical world.

COMPOSITION: Wide shot showing the full bedroom in beautiful detail. The child in bed occupies the lower third of the frame, creating a sense of scale. The magical star is large and prominent in the upper area. This is a cinematic, storybook-establishing moment — the viewer sees the full magical transformation of the bedroom.

LIGHTING: The magical star is the dominant light source, filling the room with brilliant golden radiance. Beautiful star-light patterns are projected on the walls like moving, magical projections. Pale moonlight filters through the curtains as a secondary cool-blue light source. Deep blue-purple magical shadows fill the corners.

STYLE: Rich painterly Disney-Pixar illustrated style for the full environment — think Tangled's magical lantern scene translated to a cozy bedroom. The child shown at distance in slightly more illustrated proportion, though face still readable.

COLOR PALETTE: Rich golden star radiance filling the room, deep indigo and violet shadows, silver-blue moonlight through curtains, warm cream and white of the bedding, golden reflections on wooden furniture.

DETAILS: Beautiful star-shaped light patterns projected on walls and ceiling, floating magical sparkle particles in the light beams, cozy bedroom furniture lit warmly, curtains gently illuminated by moonlight, stuffed animals on the bed.

EYE RENDERING: Even at this distance, the child's expression shows peaceful wonder.

FACE RENDERING: Semi-realistic at this wider distance — warm golden starlight on face, expression of awe and wonder.

IMPORTANT: NO text, NO words, NO speech bubbles anywhere in the image.`,
    texts: {
      title_es: '',
      text_es: '"საღამო მშვიდობისა, {childName},"\nჩურჩულებს ვარსკვლავი.\n"მე შენი ძილის ვარსკვლავი ვარ."',
      title_en: '',
      text_en: '"საღამო მშვიდობისა, {childName},"\nჩურჩულებს ვარსკვლავი.\n"მე შენი ძილის ვარსკვლავი ვარ."',
    },
  },

  // PAGE 5 ─ Child smiling, star shines brighter (main face moment)
  {
    pageNumber: 5,
    aspectRatio: 'ratio_3_4',
    metadata: {
      sceneDescription: 'Warm intimate close-up. Child in bed with a beautiful gentle smile, eyes soft and half-dreamy. The magical star glows more brilliantly than before, responding to the child\'s happiness.',
      emotionalTone: 'happy',
      facePosition: { x: 50, y: 45 },
      difficulty: 'hard',
    },
    prompt: `You are an expert children's book illustrator specializing in magical bedtime stories.

Create a Pixar-Disney style magical bedtime illustration.

CHILD REFERENCE: {CHARACTER_DESCRIPTION}

SCENE: A warm, intimate close-up portrait moment. The child is in their cozy bed, face relaxed and beautifully lit by the warm golden glow of the magical star. They have a beautiful, natural, gentle smile — the kind that comes from feeling completely safe and loved. Their eyes are soft and half-dreamy, showing that perfect magical state between joy and sleepiness. The magical star glows more brilliantly than ever before, responding to the child's happiness, pulsing warmly with pure golden light that fills the entire frame.

COMPOSITION: Close-up to medium shot, child's face centered, framed by soft white pillows. The magical star is large and radiant in the background/upper area. This is THE most intimate, emotional page of the book — about the deep connection between child and star.

LIGHTING: The brilliant star creates the most intense warm golden lighting of any page — the child's face is beautifully and warmly illuminated from above, golden light catching on cheekbones, the bridge of the nose, and the soft curls of hair. Like being inside pure warmth and happiness.

STYLE: HYBRID illustration — THIS IS THE MAIN FACE MOMENT. The child's face is rendered with maximum semi-realistic Pixar quality (Coco/Encanto level). Warm golden skin tones beautifully lit. The magical star behind them shown in painterly radiant style with soft lens-flare-like golden light.

COLOR PALETTE: Maximum warm golden glow — golden skin highlights, amber and honey tones, brilliant star radiance, soft cream and white of pillows, deep warm purple surrounding darkness that makes the golden light pop.

DETAILS: Child's expression shows pure contentment — relaxed brow, gentle beautiful smile, dreamy half-closed eyes. The star pulses with warm golden light. Soft pillow framing the head. A stuffed animal just visible peeking beside them.

EYE RENDERING (CRITICAL — this is the main face shot):
- Eyes semi-closed in dreamy happiness, realistic proportions, beautiful natural iris color
- Clean white sclera, natural eyelids with long lashes
- Warm golden reflections from the star as beautiful catchlights
- Expression: soft, dreamy, perfectly happy and safe

FACE RENDERING: Maximum Pixar semi-realistic rendering — beautiful golden light on natural skin, warm highlights on cheekbones, genuine gentle smile with natural lip color, expression of pure happiness and feeling loved.

IMPORTANT: NO text, NO words, NO speech bubbles anywhere in the image.`,
    texts: {
      title_es: '',
      text_es: '{childName} იღიმის.\nგული სითბოთი ევსება.\nვარსკვლავი უფრო კაშკაშებს.',
      title_en: '',
      text_en: '{childName} იღიმის.\nგული სითბოთი ევსება.\nვარსკვლავი უფრო კაშკაშებს.',
    },
  },

  // PAGE 6 ─ Child hugs stuffed animal ({KUSCHELTIER})
  {
    pageNumber: 6,
    aspectRatio: 'ratio_3_4',
    metadata: {
      sceneDescription: 'Child in bed hugging their beloved stuffed animal tightly in both arms. The magical star hovers protectively above like a guardian. Child\'s face turned toward the toy, showing tenderness.',
      emotionalTone: 'happy',
      facePosition: { x: 45, y: 50 },
      difficulty: 'medium',
    },
    prompt: `You are an expert children's book illustrator specializing in magical bedtime stories.

Create a Pixar-Disney style magical bedtime illustration.

CHILD REFERENCE: {CHARACTER_DESCRIPTION}

SCENE: The child in their cozy bed, hugging their beloved stuffed animal — {KUSCHELTIER} — tightly in both arms with pure tenderness. The stuffed animal is shown as a beloved, soft, well-loved companion with personality and charm. The magical star hovers protectively above like a guardian angel, its warm golden light shining down like a blessing on this precious moment. The child's face is turned slightly downward toward or nuzzling the stuffed animal, shown in a gentle 3-quarter angle — not looking directly at the viewer, but absorbed in the tender moment with their companion.

COMPOSITION: Medium shot showing the child from chest up in bed with the beloved stuffed animal in their arms. The magical star visible in upper area of frame, casting its protective golden glow. Warm and intimate composition.

LIGHTING: The magical star's protective golden glow shines down from above like a warm blessing; soft amber nightlight tones fill the cozy bedroom; golden highlights on the stuffed animal and child's arms and face; a feeling of perfect protection and warmth.

STYLE: HYBRID illustration — child's face semi-realistic Pixar style, the stuffed animal ({KUSCHELTIER}) rendered with magical illustrated softness and character, bedroom environment painterly and warm.

COLOR PALETTE: Warm golden starlight from above, soft neutrals and warm tones for the beloved stuffed animal, cozy cream and white bedding, amber interior glow, deep protective blue-purple for the surrounding night.

DETAILS: The stuffed animal ({KUSCHELTIER}) shown as a beloved companion with personality — soft fabric texture, worn with love from many cuddles, held close to the chest. Fluffy pillows. Star casting protective golden glow. Small magical sparkles in the air. The child's arms wrapped protectively around their companion.

EYE RENDERING (avoid artifacts):
- Eyes visible at gentle 3-quarter angle looking down at the toy
- Realistic proportions, natural iris color, expression of tender love and safety
- Beginning to feel sleepy, gentle drowsy tenderness

FACE RENDERING: Semi-realistic Pixar style — tender expression of love and feeling safe, golden light from above creating warm highlights on the child's hair and cheek.

IMPORTANT: NO text, NO words, NO speech bubbles anywhere in the image.`,
    texts: {
      title_es: '',
      text_es: '"მე დაგიცავ," ამბობს ვარსკვლავი.\n{childName} ეხუტება საყვარელ სათამაშოს — {kuscheltier}.',
      title_en: '',
      text_en: '"მე დაგიცავ," ამბობს ვარსკვლავი.\n{childName} ეხუტება საყვარელ სათამაშოს — {kuscheltier}.',
    },
  },

  // PAGE 7 ─ Eyes slowly closing, peaceful room
  {
    pageNumber: 7,
    aspectRatio: 'ratio_3_4',
    metadata: {
      sceneDescription: 'The child lying down in bed, eyes slowly closing. A peaceful profile view. The magical star has dimmed to a soft gentle glow. The room is perfectly still and peaceful.',
      emotionalTone: 'calm',
      facePosition: { x: 40, y: 50 },
      difficulty: 'medium',
    },
    prompt: `You are an expert children's book illustrator specializing in magical bedtime stories.

Create a Pixar-Disney style magical bedtime illustration.

CHILD REFERENCE: {CHARACTER_DESCRIPTION}

SCENE: A peaceful, serene moment of pure beauty. The child is lying down in their cozy bed, eyes slowly, gently closing — caught in that beautiful magical moment between wakefulness and sleep. Their expression is completely peaceful and relaxed, all worries gone. The magical star has softened its glow to something gentle and warm, like a nightlight — dimming lovingly as the child drifts toward sleep. The bedroom is perfectly still and peaceful, everything silent and safe.

COMPOSITION: Side profile or gentle 3-quarter profile view, the child lying down with their head on a soft pillow, eyes at half-mast or gently closing with long lashes visible. Wide enough to show the cozy bedroom surroundings. The star glows softly in the background. This profile composition is natural and serene, like watching a child drift off to sleep.

LIGHTING: The magical star now glows more softly — no longer brilliant but warm and gentle, like a loving nightlight. The room is bathed in the softest golden-blue twilight combination. Moonlight filters gently through the curtains. The scene has become quieter in its very lighting — more still, more peaceful.

STYLE: The most painterly, illustrative page — the bedroom backgrounds are richly detailed and beautiful with warm depth, while the child's face in gentle profile is rendered with semi-realistic quality. Think of the most peaceful sleeping scenes in beloved Disney films.

COLOR PALETTE: Soft gold and moonlit silver-blue, deep peaceful purples and navies, cream and white bedding, the star is a gentle amber glow rather than brilliant gold — quiet, peaceful, protective tones.

DETAILS: Eyes at half-mast or gently closing — beautiful long lashes visible in profile. Completely relaxed facial muscles. Soft pillow framing the face tenderly. Stuffed animal peeking out from the blanket. Cozy blanket tucked in snugly. Moonlight creating beautiful silver patterns through the curtains. The star glowing gently in the corner. Complete and perfect stillness.

EYE RENDERING: Profile view showing eye gently, beautifully closing — realistic eyelid with natural lashes, expression of complete peace.

FACE RENDERING: Semi-realistic Pixar profile — peaceful relaxed features, eyes dreamily closing, the beginning of deep beautiful sleep.

IMPORTANT: NO text, NO words, NO speech bubbles anywhere in the image.`,
    texts: {
      title_es: '',
      text_es: 'თვალები ნელ-ნელა ეხუჭება.\nოთახში მშვიდობა და სიჩუმეა.',
      title_en: '',
      text_en: 'თვალები ნელ-ნელა ეხუჭება.\nოთახში მშვიდობა და სიჩუმეა.',
    },
  },

  // PAGE 8 ─ Child peacefully sleeping (final page)
  {
    pageNumber: 8,
    aspectRatio: 'ratio_3_4',
    metadata: {
      sceneDescription: 'The final image. Child peacefully sleeping with eyes closed, stuffed animal beside them. The magical star now watches from outside the window among the night stars. Complete peace and beauty.',
      emotionalTone: 'calm',
      facePosition: { x: 45, y: 45 },
      difficulty: 'easy',
    },
    prompt: `You are an expert children's book illustrator specializing in magical bedtime stories.

Create a Pixar-Disney style magical bedtime illustration.

CHILD REFERENCE: {CHARACTER_DESCRIPTION}

SCENE: The final, most beautiful image of the story. {childName} is peacefully sleeping in their cozy bed, eyes closed in deep, peaceful, happy sleep. Their beloved stuffed animal — {kuscheltier} — is nestled close beside them, keeping watch. The magical star has moved to outside the window, now a brilliant, faithful point of golden light among all the other stars in the night sky — the child's very own star, keeping its promise, watching from outside as {childName} sleeps safely. The bedroom is filled with the most peaceful, beautiful magic.

COMPOSITION: A beautiful wide shot showing the peacefully sleeping child from the side or from a gentle overhead angle. The window is visible in the scene, showing the night sky where the star now watches from outside. This creates a sense of the expanded magical universe while the child sleeps safely in their warm cocoon. The composition should feel like the closing illustration of a beloved picture book.

LIGHTING: The most peaceful and beautiful lighting of the book. Soft silver-blue moonlight fills the room in gentle, tranquil tones. A single warm golden beam from the star outside the window falls gently and lovingly on the sleeping child like a magical blessing — the star keeping its promise. Complete peace and stillness in the lighting.

STYLE: The most beautifully illustrated page of the entire book — richly painterly environments with deep detail. The night sky through the window is gorgeous. The child's sleeping face rendered with gentle semi-realistic quality — peaceful and beautiful, the most perfect sleeping expression.

COLOR PALETTE: Deep peaceful navy and midnight blue for the glorious night sky outside, soft silver-blue moonlight filling the interior, a single warm golden beam from the faithful star, cream and white of the cozy bedding, deep peaceful shadows in the corners.

DETAILS: Child sleeping with eyes peacefully closed — the most beautiful expression of happiness and safety. Beloved stuffed animal ({kuscheltier}) cuddled close, keeping watch together with the star. Cozy blankets tucked in perfectly. The night sky through the window is filled with stars, one star — the magical one — glowing just a little brighter and warmer than all the others. Moonlight and starlight creating gentle magical patterns on the bedroom floor and ceiling.

EYE RENDERING: Eyes closed in the deepest, most peaceful sleep — natural closed eyelids with gentle long lashes, the most serene and happy facial expression in the whole book.

FACE RENDERING: Semi-realistic Pixar style — the most peaceful sleeping face with completely relaxed muscles, natural skin tones in moonlight and golden starlight, the expression of a child who feels completely safe, loved, and at peace.

IMPORTANT: NO text, NO words, NO speech bubbles anywhere in the image.`,
    texts: {
      title_es: '',
      text_es: 'სანამ {childName} დაიძინებს,\nვარსკვლავი ჩურჩულებს:\n"მე ყოველ ღამე მოვალ.\nმხოლოდ შენთვის."\nდა {childName} მშვიდად იძინებს.',
      title_en: '',
      text_en: 'სანამ {childName} დაიძინებს,\nვარსკვლავი ჩურჩულებს:\n"მე ყოველ ღამე მოვალ.\nმხოლოდ შენთვის."\nდა {childName} მშვიდად იძინებს.',
    },
  },
]

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌟 Creating Georgian Sleep Star story in Strapi...\n')

  // 1. Check if story already exists
  console.log('Checking if story already exists...')
  try {
    const existing = await strapiRequest(
      `/api/stories?filters[slug][$eq]=${STORY.slug}`
    )
    if (existing.data && existing.data.length > 0) {
      console.log(`⚠️  Story "${STORY.slug}" already exists (documentId: ${existing.data[0].documentId})`)
      console.log('Delete it first in Strapi admin if you want to recreate it.')
      process.exit(0)
    }
  } catch (e) {
    console.log('Could not check existing stories, proceeding...')
  }

  // 2. Create the story
  console.log('Creating story...')
  const storyRes = await strapiRequest('/api/stories', {
    method: 'POST',
    body: JSON.stringify({ data: STORY }),
  })

  const storyDocumentId = storyRes.data.documentId
  const storyId = storyRes.data.id
  console.log(`✅ Story created: documentId=${storyDocumentId}, id=${storyId}`)

  // 3. Create each page
  console.log('\nCreating story pages...')
  for (const page of PAGES) {
    process.stdout.write(`  Creating page ${page.pageNumber}...`)
    try {
      await strapiRequest('/api/story-pages', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            ...page,
            story: storyDocumentId,
          },
        }),
      })
      console.log(' ✅')
    } catch (e) {
      console.log(` ❌ Error: ${e.message}`)
      throw e
    }
  }

  console.log(`\n🎉 Done! Story "${STORY.slug}" created with ${PAGES.length} pages.`)
  console.log(`\nSlug to use: georgian-sleep-star`)
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
