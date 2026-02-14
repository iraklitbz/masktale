/**
 * Update all 8 Caperucita Roja pages to HYBRID style:
 * - Child's face: semi-realistic (Pixar Coco/Encanto level)
 * - Environment: painterly illustrated Disney-Pixar
 * - Face compatible with face-swap post-processing
 */

const STRAPI_URL = 'https://cms.iraklitbz.dev'
const TOKEN = '627f6d9c3a97080d12060a7ed2dfbb1ec04e4e7068a178c785bee25d1d02b34f8af24e224344b3bbd4e89e9a958a7322be7c03ee873d0661e1b84c6bb9a2fb1cbca58fc06d2c3c24f6aaeea3876139561a019c516860bccacd9f05ff1702b43693728a2ffe71bc50b04ebb64c6a493025d1906d9171b73b8a78541322aa4f533'

const FACE_SECTION = `FACE RENDERING (CRITICAL):
- Render the child's face with realistic skin texture, real eye detail, natural lip color
- The face should look like a high-quality Pixar render, NOT flat cartoon
- Smooth transition from realistic face to illustrated body/clothing
- This makes the face compatible with post-processing`

const STYLE_HYBRID = `STYLE: HYBRID — the child's face should be rendered with HIGH REALISM (smooth skin texture, realistic eye detail, natural lighting on face) while the body, clothing, and environment use a painterly Disney-Pixar illustrated style.`

const pages = [
  {
    documentId: 'wu13b62q1dbpb30582njtlyi',
    pageNumber: 1,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT is painterly and illustrated.

SCENE: A young child is the MAIN CHARACTER and CENTER of the image. The child stands at the front door of a cozy cottage kitchen, happily holding a wicker basket with a red checkered cloth. The child wears a bright red hooded cape over a white cream dress and looks excited to begin her adventure. The mother is barely visible — only her hand or arm at the edge of the frame handing the basket.

ENVIRONMENT: Charming rustic cottage interior — painterly illustrated style. Wooden furniture, flowers on windowsill, copper pots, hanging herbs, stone fireplace. Open front door showing green garden path. Morning golden light flooding through door and windows.

${STYLE_HYBRID}

CHILD: The child from the reference photo. The FACE must be rendered with near-photographic quality — real skin texture, accurate eye color and shape, natural hair texture. Wearing a bright red hooded cape (hood down around shoulders) over white/cream dress. Holding wicker basket. Expression of happy excitement and eagerness.

${FACE_SECTION}

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Face = semi-realistic, Environment = illustrated
- The RED CAPE is the most vibrant color element
- The child takes up most of the composition`,
  },
  {
    documentId: 'qelfrj2g7vvumm1579cf5ahr',
    pageNumber: 2,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT is painterly and illustrated.

SCENE: A child in a bright red cape walks happily along a winding forest path, seen from a SIDE/THREE-QUARTER view. She carries a wicker basket in one hand, cape flowing slightly with her stride. Spectacular dappled sunlight creates golden patches on the path and child.

ENVIRONMENT: Enchanted fairy tale forest — painterly illustrated style. Dirt and mossy path with wildflowers. Tall ancient trees forming a natural archway with lush green canopy. Birds on branches, butterflies fluttering, small rabbits peeking from bushes. Magical god rays through leaves. Late spring, everything green and alive.

${STYLE_HYBRID}

CHILD: The child from the reference photo, seen from the SIDE while walking. The FACE must be rendered with near-photographic quality even in profile — real skin texture, accurate profile features, natural hair. Same bright red hooded cape (hood down, flowing behind), same white/cream dress. Carrying wicker basket. Expression of joy and carefree adventure.

${FACE_SECTION}

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Face = semi-realistic (profile view), Environment = illustrated
- The RED CAPE pops dramatically against lush green forest
- Magical, safe, beautiful fairy tale forest — NOT dark or scary`,
  },
  {
    documentId: 'bryhb8vzjz6wpriwwmp7oc5a',
    pageNumber: 3,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT and WOLF are painterly and illustrated.

SCENE: In a sunlit forest clearing, a child in a red cape meets a large wolf for the first time. The child stands on the left side, turned toward the wolf with innocent curiosity (three-quarter/side view). The wolf leans casually against a large old oak tree on the right, trying to look friendly with a sly cunning smile. They face each other in conversation.

ENVIRONMENT: Bright forest clearing — painterly illustrated style. Large old oak tree, colorful wildflowers and tall grass. Warm sunlight from above. Forest continues in background. Pleasant surprise encounter feeling.

${STYLE_HYBRID}

CHILD: The child from the reference photo, seen from SIDE/THREE-QUARTER view looking at the wolf with curiosity. The FACE must be rendered with near-photographic quality — real skin, accurate features. Same red cape, same dress. Holding basket. Body turned toward wolf. Posture: open, friendly, innocent — no fear. Curious head tilt.

WOLF: Large but NOT terrifying. Disney-style villain — charming and sly. Grey-brown fluffy fur, amber eyes, mischievous grin. Illustrated fairy tale style (NOT photorealistic). Leaning casually against tree trying to look trustworthy.

${FACE_SECTION}

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Child's face = semi-realistic, Wolf + environment = illustrated
- Scene should feel curious and intriguing, NOT scary
- Wolf looks charming/sly, not threatening — Disney villain energy`,
  },
  {
    documentId: 'wn5yi7cgswcrfwxyt741ev82',
    pageNumber: 4,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT is painterly and illustrated.

SCENE: A child kneels joyfully in a spectacular wildflower meadow, hands full of colorful flowers, face beaming with pure delight. This is the HAPPIEST, most colorful page. Far in the background, barely visible between trees, the wolf's silhouette runs toward the right — a subtle Easter egg.

ENVIRONMENT: Open meadow — painterly illustrated, maximum color. EXPLOSION of wildflowers: daisies, red poppies, blue cornflowers, yellow buttercups, purple lavender. Butterflies and bees. Full bright golden sunlight. Forest edge visible in background. The most vibrant setting in the book.

${STYLE_HYBRID}

CHILD: The child from the reference photo, facing FRONT, kneeling among flowers. The FACE must be rendered with near-photographic quality — real skin, sparkling eyes, genuine smile. Same red cape (spread on ground), same dress. Basket beside her. Hands full of colorful wildflowers. Expression of complete joy and delight.

${FACE_SECTION}

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Face = semi-realistic (frontal), Meadow = illustrated explosion of color
- MOST COLORFUL page — flowers everywhere in every color
- Wolf silhouette in background should be VERY subtle`,
  },
  {
    documentId: 'jdm17eqlfr6pt7bcjgqb1w7e',
    pageNumber: 5,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT is painterly and illustrated.

SCENE: A child in a red cape stands at the front door of a charming woodland cottage in beautiful golden afternoon light. She holds basket in one hand and wildflower bouquet in the other. The door is slightly ajar — mysterious but not sinister. Expression shows gentle curiosity, something feels a little different.

ENVIRONMENT: Small charming woodland cottage — painterly illustrated. Thatched roof, overgrown garden with herbs and flowers. Late afternoon golden hour, long warm shadows. Warm glow from inside through cracked door. Forest surrounds cottage. Beautiful but with subtle hint of mystery.

${STYLE_HYBRID}

CHILD: The child from the reference photo, facing FRONT, standing at cottage door. The FACE must be rendered with near-photographic quality — real skin in golden afternoon light, accurate features. Same red cape catching golden light beautifully, same dress. Holding basket and wildflower bouquet. Expression: curious, slightly puzzled — gentle uncertain smile.

${FACE_SECTION}

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Face = semi-realistic, Cottage + garden = illustrated
- Beautiful golden hour lighting — warm and atmospheric
- Mood shifts subtly mysterious (NOT scary) — slightly open door with warm interior glow`,
  },
  {
    documentId: 'opb1tepbcl4r81jpz0zxd6jt',
    pageNumber: 6,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT and WOLF are painterly and illustrated.

SCENE: The ICONIC bedroom scene. A child in red cape stands beside grandmother's bed (SIDE/THREE-QUARTER view), looking at the wolf tucked under covers wearing grandmother's nightcap and nightgown. Child shows surprised curiosity — wide eyes, slightly open mouth. Wolf has comically exaggerated big eyes above covers, nightcap askew. Tense but age-appropriate — fairy tale suspense, NOT scary.

ENVIRONMENT: Cozy dim grandmother's bedroom — painterly illustrated. Old-fashioned bed with quilted covers. Bedside lamp/candle providing warm orange glow. Curtained window with cool blue light. Homey details: framed pictures, knitted blankets, books. Warm intimate atmosphere.

${STYLE_HYBRID}

CHILD: The child from the reference photo, seen from SIDE/THREE-QUARTER view standing beside bed. The FACE must be rendered with near-photographic quality — real skin in warm lamp light, accurate profile. Same red cape (catches lamp light), same dress. Holding wildflower bouquet. Expression of surprised curiosity — "hmm, that's weird" not terror.

WOLF IN BED: Grandmother's nightcap and nightgown. Tucked under covers to chin. Comically large eyes above covers. Nightcap askew. FUNNY and SILLY — Disney comedic villain. Illustrated fairy tale style.

${FACE_SECTION}

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Child's face = semi-realistic, Wolf + bedroom = illustrated
- Wolf = COMICAL, not threatening — silly disguise
- Beautiful warm/cool lighting contrast (lamp vs window)
- Tense but NEVER scary — suitable for young children`,
  },
  {
    documentId: 's6q2m9wj47xy6ioo6rpv72hn',
    pageNumber: 7,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT and OTHER CHARACTERS are painterly and illustrated.

SCENE: The DRAMATIC RESCUE! A strong, kind woodcutter bursts through cottage door heroically, bright outdoor light flooding in behind him creating hero-entrance silhouette. Wolf flees comically through window — nightcap flying off, covers tangled, slapstick exit. Grandmother emerges safely from wardrobe. Child (FRONT view) shows amazement and relief.

ENVIRONMENT: Grandmother's cottage interior — painterly illustrated with dramatic lighting. Bright exterior light flooding through burst-open door contrasting warm interior lamp light. Furniture slightly askew. Most dynamic lighting of the book.

${STYLE_HYBRID}

CHILD: The child from the reference photo, facing FRONT, near the woodcutter. The FACE must be rendered with near-photographic quality — real skin, wide amazed eyes, relief expression. Same red cape, same dress. Expression of amazement and relief — the "wow!" rescue moment.

WOODCUTTER: Strong, kind man in flannel shirt, suspenders, boots. Heroically in doorframe, backlit. Axe at side. Warm Disney hero type. Illustrated style.
WOLF: Comical slapstick escape through window. Nightcap flying off. Funny, not violent.
GRANDMOTHER: Emerging from wardrobe, elderly, kind, relieved. Illustrated style.

${FACE_SECTION}

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Child's face = semi-realistic, Everything else = illustrated
- Most DYNAMIC, ACTION-PACKED page — dramatic backlighting
- Exciting and triumphant, NOT violent or scary
- Wolf exit = COMICAL slapstick comedy`,
  },
  {
    documentId: 'pt219wgwh64bywpz21qlmlfj',
    pageNumber: 8,
    prompt: `You are an expert children's book illustrator. Create an illustration for Little Red Riding Hood where the CHILD'S FACE is semi-realistic (like Pixar's most realistic rendering in Coco/Encanto) while the ENVIRONMENT is painterly and illustrated.

SCENE: The EMOTIONAL FINALE — "happily ever after." Child sits center of a beautiful sunset garden picnic, surrounded by grandmother and woodcutter. Everyone happy, safe, together. Picnic blanket with food from basket — bread, fruit, cookies. Wildflowers in a small jar. Child's face glows with complete happiness in the most beautiful golden sunset light of the entire book.

ENVIRONMENT: Grandmother's cottage garden in golden hour — painterly illustrated. Spectacular sunset sky with orange, pink, purple gradients. Cottage in background with warm lit windows. Flowers blooming. Long warm shadows. Everything bathed in stunning golden light. The MOST BEAUTIFUL setting of the story.

${STYLE_HYBRID}

CHILD: The child from the reference photo, facing FRONT, sitting on picnic blanket in center. The FACE must be rendered with near-photographic quality — real skin glowing in golden sunset light, sparkling eyes, warmest smile. Same red cape (draped casually, hood down), same dress. Expression of complete genuine happiness, love, contentment.

GRANDMOTHER: Sitting comfortably, smiling warmly, arm around child. Illustrated style.
WOODCUTTER: Sitting casually, laughing, eating bread. Illustrated style.

${FACE_SECTION}

IMPORTANT:
- NO text, NO speech bubbles, NO words anywhere
- Child's face = semi-realistic in STUNNING golden light, Environment = illustrated
- MOST BEAUTIFUL image — golden sunset, warm love, "happily ever after"
- Everything glows with warmth, love, and peace
- The viewer should feel: "Everything is okay. Everyone is safe and happy."`,
  },
]

async function updatePage(page) {
  const url = `${STRAPI_URL}/api/story-pages/${page.documentId}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ data: { prompt: page.prompt } }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Page ${page.pageNumber}: ${response.status} - ${text.substring(0, 200)}`)
  }
  console.log(`Page ${page.pageNumber} updated`)
}

async function main() {
  console.log('Updating Caperucita to HYBRID style (realistic face + illustrated environment)...\n')

  for (const page of pages) {
    try {
      await updatePage(page)
    } catch (error) {
      console.error(`FAILED:`, error.message)
    }
  }

  console.log('\nDone! All 8 pages updated to hybrid style.')
}

main()
