/**
 * @fileoverview Módulo para personalizar plantillas de mensajes.
 */

/**
 * Reemplaza los placeholders en una plantilla con datos extraídos del correo.
 * 
 * @param {string} template La plantilla de texto con placeholders (ej. "Hola {{customer_name}}").
 * @param {string} emailBody El cuerpo del correo electrónico en texto plano.
 * @returns {string} La plantilla personalizada.
 */
function personalizeTemplate(template, emailBody, customer) {
  let personalizedText = template;

  // Usar el nombre del cliente de Shopify si existe, si no, intentar extraerlo del correo.
  const customerName = customer ? customer.first_name : extractCustomerName(emailBody);

  const data = {
    'customer_name': customerName, // Sin fallback, puede ser null
    // Añadir más extracciones aquí, por ejemplo:
    // 'order_id': extractOrderId(emailBody),
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
