// Módulo de Servicio para la API de Notion
// Encapsula todas las llamadas a la API de Notion.

function queryNotionDatabase(databaseId) {
  const notionApiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`;

  if (!notionApiKey) {
    Logger.log('Error: La clave de API de Notion no está guardada. Por favor, ejecuta la función "saveApiKey" en el archivo Config.gs primero.');
    return null;
  }

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + notionApiKey,
      'Notion-Version': '2022-06-28',
    },
    'payload': JSON.stringify({}) 
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const jsonResponse = JSON.parse(response.getContentText());
    Logger.log('Respuesta completa de la API recibida.');
    // Logger.log(JSON.stringify(jsonResponse, null, 2)); // Descomenta para depuración
    return jsonResponse;
  } catch (e) {
    Logger.log('Error al conectar con la API de Notion: ' + e.toString());
    return null;
  }
}