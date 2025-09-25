/**
 * @fileoverview Módulo para interactuar con la API de Google Gemini.
 */

// --- CONFIGURACIÓN ---
// ¡IMPORTANTE! Guarda este valor en Script Properties (Archivo > Propiedades del proyecto > Propiedades del script).
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.5-flash'; // O el modelo que prefieras usar

/**
 * Llama a la API de Gemini para obtener una respuesta basada en un prompt.
 *
 * @param {string} prompt El prompt a enviar al modelo.
 * @returns {string|null} La respuesta del modelo o null si hay un error.
 */
function getGeminiResponse(prompt) {
  if (!GEMINI_API_KEY) {
    Logger.log('Error: GEMINI_API_KEY no está configurada en las Script Properties.');
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
        ],
      },
    ],
    // Opcional: Configuración para controlar la generación de la respuesta
    generationConfig: {
        temperature: 0.2,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
    },
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true, // Para poder manejar errores de la API
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      const data = JSON.parse(responseBody);
      // Navegar la estructura de respuesta de Gemini API v1beta
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        Logger.log('La respuesta de Gemini no tiene el formato esperado. Respuesta completa: ' + responseBody);
        return null;
      }
    } else {
      Logger.log(`Error en la llamada a Gemini API. Código: ${responseCode}. Respuesta: ${responseBody}`);
      return null;
    }
  } catch (e) {
    Logger.log(`Excepción al llamar a Gemini API: ${e.toString()}`);
    return null;
  }
}
