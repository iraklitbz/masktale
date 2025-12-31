<script setup lang="ts">
import type { AddressFormData } from '~/utils/validation'

const props = defineProps<{
  modelValue: AddressFormData
  title: string
  prefix: string // 'billingAddress' or 'shippingAddress'
  getFieldError?: (field: string) => string | undefined
  validateField?: (field: string) => boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AddressFormData]
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const updateField = (field: keyof AddressFormData, value: any) => {
  localValue.value = {
    ...localValue.value,
    [field]: value,
  }
  // Validar campo al cambiar
  if (props.validateField) {
    props.validateField(`${props.prefix}.${field}`)
  }
}

const getError = (field: string) => {
  if (props.getFieldError) {
    return props.getFieldError(`${props.prefix}.${field}`)
  }
  return undefined
}
</script>

<template>
  <div class="address-form">
    <h3 class="form-title">{{ title }}</h3>

    <div class="form-grid">
      <!-- First Name -->
      <div class="form-group">
        <label
          for="`${prefix}-firstName`"
          class="form-label"
        >
          Nombre <span class="required">*</span>
        </label>
        <input
          :id="`${prefix}-firstName`"
          type="text"
          :value="localValue.firstName"
          @input="updateField('firstName', ($event.target as HTMLInputElement).value)"
          class="form-input"
          :class="{ 'input-error': getError('firstName') }"
          placeholder="Juan"
          autocomplete="given-name"
        >
        <p
          v-if="getError('firstName')"
          class="error-message"
        >
          {{ getError('firstName') }}
        </p>
      </div>

      <!-- Last Name -->
      <div class="form-group">
        <label
          :for="`${prefix}-lastName`"
          class="form-label"
        >
          Apellidos <span class="required">*</span>
        </label>
        <input
          :id="`${prefix}-lastName`"
          type="text"
          :value="localValue.lastName"
          @input="updateField('lastName', ($event.target as HTMLInputElement).value)"
          class="form-input"
          :class="{ 'input-error': getError('lastName') }"
          placeholder="García Pérez"
          autocomplete="family-name"
        >
        <p
          v-if="getError('lastName')"
          class="error-message"
        >
          {{ getError('lastName') }}
        </p>
      </div>

      <!-- Street -->
      <div class="form-group full-width">
        <label
          :for="`${prefix}-street`"
          class="form-label"
        >
          Dirección <span class="required">*</span>
        </label>
        <input
          :id="`${prefix}-street`"
          type="text"
          :value="localValue.street"
          @input="updateField('street', ($event.target as HTMLInputElement).value)"
          class="form-input"
          :class="{ 'input-error': getError('street') }"
          placeholder="Calle Mayor, 123"
          autocomplete="street-address"
        >
        <p
          v-if="getError('street')"
          class="error-message"
        >
          {{ getError('street') }}
        </p>
      </div>

      <!-- Street Line 2 -->
      <div class="form-group full-width">
        <label
          :for="`${prefix}-streetLine2`"
          class="form-label"
        >
          Piso, Puerta (opcional)
        </label>
        <input
          :id="`${prefix}-streetLine2`"
          type="text"
          :value="localValue.streetLine2"
          @input="updateField('streetLine2', ($event.target as HTMLInputElement).value)"
          class="form-input"
          placeholder="2º A"
          autocomplete="address-line2"
        >
      </div>

      <!-- City -->
      <div class="form-group">
        <label
          :for="`${prefix}-city`"
          class="form-label"
        >
          Ciudad <span class="required">*</span>
        </label>
        <input
          :id="`${prefix}-city`"
          type="text"
          :value="localValue.city"
          @input="updateField('city', ($event.target as HTMLInputElement).value)"
          class="form-input"
          :class="{ 'input-error': getError('city') }"
          placeholder="Madrid"
          autocomplete="address-level2"
        >
        <p
          v-if="getError('city')"
          class="error-message"
        >
          {{ getError('city') }}
        </p>
      </div>

      <!-- State/Province -->
      <div class="form-group">
        <label
          :for="`${prefix}-state`"
          class="form-label"
        >
          Provincia (opcional)
        </label>
        <input
          :id="`${prefix}-state`"
          type="text"
          :value="localValue.state"
          @input="updateField('state', ($event.target as HTMLInputElement).value)"
          class="form-input"
          placeholder="Madrid"
          autocomplete="address-level1"
        >
      </div>

      <!-- Postal Code -->
      <div class="form-group">
        <label
          :for="`${prefix}-postalCode`"
          class="form-label"
        >
          Código Postal <span class="required">*</span>
        </label>
        <input
          :id="`${prefix}-postalCode`"
          type="text"
          :value="localValue.postalCode"
          @input="updateField('postalCode', ($event.target as HTMLInputElement).value)"
          class="form-input"
          :class="{ 'input-error': getError('postalCode') }"
          placeholder="28001"
          maxlength="5"
          autocomplete="postal-code"
        >
        <p
          v-if="getError('postalCode')"
          class="error-message"
        >
          {{ getError('postalCode') }}
        </p>
      </div>

      <!-- Phone -->
      <div class="form-group">
        <label
          :for="`${prefix}-phone`"
          class="form-label"
        >
          Teléfono (opcional)
        </label>
        <input
          :id="`${prefix}-phone`"
          type="tel"
          :value="localValue.phone"
          @input="updateField('phone', ($event.target as HTMLInputElement).value)"
          class="form-input"
          :class="{ 'input-error': getError('phone') }"
          placeholder="612345678"
          autocomplete="tel"
        >
        <p
          v-if="getError('phone')"
          class="error-message"
        >
          {{ getError('phone') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.address-form {
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.form-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-title::before {
  content: '';
  width: 4px;
  height: 1.5rem;
  background: linear-gradient(to bottom, #9333ea, #ec4899);
  border-radius: 2px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .full-width {
    grid-column: 1 / -1;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #dc2626;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
  transition: all 0.2s ease;
  background-color: white;
}

.form-input:focus {
  outline: none;
  border-color: #9333ea;
  ring: 2px;
  ring-color: #e9d5ff;
}

.form-input::placeholder {
  color: #9ca3af;
}

.input-error {
  border-color: #dc2626;
}

.input-error:focus {
  ring-color: #fecaca;
}

.error-message {
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: -0.25rem;
}
</style>
