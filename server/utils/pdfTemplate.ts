import { readFileSync } from 'fs'
import { join } from 'path'
import type { StoryTexts, StoryTypography } from '~/app/types/story'
import type { Session, CurrentState } from '~/app/types/session'

export interface PdfTemplateData {
  session: Session
  storyTexts: StoryTexts
  typography?: StoryTypography
  currentState: CurrentState
  images: Map<number, string> // pageNumber -> base64 data URL
}

function interpolateText(text: string, childName: string): string {
  return text.replace(/\{childName\}/g, childName)
}

function generateFontImports(typography?: StoryTypography): string {
  if (typography?.kitUrl) {
    return `@import url('${typography.kitUrl}');`
  }
  // Default Google Fonts
  return `@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Source+Sans+3:wght@400;600&display=swap');`
}

function getHeadlineFont(typography?: StoryTypography): string {
  if (typography?.headline?.family) {
    return typography.headline.family
  }
  return "'Alfa Slab One', serif"
}

function getBodyFont(typography?: StoryTypography): string {
  if (typography?.body?.family) {
    return typography.body.family
  }
  return "'Source Sans 3', sans-serif"
}

function generateCoverSpread(
  data: PdfTemplateData,
  childName: string
): string {
  const { storyTexts, images } = data
  const coverImage = images.get(1) || ''

  return `
  <div class="spread">
    <div class="page cover-gradient">
      <div class="cover-content">
        <h1 class="cover-title">${storyTexts.cover.title}</h1>
        <p class="cover-tagline">${storyTexts.cover.tagline}</p>
        <div class="cover-divider"></div>
        <p class="cover-subtitle">${storyTexts.cover.subtitle}</p>
        <h2 class="cover-childname">${childName}</h2>
      </div>
    </div>
    <div class="page bg-light">
      <div class="image-container cover-image">
        ${coverImage ? `<img src="${coverImage}" alt="Portada">` : ''}
      </div>
    </div>
  </div>`
}

function generateStorySpread(
  pageText: { pageNumber: number; title: string; text: string },
  image: string,
  childName: string,
  spreadIndex: number
): string {
  const leftPageNum = spreadIndex * 2 - 1
  const rightPageNum = spreadIndex * 2

  return `
  <div class="spread story-spread">
    <div class="story-image-bg">
      ${image ? `<img src="${image}" alt="Ilustracion pagina ${pageText.pageNumber}">` : ''}
    </div>
    <div class="story-text-overlay">
      <div class="story-content">
        <h2 class="story-title">${pageText.title}</h2>
        <div class="story-divider"></div>
        <p class="story-text">${interpolateText(pageText.text, childName)}</p>
      </div>
    </div>
    <span class="page-number" style="left: 25%; color: #9ca3af;">${leftPageNum}</span>
    <span class="page-number page-number-light" style="left: 75%;">${rightPageNum}</span>
  </div>`
}

function generateBackCoverSpread(
  data: PdfTemplateData,
  childName: string
): string {
  const { storyTexts, images } = data
  const lastPageNum = storyTexts.pages.length
  const lastImage = images.get(lastPageNum) || ''

  return `
  <div class="spread">
    <div class="page bg-light">
      <div class="backcover-content">
        <p class="backcover-message">${interpolateText(storyTexts.backCover.message, childName)}</p>
        <div class="backcover-divider"></div>
        <h2 class="backcover-footer">${storyTexts.backCover.footer}</h2>
      </div>
    </div>
    <div class="page">
      <div class="image-container cover-image">
        ${lastImage ? `<img src="${lastImage}" alt="Contraportada">` : ''}
      </div>
    </div>
  </div>`
}

export function renderPdfTemplate(data: PdfTemplateData): string {
  const templatePath = join(process.cwd(), 'server/templates/pdf-book.html')
  let template = readFileSync(templatePath, 'utf-8')

  const childName = data.session.userPhoto?.childName || 'Protagonista'
  const { storyTexts, typography, images } = data

  // Generate font imports
  const fontImports = generateFontImports(typography)
  const headlineFont = getHeadlineFont(typography)
  const bodyFont = getBodyFont(typography)

  // Generate all spreads
  const spreads: string[] = []

  // Cover spread
  spreads.push(generateCoverSpread(data, childName))

  // Story spreads
  for (let i = 0; i < storyTexts.pages.length; i++) {
    const pageText = storyTexts.pages[i]
    const image = images.get(pageText.pageNumber) || ''
    spreads.push(generateStorySpread(pageText, image, childName, i + 1))
  }

  // Back cover spread
  spreads.push(generateBackCoverSpread(data, childName))

  // Replace placeholders
  template = template.replace(/\{\{fontImports\}\}/g, fontImports)
  template = template.replace(/\{\{headlineFontFamily\}\}/g, headlineFont)
  template = template.replace(/\{\{bodyFontFamily\}\}/g, bodyFont)
  template = template.replace(/\{\{childName\}\}/g, childName)
  template = template.replace(/\{\{spreads\}\}/g, spreads.join('\n'))

  return template
}
