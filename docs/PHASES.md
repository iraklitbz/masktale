# Tracker de Fases - Plataforma de Cuentos Personalizados

**Última actualización:** 2025-12-19
**Estado general:** 🚧 En desarrollo - Fase 1 completada

---

## 📊 Progreso General

```
Fase 1: ████████████████████ 100% ✅ COMPLETADA
Fase 2: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
Fase 3: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
Fase 4: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
Fase 5: ░░░░░░░░░░░░░░░░░░░░   0% 📝 Pendiente
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

## 📝 FASE 2: Gestión de Sesiones

**Estado:** 📝 PENDIENTE
**Objetivo:** Implementar creación, almacenamiento y recuperación de sesiones

### Tareas Pendientes

- [ ] Crear `/server/api/session/create.post.ts`
- [ ] Crear `/server/api/session/[id].get.ts`
- [ ] Crear `/server/utils/session-manager.ts`
- [ ] Crear `/app/composables/useSession.ts`
- [ ] Implementar limpieza de sesiones expiradas

---

## 📝 FASE 3: Sistema de Cuentos

**Estado:** 📝 PENDIENTE
**Objetivo:** Cargar y listar cuentos disponibles

### Tareas Pendientes

- [ ] Crear `/server/api/story/list.get.ts`
- [ ] Crear `/server/api/story/[id].get.ts`
- [ ] Crear `/app/composables/useStory.ts`
- [ ] Crear `/app/components/story/StorySelector.vue`
- [ ] Refactorizar `/app/pages/index.vue`

---

## 📝 FASE 4: Upload de Foto

**Estado:** 📝 PENDIENTE
**Objetivo:** Permitir al usuario subir foto del niño/a

### Tareas Pendientes

- [ ] Crear `/server/api/upload/photo.post.ts`
- [ ] Crear `/app/composables/useImageUpload.ts`
- [ ] Crear `/app/components/story/StoryUploader.vue`
- [ ] Crear `/app/pages/story/[storyId]/upload.vue`

---

## 📝 FASE 5: Motor de Generación IA

**Estado:** 📝 PENDIENTE
**Objetivo:** Generar páginas del cuento con face-swap usando Gemini

### Tareas Pendientes

- [ ] Crear `/server/utils/prompt-builder.ts`
- [ ] Crear `/server/api/story/generate-page.post.ts`
- [ ] Crear `/app/composables/useGeneration.ts`
- [ ] Crear `/app/pages/story/[storyId]/generate.vue`

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
