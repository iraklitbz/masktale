# 📍 Estado Actual del Proyecto - Mask (Cuentos Personalizados con IA)

**Última actualización:** 2025-12-19 23:00
**Última sesión:** Fase 1 completada
**Próxima acción:** Continuar con Fase 2 (Gestión de Sesiones)

---

## 🎯 Resumen Ejecutivo

Este es un proyecto de plataforma web para crear cuentos infantiles personalizados usando IA (Google Gemini). El usuario sube una foto de su hijo/a, selecciona un cuento, y la IA genera ilustraciones personalizadas con face-swap.

**Tecnologías:** Nuxt 3, Vue 3, Tailwind CSS, Google Gemini AI, Sharp

---

## ✅ Fase Actual: FASE 1 COMPLETADA (100%)

**Fecha completada:** 2025-12-19

### Lo que se ha construido:

#### 1. Estructura de Carpetas ✅
```
data/stories/story-001-first-day-school/
  ├── config.json (cuento configurado: 5 páginas)
  ├── base-images/ (5 imágenes migradas de public/img/)
  └── prompts/ (5 prompts con sistema de variables)

app/types/
  ├── story.ts (tipos completos de cuentos)
  └── session.ts (tipos completos de sesiones)

server/utils/
  ├── image-processor.ts (Sharp utils + createImageCollage)
  └── gemini.ts (cliente Gemini con retry)

docs/
  ├── PHASES.md (tracker detallado de 10 fases)
  └── CURRENT_STATUS.md (este archivo)
```

#### 2. Código Reutilizable ✅
- **`createImageCollage()`** - Extraído del código original, crea collages horizontales
- **`generateImageWithRetry()`** - Cliente Gemini con exponential backoff
- **Tipos TypeScript completos** - Todo tipado (StoryConfig, Session, CurrentState, etc.)

#### 3. Primer Cuento Configurado ✅
- **ID:** story-001-first-day-school
- **Título:** "Mi Primer Día de Escuela"
- **Páginas:** 5 páginas con imágenes base y prompts
- **Metadatos:** Posición de cara, tono emocional, dificultad por página

---

## 🚀 Próxima Acción: FASE 2 - Gestión de Sesiones

**Objetivo:** Implementar sistema de sesiones temporales (24h) para guardar el progreso del usuario

### Archivos a crear en Fase 2:

1. **`/server/utils/session-manager.ts`**
   - `createSession(storyId)` - Crear sesión con UUID
   - `getSession(sessionId)` - Cargar sesión existente
   - `saveMetadata(sessionId, data)` - Guardar metadata
   - `cleanExpiredSessions()` - Limpiar sesiones >24h

2. **`/server/api/session/create.post.ts`**
   - Endpoint: `POST /api/session/create`
   - Body: `{ storyId: string }`
   - Response: `{ sessionId, expiresAt, storyId }`

3. **`/server/api/session/[id].get.ts`**
   - Endpoint: `GET /api/session/{sessionId}`
   - Response: `{ session: Session, currentState: CurrentState }`

4. **`/app/composables/useSession.ts`**
   - `createSession(storyId)` - Llamar API + guardar en localStorage
   - `loadSession(sessionId)` - Recuperar sesión
   - `clearSession()` - Limpiar estado
   - Estado reactivo con `useState`

### Flujo de la Fase 2:
1. Usuario selecciona un cuento → Llamar `createSession(storyId)`
2. Backend crea carpeta en `data/sessions/{uuid}/`
3. Guardar `metadata.json` con info de sesión
4. Retornar sessionId al frontend
5. Frontend guarda sessionId en localStorage
6. Composable permite recuperar sesión al recargar página

**Tiempo estimado:** 1-2 horas

---

## 📚 Documentación de Referencia

### Para retomar el proyecto:

1. **Plan completo:** `/Users/iraklitbz/.claude/plans/purrfect-crafting-emerson.md`
   - 10 fases detalladas
   - Arquitectura completa
   - Modelos de datos
   - APIs especificadas

2. **Tracker de fases:** `/Users/iraklitbz/Desktop/apps/webs/mask/docs/PHASES.md`
   - Progreso de cada fase
   - Tareas completadas y pendientes
   - Notas de aprendizaje

3. **Este archivo:** `/Users/iraklitbz/Desktop/apps/webs/mask/CURRENT_STATUS.md`
   - Estado actual
   - Próxima acción inmediata

### Archivos clave del proyecto:

- **Config del cuento:** `data/stories/story-001-first-day-school/config.json`
- **Tipos:** `app/types/story.ts`, `app/types/session.ts`
- **Utilidades:** `server/utils/image-processor.ts`, `server/utils/gemini.ts`
- **API actual:** `server/api/generate-image.post.ts` (a refactorizar en fases futuras)

---

## 🔑 Decisiones Técnicas Tomadas

1. ✅ **Google Gemini** para generación (ya configurado, API key en `.env`)
2. ✅ **JSON files** para configuración de cuentos (sin base de datos)
3. ✅ **Sistema de archivos local** para almacenamiento temporal
4. ✅ **Sin autenticación** en fase inicial (sesiones anónimas)
5. ✅ **3 regeneraciones máx** por página, guardando versiones

---

## 📝 Comandos Útiles

```bash
# Iniciar dev server
pnpm dev

# Ver estructura del proyecto
ls -R data/

# Ver sesiones activas (cuando existan)
ls data/sessions/

# Limpiar sesiones expiradas manualmente (futuro)
# node scripts/clean-sessions.js
```

---

## 🎨 Flujo de Usuario Final (Visión Completa)

1. **Página de inicio** → Selector de cuentos (grid de tarjetas)
2. **Selecciona cuento** → Crea sesión → Redirige a `/story/{id}/upload`
3. **Upload foto** → Sube 1-3 fotos del niño → `/story/{id}/generate`
4. **Generación** → IA genera 5 páginas (barra de progreso) → `/story/{id}/preview`
5. **Preview** → Carrusel de páginas, puede regenerar hasta 3 veces por página
6. **Finalizar** → Descargar PDF o encargar impresión (fase futura)

---

## 🐛 Issues Conocidos

- Las imágenes originales en `public/img/` aún existen (backup, no borrar aún)
- El archivo `public/img/test.jpg` fue eliminado pero está en git status
- El endpoint actual `/api/generate-image` funciona pero será refactorizado en Fase 5

---

## 💡 Notas para la Próxima Sesión

### Al retomar mañana:

1. **Leer este archivo primero** (`CURRENT_STATUS.md`)
2. **Revisar Fase 2 en** `docs/PHASES.md`
3. **Empezar creando** `server/utils/session-manager.ts`
4. **Continuar secuencialmente** con los archivos listados arriba

### Contexto Importante:

- El usuario quiere un flujo por fases, documentado
- Prefiere avanzar paso a paso, probando cada fase
- El proyecto debe ser profesional y escalable
- Solo hay 1 cuento de 5 páginas por ahora (MVP)
- En el futuro habrá 4-5 cuentos de ~10 páginas cada uno

### Ambiente:

- **Directorio:** `/Users/iraklitbz/Desktop/apps/webs/mask/`
- **Branch:** `feature/sliders`
- **Node/pnpm:** Configurado
- **API Key:** Ya en `.env` como `NUXT_GEMINI_API_KEY`

---

## ✨ Próximas 3 Fases (Roadmap)

**FASE 2 (Próxima):** Gestión de Sesiones
**FASE 3:** Sistema de Cuentos (API + Selector UI)
**FASE 4:** Upload de Foto del Niño

Después de estas 3 fases, tendremos la base completa para la generación con IA.

---

**🎯 Acción Inmediata al Retomar:**
Crear `/server/utils/session-manager.ts` con funciones de gestión de sesiones.

---

_Este archivo se actualiza al final de cada sesión para mantener el contexto._
