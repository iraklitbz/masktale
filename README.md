# 🎨 Mask - Plataforma de Cuentos Personalizados con IA

Una aplicación web que permite crear cuentos infantiles personalizados usando Inteligencia Artificial. Los usuarios suben una foto de su hijo/a, seleccionan un cuento, y la IA genera ilustraciones personalizadas con face-swap.

---

## 🚀 Quick Start

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Build para producción
pnpm build
```

---

## 📊 Estado del Proyecto

**🟢 EN DESARROLLO ACTIVO**

- **Fase actual:** Fase 1 completada ✅
- **Próxima fase:** Fase 2 - Gestión de Sesiones
- **Progreso general:** 10% (1 de 10 fases completadas)

👉 **Ver estado detallado:** [`CURRENT_STATUS.md`](./CURRENT_STATUS.md) ← **LEE ESTO PRIMERO AL RETOMAR**

---

## 🗂️ Documentación

| Documento | Descripción |
|-----------|-------------|
| **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** | 🔴 **Estado actual y próximos pasos** (actualizado cada sesión) |
| **[docs/PHASES.md](./docs/PHASES.md)** | Tracker detallado de las 10 fases |
| **Plan Completo** | Plan de implementación completo en ~/.claude/plans/ |

---

## 🏗️ Arquitectura

```
mask/
├── app/
│   ├── components/story/      # Componentes de cuentos (futuro)
│   ├── composables/           # Lógica reutilizable (futuro)
│   ├── pages/                 # Rutas de la app
│   ├── types/                 # ✅ Definiciones TypeScript
│   └── utils/                 # Utilidades (futuro)
│
├── server/
│   ├── api/                   # Endpoints de la API
│   │   ├── generate-image.post.ts  # ✅ Generación actual (a refactorizar)
│   │   ├── session/           # Gestión de sesiones (Fase 2)
│   │   ├── story/             # APIs de cuentos (Fase 3)
│   │   └── upload/            # Upload de fotos (Fase 4)
│   └── utils/                 # ✅ Utilidades server-side
│       ├── gemini.ts          # Cliente Google Gemini
│       ├── image-processor.ts # Procesamiento con Sharp
│       ├── session-manager.ts # Gestión de sesiones (Fase 2)
│       └── prompt-builder.ts  # Constructor de prompts (Fase 5)
│
├── data/
│   ├── stories/               # ✅ Configuración de cuentos
│   │   └── story-001-first-day-school/
│   │       ├── config.json    # Config del cuento
│   │       ├── base-images/   # Imágenes base (5)
│   │       └── prompts/       # Prompts por página (5)
│   └── sessions/              # Sesiones temporales (24h)
│
├── docs/                      # ✅ Documentación del proyecto
└── public/                    # Archivos estáticos
```

---

## 🛠️ Stack Tecnológico

- **Framework:** Nuxt 3 (v4.2.2)
- **Frontend:** Vue 3 + Tailwind CSS 4
- **IA:** Google Gemini 2.5 Flash Image
- **Procesamiento:** Sharp (imágenes)
- **Storage:** Sistema de archivos local (JSON + imágenes)
- **Tipos:** TypeScript
- **Package Manager:** pnpm

---

## 📖 Cuentos Disponibles

### ✅ Story 001: Mi Primer Día de Escuela
- **Páginas:** 5
- **Estilo:** Acuarela
- **Tema:** Educación
- **Edad:** 3-8 años
- **Estado:** Configurado y listo

### 🔮 Futuros cuentos (Fase 11)
- Aventura en el Parque (10 páginas)
- Fiesta de Cumpleaños (10 páginas)
- Día en la Playa (10 páginas)
- Visita al Zoo (10 páginas)

---

## 🎯 Roadmap

### MVP (Fases 1-10)
- [x] **Fase 1:** Fundación y Estructura ✅
- [ ] **Fase 2:** Gestión de Sesiones ⏳ **← PRÓXIMA**
- [ ] **Fase 3:** Sistema de Cuentos
- [ ] **Fase 4:** Upload de Foto
- [ ] **Fase 5:** Motor de Generación IA
- [ ] **Fase 6:** Preview y Carrusel
- [ ] **Fase 7:** Sistema de Regeneración (3 intentos)
- [ ] **Fase 8:** Prompts Optimizados
- [ ] **Fase 9:** Pulido y Optimización
- [ ] **Fase 10:** Documentación Final

### Post-MVP (Fases 11-15)
- [ ] **Fase 11:** Cuentos Adicionales (4-5 más)
- [ ] **Fase 12:** Sistema de Pedidos de Impresión
- [ ] **Fase 13:** Panel de Administración
- [ ] **Fase 14:** Autenticación y Cuentas de Usuario
- [ ] **Fase 15:** Escalado a Producción

---

## ⚙️ Configuración

### Variables de Entorno

Archivo `.env` (ya configurado):
```
NUXT_GEMINI_API_KEY=AIzaSy...
```

### Requisitos
- Node.js 18+
- pnpm 8+

---

## 🚦 Flujo de Usuario (Visión Final)

```
1. Inicio → Selector de Cuentos
2. Selecciona cuento → Crea sesión
3. Upload 1-3 fotos del niño
4. IA genera 5 páginas (con progreso)
5. Preview en carrusel
6. Regenerar páginas (hasta 3 veces)
7. Descargar PDF o encargar impresión
```

---

## 📝 Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Linting
pnpm lint
pnpm lint:fix

# Ver estructura de datos
ls -R data/stories/
ls -R data/sessions/

# Ver tipos
cat app/types/story.ts
cat app/types/session.ts
```

---

## 🤝 Colaboración

Este proyecto sigue un enfoque de desarrollo incremental por fases. Cada fase se documenta completamente antes de continuar con la siguiente.

**Para retomar el desarrollo:**
1. Lee [`CURRENT_STATUS.md`](./CURRENT_STATUS.md)
2. Revisa la fase actual en [`docs/PHASES.md`](./docs/PHASES.md)
3. Consulta el plan completo si es necesario

---

## 📄 Licencia

Privado - Mask Stories © 2025

---

**Última actualización:** 2025-12-19
**Desarrollado con:** Claude Code + Claude Sonnet 4.5
