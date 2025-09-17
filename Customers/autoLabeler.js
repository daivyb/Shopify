function autoLabelEmailsWithGemini() {
  var query = 'after:2025/08/13 -label:GeminiLabeled';
  var threads = GmailApp.search(query);
  var maxChars = 1024;
  var geminiLabel = getOrCreateLabel('GeminiLabeled');

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    
    for (var j = 0; j < messages.length; j++) {
      var msg = messages[j];

      // Solo procesar si no tiene la etiqueta GeminiLabeled
      if (!threads[i].getLabels().some(function(l) { return l.getName() === 'GeminiLabeled'; })) {
        var subject = msg.getSubject();
        var body = msg.getPlainBody().substring(0, maxChars); // Limitar a 1024 caracteres
        var result = classifyWithGemini(subject, body);
        // Quitar backticks y “json” si existieran
        result = result.replace(/```json/g, '').replace(/```/g, '').trim();

        var tag = '';
        var subtag = '';

        try {
          var parsed = JSON.parse(result);
          tag = parsed.tag || '';
          subtag = parsed.subtag || ''; 
        } catch(e) {
          // Si Gemini no responde en JSON, usar texto plano
          tag = (result && result.indexOf('Tag:') !== -1) ? result.split('Tag:')[1].split('\n')[0].trim() : 'Unclassified';
          subtag = ''; // No hay subtag en texto plano
        }

        // Agregar etiqueta principal
        if (tag && tag !== 'Unclassified') {
          var label = getOrCreateLabel(tag);
          label.addToThread(threads[i]);

          // Crear etiqueta del subtag si existe
          if (parsed.subtag) {
            var subLabel = getOrCreateLabel(parsed.subtag);
            subLabel.addToThread(threads[i]);
          }
        }

        // Etiqueta que indica que ya fue procesado por Gemini
        geminiLabel.addToThread(threads[i]);
      }
    }
  }
}

// Crea o recupera una etiqueta de Gmail
function getOrCreateLabel(name) {
  var label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  return label;
}
