/**
 * Comic Layout Processor
 * Composes multiple images into a comic page layout with panels and gutters
 */

import sharp from 'sharp'

export interface PanelConfig {
  pageNumber: number
  imageBuffer: Buffer
  // Panel position and size (percentages 0-1)
  x: number
  y: number
  width: number
  height: number
}

export interface ComicLayoutConfig {
  // A4 dimensions at 300 DPI
  width?: number  // default: 2480px (A4 @ 300dpi)
  height?: number // default: 3508px (A4 @ 300dpi)
  // Gutters (spacing between panels)
  gutterSize?: number // default: 20px
  // Page margins
  margin?: number // default: 40px
  // Panel border
  borderWidth?: number // default: 4px
  borderColor?: string // default: #000000
  // Background
  backgroundColor?: string // default: #FFFFFF
}

export interface LayoutTemplate {
  name: string
  description: string
  panels: {
    x: number
    y: number
    width: number
    height: number
  }[]
}

// Predefined classic comic layouts
export const COMIC_LAYOUTS: Record<string, LayoutTemplate> = {
  // 3 panels vertical - equal size
  'vertical-equal': {
    name: 'Vertical Equal',
    description: '3 equal panels stacked vertically',
    panels: [
      { x: 0, y: 0, width: 1, height: 0.33 },
      { x: 0, y: 0.33, width: 1, height: 0.33 },
      { x: 0, y: 0.66, width: 1, height: 0.34 },
    ],
  },
  // Classic: large top, 2 small bottom
  'classic-1-2': {
    name: 'Classic 1+2',
    description: 'Large panel on top, 2 smaller panels on bottom',
    panels: [
      { x: 0, y: 0, width: 1, height: 0.55 },
      { x: 0, y: 0.55, width: 0.5, height: 0.45 },
      { x: 0.5, y: 0.55, width: 0.5, height: 0.45 },
    ],
  },
  // Classic: 2 small top, large bottom
  'classic-2-1': {
    name: 'Classic 2+1',
    description: '2 smaller panels on top, large panel on bottom',
    panels: [
      { x: 0, y: 0, width: 0.5, height: 0.45 },
      { x: 0.5, y: 0, width: 0.5, height: 0.45 },
      { x: 0, y: 0.45, width: 1, height: 0.55 },
    ],
  },
  // Dynamic: varying sizes for dramatic effect
  'dynamic-action': {
    name: 'Dynamic Action',
    description: 'Medium intro, tall action panel, wide conclusion',
    panels: [
      { x: 0, y: 0, width: 0.6, height: 0.35 },      // Scene setup (medium)
      { x: 0.6, y: 0, width: 0.4, height: 0.65 },    // Action (tall vertical)
      { x: 0, y: 0.35, width: 0.6, height: 0.3 },    // Mid action (wide)
      { x: 0, y: 0.65, width: 1, height: 0.35 },     // Resolution (wide cinematic)
    ],
  },
  // Hero moment: small setup, big reveal
  'hero-reveal': {
    name: 'Hero Reveal',
    description: 'Small panels building to large hero shot',
    panels: [
      { x: 0, y: 0, width: 0.5, height: 0.3 },
      { x: 0.5, y: 0, width: 0.5, height: 0.3 },
      { x: 0, y: 0.3, width: 1, height: 0.7 },
    ],
  },
  // Story progression: intro, middle, end
  'story-progression': {
    name: 'Story Progression',
    description: 'Classic storytelling layout - setup, conflict, resolution',
    panels: [
      { x: 0, y: 0, width: 1, height: 0.35 },        // Setup (wide establishing shot)
      { x: 0, y: 0.35, width: 0.55, height: 0.4 },   // Conflict (main action)
      { x: 0.55, y: 0.35, width: 0.45, height: 0.4 }, // Supporting action
      { x: 0, y: 0.75, width: 1, height: 0.25 },     // Resolution (wide)
    ],
  },
  // Cat rescue specific - optimized for the story
  'cat-rescue': {
    name: 'Cat Rescue',
    description: 'Optimized for: discovery, climbing action, happy ending',
    panels: [
      { x: 0, y: 0, width: 1, height: 0.32 },         // Discovery - wide scene
      { x: 0, y: 0.32, width: 0.45, height: 0.43 },   // Climbing - tall action
      { x: 0.45, y: 0.32, width: 0.55, height: 0.43 },// Close-up details
      { x: 0, y: 0.75, width: 1, height: 0.25 },      // Happy ending - wide
    ],
  },
}

const DEFAULT_CONFIG: Required<ComicLayoutConfig> = {
  width: 2480,   // A4 @ 300dpi
  height: 3508,  // A4 @ 300dpi
  gutterSize: 24,
  margin: 48,
  borderWidth: 6,
  borderColor: '#000000',
  backgroundColor: '#FFFFFF',
}

/**
 * Create a comic page by composing multiple images into a layout
 */
export async function createComicPage(
  images: Buffer[],
  layoutName: string = 'classic-2-1',
  config: ComicLayoutConfig = {}
): Promise<Buffer> {
  const settings = { ...DEFAULT_CONFIG, ...config }
  const layout = COMIC_LAYOUTS[layoutName] || COMIC_LAYOUTS['vertical-equal']

  // Calculate available area (minus margins)
  const contentWidth = settings.width - settings.margin * 2
  const contentHeight = settings.height - settings.margin * 2

  // Create base canvas with background
  const canvas = sharp({
    create: {
      width: settings.width,
      height: settings.height,
      channels: 3,
      background: settings.backgroundColor,
    },
  })

  // Prepare panel composites
  const composites: sharp.OverlayOptions[] = []

  // Use only as many panels as we have images
  const panelsToUse = layout.panels.slice(0, images.length)

  for (let i = 0; i < panelsToUse.length; i++) {
    const panel = panelsToUse[i]
    const imageBuffer = images[i]

    if (!imageBuffer) continue

    // Calculate gutter adjustments based on panel position
    // Only add gutter between panels, not at edges
    const hasLeftNeighbor = panel.x > 0
    const hasTopNeighbor = panel.y > 0
    const hasRightNeighbor = panel.x + panel.width < 0.99
    const hasBottomNeighbor = panel.y + panel.height < 0.99

    const gutterLeft = hasLeftNeighbor ? settings.gutterSize / 2 : 0
    const gutterTop = hasTopNeighbor ? settings.gutterSize / 2 : 0
    const gutterRight = hasRightNeighbor ? settings.gutterSize / 2 : 0
    const gutterBottom = hasBottomNeighbor ? settings.gutterSize / 2 : 0

    // Calculate panel position and dimensions
    const panelX = Math.round(settings.margin + panel.x * contentWidth + gutterLeft)
    const panelY = Math.round(settings.margin + panel.y * contentHeight + gutterTop)
    const panelWidth = Math.round(panel.width * contentWidth - gutterLeft - gutterRight)
    const panelHeight = Math.round(panel.height * contentHeight - gutterTop - gutterBottom)

    // Resize image to fill panel
    const resizedImage = await sharp(imageBuffer)
      .resize(panelWidth - settings.borderWidth * 2, panelHeight - settings.borderWidth * 2, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer()

    // Create panel with border
    const panelWithBorder = await createPanelWithBorder(
      resizedImage,
      panelWidth,
      panelHeight,
      settings.borderWidth,
      settings.borderColor
    )

    composites.push({
      input: panelWithBorder,
      left: panelX,
      top: panelY,
    })
  }

  // Composite all panels onto canvas
  return canvas.composite(composites).png().toBuffer()
}

/**
 * Create a panel with a black border
 */
async function createPanelWithBorder(
  imageBuffer: Buffer,
  width: number,
  height: number,
  borderWidth: number,
  borderColor: string
): Promise<Buffer> {
  // Create the bordered panel
  const borderedPanel = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: borderColor,
    },
  })
    .composite([
      {
        input: imageBuffer,
        left: borderWidth,
        top: borderWidth,
      },
    ])
    .png()
    .toBuffer()

  return borderedPanel
}

/**
 * Create a complete comic page with panels and speech bubbles
 */
export async function createCompleteComicPage(
  images: Buffer[],
  layoutName: string,
  bubbleConfigs: any[], // Per-panel bubble configurations
  texts: any, // Text content for bubbles
  config: ComicLayoutConfig = {}
): Promise<Buffer> {
  // First create the base comic layout
  const comicPage = await createComicPage(images, layoutName, config)

  // TODO: Add speech bubbles on top of the composed page
  // This requires recalculating bubble positions based on panel positions
  // For now, return the composed page without bubbles
  // Bubbles can be added in a second pass with adjusted positions

  return comicPage
}

/**
 * Get layout recommendation based on scene types
 */
export function recommendLayout(scenes: string[]): string {
  // Analyze scenes to recommend best layout
  const hasActionScene = scenes.some(s =>
    s.toLowerCase().includes('action') ||
    s.toLowerCase().includes('climb') ||
    s.toLowerCase().includes('dynamic')
  )

  const hasRevealScene = scenes.some(s =>
    s.toLowerCase().includes('triumph') ||
    s.toLowerCase().includes('reveal') ||
    s.toLowerCase().includes('hero')
  )

  if (hasActionScene && scenes.length === 3) {
    return 'classic-2-1' // Action scene benefits from large bottom panel
  }

  if (hasRevealScene) {
    return 'hero-reveal'
  }

  return 'vertical-equal' // Safe default
}

/**
 * Generate a simple 3-panel vertical comic (simplified version)
 */
export async function createSimple3PanelComic(
  images: Buffer[],
  config: ComicLayoutConfig = {}
): Promise<Buffer> {
  const settings = { ...DEFAULT_CONFIG, ...config }

  if (images.length !== 3) {
    throw new Error('Simple 3-panel comic requires exactly 3 images')
  }

  const contentWidth = settings.width - settings.margin * 2
  const panelHeight = Math.floor((settings.height - settings.margin * 2 - settings.gutterSize * 2) / 3)

  const composites: sharp.OverlayOptions[] = []

  for (let i = 0; i < 3; i++) {
    const panelY = settings.margin + i * (panelHeight + settings.gutterSize)

    // Resize image to fill panel
    const resizedImage = await sharp(images[i])
      .resize(contentWidth - settings.borderWidth * 2, panelHeight - settings.borderWidth * 2, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer()

    // Create panel with border
    const panelWithBorder = await createPanelWithBorder(
      resizedImage,
      contentWidth,
      panelHeight,
      settings.borderWidth,
      settings.borderColor
    )

    composites.push({
      input: panelWithBorder,
      left: settings.margin,
      top: panelY,
    })
  }

  return sharp({
    create: {
      width: settings.width,
      height: settings.height,
      channels: 3,
      background: settings.backgroundColor,
    },
  })
    .composite(composites)
    .png()
    .toBuffer()
}
