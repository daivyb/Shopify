# Guía para Conectar Google Apps Script a la API de Notion

Este documento proporciona una guía y mejores prácticas para conectar un proyecto de Google Apps Script (GAS) a una base de datos de Notion (full page).

---

## 1. Prerrequisitos

Antes de escribir código, necesitas obtener tres cosas de Notion:

1.  **Token de Integración (API Key)**:
    *   Ve a [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations).
    *   Crea una "New integration". Dale un nombre y asóciala a tu workspace.
    *   En la pestaña "Secrets", copia el token de "Internal Integration Token". Se ve así: `secret_...`.

2.  **Dar Acceso a la Base de Datos**:
    *   Ve a tu base de datos en Notion.
    *   Haz clic en el menú de tres puntos (`...`) en la esquina superior derecha.
    *   Selecciona "Add connections" y busca el nombre de la integración que acabas de crear.
    *   Confirma para darle permisos.

3.  **ID de la Base de Datos**:
    *   Abre tu base de datos en el navegador.
    *   La URL será: `https://www.notion.so/workspace-name/DATABASE_ID?v=view_id`.
    *   El `DATABASE_ID` es la cadena de 32 caracteres alfanuméricos. Cópiala.

---

## 2. Mejores Prácticas en Google Apps Script

### a. No Hardcodear la API Key

**Nunca** pegues la API Key directamente en el código que procesa datos. Es un riesgo de seguridad.

**Solución**: Usa `PropertiesService` de GAS para almacenar la clave de forma segura. Crea una función de setup que se ejecute una sola vez.

```javascript
// En un archivo como Config.gs

// ¡EJECUTAR ESTA FUNCIÓN UNA SOLA VEZ MANUALMENTE!
function saveApiKey() {
  const notionApiKey = 'PEGA_AQUÍ_TU_API_KEY';
  PropertiesService.getScriptProperties().setProperty('NOTION_API_KEY', notionApiKey);
  Logger.log('¡Clave de API de Notion guardada de forma segura!');
}
```

### b. Estructura del Código Modular

No pongas todo el código en un solo archivo. Organízalo para que sea más fácil de mantener.

*   **`Config.gs`**: Para constantes (como el `DATABASE_ID`) y funciones de setup (`saveApiKey`).
*   **`NotionApiService.gs`**: Para encapsular toda la lógica de comunicación con la API de Notion.
*   **`Main.gs`**: Para orquestar las llamadas y procesar los datos recibidos.

### c. Realizar la Petición a la API

Usa el servicio `UrlFetchApp` de GAS.

*   **Endpoint**: `https://api.notion.com/v1/databases/{DATABASE_ID}/query`
*   **Método**: Siempre `POST`, incluso para leer datos.
*   **Headers Obligatorios**:
    *   `Authorization`: `'Bearer ' + TU_API_KEY`
    *   `Notion-Version`: `'2022-06-28'` (o una versión más reciente).
*   **Payload**: Un objeto JSON. Para obtener todas las filas, envía un payload vacío: `JSON.stringify({})`.

---

## 3. Manejar la Respuesta de la API (Lo más importante)

El tipo de columna lo es todo. La API devuelve una estructura JSON diferente para cada tipo. El código debe estar preparado para navegar la estructura correcta.

Los datos de las filas siempre estarán en el array `jsonResponse.results`.

Aquí un "cheat sheet" para leer los tipos de columna más comunes:

```javascript
// Dentro de un bucle como: results.forEach(page => { ... });

// 1. Title (El nombre de la página)
const name = page.properties['Task name'].title[0].plain_text;

// 2. Rich Text (Texto)
const description = page.properties['Description'].rich_text[0].plain_text;

// 3. Number
const amount = page.properties['Amount'].number;

// 4. Select (Una sola opción)
const priority = page.properties['Priority'].select.name;

// 5. Status
const status = page.properties['Status'].status.name;

// 6. Date
const dueDate = page.properties['Due Date'].date.start; // o .end

// 7. Person (Asignado)
// Es un array, puede haber varias personas.
const assignees = page.properties['Assignee'].people.map(person => person.name).join(', ');

// 8. Multi-select
// También es un array.
const tags = page.properties['Tags'].multi_select.map(option => option.name);

// ¡Importante! Siempre verifica que la propiedad y sus hijos existan antes de acceder a ellos.
// if (page.properties['Task name'] && page.properties['Task name'].title.length > 0) { ... }
```

---

## 4. Consideraciones Adicionales

*   **Paginación**: La API de Notion devuelve un máximo de 100 resultados por petición. Si tu base de datos tiene más de 100 filas, la respuesta incluirá una propiedad `next_cursor`. Debes enviar este cursor en tu siguiente petición (en el payload) para obtener la siguiente página de resultados. Tu `ApiService` debería manejar esto en un bucle si esperas tener muchos datos.
*   **Límites de Tasa (Rate Limits)**: La API tiene un límite de peticiones (promedio de 3 por segundo). Para scripts que hagan muchas operaciones, considera agregar un pequeño `Utilities.sleep(350)` entre peticiones para no exceder el límite.
*   **Documentación Oficial**: Es tu mejor amiga. Consúltala siempre: [https://developers.notion.com/reference/intro](https://developers.notion.com/reference/intro)
