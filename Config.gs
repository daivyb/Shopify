// Módulo de Configuración y Setup
// Contiene la función para guardar la API key y constantes.

const DATABASE_ID = '2737ed82c3488066a728f9a237c5157a';

// ¡EJECUTA ESTA FUNCIÓN UNA SOLA VEZ!
function saveApiKey() {
  const notionApiKey = 'PEGA_AQUÍ_TU_NUEVA_CLAVE_Y_EJECUTA_UNA_VEZ'; // No vuelvas a subir este archivo con la clave puesta.
  PropertiesService.getScriptProperties().setProperty('NOTION_API_KEY', notionApiKey);
  Logger.log('¡Clave de API de Notion guardada de forma segura!');
}