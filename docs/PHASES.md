# Tracker de Fases - Plataforma de Cuentos Personalizados

**Última actualización:** 2025-12-26 16:50
**Estado general:** 🚧 En desarrollo - Fase 7A completada

---

## 📊 Progreso General

```
Fase 1:  ████████████████████ 100% ✅ COMPLETADA
Fase 2:  ████████████████████ 100% ✅ COMPLETADA
Fase 3:  ████████████████████ 100% ✅ COMPLETADA
Fase 4:  ████████████████████ 100% ✅ COMPLETADA
Fase 5:  ████████████████████ 100% ✅ COMPLETADA
Fase 6:  ████████████████████ 100% ✅ COMPLETADA
Fase 7A: ████████████████████ 100% ✅ COMPLETADA (Prompts IA)
Fase 7B: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente (Mejoras UX)
Fase 7C: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente (Funcionalidades)
Fase 9:  ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente (PDF Export)
Fase 10: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente (Deploy)
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

## ✅ FASE 6: Preview y Carrusel de Páginas

**Estado:** ✅ COMPLETADA
**Fecha inicio:** 2025-12-26
**Fecha fin:** 2025-12-26
**Objetivo:** Mostrar las páginas generadas en un carrusel interactivo con regeneración

### Tareas Completadas

- [x] Crear `/app/components/story/PageCarousel.vue` - Carrusel custom con VueUse
  - Navegación con flechas prev/next
  - Indicadores de página (dots)
  - Swipe gestures con useSwipe
  - Keyboard navigation con useMagicKeys
  - Transiciones animadas
  - Overlay con info de versión
  - Botón regenerar integrado
- [x] Crear `/app/pages/story/[id]/preview.vue` - Página preview completa
  - Estados: loading, error, empty, success
  - Warning para cuentos incompletos
  - Overlay regeneración con spinner
  - Sección informativa
  - Navegación completa
- [x] Crear composable `/app/composables/useSessionState.ts`
  - Gestión reactiva de estado de sesión
  - URLs de imágenes por versión
  - Validación de límites de regeneración
- [x] Crear endpoints API:
  - `/server/api/session/[id]/state.get.ts` - Estado completo
  - `/server/api/session/[id]/image/[page].get.ts` - Servir imágenes
  - `/server/api/session/[id]/regenerate.post.ts` - Regenerar página
- [x] Integrar navegación desde generate.vue

### Archivos Creados

- `app/components/story/PageCarousel.vue` - 380 líneas
- `app/pages/story/[id]/preview.vue` - 295 líneas
- `app/composables/useSessionState.ts` - 95 líneas
- `server/api/session/[id]/state.get.ts` - 30 líneas
- `server/api/session/[id]/image/[page].get.ts` - 55 líneas
- `server/api/session/[id]/regenerate.post.ts` - 50 líneas

### Características Implementadas

- **Carrusel interactivo** con navegación fluida
- **Swipe gestures** para móvil (VueUse)
- **Keyboard navigation** (flechas izquierda/derecha)
- **Regeneración** con límite de 3 intentos por página
- **Sistema de versiones** automático
- **Estados visuales** por página (generando, completado, error)
- **Responsive design** completo
- **Transiciones** profesionales con Tailwind

### Tests Realizados

- ✅ Carrusel navega correctamente entre páginas
- ✅ Swipe funciona en móvil
- ✅ Teclado navega con flechas
- ✅ Regeneración crea nuevas versiones
- ✅ Límite de 3 regeneraciones se valida
- ✅ Imágenes se cargan correctamente
- ✅ Estados de error se manejan bien
- ✅ Warning de cuento incompleto se muestra

### Notas de Aprendizaje

- VueUse (useSwipe, useMagicKeys) perfecto para interacciones
- Tailwind v4 NO soporta `@apply` con utilities igual que v3
- Convertir a vanilla CSS es más estable en Tailwind v4
- Sistema de versiones permite rollback futuro
- Overlay con backdrop-blur mejora UX

### Issues Resueltos

- **Tailwind v4 compatibility**: Convertidos todos los `@apply` a vanilla CSS
- **Gemini API crashes**: Agregada validación defensiva de response
- **Failed page recovery**: Botones retry y continue to preview
- **Module import errors**: Limpieza de cache `.nuxt` y reinicio

---

## ✅ FASE 7A: Optimización de Prompts de IA

**Estado:** ✅ COMPLETADA
**Fecha inicio:** 2025-12-26
**Fecha fin:** 2025-12-26
**Objetivo:** Mejorar la calidad de generación mediante prompts optimizados

### Tareas Completadas

- [x] Crear template maestro `/data/stories/.../prompts/PROMPT_TEMPLATE.txt`
  - Estructura profesional para face-swap
  - Secciones: Contexto, Tarea, Escena, Emoción, Estilo
  - Instrucciones detalladas de integración
  - Requisitos de calidad técnica
  - Checklist de verificación
- [x] Optimizar `/data/stories/.../prompts/page-01.txt` - Llegada a la Escuela
  - Análisis exhaustivo de características faciales
  - Posicionamiento preciso con coordenadas
  - Expresión: Emoción + nerviosismo
  - Iluminación matutina cálida
  - Preservación de escenario escolar
- [x] Optimizar `/data/stories/.../prompts/page-02.txt` - Conociendo la Clase
  - Expresión: Asombro y fascinación
  - Iluminación interior del aula
  - Preservación de elementos educativos
- [x] Optimizar `/data/stories/.../prompts/page-03.txt` - Aprendiendo
  - Expresión: Concentración genuina
  - Ángulo hacia abajo (mirando actividad)
  - Iluminación de aula con materiales
- [x] Optimizar `/data/stories/.../prompts/page-04.txt` - Recreo
  - Expresión: Alegría desbordante
  - Luz exterior brillante del mediodía
  - Sensación de movimiento dinámico
- [x] Optimizar `/data/stories/.../prompts/page-05.txt` - Regreso a Casa
  - Expresión: Satisfacción tranquila
  - Luz dorada del atardecer
  - Atmósfera nostálgica de cierre

### Archivos Actualizados

- `data/stories/story-001-first-day-school/prompts/PROMPT_TEMPLATE.txt` - 76 líneas
- `data/stories/story-001-first-day-school/prompts/page-01.txt` - 86 líneas (de 21)
- `data/stories/story-001-first-day-school/prompts/page-02.txt` - 80 líneas (de 21)
- `data/stories/story-001-first-day-school/prompts/page-03.txt` - 80 líneas (de 21)
- `data/stories/story-001-first-day-school/prompts/page-04.txt` - 87 líneas (de 21)
- `data/stories/story-001-first-day-school/prompts/page-05.txt` - 89 líneas (de 21)

### Mejoras Implementadas

#### 1. Instrucciones de Face-Swap Detalladas
- Análisis de forma de cara, ojos, nariz, boca
- Tono de piel, textura de cabello
- Rasgos distintivos (pecas, hoyuelos)
- Posicionamiento con coordenadas {FACE_POSITION_X/Y}
- Tamaño proporcional al cuerpo

#### 2. Mayor Calidad Técnica
- Especificaciones de iluminación por tipo de escena:
  - Mañana: Luz cálida desde arriba-izquierda
  - Interior: Luz difusa del aula
  - Mediodía: Luz brillante exterior
  - Atardecer: Luz dorada con tonos rosados
- Requisitos de sombras y highlights específicos
- Integración natural cara-cuerpo sin artefactos
- Detalles nítidos en todas las condiciones

#### 3. Mejor Consistencia de Estilo
- Preservación clara de elementos por escena
- Guías de composición específicas
- Atmósfera definida para cada momento del día
- Estilo {ILLUSTRATION_STYLE} consistente

#### 4. Guías Emocionales Precisas
- Expresiones específicas por contexto narrativo
- Dirección de mirada coherente con escena
- Lenguaje corporal y facial sincronizado
- Intensidad emocional apropiada

#### 5. Verificación de Calidad
- Checklist de 6 puntos por página
- Resultado esperado claramente definido
- Control de calidad profesional

### Notas de Aprendizaje

- Prompts más largos y detallados = mejor calidad de face-swap
- Especificar iluminación es crucial para integración natural
- Guías emocionales específicas mejoran expresiones
- Variables dinámicas {SCENE_DESCRIPTION}, {EMOTIONAL_TONE}, etc. mantienen flexibilidad
- Checklist de verificación ayuda a validar resultados

### Próximos Pasos Recomendados

1. **Probar prompts optimizados** (RECOMENDADO)
   - Generar un cuento nuevo con los prompts mejorados
   - Comparar calidad vs. versiones anteriores
   - Ajustar si es necesario

2. **Documentar resultados** en `/docs/PROMPTS.md`
   - Antes/después comparisons
   - Best practices aprendidas
   - Guidelines para futuros cuentos

---

## 📝 FASE 7B: Mejoras de UX

**Estado:** 📝 PENDIENTE
**Objetivo:** Pulir la experiencia de usuario con mejores componentes visuales

### Tareas Pendientes

- [ ] Implementar loading skeletons en preview
- [ ] Mejorar transiciones entre estados
- [ ] Reemplazar `alert()` con toast notifications
- [ ] Añadir feedback visual mejorado
- [ ] Optimizar animaciones
- [ ] Mobile UX improvements

---

## 📝 FASE 7C: Funcionalidades Adicionales

**Estado:** 📝 PENDIENTE
**Objetivo:** Agregar características para mejor control de versiones

### Tareas Pendientes

- [ ] Historial completo de versiones por página
- [ ] Comparador de versiones lado a lado
- [ ] Selector de versión favorita
- [ ] Mejoras en UI de regeneración
- [ ] Preview de versiones antes de seleccionar

---

## 📝 FASE 9: Exportación a PDF

**Estado:** 📝 PENDIENTE
**Objetivo:** Permitir descargar el cuento completo como PDF profesional

### Tareas Pendientes

- [ ] Decidir librería (jsPDF, Puppeteer, o pdf-lib)
- [ ] Diseñar layout del cuento PDF
  - Portada con título y foto del niño
  - Página por ilustración con texto
  - Contraportada opcional
- [ ] Crear endpoint `/server/api/session/[id]/export-pdf.post.ts`
- [ ] Implementar botón "Descargar PDF" en preview.vue
- [ ] Optimizar imágenes para PDF (compresión)
- [ ] Probar calidad de impresión

---

## 📝 FASE 10: Deploy y Producción

**Estado:** 📝 PENDIENTE
**Objetivo:** Desplegar aplicación a producción

### Tareas Pendientes

- [ ] Preparar para deploy (env vars, build)
- [ ] Elegir hosting (Vercel, Netlify, o VPS)
- [ ] Configurar dominio
- [ ] Setup analytics
- [ ] Monitoreo de errores (Sentry)
- [ ] Optimizaciones de producción
- [ ] Documentación final en `/docs/`

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

- **Fases completadas:** 7 de 10 (Fases 1-6, 7A)
- **Tiempo total invertido:** ~8-10 horas
- **Líneas de código escritas:** ~3,500+
- **Archivos creados:** 40+
- **Archivos optimizados:** 6 prompts
- **Tests pasados:** Manual testing exitoso
- **Estado MVP:** ✅ Funcional + Prompts optimizados

---

## 🗒️ Notas Generales

- Hacer commits frecuentes al finalizar cada sub-fase
- Probar cada endpoint/componente antes de avanzar
- Mantener imágenes originales en `public/img/` hasta confirmar migración exitosa
- La `NUXT_GEMINI_API_KEY` ya está configurada en `.env`

---

**Siguiente acción recomendada:**
1. **Probar prompts optimizados** - Generar un cuento nuevo y verificar mejoras
2. **Fase 7B** - Mejoras de UX (toast notifications, loading skeletons)
3. **Fase 7C** - Funcionalidades adicionales (historial de versiones)
4. **Fase 9** - Exportación a PDF
