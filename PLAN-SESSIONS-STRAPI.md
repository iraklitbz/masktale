# Plan: Migrar Sesiones a Strapi

## Objetivo
Migrar el sistema de sesiones de archivos locales a Strapi para que funcione en Vercel serverless, con limpieza automática de sesiones expiradas.

---

## Estado Actual (Actualizado: 2026-02-06)

### ✅ Fase 1: Crear Content Types en Strapi - COMPLETADA

Los schemas ya han sido creados y copiados en Strapi:

#### Content Type `Session`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| sessionId | UID | Identificador único (UUID) |
| storyId | String | ID del cuento seleccionado |
| childName | String | Nombre del niño |
| childPhoto | Media | Foto subida del niño |
| childPhotoBase64 | Text | Foto en base64 para Gemini |
| status | Enum | created, photo_uploaded, generating, completed |
| currentPage | Integer | Página actual en generación |
| totalPages | Integer | Total de páginas |
| expiresAt | DateTime | Fecha de expiración (para limpieza) |
| generatedImages | Relation | OneToMany con GeneratedImage |

#### Content Type `GeneratedImage`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| pageNumber | Integer | Número de página |
| version | Integer | Versión de la imagen (1, 2, 3...) |
| image | Media | Imagen generada |
| isSelected | Boolean | Si es la versión seleccionada |
| isFavorite | Boolean | Si es favorita |
| session | Relation | ManyToOne con Session |

**Archivos de schema:**
- `strapi-schemas/src/api/session/content-types/session/schema.json`
- `strapi-schemas/src/api/generated-image/content-types/generated-image/schema.json`

---

### ✅ Fase 2: Actualizar Session Manager - COMPLETADA

El archivo `server/utils/session-manager.ts` ha sido completamente reescrito para usar Strapi:

#### Funciones implementadas:
- ✅ `createSession()` → POST /api/sessions
- ✅ `getSession()` → GET /api/sessions?filters[sessionId]
- ✅ `saveSession()` → PUT /api/sessions/:id
- ✅ `deleteSession()` → DELETE /api/sessions/:id (con borrado en cascada de imágenes)
- ✅ `updateSessionStatus()` → Actualiza status de sesión
- ✅ `updateSessionUserPhoto()` → Sube foto a Strapi Media + actualiza sesión
- ✅ `getUserPhotoBase64()` → Obtiene foto base64 de Strapi
- ✅ `getCurrentState()` → Lee de Session + GeneratedImages
- ✅ `saveCurrentState()` → No-op (state gestionado en Strapi)

#### Funciones de imágenes:
- ✅ `saveGeneratedImage()` → Upload a Strapi Media + crear GeneratedImage
- ✅ `getGeneratedImageUrl()` → GET imagen desde Strapi
- ✅ `getGeneratedImageBuffer()` → Descarga imagen para PDF
- ✅ `selectVersion()` → Actualizar isSelected en Strapi
- ✅ `setFavorite()` → Actualizar isFavorite en Strapi
- ✅ `getVersionCount()` → Contar versiones por página

---

### ✅ Fase 3: Actualizar Endpoints de API - COMPLETADA

Todos los endpoints han sido actualizados para usar Strapi:

#### Endpoints de sesión:
- ✅ `POST /api/session/create` → Crea sesión en Strapi
- ✅ `GET /api/session/[id]` → Obtiene sesión desde Strapi
- ✅ `DELETE /api/session/[id]` → Elimina sesión e imágenes de Strapi
- ✅ `POST /api/session/[id]/upload-photo` → Sube foto a Strapi Media
- ✅ `POST /api/session/[id]/generate` → Genera imagen y guarda en Strapi
- ✅ `GET /api/session/[id]/state` → Obtiene estado con selectedVersions
- ✅ `POST /api/session/[id]/select-version` → Cambia isSelected en Strapi
- ✅ `POST /api/session/[id]/favorite` → Cambia isFavorite en Strapi
- ✅ `GET /api/session/[id]/image/[page]` → Sirve imagen desde Strapi
- ✅ `POST /api/session/[id]/regenerate` → Regenera página

#### Endpoints de cómic:
- ✅ `POST /api/session/[id]/comic/compose`
- ✅ `POST /api/session/[id]/comic/apply-bubbles`
- ✅ `POST /api/session/[id]/comic/edit-bubbles`
- ✅ `GET /api/session/[id]/comic/edit-bubbles`

---

### ⏳ Fase 4: Configurar Limpieza Automática - PENDIENTE

#### Tarea pendiente:
Configurar cron job en Strapi para limpieza de sesiones expiradas:

```js
// src/config/cron-tasks.js (en Strapi)
module.exports = {
  cleanExpiredSessions: {
    task: async ({ strapi }) => {
      // Buscar sesiones expiradas
      // Borrar imágenes asociadas
      // Borrar sesión
    },
    options: { rule: '0 * * * *' } // cada hora
  }
};
```

**Nota:** La configuración del cron job debe hacerse en el panel de administración de Strapi.

---

### ⏳ Fase 5: Testing y Limpieza - PENDIENTE

#### Testing manual:
- [ ] Crear sesión
- [ ] Subir foto
- [ ] Generar imágenes
- [ ] Seleccionar versiones
- [ ] Marcar favoritos
- [ ] Descargar PDF
- [ ] Verificar limpieza automática

#### Limpieza de código:
- [ ] Borrar código legacy de filesystem (si queda alguno)
- [ ] Verificar que no haya referencias a `data/sessions`
- [ ] Actualizar documentación

---

## Notas Técnicas

### Variables de entorno requeridas:
```env
STRAPI_URL=https://cms.iraklitbz.dev
NUXT_PUBLIC_STRAPI_URL=https://cms.iraklitbz.dev
NUXT_STRAPI_API_TOKEN=tu_token_aqui
```

### Build status:
✅ **Build exitoso** - La aplicación compila correctamente con la nueva implementación de Strapi.

### Problemas recientes arreglados (2026-02-06):

#### 0. Generación de PDFs - Migrado a Cliente ✅
**Problema:** Puppeteer/Browserless no funcionaban en Vercel serverless (timeouts, errores 500)

**Solución:** Migración completa a jsPDF en el cliente:
- Nuevo composable `useClientPdfGenerator.ts`
- Generación de PDFs 100% en navegador
- Sin dependencias de servidor ni APIs externas

#### 1. Endpoints de Cómic - Arreglados ✅
**Problema:** Los endpoints de cómic intentaban cargar imágenes desde el sistema de archivos local usando `getGeneratedImagePath` (que ahora devuelve cadena vacía) y `fs.readFile`.

**Archivos arreglados:**
- `server/api/session/[id]/comic/compose.post.ts`
- `server/api/session/[id]/comic/edit-bubbles.get.ts`
- `server/api/session/[id]/comic/edit-bubbles.post.ts`
- `server/api/session/[id]/comic/apply-bubbles.post.ts`
- `server/api/pdf/generate-comic.post.ts`
- `server/api/pdf/generate.post.ts`
- `server/utils/pdf-uploader.ts`

**Cambios:**
- Reemplazado `getGeneratedImagePath` + `fs.readFile` → `getGeneratedImageBuffer`
- Reemplazado carga de textos desde archivos locales → `loadStoryTexts()`
- Eliminado código que escribía archivos en disco (no compatible con serverless)
- Las imágenes se devuelven directamente como base64

#### 2. Template de Prompt - Arreglado ✅
**Problema:** `getNewPromptTemplate` devolvía cadena vacía si no había template en Strapi, causando que Gemini generara imágenes sin estilo.

**Solución:** Agregado `DEFAULT_PROMPT_TEMPLATE` en `server/utils/story-loader.ts` como fallback cuando no hay template en Strapi.

### Errores conocidos:
- Hay errores de TypeScript menores (~129) relacionados con tipos de terceros (Stripe, etc.) que no afectan el funcionamiento
- Algunos tipos de checkout necesitan ser unificados (CheckoutFormData vs CheckoutData)

---

## Próximos Pasos

1. **Configurar el cron job en Strapi** para limpieza automática
2. **Probar el flujo completo** de generación de cuentos
3. **Verificar en Vercel** que todo funciona en serverless
4. **Limpiar código legacy** si es necesario

---

## Resumen de Fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Crear Content Types en Strapi | ✅ Completada |
| 2 | Actualizar Session Manager | ✅ Completada |
| 3 | Actualizar Endpoints API | ✅ Completada |
| 4 | Configurar Limpieza Automática | ⏳ Pendiente (requiere config en Strapi) |
| 5 | Testing y Limpieza | ⏳ Pendiente |

**Build:** ✅ Exitoso
