// Módulo de Configuración y Setup
// Contiene la función para guardar la API key y constantes.

const DATABASE_ID = '2737ed82c3488066a728f9a237c5157a';

// ¡EJECUTA ESTA FUNCIÓN UNA SOLA VEZ!
function saveApiKey() {
  const notionApiKey = 'API_KEY_REMOVED_FOR_SECURITY'; // Pega tu clave aquí la primera vez.
  PropertiesService.getScriptProperties().setProperty('NOTION_API_KEY', notionApiKey);
  Logger.log('¡Clave de API de Notion guardada de forma segura!');
}