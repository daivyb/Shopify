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
      return latestOrder;
    } else {
      Logger.log(`No se encontraron pedidos para el cliente con ID: ${customerId}`);
      return null;
    }
  } catch (e) {
    Logger.log(`Error al conectar con la API de Shopify para obtener pedidos: ${e.toString()}`);
    return null;
  }
}

