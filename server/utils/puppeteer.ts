import puppeteer, { Browser, Page } from 'puppeteer'

let browserInstance: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    const browserlessToken = process.env.NUXT_BROWSERLESS_TOKEN

    if (browserlessToken) {
      // Producción: conectar a Browserless.io
      console.log('[Puppeteer] Connecting to Browserless.io...')
      browserInstance = await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
      })
    } else {
      // Local: lanzar Chrome
      console.log('[Puppeteer] Launching local Chrome...')
      browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      })
    }
  }
  return browserInstance
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

export interface PdfOptions {
  width: string
  height: string
  printBackground?: boolean
  preferCSSPageSize?: boolean
  margin?: {
    top?: string | number
    right?: string | number
    bottom?: string | number
    left?: string | number
  }
}

export async function generatePdfFromHtml(
  html: string,
  options: PdfOptions
): Promise<Buffer> {
  const browser = await getBrowser()
  const page: Page = await browser.newPage()

  try {
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 60000,
    })

    await page.evaluateHandle('document.fonts.ready')

    const pdfBuffer = await page.pdf({
      width: options.width,
      height: options.height,
      printBackground: options.printBackground ?? true,
      preferCSSPageSize: options.preferCSSPageSize ?? true,
      margin: options.margin ?? { top: 0, right: 0, bottom: 0, left: 0 },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await page.close()
  }
}
