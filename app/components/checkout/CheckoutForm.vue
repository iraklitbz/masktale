<script setup lang="ts">
import AddressForm from './AddressForm.vue'
import type { CheckoutFormData } from '~/utils/validation'

const props = defineProps<{
  formData: CheckoutFormData
  isAuthenticated: boolean
  getFieldError: (field: string) => string | undefined
  validateField: (field: string) => boolean
}>()

const emit = defineEmits<{
  'update:formData': [value: Partial<CheckoutFormData>]
  'toggle:sameAsBilling': []
}>()

const updateField = (field: keyof CheckoutFormData, value: any) => {
  emit('update:formData', { [field]: value })
  setTimeout(() => {
    props.validateField(field)
  }, 100)
}

const updateAddress = (type: 'billingAddress' | 'shippingAddress', value: any) => {
  emit('update:formData', { [type]: value })
}
</script>

<template>
  <div class="checkout-form">
    <!-- Personal Information -->
    <section class="form-section">
      <h2 class="section-title">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Información de contacto
      </h2>

      <div class="form-content">
        <div class="form-grid">
          <!-- Customer Name -->
          <div class="form-group full-width">
            <label
              for="customerName"
              class="form-label"
            >
              Nombre completo <span class="required">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              :value="formData.customerName"
              @input="updateField('customerName', ($event.target as HTMLInputElement).value)"
              class="form-input"
              :class="{ 'input-error': getFieldError('customerName') }"
              placeholder="Juan García Pérez"
              autocomplete="name"
              :disabled="isAuthenticated"
            >
            <p
              v-if="getFieldError('customerName')"
              class="error-message"
            >
              {{ getFieldError('customerName') }}
            </p>
          </div>

          <!-- Customer Email -->
          <div class="form-group full-width">
            <label
              for="customerEmail"
              class="form-label"
            >
              Email <span class="required">*</span>
            </label>
            <input
              id="customerEmail"
              type="email"
              :value="formData.customerEmail"
              @input="updateField('customerEmail', ($event.target as HTMLInputElement).value)"
              class="form-input"
              :class="{ 'input-error': getFieldError('customerEmail') }"
              placeholder="tu@email.com"
              autocomplete="email"
              :disabled="isAuthenticated"
            >
            <p
              v-if="getFieldError('customerEmail')"
              class="error-message"
            >
              {{ getFieldError('customerEmail') }}
            </p>
            <p
              v-if="isAuthenticated"
              class="info-message"
            >
              Este email está asociado a tu cuenta
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Billing Address -->
    <section class="form-section">
      <h2 class="section-title">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        Dirección de facturación
      </h2>

      <AddressForm
        :model-value="formData.billingAddress"
        @update:model-value="updateAddress('billingAddress', $event)"
        title=""
        prefix="billingAddress"
        :get-field-error="getFieldError"
        :validate-field="validateField"
      />
    </section>

    <!-- Shipping Address -->
    <section class="form-section">
      <div class="section-header">
        <h2 class="section-title">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Dirección de envío
        </h2>

        <!-- Same as Billing Checkbox -->
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="formData.sameAsBilling"
            @change="emit('toggle:sameAsBilling')"
            class="checkbox-input"
          >
          <span class="checkbox-text">Usar misma dirección de facturación</span>
        </label>
      </div>

      <Transition name="slide-fade">
        <AddressForm
          v-if="!formData.sameAsBilling"
          :model-value="formData.shippingAddress"
          @update:model-value="updateAddress('shippingAddress', $event)"
          title=""
          prefix="shippingAddress"
          :get-field-error="getFieldError"
          :validate-field="validateField"
        />
        <div
          v-else
          class="same-address-message"
        >
          <svg
            class="w-5 h-5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>Se utilizará la misma dirección para facturación y envío</p>
        </div>
      </Transition>
    </section>

    <!-- Terms and Conditions -->
    <section class="form-section terms-section">
      <label class="checkbox-label terms-checkbox">
        <input
          type="checkbox"
          :checked="formData.acceptTerms"
          @change="updateField('acceptTerms', ($event.target as HTMLInputElement).checked)"
          class="checkbox-input"
          :class="{ 'input-error': getFieldError('acceptTerms') }"
        >
        <span class="checkbox-text">
          Acepto los
          <a
            href="/terms"
            target="_blank"
            class="link"
          >términos y condiciones</a>
          y la
          <a
            href="/privacy"
            target="_blank"
            class="link"
          >política de privacidad</a>
        </span>
      </label>
      <p
        v-if="getFieldError('acceptTerms')"
        class="error-message"
      >
        {{ getFieldError('acceptTerms') }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .section-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-content {
  margin-top: 1rem;
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

.form-input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
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
}

.info-message {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

/* Checkbox Styles */
.checkbox-label {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.checkbox-input:checked {
  background-color: #9333ea;
  border-color: #9333ea;
}

.checkbox-input:focus {
  outline: none;
  ring: 2px;
  ring-color: #e9d5ff;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.terms-section {
  background-color: #faf5ff;
  border-color: #e9d5ff;
}

.terms-checkbox {
  padding: 0.5rem;
}

.link {
  color: #9333ea;
  text-decoration: underline;
  font-weight: 500;
}

.link:hover {
  color: #7e22ce;
}

/* Same Address Message */
.same-address-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  color: #166534;
  font-size: 0.875rem;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
