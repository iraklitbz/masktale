# Configuración de Modelos en Strapi - FASE 5

**Proyecto:** Mask - Integración de Órdenes
**Fecha:** 2025-12-31
**Strapi URL:** https://cms.iraklitbz.dev/admin

---

## Paso 1: Crear Component "Address"

1. Ve a **Content-Type Builder** en Strapi
2. En la sección **Components**, haz clic en **Create new component**
3. Configuración:
   - **Display name:** Address
   - **Category:** order (crear nueva categoría)
   - **Icon:** (cualquiera, ej: location)

4. Agrega los siguientes campos:

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `street` | Text (Short text) | Required: ✅ |
| `city` | Text (Short text) | Required: ✅ |
| `state` | Text (Short text) | Required: ✅ |
| `postalCode` | Text (Short text) | Required: ✅ |
| `country` | Text (Short text) | Required: ✅, Default: "España" |

5. Haz clic en **Save**

---

## Paso 2: Crear Collection Type "Order"

1. En **Content-Type Builder**, haz clic en **Create new collection type**
2. **Display name:** Order
3. Agrega los siguientes campos:

### Campos Básicos

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `orderNumber` | Text (Short text) | Required: ✅, Unique: ✅ |
| `state` | Enumeration | Values: `pending`, `processing`, `completed`, `failed`, `refunded`<br>Default: `pending`<br>Required: ✅<br>**⚠️ IMPORTANTE: Llamarlo "state" NO "status"** |
| `total` | Number (Decimal) | Required: ✅, Min: 0 |
| `currency` | Text (Short text) | Required: ✅, Default: "eur" |

### Campos de Cliente

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `customerEmail` | Email | Required: ✅ |
| `customerName` | Text (Short text) | Required: ✅ |
| `customerPhone` | Text (Short text) | Required: ✅ |

### Stripe

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `stripePaymentIntentId` | Text (Short text) | Required: ✅, Unique: ✅ |

### Direcciones (Components)

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `billingAddress` | Component | Component: `order.Address`<br>Type: Single component<br>Required: ✅ |
| `shippingAddress` | Component | Component: `order.Address`<br>Type: Single component<br>Required: ✅ |

### Relaciones

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `user` | Relation | Relation: `Order` belongs to `User`<br>**NO marcar como required** (permite órdenes de invitados) |
| `items` | Relation | Relation: `Order` has many `OrderItem`<br>Required: ✅ |

4. Haz clic en **Save**

---

## Paso 3: Crear Collection Type "OrderItem"

1. En **Content-Type Builder**, haz clic en **Create new collection type**
2. **Display name:** OrderItem
3. Agrega los siguientes campos:

### Campos del Libro

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `sessionId` | Text (Short text) | Required: ✅ |
| `bookTitle` | Text (Short text) | Required: ✅ |
| `childName` | Text (Short text) | Required: ✅ |
| `quantity` | Number (Integer) | Required: ✅, Min: 1, Default: 1 |
| `price` | Number (Decimal) | Required: ✅, Min: 0 |

### PDF

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `pdfUrl` | Text (Long text) | Required: ❌ (puede ser null mientras se genera) |

### Relación

| Campo | Tipo | Configuraciones |
|-------|------|----------------|
| `order` | Relation | Relation: `OrderItem` belongs to `Order`<br>Required: ✅ |

4. Haz clic en **Save**

---

## Paso 4: Configurar Permisos

### Para usuarios autenticados (Authenticated):

1. Ve a **Settings** → **Users & Permissions Plugin** → **Roles** → **Authenticated**
2. En **Permissions**, busca **Order** y marca:
   - ✅ `find` (ver lista de órdenes propias)
   - ✅ `findOne` (ver detalle de orden propia)
3. En **OrderItem**, marca:
   - ✅ `find` (ver items de órdenes propias)
   - ✅ `findOne` (ver detalle de item)
4. Haz clic en **Save**

### Para público (Public):

**NO dar permisos públicos** a Order ni OrderItem por seguridad.

---

## Paso 5: Verificar la Estructura

Deberías tener:

```
Components:
  └─ order
      └─ Address (5 campos)

Collection Types:
  ├─ Order (12 campos + 2 relaciones)
  └─ OrderItem (6 campos + 1 relación)
```

---

## Paso 6: Crear Orden de Prueba (Opcional)

Para verificar que todo funciona:

1. Ve a **Content Manager** → **Order**
2. Haz clic en **Create new entry**
3. Llena un orden de ejemplo:
   - orderNumber: `TEST-001`
   - state: `pending`
   - total: `29.99`
   - currency: `eur`
   - customerEmail: `test@example.com`
   - customerName: `Test User`
   - customerPhone: `+34612345678`
   - stripePaymentIntentId: `pi_test_123`
   - billingAddress: (llenar todos los campos)
   - shippingAddress: (llenar todos los campos)
4. Haz clic en **Save**

Si no hay errores, los modelos están correctamente configurados! ✅

---

## Notas Importantes

### ⚠️ Campo "state" vs "status"

**CRÍTICO:** El campo para el estado de la orden se llama `state` y NO `status` porque `status` es un campo reservado en Strapi v5 que causa conflictos internos.

### 🔒 Seguridad

- Las órdenes solo deben ser visibles por:
  1. El usuario autenticado que la creó (filtrado por `user.id`)
  2. Usuarios invitados a través de `email + orderNumber` (implementaremos endpoint especial)
- Los webhooks de Stripe verificarán la firma antes de actualizar órdenes

### 📊 Índices Recomendados

Strapi crea automáticamente índices para campos únicos (`orderNumber`, `stripePaymentIntentId`), pero si tienes problemas de performance, considera agregar índices manuales en:
- `order.customerEmail`
- `order.state`
- `order.createdAt`

---

## Próximo Paso

Una vez creados estos modelos en Strapi, avísame y continuaremos con:
- ✅ Modelos en Strapi
- ⏳ Crear utilidades de procesamiento de órdenes
- ⏳ Crear endpoint de confirmación
- ⏳ Implementar webhooks

---

**¿Listo?** Cuando termines de crear los modelos en Strapi, dime "listo" y seguimos con el código.
