import { getSession, getCurrentState, getGeneratedImageBuffer } from '../../utils/session-manager'
import { loadStoryConfig, loadStoryTexts } from '../../utils/story-loader'
import { renderPdfTemplate } from '../../utils/pdfTemplate'
import { generatePdfFromHtml } from '../../utils/puppeteer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { sessionId } = body

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        message: 'sessionId is required',
      })
    }

    console.log(`[PDF] Starting PDF generation for session: ${sessionId}`)

    // 1. Load session data
    const session = await getSession(sessionId)
    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Session not found or expired',
      })
    }

    // 2. Load current state (selected versions, favorites)
    const currentState = await getCurrentState(sessionId)
    if (!currentState) {
      throw createError({
        statusCode: 400,
        message: 'Session has no generated images',
      })
    }

    // 3. Load story config and texts
    const storyConfig = await loadStoryConfig(session.storyId)
    const storyTexts = await loadStoryTexts(session.storyId)

    // 4. Prepare images as base64 data URLs
    const images = new Map<number, string>()
    const totalPages = storyTexts.pages.length

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      // Get the version to use (favorite or selected)
      let version = currentState.selectedVersions[pageNum]?.version || 1
      if (currentState.favoriteVersions?.[pageNum]) {
        version = currentState.favoriteVersions[pageNum]
      }

      const imageBuffer = await getGeneratedImageBuffer(sessionId, pageNum, version)

      if (imageBuffer) {
        const base64 = imageBuffer.toString('base64')
        const mimeType = 'image/png'
        images.set(pageNum, `data:${mimeType};base64,${base64}`)
        console.log(`[PDF] Loaded image for page ${pageNum}, version ${version}`)
      } else {
        console.warn(`[PDF] Could not load image for page ${pageNum}`)
      }
    }

    // 5. Render HTML template
    const html = renderPdfTemplate({
      session,
      storyTexts,
      typography: storyConfig.typography,
      currentState,
      images,
    })

    console.log(`[PDF] HTML template rendered, generating PDF...`)

    // 6. Generate PDF with Puppeteer
    const pdfBuffer = await generatePdfFromHtml(html, {
      width: '1000mm',
      height: '500mm',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    console.log(`[PDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`)

    // 7. Return PDF
    const childName = session.userPhoto?.childName || 'Cuento'
    const safeName = childName
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '')
      .replace(/\s+/g, '_')

    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="${safeName}_Cuento.pdf"`)
    setHeader(event, 'Content-Length', pdfBuffer.length.toString())

    return pdfBuffer
  } catch (error: any) {
    console.error('[PDF] Error generating PDF:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate PDF',
    })
  }
})
