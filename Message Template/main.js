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

    const emailBody = getFirstMessageBody(thread);
    
    // Construir el prompt para Gemini
    const prompt = buildPromptForBestResponse(emailBody, allTemplates);

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

    const personalizedMessage = personalizeTemplate(selectedTemplate, emailBody);
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
 * @returns {string} El prompt completo.
 */
function buildPromptForBestResponse(emailBody, allTemplates) {
  let optionsText = '\n';
  Object.keys(allTemplates).forEach(context => {
    Object.keys(allTemplates[context]).forEach(responseKey => {
      const identifier = `${context}::${responseKey}`;
      optionsText += `ID: \"${identifier}\"\nTemplate: ${allTemplates[context][responseKey]}\n\n`;
    });
  });

  return `Analiza el siguiente correo electrónico de un cliente y elige la plantilla de respuesta más adecuada de la lista proporcionada. Responde únicamente con el ID de la plantilla seleccionada (por ejemplo, "Pedido perdido::Respuesta_A").

---
CORREO DEL CLIENTE ---
${emailBody}

---
PLANTILLAS DISPONIBLES ---
${optionsText}`;
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
