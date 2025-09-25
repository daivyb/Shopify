/**
 * @fileoverview Archivo principal que orquesta la creación de borradores de respuesta.
 */

/**
 * Función principal que se ejecuta para procesar correos y crear borradores.
 * Puede ser ejecutada manualmente o con un trigger de tiempo.
 */
function createDraftReplies() {
  Logger.log('Iniciando el proceso de creación de borradores inteligentes...');

  const threads = findThreadsToProcess();
  if (threads.length === 0) {
    Logger.log('No hay correos nuevos para procesar.');
    return;
  }

  const tagReferences = getTagReferences();

  threads.forEach(thread => {
    const threadId = thread.getId();
    Logger.log(`Procesando hilo: ${threadId}`);

    const classificationLabel = getClassificationLabel(thread, tagReferences);
    if (!classificationLabel) {
      Logger.log(`El hilo ${threadId} no tiene una etiqueta de clasificación válida. Omitiendo.`);
      return; // Continúa con el siguiente hilo
    }
    Logger.log(`Etiqueta de clasificación encontrada: ${classificationLabel}`);

    const allTemplates = getAllTemplatesForLabel(classificationLabel);
    if (!allTemplates) {
      Logger.log(`No se encontraron plantillas en Notion para el label '${classificationLabel}'.`);
      return;
    }

    const messageDetails = getFirstMessageDetails(thread);
    if (!messageDetails) {
      Logger.log(`No se pudieron obtener los detalles del mensaje para el hilo ${threadId}.`);
      return;
    }

    // Buscar al cliente en Shopify para personalizar el mensaje
    const customer = getCustomerDetails(messageDetails.from);
    let latestOrder = null;
    if (customer && customer.id) {
      latestOrder = getCustomerLatestOrderDetails(customer.id);
    }
    
    // Construir el prompt para Gemini
    const prompt = buildPromptForBestResponse(messageDetails.body, allTemplates, customer, latestOrder);

    // Obtener la mejor respuesta de Gemini
    const geminiChoice = getGeminiResponse(prompt);
    if (!geminiChoice) {
      Logger.log('No se pudo obtener una respuesta de Gemini o la respuesta fue inválida.');
      return;
    }

    // Parsear la respuesta de Gemini para obtener el texto de la plantilla
    const selectedTemplate = findTemplateFromGeminiChoice(geminiChoice, allTemplates);

    if (!selectedTemplate) {
      Logger.log(`La elección de Gemini (${geminiChoice}) no corresponde a ninguna plantilla conocida.`);
      return;
    }

    Logger.log(`Plantilla seleccionada por Gemini: ${geminiChoice}`);

    const personalizedMessage = personalizeTemplate(selectedTemplate, messageDetails.body, customer, latestOrder);
    createDraftReply(threadId, personalizedMessage);
    applyProcessedLabel(threadId);
    
    Logger.log(`Proceso completado para el hilo: ${threadId}`);
  });

  Logger.log('Proceso de creación de borradores finalizado.');
}

/**
 * Construye el prompt para que Gemini elija la mejor respuesta.
 * @param {string} emailBody El cuerpo del correo del cliente.
 * @param {Object} allTemplates Todas las plantillas disponibles para la categoría.
 * @param {Object|null} customer Detalles del cliente de Shopify.
 * @param {Object|null} latestOrder Detalles del último pedido del cliente de Shopify.
 * @returns {string} El prompt completo.
 */
function buildPromptForBestResponse(emailBody, allTemplates, customer, latestOrder) {
  let optionsText = '\n';
  Object.keys(allTemplates).forEach(context => {
    Object.keys(allTemplates[context]).forEach(responseKey => {
      const identifier = `${context}::${responseKey}`;
      optionsText += `ID: "${identifier}"\nTemplate: ${allTemplates[context][responseKey]}\n\n`;
    });
  });

  let customerInfo = '';
  if (customer) {
    customerInfo += `\n--- INFORMACIÓN DEL CLIENTE ---\n`;
    customerInfo += `Nombre: ${customer.first_name || 'N/A'} ${customer.last_name || 'N/A'}\n`;
    customerInfo += `Email: ${customer.email || 'N/A'}\n`;
    // Añadir más detalles del cliente si son relevantes para la selección de la plantilla
  }

  let orderInfo = '';
  if (latestOrder) {
    orderInfo += `\n--- INFORMACIÓN DEL ÚLTIMO PEDIDO ---\n`;
    orderInfo += `Número de Pedido: ${latestOrder.order_number || 'N/A'}\n`;
    orderInfo += `Fecha del Pedido: ${latestOrder.created_at ? new Date(latestOrder.created_at).toLocaleDateString() : 'N/A'}\n`;
    orderInfo += `Estado Financiero: ${latestOrder.financial_status || 'N/A'}\n`;
    orderInfo += `Estado de Cumplimiento: ${latestOrder.fulfillment_status || 'N/A'}\n`;
    orderInfo += `Estado de Entrega: ${latestOrder.fulfillment_status === 'fulfilled' ? 'Entregado' : 'No Entregado'}\n`;
    // Añadir detalles de los productos en el pedido si es necesario
    if (latestOrder.line_items && latestOrder.line_items.length > 0) {
      orderInfo += `Productos:\n`;
      latestOrder.line_items.forEach(item => {
        orderInfo += `  - ${item.quantity} x ${item.name} (SKU: ${item.sku || 'N/A'})\n`;
      });
    }
    // Añadir tracking number si está disponible en el pedido
    if (latestOrder.fulfillments && latestOrder.fulfillments.length > 0) {
      latestOrder.fulfillments.forEach(fulfillment => {
        if (fulfillment.tracking_number) {
          orderInfo += `Número de Seguimiento: ${fulfillment.tracking_number}\n`;
        }
        if (fulfillment.tracking_url) {
          orderInfo += `URL de Seguimiento: ${fulfillment.tracking_url}\n`;
        }
      });
    }
  }

  return `Analiza el siguiente correo electrónico de un cliente y elige la plantilla de respuesta más adecuada de la lista proporcionada. Responde únicamente con el ID de la plantilla seleccionada (por ejemplo, "Pedido perdido::Respuesta_A").\n\n---
CORREO DEL CLIENTE ---\n${emailBody}\n${customerInfo}\n${orderInfo}\n\n---
PLANTILLAS DISPONIBLES ---\n${optionsText}`;
}

/**
 * Busca la plantilla correspondiente a la elección de Gemini.
 * @param {string} geminiChoice El ID de la plantilla devuelto por Gemini (ej. "Contexto::Respuesta_A").
 * @param {Object} allTemplates El objeto completo de plantillas.
 * @returns {string|null} El texto de la plantilla seleccionada.
 */
function findTemplateFromGeminiChoice(geminiChoice, allTemplates) {
    try {
        const [context, responseKey] = geminiChoice.split('::');
        if (allTemplates[context] && allTemplates[context][responseKey]) {
            return allTemplates[context][responseKey];
        }
        return null;
    } catch (e) {
        return null; // Si el split falla o la estructura es incorrecta
    }
}
