// Módulo de Configuración y Setup
// Contiene la función para guardar la API key y constantes.

const DATABASE_ID = 'YOUR_ID_DATABASE';

// ¡EJECUTA ESTA FUNCIÓN UNA SOLA VEZ!
function saveApiKey() {
  const notionApiKey = 'YOUR_NOTION_AP_KEY'; // Pega tu clave aquí la primera vez.
  PropertiesService.getScriptProperties().setProperty('NOTION_API_KEY', notionApiKey);
  Logger.log('¡Clave de API de Notion guardada de forma segura!');
}