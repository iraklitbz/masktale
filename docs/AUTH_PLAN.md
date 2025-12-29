# 🔐 Plan de Implementación - Sistema de Autenticación

**Proyecto:** Mask - Cuentos Personalizados
**Backend:** Strapi v5 (https://cms.iraklitbz.dev)
**Frontend:** Nuxt 3 + @nuxtjs/strapi
**Fecha inicio:** 2025-12-29

---

## 📋 Resumen Ejecutivo

Implementación de un sistema de autenticación completo que incluye:
- ✅ Login / Registro
- ✅ Recuperar contraseña / Reset password
- ✅ Gestión de sesiones con JWT
- ✅ Protección de rutas
- ✅ Integración con sesiones anónimas existentes
- 🔄 OAuth Google (Fase futura)

---

## 🎯 FASE 1: Configuración Base

### 1.1 Verificar Strapi (Backend)

**En Strapi Admin Panel:**

1. **Users & Permissions Plugin** debe estar activo
   - `Settings > Users & Permissions plugin`
   - Verificar que esté instalado y habilitado

2. **Roles configurados:**
   - `Public` (para rutas no autenticadas)
   - `Authenticated` (para usuarios logueados)

3. **Email Provider configurado:**
   - `Settings > Email plugin`
   - Configurar SMTP (SendGrid, AWS SES, etc.)
   - Necesario para "forgot password"

4. **Endpoints que necesitamos:**
   - `POST /api/auth/local` - Login
   - `POST /api/auth/local/register` - Register
   - `POST /api/auth/forgot-password` - Forgot password
   - `POST /api/auth/reset-password` - Reset password
   - `GET /api/users/me` - Get current user

5. **Permisos públicos necesarios:**
   - `auth.local` → Public ✓
   - `auth.local.register` → Public ✓
   - `auth.forgot-password` → Public ✓
   - `auth.reset-password` → Public ✓

### 1.2 Crear Tipos TypeScript

**Archivo:** `app/types/auth.ts`

Tipos necesarios:
- `User` - Usuario autenticado
- `LoginCredentials` - Email + Password
- `RegisterData` - Email + Username + Password
- `ForgotPasswordData` - Email
- `ResetPasswordData` - Code + Password + PasswordConfirmation
- `AuthState` - Estado global de autenticación

---

## 🎯 FASE 2: Composable de Autenticación

### 2.1 Crear useAuth Composable

**Archivo:** `app/composables/useAuth.ts`

**Funcionalidades:**
- `login(email, password)` - Autenticar usuario
- `register(data)` - Crear cuenta nueva
- `logout()` - Cerrar sesión
- `forgotPassword(email)` - Solicitar reset
- `resetPassword(code, password)` - Cambiar contraseña
- `fetchUser()` - Obtener usuario actual
- `isAuthenticated` - Computed boolean
- `user` - Ref con datos del usuario

**Estado global con useState:**
```typescript
const authUser = useState<User | null>('auth-user', () => null)
const authToken = useState<string | null>('auth-token', () => null)
```

---

## 🎯 FASE 3: Páginas de Autenticación

### 3.1 Página de Login

**Ruta:** `/login`
**Archivo:** `app/pages/login.vue`

**Características:**
- Form con email + password
- Validación inline
- Toast de errores/éxito
- Link a "Forgot password"
- Link a "Register"
- Redirect después de login

### 3.2 Página de Registro

**Ruta:** `/register`
**Archivo:** `app/pages/register.vue`

**Características:**
- Form con username + email + password + confirm password
- Validación inline
- Verificación de password match
- Password strength indicator
- Toast de errores/éxito
- Link a "Login"
- Auto-login después de registro

### 3.3 Página Forgot Password

**Ruta:** `/forgot-password`
**Archivo:** `app/pages/forgot-password.vue`

**Características:**
- Form con solo email
- Envía email con código de reset
- Mensaje de éxito
- Link a "Login"

### 3.4 Página Reset Password

**Ruta:** `/reset-password`
**Archivo:** `app/pages/reset-password.vue`

**Características:**
- Recibe code por query param `?code=XXX`
- Form con new password + confirm password
- Validación de password match
- Toast de éxito
- Redirect a login después de reset

---

## 🎯 FASE 4: Middleware y Protección de Rutas

### 4.1 Auth Middleware

**Archivo:** `app/middleware/auth.ts`

**Funcionalidad:**
- Verificar si usuario está autenticado
- Si no está autenticado → Redirect a `/login`
- Si está autenticado → Permitir acceso

### 4.2 Guest Middleware

**Archivo:** `app/middleware/guest.ts`

**Funcionalidad:**
- Si usuario ya está autenticado → Redirect a `/`
- Si no está autenticado → Permitir acceso
- Útil para /login, /register (no deben acceder usuarios logueados)

### 4.3 Aplicar Middlewares

Rutas que necesitan `auth` middleware:
- ⚠️ Ninguna por ahora (sesiones anónimas funcionan)
- En el futuro: ver historial de cuentos guardados

Rutas que necesitan `guest` middleware:
- `/login`
- `/register`
- `/forgot-password`

---

## 🎯 FASE 5: Integración con App Existente

### 5.1 Componente de Header con Auth

**Modificar:** Header/Navigation

**Agregar:**
- Si no está autenticado:
  - Botón "Iniciar Sesión"
  - Botón "Registrarse"
- Si está autenticado:
  - Avatar del usuario
  - Dropdown menu:
    - Mi perfil
    - Mis cuentos
    - Configuración
    - Cerrar sesión

### 5.2 Migración de Sesiones Anónimas

**Estrategia:**

**OPCIÓN A (Recomendada):** Mantener sesiones anónimas + agregar auth opcional
- Las sesiones actuales siguen funcionando sin login
- Si usuario se registra → puede "reclamar" sesiones anónimas vinculándolas a su cuenta
- Ventaja: No romper funcionalidad existente
- Desventaja: Más compleja

**OPCIÓN B:** Requerir autenticación obligatoria
- Todos deben registrarse para usar la app
- Migrar filesystem sessions a DB
- Ventaja: Más simple
- Desventaja: Barrera de entrada para usuarios

**Para MVP: Recomiendo OPCIÓN A**

### 5.3 Página de Perfil

**Ruta:** `/profile`
**Archivo:** `app/pages/profile.vue`

**Características:**
- Ver datos del usuario
- Editar nombre, email
- Cambiar contraseña
- Ver cuentos generados (futuro)

---

## 🎯 FASE 6: OAuth Google (Futuro)

### 6.1 Configurar en Strapi

1. Instalar provider de Google
2. Configurar Google OAuth credentials
3. Callback URL configuration

### 6.2 Frontend

- Botón "Continuar con Google"
- Redirect flow
- Handle callback

---

## 📝 Checklist de Implementación

### Backend (Strapi)
- [ ] Users & Permissions plugin activo
- [ ] Email provider configurado (SMTP)
- [ ] Permisos públicos configurados
- [ ] Test endpoints con Postman/Thunder Client

### Frontend
- [ ] Tipos TypeScript creados
- [ ] useAuth composable implementado
- [ ] Página /login creada
- [ ] Página /register creada
- [ ] Página /forgot-password creada
- [ ] Página /reset-password creada
- [ ] Middleware auth creado
- [ ] Middleware guest creado
- [ ] Header con auth integrado
- [ ] Tests manuales de flujos completos

### Testing
- [ ] Registro de usuario nuevo funciona
- [ ] Login con credenciales correctas funciona
- [ ] Login con credenciales incorrectas muestra error
- [ ] Forgot password envía email
- [ ] Reset password cambia la contraseña
- [ ] Logout funciona correctamente
- [ ] Protección de rutas funciona
- [ ] Token persiste en cookies

---

## 🚀 Orden de Implementación Sugerido

1. **Día 1:** Configuración Strapi + Tipos + useAuth composable
2. **Día 2:** Páginas Login + Register
3. **Día 3:** Páginas Forgot/Reset Password
4. **Día 4:** Middlewares + Integración con header
5. **Día 5:** Testing + Ajustes + Página de perfil

---

## 📚 Recursos Útiles

- [Strapi v5 Auth Docs](https://docs.strapi.io/dev-docs/plugins/users-permissions)
- [Nuxt Strapi Module](https://strapi.nuxtjs.org/)
- [JWT Best Practices](https://jwt.io/introduction)

---

**Última actualización:** 2025-12-29
