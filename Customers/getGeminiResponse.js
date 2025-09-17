
function getGeminiResponse(prompt) {
  const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");

  // const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    "contents": [
      {
        "parts": [
          { "text": prompt }
        ]
      }
    ],
    "generationConfig": {
      "temperature": 0.7
    }
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    const data = JSON.parse(response.getContentText());

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      Logger.log(`Error de la API de Gemini: ${data.error.message}`);
      return;
    } else {
      Logger.log('Respuesta de la API de Gemini inesperada:', data);
      return;
    }

  } catch (e) {
    Logger.log(`Excepción al llamar a Gemini: ${e.message}`);
    return;
  }
}


/* function testGeminiVowels() {
  const prompt = "Escribe todas las vocales en español en orden: a, e, i, o, u.";
  const result = getGeminiResponse(prompt);
  Logger.log("Respuesta de Gemini (vocales): " + result);
} */

