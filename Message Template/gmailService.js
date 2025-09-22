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
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const year = yesterday.getFullYear();
  const month = yesterday.getMonth() + 1; // getMonth() es 0-indexado
  const day = yesterday.getDate();
  
  // Formato para la búsqueda en Gmail: YYYY/MM/DD
  const dateQuery = ` after:${year}/${month}/${day}`;
  const query = `label:${TRIGGER_LABEL} -label:${PROCESSED_LABEL}${dateQuery}`;
  
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
 * Extrae el cuerpo del PRIMER mensaje de un hilo, limitado a 1024 caracteres.
 * @param {GoogleAppsScript.Gmail.GmailThread} thread El hilo de Gmail.
 * @returns {string} El cuerpo del mensaje en texto plano.
 */
function getFirstMessageBody(thread) {
  // Obtenemos el primer mensaje del hilo (índice 0)
  const message = thread.getMessages()[0];
  const fullBody = message.getPlainBody();
  // Limita el cuerpo a los primeros 1024 caracteres para optimizar
  return fullBody.substring(0, 1024);
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
