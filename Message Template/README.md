# Proyecto: Borradores de Respuesta Inteligentes con Gemini y Notion

## 1. Propósito

Este proyecto de Google Apps Script (GAS) automatiza la creación de borradores de respuesta en Gmail. Utiliza un modelo de IA (Gemini) para analizar el contenido de un correo y seleccionar la plantilla de respuesta más adecuada de una base de conocimientos centralizada en Notion.

## 2. Flujo de Trabajo Inteligente

El script sigue un proceso automatizado y optimizado:

1.  **Búsqueda Selectiva**: Encuentra correos con la etiqueta `GeminiLabeled` que hayan sido recibidos **a partir del día actual**, ignorando correos antiguos. Además, excluye los que ya tienen la etiqueta `GeminiMessage` para no procesarlos dos veces.
2.  **Clasificación**: Lee la etiqueta de categoría del correo (ej. `Complaint/Shipping Issue`).
3.  **Extracción de Contenido**: Lee únicamente el **primer mensaje** del hilo de correo y lo trunca a **1024 caracteres** para optimizar el análisis.
4.  **Consulta a Notion**: Obtiene **todas** las plantillas de respuesta disponibles en Notion para la categoría identificada.
5.  **Selección con IA**: Envía el texto extraído del correo junto con todas las plantillas candidatas a la API de Gemini, pidiéndole que elija la más apropiada.
6.  **Personalización**: Toma la plantilla seleccionada por la IA y reemplaza los placeholders (ej. `{{customer_name}}`) con datos del correo.
7.  **Creación de Borrador**: Genera un borrador de respuesta en el hilo de correo original.
8.  **Etiquetado Final**: Aplica la etiqueta `GeminiMessage` para marcar el hilo como procesado.

## 3. Módulos del Proyecto

-   `main.js`: Orquesta todo el flujo de trabajo.
-   `gmailService.js`: Centraliza la interacción con Gmail. Se encarga de buscar correos **del día**, leer el **primer mensaje** de cada hilo (limitado a 1024 caracteres), crear borradores y aplicar etiquetas.
-   `notionAPI.js`: Gestiona la conexión con Notion para obtener la base de conocimientos de plantillas. Es compatible con la versión de API de Notion `2025-09-03`.
-   `geminiResponseService.js`: Se comunica con la API de Google Gemini para realizar la selección inteligente de la respuesta.
-   `personalizer.js`: Contiene la lógica para personalizar las plantillas.
-   `classifier.js`: Define las posibles categorías de un correo.
-   `appsscript.json`: Manifiesto del proyecto que define los permisos necesarios.

## 4. Configuración y Uso

Para que el proyecto funcione, necesitas realizar una configuración única:

1.  **Abre el Editor de Apps Script**.
2.  Ve a **Configuración del proyecto (⚙️) > Propiedades del script**.
3.  Haz clic en **"Editar propiedades del script"** y añade las siguientes **tres** propiedades:
    -   `NOTION_API_KEY`: Tu clave secreta de la integración de Notion.
    -   `MASTER_DATABASE_ID`: El ID de tu base de datos "maestra" de Notion.
    -   `GEMINI_API_KEY`: Tu clave de API para el servicio de Google Gemini.
4.  Guarda las propiedades.

Una vez configurado, puedes ejecutar la función `createDraftReplies` manualmente desde el editor para procesar los correos pendientes.

## 5. Siguientes Pasos (Recomendaciones)

-   **Automatización con Triggers**: Configura un activador (trigger) basado en tiempo para que la función `createDraftReplies` se ejecute automáticamente cada 10-15 minutos.
-   **Mejorar Personalización**: Ampliar la lógica en `personalizer.js` para extraer más datos del correo (IDs de pedido, fechas, etc.) usando expresiones regulares más avanzadas o una segunda llamada a la IA.
-   **Interfaz de Supervisión**: Crear una interfaz de usuario (como un menú en una Hoja de Google) que permita a un agente revisar los borradores generados o ver un log de las acciones.
-   **Manejo de Errores Avanzado**: Implementar notificaciones por correo que alerten si la API de Notion o Gemini falla repetidamente.