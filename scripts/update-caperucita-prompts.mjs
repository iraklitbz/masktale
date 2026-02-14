/**
 * Update all 8 Caperucita Roja page prompts in Strapi
 * New style: Disney-Pixar illustrated (same style as the test page that worked)
 */

const STRAPI_URL = 'https://cms.iraklitbz.dev'
const TOKEN = '627f6d9c3a97080d12060a7ed2dfbb1ec04e4e7068a178c785bee25d1d02b34f8af24e224344b3bbd4e89e9a958a7322be7c03ee873d0661e1b84c6bb9a2fb1cbca58fc06d2c3c24f6aaeea3876139561a019c516860bccacd9f05ff1702b43693728a2ffe71bc50b04ebb64c6a493025d1906d9171b73b8a78541322aa4f533'

const pages = [
  {
    documentId: 'wu13b62q1dbpb30582njtlyi',
    pageNumber: 1,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: A young child stands at the front door of a cozy cottage kitchen, happily receiving a wicker basket with a red checkered cloth from her loving mother. The child wears a bright red hooded cape over a white cream dress and looks excited to begin her adventure. The mother is seen partially, warmly handing over the basket.

ENVIRONMENT: Charming rustic cottage interior with wooden furniture, flowers on the windowsill, copper pots, hanging herbs, and a stone fireplace. The front door is open showing a beautiful green garden path with trees beyond. Morning sunlight (around 9 AM) floods through the door and windows with warm golden light.

STYLE: Semi-realistic Pixar Disney digital painting, Tangled and Brave aesthetic, warm cinematic lighting, vibrant saturated colors, painterly backgrounds, magical storybook atmosphere.

CHILD: The child from the reference photo. Wearing a bright red hooded cape (hood down around shoulders) over a white/cream dress. Hair visible and flowing naturally. Holding the wicker basket. Expression of happy excitement and eagerness, thrilled to be given a grown-up responsibility.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- Warm, cozy, safe cottage atmosphere with morning golden light
- The RED CAPE is the most vibrant color element in the scene`
  },
  {
    documentId: 'qelfrj2g7vvumm1579cf5ahr',
    pageNumber: 2,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: A child in a bright red cape walks happily along a winding forest path, seen from a side/three-quarter view. She carries a wicker basket in one hand, her cape flowing slightly with her stride. The forest is enchanted and alive — tall trees form a natural archway overhead, with spectacular dappled sunlight creating golden patches on the path and the child.

ENVIRONMENT: Enchanted fairy tale forest in late spring. Dirt and mossy path with wildflowers along the edges (daisies, violets, buttercups). Tall ancient trees with lush green canopy. Birds on branches, butterflies fluttering, small rabbits peeking from bushes. Magical god rays where sunlight breaks through the leaves. Deep forest visible in the background with light at the far end.

STYLE: Semi-realistic Pixar Disney digital painting, Tangled forest aesthetic, warm cinematic dappled lighting, vibrant saturated greens, painterly backgrounds, magical fairy tale atmosphere.

CHILD: The child from the reference photo, seen from the SIDE while walking. Same bright red hooded cape (hood down, flowing behind), same white/cream dress, same hairstyle as page 1. Carrying the wicker basket. Expression of joy, adventure, and carefree happiness. Natural walking stride.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- The RED CAPE should pop dramatically against the lush green forest (complementary colors)
- Magical, safe, beautiful fairy tale forest — NOT dark or scary`
  },
  {
    documentId: 'bryhb8vzjz6wpriwwmp7oc5a',
    pageNumber: 3,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: In a sunlit forest clearing, a child in a red cape meets a large wolf for the first time. The child stands on the left side, turned toward the wolf with innocent curiosity (three-quarter/side view). The wolf leans casually against a large old oak tree on the right side, trying to look friendly with a sly, cunning smile. They face each other in conversation.

ENVIRONMENT: Bright forest clearing, more open than the path. A massive old oak tree where the wolf appears from behind. Colorful wildflowers and tall grass in the clearing. Warm sunlight from above. Forest continues in the background. The scene feels like a pleasant surprise encounter.

STYLE: Semi-realistic Pixar Disney digital painting, classic Disney villain charm aesthetic, warm cinematic lighting, vibrant saturated colors, painterly backgrounds, fairy tale atmosphere.

CHILD: The child from the reference photo, seen from a SIDE/THREE-QUARTER view looking at the wolf with curiosity. Same red cape, same dress, same hairstyle. Holding basket. Body turned toward wolf. Posture: open, friendly, innocent — no signs of fear. Slight curious tilt of head.

WOLF: Large but NOT terrifying. Think Disney-style villain — charming and sly. Grey-brown fluffy fur, amber/yellow intelligent eyes, slightly mischievous grin. Illustrated fairy tale wolf (stylized, NOT photorealistic predator). Leaning casually against the tree trying to look trustworthy.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- Scene should feel curious and intriguing, NOT scary
- The wolf should look more charming/sly than threatening — Disney villain energy`
  },
  {
    documentId: 'wn5yi7cgswcrfwxyt741ev82',
    pageNumber: 4,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: A child kneels joyfully in a spectacular wildflower meadow, hands full of colorful flowers, face beaming with pure delight. She's completely absorbed in the beauty around her. This is the HAPPIEST, most colorful page of the story. Far in the background, barely visible between the trees, the wolf's silhouette can be seen running toward the right — a subtle hint of danger the viewer notices on second look.

ENVIRONMENT: Open meadow next to the forest edge, bathed in full bright golden sunlight. An EXPLOSION of colorful wildflowers everywhere: daisies, red poppies, blue cornflowers, yellow buttercups, purple lavender. Butterflies and bees dancing among the flowers. Green grass base. Forest edge visible in the background. The most vibrant, colorful setting in the book.

STYLE: Semi-realistic Pixar Disney digital painting, Tangled lantern scene level of beauty, warm bright cinematic lighting, maximum vibrant saturated colors, painterly flower fields, magical joyful atmosphere.

CHILD: The child from the reference photo, facing FRONT, kneeling among the flowers. Same red cape (spread around on the ground), same dress, same hairstyle. Basket set down beside her. Hands full of colorful wildflowers. Expression of complete, genuine joy and delight — the happiest moment.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- This should be the MOST COLORFUL page — flowers everywhere in every color
- The red cape nestled among colorful flowers creates a stunning painterly composition
- Wolf silhouette in background should be VERY subtle — an Easter egg detail`
  },
  {
    documentId: 'jdm17eqlfr6pt7bcjgqb1w7e',
    pageNumber: 5,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: A child in a red cape stands at the front door of a charming woodland cottage in beautiful golden afternoon light. She holds the basket in one hand and a bouquet of wildflowers in the other. The cottage door is slightly ajar — mysterious but not sinister. Her expression shows gentle curiosity, as if something feels a little different but she's not scared.

ENVIRONMENT: Small charming woodland cottage with a thatched roof, surrounded by an overgrown garden with herbs and flowers. Late afternoon golden hour light creating long warm shadows. Warm light glows from inside the cottage through the cracked door. The forest surrounds the cottage. Beautiful, peaceful setting with just a hint of mystery.

STYLE: Semi-realistic Pixar Disney digital painting, Brave cottage aesthetic, golden hour cinematic lighting, warm saturated tones slightly more muted than the meadow, painterly backgrounds, fairy tale atmosphere shifting from bright to subtly mysterious.

CHILD: The child from the reference photo, facing FRONT, standing at the cottage door. Same red cape catching the golden afternoon light beautifully, same dress, same hairstyle. Holding basket and wildflower bouquet. Expression: curious, slightly puzzled — something feels a bit off but not scared. Gentle uncertain smile.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- Beautiful golden hour lighting — warm and atmospheric
- Mood shifts from bright and happy to subtly mysterious (NOT scary)
- The slightly open door with warm interior glow creates gentle intrigue`
  },
  {
    documentId: 'opb1tepbcl4r81jpz0zxd6jt',
    pageNumber: 6,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: The ICONIC bedroom scene. A child in a red cape stands beside grandmother's bed (SIDE/THREE-QUARTER view), looking at the wolf who is tucked under the covers wearing grandmother's nightcap and nightgown. The child shows surprised curiosity — wide eyes, slightly open mouth — starting to realize something is wrong. The wolf has comically exaggerated big eyes visible above the covers, nightcap askew. The scene is tense but age-appropriate — fairy tale suspense, NOT scary.

ENVIRONMENT: Cozy but dimly lit grandmother's bedroom. Old-fashioned bed with quilted covers and pillows. Bedside table with a warm lamp/candle providing orange glow. Curtained window letting in some cool blue light. Homey details: framed pictures, knitted blankets, shelf with books. Warm intimate atmosphere.

STYLE: Semi-realistic Pixar Disney digital painting, Rembrandt-inspired warm interior lighting, cinematic warm/cool contrast, painterly backgrounds, fairy tale suspense atmosphere that's still child-friendly.

CHILD: The child from the reference photo, seen from SIDE/THREE-QUARTER view standing beside the bed. Same red cape (catches the warm lamp light), same dress, same hairstyle. Still holding wildflower bouquet. Expression of surprised curiosity — "hmm, that's weird" rather than terror. Slight lean backward in instinctive caution.

WOLF IN BED: Wearing grandmother's nightcap and nightgown. Tucked under covers up to chin. Exaggerated comically large eyes above the covers. Nightcap askew. FUNNY and SILLY rather than scary — Disney comedic villain in disguise. Illustrated fairy tale wolf style.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- The wolf should look more COMICAL than threatening — silly disguise
- Tense but NEVER scary — fairy tale suspense suitable for young children
- Beautiful warm/cool lighting contrast (lamp vs window)`
  },
  {
    documentId: 's6q2m9wj47xy6ioo6rpv72hn',
    pageNumber: 7,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: The DRAMATIC RESCUE! A strong, kind woodcutter bursts through the cottage door heroically, bright outdoor light flooding in behind him creating a hero-entrance silhouette. The wolf is fleeing comically through the window — nightcap flying off, covers tangled, slapstick exit. Grandmother is emerging safely from the wardrobe, relieved and happy. The child (FRONT view) shows amazement and relief, eyes wide with wonder.

ENVIRONMENT: Grandmother's cottage interior with dramatic lighting — bright exterior light flooding through the burst-open door, contrasting with warm interior lamp light. Furniture slightly askew from the action. The window where the wolf escapes. Dynamic, cinematic composition with the most dramatic lighting of the entire book.

STYLE: Semi-realistic Pixar Disney digital painting, heroic action scene aesthetic like How to Train Your Dragon or Brave rescue moments, dramatic cinematic backlighting, vibrant saturated colors, dynamic action composition, triumphant atmosphere.

CHILD: The child from the reference photo, facing FRONT, behind/near the woodcutter. Same red cape, same dress, same hairstyle. Expression of amazement, relief, and excitement — wide eyes of surprise turning to joy. The "wow!" rescue moment.

WOODCUTTER: Strong, kind-looking man in flannel shirt, suspenders, and boots. Standing heroically in the doorframe, backlit. Axe at his side (not threatening). Warm, trustworthy Disney hero type. Illustrated style.

WOLF: Comical escape through the window — slapstick, funny, not violent. Nightcap flying off.

GRANDMOTHER: Emerging from wardrobe, elderly, kind, relieved. Near the child.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- This is the most DYNAMIC, ACTION-PACKED page — dramatic backlighting
- Exciting and triumphant, NOT violent or scary
- Wolf's exit should be COMICAL (slapstick comedy, not threatening)`
  },
  {
    documentId: 'pt219wgwh64bywpz21qlmlfj',
    pageNumber: 8,
    prompt: `You are an expert children's book illustrator. Create a beautiful, magical Disney-Pixar style illustration for a classic fairy tale: Little Red Riding Hood.

SCENE: The EMOTIONAL FINALE — "happily ever after." The child sits in the center of a beautiful sunset garden picnic, surrounded by grandmother and the woodcutter. Everyone is happy, safe, and together. A picnic blanket is spread on the grass with food from the basket — bread, fruit, cookies, jam. The wildflowers from earlier are arranged in a small jar. The child's face glows with complete happiness and contentment, bathed in the most beautiful golden sunset light of the entire book.

ENVIRONMENT: Grandmother's cottage garden in golden hour. Spectacular sunset sky with warm orange, pink, and purple gradients. The cottage in the background with warm light in its windows. Flowers blooming everywhere. Long warm shadows. Everything bathed in stunning golden light. The most BEAUTIFUL, warmest setting of the entire story.

STYLE: Semi-realistic Pixar Disney digital painting, Tangled lantern scene warmth, Coco family reunion emotion, the most beautiful golden hour cinematic lighting, maximum warm saturated colors, painterly sunset backgrounds, magical peaceful atmosphere of love and togetherness.

CHILD: The child from the reference photo, facing FRONT, sitting on the picnic blanket in the center. Same red cape (draped casually over shoulders, hood fully down), same dress, same hairstyle. Expression of complete genuine happiness, love, and contentment — the warmest smile. Eyes sparkling with joy. Surrounded by people who love them.

GRANDMOTHER: Sitting comfortably, smiling warmly, arm around child. Elderly, kind.
WOODCUTTER: Sitting casually, laughing, eating bread. Relaxed hero.

IMPORTANT:
- The child's face should clearly resemble the reference photo
- Style should be illustrated/painted, NOT photorealistic
- NO text, NO speech bubbles, NO words anywhere
- This should be the MOST BEAUTIFUL image — stunning golden sunset light
- Everything glows with warmth, love, and "happily ever after" feeling
- The red cape in golden light, the sunset, the smiling faces — pure magic
- The viewer should feel: "Everything is okay. Everyone is safe and happy."`
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
    body: JSON.stringify({
      data: {
        prompt: page.prompt,
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Page ${page.pageNumber}: ${response.status} - ${text}`)
  }

  const result = await response.json()
  console.log(`Page ${page.pageNumber} updated (${page.documentId})`)
  return result
}

async function main() {
  console.log('Updating Caperucita Roja prompts to Disney-Pixar illustrated style...\n')

  for (const page of pages) {
    try {
      await updatePage(page)
    } catch (error) {
      console.error(`FAILED page ${page.pageNumber}:`, error.message)
    }
  }

  console.log('\nDone! All 8 pages updated.')
}

main()
