import { z } from 'zod'

/**
 * Esquema de validación para dirección
 */
export const addressSchema = z.object({
  firstName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre es demasiado largo'),

  lastName: z.string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos son demasiado largos'),

  street: z.string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(100, 'La dirección es demasiado larga'),

  streetLine2: z.string()
    .max(100, 'La dirección complementaria es demasiado larga')
    .optional()
    .or(z.literal('')),

  city: z.string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(50, 'La ciudad es demasiado larga'),

  state: z.string()
    .max(50, 'La provincia es demasiado larga')
    .optional()
    .or(z.literal('')),

  postalCode: z.string()
    .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),

  country: z.string()
    .length(2, 'El código de país debe tener 2 caracteres')
    .default('ES'),

  phone: z.string()
    .regex(/^(\+34)?[6-9]\d{8}$/, 'Teléfono inválido (ej: 612345678 o +34612345678)')
    .optional()
    .or(z.literal('')),
})

/**
 * Esquema de validación para datos de checkout
 */
export const checkoutSchema = z.object({
  customerEmail: z.string()
    .email('Email inválido')
    .min(1, 'El email es requerido'),

  customerName: z.string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(100, 'El nombre completo es demasiado largo'),

  billingAddress: addressSchema,

  shippingAddress: addressSchema,

  sameAsBilling: z.boolean().default(true),

  acceptTerms: z.boolean()
    .refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones',
    }),

  userId: z.number().optional(),
})

/**
 * Tipo inferido del esquema de dirección
 */
export type AddressFormData = z.infer<typeof addressSchema>

/**
 * Tipo inferido del esquema de checkout
 */
export type CheckoutFormData = z.infer<typeof checkoutSchema>

/**
 * Mensajes de error en español para Zod
 */
export const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === 'string') {
      return { message: 'Este campo es requerido' }
    }
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      return { message: `Mínimo ${issue.minimum} caracteres` }
    }
  }

  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === 'string') {
      return { message: `Máximo ${issue.maximum} caracteres` }
    }
  }

  return { message: ctx.defaultError }
}

// Configurar mensajes de error personalizados
z.setErrorMap(customErrorMap)
