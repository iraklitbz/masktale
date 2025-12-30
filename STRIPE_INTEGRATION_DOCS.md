# Documentación Completa: Integración de Stripe en Mask

**Proyecto:** Mask - Libros Personalizados con IA
**Fecha de inicio:** Diciembre 2024
**Estado:** FASE 4 Completada ✅

---

## Índice

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Configuración Inicial](#configuración-inicial)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [FASE 1: Configuración Base](#fase-1-configuración-base)
6. [FASE 2: Shopping Cart](#fase-2-shopping-cart)
7. [FASE 3: Página de Checkout](#fase-3-página-de-checkout)
8. [FASE 4: Integración de Stripe](#fase-4-integración-de-stripe)
9. [Flujos de Trabajo](#flujos-de-trabajo)
10. [Próximas Fases](#próximas-fases)
11. [Notas Importantes](#notas-importantes)

---

## Resumen del Proyecto

Sistema completo de e-commerce para venta de libros personalizados generados con IA (Google Gemini). Los usuarios crean cuentos personalizados, los agregan al carrito, completan checkout y pagan con Stripe.

### Flujo General

```
Crear Cuento (IA) → Previsualizar → Agregar al Carrito → Checkout → Pago Stripe → Orden en Strapi
```

### Características Principales

- ✅ Carrito de compras con localStorage
- ✅ Checkout como invitado o autenticado
- ✅ Auto-fill de datos para usuarios logueados
- ✅ Integración completa con Stripe Payment Intents
- ✅ Soporte para 3D Secure (SCA)
- ✅ Manejo avanzado de errores
- ✅ Páginas de éxito y error
- ⏳ Webhooks de Stripe (FASE 5)
- ⏳ Guardado de órdenes en Strapi (FASE 5)
- ⏳ Panel de usuario para ver órdenes (FASE 6)

---

## Stack Tecnológico

### Frontend
- **Framework:** Nuxt 3 (Vue 3 Composition API)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Validación:** Zod
- **Pagos:** @stripe/stripe-js

### Backend
- **Server:** Nuxt Server Routes (H3)
- **CMS:** Strapi v5
- **Pagos:** Stripe Node SDK
- **Auth:** JWT (Strapi)

### IA y PDFs
- **Generación de Imágenes:** Google Gemini 2.5 Flash
- **PDFs:** jsPDF

---

## Configuración Inicial

### Variables de Entorno

Archivo `.env`:

```env
# Stripe (Test Mode)
NUXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_51QbUhWKxxxxxxxxxxxxxxxxx
NUXT_STRIPE_SECRET_KEY=sk_test_51QbUhWKxxxxxxxxxxxxxxxxx

# Strapi
NUXT_STRAPI_URL=http://localhost:1337
NUXT_STRAPI_API_TOKEN=9eda1fde21f742f6a71d55ba3e67d4b259001f89...

# Google AI
NUXT_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
```

### Instalación de Dependencias

```bash
# Stripe
pnpm add stripe @stripe/stripe-js

# Validación
pnpm add zod
```

### Configuración de Nuxt

En `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-side only
    stripeSecretKey: process.env.NUXT_STRIPE_SECRET_KEY,
    strapiApiToken: process.env.NUXT_STRAPI_API_TOKEN,

    // Public (client + server)
    public: {
      stripePublicKey: process.env.NUXT_PUBLIC_STRIPE_PUBLIC_KEY,
      strapiUrl: process.env.NUXT_STRAPI_URL,
    },
  },
})
```

---

## Estructura de Archivos

```
app/
├── components/
│   ├── cart/
│   │   ├── CartIcon.vue              # Icono del carrito con badge
│   │   ├── CartItem.vue              # Item individual del carrito
│   │   ├── CartSummary.vue           # Resumen de precios
│   │   └── EmptyCart.vue             # Estado vacío
│   └── checkout/
│       ├── AddressForm.vue           # Formulario de dirección reutilizable
│       ├── CheckoutForm.vue          # Formulario completo de checkout
│       ├── OrderSummary.vue          # Resumen de orden para checkout
│       └── StripePayment.vue         # Integración con Stripe Elements
├── composables/
│   ├── useAuth.ts                    # Autenticación (existente)
│   ├── useCart.ts                    # Gestión del carrito
│   └── useCheckout.ts                # Gestión del checkout
├── config/
│   └── products.ts                   # Precios y cálculos
├── pages/
│   ├── cart.vue                      # Página del carrito
│   ├── checkout.vue                  # Página de checkout
│   ├── order/
│   │   └── [id]/
│   │       ├── success.vue           # Pago exitoso
│   │       └── failed.vue            # Pago fallido
│   └── story/
│       └── [id]/
│           └── preview.vue           # Modificado: botón Add to Cart
├── plugins/
│   └── stripe.client.ts              # Plugin de Stripe.js
├── types/
│   ├── cart.ts                       # Types del carrito
│   └── checkout.ts                   # Types de checkout y órdenes
└── utils/
    └── validation.ts                 # Schemas de Zod

server/
├── api/
│   └── checkout/
│       └── create-intent.post.ts     # Crear Payment Intent
└── utils/
    └── stripe.ts                     # Utilidades de Stripe
```

---

## FASE 1: Configuración Base

### ✅ Archivos Creados

#### 1. `server/utils/stripe.ts`

Utilidades server-side para Stripe:

```typescript
import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const config = useRuntimeConfig()
    const secretKey = config.stripeSecretKey
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

export async function createPaymentIntent(
  amount: number,
  currency: string = 'eur',
  metadata?: Record<string, any>
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()
  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
```

#### 2. `app/types/cart.ts`

```typescript
export interface CartItem {
  sessionId: string
  bookTitle: string
  childName: string
  age: number
  quantity: number
  price: number
  thumbnail?: string
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  itemCount: number
}

export interface AddToCartData {
  sessionId: string
  bookTitle: string
  childName: string
  age: number
}
```

#### 3. `app/types/checkout.ts`

```typescript
export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface CheckoutFormData {
  customerEmail: string
  customerName: string
  customerPhone: string
  billingAddress: Address
  shippingAddress: Address
  sameAsBilling: boolean
  acceptTerms: boolean
  userId?: number
}

// IMPORTANTE: Se llama "state" no "status" por conflicto con Strapi
export type OrderState =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'

export interface Order {
  id: number
  orderNumber: string
  state: OrderState  // ⚠️ NO "status"
  total: number
  currency: string
  customerEmail: string
  customerName: string
  stripePaymentIntentId: string
  items: OrderItem[]
  billingAddress: Address
  shippingAddress: Address
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: number
  sessionId: string
  bookTitle: string
  childName: string
  quantity: number
  price: number
  pdfUrl?: string
}
```

### ⚠️ Nota Crítica sobre Strapi

El campo para el estado de la orden se llama **`state`** y NO `status`, porque `status` está reservado internamente por Strapi v5 y causa conflictos.

---

## FASE 2: Shopping Cart

### ✅ Archivos Creados

#### 1. `app/config/products.ts`

Configuración de precios:

```typescript
export const PRODUCT_PRICES = {
  personalized_book: 24.99,
  shipping: 3.99,
  tax_rate: 0.21,  // IVA 21% (España)
}

export function calculateSubtotal(quantity: number): number {
  return PRODUCT_PRICES.personalized_book * quantity
}

export function calculateShipping(itemCount: number): number {
  return itemCount > 0 ? PRODUCT_PRICES.shipping : 0
}

export function calculateTax(subtotal: number): number {
  return subtotal * PRODUCT_PRICES.tax_rate
}

export function calculateTotal(subtotal: number, shipping: number, tax: number): number {
  return subtotal + shipping + tax
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

export function centsToEuros(cents: number): number {
  return cents / 100
}
```

#### 2. `app/composables/useCart.ts`

Gestión del carrito con localStorage:

```typescript
import type { Cart, CartItem, AddToCartData } from '~/types/cart'
import { PRODUCT_PRICES, calculateSubtotal, calculateShipping, calculateTax, calculateTotal } from '~/config/products'

const CART_STORAGE_KEY = 'mask_cart'

export function useCart() {
  const cart = useState<Cart>('cart', () => ({
    items: [],
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0,
  }))

  // Cargar carrito desde localStorage
  function loadCart() {
    if (process.client) {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        cart.value = parsed
      }
    }
  }

  // Guardar carrito en localStorage
  function saveCart() {
    if (process.client) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.value))
    }
  }

  // Recalcular totales
  function recalculateTotals() {
    const itemCount = cart.value.items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = cart.value.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shipping = calculateShipping(itemCount)
    const tax = calculateTax(subtotal)
    const total = calculateTotal(subtotal, shipping, tax)

    cart.value.subtotal = subtotal
    cart.value.shipping = shipping
    cart.value.tax = tax
    cart.value.total = total
    cart.value.itemCount = itemCount
  }

  // Agregar item
  function addItem(data: AddToCartData) {
    const existingItem = cart.value.items.find(item => item.sessionId === data.sessionId)

    if (existingItem) {
      existingItem.quantity++
    } else {
      const newItem: CartItem = {
        ...data,
        quantity: 1,
        price: PRODUCT_PRICES.personalized_book,
      }
      cart.value.items.push(newItem)
    }

    recalculateTotals()
    saveCart()
  }

  // Remover item
  function removeItem(sessionId: string) {
    const index = cart.value.items.findIndex(item => item.sessionId === sessionId)
    if (index !== -1) {
      cart.value.items.splice(index, 1)
      recalculateTotals()
      saveCart()
    }
  }

  // Actualizar cantidad
  function updateQuantity(sessionId: string, quantity: number) {
    const item = cart.value.items.find(item => item.sessionId === sessionId)
    if (item) {
      item.quantity = Math.max(1, quantity)
      recalculateTotals()
      saveCart()
    }
  }

  // Limpiar carrito
  function clearCart() {
    cart.value.items = []
    recalculateTotals()
    saveCart()
  }

  // Verificar si un item está en el carrito
  function isInCart(sessionId: string): boolean {
    return cart.value.items.some(item => item.sessionId === sessionId)
  }

  // Inicializar
  onMounted(() => {
    loadCart()
  })

  return {
    cart: readonly(cart),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
  }
}
```

#### 3. Componentes del Carrito

**`app/components/cart/CartIcon.vue`**: Icono en header con badge animado
**`app/components/cart/CartItem.vue`**: Item individual con controles de cantidad
**`app/components/cart/CartSummary.vue`**: Resumen de precios
**`app/components/cart/EmptyCart.vue`**: Estado vacío con features

#### 4. `app/pages/cart.vue`

Página completa del carrito con grid responsive, animaciones de TransitionGroup, y navegación a checkout.

### ✅ Modificaciones

#### `app/pages/story/[id]/preview.vue`

Cambió de:
- Un solo botón "Descargar PDF"

A:
- Botón principal: "Agregar al Carrito" (morado, prominente)
- Botón secundario: "Descargar" (blanco con borde)
- Checkmark cuando ya está en el carrito
- Auto-navegación a `/cart` después de agregar

#### `app/layouts/default.vue`

Se agregó `<CartIcon />` en el header.

---

## FASE 3: Página de Checkout

### ✅ Archivos Creados

#### 1. `app/utils/validation.ts`

Schemas de validación con Zod:

```typescript
import { z } from 'zod'

// Schema para direcciones
export const addressSchema = z.object({
  street: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'La provincia es requerida'),
  postalCode: z.string().regex(/^\d{5}$/, 'Código postal inválido (5 dígitos)'),
  country: z.string().min(2, 'El país es requerido'),
})

// Schema para checkout completo
export const checkoutSchema = z.object({
  customerEmail: z.string().email('Email inválido'),
  customerName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  customerPhone: z.string().regex(
    /^(\+34|0034|34)?[6789]\d{8}$/,
    'Teléfono inválido (formato español)'
  ),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  sameAsBilling: z.boolean(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
})
```

#### 2. `app/composables/useCheckout.ts`

Gestión del checkout con auto-fill:

```typescript
import { z } from 'zod'
import { checkoutSchema } from '~/utils/validation'
import type { CheckoutFormData } from '~/types/checkout'

export function useCheckout() {
  const { user, isAuthenticated } = useAuth()
  const { cart } = useCart()

  const formData = reactive<CheckoutFormData>({
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'España',
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'España',
    },
    sameAsBilling: true,
    acceptTerms: false,
  })

  const errors = ref<Record<string, string>>({})
  const isValidating = ref(false)

  // Auto-fill para usuarios autenticados
  function prefillUserData() {
    if (isAuthenticated.value && user.value) {
      formData.customerEmail = user.value.email || ''
      formData.customerName = user.value.username || ''
      formData.userId = user.value.id
    }
  }

  // Validar un campo
  function validateField(field: string): boolean {
    try {
      const fieldSchema = checkoutSchema.shape[field as keyof typeof checkoutSchema.shape]
      if (fieldSchema) {
        fieldSchema.parse(formData[field as keyof CheckoutFormData])
        delete errors.value[field]
        return true
      }
      return true
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.value[field] = err.errors[0].message
      }
      return false
    }
  }

  // Validar todo el formulario
  function validateForm(): boolean {
    try {
      isValidating.value = true
      checkoutSchema.parse(formData)
      errors.value = {}
      return true
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.value = {}
        err.errors.forEach(error => {
          const path = error.path.join('.')
          errors.value[path] = error.message
        })
      }
      return false
    } finally {
      isValidating.value = false
    }
  }

  // Toggle same as billing
  function toggleSameAsBilling() {
    formData.sameAsBilling = !formData.sameAsBilling
    if (formData.sameAsBilling) {
      formData.shippingAddress = { ...formData.billingAddress }
    }
  }

  // Inicializar
  onMounted(() => {
    prefillUserData()
  })

  return {
    formData,
    errors: readonly(errors),
    isValidating: readonly(isValidating),
    isAuthenticated,
    cart,
    validateForm,
    validateField,
    clearFieldError: (field: string) => delete errors.value[field],
    getFieldError: (field: string) => errors.value[field],
    hasFieldError: (field: string) => !!errors.value[field],
    toggleSameAsBilling,
  }
}
```

#### 3. Componentes de Checkout

**`app/components/checkout/AddressForm.vue`**: Formulario reutilizable de dirección
**`app/components/checkout/CheckoutForm.vue`**: Orquestador del formulario completo
**`app/components/checkout/OrderSummary.vue`**: Resumen sticky en desktop

#### 4. `app/pages/checkout.vue`

Página completa con layout de 2 columnas (form + summary), validación en tiempo real, y scroll automático a errores.

---

## FASE 4: Integración de Stripe

### ✅ Archivos Creados

#### 1. `app/plugins/stripe.client.ts`

Plugin para cargar Stripe.js:

```typescript
import { loadStripe, type Stripe } from '@stripe/stripe-js'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const stripePublicKey = config.public.stripePublicKey

  if (!stripePublicKey) {
    console.error('NUXT_PUBLIC_STRIPE_PUBLIC_KEY no está configurada')
    return { provide: { stripe: null } }
  }

  try {
    const stripe = await loadStripe(stripePublicKey)
    if (!stripe) {
      console.error('No se pudo cargar Stripe.js')
      return { provide: { stripe: null } }
    }

    return { provide: { stripe } }
  } catch (error) {
    console.error('Error al cargar Stripe:', error)
    return { provide: { stripe: null } }
  }
})
```

#### 2. `server/api/checkout/create-intent.post.ts`

Endpoint para crear Payment Intent con validación exhaustiva:

```typescript
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { amount, currency = 'eur', metadata } = body

    // Validaciones
    if (!amount || typeof amount !== 'number') {
      throw createError({ statusCode: 400, statusMessage: 'El monto es requerido' })
    }

    if (amount <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'El monto debe ser mayor que 0' })
    }

    if (amount > 10000) {
      throw createError({ statusCode: 400, statusMessage: 'El monto excede el límite máximo' })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (metadata && !emailRegex.test(metadata.customerEmail)) {
      throw createError({ statusCode: 400, statusMessage: 'Email inválido' })
    }

    // Convertir a centavos
    const amountInCents = eurosToCents(amount)

    if (amountInCents < 50) {
      throw createError({ statusCode: 400, statusMessage: 'Monto mínimo: 0.50 EUR' })
    }

    // Crear Payment Intent
    const paymentIntent = await createPaymentIntent(amountInCents, currency, metadata)

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error: any) {
    console.error('[create-intent] Error:', error)

    if (error.statusCode) throw error

    if (error.type === 'StripeError') {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }

    throw createError({ statusCode: 500, statusMessage: 'Error al crear Payment Intent' })
  }
})
```

#### 3. `app/components/checkout/StripePayment.vue`

Componente con Stripe Payment Element:

```typescript
<script setup lang="ts">
import type { Stripe, StripeElements } from '@stripe/stripe-js'

const props = defineProps<{
  clientSecret: string
  amount: number
}>()

const { $stripe } = useNuxtApp()
const stripe = $stripe as Stripe | null

const elements = ref<StripeElements | null>(null)
const isReady = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  if (!stripe || !props.clientSecret) {
    error.value = 'Stripe no está disponible'
    return
  }

  try {
    // Crear Elements con tema personalizado
    elements.value = stripe.elements({
      clientSecret: props.clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#9333ea',
          colorBackground: '#ffffff',
          colorText: '#111827',
          colorDanger: '#dc2626',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '8px',
        },
      },
    })

    // Montar Payment Element
    const paymentElement = elements.value.create('payment')
    paymentElement.mount('#payment-element')

    paymentElement.on('ready', () => {
      isReady.value = true
    })

    paymentElement.on('change', (event) => {
      error.value = event.error ? event.error.message : null
    })
  } catch (err: any) {
    console.error('[StripePayment] Error:', err)
    error.value = 'Error al cargar el formulario de pago'
  }
})

// Procesar pago
const processPayment = async (): Promise<{
  success: boolean
  paymentIntentId?: string
  error?: string
  errorCode?: string
}> => {
  if (!stripe || !elements.value) {
    return { success: false, error: 'Stripe no inicializado', errorCode: 'stripe_not_initialized' }
  }

  try {
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements: elements.value,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/order/success`,
      },
    })

    if (submitError) {
      const errorCode = submitError.code || submitError.decline_code || 'unknown'
      return { success: false, error: submitError.message, errorCode }
    }

    if (paymentIntent?.status === 'succeeded') {
      return { success: true, paymentIntentId: paymentIntent.id }
    }

    return { success: false, error: 'El pago no se completó', errorCode: 'payment_incomplete' }
  } catch (err: any) {
    return { success: false, error: err.message, errorCode: 'processing_error' }
  }
}

defineExpose({ processPayment })
</script>
```

#### 4. `app/pages/order/[id]/success.vue`

Página de éxito con:
- Animación de checkmark SVG
- Resumen del pedido
- ID de pago
- Próximos pasos
- Botones: Descargar PDFs, Ver pedidos, Volver al inicio
- Limpia el carrito automáticamente

#### 5. `app/pages/order/[id]/failed.vue`

Página de error con:
- Animación de error SVG
- Mensajes amigables según código de error
- Detalles técnicos colapsables
- Información útil (no se hizo cargo, carrito guardado)
- Botones: Reintentar, Contactar soporte, Volver al carrito

### ✅ Modificaciones

#### `app/pages/checkout.vue`

Se actualizó para:
- Crear Payment Intent después de validar el formulario
- Mostrar StripePayment con animación slide-down
- Manejar errores y redirigir a `/order/[id]/failed` con query params
- Redirigir a `/order/[id]/success` en pago exitoso

### Códigos de Error Stripe Manejados

| Código | Título | Descripción |
|--------|--------|-------------|
| `card_declined` | Tarjeta rechazada | Tu banco ha rechazado la transacción |
| `insufficient_funds` | Fondos insuficientes | No hay suficientes fondos en tu tarjeta |
| `expired_card` | Tarjeta expirada | La tarjeta que intentaste usar ha expirado |
| `incorrect_cvc` | CVC incorrecto | El código de seguridad es incorrecto |
| `processing_error` | Error al procesar | Error temporal, intenta de nuevo |
| `requires_action` | Verificación adicional | Se requiere 3D Secure |

---

## Flujos de Trabajo

### 1. Flujo de Compra Completo

```
1. Usuario crea cuento con IA en /story/create
2. Previsualiza el cuento en /story/[id]/preview
3. Click en "Agregar al Carrito"
   → Se agrega a localStorage
   → Navegación automática a /cart
4. En /cart:
   → Ver items
   → Ajustar cantidades
   → Ver resumen de precios
   → Click "Proceder al pago"
5. En /checkout:
   → Auto-fill si está autenticado
   → Llenar formulario de contacto y direcciones
   → Aceptar términos
   → Click "Completar pedido"
   → Validación del formulario
   → Si válido: crear Payment Intent
   → Mostrar formulario de Stripe
6. Pago con Stripe:
   → Ingresar datos de tarjeta
   → Soporte 3D Secure si es necesario
   → Click "Pagar €XX.XX"
   → Procesamiento
7. Resultado:
   → Éxito: /order/[id]/success
   → Error: /order/[id]/failed
```

### 2. Flujo Técnico del Pago

```
Frontend                          Backend                    Stripe
   |                                 |                          |
   |-- POST /api/checkout/           |                          |
   |   create-intent                 |                          |
   |   { amount, metadata }          |                          |
   |                                 |                          |
   |                                 |-- Create Payment ------->|
   |                                 |   Intent                 |
   |                                 |                          |
   |                                 |<--- clientSecret --------|
   |                                 |                          |
   |<-- { clientSecret,              |                          |
   |     paymentIntentId }           |                          |
   |                                 |                          |
   |-- Cargar Stripe Elements        |                          |
   |                                 |                          |
   |-- Usuario ingresa tarjeta       |                          |
   |                                 |                          |
   |-- stripe.confirmPayment() ------|------------------------>|
   |                                 |                          |
   |                                 |                     [Process]
   |                                 |                          |
   |<-- { paymentIntent } ---------------------------- success |
   |                                 |                          |
   |-- Navegar a success             |                          |
```

### 3. Estados del Carrito

```typescript
// localStorage: 'mask_cart'
{
  items: [
    {
      sessionId: "abc123",
      bookTitle: "La Aventura de María",
      childName: "María",
      age: 5,
      quantity: 2,
      price: 24.99
    }
  ],
  subtotal: 49.98,    // 24.99 * 2
  shipping: 3.99,
  tax: 11.33,         // 49.98 * 0.21
  total: 65.30,       // 49.98 + 3.99 + 11.33
  itemCount: 2
}
```

---

## Próximas Fases

### FASE 5: Procesamiento de Órdenes y Webhooks ⏳

**Objetivo:** Guardar órdenes en Strapi y procesar webhooks de Stripe

#### Tareas:

1. **Crear endpoint para confirmar orden**
   - `server/api/checkout/confirm.post.ts`
   - Recibe paymentIntentId
   - Verifica pago en Stripe
   - Crea Order en Strapi
   - Retorna order ID

2. **Subir PDFs a Strapi**
   - `server/utils/pdf-uploader.ts`
   - Obtener PDF de la sesión
   - Subirlo a Strapi Media Library
   - Asociarlo con OrderItem

3. **Implementar webhooks**
   - `server/api/webhooks/stripe.post.ts`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Verificar firma
   - Actualizar estado de orden
   - Enviar notificaciones

4. **Procesador de órdenes**
   - `server/utils/order-processor.ts`
   - Lógica de negocio
   - Transiciones de estado
   - Logs y auditoría

#### Modelos de Strapi necesarios:

**Order:**
- orderNumber (string, unique)
- state (enum: pending, processing, completed, failed, refunded)
- total (decimal)
- currency (string, default: 'eur')
- customerEmail (string)
- customerName (string)
- customerPhone (string)
- stripePaymentIntentId (string, unique)
- billingAddress (component)
- shippingAddress (component)
- user (relation: belongsTo User, optional)
- items (relation: hasMany OrderItem)

**OrderItem:**
- sessionId (string)
- bookTitle (string)
- childName (string)
- quantity (integer)
- price (decimal)
- pdfUrl (string, nullable)
- order (relation: belongsTo Order)

**Address (Component):**
- street (string)
- city (string)
- state (string)
- postalCode (string)
- country (string)

### FASE 6: Panel de Usuario y Órdenes ⏳

**Objetivo:** Permitir a usuarios ver y gestionar sus órdenes

#### Tareas:

1. **Composable useOrders**
   - `app/composables/useOrders.ts`
   - Obtener órdenes del usuario
   - Filtros y paginación

2. **Endpoints de órdenes**
   - `server/api/orders/index.get.ts` - Listar órdenes
   - `server/api/orders/[id].get.ts` - Detalle de orden
   - `server/api/orders/[id]/download.get.ts` - Descargar PDFs

3. **Página de órdenes**
   - `app/pages/profile/orders.vue`
   - Lista de órdenes con filtros
   - Estados visuales

4. **Componentes**
   - `app/components/orders/OrderCard.vue`
   - `app/components/orders/OrderDetails.vue`
   - `app/components/orders/DownloadPdfButton.vue`

5. **Tracking para invitados**
   - `app/pages/order/track.vue`
   - Buscar por email + order number
   - Ver estado sin login

### FASE 7: Emails y Notificaciones ⏳

**Objetivo:** Enviar confirmaciones y actualizaciones por email

#### Tareas:

1. Integrar servicio de emails (SendGrid/Resend)
2. Templates de emails:
   - Confirmación de pedido
   - PDFs listos para descargar
   - Pedido enviado
   - Pedido entregado
3. Colas para procesamiento asíncrono

---

## Notas Importantes

### ⚠️ Conflictos con Strapi

- **NUNCA** usar `status` como campo en modelos de Strapi v5
- Usar `state` en su lugar
- Documentar en types: `OrderState` no `OrderStatus`

### 🔒 Seguridad

- Secret keys solo en server-side
- Public keys solo para frontend
- Validar todos los inputs
- Verificar firmas de webhooks
- No exponer Payment Intents completos

### 💾 Persistencia

- Carrito: `localStorage` con key `mask_cart`
- Limpieza automática después de pago exitoso
- Recuperación en caso de error (carrito preservado)

### 🎨 UX

- Auto-fill para usuarios autenticados
- Validación en tiempo real
- Scroll automático a errores
- Animaciones suaves (TransitionGroup, slide-down, scale)
- Estados de carga claros
- Mensajes de error amigables

### 🧪 Testing con Stripe

**Tarjetas de prueba:**

```
Éxito:
4242 4242 4242 4242

Rechazada:
4000 0000 0000 0002

3D Secure:
4000 0025 0000 3155

Fondos insuficientes:
4000 0000 0000 9995
```

**Detalles adicionales:**
- CVC: Cualquier 3 dígitos
- Fecha: Cualquier fecha futura
- Código postal: Cualquier 5 dígitos

### 📊 Precios Configurados

| Concepto | Precio |
|----------|--------|
| Libro personalizado | €24.99 |
| Envío | €3.99 |
| IVA | 21% |

**Ejemplo de cálculo:**
- 2 libros: 2 × €24.99 = €49.98
- Envío: €3.99
- IVA: €49.98 × 0.21 = €10.50
- **Total: €64.47**

### 🔄 Ciclo de Vida de una Orden

```
1. pending       → Orden creada, esperando pago
2. processing    → Pago confirmado, procesando PDFs
3. completed     → PDFs listos, orden completada
4. failed        → Pago fallido
5. refunded      → Reembolsado (futuro)
```

---

## Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Preview
pnpm preview

# Linting
pnpm lint

# Type checking
pnpm nuxi typecheck

# Limpiar caché
rm -rf .nuxt node_modules/.cache

# Ver logs de Stripe (CLI)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Recursos

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Nuxt 3 Docs](https://nuxt.com)
- [Strapi v5 Docs](https://docs.strapi.io)
- [Zod Docs](https://zod.dev)

---

## Changelog

### 2024-12-30
- ✅ FASE 1 completada: Configuración base
- ✅ FASE 2 completada: Shopping Cart
- ✅ FASE 3 completada: Página de Checkout
- ✅ FASE 4 completada: Integración de Stripe
- ✅ Documentación completa generada

---

**Próximo paso:** FASE 5 - Procesamiento de Órdenes y Webhooks

**Estado del proyecto:** Funcional para testing de pagos con Stripe. Listo para siguiente fase de integración con Strapi.
