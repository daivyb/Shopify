/**
 * @fileoverview Módulo para gestionar interacciones con la API de Gmail.
 */

const TRIGGER_LABEL = 'GeminiLabeled'; // Etiqueta que dispara el proceso
const PROCESSED_LABEL = 'GeminiMessage'; // Etiqueta para marcar como procesado

/**
 * Busca hilos de correo que necesitan ser procesados (a partir de ayer).
 * @returns {GoogleAppsScript.Gmail.GmailThread[]} Una lista de hilos de Gmail.
 */
function findThreadsToProcess() {
  const query = `label:${TRIGGER_LABEL} -label:${PROCESSED_LABEL}`;
  
  try {
    Logger.log(`Ejecutando búsqueda en Gmail con la consulta: "${query}"`);
    const threads = GmailApp.search(query);
    Logger.log(`Se encontraron ${threads.length} hilos para procesar.`);
    return threads;
  } catch (e) {
    Logger.log(`Error al buscar hilos en Gmail: ${e.toString()}`);
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
  const threadLabels = thread.getLabels().map(label => label.getName());
  const knownTags = tagReferences.map(t => t.tag);
  
  for (const label of threadLabels) {
    if (knownTags.includes(label)) {
      return label;
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
