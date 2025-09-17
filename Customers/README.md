# Clasificador de Correos con Gemini para Algae Cooking Club

## Descripción General

Este proyecto de Google Apps Script automatiza la clasificación y etiquetado de correos electrónicos en Gmail utilizando la API de Gemini. Está diseñado para el equipo de atención al cliente de "Algae Cooking Club" para ayudar a gestionar las consultas y quejas de los clientes de manera más eficiente.

El script lee los correos electrónicos no etiquetados, los en1vía a Gemini para su clasificación y luego aplica las etiquetas correspondientes en Gmail según la respuesta del modelo.

## Características

- **Clasificación automática:** Utiliza la IA de Gemini para analizar y clasificar los correos electrónicos.
- **Etiquetado en Gmail:** Aplica etiquetas y sub-etiquetas personalizadas a las conversaciones de correo para una fácil organización.
- **Manejo de Casos Específicos:** Identifica y etiqueta solicitudes urgentes como cancelaciones de pedidos o actualizaciones de dirección.
- **Evita duplicados:** Marca los correos procesados para evitar volver a clasificarlos.
- **Generación de documentación:** Incluye una función para crear un documento de Google con ejemplos de correos electrónicos para cada etiqueta.

## ¿Cómo funciona?

1.  El script se ejecuta manualmente o mediante un disparador de tiempo en Google Apps Script.
2.  Busca en Gmail los correos electrónicos que no han sido procesados (que no tienen la etiqueta `GeminiLabeled`).
3.  Para cada correo electrónico, construye un _prompt_ para la API de Gemini que incluye el asunto, el cuerpo del correo y una lista de posibles etiquetas de clasificación.
4.  Envía la solicitud a la API de Gemini a través de la función `getGeminiResponse`.
5.  Recibe la clasificación en formato JSON de Gemini.
6.  Analiza la respuesta y aplica las etiquetas correspondientes (etiqueta principal y sub-etiqueta) al hilo de correo en Gmail.
7.  Aplica la etiqueta `GeminiLabeled` para marcar el correo como procesado.

## Descripción de los Archivos

-   **`appsscript.json`**: El archivo de manifiesto del proyecto de Google Apps Script. Define los permisos y la configuración del proyecto.
-   **`.clasp.json`**: Archivo de configuración para [clasp](https://github.com/google/clasp), la herramienta de línea de comandos para Google Apps Script. Contiene el `scriptId`.
-   **`getGeminiResponse.js`**: Contiene la función para realizar llamadas a la API de Gemini. Maneja la construcción de la solicitud y la comunicación con el punto final de la API.
-   **`classifier.js`**: Define las etiquetas (`TAGS`) y descripciones utilizadas para la clasificación de los correos.
-   **`classifierModify.js`**: Define sub-etiquetas (`URGENT_SUBTAGS`) para casos específicos y urgentes.
-   **`geminiClassifier.js`**: Construye el _prompt_ que se enviará a Gemini, combinando el contenido del correo electrónico con las etiquetas y sub-etiquetas de clasificación.
-   **`autoLabeler.js`**: El script principal que orchestra todo el proceso. Busca los correos, llama al clasificador de Gemini y aplica las etiquetas en Gmail.
-   **`doc.js`**: Contiene una función para generar un documento de Google con ejemplos de correos para cada etiqueta, útil para la documentación y el entrenamiento.

## Configuración

1.  **Clonar el Repositorio**: Clona este repositorio en tu máquina local.
2.  **Google Apps Script**: Sube los archivos a un nuevo proyecto de Google Apps Script utilizando `clasp`.
3.  **Clave de API de Gemini**:
    -   Obtén una clave de API de Google AI Studio.
    -   En el editor de Google Apps Script, ve a **Configuración del proyecto > Propiedades del secuencia de comandos**.
    -   Agrega una nueva propiedad con el nombre `GEMINI_API_KEY` y pega tu clave de API como valor.
4.  **Permisos**: Ejecuta una de las funciones (por ejemplo, `autoLabelEmailsWithGemini`) manualmente desde el editor para autorizar los permisos necesarios de Gmail y Google Docs.

## Uso

Para ejecutar el clasificador de correos, puedes:

-   **Manualmente**: Abrir el proyecto en el editor de Google Apps Script y ejecutar la función `autoLabelEmailsWithGemini`.
-   **Automáticamente**: Configurar un disparador basado en tiempo (por ejemplo, cada hora) para que la función `autoLabelEmailsWithGemini` se ejecute periódicamente.
