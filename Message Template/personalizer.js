/**
 * @fileoverview Módulo para personalizar plantillas de mensajes.
 */

/**
 * Reemplaza los placeholders en una plantilla con datos extraídos del correo y de Shopify.
 * 
 * @param {string} template La plantilla de texto con placeholders (ej. "Hola {{customer_name}}").
 * @param {string} emailBody El cuerpo del correo electrónico en texto plano.
 * @param {Object|null} customer Detalles del cliente de Shopify.
 * @param {Object|null} latestOrder Detalles del último pedido del cliente de Shopify.
 * @returns {string} La plantilla personalizada.
 */
function personalizeTemplate(template, emailBody, customer, latestOrder) {
  let personalizedText = template;

  const data = {
    'customer_name': customer ? customer.first_name : extractCustomerName(emailBody),
    'customer_full_name': customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : extractCustomerName(emailBody),
    'customer_email': customer ? customer.email : null,
    'order_id': latestOrder ? latestOrder.order_number : extractOrderId(emailBody),
    'order_date': latestOrder && latestOrder.created_at ? new Date(latestOrder.created_at).toLocaleDateString() : null,
    'tracking_number': latestOrder && latestOrder.fulfillments && latestOrder.fulfillments.length > 0 && latestOrder.fulfillments[0].tracking_number ? latestOrder.fulfillments[0].tracking_number : null,
    'tracking_url': latestOrder && latestOrder.fulfillments && latestOrder.fulfillments.length > 0 && latestOrder.fulfillments[0].tracking_url ? latestOrder.fulfillments[0].tracking_url : null,
    'order_items': latestOrder ? formatOrderItems(latestOrder.line_items) : null,
    // New placeholders for Shipping Issue
    'delivery_status': latestOrder && latestOrder.fulfillments && latestOrder.fulfillments.length > 0 && latestOrder.fulfillments[0].shipment_status ? latestOrder.fulfillments[0].shipment_status : null,
    'carrier_name': latestOrder && latestOrder.fulfillments && latestOrder.fulfillments.length > 0 && latestOrder.fulfillments[0].tracking_company ? latestOrder.fulfillments[0].tracking_company : null,
    'expected_delivery_date': latestOrder && latestOrder.fulfillments && latestOrder.fulfillments.length > 0 && latestOrder.fulfillments[0].estimated_delivery_at ? new Date(latestOrder.fulfillments[0].estimated_delivery_at).toLocaleDateString() : null,
    'delivery_location': latestOrder && latestOrder.shipping_address && latestOrder.shipping_address.address1 ? latestOrder.shipping_address.address1 : null, // Assuming address1 is sufficient for location
    'delivery_date': latestOrder && latestOrder.fulfillments && latestOrder.fulfillments.length > 0 && latestOrder.fulfillments[0].delivered_at ? new Date(latestOrder.fulfillments[0].delivered_at).toLocaleDateString() : null,
    'delivery_address': latestOrder && latestOrder.shipping_address ? formatAddress(latestOrder.shipping_address) : null,
    'delivery_delay_days': calculateDeliveryDelay(latestOrder), // Requires a new helper function
    'product_details': latestOrder ? formatProductDetails(latestOrder.line_items) : null, // Requires a new helper function
    'product_quantity': latestOrder && latestOrder.line_items && latestOrder.line_items.length > 0 ? latestOrder.line_items[0].quantity : null, // Assuming first item for simplicity
    'product_name': latestOrder && latestOrder.line_items && latestOrder.line_items.length > 0 ? latestOrder.line_items[0].name : null, // Assuming first item for simplicity
  };

  // Reemplazar cada placeholder SOLO si se encontró un valor para él.
  for (const key in data) {
    const placeholder = `{{${key}}}`;
    const value = data[key];
    
    // Condición clave: solo reemplazar si el valor no es nulo o vacío.
    if (value) {
      // Usamos una expresión regular global para reemplazar todas las ocurrencias.
      personalizedText = personalizedText.replace(new RegExp(placeholder, 'g'), value);
    }
  }

  return personalizedText;
}

/**
 * Intenta extraer el nombre del cliente del cuerpo del correo.
 * Esta es una función de ejemplo y debería ser adaptada.
 * 
 * @param {string} emailBody El cuerpo del correo.
 * @returns {string|null} El nombre extraído o null.
 */
function extractCustomerName(emailBody) {
    // Intenta encontrar patrones como "Hi [Name],", "Hello [Name],", etc.
    const match = emailBody.match(/^(?:Hi|Hello|Hola)\s+([\w\s]+),/i);
    if (match && match[1]) {
        return match[1].trim();
    }

    // Podríamos añadir más lógica aquí, como buscar en la firma del correo.

    return null;
}

/**
 * Ejemplo de cómo se podría extraer un ID de orden.
 * @param {string} emailBody El cuerpo del correo.
 * @returns {string|null} El ID de orden extraído o null.
 */
function extractOrderId(emailBody) {
  // Busca patrones como "order #12345" o "pedido SHP-1023"
  const match = emailBody.match(/(?:order|pedido)\s*#?([a-zA-Z0-9-]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

/**
 * Formatea una lista de ítems de pedido en una cadena legible.
 * @param {Array} lineItems Array de objetos de ítems de línea de Shopify.
 * @returns {string} Una cadena formateada con los ítems del pedido.
 */
function formatOrderItems(lineItems) {
  if (!lineItems || lineItems.length === 0) {
    return 'los ítems de su pedido';
  }
  return lineItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
}

// New helper function for formatting address
function formatAddress(address) {
  if (!address) return null;
  const parts = [address.address1, address.address2, address.city, address.province, address.zip, address.country].filter(Boolean);
  return parts.join(', ');
}

// New helper function for calculating delivery delay
function calculateDeliveryDelay(order) {
  if (!order || !order.fulfillments || order.fulfillments.length === 0) return null;
  const fulfillment = order.fulfillments[0];
  if (fulfillment.status === 'delivered' && fulfillment.delivered_at && fulfillment.estimated_delivery_at) {
    const deliveredDate = new Date(fulfillment.delivered_at);
    const estimatedDate = new Date(fulfillment.estimated_delivery_at);
    const diffTime = Math.abs(deliveredDate - estimatedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
}

// New helper function for formatting product details
function formatProductDetails(lineItems) {
  if (!lineItems || lineItems.length === 0) return null;
  return lineItems.map(item => `${item.quantity}x ${item.name} (SKU: ${item.sku || 'N/A'})`).join(', ');
}
