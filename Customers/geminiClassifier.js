
function classifyWithGemini(subject, body) {
  var tagsReference = getTagReferences();
  var subtagsReference = getUrgentSubtags(); // tus subtags de Request/CancelOrder, etc.
  
  var prompt = "Contexto de la marca: Algae Cooking Club es una empresa que vende aceite de algas y productos relacionados con la cocina saludable. Responde tomando el rol de especialista de atencion al cliente y considerando que los emisores del mensaje pueden ser de clientes, distribuidores, influencers, revistas, prensa o interesados en el producto.\n\n";
  prompt += "Tengo un correo con el siguiente asunto y cuerpo:\n";
  prompt += "ASUNTO: " + subject + "\n";
  prompt += "CUERPO: " + body + "\n\n";
  
  prompt += "Clasifica este correo usando uno de los siguientes tags y proporciona una breve descripción:\n";
  tagsReference.forEach(function(ref) {
    prompt += "- Tag: " + ref.tag + " | Description: " + ref.description + "\n";
  });
  
  prompt += "\nSi aplica, agrega un Subtag (solo para Inquiry/Modification Request y si trata sobre Cancel Order, Cancel Subscription o Update Address):\n";
  subtagsReference.forEach(function(ref) {
    prompt += "- Subtag: " + ref.subtag + "\n";
  });
  
  prompt += "\nDevuélveme solo el resultado en formato JSON válido, así:\n";
  prompt += `{
    "tag": "...",
    "description": "...",
    "subtag": "..."
  }\n`;
  prompt += '\nIMPORTANTE: Usa el mismo valor de los tags de referencia, por lo tanto, no se considera la palabra Tag. No inventes nuevos, no quites ni agregues espacios o caracteres nuevos. Respeta mayúsculas, minúsculas y espacios tal cual aparecen arriba. Siempre analiza el cuerpo del mensaje porque realmente te da ayuda a entender lo que quiere el emisor del mensaje. Recuerda que un Inquiry y Complaint siempre genera una accion en el especialista de atencion al cliente.\n';

  var result = getGeminiResponse(prompt);
  Logger.log(result);
  return result;
}
