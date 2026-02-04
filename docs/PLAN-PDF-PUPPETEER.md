# Plan: Generación de PDF con Puppeteer

> **Objetivo:** Generar PDFs de alta calidad usando cualquier tipografía (TypeKit, Adobe Fonts, Google Fonts, custom) renderizando HTML/CSS en el servidor con Puppeteer.

---

## Resumen Ejecutivo

Actualmente el PDF se genera en cliente con jsPDF, lo que limita las fuentes a las embebidas manualmente. Con Puppeteer en el servidor, podemos:

- Usar **cualquier fuente CSS** (TypeKit, Adobe, custom)
- Reutilizar el **mismo diseño de BookPreview.vue**
- Obtener **calidad de impresión perfecta**
- Texto **seleccionable y buscable** en el PDF

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Nuxt)                          │
├─────────────────────────────────────────────────────────────────┤
│  BookPreview.vue ──────► "Descargar PDF" ──────► API Request    │
│       ▲                                              │          │
│       │                                              ▼          │
│  [Vista previa]                              POST /api/pdf      │
└─────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVIDOR (Nitro)                          │
├─────────────────────────────────────────────────────────────────┤
│  /server/api/pdf/generate.post.ts                               │
│       │                                                         │
│       ├── 1. Cargar datos sesión + textos historia              │
│       ├── 2. Generar HTML con template (similar a BookPreview)  │
│       ├── 3. Inyectar CSS con @font-face (TypeKit/Google/etc)   │
│       ├── 4. Puppeteer renderiza HTML → PDF                     │
│       └── 5. Devolver PDF como stream/blob                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fases de Implementación

### FASE 1: Configuración Puppeteer en Nuxt

**Objetivo:** Instalar y configurar Puppeteer para funcionar en el servidor Nitro.

**Tareas:**

1. Instalar dependencias:
   ```bash
   npm install puppeteer
   # O versión ligera (usa Chrome del sistema):
   npm install puppeteer-core
   ```

2. Crear utilidad servidor para instancia Puppeteer:
   ```
   /server/utils/puppeteer.ts
   ```

3. Configurar Nuxt para excluir Puppeteer del bundle cliente:
   ```typescript
   // nuxt.config.ts
   export default defineNuxtConfig({
     nitro: {
       externals: {
         inline: ['puppeteer']
       }
     }
   })
   ```

**Archivos a crear:**
- `/server/utils/puppeteer.ts` - Singleton de browser

---

### FASE 2: Template HTML para PDF

**Objetivo:** Crear template HTML que replique exactamente el diseño de BookPreview.vue

**Tareas:**

1. Crear template HTML base:
   ```
   /server/templates/pdf-book.html
   ```

2. El template debe incluir:
   - Estructura de spreads (portada, páginas, contraportada)
   - CSS inline con @font-face para las fuentes
   - Placeholders para datos dinámicos
   - Estilos de impresión optimizados

3. Crear función para renderizar template con datos:
   ```
   /server/utils/pdfTemplate.ts
   ```

**Estructura del template:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Fuentes - se inyectan dinámicamente */
    @font-face {
      font-family: 'Headline';
      src: url('{{headlineFontUrl}}');
    }
    @font-face {
      font-family: 'Body';
      src: url('{{bodyFontUrl}}');
    }

    /* Estilos del libro */
    .spread { width: 1000mm; height: 500mm; display: flex; }
    .page { width: 500mm; height: 500mm; }
    /* ... resto de estilos ... */
  </style>
</head>
<body>
  <!-- Portada -->
  <div class="spread cover">...</div>

  <!-- Páginas historia -->
  {{#each pages}}
  <div class="spread story">...</div>
  {{/each}}

  <!-- Contraportada -->
  <div class="spread back-cover">...</div>
</body>
</html>
```

**Archivos a crear:**
- `/server/templates/pdf-book.html` - Template HTML
- `/server/utils/pdfTemplate.ts` - Renderizado con datos

---

### FASE 3: Endpoint de Generación

**Objetivo:** Crear API endpoint que genera y devuelve el PDF.

**Tareas:**

1. Crear endpoint:
   ```
   /server/api/pdf/generate.post.ts
   ```

2. Flujo del endpoint:
   ```typescript
   export default defineEventHandler(async (event) => {
     const { sessionId } = await readBody(event)

     // 1. Cargar datos
     const session = await loadSession(sessionId)
     const storyTexts = await loadStoryTexts(session.storyId)
     const storyConfig = await loadStoryConfig(session.storyId)

     // 2. Preparar imágenes (convertir a base64 o URLs absolutas)
     const images = await prepareImages(sessionId, session)

     // 3. Renderizar HTML
     const html = renderPdfTemplate({
       session,
       storyTexts,
       storyConfig,
       images,
       typography: storyConfig.typography
     })

     // 4. Generar PDF con Puppeteer
     const pdf = await generatePdfFromHtml(html, {
       width: '1000mm',
       height: '500mm',
       printBackground: true
     })

     // 5. Devolver PDF
     setHeader(event, 'Content-Type', 'application/pdf')
     setHeader(event, 'Content-Disposition', `attachment; filename="${childName}_Cuento.pdf"`)
     return pdf
   })
   ```

3. Opciones de Puppeteer para PDF:
   ```typescript
   await page.pdf({
     width: '1000mm',
     height: '500mm',
     printBackground: true,
     preferCSSPageSize: true,
     margin: { top: 0, right: 0, bottom: 0, left: 0 }
   })
   ```

**Archivos a crear:**
- `/server/api/pdf/generate.post.ts` - Endpoint principal

---

### FASE 4: Gestión de Tipografías

**Objetivo:** Cargar dinámicamente las fuentes según la configuración de cada historia.

**Opciones de carga de fuentes:**

#### Opción A: Google Fonts (URL directa)
```css
@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
```

#### Opción B: TypeKit/Adobe Fonts
```css
@import url('https://use.typekit.net/xxxxxxx.css');
```

#### Opción C: Fuentes locales (TTF en servidor)
```css
@font-face {
  font-family: 'MiFuente';
  src: url('data:font/truetype;base64,{{base64Font}}') format('truetype');
}
```

**Implementación:**

1. Leer configuración de tipografía del `config.json` de la historia:
   ```json
   {
     "typography": {
       "kitUrl": "https://use.typekit.net/abc123.css",
       "headline": { "family": "'Cooper Black', serif" },
       "body": { "family": "'Source Sans Pro', sans-serif" }
     }
   }
   ```

2. Inyectar en el template:
   ```typescript
   const fontStyles = typography.kitUrl
     ? `@import url('${typography.kitUrl}');`
     : generateFontFaceFromLocal(typography)
   ```

**Archivos a modificar:**
- `/server/utils/pdfTemplate.ts` - Inyección de fuentes

---

### FASE 5: Integración Cliente

**Objetivo:** Actualizar el cliente para usar el nuevo endpoint.

**Tareas:**

1. Modificar `usePdfGenerator.ts`:
   ```typescript
   const generatePdf = async (options: PdfGeneratorOptions) => {
     const { sessionId, session } = options

     // Llamar al servidor
     const response = await $fetch('/api/pdf/generate', {
       method: 'POST',
       body: { sessionId },
       responseType: 'blob'
     })

     // Descargar el PDF
     const url = URL.createObjectURL(response)
     const a = document.createElement('a')
     a.href = url
     a.download = `${session.userPhoto?.childName}_Cuento.pdf`
     a.click()
     URL.revokeObjectURL(url)
   }
   ```

2. Añadir estado de carga mientras genera (puede tardar unos segundos).

3. Manejo de errores.

**Archivos a modificar:**
- `/app/composables/usePdfGenerator.ts` - Simplificar a llamada API

---

### FASE 6: Optimizaciones (Opcional)

**Objetivo:** Mejorar rendimiento y experiencia.

**Tareas opcionales:**

1. **Pool de browsers:** Reutilizar instancias de Puppeteer para múltiples peticiones.

2. **Cache de PDFs:** Si el usuario descarga varias veces, servir desde cache.

3. **Generación async:** Generar en background y notificar cuando esté listo.

4. **Compresión PDF:** Reducir tamaño del archivo final.

5. **Preview antes de descargar:** Mostrar el PDF en un modal antes de descargar.

---

## Estructura de Archivos Final

```
/server/
├── api/
│   └── pdf/
│       └── generate.post.ts      # Endpoint principal
├── templates/
│   └── pdf-book.html             # Template HTML del libro
└── utils/
    ├── puppeteer.ts              # Singleton browser Puppeteer
    └── pdfTemplate.ts            # Renderizado de template

/app/
└── composables/
    └── usePdfGenerator.ts        # Simplificado: solo llama API
```

---

## Consideraciones de Producción

### Memoria y Recursos
- Puppeteer consume ~50-100MB por instancia
- Usar `puppeteer-core` + Chrome del sistema en producción
- Cerrar páginas después de cada PDF

### Timeouts
- Generación puede tardar 5-15 segundos
- Configurar timeout adecuado en cliente y servidor

### Hosting
- **Vercel:** Tiene limitaciones con Puppeteer, usar `@sparticuz/chromium`
- **Railway/Render:** Funciona bien con Puppeteer
- **VPS propio:** Sin problemas

### Alternativa: Strapi
Si prefieres mover la generación a Strapi:
- Crear plugin/controller en Strapi para generar PDFs
- Ventaja: Separación de responsabilidades
- Desventaja: Comunicación extra entre servicios

---

## Comandos para Empezar

```bash
# 1. Instalar Puppeteer
npm install puppeteer

# 2. Crear estructura de carpetas
mkdir -p server/templates server/api/pdf

# 3. Verificar que funciona
npm run dev
# Probar endpoint con curl o desde la app
```

---

## Tiempo Estimado por Fase

| Fase | Descripción | Complejidad |
|------|-------------|-------------|
| 1 | Configuración Puppeteer | Baja |
| 2 | Template HTML | Media |
| 3 | Endpoint generación | Media |
| 4 | Gestión tipografías | Baja |
| 5 | Integración cliente | Baja |
| 6 | Optimizaciones | Variable |

---

## Siguiente Paso

Cuando estés listo, empezamos por **FASE 1**: instalar Puppeteer y crear el singleton del browser en el servidor.

¿Dudas? Mañana las resolvemos.
