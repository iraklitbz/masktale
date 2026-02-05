/**
 * Comic PDF Template
 * Generates HTML for A4 portrait PDF with comic page
 */

export interface ComicPdfTemplateData {
  comicImage: string // base64 data URL
  title: string
  childName: string
}

export function renderComicPdfTemplate(data: ComicPdfTemplateData): string {
  const { comicImage, title, childName } = data

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${childName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .comic-page {
      width: 210mm;
      height: 297mm;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    .comic-page img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    /* Print-specific styles */
    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .comic-page {
        page-break-after: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="comic-page">
    <img src="${comicImage}" alt="${title}">
  </div>
</body>
</html>`
}

/**
 * Render a multi-page comic PDF template
 * For cases where we have multiple comic pages
 */
export function renderMultiPageComicPdfTemplate(pages: ComicPdfTemplateData[]): string {
  const pagesHtml = pages.map((page, index) => `
    <div class="comic-page" ${index < pages.length - 1 ? 'style="page-break-after: always;"' : ''}>
      <img src="${page.comicImage}" alt="${page.title}">
    </div>
  `).join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comic - ${pages[0]?.childName || 'Comic'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .comic-page {
      width: 210mm;
      height: 297mm;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    .comic-page img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    @media print {
      html, body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .comic-page {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`
}
