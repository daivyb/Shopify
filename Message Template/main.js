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
    const messageDetails = getFirstMessageDetails(thread); // Get details early for logging

    // --- Start of structured log entry ---
    Logger.log('--------------------------------------------------');
    Logger.log(`[INICIO] Procesando Hilo ID: ${threadId}`);
    
    if (messageDetails) {
        Logger.log(`  > De: ${messageDetails.from}`);
        Logger.log(`  > Asunto: ${messageDetails.subject}`);
    } else {
      Logger.log(`No se pudieron obtener los detalles del mensaje para el hilo ${threadId}. Omitiendo.`);
      Logger.log(`[FIN] Hilo ID: ${threadId} (Error)`);
      Logger.log('--------------------------------------------------');
      return;
    }

    const classificationLabel = getClassificationLabel(thread, tagReferences);
    if (!classificationLabel) {
      Logger.log(`  > Advertencia: El hilo no tiene una etiqueta de clasificación válida. Omitiendo.`);
      Logger.log(`[FIN] Hilo ID: ${threadId} (Omitido)`);
      Logger.log('--------------------------------------------------');
      return;
    }
    Logger.log(`  > Clasificación: ${classificationLabel}`);

    const allTemplates = getAllTemplatesForLabel(classificationLabel);
    if (!allTemplates) {
      Logger.log(`  > Error: No se encontraron plantillas en Notion para la clasificación.`);
      Logger.log(`[FIN] Hilo ID: ${threadId} (Error)`);
      Logger.log('--------------------------------------------------');
      return;
    }

    // Customer and Order Info
    const customer = getCustomerDetails(messageDetails.from);
    let latestOrder = null;
    if (customer && customer.id) {
      latestOrder = getCustomerLatestOrderDetails(customer.id);
    }

    if (latestOrder) {
        Logger.log(`  > Cliente: ${customer.first_name || ''} ${customer.last_name || ''} (ID: ${customer.id})`);
        Logger.log(`  > Pedido: #${latestOrder.order_number}`);

        if (latestOrder.fulfillments && latestOrder.fulfillments.length > 0) {
            const fulfillment = latestOrder.fulfillments[0];
            const expectedDate = fulfillment.estimated_delivery_at ? new Date(fulfillment.estimated_delivery_at).toLocaleDateString() : 'N/A';
            const deliveryDate = fulfillment.delivered_at ? new Date(fulfillment.delivered_at).toLocaleDateString() : 'N/A';
            const delayDays = calculateDeliveryDelay(latestOrder);
            const sinceDeliveryDays = calculateDaysSinceDelivery(latestOrder);

            Logger.log(`  > Info Envío:`);
            Logger.log(`    - Promesa de Entrega - Carrier: ${expectedDate}`);
            Logger.log(`    - Fecha de Entrega: ${deliveryDate}`);
            if (delayDays !== null) {
                Logger.log(`    - Retraso (días): ${delayDays}`);
            }
            if (sinceDeliveryDays !== null) {
                Logger.log(`    - Días Transcurridos: ${sinceDeliveryDays}`);
            }
        }
    } else if (customer) {
        Logger.log(`  > Cliente: ${customer.first_name || ''} ${customer.last_name || ''} (Sin pedidos recientes)`);
    } else {
        Logger.log(`  > Cliente: No encontrado en Shopify.`);
    }
    
    // Build prompt and get Gemini response
    const prompt = buildPromptForBestResponse(messageDetails.body, allTemplates, customer, latestOrder);
    const geminiChoice = getGeminiResponse(prompt);

    if (!geminiChoice) {
      Logger.log('  > Error: No se pudo obtener una respuesta válida de Gemini.');
      Logger.log(`[FIN] Hilo ID: ${threadId} (Error)`);
      Logger.log('--------------------------------------------------');
      return;
    }
    Logger.log(`  > Decisión de Gemini: ${geminiChoice}`);

    // Personalize and create draft
    const selectedTemplate = findTemplateFromGeminiChoice(geminiChoice, allTemplates);
    if (!selectedTemplate) {
      Logger.log(`  > Error: La elección de Gemini (${geminiChoice}) no corresponde a ninguna plantilla.`);
      Logger.log(`[FIN] Hilo ID: ${threadId} (Error)`);
      Logger.log('--------------------------------------------------');
      return;
    }

    const personalizedMessage = personalizeTemplate(selectedTemplate, messageDetails.body, customer, latestOrder);
    createDraftReply(threadId, personalizedMessage);
    applyProcessedLabel(threadId);
    
    Logger.log(`  > Acción: Borrador creado con la plantilla "${geminiChoice}".`);
    Logger.log(`[FIN] Hilo ID: ${threadId}`);
    Logger.log('--------------------------------------------------');
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
    orderInfo += `Estado de Preparación (Fulfillment): ${latestOrder.fulfillment_status || 'N/A'}\n`;

    // Lógica mejorada para el estado de la entrega
    if (latestOrder.fulfillments && latestOrder.fulfillments.length > 0) {
      const firstFulfillment = latestOrder.fulfillments[0];
      orderInfo += `Estado Detallado del Envío: ${firstFulfillment.shipment_status || 'Pendiente'}\n`;
      orderInfo += `Transportista: ${firstFulfillment.tracking_company || 'N/A'}\n`;
      orderInfo += `Número de Seguimiento: ${firstFulfillment.tracking_number || 'N/A'}\n`;
      orderInfo += `URL de Seguimiento: ${firstFulfillment.tracking_url || 'N/A'}\n`;
    } else {
      orderInfo += `Estado Detallado del Envío: No Enviado\n`;
    }

    // Calcular y añadir datos de tiempo para dar más contexto a la IA
    const deliveryDelayDays = calculateDeliveryDelay(latestOrder);
    if (deliveryDelayDays !== null) {
      orderInfo += `Días de Retraso en la Entrega (vs. estimado): ${deliveryDelayDays}\n`;
    }

    const daysSinceDelivery = calculateDaysSinceDelivery(latestOrder);
    if (daysSinceDelivery !== null) {
      orderInfo += `Días Transcurridos Desde la Entrega: ${daysSinceDelivery}\n`;
    }

    // Añadir detalles de los productos en el pedido si es necesario
    if (latestOrder.line_items && latestOrder.line_items.length > 0) {
      orderInfo += `Productos:\n`;
      latestOrder.line_items.forEach(item => {
        orderInfo += `  - ${item.quantity} x ${item.name} (SKU: ${item.sku || 'N/A'})\n`;
      });
    }
  }

  return `Analiza el siguiente correo electrónico de un cliente y elige la plantilla de respuesta más adecuada de la lista proporcionada. Responde únicamente con el ID de la plantilla seleccionada (por ejemplo, "Pedido perdido::Respuesta_A").\n\n---\nCORREO DEL CLIENTE ---\n${emailBody}\n${customerInfo}\n${orderInfo}\n\n---\nPLANTILLAS DISPONIBLES ---\n${optionsText}`;
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
