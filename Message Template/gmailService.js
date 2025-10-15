/**
 * @fileoverview Módulo para gestionar interacciones con la API de Gmail.
 */

const TRIGGER_LABEL = 'GeminiLabeled'; // Etiqueta que dispara el proceso
const PROCESSED_LABEL = 'GeminiMessage'; // Etiqueta para marcar como procesado

/**
 * Busca hilos de correo que necesitan ser procesados, usando paginación para obtener todos los resultados.
 * @returns {GoogleAppsScript.Gmail.GmailThread[]} Una lista de hilos de Gmail.
 */
function findThreadsToProcess() {
  const query = `label:${TRIGGER_LABEL} -label:${PROCESSED_LABEL}`;
  let allThreads = [];
  let pageToken = null;
  let page = 1;

  try {
    Logger.log(`Ejecutando búsqueda paginada en Gmail con la consulta: "${query}"`);

    do {
      const response = Gmail.Users.Threads.list('me', {
        q: query,
        maxResults: 500, // Get the max allowed per page
        pageToken: pageToken
      });

      if (response.threads && response.threads.length > 0) {
        const threadIds = response.threads.map(thread => thread.id);
        const threads = threadIds.map(id => GmailApp.getThreadById(id));
        allThreads = allThreads.concat(threads);
        Logger.log(`Página ${page}: Se encontraron ${threads.length} hilos. Total acumulado: ${allThreads.length}`);
      }

      pageToken = response.nextPageToken;
      page++;
    } while (pageToken);

    Logger.log(`Búsqueda paginada completa. Se encontraron un total de ${allThreads.length} hilos para procesar.`);
    return allThreads;

  } catch (e) {
    Logger.log(`Error al buscar hilos en Gmail con paginación: ${e.toString()}`);
    if (e.details && e.details.errors) {
      Logger.log(`Detalles del error de la API de Gmail: ${JSON.stringify(e.details.errors)}`);
    }
    return [];
  }
}

/**
 * Obtiene la etiqueta de clasificación principal de un hilo.
 * @param {GoogleAppsScript.Gmail.GmailThread} thread El hilo de Gmail.
 * @param {Array<Object>} tagReferences La lista de tags de classifier.js.
 * @returns {string|null} El nombre de la etiqueta de clasificación o null.
 */
function getClassificationLabel(thread, tagReferences) {
  const threadLabels = thread.getLabels();
  const knownTags = tagReferences.map(t => t.tag);
  
  for (const label of threadLabels) {
    let labelName;
    try {
      labelName = label.getName();
    } catch (e) {
      // Si una etiqueta fue eliminada pero aún está en el cache del hilo, puede dar este error.
      // Lo ignoramos y continuamos con la siguiente etiqueta.
      Logger.log(`No se pudo obtener el nombre de una etiqueta en el hilo ${thread.getId()}. Error: ${e.toString()}`);
      continue;
    }

    if (knownTags.includes(labelName)) {
      return labelName;
    }
  }
  
  Logger.log(`No se encontró una etiqueta de clasificación conocida en el hilo ${thread.getId()}`);
  return null;
}

/**
 * Extrae los detalles (remitente, cuerpo, si tiene imágenes) del PRIMER mensaje de un hilo.
 * @param {GoogleAppsScript.Gmail.GmailThread} thread El hilo de Gmail.
 * @returns {{from: string, body: string, subject: string, hasImages: boolean}|null} Un objeto con los detalles del mensaje.
 */
function getFirstMessageDetails(thread) {
  const message = thread.getMessages()[0];
  if (!message) return null;

  const from = message.getFrom();
  const subject = message.getSubject();
  const emailRegex = /<(.+)>/;
  const match = from.match(emailRegex);
  const senderEmail = match ? match[1] : from;

  const fullBody = message.getPlainBody();
  const body = fullBody.substring(0, 1024); // Limita para optimizar

  // Detectar si hay imágenes adjuntas
  const attachments = message.getAttachments();
  let hasImages = false;
  for (let i = 0; i < attachments.length; i++) {
    if (attachments[i].getContentType().startsWith('image/')) {
      hasImages = true;
      break;
    }
  }

  return { from: senderEmail, body: body, subject: subject, hasImages: hasImages };
}

/**
 * Crea un borrador de respuesta en un hilo.
 * @param {string} threadId El ID del hilo.
 * @param {string} body El contenido del borrador.
 */
function createDraftReply(threadId, body) {
  try {
    const thread = GmailApp.getThreadById(threadId);
    thread.createDraftReply(body);
    Logger.log(`Borrador creado para el hilo ${threadId}.`);
  } catch (e) {
    Logger.log(`Error al crear el borrador para el hilo ${threadId}: ${e.toString()}`);
  }
}

/**
 * Aplica la etiqueta de "procesado" a un hilo.
 * @param {string} threadId El ID del hilo.
 */
function applyProcessedLabel(threadId) {
  try {
    let label = GmailApp.getUserLabelByName(PROCESSED_LABEL);
    if (!label) {
      Logger.log(`Creando la etiqueta "${PROCESSED_LABEL}"...`);
      label = GmailApp.createLabel(PROCESSED_LABEL);
    }
    const thread = GmailApp.getThreadById(threadId);
    thread.addLabel(label);
    Logger.log(`Etiqueta "${PROCESSED_LABEL}" aplicada al hilo ${threadId}.`);
  } catch (e) {
    Logger.log(`Error al aplicar la etiqueta al hilo ${threadId}: ${e.toString()}`);
  }
}
