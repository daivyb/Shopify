/**
 * @fileoverview Archivo principal que orquesta la creación de borradores de respuesta.
 */

/**
 * Función principal que se ejecuta para procesar correos y crear borradores.
 * Puede ser ejecutada manualmente o con un trigger de tiempo.
 */
function createDraftReplies() {
  Logger.log('Iniciando el proceso de creación de borradores inteligentes...');

  // Obtener la firma de Gmail UNA SOLA VEZ al inicio para optimizar.
  const signature = getGmailSignature();

  // 1. Obtener la lista de TODAS las etiquetas configuradas en Notion UNA SOLA VEZ.
  const configuredLabels = getAllConfiguredLabels();
  if (!configuredLabels || configuredLabels.length === 0) {
    Logger.log('No se encontraron labels configurados en la BD Maestra de Notion o hubo un error. Finalizando ejecución.');
    return;
  }

  const threads = findThreadsToProcess();
  if (threads.length === 0) {
    Logger.log('No hay correos nuevos para procesar.');
    return;
  }

  const tagReferences = getTagReferences();

  // Fetch all Shopify locations once at the beginning
  const shopifyLocations = getAllShopifyLocations();
  if (!shopifyLocations || shopifyLocations.length === 0) {
    Logger.log('No se encontraron ubicaciones de Shopify. La lógica de devolución al almacén no funcionará.');
  }

  threads.forEach(thread => {
    const threadId = thread.getId();

    const classificationLabel = getClassificationLabel(thread, tagReferences);
    if (!classificationLabel) {
      return; 
    }

    if (!configuredLabels.includes(classificationLabel)) {
      return; 
    }

    const allTemplates = getAllTemplatesForLabel(classificationLabel);
    if (!allTemplates) {
      return;
    }

    applyProcessedLabel(threadId);

    const messageDetails = getFirstMessageDetails(thread); 

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

    Logger.log(`  > Clasificación: ${classificationLabel}`);

    const customer = getCustomerDetails(messageDetails.from);
    let latestOrder = null;
    if (customer && customer.id) {
      latestOrder = getCustomerLatestOrderDetails(customer.id);
    }
    
    if (latestOrder) {
        // This block is intentionally empty as logging is now handled by structured prompt info
    } else if (customer) {
        Logger.log(`  > Cliente: ${customer.first_name || ''} ${customer.last_name || ''} (Sin pedidos recientes)`);
    } else {
        Logger.log(`  > Cliente: No encontrado en Shopify.`);
    }
    
    const { fullPrompt, customerInfo, orderInfo, imageInfo, locationsInfo } = buildPromptForBestResponse(messageDetails, allTemplates, customer, latestOrder, shopifyLocations);

    // Log the individual components for clarity
    if (customerInfo) {
        Logger.log(customerInfo);
    }
    if (orderInfo) {
        Logger.log(orderInfo);
    }
    if (imageInfo) {
        Logger.log(imageInfo);
    }
    if (locationsInfo) {
        Logger.log(locationsInfo);
    }

    const geminiChoice = getGeminiResponse(fullPrompt);

    if (!geminiChoice) {
      Logger.log('  > Error: No se pudo obtener una respuesta válida de Gemini.');
      Logger.log(`[FIN] Hilo ID: ${threadId} (Error)`);
      Logger.log('--------------------------------------------------');
      return;
    }
    Logger.log(`  > Decisión de Gemini: ${geminiChoice}`);

    const selectedTemplate = findTemplateFromGeminiChoice(geminiChoice, allTemplates);
    if (!selectedTemplate) {
      Logger.log(`  > Error: La elección de Gemini (${geminiChoice}) no corresponde a ninguna plantilla.`);
      Logger.log(`[FIN] Hilo ID: ${threadId} (Error)`);
      Logger.log('--------------------------------------------------');
      return;
    }

    const personalizedMessage = personalizeTemplate(selectedTemplate, messageDetails.body, customer, latestOrder);
    
    // Construir el cuerpo del correo en HTML y añadir la firma.
    const messageBodyHtml = personalizedMessage.replace(/\n/g, '<br>');
    const finalHtmlBody = signature ? `${messageBodyHtml}<br><br>${signature}` : messageBodyHtml;

    // Crear el borrador usando el cuerpo HTML. El texto plano se usa para el snippet.
    createDraftReply(threadId, personalizedMessage, { htmlBody: finalHtmlBody });
    
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
 * @returns {Object} Un objeto con el prompt completo y sus componentes individuales.
 */
function buildPromptForBestResponse(messageDetails, allTemplates, customer, latestOrder, shopifyLocations) {
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
      orderInfo += `Estado del Fulfillment: ${firstFulfillment.status || 'N/A'}\n`;
      orderInfo += `Estado Detallado del Envío: ${firstFulfillment.shipment_status || 'Pendiente'}\n`;
      orderInfo += `Transportista: ${firstFulfillment.tracking_company || 'N/A'}\n`;
      orderInfo += `Número de Seguimiento: ${firstFulfillment.tracking_number || 'N/A'}\n`;
      orderInfo += `URL de Seguimiento: ${firstFulfillment.tracking_url || 'N/A'}\n`;
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

    // Add last tracking event details
    if (latestOrder.fulfillments && latestOrder.fulfillments.length > 0 && latestOrder.fulfillments[0].last_tracking_event) {
      const lastEvent = latestOrder.fulfillments[0].last_tracking_event;
      orderInfo += `\n--- ÚLTIMO EVENTO DE SEGUIMIENTO ---\n`;
      orderInfo += `Estado: ${lastEvent.status || 'N/A'}\n`;
      orderInfo += `Mensaje: ${lastEvent.message || 'N/A'}\n`;
      orderInfo += `Fecha/Hora: ${lastEvent.happened_at || 'N/A'}\n`;
      orderInfo += `Ubicación: ${lastEvent.city || 'N/A'}, ${lastEvent.province || 'N/A'}, ${lastEvent.country || 'N/A'} (CP: ${lastEvent.zip || 'N/A'})\n`;
    }
  }

  let imageInfo = '';
  if (messageDetails.hasImages) {
    imageInfo = '\n--- NOTA ADICIONAL ---\nEl cliente YA HA ADJUNTADO imágenes en este correo.\n';
  }

  let locationsInfo = '';
  if (shopifyLocations && shopifyLocations.length > 0) {
    locationsInfo += `\n--- UBICACIONES DE LA EMPRESA ---\n`;
    shopifyLocations.forEach(loc => {
      locationsInfo += `  - ${loc.city || 'N/A'}, ${loc.province || 'N/A'}, ${loc.country || 'N/A'} (CP: ${loc.zip || 'N/A'})\n`;
    });
  }

  const baseInstruction = 'Analiza el siguiente correo electrónico de un cliente y elige la plantilla de respuesta más adecuada de la lista proporcionada.';
  const specialRuleSingleItem = "REGLA IMPORTANTE: Presta especial atención a la lista de 'Productos'. Si el cliente reporta un problema con un producto (ej. faltante o dañado) y en el pedido solo hay un tipo de artículo, DEBES elegir una plantilla que resuelva el problema de forma proactiva (ej. que confirme un reemplazo) en lugar de una que pida más información.";
  const specialRuleWarehouseReturn = "REGLA ADICIONAL: Si el 'ÚLTIMO EVENTO DE SEGUIMIENTO' indica un estado 'delivered' y la 'Ubicación' de ese evento coincide con CUALQUIERA de las 'UBICACIONES DE LA EMPRESA', DEBES elegir una plantilla que refleje una devolución al almacén o un problema de entrega a dirección incorrecta.";
  const outputFormatInstruction = 'Responde únicamente con el ID de la plantilla seleccionada (por ejemplo, "Pedido perdido::Respuesta_A").';

  const fullPrompt = `${baseInstruction}\n${specialRuleSingleItem}\n${specialRuleWarehouseReturn}\n${outputFormatInstruction}\n\n---\nCORREO DEL CLIENTE ---\n${messageDetails.body}${imageInfo}${customerInfo}${orderInfo}${locationsInfo}\n\n---\nPLANTILLAS DISPONIBLES ---\n${optionsText}`;

  return { fullPrompt, customerInfo, orderInfo, imageInfo, locationsInfo };
}

/**
 * Busca la plantilla correspondiente a la elección de Gemini.
 * @param {string} geminiChoice El ID de la plantilla devuelto por Gemini (ej. "Contexto::Respuesta_A").
 * @param {Object} allTemplates El objeto completo de plantillas.
 * @returns {string|null} El texto de la plantilla seleccionada.
 */

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
