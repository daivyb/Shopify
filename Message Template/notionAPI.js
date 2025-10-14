/**
 * @fileoverview Módulo para interactuar con la API de Notion, compatible con la versión 2025-09-03.
 */

// --- CONFIGURACIÓN ---
const NOTION_API_KEY = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
const MASTER_DATABASE_ID = PropertiesService.getScriptProperties().getProperty('MASTER_DATABASE_ID');

// Versión de la API actualizada según la guía de Notion
const NOTION_API_BASE_URL = 'https://api.notion.com/v1/';
const NOTION_VERSION = '2022-06-28';

/**
 * Extrae texto plano de una propiedad de Notion (title o rich_text).
 * @param {Object} property El objeto de propiedad de Notion.
 * @returns {string} El texto plano concatenado.
 */
function getPlainTextFromProperty(property) {
  if (!property) return '';
  const propertyType = property.type;
  if (property[propertyType] && Array.isArray(property[propertyType])) {
    return property[propertyType].map(item => item.text.content).join('');
  }
  return '';
}

/**
 * Busca en la BD maestra el ID de la BD específica del label.
 * @param {string} label El label a buscar.
 * @returns {string|null} El ID de la base de datos específica.
 */
function getSpecificDatabaseId(label) {
  const url = `${NOTION_API_BASE_URL}databases/${MASTER_DATABASE_ID}/query`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
    },
    payload: JSON.stringify({
      filter: {
        property: 'Label',
        title: { // Corregido: 'Label' es una columna de tipo 'Title'
          equals: label,
        },
      },
    }),
  };

  const response = UrlFetchApp.fetch(url, options);
  const results = JSON.parse(response.getContentText()).results;

  if (results && results.length > 0) {
    // La columna 'Database ID' ahora se leería como cualquier otra propiedad de texto.
    return getPlainTextFromProperty(results[0].properties['Id Database']);
  }
  return null;
}

/**
 * Obtiene TODOS los contextos y plantillas para una categoría (label) dada.
 * @param {string} label El label de clasificación.
 * @returns {Object|null} Un objeto de contextos y plantillas.
 */
function getAllTemplatesForLabel(label) {
  if (!NOTION_API_KEY || !MASTER_DATABASE_ID) {
    Logger.log('Error: Claves de API o ID de BD Maestra no configurados.');
    return null;
  }

  try {
    const specificDbId = getSpecificDatabaseId(label);
    // --- NUEVO LOG PARA DEPURACIÓN ---
    Logger.log(`ID de base de datos específica encontrado para el label '${label}': ${specificDbId}`);

    if (!specificDbId) {
      Logger.log(`No se encontró un Database ID para el label: ${label}`);
      return null;
    }

    const url = `${NOTION_API_BASE_URL}databases/${specificDbId.trim()}/query`;

    // --- NUEVO BLOQUE DE DIAGNÓSTICO ---
    const partialApiKey = NOTION_API_KEY ? `...${NOTION_API_KEY.slice(-4)}` : 'NO ENCONTRADA';
    Logger.log(`--- INICIO DE DIAGNÓSTICO ---`);
    Logger.log(`Label a buscar: ${label}`);
    Logger.log(`ID de BD obtenido: '${specificDbId}'`);
    Logger.log(`URL construida: ${url}`);
    Logger.log(`Usando API Key que termina en: ${partialApiKey}`);
    Logger.log(`--- FIN DE DIAGNÓSTICO ---`);

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
      },
    };

    const response = UrlFetchApp.fetch(url, options);
    const results = JSON.parse(response.getContentText()).results;

    if (!results) return null;

    const allTemplates = {};
    results.forEach(page => {
      const properties = page.properties;
      const context = getPlainTextFromProperty(properties['Context']); // Corregido: 'Contexto' a 'Context'
      
      if (context) {
        const templatesInRow = {};
        // Columnas a ignorar en las bases de datos de plantillas
        const ignoredColumns = ['Context', 'Created Time', 'Status'];

        for (const key in properties) {
          // Solo procesar si la columna no está en la lista de ignoradas
          if (!ignoredColumns.includes(key)) {
            const templateText = getPlainTextFromProperty(properties[key]);
            if (templateText) {
              templatesInRow[key] = templateText;
            }
          }
        }
        if (Object.keys(templatesInRow).length > 0) {
          allTemplates[context] = templatesInRow;
        }
      }
    });

    return Object.keys(allTemplates).length > 0 ? allTemplates : null;

  } catch (e) {
    Logger.log(`Error al obtener todas las plantillas de Notion para el label ${label}: ${e.toString()}`);
    return null;
  }
}

/**
 * Obtiene todos los labels configurados en la BD maestra de Notion.
 * @returns {string[]} Un array con todos los nombres de los labels configurados.
 */
function getAllConfiguredLabels() {
  if (!MASTER_DATABASE_ID) {
    Logger.log('Error: MASTER_DATABASE_ID no está configurado en las Script Properties.');
    return [];
  }

  const url = `${NOTION_API_BASE_URL}databases/${MASTER_DATABASE_ID}/query`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
    },
    muteHttpExceptions: true,
  };

  let allLabels = [];
  let hasMore = true;
  let startCursor = undefined;

  try {
    Logger.log('Obteniendo lista de labels configurados desde Notion...');
    while (hasMore) {
      // El payload debe estar dentro del loop para actualizar el start_cursor
      options.payload = JSON.stringify({ start_cursor: startCursor });

      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseBody = response.getContentText();

      if (responseCode !== 200) {
        Logger.log(`Error al consultar la base de datos maestra de Notion. Código: ${responseCode}. Respuesta: ${responseBody}`);
        return []; // Retornar array vacío en caso de error
      }

      const data = JSON.parse(responseBody);
      const results = data.results;

      if (results && results.length > 0) {
        // La propiedad a buscar es 'Label', que es de tipo 'title'
        const labels = results.map(page => getPlainTextFromProperty(page.properties['Label']));
        allLabels = allLabels.concat(labels);
      }

      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    const nonEmptyLabels = allLabels.filter(label => label); // Filtrar vacíos
    Logger.log(`Se encontraron ${nonEmptyLabels.length} labels configurados.`);
    return nonEmptyLabels;

  } catch (e) {
    Logger.log(`Excepción al obtener todos los labels de Notion: ${e.toString()}`);
    return []; // Retornar array vacío en caso de excepción
  }
}
