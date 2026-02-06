# Strapi Schemas - Sessions

## Instrucciones

### 1. Copia los archivos a tu Strapi

```bash
# Desde tu Mac al NAS/Docker de Strapi
docker cp strapi-schemas/src/api/session tu-contenedor:/srv/app/src/api/
docker cp strapi-schemas/src/api/generated-image tu-contenedor:/srv/app/src/api/
```

### 2. Reinicia Strapi

```bash
docker restart tu-contenedor-strapi
```

### 3. Configura permisos en Strapi Admin

Ve a **Settings** → **Users & Permissions** → **Roles** → **Public**

**NO habilites permisos públicos** - usaremos el API Token.

Ve a **Settings** → **API Tokens** → edita tu token existente:

- **Session**: habilita `create`, `find`, `findOne`, `update`, `delete`
- **Generated-image**: habilita `create`, `find`, `findOne`, `update`, `delete`

### 4. Verifica

```bash
# Debería devolver array vacío (no error 403)
curl -H "Authorization: Bearer TU_TOKEN" https://cms.iraklitbz.dev/api/sessions
```

---

## Estructura creada

```
src/api/
├── session/
│   ├── content-types/session/schema.json
│   ├── controllers/session.js
│   ├── routes/session.js
│   └── services/session.js
└── generated-image/
    ├── content-types/generated-image/schema.json
    ├── controllers/generated-image.js
    ├── routes/generated-image.js
    └── services/generated-image.js
```

## Campos

### Session
| Campo | Tipo | Descripción |
|-------|------|-------------|
| sessionId | UID | UUID único |
| storyId | String | ID del cuento |
| childName | String | Nombre del niño |
| childPhoto | Media | Foto original |
| childPhotoBase64 | Text | Foto en base64 (para Gemini) |
| status | Enum | created/photo_uploaded/generating/completed |
| currentPage | Integer | Página actual |
| totalPages | Integer | Total de páginas |
| expiresAt | DateTime | Cuándo expira |
| generatedImages | Relation | Imágenes generadas |

### GeneratedImage
| Campo | Tipo | Descripción |
|-------|------|-------------|
| pageNumber | Integer | Número de página |
| version | Integer | Versión (1, 2, 3...) |
| image | Media | Imagen generada |
| isSelected | Boolean | Si está seleccionada |
| isFavorite | Boolean | Si es favorita |
| session | Relation | Sesión padre |
