/**
 * Speech Bubble Processor
 * Adds comic-style speech bubbles to generated images using Sharp
 */

import sharp from 'sharp'

export interface SpeechBubbleConfig {
  type: 'speech' | 'thought' | 'sfx'
  text: string
  position: { x: number; y: number } // 0-1 percentage of image
  tailDirection?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none'
  size?: 'small' | 'medium' | 'large'
}

export interface ComicSettings {
  bubbleStyle?: 'classic' | 'modern'
  fontFamily?: string
  fontSize?: number
  bubbleColor?: string
  bubbleBorderColor?: string
  bubbleBorderWidth?: number
  textColor?: string
}

const DEFAULT_SETTINGS: Required<ComicSettings> = {
  bubbleStyle: 'classic',
  fontFamily: 'Arial, sans-serif',
  fontSize: 46,  // For A4 @ 300dpi
  bubbleColor: '#FFFFFF',
  bubbleBorderColor: '#000000',
  bubbleBorderWidth: 4,
  textColor: '#000000',
}

/**
 * Generate SVG for a speech bubble
 */
function generateSpeechBubbleSVG(
  bubble: SpeechBubbleConfig,
  imageWidth: number,
  imageHeight: number,
  settings: Required<ComicSettings>
): string {
  const sizeMultiplier = bubble.size === 'small' ? 0.7 : bubble.size === 'large' ? 1.3 : 1

  // Thought bubbles need more padding because ellipse has less usable space
  const isThought = bubble.type === 'thought'
  const paddingMultiplier = isThought ? 1.8 : 1
  const basePadding = 26 * sizeMultiplier * paddingMultiplier

  const fontSize = settings.fontSize * sizeMultiplier
  const lineHeight = fontSize * 1.2

  // Calculate text dimensions (approximate)
  // Thought bubbles use fewer chars per line to keep text more centered
  const words = bubble.text.split(' ')
  const maxCharsPerLine = isThought
    ? (bubble.size === 'small' ? 10 : bubble.size === 'large' ? 16 : 12)
    : (bubble.size === 'small' ? 12 : bubble.size === 'large' ? 20 : 15)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim()
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)

  // Calculate bubble dimensions
  const textWidth = Math.max(...lines.map(line => line.length * fontSize * 0.55))
  const textHeight = lines.length * lineHeight

  // Thought bubbles are wider/taller to accommodate the ellipse shape
  const widthMultiplier = isThought ? 1.4 : 1
  const heightMultiplier = isThought ? 1.3 : 1
  const bubbleWidth = (textWidth + basePadding * 2) * widthMultiplier
  const bubbleHeight = (textHeight + basePadding * 2) * heightMultiplier

  // Position (convert percentage to pixels)
  const x = bubble.position.x * imageWidth
  const y = bubble.position.y * imageHeight

  // Generate bubble path based on type
  let bubblePath: string
  let tailPath = ''

  // Text offset for centering (thought bubbles need vertical centering adjustment)
  let textOffsetY = 0

  if (bubble.type === 'thought') {
    // Cloud-like thought bubble - use simple ellipse
    bubblePath = `M ${bubbleWidth * 0.08},${bubbleHeight / 2}
                  Q ${bubbleWidth * 0.08},${bubbleHeight * 0.08} ${bubbleWidth / 2},${bubbleHeight * 0.08}
                  Q ${bubbleWidth * 0.92},${bubbleHeight * 0.08} ${bubbleWidth * 0.92},${bubbleHeight / 2}
                  Q ${bubbleWidth * 0.92},${bubbleHeight * 0.92} ${bubbleWidth / 2},${bubbleHeight * 0.92}
                  Q ${bubbleWidth * 0.08},${bubbleHeight * 0.92} ${bubbleWidth * 0.08},${bubbleHeight / 2} Z`
    // Center text vertically in the ellipse
    textOffsetY = (bubbleHeight - textHeight) / 2 - basePadding
    // Thought bubbles use circles for tail, handled separately
    tailPath = ''
  } else if (bubble.type === 'sfx') {
    // Spiky SFX bubble or no bubble for sound effects
    return generateSFXSvg(bubble.text, x, y, fontSize * 1.5, settings, imageWidth, imageHeight)
  } else {
    // Classic speech bubble (rounded rectangle)
    const rx = 20 * sizeMultiplier
    bubblePath = `M ${rx},0
                  L ${bubbleWidth - rx},0
                  Q ${bubbleWidth},0 ${bubbleWidth},${rx}
                  L ${bubbleWidth},${bubbleHeight - rx}
                  Q ${bubbleWidth},${bubbleHeight} ${bubbleWidth - rx},${bubbleHeight}
                  L ${rx},${bubbleHeight}
                  Q 0,${bubbleHeight} 0,${bubbleHeight - rx}
                  L 0,${rx}
                  Q 0,0 ${rx},0 Z`

    if (bubble.tailDirection && bubble.tailDirection !== 'none') {
      tailPath = generateSpeechTailPath(bubbleWidth, bubbleHeight, bubble.tailDirection, sizeMultiplier)
    }
  }

  // Generate text elements
  const textElements = lines.map((line, i) => {
    const textY = basePadding + fontSize + i * lineHeight + textOffsetY
    const textX = bubbleWidth / 2
    return `<text x="${textX}" y="${textY}"
            font-family="${settings.fontFamily}"
            font-size="${fontSize}px"
            font-weight="bold"
            fill="${settings.textColor}"
            text-anchor="middle">${escapeXml(line)}</text>`
  }).join('\n')

  // Generate thought bubble tail circles
  let thoughtTailCircles = ''
  if (bubble.type === 'thought' && bubble.tailDirection && bubble.tailDirection !== 'none') {
    const tailX = bubble.tailDirection.includes('left') ? bubbleWidth * 0.3 : bubbleWidth * 0.7
    const tailY = bubble.tailDirection.includes('top') ? 0 : bubbleHeight
    const dirY = bubble.tailDirection.includes('top') ? -1 : 1
    const dirX = bubble.tailDirection.includes('left') ? -1 : 1

    thoughtTailCircles = `
      <circle cx="${tailX}" cy="${tailY + dirY * 24}" r="15"
              fill="${settings.bubbleColor}" stroke="${settings.bubbleBorderColor}" stroke-width="${settings.bubbleBorderWidth}"/>
      <circle cx="${tailX + dirX * 20}" cy="${tailY + dirY * 44}" r="10"
              fill="${settings.bubbleColor}" stroke="${settings.bubbleBorderColor}" stroke-width="${settings.bubbleBorderWidth}"/>
      <circle cx="${tailX + dirX * 34}" cy="${tailY + dirY * 58}" r="6"
              fill="${settings.bubbleColor}" stroke="${settings.bubbleBorderColor}" stroke-width="${settings.bubbleBorderWidth}"/>
    `
  }

  // Combine SVG
  return `<svg xmlns="http://www.w3.org/2000/svg"
              width="${imageWidth}" height="${imageHeight}"
              viewBox="0 0 ${imageWidth} ${imageHeight}">
    <g transform="translate(${x - bubbleWidth / 2}, ${y})">
      <path d="${bubblePath}"
            fill="${settings.bubbleColor}"
            stroke="${settings.bubbleBorderColor}"
            stroke-width="${settings.bubbleBorderWidth}"/>
      ${tailPath ? `<path d="${tailPath}"
            fill="${settings.bubbleColor}"
            stroke="${settings.bubbleBorderColor}"
            stroke-width="${settings.bubbleBorderWidth}"/>` : ''}
      <!-- White fill to cover tail stroke overlap -->
      ${tailPath ? `<path d="${bubblePath}" fill="${settings.bubbleColor}" stroke="none"/>` : ''}
      ${thoughtTailCircles}
      ${textElements}
    </g>
  </svg>`
}

/**
 * Generate thought bubble cloud path
 */
function generateThoughtBubblePath(width: number, height: number): string {
  const bumps = 8
  const bumpRadius = Math.min(width, height) / 6
  let path = `M ${bumpRadius},${height / 2}`

  // Create cloud-like outline with bumps
  for (let i = 0; i <= bumps; i++) {
    const angle = (i / bumps) * Math.PI * 2 - Math.PI / 2
    const cx = width / 2 + (width / 2 - bumpRadius) * Math.cos(angle)
    const cy = height / 2 + (height / 2 - bumpRadius) * Math.sin(angle)
    path += ` A ${bumpRadius},${bumpRadius} 0 0 1 ${cx},${cy}`
  }

  return path + ' Z'
}

/**
 * Generate thought bubble tail (small circles)
 */
function generateThoughtTailPath(width: number, height: number, direction: string): string {
  let startX = width / 2
  let startY = height

  if (direction.includes('left')) startX = width * 0.3
  if (direction.includes('right')) startX = width * 0.7
  if (direction.includes('top')) startY = 0

  const dirY = direction.includes('top') ? -1 : 1

  return `
    <circle cx="${startX}" cy="${startY + dirY * 15}" r="8" />
    <circle cx="${startX + (direction.includes('left') ? -10 : 10)}" cy="${startY + dirY * 30}" r="5" />
    <circle cx="${startX + (direction.includes('left') ? -15 : 15)}" cy="${startY + dirY * 40}" r="3" />
  `
}

/**
 * Generate speech bubble tail
 */
function generateSpeechTailPath(
  width: number,
  height: number,
  direction: string,
  sizeMultiplier: number
): string {
  const tailWidth = 26 * sizeMultiplier
  const tailLength = 40 * sizeMultiplier

  let startX = width / 2
  let startY = height
  let endX = startX
  let endY = height + tailLength

  if (direction === 'top-left') {
    startX = width * 0.3
    startY = 0
    endX = startX - tailLength * 0.5
    endY = -tailLength
  } else if (direction === 'top-right') {
    startX = width * 0.7
    startY = 0
    endX = startX + tailLength * 0.5
    endY = -tailLength
  } else if (direction === 'bottom-left') {
    startX = width * 0.3
    endX = startX - tailLength * 0.5
    endY = height + tailLength
  } else if (direction === 'bottom-right') {
    startX = width * 0.7
    endX = startX + tailLength * 0.5
    endY = height + tailLength
  }

  return `M ${startX - tailWidth / 2},${startY}
          L ${endX},${endY}
          L ${startX + tailWidth / 2},${startY}`
}

/**
 * Generate SFX (sound effect) SVG - stylized text without bubble
 */
function generateSFXSvg(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  settings: Required<ComicSettings>,
  imageWidth: number,
  imageHeight: number
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}">
    <text x="${x}" y="${y}"
          font-family="${settings.fontFamily}"
          font-size="${fontSize}px"
          font-weight="bold"
          font-style="italic"
          fill="${settings.textColor}"
          stroke="${settings.bubbleColor}"
          stroke-width="2"
          text-anchor="middle">${escapeXml(text)}</text>
  </svg>`
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Add speech bubbles to an image
 */
export async function addSpeechBubblesToImage(
  imageBuffer: Buffer,
  bubbles: SpeechBubbleConfig[],
  settings: ComicSettings = {}
): Promise<Buffer> {
  console.log(`[SpeechBubble] Adding ${bubbles.length} bubbles to image`)
  console.log(`[SpeechBubble] Settings:`, settings)

  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings }

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width || 1400
  const height = metadata.height || 1867

  console.log(`[SpeechBubble] Image dimensions: ${width}x${height}`)

  // Generate SVG overlays for each bubble
  const svgOverlays: Buffer[] = []
  for (const bubble of bubbles) {
    console.log(`[SpeechBubble] Generating bubble:`, {
      type: bubble.type,
      text: bubble.text?.substring(0, 30) + '...',
      position: bubble.position,
      positionPixels: {
        x: bubble.position.x * width,
        y: bubble.position.y * height
      }
    })
    const svg = generateSpeechBubbleSVG(bubble, width, height, mergedSettings)
    svgOverlays.push(Buffer.from(svg))
  }

  // Composite all bubbles onto the image
  let result = sharp(imageBuffer)

  for (let i = 0; i < svgOverlays.length; i++) {
    const svgBuffer = svgOverlays[i]
    console.log(`[SpeechBubble] Compositing bubble ${i + 1}/${svgOverlays.length}`)
    result = sharp(await result.toBuffer()).composite([
      { input: svgBuffer, top: 0, left: 0 },
    ])
  }

  console.log(`[SpeechBubble] All bubbles composited successfully`)
  return result.png().toBuffer()
}

/**
 * Process a comic page - load image, add bubbles, save
 */
export async function processComicPage(
  inputPath: string,
  outputPath: string,
  bubbles: SpeechBubbleConfig[],
  settings: ComicSettings = {}
): Promise<void> {
  const fs = await import('node:fs/promises')

  const imageBuffer = await fs.readFile(inputPath)
  const processedBuffer = await addSpeechBubblesToImage(imageBuffer, bubbles, settings)
  await fs.writeFile(outputPath, processedBuffer)
}
