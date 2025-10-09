/**
 * @fileoverview Módulo para gestionar interacciones con la API de Shopify.
 */

// --- CONFIGURACIÓN ---
// NOTA: Debes añadir SHOPIFY_API_ACCESS_TOKEN y SHOPIFY_SHOP_URL a las Script Properties.
const SHOPIFY_API_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('SHOPIFY_API_ACCESS_TOKEN');
const SHOPIFY_SHOP_URL = PropertiesService.getScriptProperties().getProperty('SHOPIFY_SHOP_URL'); // ej: "tu-tienda.myshopify.com"

/**
 * Busca los detalles de un cliente en Shopify usando su dirección de email.
 * @param {string} email El email del cliente a buscar.
 * @returns {Object|null} Un objeto con los datos del cliente o null si no se encuentra.
 */
function getCustomerDetails(email) {
  if (!SHOPIFY_API_ACCESS_TOKEN || !SHOPIFY_SHOP_URL) {
    Logger.log('Error: Las credenciales de la API de Shopify no están configuradas en las Script Properties.');
    return null;
  }

  // La URL para buscar clientes por email en la API de Shopify
  const apiUrl = `https://${SHOPIFY_SHOP_URL}/admin/api/2023-10/customers/search.json?query=email:${encodeURIComponent(email)}`;

  const options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN,
    }
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const jsonResponse = JSON.parse(response.getContentText());
    
    if (jsonResponse.customers && jsonResponse.customers.length > 0) {
      // Devuelve el primer cliente que coincida
      const customer = jsonResponse.customers[0];
      Logger.log(`Cliente encontrado en Shopify: ${customer.first_name} ${customer.last_name}`);
      return customer;
    } else {
      Logger.log(`No se encontró ningún cliente en Shopify con el email: ${email}`);
      return null;
    }
  } catch (e) {
    Logger.log(`Error al conectar con la API de Shopify: ${e.toString()}`);
    return null;
  }
}

/**
 * Busca los detalles del último pedido de un cliente en Shopify.
 * @param {string} customerId El ID del cliente en Shopify.
 * @returns {Object|null} Un objeto con los datos del último pedido o null si no se encuentra.
 */
function getCustomerLatestOrderDetails(customerId) {
  if (!SHOPIFY_API_ACCESS_TOKEN || !SHOPIFY_SHOP_URL) {
    Logger.log('Error: Las credenciales de la API de Shopify no están configuradas en las Script Properties.');
    return null;
  }

  // La URL para buscar los últimos pedidos de un cliente
  const apiUrl = `https://${SHOPIFY_SHOP_URL}/admin/api/2023-10/customers/${customerId}/orders.json?status=any&limit=1&order=created_at+desc`;

  const options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN,
    }
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const jsonResponse = JSON.parse(response.getContentText());
    
    if (jsonResponse.orders && jsonResponse.orders.length > 0) {
            const latestOrder = jsonResponse.orders[0];
            Logger.log(`Último pedido encontrado para el cliente ${customerId}: ${latestOrder.order_number}`);
            
            if (latestOrder.fulfillments && latestOrder.fulfillments.length > 0) {
              const fulfillment = latestOrder.fulfillments[0];
      
              // Buscar la fecha de entrega estimada en los eventos del fulfillment
              const events = getFulfillmentEvents(latestOrder.id, fulfillment.id);
              if (events) {
                const eventWithEstimate = events.find(event => event.estimated_delivery_at);
                if (eventWithEstimate) {
                  // Inyectar la fecha estimada en el objeto fulfillment para que personalizer.js la use
                  fulfillment.estimated_delivery_at = eventWithEstimate.estimated_delivery_at;
                  Logger.log(`Fecha de entrega estimada encontrada en eventos: ${fulfillment.estimated_delivery_at}`);
                }
              }
      
              // Buscar la fecha de entrega final (cuando ya se entregó)
              const deliveryDate = getDeliveryDateFromFulfillmentEvents(latestOrder.id, fulfillment.id);
              if (deliveryDate) {
                // Inyectamos la fecha de entrega en el objeto para que personalizer.js la pueda usar.
                fulfillment.delivered_at = deliveryDate;
              }
            }
            
            // Adjuntar los detalles de los "fulfillment orders" para obtener fechas de entrega más precisas
            const fulfillmentOrders = getFulfillmentOrderDetails(latestOrder.id);
            if (fulfillmentOrders) {
              latestOrder.fulfillment_orders = fulfillmentOrders;
            }
            
            return latestOrder;    } else {
      Logger.log(`No se encontraron pedidos para el cliente con ID: ${customerId}`);
      return null;
    }
  } catch (e) {
    Logger.log(`Error al conectar con la API de Shopify para obtener pedidos: ${e.toString()}`);
    return null;
  }
}

/**
 * Obtiene los detalles de los "fulfillment orders" de un pedido específico.
 * Estos objetos contienen información más detallada sobre la entrega, como el min/max delivery datetime.
 * @param {string} orderId El ID del pedido de Shopify.
 * @returns {Array|null} Un array de objetos de fulfillment order o null.
 */
function getFulfillmentOrderDetails(orderId) {
  if (!SHOPIFY_API_ACCESS_TOKEN || !SHOPIFY_SHOP_URL) {
    Logger.log('Error: Credenciales de la API de Shopify no configuradas.');
    return null;
  }

  const apiUrl = `https://${SHOPIFY_SHOP_URL}/admin/api/2023-10/orders/${orderId}/fulfillment_orders.json`;

  const options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN,
    }
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const jsonResponse = JSON.parse(response.getContentText());
    
    if (jsonResponse.fulfillment_orders && jsonResponse.fulfillment_orders.length > 0) {
      Logger.log(`Se encontraron ${jsonResponse.fulfillment_orders.length} fulfillment orders para el pedido ${orderId}.`);
      return jsonResponse.fulfillment_orders;
    } else {
      Logger.log(`No se encontraron fulfillment orders para el ID de pedido: ${orderId}`);
      return null;
    }
  } catch (e) {
    Logger.log(`Error al obtener fulfillment orders de Shopify: ${e.toString()}`);
    return null;
  }
}

/**
 * Obtiene todos los eventos de un fulfillment específico.
 * @param {string} orderId El ID del pedido.
 * @param {string} fulfillmentId El ID del fulfillment.
 * @returns {Array|null} Un array de objetos de evento o null.
 */
function getFulfillmentEvents(orderId, fulfillmentId) {
  if (!SHOPIFY_API_ACCESS_TOKEN || !SHOPIFY_SHOP_URL) {
    Logger.log('Error: Credenciales de API no configuradas.');
    return null;
  }

  const apiUrl = `https://${SHOPIFY_SHOP_URL}/admin/api/2023-10/orders/${orderId}/fulfillments/${fulfillmentId}/events.json`;
  const options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN,
    }
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const jsonResponse = JSON.parse(response.getContentText());
    
    if (jsonResponse.fulfillment_events && jsonResponse.fulfillment_events.length > 0) {
      return jsonResponse.fulfillment_events;
    }
    return null;
  } catch (e) {
    Logger.log(`Error al obtener los eventos de fulfillment: ${e.toString()}`);
    return null;
  }
}

/**
 * Obtiene los eventos de un fulfillment y busca la fecha de entrega.
 * @param {string} orderId El ID del pedido.
 * @param {string} fulfillmentId El ID del fulfillment.
 * @returns {string|null} La fecha de entrega en formato ISO o null.
 */
function getDeliveryDateFromFulfillmentEvents(orderId, fulfillmentId) {
  if (!SHOPIFY_API_ACCESS_TOKEN || !SHOPIFY_SHOP_URL) {
    Logger.log('Error: Credenciales de API no configuradas.');
    return null;
  }

  const apiUrl = `https://${SHOPIFY_SHOP_URL}/admin/api/2023-10/orders/${orderId}/fulfillments/${fulfillmentId}/events.json`;
  const options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'X-Shopify-Access-Token': SHOPIFY_API_ACCESS_TOKEN,
    }
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const jsonResponse = JSON.parse(response.getContentText());
    
    if (jsonResponse.fulfillment_events && jsonResponse.fulfillment_events.length > 0) {
      const deliveredEvent = jsonResponse.fulfillment_events.find(event => event.status === 'delivered');
      if (deliveredEvent) {
        Logger.log(`Evento 'delivered' encontrado. Fecha: ${deliveredEvent.happened_at}`);
        return deliveredEvent.happened_at;
      }
    }
    Logger.log('No se encontró evento de "delivered" para el fulfillment.');
    return null;
  } catch (e) {
    Logger.log(`Error al obtener los eventos de fulfillment: ${e.toString()}`);
    return null;
  }
}