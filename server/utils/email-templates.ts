/**
 * Email Templates - HTML puro para evitar conflictos React/Vue
 */

interface OrderItem {
  bookTitle: string
  childName: string
  quantity: number
  price: number
}

interface OrderConfirmationData {
  customerName: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  orderDate: string
}

interface OrderCompletedData {
  customerName: string
  orderNumber: string
  items: Array<{
    bookTitle: string
    childName: string
  }>
  completedDate: string
}

/**
 * Template de confirmación de pedido
 */
export function getOrderConfirmationHtml(data: OrderConfirmationData): string {
  const { customerName, orderNumber, items, totalAmount, orderDate } = data

  const itemsHtml = items
    .map(
      (item) => `
    <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0 0 4px;">
            ${item.bookTitle}
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">
            Para: ${item.childName}
          </p>
          <p style="color: #9333ea; font-size: 12px; font-weight: 600; margin: 0;">
            Cantidad: ${item.quantity}
          </p>
        </div>
        <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0; white-space: nowrap; margin-left: 16px;">
          ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity)}
        </p>
      </div>
    </div>
  `
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedido confirmado - ${orderNumber}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
    <div style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; max-width: 600px;">

      <!-- Header -->
      <div style="padding: 32px 48px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; padding: 0;">
          🎨 Mask Stories
        </h1>
        <p style="color: #e0e7ff; font-size: 14px; margin: 8px 0 0;">
          Cuentos personalizados con IA
        </p>
      </div>

      <!-- Success Section -->
      <div style="padding: 32px 48px; text-align: center;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background-color: #10b981; color: #ffffff; font-size: 32px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          ✓
        </div>
        <h2 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 16px 0 8px;">
          ¡Pedido Confirmado!
        </h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
          Gracias por tu compra, ${customerName}
        </p>
      </div>

      <!-- Order Info -->
      <div style="padding: 24px 48px; background-color: #f9fafb; border-radius: 8px; margin: 0 48px 24px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">
          Número de pedido
        </p>
        <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0 0 16px;">
          ${orderNumber}
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">
          Fecha
        </p>
        <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0;">
          ${orderDate}
        </p>
      </div>

      <!-- Order Items -->
      <div style="padding: 0 48px;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
          Detalles del pedido
        </h3>
        ${itemsHtml}
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 48px;">

      <!-- Total -->
      <div style="padding: 0 48px; display: flex; justify-content: space-between; align-items: center;">
        <p style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0;">
          Total pagado
        </p>
        <p style="color: #9333ea; font-size: 24px; font-weight: bold; margin: 0;">
          ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalAmount)}
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 48px;">

      <!-- Next Steps -->
      <div style="padding: 24px 48px; background-color: #eff6ff; border-radius: 8px; margin: 24px 48px;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
          ¿Qué sigue?
        </h3>

        <div style="display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start;">
          <div style="font-size: 24px; min-width: 32px;">📧</div>
          <div>
            <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0 0 4px;">
              1. Confirmación
            </p>
            <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.4;">
              Has recibido este email de confirmación
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start;">
          <div style="font-size: 24px; min-width: 32px;">🎨</div>
          <div>
            <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0 0 4px;">
              2. Procesamiento
            </p>
            <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.4;">
              Estamos preparando tus libros personalizados
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start;">
          <div style="font-size: 24px; min-width: 32px;">📦</div>
          <div>
            <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0 0 4px;">
              3. Envío
            </p>
            <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.4;">
              Te notificaremos cuando tu pedido sea enviado
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 24px 48px; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px;">
          Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          © 2025 Mask Stories - Cuentos personalizados con IA
        </p>
      </div>

    </div>
  </body>
</html>
  `
}

/**
 * Template de pedido completado
 */
export function getOrderCompletedHtml(data: OrderCompletedData): string {
  const { customerName, orderNumber, items, completedDate } = data

  const itemsHtml = items
    .map(
      (item) => `
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
      <p style="color: #1f2937; font-size: 14px; font-weight: bold; margin: 0 0 4px;">
        ${item.bookTitle}
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        Para: ${item.childName}
      </p>
    </div>
  `
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedido listo - ${orderNumber}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
    <div style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; max-width: 600px;">

      <!-- Header -->
      <div style="padding: 32px 48px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; padding: 0;">
          🎨 Mask Stories
        </h1>
        <p style="color: #e0e7ff; font-size: 14px; margin: 8px 0 0;">
          Cuentos personalizados con IA
        </p>
      </div>

      <!-- Success Section -->
      <div style="padding: 32px 48px; text-align: center;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background-color: #10b981; color: #ffffff; font-size: 32px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          📦
        </div>
        <h2 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 16px 0 8px;">
          ¡Tu pedido está listo!
        </h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
          Hola ${customerName}, tenemos buenas noticias
        </p>
      </div>

      <!-- Order Info -->
      <div style="padding: 24px 48px; background-color: #f9fafb; border-radius: 8px; margin: 0 48px 24px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">
          Número de pedido
        </p>
        <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0 0 16px;">
          ${orderNumber}
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">
          Fecha de completado
        </p>
        <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0;">
          ${completedDate}
        </p>
      </div>

      <!-- Message -->
      <div style="padding: 0 48px; margin-bottom: 24px;">
        <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
          Tu pedido ha sido completado y está siendo preparado para el envío.
          Recibirás un email con la información de seguimiento una vez que sea despachado.
        </p>
      </div>

      <!-- Order Items -->
      <div style="padding: 0 48px;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
          Libros incluidos
        </h3>
        ${itemsHtml}
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 48px;">

      <!-- Footer -->
      <div style="padding: 24px 48px; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px;">
          Gracias por confiar en nosotros para crear momentos mágicos de lectura.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          © 2025 Mask Stories - Cuentos personalizados con IA
        </p>
      </div>

    </div>
  </body>
</html>
  `
}
