/**
 * Generate Comic PDF Endpoint
 * POST /api/pdf/generate-comic
 *
 * Generates an A4 portrait PDF with the composed comic page
 */

import { getSession, getCurrentState, getGeneratedImageBuffer } from '../../utils/session-manager'
import { loadStoryConfig, loadStoryTexts } from '../../utils/story-loader'
import { createComicPage, COMIC_LAYOUTS, type ComicLayoutConfig } from '../../utils/comic-layout-processor'
import { addSpeechBubblesToImage, type SpeechBubbleConfig } from '../../utils/speech-bubble-processor'
import { renderComicPdfTemplate } from '../../utils/comicPdfTemplate'
import { generatePdfFromHtml } from '../../utils/puppeteer'

interface GenerateComicPdfRequest {
  sessionId: string
  layout?: string
  locale?: string
  includeBubbles?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<GenerateComicPdfRequest>(event)
    const {
      sessionId,
      layout = 'classic-2-1',
      locale = 'es',
      includeBubbles = true,
    } = body

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        message: 'sessionId is required',
      })
    }

    console.log(`[ComicPDF] Starting PDF generation for session: ${sessionId}`)

    // 1. Load session data
    const session = await getSession(sessionId)
    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Session not found or expired',
      })
    }

    // 2. Load current state
    const currentState = await getCurrentState(sessionId)
    if (!currentState) {
      throw createError({
        statusCode: 400,
        message: 'Session has no generated images',
      })
    }

    // 3. Load story config
    const storyConfig = await loadStoryConfig(session.storyId)

    // Verify this is a comic format story
    if (storyConfig.format !== 'comic') {
      throw createError({
        statusCode: 400,
        message: 'This story is not in comic format',
      })
    }

    // 4. Load all generated images
    const images: Buffer[] = []
    for (const page of storyConfig.pages) {
      const selectedVersion = currentState.selectedVersions[page.pageNumber]
      if (!selectedVersion) {
        throw createError({
          statusCode: 400,
          message: `Page ${page.pageNumber} not generated`,
        })
      }

      // Use favorite version if available
      let version = selectedVersion.version || 1
      if (currentState.favoriteVersions?.[page.pageNumber]) {
        version = currentState.favoriteVersions[page.pageNumber]
      }

      const imageBuffer = await getGeneratedImageBuffer(sessionId, page.pageNumber, version)

      if (!imageBuffer) {
        throw createError({
          statusCode: 500,
          message: `Failed to load image for page ${page.pageNumber}`,
        })
      }
      images.push(imageBuffer)
      console.log(`[ComicPDF] Loaded image for page ${page.pageNumber}, version ${version}`)
    }

    console.log(`[ComicPDF] Composing ${images.length} images with layout: ${layout}`)

    // 5. Create comic page composition
    const layoutConfig: ComicLayoutConfig = {
      borderWidth: storyConfig.settings.comicSettings?.bubbleBorderWidth || 6,
      borderColor: storyConfig.settings.comicSettings?.bubbleBorderColor || '#000000',
      backgroundColor: '#FFFFFF',
    }

    let comicBuffer = await createComicPage(images, layout, layoutConfig)

    // 6. Add speech bubbles if requested
    if (includeBubbles) {
      try {
        const texts = await loadStoryTexts(session.storyId, locale)

        const composedBubbles = buildComposedBubbleConfigs(
          storyConfig.pages,
          texts.pages,
          layout
        )

        if (composedBubbles.length > 0) {
          console.log(`[ComicPDF] Adding ${composedBubbles.length} speech bubbles`)
          comicBuffer = await addSpeechBubblesToImage(
            comicBuffer,
            composedBubbles,
            storyConfig.settings.comicSettings || {}
          )
        }
      } catch (error) {
        console.warn(`[ComicPDF] Could not load texts for locale '${locale}', skipping bubbles`)
      }
    }

    // 7. Convert to base64 for HTML template
    const base64Image = `data:image/png;base64,${comicBuffer.toString('base64')}`

    // 8. Get story title and child name
    const storyTexts = await loadStoryTexts(session.storyId, locale)
    const childName = session.userPhoto?.childName || 'Protagonista'
    const title = storyTexts?.cover?.title || storyConfig.title[locale as 'es' | 'en'] || 'Comic'

    // 9. Render HTML template
    const html = renderComicPdfTemplate({
      comicImage: base64Image,
      title,
      childName,
    })

    console.log(`[ComicPDF] HTML template rendered, generating PDF...`)

    // 10. Generate PDF with Puppeteer (A4 portrait)
    const pdfBuffer = await generatePdfFromHtml(html, {
      width: '210mm',
      height: '297mm',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    console.log(`[ComicPDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`)

    // 11. Return PDF
    const safeName = childName
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '')
      .replace(/\s+/g, '_')

    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="${safeName}_Comic.pdf"`)
    setHeader(event, 'Content-Length', String(pdfBuffer.length))

    return pdfBuffer
  } catch (error: any) {
    console.error('[ComicPDF] Error generating PDF:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate comic PDF',
    })
  }
})

/**
 * Build bubble configs with positions adjusted for the composed layout
 */
function buildComposedBubbleConfigs(
  pages: any[],
  textPages: any[],
  layoutName: string
): SpeechBubbleConfig[] {
  const layout = COMIC_LAYOUTS[layoutName] || COMIC_LAYOUTS['classic-2-1']
  if (!layout) return []

  const bubbles: SpeechBubbleConfig[] = []

  for (let i = 0; i < pages.length && i < layout.panels.length; i++) {
    const page = pages[i]
    const panel = layout.panels[i]
    if (!panel) continue

    const textPage = textPages.find((t: any) => t.pageNumber === page.pageNumber)

    if (!page.speechBubbles || !textPage?.speechBubbles) continue

    for (let j = 0; j < page.speechBubbles.length; j++) {
      const bubbleConfig = page.speechBubbles[j]
      const textConfig = textPage.speechBubbles[j]

      // Validate text config exists and has non-empty text
      if (!textConfig?.text || textConfig.text.trim().length === 0) {
        console.log(`[ComicPDF] Skipping bubble ${j} on page ${page.pageNumber}: no text or empty text`)
        continue
      }

      // Validate bubble config
      if (!bubbleConfig || !bubbleConfig.position) {
        console.log(`[ComicPDF] Skipping bubble ${j} on page ${page.pageNumber}: invalid bubble config`)
        continue
      }

      // Recalculate position within the composed page
      const newX = panel.x + bubbleConfig.position.x * panel.width
      const newY = panel.y + bubbleConfig.position.y * panel.height
      
      console.log(`[ComicPDF] Page ${page.pageNumber}, Bubble ${j}:`, {
        panel: { x: panel.x, y: panel.y, w: panel.width, h: panel.height },
        originalPos: bubbleConfig.position,
        newPos: { x: newX, y: newY },
        text: textConfig.text.substring(0, 30)
      })

      bubbles.push({
        type: bubbleConfig.type || 'speech',
        text: textConfig.text,
        position: { x: newX, y: newY },
        tailDirection: bubbleConfig.tailDirection,
        size: bubbleConfig.size || 'medium',
      })
    }
  }

  return bubbles
}
