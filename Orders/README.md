# Gestor de Órdenes de Shopify

## Descripción General

Este proyecto de Google Apps Script automatiza la sincronización de órdenes de Shopify con una hoja de cálculo de Google Sheets. Su objetivo es proporcionar al equipo de "Algae Cooking Club" un informe completo y actualizado de las órdenes para el seguimiento y análisis diario.

El sistema opera a través de dos funciones distintas, diseñadas para ejecutarse en diferentes momentos del día:

1.  **Creación de Nuevas Órdenes (`writeOrdersToSheet`):** Una función que se ejecuta para buscar y agregar todas las nuevas órdenes que se han generado en Shopify desde la última vez, ideal para ejecutarse al inicio del día.
2.  **Actualización de Órdenes Existentes (`updateOrdersByUpdatedAt`):** Una segunda función que revisa todas las órdenes ya presentes en la hoja de cálculo y las actualiza si han sufrido cambios en Shopify, perfecta para ejecutarse al final del día y registrar las modificaciones.

Esta separación asegura que la hoja de cálculo no solo crezca con nuevas órdenes, sino que también refleje el estado más reciente de las órdenes existentes.

## Características

- **Sincronización Dual:** Funciones separadas para la creación de nuevas órdenes y la actualización de las existentes.
- **Obtención Eficiente de Datos:** Utiliza un sistema de cursor para obtener solo las órdenes nuevas o actualizadas, optimizando las llamadas a la API de Shopify.
- **Importación a Google Sheets:** Inserta y actualiza los datos de las órdenes en una hoja de cálculo designada.
- **Gestión de Estado:** Guarda un cursor para no procesar las mismas órdenes nuevas dos veces y compara la fecha de `updatedAt` para actualizar las existentes.

## ¿Cómo funciona?

El proceso está dividido en dos flujos de trabajo principales:

### 1. Creación de Nuevas Órdenes (Función: `writeOrdersToSheet`)

1.  Recupera el cursor de la última orden nueva agregada.
2.  Realiza una llamada a la API de Shopify para obtener todas las órdenes creadas después de ese cursor.
3.  Procesa los datos de cada nueva orden.
4.  **Agrega** las nuevas órdenes como filas al final de la hoja de cálculo.
5.  Guarda el cursor de la última orden agregada para la próxima ejecución.

### 2. Actualización de Órdenes Existentes (Función: `updateOrdersByUpdatedAt`)

1.  Lee todas las órdenes existentes de la hoja de cálculo y mapea sus IDs y fechas de última actualización (`updatedAt`).
2.  Realiza una llamada a la API de Shopify para obtener las órdenes que han sido actualizadas recientemente.
3.  Compara cada orden de Shopify con la versión que está en la hoja.
4.  Si la versión de Shopify es más reciente, **sobrescribe** las filas correspondientes en la hoja de cálculo con los datos actualizados.

## Descripción de los Archivos

-   **`appsscript.json`**: Archivo de manifiesto del proyecto.
-   **`.clasp.json`**: Archivo de configuración para `clasp`.
-   **`importSheet.js`**: Contiene la función `writeOrdersToSheet` para **crear** nuevas órdenes en la hoja de cálculo.
-   **`updateRecentOrders.js`**: Contiene la función `updateOrdersByUpdatedAt` para **actualizar** las órdenes existentes en la hoja.
-   **`getFetchOrders.js`**: Lógica para realizar las llamadas a la API de Shopify y obtener las órdenes.
-   **`processOrders.js`**: Transforma los datos de las órdenes devueltos por la API al formato de la hoja de cálculo.
-   **`cursorProperties.js`**: Gestiona la lectura y escritura del cursor para la creación de nuevas órdenes.
-   **`getPropertiesService.js`**: Servicio para gestionar el acceso a las propiedades del script (claves de API, etc.).

## Configuración

1.  **Clonar el Repositorio**.
2.  **Subir a Google Apps Script** usando `clasp`.
3.  **Configurar Propiedades del Script**:
    -   En **Configuración del proyecto > Propiedades del secuencia de comandos**, agrega: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_HOSTNAME` y el `SHEET_ID` de la hoja de cálculo.
    -   Opcionalmente, establece un `endCursor` inicial para la primera ejecución de `writeOrdersToSheet`.
4.  **Permisos**: Ejecuta ambas funciones (`writeOrdersToSheet` y `updateOrdersByUpdatedAt`) manualmente una vez para autorizar los permisos.

## Uso

Para ejecutar el script, puedes configurar disparadores (triggers) basados en tiempo:

-   **Para agregar nuevas órdenes**: Ejecuta la función `writeOrdersToSheet` (por ejemplo, diariamente a primera hora de la mañana).
-   **Para actualizar órdenes existentes**: Ejecuta la función `updateOrdersByUpdatedAt` (por ejemplo, diariamente al final de la jornada laboral).

También pueden ejecutarse manualmente desde el editor de Google Apps Script según sea necesario.