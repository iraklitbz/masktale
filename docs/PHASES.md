# Tracker de Fases - Plataforma de Cuentos Personalizados

**Última actualización:** 2025-12-26
**Estado general:** 🚧 En desarrollo - Fase 5 completada

---

## 📊 Progreso General

```
Fase 1: ████████████████████ 100% ✅ COMPLETADA
Fase 2: ████████████████████ 100% ✅ COMPLETADA
Fase 3: ████████████████████ 100% ✅ COMPLETADA
Fase 4: ████████████████████ 100% ✅ COMPLETADA
Fase 5: ████████████████████ 100% ✅ COMPLETADA
Fase 6: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
Fase 7: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
Fase 8: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
Fase 9: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
Fase 10: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
```

---

## ✅ FASE 1: Fundación y Estructura

**Estado:** ✅ COMPLETADA
**Fecha inicio:** 2025-12-19
**Fecha fin:** 2025-12-19
**Objetivo:** Crear la arquitectura base, tipos y organizar archivos existentes

### Tareas Completadas

- [x] Crear estructura de carpetas base (`data/`, `app/types/`, `app/composables/`, `server/utils/`, `docs/`)
- [x] Crear carpetas del cuento `story-001-first-day-school` con subcarpetas
- [x] Migrar imágenes de `public/img/` a `data/stories/story-001-first-day-school/base-images/`
  - `1.jpg` → `page-01.jpg`
  - `2.png` → `page-02.png`
  - `3.jpg` → `page-03.jpg`
  - `4.jpg` → `page-04.jpg`
  - `5.png` → `page-05.png`
- [x] Crear definiciones de tipos en `app/types/story.ts`
- [x] Crear definiciones de tipos en `app/types/session.ts`
- [x] Crear `config.json` del cuento story-001-first-day-school
- [x] Crear 5 archivos de prompts placeholder (`page-01.txt` hasta `page-05.txt`)
- [x] Extraer `createImageCollage` a `server/utils/image-processor.ts`
- [x] Crear `server/utils/gemini.ts` con cliente reutilizable
- [x] Crear `docs/PHASES.md` para tracking de progreso

### Archivos Creados

- ✅ `/app/types/story.ts` - Tipos de cuentos y páginas
- ✅ `/app/types/session.ts` - Tipos de sesión
- ✅ `/data/stories/story-001-first-day-school/config.json` - Configuración del cuento
- ✅ `/data/stories/story-001-first-day-school/prompts/page-01.txt` hasta `page-05.txt`
- ✅ `/server/utils/image-processor.ts` - Utilidades de Sharp
- ✅ `/server/utils/gemini.ts` - Cliente de Gemini
- ✅ `/docs/PHASES.md` - Este documento

### Notas de Aprendizaje

- Las imágenes originales en `public/img/` se mantienen como backup
- Los prompts son versiones básicas que se mejorarán en la Fase 8
- La función `createImageCollage` funciona perfectamente y fue extraída sin cambios
- El cliente de Gemini incluye retry automático con exponential backoff

### Próximos Pasos

➡️ Continuar con **Fase 2: Gestión de Sesiones**

---

## ✅ FASE 2: Gestión de Sesiones

**Estado:** ✅ COMPLETADA
**Fecha inicio:** 2025-12-26
**Fecha fin:** 2025-12-26
**Objetivo:** Implementar creación, almacenamiento y recuperación de sesiones

### Tareas Completadas

- [x] Crear `/server/api/session/create.post.ts` - Endpoint POST para crear sesiones
- [x] Crear `/server/api/session/[id].get.ts` - Endpoint GET para obtener sesión por ID
- [x] Crear `/server/utils/session-manager.ts` - Utilidades completas de gestión
  - createSession() - Crear sesión con UUID
  - getSession() - Obtener sesión
  - saveSession() - Guardar metadata
  - getCurrentState() / saveCurrentState() - Estado actual
  - cleanExpiredSessions() - Limpieza automática
- [x] Crear `/app/composables/useSession.ts` - Composable Vue reactivo
  - createSession() - Crear y persistir en localStorage
  - loadSession() - Cargar sesión existente
  - restoreSession() - Restaurar desde localStorage
  - clearSession() - Limpiar estado
  - Utilidades (isExpired, getTimeRemaining)
- [x] Crear directorio `data/sessions/` para almacenamiento

### Archivos Creados

- `server/utils/session-manager.ts` - 270 líneas
- `server/api/session/create.post.ts` - 45 líneas
- `server/api/session/[id].get.ts` - 45 líneas
- `app/composables/useSession.ts` - 150 líneas

### Tests Realizados

- ✅ Endpoint POST /api/session/create funciona correctamente
- ✅ Endpoint GET /api/session/{id} devuelve sesión correctamente
- ✅ Archivos metadata.json se crean en data/sessions/{uuid}/
- ✅ Sesiones expiran después de 24h

### Notas de Aprendizaje

- Las importaciones en server/ deben usar rutas relativas, no alias ~
- h3 tiene su propio `getSession` que causa advertencias (no es problema)
- localStorage solo funciona en client-side (usar import.meta.client)

---

## ✅ FASE 3: Sistema de Cuentos

**Estado:** ✅ COMPLETADA
**Fecha inicio:** 2025-12-26
**Fecha fin:** 2025-12-26
**Objetivo:** Cargar y listar cuentos disponibles con UI profesional

### Tareas Completadas

- [x] Crear `/server/utils/story-loader.ts` - Utilidades de carga
  - getAllStories() - Listar cuentos
  - loadStoryConfig() - Cargar config completa
  - storyExists() - Verificar existencia
  - getPageConfig() / getPagePrompt() - Datos de página
  - getBaseImagePath() / getBaseImageBase64() - Imágenes
- [x] Crear `/server/api/story/index.get.ts` - GET /api/story
- [x] Crear `/server/api/story/[id].get.ts` - GET /api/story/{id}
- [x] Crear `/app/components/story/StoryCard.vue` - Card Tailwind
  - Hover effects y animaciones
  - Temas con colores dinámicos
  - Badges, meta info, CTAs
- [x] Refactorizar `/app/pages/index.vue` - Selector principal
  - Grid responsive (1/2/3 columnas)
  - Estados: loading, error, empty
  - Integración con useSession

### Archivos Creados

- `server/utils/story-loader.ts` - 200 líneas
- `server/api/story/index.get.ts` - 25 líneas
- `server/api/story/[id].get.ts` - 45 líneas
- `app/components/story/StoryCard.vue` - 110 líneas
- `app/pages/index.vue` - 120 líneas (refactorizada)

### Tests Realizados

- ✅ GET /api/story devuelve lista correctamente
- ✅ GET /api/story/{id} devuelve config completa
- ✅ UI responsive funciona en todos los breakpoints
- ✅ Crear sesión al seleccionar cuento funciona
- ✅ Temas con colores dinámicos se visualizan bien

### Notas de Aprendizaje

- Usar archivos JSON locales es perfecto para el MVP
- Tailwind con gradientes y backdrop-blur da un look profesional
- line-clamp-2 es útil para truncar descripciones
- Emojis como fallback para thumbnails faltantes funcionan bien

### Decisión Técnica

Se decidió mantener el sistema de archivos JSON local en lugar de usar un CMS o BD porque:
- Simple y fácil de versionar con Git
- Sin dependencias externas
- Perfecto para 4-5 cuentos del MVP
- Migración futura a CMS es posible en Fase 11+

---

## ✅ FASE 4: Upload de Foto

**Estado:** ✅ COMPLETADA
**Fecha inicio:** 2025-12-26
**Fecha fin:** 2025-12-26
**Objetivo:** Permitir al usuario subir 1-3 fotos con drag & drop profesional

### Tareas Completadas

- [x] Crear `/server/api/session/[id]/upload-photo.post.ts` - Endpoint multipart
  - Validación de tipo, tamaño (máx 10MB)
  - Guardado en data/sessions/{id}/user-photos/
  - Actualización de metadata de sesión
- [x] Crear `/app/pages/story/[id]/upload.vue` - Página upload profesional
  - Drag & drop con VueUse (useDropZone)
  - Selector de archivos (useFileDialog)
  - Preview con thumbnails editables
  - Validación en tiempo real
  - Progress bar animado
  - Estados: empty, uploading, ready
- [x] Integrar navegación desde selector de cuentos
- [x] Validación completa: 1-3 fotos, JPEG/PNG/WebP

### Archivos Creados

- `server/api/session/[id]/upload-photo.post.ts` - 115 líneas
- `app/pages/story/[id]/upload.vue` - 280 líneas
- `app/pages/index.vue` - Actualizada con navegación

### Tests Realizados

- ✅ Drag & drop funciona correctamente
- ✅ Selector de archivos funciona
- ✅ Validación rechaza archivos inválidos
- ✅ Preview muestra thumbnails correctamente
- ✅ Eliminación de fotos funciona
- ✅ Upload con progress bar funciona
- ✅ Navegación entre páginas funciona

### Notas de Aprendizaje

- VueUse ya viene incluido en Nuxt (no requiere instalación)
- useDropZone y useFileDialog son perfectos para upload
- Tailwind transitions + hover effects = UX profesional
- FormData es la forma estándar de subir archivos
- readMultipartFormData de Nuxt maneja multipart/form-data

### UI Highlights

- Zona drag & drop grande y atractiva
- Feedback visual cuando se arrastra sobre la zona
- Thumbnails con hover effect para eliminar
- Progress bar con gradiente animado
- Instrucciones claras y amigables
- Mobile-first y totalmente responsive

---

## ✅ FASE 5: Motor de Generación IA

**Estado:** ✅ COMPLETADA
**Fecha inicio:** 2025-12-26
**Fecha fin:** 2025-12-26
**Objetivo:** Generar páginas del cuento con face-swap usando Gemini AI

### Tareas Completadas

- [x] Crear `/server/utils/prompt-builder.ts` - Constructor de prompts
  - buildPromptForPage() - Reemplaza variables dinámicas
  - buildSimplePrompt() - Prompts simplificados
  - validatePromptTemplate() - Validación
  - getGenerationSummary() - Resúmenes legibles
- [x] Crear `/server/api/session/[id]/generate.post.ts` - Endpoint generación
  - Carga story config, prompts, imágenes base
  - Crea collage automático de fotos usuario (Sharp)
  - Construye prompt con metadata de página
  - Llama Gemini con retry (exponential backoff)
  - Guarda imágenes en data/sessions/{id}/generated/
  - Actualiza currentState con versiones
  - Tracking de progress (current/total)
  - Soporte para regeneración (máx 3)
- [x] Crear `/app/pages/story/[id]/generate.vue` - Página progreso
  - Generación secuencial automática
  - Progress bar con porcentaje
  - Grid de estados por página (⏳✨✅❌)
  - Info de página actual en generación
  - Preview de imágenes generadas
  - Animaciones profesionales con Tailwind
  - Manejo completo de errores
- [x] Integrar navegación desde upload.vue

### Archivos Creados

- `server/utils/prompt-builder.ts` - 95 líneas
- `server/api/session/[id]/generate.post.ts` - 200 líneas
- `app/pages/story/[id]/generate.vue` - 250 líneas
- `app/pages/story/[id]/upload.vue` - Actualizada

### Flujo Implementado

1. Usuario sube fotos → Navega a `/story/{id}/generate`
2. Carga automáticamente story config y sesión
3. Genera 5 páginas secuencialmente:
   - Carga prompt template + imagen base
   - Crea collage de fotos usuario
   - Construye prompt con variables reemplazadas
   - Llama Gemini 2.5 Flash Image
   - Guarda PNG en data/sessions/{id}/generated/
   - Actualiza currentState y progress
4. Muestra preview de páginas generadas
5. Al completar → Mensaje de éxito (Preview en Fase 6)

### Notas de Aprendizaje

- Sistema de variables en prompts muy flexible ({SCENE_DESCRIPTION}, etc.)
- Generación secuencial es más estable que paralela
- Sharp para collages funciona perfecto
- Gemini con retry maneja errores de red
- currentState permite sistema de versiones
- UI con progreso real es crucial para UX

### Decisión Técnica

**Regeneración integrada desde el inicio:**
- Endpoint generate.post.ts ya soporta regenerate: true
- Valida límite de 3 regeneraciones
- Incrementa versión automáticamente
- Sistema de versiones permite rollback futuro

---

## 📝 FASE 6: Preview y Carrusel

**Estado:** 📝 PENDIENTE
**Objetivo:** Mostrar las páginas generadas en un carrusel interactivo

### Tareas Pendientes

- [ ] Decidir librería de carrusel (Swiper.js o custom)
- [ ] Crear `/app/components/story/StoryPageCard.vue`
- [ ] Crear `/app/components/story/StoryCarousel.vue`
- [ ] Crear `/app/pages/story/[storyId]/preview.vue`

---

## 📝 FASE 7: Sistema de Regeneración

**Estado:** 📝 PENDIENTE
**Objetivo:** Permitir regenerar páginas hasta 3 veces y guardar versiones

### Tareas Pendientes

- [ ] Extender `/server/api/story/generate-page.post.ts` con lógica de versiones
- [ ] Implementar gestión de current-state en `useGeneration.ts`
- [ ] Crear `/app/components/story/RegenerationControl.vue`
- [ ] Integrar control en `StoryPageCard.vue`

---

## 📝 FASE 8: Prompts del Cuento de Prueba

**Estado:** 📝 PENDIENTE
**Objetivo:** Escribir prompts de calidad para las 5 páginas

### Tareas Pendientes

- [ ] Analizar cada imagen base
- [ ] Escribir prompts optimizados
- [ ] Actualizar metadata en `config.json`
- [ ] Probar y ajustar calidad
- [ ] Documentar en `/docs/PROMPTS.md`

---

## 📝 FASE 9: Pulido y Optimización

**Estado:** 📝 PENDIENTE
**Objetivo:** Mejorar UX, rendimiento y manejo de errores

### Tareas Pendientes

- [ ] Optimizaciones de rendimiento
- [ ] Mejoras de UX (skeletons, transiciones)
- [ ] Manejo robusto de errores
- [ ] Testing manual completo

---

## 📝 FASE 10: Documentación Final

**Estado:** 📝 PENDIENTE
**Objetivo:** Documentar toda la arquitectura y APIs

### Tareas Pendientes

- [ ] Crear `/docs/ARCHITECTURE.md`
- [ ] Crear `/docs/API.md`
- [ ] Crear `/docs/PROMPTS.md`
- [ ] Actualizar este documento con notas finales

---

## 🔮 Fases Futuras (Post-MVP)

### FASE 11: Cuentos Adicionales
- Crear 3-4 cuentos más con ~10 páginas cada uno

### FASE 12: Sistema de Pedidos de Impresión
- Integración con print-on-demand
- Checkout y pagos

### FASE 13: Panel de Administración
- CRUD de cuentos
- Gestión de pedidos

### FASE 14: Autenticación y Cuentas
- Login/registro
- Historial de pedidos

### FASE 15: Escalado a Producción
- Cloud storage
- Queue system
- CDN
- Monitoring

---

## 📈 Métricas y KPIs

- **Tiempo total invertido:** 1-2 horas (Fase 1)
- **Líneas de código escritas:** ~800
- **Archivos creados:** 14
- **Tests pasados:** N/A (sin tests aún)

---

## 🗒️ Notas Generales

- Hacer commits frecuentes al finalizar cada sub-fase
- Probar cada endpoint/componente antes de avanzar
- Mantener imágenes originales en `public/img/` hasta confirmar migración exitosa
- La `NUXT_GEMINI_API_KEY` ya está configurada en `.env`

---

**Siguiente acción recomendada:** Iniciar Fase 2 - Gestión de Sesiones
