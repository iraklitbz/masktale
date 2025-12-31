# Plan de Integración de Stripe - Carrito de Compras y Pasarela de Pagos

**Fecha de creación:** 2025-12-30
**Rama:** feature/stripe
**Estado:** En planificación

---

## 📋 Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura Propuesta](#arquitectura-propuesta)
3. [Modelo de Datos](#modelo-de-datos)
4. [Fases de Implementación](#fases-de-implementación)
5. [Estructura de Archivos](#estructura-de-archivos)
6. [Decisiones Técnicas](#decisiones-técnicas)

---

## 🎯 Resumen Ejecutivo

### Objetivo
Transformar el flujo actual de descarga directa de PDFs en un sistema completo de e-commerce con:
- Carrito de compras persistente
- Proceso de checkout profesional
- Integración con Stripe como pasarela de pagos
- Gestión de órdenes en Strapi
- Almacenamiento de PDFs en Strapi con URLs permanentes

### Flujo Actual vs Flujo Nuevo

**ACTUAL:**
```
Generar libro → Preview → [Descargar PDF] → Fin
```

**NUEVO:**
```
Generar libro → Preview → [Agregar al carrito]
    ↓
Carrito (1-N libros) → Checkout (datos personales)
    ↓
Pago con Stripe → Orden guardada en Strapi + PDF subido
    ↓
Confirmación → Email con enlace de descarga (futuro)
```

### Características Clave
✅ Compra sin necesidad de login (checkout como invitado)
✅ Auto-rellenado de datos si el usuario está autenticado
✅ Carrito persistente en localStorage
✅ Direcciones de envío y facturación (opcionales por separado)
✅ Procesamiento seguro con Stripe Payment Intents
✅ Webhooks para confirmar pagos automáticamente
✅ PDFs almacenados permanentemente en Strapi
✅ Panel de usuario para ver historial de compras (Fase 6)

---

## 🏗️ Arquitectura Propuesta

### Stack Técnico Adicional
- **Stripe SDK:** `@stripe/stripe-js` (frontend)
- **Stripe Node:** `stripe` (backend)
- **Validación:** Zod (esquemas de validación)
- **Upload:** Strapi Upload API

### Componentes Principales

```
Frontend (Nuxt/Vue)
├── Composables
│   ├── useCart.ts                 # Gestión del carrito
│   ├── useCheckout.ts             # Proceso de checkout
│   └── useOrders.ts               # Historial de órdenes
├── Pages
│   ├── cart.vue                   # Página de carrito
│   ├── checkout.vue               # Página de checkout
│   ├── order/[id]/success.vue     # Confirmación de compra
│   └── profile/orders.vue         # Historial de órdenes
└── Components
    ├── cart/
    │   ├── CartIcon.vue           # Icono con badge en header
    │   ├── CartItem.vue           # Item individual del carrito
    │   ├── CartSummary.vue        # Resumen de precios
    │   └── CartDrawer.vue         # Mini carrito (opcional)
    ├── checkout/
    │   ├── CheckoutForm.vue       # Formulario completo
    │   ├── AddressForm.vue        # Formulario de dirección
    │   ├── StripePayment.vue      # Stripe Elements
    │   └── OrderSummary.vue       # Resumen de orden
    └── orders/
        ├── OrderCard.vue          # Tarjeta de orden
        └── OrderDetails.vue       # Detalles de orden

Backend (Nuxt Server)
├── api/
│   ├── cart/
│   │   └── validate.post.ts       # Validar items del carrito
│   ├── checkout/
│   │   ├── create-intent.post.ts  # Crear Payment Intent
│   │   └── confirm.post.ts        # Confirmar orden
│   ├── orders/
│   │   ├── index.get.ts           # Listar órdenes usuario
│   │   └── [id].get.ts            # Detalle de orden
│   ├── webhooks/
│   │   └── stripe.post.ts         # Webhooks de Stripe
│   └── pdf/
│       └── upload-to-strapi.post.ts # Subir PDF a Strapi
└── utils/
    ├── stripe.ts                  # Cliente de Stripe
    ├── pdf-uploader.ts            # Subida de PDFs
    └── order-processor.ts         # Procesamiento de órdenes

Strapi (CMS Backend)
└── Content Types
    ├── Order                      # Modelo de orden
    ├── OrderItem                  # Items de la orden
    └── Media                      # PDFs subidos
```

---

## 📊 Modelo de Datos

### 1. Content Type: Order (Strapi)

**Nombre de colección:** `orders`

```javascript
{
  // Información de la orden
  orderNumber: String (unique, required),        // ORD-{timestamp}-{random}
  state: Enum (required),                        // pending, processing, completed, failed, refunded
  totalAmount: Decimal (required),               // Total en EUR (ej: 29.99)
  currency: String (default: 'eur'),             // Moneda

  // Información del cliente
  customerEmail: Email (required),               // Email del cliente
  customerName: String (required),               // Nombre completo
  user: Relation (User, nullable),               // Relación con usuario si está logeado

  // Dirección de facturación
  billingAddress: Component (Address),

  // Dirección de envío
  shippingAddress: Component (Address),
  sameAsbilling: Boolean (default: false),      // Usar misma dirección

  // Items de la orden
  items: Relation (OrderItem, hasMany),          // Relación 1:N con items

  // Información de pago (Stripe)
  stripePaymentIntentId: String (unique),        // ID del Payment Intent
  stripePaymentStatus: String,                   // status de Stripe
  paymentMethod: String,                         // card, paypal, etc
  paidAt: DateTime (nullable),                   // Fecha de pago confirmado

  // Metadata
  createdAt: DateTime (auto),
  updatedAt: DateTime (auto),
  notes: Text (nullable),                        // Notas adicionales
}
```

### 2. Component: Address (Strapi)

**Nombre:** `address`

```javascript
{
  firstName: String (required),
  lastName: String (required),
  street: String (required),                     // Calle y número
  streetLine2: String (nullable),                // Piso, puerta, etc
  city: String (required),                       // Ciudad
  state: String (nullable),                      // Provincia/Estado
  postalCode: String (required),                 // Código postal
  country: String (required, default: 'ES'),     // Código de país ISO
  phone: String (nullable),                      // Teléfono
}
```

### 3. Content Type: OrderItem (Strapi)

**Nombre de colección:** `order-items`

```javascript
{
  // Relación con orden
  order: Relation (Order, belongsTo),            // Orden padre

  // Información del producto
  productType: String (default: 'personalized_book'), // Tipo de producto
  bookTitle: String (required),                  // Título del libro
  childName: String (required),                  // Nombre del niño
  storyId: String (required),                    // ID del cuento

  // Precio
  unitPrice: Decimal (required),                 // Precio unitario
  quantity: Integer (required, default: 1),      // Cantidad
  subtotal: Decimal (required),                  // unitPrice * quantity

  // Archivo PDF
  pdfFile: Media (single),                       // Archivo PDF subido
  pdfUrl: String (nullable),                     // URL pública del PDF

  // Metadata
  sessionId: String (nullable),                  // ID de sesión de generación
  generatedAt: DateTime,                         // Fecha de generación

  // Thumbnails y preview
  coverImageUrl: String (nullable),              // URL de portada
}
```

### 4. Tipos TypeScript (Frontend)

**`app/types/cart.ts`:**
```typescript
export interface CartItem {
  id: string                    // Unique ID (sessionId)
  storyId: string               // ID del cuento
  sessionId: string             // ID de sesión de generación
  bookTitle: string             // Título del libro
  childName: string             // Nombre del niño personalizado
  coverImageUrl?: string        // URL de preview de portada
  price: number                 // Precio en EUR
  quantity: number              // Cantidad (por defecto 1)
  addedAt: string               // Fecha de agregado al carrito
}

export interface Cart {
  items: CartItem[]
  totalItems: number            // Suma de quantities
  subtotal: number              // Suma de prices * quantities
  tax: number                   // IVA (21% en España)
  shipping: number              // Coste de envío
  total: number                 // subtotal + tax + shipping
}
```

**`app/types/checkout.ts`:**
```typescript
export interface Address {
  firstName: string
  lastName: string
  street: string
  streetLine2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

export interface CheckoutData {
  customerEmail: string
  customerName: string
  billingAddress: Address
  shippingAddress: Address
  sameAsbilling: boolean
  acceptTerms: boolean
  userId?: string               // Si está logeado
}

export interface Order {
  id: string
  orderNumber: string
  state: OrderState
  totalAmount: number
  currency: string
  customerEmail: string
  customerName: string
  billingAddress: Address
  shippingAddress: Address
  items: OrderItem[]
  stripePaymentIntentId: string
  paidAt?: string
  createdAt: string
}

export type OrderState =
  | 'pending'       // Creada pero no pagada
  | 'processing'    // Pago en proceso
  | 'completed'     // Pagada y completada
  | 'failed'        // Pago fallido
  | 'refunded'      // Reembolsada

export interface OrderItem {
  id: string
  productType: string
  bookTitle: string
  childName: string
  storyId: string
  unitPrice: number
  quantity: number
  subtotal: number
  pdfUrl?: string
  coverImageUrl?: string
}
```

---

## 🚀 Fases de Implementación

### FASE 1: Configuración y Fundamentos (30 min)
**Objetivo:** Preparar el entorno y las dependencias necesarias

**Tareas:**
1. ✅ Instalar dependencias de Stripe
   ```bash
   pnpm add @stripe/stripe-js stripe
   pnpm add -D @types/stripe
   ```

2. ✅ Configurar variables de entorno
   ```env
   # .env
   STRIPE_PUBLIC_KEY=pk_test_51Sk4l5Fqp0oRW6mdNPWtjRMLP8PvAQa8Dw1at16STCmpsSyqoaLSJCqRwwG51Qp64mDdDIu54tQsW0axNEYpjsbK00mNCSlcAP
   STRIPE_SECRET_KEY=sk_test_51Sk4l5Fqp0oRW6mdQF6aednsrses9eWbr0ENRp73jSaMhwOTT6FNIak0VdjS1quce9I5DxS2421PKad7NY7l5Rvo00Mj2p1Yxv
   STRIPE_WEBHOOK_SECRET=whsec_... (se genera después)

   # Strapi (ya existente)
   STRAPI_URL=https://cms.iraklitbz.dev
   STRAPI_API_TOKEN=... (crear nuevo token con permisos de upload)
   ```

3. ✅ Crear utility de Stripe
   - `server/utils/stripe.ts`

4. ✅ Crear tipos base
   - `app/types/cart.ts`
   - `app/types/checkout.ts`

5. 📋 **USUARIO: Crear modelos en Strapi**
   - Content Type: `Order` (según especificación arriba)
   - Component: `Address`
   - Content Type: `OrderItem`
   - Configurar permisos de API
   - Crear API Token con permisos de upload

**Entregables:**
- ✅ Dependencias instaladas
- ✅ Variables de entorno configuradas
- ✅ Tipos TypeScript definidos
- ✅ Cliente de Stripe inicializado
- 📋 Modelos en Strapi listos (tarea del usuario)

---

### FASE 2: Carrito de Compras (1-2h)
**Objetivo:** Implementar el carrito de compras completo con persistencia

**Tareas:**
1. ✅ Crear composable `useCart()`
   - `app/composables/useCart.ts`
   - Funciones: addItem, removeItem, updateQuantity, clearCart
   - Persistencia en localStorage
   - Cálculos: subtotal, tax (21% IVA), shipping, total

2. ✅ Crear tipos y configuración de productos
   - `app/config/products.ts` (precios de libros)
   ```typescript
   export const PRODUCT_PRICES = {
     personalized_book: 24.99,
     shipping: 3.99,
     tax_rate: 0.21  // IVA 21%
   }
   ```

3. ✅ Modificar `/story/{id}/preview.vue`
   - Cambiar botón "Descargar PDF" por "Agregar al carrito"
   - Mantener opción de descarga directa (botón secundario)
   - Al agregar: mostrar toast de confirmación
   - Navegar a /cart automáticamente (opcional)

4. ✅ Crear componente `CartIcon.vue`
   - Badge con número de items
   - Integrar en layout/header
   - Animación al agregar items

5. ✅ Crear página `/cart.vue`
   - Lista de items del carrito
   - Editar cantidad
   - Eliminar items
   - Resumen de precios
   - Botón "Proceder al checkout"
   - Estado vacío con CTA

6. ✅ Crear componentes del carrito
   - `components/cart/CartItem.vue`
   - `components/cart/CartSummary.vue`
   - `components/cart/EmptyCart.vue`

**Entregables:**
- ✅ Carrito completamente funcional
- ✅ Persistencia en localStorage
- ✅ UI/UX pulida con Tailwind
- ✅ Integración en flujo existente

---

### FASE 3: Página de Checkout (2-3h)
**Objetivo:** Crear el formulario de checkout completo con validaciones

**Tareas:**
1. ✅ Crear página `/checkout.vue`
   - Proteger con middleware (solo si hay items en carrito)
   - Layout de 2 columnas: formulario | resumen
   - Stepper visual (opcional): Info → Pago → Confirmación

2. ✅ Crear formularios de checkout
   - `components/checkout/CheckoutForm.vue` (formulario principal)
   - `components/checkout/AddressForm.vue` (formulario de dirección reutilizable)
   - `components/checkout/OrderSummary.vue` (resumen lateral)

3. ✅ Implementar auto-rellenado
   - Si `isAuthenticated`: usar datos de `user`
   - Pre-llenar: email, nombre, dirección si existe en perfil
   - Permitir edición de todos los campos

4. ✅ Validaciones con Zod
   - Instalar: `pnpm add zod`
   - Validar email, campos requeridos, código postal, etc
   - Mensajes de error en español
   - Validación en tiempo real

5. ✅ Checkbox "Misma dirección de facturación"
   - Por defecto: true
   - Si false: mostrar segundo formulario de dirección

6. ✅ Crear composable `useCheckout()`
   - `app/composables/useCheckout.ts`
   - Estado del formulario
   - Validación
   - Navegación entre pasos

**Entregables:**
- ✅ Formulario de checkout completo
- ✅ Validaciones robustas
- ✅ Auto-rellenado para usuarios logeados
- ✅ UX optimizada (mobile + desktop)

---

### FASE 4: Integración de Stripe Payment (2-3h)
**Objetivo:** Integrar Stripe Elements para procesar pagos

**Tareas:**
1. ✅ Crear componente `StripePayment.vue`
   - Cargar Stripe.js
   - Stripe Elements: CardElement o Payment Element
   - Estilos personalizados con tema del proyecto
   - Manejo de errores de tarjeta

2. ✅ Crear endpoint `POST /api/checkout/create-intent`
   - Input: items del carrito + datos de checkout
   - Crear Payment Intent en Stripe
   - Calcular monto total
   - Metadata: orderNumber, customerEmail, items
   - Retornar: clientSecret

3. ✅ Integrar pago en `/checkout.vue`
   - Al hacer submit del formulario:
     1. Validar datos
     2. Crear Payment Intent
     3. Confirmar pago con Stripe.js
     4. Mostrar loading state
     5. Manejar 3D Secure si es necesario
     6. Navegar a página de éxito

4. ✅ Crear página `/order/[id]/success.vue`
   - Página de confirmación
   - Mostrar número de orden
   - Resumen de compra
   - Mensaje de email enviado (futuro)
   - Botón para descargar PDFs
   - Botón para ver orden en perfil

5. ✅ Manejo de errores
   - Errores de Stripe (tarjeta rechazada, etc)
   - Errores de red
   - Timeouts
   - Mostrar mensajes claros al usuario

**Entregables:**
- ✅ Integración completa de Stripe
- ✅ Proceso de pago funcional
- ✅ Manejo robusto de errores
- ✅ Página de confirmación

---

### FASE 5: Procesamiento de Órdenes y Webhooks (2-3h)
**Objetivo:** Guardar órdenes en Strapi y procesar webhooks de Stripe

**Tareas:**
1. ✅ Crear endpoint `POST /api/checkout/confirm`
   - Input: paymentIntentId, checkoutData, cartItems
   - Verificar que el pago fue exitoso con Stripe
   - Generar orderNumber único
   - Crear Order en Strapi
   - Crear OrderItems en Strapi
   - Retornar: Order completa

2. ✅ Crear utility `server/utils/pdf-uploader.ts`
   - Función: `uploadPdfToStrapi(sessionId, orderItemId)`
   - Generar PDF desde session (reutilizar `usePdfGenerator`)
   - Subir a Strapi usando Upload API
   - Asociar PDF con OrderItem
   - Retornar: URL pública del PDF

3. ✅ Integrar subida de PDFs en confirmación
   - Después de crear Order
   - Por cada OrderItem:
     1. Generar PDF desde sessionId
     2. Subir a Strapi
     3. Actualizar OrderItem con pdfUrl
   - Procesar en paralelo (Promise.all)

4. ✅ Crear endpoint `POST /api/webhooks/stripe`
   - Verificar firma del webhook
   - Manejar eventos:
     - `payment_intent.succeeded`: Marcar orden como completed
     - `payment_intent.payment_failed`: Marcar orden como failed
     - `charge.refunded`: Marcar orden como refunded
   - Actualizar estado en Strapi
   - Logging de eventos

5. ✅ Configurar webhook en Stripe Dashboard
   - Endpoint: `https://tu-dominio.com/api/webhooks/stripe`
   - Eventos: payment_intent.*, charge.refunded
   - Copiar Webhook Secret a .env

6. ✅ Crear utility `server/utils/order-processor.ts`
   - `createOrder(data)`: Crear orden en Strapi
   - `updateOrderState(orderId, state)`: Actualizar estado
   - `getOrder(orderId)`: Obtener orden completa
   - `getUserOrders(userId)`: Órdenes de un usuario

**Entregables:**
- ✅ Órdenes guardadas en Strapi
- ✅ PDFs subidos y asociados
- ✅ Webhooks configurados
- ✅ Estados de órdenes sincronizados

---

### FASE 6: Panel de Usuario y Órdenes (1-2h)
**Objetivo:** Permitir a usuarios ver su historial de compras

**Tareas:**
1. ✅ Crear composable `useOrders()`
   - `app/composables/useOrders.ts`
   - `getUserOrders()`: Listar órdenes del usuario logeado
   - `getGuestOrder(orderNumber, email)`: Ver orden como invitado
   - `downloadPdf(orderItemId)`: Descargar PDF

2. ✅ Crear endpoints de órdenes
   - `GET /api/orders`: Listar órdenes del usuario (requiere auth)
   - `GET /api/orders/[id]`: Detalle de orden (verificar ownership)
   - `GET /api/orders/guest`: Buscar orden de invitado (orderNumber + email)

3. ✅ Crear página `/profile/orders.vue`
   - Proteger con middleware auth
   - Lista de órdenes con filtros (todas, completadas, pendientes)
   - Búsqueda por número de orden
   - Orden por fecha descendente

4. ✅ Crear componentes
   - `components/orders/OrderCard.vue`: Card resumen
   - `components/orders/OrderDetails.vue`: Detalle expandido
   - `components/orders/DownloadPdfButton.vue`: Botón de descarga

5. ✅ Página de consulta para invitados
   - `/order/track`: Buscar orden con número + email
   - Mostrar estado y detalles
   - Permitir descarga de PDFs

6. ✅ Integrar en perfil existente
   - Añadir sección "Mis pedidos" en `/profile.vue`
   - Mostrar últimas 3 órdenes
   - Link a página completa de órdenes

**Entregables:**
- ✅ Historial de órdenes funcional
- ✅ Descarga de PDFs desde órdenes
- ✅ Consulta de órdenes para invitados
- ✅ Integración en perfil de usuario

---

## 📁 Estructura de Archivos Completa

```
mask/
├── app/
│   ├── composables/
│   │   ├── useCart.ts              [FASE 2] 🆕
│   │   ├── useCheckout.ts          [FASE 3] 🆕
│   │   └── useOrders.ts            [FASE 6] 🆕
│   │
│   ├── types/
│   │   ├── cart.ts                 [FASE 1] 🆕
│   │   └── checkout.ts             [FASE 1] 🆕
│   │
│   ├── config/
│   │   └── products.ts             [FASE 2] 🆕
│   │
│   ├── pages/
│   │   ├── cart.vue                [FASE 2] 🆕
│   │   ├── checkout.vue            [FASE 3] 🆕
│   │   ├── order/
│   │   │   ├── [id]/
│   │   │   │   └── success.vue     [FASE 4] 🆕
│   │   │   └── track.vue           [FASE 6] 🆕
│   │   ├── profile/
│   │   │   └── orders.vue          [FASE 6] 🆕
│   │   └── story/
│   │       └── [id]/
│   │           └── preview.vue     [FASE 2] ✏️ MODIFICAR
│   │
│   ├── components/
│   │   ├── cart/
│   │   │   ├── CartIcon.vue        [FASE 2] 🆕
│   │   │   ├── CartItem.vue        [FASE 2] 🆕
│   │   │   ├── CartSummary.vue     [FASE 2] 🆕
│   │   │   └── EmptyCart.vue       [FASE 2] 🆕
│   │   │
│   │   ├── checkout/
│   │   │   ├── CheckoutForm.vue    [FASE 3] 🆕
│   │   │   ├── AddressForm.vue     [FASE 3] 🆕
│   │   │   ├── OrderSummary.vue    [FASE 3] 🆕
│   │   │   └── StripePayment.vue   [FASE 4] 🆕
│   │   │
│   │   └── orders/
│   │       ├── OrderCard.vue       [FASE 6] 🆕
│   │       ├── OrderDetails.vue    [FASE 6] 🆕
│   │       └── DownloadPdfButton.vue [FASE 6] 🆕
│   │
│   └── layouts/
│       └── default.vue             [FASE 2] ✏️ MODIFICAR (añadir CartIcon)
│
├── server/
│   ├── api/
│   │   ├── checkout/
│   │   │   ├── create-intent.post.ts  [FASE 4] 🆕
│   │   │   └── confirm.post.ts        [FASE 5] 🆕
│   │   │
│   │   ├── orders/
│   │   │   ├── index.get.ts           [FASE 6] 🆕
│   │   │   ├── [id].get.ts            [FASE 6] 🆕
│   │   │   └── guest.post.ts          [FASE 6] 🆕
│   │   │
│   │   └── webhooks/
│   │       └── stripe.post.ts         [FASE 5] 🆕
│   │
│   └── utils/
│       ├── stripe.ts                  [FASE 1] 🆕
│       ├── pdf-uploader.ts            [FASE 5] 🆕
│       └── order-processor.ts         [FASE 5] 🆕
│
├── .env                               [FASE 1] ✏️ MODIFICAR
├── nuxt.config.ts                     [FASE 1] ✏️ MODIFICAR (runtime config)
└── docs/
    ├── STRIPE_INTEGRATION_PLAN.md     [FASE 1] 🆕 (este archivo)
    └── STRIPE_TESTING_GUIDE.md        [FASE 5] 🆕 (crear después)
```

**Leyenda:**
- 🆕 = Archivo nuevo a crear
- ✏️ = Archivo existente a modificar

---

## 🎯 Decisiones Técnicas

### 1. Precios y Moneda
- **Precio base libro personalizado:** €24.99
- **Gastos de envío:** €3.99 (fijo)
- **IVA:** 21% (España)
- **Moneda:** EUR
- **Múltiples libros:** Mismo envío para 1-5 libros

### 2. Flujo de Pago
- **Método elegido:** Stripe Payment Intents
- **Por qué:**
  - Soporta 3D Secure automáticamente
  - Mejor para SCA (Strong Customer Authentication) en Europa
  - Manejo robusto de estados de pago
  - Webhooks fiables

### 3. Persistencia del Carrito
- **localStorage:** Para carrito temporal
- **No sincronización con backend** (por ahora)
- **Limpieza:** Después de compra exitosa
- **Futuro:** Sincronizar con usuario logeado en Strapi

### 4. Gestión de PDFs
- **Generación:** Al confirmar orden (no en tiempo real de pago)
- **Almacenamiento:** Strapi Media Library
- **Acceso:** URLs firmadas (futuro) o públicas con UUID
- **Formato:** Mismo que descarga actual (A4, portrait)

### 5. Estados de Orden
```
pending → processing → completed
                    ↘ failed
                    ↘ refunded
```

- `pending`: Orden creada, pago no iniciado
- `processing`: Pago en proceso (Payment Intent created)
- `completed`: Pago confirmado, PDFs generados
- `failed`: Pago fallido o rechazado
- `refunded`: Orden reembolsada

### 6. Seguridad
- ✅ Validación de webhooks con firma de Stripe
- ✅ No exponer Stripe Secret Key en frontend
- ✅ Verificar ownership de órdenes en backend
- ✅ Sanitizar inputs de formularios
- ✅ HTTPS obligatorio en producción
- ✅ Tokens de Strapi con permisos mínimos necesarios

### 7. UX/UI
- **Design:** Consistente con Tailwind CSS del proyecto
- **Responsive:** Mobile-first
- **Loading states:** Skeleton loaders y spinners
- **Error handling:** Mensajes claros y accionables
- **Confirmación:** Emails (Fase 7, futuro)

---

## 🧪 Testing (Stripe Test Mode)

### Tarjetas de prueba de Stripe
```
✅ Éxito:               4242 4242 4242 4242
❌ Fallo genérico:      4000 0000 0000 0002
🔐 Requiere 3D Secure:  4000 0027 6000 3184
⏱️ Procesamiento lento: 4000 0000 0000 0077
💳 Insufficient funds:  4000 0000 0000 9995
```

**Datos de prueba:**
- Fecha de expiración: Cualquier fecha futura
- CVC: Cualquier 3 dígitos
- Código postal: Cualquier 5 dígitos

---

## 📋 Checklist de Usuario (Strapi)

Antes de empezar la implementación, necesitas crear en Strapi:

### 1. Content Type: Order
```yaml
Nombre de colección: orders
Campos:
  - orderNumber (Text, unique, required)
  - state (Enumeration: pending|processing|completed|failed|refunded)
    NOTA: Usar "state" en vez de "status" por conflicto interno de Strapi
  - totalAmount (Decimal, required)
  - currency (Text, default: 'eur')
  - customerEmail (Email, required)
  - customerName (Text, required)
  - user (Relation: User, optional)
  - billingAddress (Component: address, required)
  - shippingAddress (Component: address, required)
  - sameAsBinding (Boolean, default: false)
  - items (Relation: OrderItem, hasMany)
  - stripePaymentIntentId (Text, unique)
  - stripePaymentStatus (Text)
  - paymentMethod (Text)
  - paidAt (DateTime, nullable)
  - notes (Text, long)
```

### 2. Component: Address
```yaml
Nombre: address
Categoría: checkout
Campos:
  - firstName (Text, required)
  - lastName (Text, required)
  - street (Text, required)
  - streetLine2 (Text, nullable)
  - city (Text, required)
  - state (Text, nullable)
  - postalCode (Text, required)
  - country (Text, required, default: 'ES')
  - phone (Text, nullable)
```

### 3. Content Type: OrderItem
```yaml
Nombre de colección: order-items
Campos:
  - order (Relation: Order, manyToOne)
  - productType (Text, default: 'personalized_book')
  - bookTitle (Text, required)
  - childName (Text, required)
  - storyId (Text, required)
  - unitPrice (Decimal, required)
  - quantity (Integer, required, default: 1)
  - subtotal (Decimal, required)
  - pdfFile (Media, single file)
  - pdfUrl (Text, nullable)
  - sessionId (Text, nullable)
  - generatedAt (DateTime)
  - coverImageUrl (Text, nullable)
```

### 4. API Token
- Ir a Settings → API Tokens → Create new API Token
- Nombre: "Mask App - Production"
- Token type: Custom
- Permisos:
  - `Order`: find, findOne, create, update
  - `OrderItem`: find, findOne, create, update
  - `Upload`: upload (para subir PDFs)
- Copiar token a `.env` como `STRAPI_API_TOKEN`

### 5. Roles & Permissions
- Public:
  - `Order`: create (para checkout de invitados)
  - `OrderItem`: findOne (para descargar PDFs)
- Authenticated:
  - `Order`: find, findOne, create (solo sus órdenes)
  - `OrderItem`: find, findOne

---

## 🚦 Próximos Pasos

### Inmediato (hoy):
1. ✅ Usuario crea modelos en Strapi (arriba)
2. ✅ Usuario proporciona endpoints de Strapi
3. ✅ Empezar FASE 1: Configuración

### Esta semana:
- Completar FASES 1-4 (carrito + checkout + pago)
- Testing exhaustivo con Stripe test cards
- Deploy a staging

### Próxima semana:
- FASE 5: Webhooks y procesamiento
- FASE 6: Panel de usuario
- Testing end-to-end

### Futuro (Fase 7):
- Envío de emails con Resend o similar
- PDFs adjuntos en emails
- Notificaciones de estado de pedido
- Panel de administración en Strapi

---

## 📞 Soporte

**Documentación de referencia:**
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Elements](https://stripe.com/docs/payments/elements)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Strapi Upload](https://docs.strapi.io/dev-docs/plugins/upload)
- [Nuxt 3 Server Routes](https://nuxt.com/docs/guide/directory-structure/server)

---

**Última actualización:** 2025-12-30
**Versión del documento:** 1.0
**Estado:** ✅ Listo para implementación
